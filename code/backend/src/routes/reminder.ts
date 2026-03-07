import { Router, type Request, type Response } from 'express'
import { param, body, query } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type { ApiResponse } from '../types/index.js'
import prisma from '../lib/prisma.js'
import { getUserIdFromRequest } from './auth.js'

const router = Router()

// ==================== Helper Functions ====================

/**
 * 格式化提醒时间
 */
function formatReminderTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * 检查提醒是否需要触发
 */
function shouldTriggerReminder(reminder: {
  scheduledAt: Date
  status: string
}): boolean {
  if (reminder.status !== 'pending') {
    return false
  }

  const now = new Date()
  const scheduled = new Date(reminder.scheduledAt)

  // 如果提醒时间已过但在同一天，仍可触发
  if (scheduled <= now) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const scheduledDay = new Date(scheduled.getFullYear(), scheduled.getMonth(), scheduled.getDate())
    return today.getTime() === scheduledDay.getTime()
  }

  return false
}

// ==================== P5.3.1: 设置学习提醒 ====================

router.post('/reminders', [
  body('type')
    .isIn(['study_time', 'review', 'exam', 'goal'])
    .withMessage('提醒类型必须是 study_time, review, exam 或 goal'),
  body('title')
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度必须在1-100个字符之间'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('消息内容最长500个字符'),
  body('scheduledAt')
    .isISO8601()
    .withMessage('提醒时间必须是有效的日期时间'),
  body('recurring')
    .optional()
    .isObject()
    .withMessage('重复设置必须是对象'),
  body('recurring.enabled')
    .optional()
    .isBoolean()
    .withMessage('enabled必须是布尔值'),
  body('recurring.pattern')
    .optional()
    .isIn(['daily', 'weekly', 'weekdays'])
    .withMessage('pattern必须是 daily, weekly 或 weekdays'),
  body('recurring.daysOfWeek')
    .optional()
    .isArray()
    .withMessage('daysOfWeek必须是数组'),
  body('courseId')
    .optional()
    .isUUID()
    .withMessage('课程ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法创建提醒',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const { type, title, message, scheduledAt, recurring, courseId } = req.body

    // 验证提醒时间
    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        success: false,
        error: '提醒时间必须是未来时间',
        code: 'INVALID_SCHEDULED_TIME'
      } as ApiResponse<undefined>)
    }

    // 如果指定了课程，验证课程是否存在
    if (courseId) {
      const course = await prisma.course.findUnique({
        where: { id: courseId }
      })

      if (!course) {
        return res.status(404).json({
          success: false,
          error: '课程不存在',
          code: 'COURSE_NOT_FOUND'
        } as ApiResponse<undefined>)
      }
    }

    // 创建提醒
    const reminder = await prisma.reminder.create({
      data: {
        userId,
        courseId: courseId || null,
        type,
        title,
        message: message || null,
        scheduledAt: scheduledDate,
        recurring: recurring ? JSON.stringify(recurring) : null,
        status: 'pending'
      }
    })

    res.status(201).json({
      success: true,
      data: {
        id: reminder.id,
        type: reminder.type,
        title: reminder.title,
        message: reminder.message,
        scheduledAt: reminder.scheduledAt,
        recurring: reminder.recurring ? JSON.parse(reminder.recurring) : null,
        status: reminder.status,
        createdAt: reminder.createdAt
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error creating reminder:', error)
    res.status(500).json({
      success: false,
      error: '创建提醒失败',
      code: 'CREATE_REMINDER_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.3.2: 获取提醒列表 ====================

router.get('/reminders', [
  query('status')
    .optional()
    .isIn(['pending', 'completed', 'cancelled'])
    .withMessage('状态必须是 pending, completed 或 cancelled'),
  query('type')
    .optional()
    .isIn(['study_time', 'review', 'exam', 'goal'])
    .withMessage('类型必须是 study_time, review, exam 或 goal'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .toInt(),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 50 })
    .toInt(),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法获取提醒',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const status = req.query.status as string | undefined
    const type = req.query.type as string | undefined
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const skip = (page - 1) * pageSize

    // 构建查询条件
    const where: any = { userId }
    if (status) where.status = status
    if (type) where.type = type

    // 获取提醒列表和总数
    const [reminders, total] = await Promise.all([
      prisma.reminder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { scheduledAt: 'asc' }
      }),
      prisma.reminder.count({ where })
    ])

    // 格式化返回数据
    const formattedReminders = reminders.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      scheduledAt: r.scheduledAt,
      scheduledTime: formatReminderTime(new Date(r.scheduledAt)),
      recurring: r.recurring ? JSON.parse(r.recurring) : null,
      status: r.status,
      completedAt: r.completedAt,
      createdAt: r.createdAt
    }))

    res.json({
      success: true,
      data: {
        reminders: formattedReminders,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting reminders:', error)
    res.status(500).json({
      success: false,
      error: '获取提醒列表失败',
      code: 'GET_REMINDERS_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.3.3: 获取今日提醒 ====================

router.get('/reminders/today', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法获取提醒',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 获取今天的提醒
    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        scheduledAt: {
          gte: today,
          lt: tomorrow
        },
        status: 'pending'
      },
      orderBy: { scheduledAt: 'asc' }
    })

    // 格式化返回数据
    const formattedReminders = reminders.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      message: r.message,
      scheduledAt: r.scheduledAt,
      scheduledTime: formatReminderTime(new Date(r.scheduledAt)),
      recurring: r.recurring ? JSON.parse(r.recurring) : null,
      status: r.status
    }))

    // 计算今日统计
    const stats = {
      total: reminders.length,
      studyTime: reminders.filter(r => r.type === 'study_time').length,
      review: reminders.filter(r => r.type === 'review').length,
      exam: reminders.filter(r => r.type === 'exam').length,
      goal: reminders.filter(r => r.type === 'goal').length
    }

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        reminders: formattedReminders,
        statistics: stats
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting today reminders:', error)
    res.status(500).json({
      success: false,
      error: '获取今日提醒失败',
      code: 'GET_TODAY_REMINDERS_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.3.4: 获取单个提醒 ====================

router.get('/reminders/:id', [
  param('id').isUUID().withMessage('提醒ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法获取提醒',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const reminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!reminder) {
      return res.status(404).json({
        success: false,
        error: '提醒不存在',
        code: 'REMINDER_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    res.json({
      success: true,
      data: {
        id: reminder.id,
        type: reminder.type,
        title: reminder.title,
        message: reminder.message,
        scheduledAt: reminder.scheduledAt,
        scheduledTime: formatReminderTime(new Date(reminder.scheduledAt)),
        recurring: reminder.recurring ? JSON.parse(reminder.recurring) : null,
        status: reminder.status,
        completedAt: reminder.completedAt,
        createdAt: reminder.createdAt
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting reminder:', error)
    res.status(500).json({
      success: false,
      error: '获取提醒失败',
      code: 'GET_REMINDER_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.3.5: 更新提醒 ====================

router.put('/reminders/:id', [
  param('id').isUUID().withMessage('提醒ID必须是有效的UUID'),
  body('title')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('标题长度必须在1-100个字符之间'),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('消息内容最长500个字符'),
  body('scheduledAt')
    .optional()
    .isISO8601()
    .withMessage('提醒时间必须是有效的日期时间'),
  body('status')
    .optional()
    .isIn(['pending', 'cancelled'])
    .withMessage('状态必须是 pending 或 cancelled'),
  body('recurring')
    .optional()
    .isObject()
    .withMessage('重复设置必须是对象'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法更新提醒',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    // 检查提醒是否存在
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!existingReminder) {
      return res.status(404).json({
        success: false,
        error: '提醒不存在',
        code: 'REMINDER_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    const { title, message, scheduledAt, status, recurring } = req.body

    // 构建更新数据
    const updateData: any = {}

    if (title !== undefined) updateData.title = title
    if (message !== undefined) updateData.message = message
    if (status !== undefined) updateData.status = status
    if (scheduledAt !== undefined) {
      const scheduledDate = new Date(scheduledAt)
      if (scheduledDate <= new Date()) {
        return res.status(400).json({
          success: false,
          error: '提醒时间必须是未来时间',
          code: 'INVALID_SCHEDULED_TIME'
        } as ApiResponse<undefined>)
      }
      updateData.scheduledAt = scheduledDate
    }
    if (recurring !== undefined) {
      updateData.recurring = JSON.stringify(recurring)
    }

    // 更新提醒
    const reminder = await prisma.reminder.update({
      where: { id },
      data: updateData
    })

    res.json({
      success: true,
      data: {
        id: reminder.id,
        type: reminder.type,
        title: reminder.title,
        message: reminder.message,
        scheduledAt: reminder.scheduledAt,
        scheduledTime: formatReminderTime(new Date(reminder.scheduledAt)),
        recurring: reminder.recurring ? JSON.parse(reminder.recurring) : null,
        status: reminder.status
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error updating reminder:', error)
    res.status(500).json({
      success: false,
      error: '更新提醒失败',
      code: 'UPDATE_REMINDER_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.3.6: 删除提醒 ====================

router.delete('/reminders/:id', [
  param('id').isUUID().withMessage('提醒ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法删除提醒',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    // 检查提醒是否存在
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!existingReminder) {
      return res.status(404).json({
        success: false,
        error: '提醒不存在',
        code: 'REMINDER_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 删除提醒
    await prisma.reminder.delete({
      where: { id }
    })

    res.json({
      success: true,
      data: {
        message: '提醒已删除'
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error deleting reminder:', error)
    res.status(500).json({
      success: false,
      error: '删除提醒失败',
      code: 'DELETE_REMINDER_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.3.7: 标记提醒完成 ====================

router.post('/reminders/:id/complete', [
  param('id').isUUID().withMessage('提醒ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)
    const { id } = req.params

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法完成提醒',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    // 检查提醒是否存在
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id,
        userId
      }
    })

    if (!existingReminder) {
      return res.status(404).json({
        success: false,
        error: '提醒不存在',
        code: 'REMINDER_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    if (existingReminder.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: '该提醒已完成或已取消',
        code: 'REMINDER_ALREADY_COMPLETED'
      } as ApiResponse<undefined>)
    }

    // 标记完成
    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })

    // 如果是周期性提醒，自动创建下一次提醒
    let nextReminderCreated = false
    if (existingReminder.recurring) {
      const recurringConfig = JSON.parse(existingReminder.recurring)

      if (recurringConfig.enabled) {
        const nextDate = new Date(existingReminder.scheduledAt)

        switch (recurringConfig.pattern) {
          case 'daily':
            nextDate.setDate(nextDate.getDate() + 1)
            break
          case 'weekly':
            nextDate.setDate(nextDate.getDate() + 7)
            break
          case 'weekdays':
            do {
              nextDate.setDate(nextDate.getDate() + 1)
            } while (nextDate.getDay() === 0 || nextDate.getDay() === 6)
            break
        }

        // 创建下一次提醒
        await prisma.reminder.create({
          data: {
            userId,
            type: existingReminder.type,
            title: existingReminder.title,
            message: existingReminder.message,
            scheduledAt: nextDate,
            recurring: existingReminder.recurring,
            status: 'pending'
          }
        })
        nextReminderCreated = true
      }
    }

    res.json({
      success: true,
      data: {
        id: reminder.id,
        type: reminder.type,
        title: reminder.title,
        status: reminder.status,
        completedAt: reminder.completedAt,
        message: nextReminderCreated ? '提醒已完成，下一次提醒已自动创建' : '提醒已完成'
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error completing reminder:', error)
    res.status(500).json({
      success: false,
      error: '完成提醒失败',
      code: 'COMPLETE_REMINDER_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.3.8: 批量删除提醒 ====================

router.post('/reminders/batch-delete', [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('ID数组不能为空'),
  body('ids.*')
    .isUUID()
    .withMessage('每个ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法删除提醒',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const { ids } = req.body

    // 批量删除
    const result = await prisma.reminder.deleteMany({
      where: {
        id: { in: ids },
        userId
      }
    })

    res.json({
      success: true,
      data: {
        deleted: result.count,
        requested: ids.length
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error batch deleting reminders:', error)
    res.status(500).json({
      success: false,
      error: '批量删除提醒失败',
      code: 'BATCH_DELETE_FAILED'
    } as ApiResponse<undefined>)
  }
})

export default router
