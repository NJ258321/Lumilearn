/**
 * 定时提醒服务
 * 用于在后台定时检查并触发学习提醒
 */

import prisma from '../lib/prisma.js'

// 定时器实例
let reminderInterval: NodeJS.Timeout | null = null

/**
 * 初始化提醒服务
 * 每分钟检查一次是否有需要触发的提醒
 */
export function initReminderService(): void {
  console.log('[ReminderService] 初始化定时提醒服务...')

  // 每分钟检查一次
  reminderInterval = setInterval(async () => {
    await checkAndTriggerReminders()
  }, 60 * 1000) // 1分钟

  console.log('[ReminderService] 提醒服务已启动，每分钟检查一次')
}

/**
 * 停止提醒服务
 */
export function stopReminderService(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval)
    reminderInterval = null
    console.log('[ReminderService] 提醒服务已停止')
  }
}

/**
 * 检查并触发提醒
 * 查找所有状态为 pending 且时间已到的提醒
 */
async function checkAndTriggerReminders(): Promise<void> {
  try {
    const now = new Date()

    // 查找需要触发的提醒（状态为 pending 且时间已过）
    const pendingReminders = await prisma.reminder.findMany({
      where: {
        status: 'pending',
        scheduledAt: {
          lte: now
        }
      },
      take: 100 // 每次最多处理100条
    })

    if (pendingReminders.length === 0) {
      return
    }

    console.log(`[ReminderService] 发现 ${pendingReminders.length} 条待触发提醒`)

    for (const reminder of pendingReminders) {
      await processReminder(reminder)
    }
  } catch (error) {
    console.error('[ReminderService] 检查提醒失败:', error)
  }
}

/**
 * 处理单个提醒
 */
async function processReminder(reminder: {
  id: string
  userId: string
  type: string
  title: string
  message: string | null
  scheduledAt: Date
  recurring: string | null
}): Promise<void> {
  try {
    console.log(`[ReminderService] 触发提醒: ${reminder.title} (${reminder.type})`)

    // 解析重复设置
    let recurringConfig: { enabled: boolean; pattern?: string; daysOfWeek?: number[] } | null = null
    if (reminder.recurring) {
      try {
        recurringConfig = JSON.parse(reminder.recurring)
      } catch {
        recurringConfig = null
      }
    }

    // 如果是重复提醒，计算下一次提醒时间
    if (recurringConfig?.enabled && recurringConfig.pattern) {
      const nextScheduledAt = calculateNextScheduledTime(
        new Date(reminder.scheduledAt),
        recurringConfig.pattern,
        recurringConfig.daysOfWeek
      )

      if (nextScheduledAt) {
        // 更新为下一次提醒时间
        await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            scheduledAt: nextScheduledAt,
            status: 'pending'
          }
        })
        console.log(`[ReminderService] 提醒 ${reminder.id} 已安排下一次: ${nextScheduledAt.toISOString()}`)
        return
      }
    }

    // 非重复提醒，更新状态为已完成
    await prisma.reminder.update({
      where: { id: reminder.id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    })
    console.log(`[ReminderService] 提醒 ${reminder.id} 已标记为完成`)
  } catch (error) {
    console.error(`[ReminderService] 处理提醒 ${reminder.id} 失败:`, error)
  }
}

/**
 * 计算下一次提醒时间
 */
function calculateNextScheduledTime(
  currentTime: Date,
  pattern: string,
  daysOfWeek?: number[]
): Date | null {
  const next = new Date(currentTime)

  switch (pattern) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break

    case 'weekly':
      next.setDate(next.getDate() + 7)
      break

    case 'weekdays':
      // 只在工作日重复
      do {
        next.setDate(next.getDate() + 1)
      } while (next.getDay() === 0 || next.getDay() === 6) // 0=周日, 6=周六

      // 如果指定了具体工作日
      if (daysOfWeek && daysOfWeek.length > 0) {
        const currentDay = next.getDay()
        if (!daysOfWeek.includes(currentDay)) {
          // 找到下一个在指定日期中的日期
          for (let i = 0; i < 7; i++) {
            const checkDate = new Date(next)
            checkDate.setDate(checkDate.getDate() + i)
            if (daysOfWeek.includes(checkDate.getDay())) {
              return checkDate
            }
          }
        }
      }
      break

    default:
      return null
  }

  // 检查是否超过一年（避免无限循环）
  const oneYearLater = new Date()
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1)

  if (next > oneYearLater) {
    return null
  }

  return next
}

/**
 * 生成每日学习提醒
 * 根据用户设置自动创建每日学习提醒
 */
export async function generateDailyStudyReminder(
  userId: string,
  reminderTime: string = '09:00'
): Promise<void> {
  try {
    const [hours, minutes] = reminderTime.split(':').map(Number)

    // 获取今天指定时间的提醒
    const today = new Date()
    today.setHours(hours, minutes, 0, 0)

    // 如果今天已过，则设置为明天
    if (today <= new Date()) {
      today.setDate(today.getDate() + 1)
    }

    // 检查是否已存在相同的每日提醒
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        userId,
        type: 'study_time',
        title: '每日学习提醒',
        recurring: {
          contains: '"enabled":true'
        }
      }
    })

    if (!existingReminder) {
      await prisma.reminder.create({
        data: {
          userId,
          type: 'study_time',
          title: '每日学习提醒',
          message: '该开始今天的学习了！保持积极的学习态度，你会越来越优秀！',
          scheduledAt: today,
          recurring: JSON.stringify({
            enabled: true,
            pattern: 'daily'
          }),
          status: 'pending'
        }
      })
      console.log(`[ReminderService] 为用户 ${userId} 创建每日学习提醒`)
    }
  } catch (error) {
    console.error('[ReminderService] 生成每日学习提醒失败:', error)
  }
}

/**
 * 根据复习计划生成复习提醒
 */
export async function generateReviewReminders(userId: string): Promise<void> {
  try {
    // 获取今日需要复习的内容
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const reviewPlans = await prisma.reviewPlan.findMany({
      where: {
        userId,
        reviewDate: {
          gte: today,
          lt: tomorrow
        },
        status: 'PENDING'
      },
      include: {
        knowledgePoint: true
      }
    })

    for (const plan of reviewPlans) {
      // 检查是否已有提醒
      const existingReminder = await prisma.reminder.findFirst({
        where: {
          userId,
          type: 'review',
          knowledgePointId: plan.knowledgePointId
        }
      })

      if (!existingReminder) {
        const scheduledAt = new Date(plan.reviewDate)
        scheduledAt.setHours(20, 0, 0, 0) // 默认晚上8点提醒

        await prisma.reminder.create({
          data: {
            userId,
            type: 'review',
            title: `复习: ${plan.knowledgePoint.name}`,
            message: `根据艾宾浩斯遗忘曲线，现在正是复习 ${plan.knowledgePoint.name} 的最佳时机！`,
            scheduledAt,
            status: 'pending'
          }
        })
      }
    }
  } catch (error) {
    console.error('[ReminderService] 生成复习提醒失败:', error)
  }
}

/**
 * 清理过期的提醒
 * 删除已完成的非重复提醒
 */
export async function cleanupExpiredReminders(): Promise<void> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const result = await prisma.reminder.deleteMany({
      where: {
        status: 'completed',
        completedAt: {
          lt: thirtyDaysAgo
        }
      }
    })

    if (result.count > 0) {
      console.log(`[ReminderService] 已清理 ${result.count} 条过期提醒`)
    }
  } catch (error) {
    console.error('[ReminderService] 清理过期提醒失败:', error)
  }
}
