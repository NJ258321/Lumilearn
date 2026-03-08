import { Router, type Request, type Response } from 'express'
import { param, body } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type { ApiResponse } from '../types/index.js'
import prisma from '../lib/prisma.js'
import { getUserIdFromRequest } from './auth.js'

const router = Router()

// 艾宾浩斯遗忘曲线复习间隔（天）
const EBINGHAUS_INTERVALS = [1, 3, 7, 14, 30]

// ==================== POST /api/review/generate-plan - 生成复习计划 ====================

router.post('/review/generate-plan', [
  body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
  body('days').optional().isInt({ min: 7, max: 90 }).withMessage('计划天数必须是7-90的整数'),
  body('dailyReviewTime').optional().isInt({ min: 15, max: 240 }).withMessage('每日复习时间必须是15-240的整数'),
  body('focusAreas').optional().isArray(),
  body('includeNewKnowledge').optional().isBoolean(),
  validate
], async (req: Request, res: Response) => {
  try {
    const {
      courseId,
      days = 30,
      dailyReviewTime = 60,
      focusAreas = ['weak_points'],
      includeNewKnowledge = true
    } = req.body

    // 获取课程信息
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            knowledgePoints: true
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: '课程不存在',
        code: 'COURSE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 获取该课程所有知识点及其复习历史
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: {
        chapter: { courseId }
      },
      select: {
        id: true,
        name: true,
        status: true,
        masteryScore: true,
        updatedAt: true,
        importance: true
      }
    })

    if (knowledgePoints.length === 0) {
      return res.status(400).json({
        success: false,
        error: '该课程没有知识点',
        code: 'NO_KNOWLEDGE_POINTS'
      } as ApiResponse<undefined>)
    }

    // 根据 focusAreas 筛选需要复习的知识点
    let reviewCandidates: typeof knowledgePoints = []

    if (focusAreas.includes('weak_points')) {
      const weakPoints = knowledgePoints.filter(kp => kp.status === 'WEAK' || kp.masteryScore < 50)
      reviewCandidates = [...reviewCandidates, ...weakPoints]
    }

    if (focusAreas.includes('high_frequency')) {
      const highFreqPoints = knowledgePoints.filter(kp => kp.importance >= 8)
      reviewCandidates = [...reviewCandidates, ...highFreqPoints]
    }

    if (focusAreas.includes('not_mastered')) {
      const notMastered = knowledgePoints.filter(kp => kp.status !== 'MASTERED')
      reviewCandidates = [...reviewCandidates, ...notMastered]
    }

    // 去重
    const uniqueCandidates = reviewCandidates.filter((kp, index, self) =>
      index === self.findIndex(t => t.id === kp.id)
    )

    // 生成每日复习计划
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)

    const dailyPlan: Array<{
      date: string
      items: Array<{
        type: string
        knowledgePointId: string
        knowledgePointName: string
        reason: string
        priority: string
        estimatedTime: number
        masteryScore: number
      }>
      totalTime: number
    }> = []

    // 为每个知识点生成复习日期
    const reviewSchedule = new Map<string, Date[]>()

    for (const kp of uniqueCandidates) {
      const intervals: Date[] = []
      const lastStudied = kp.updatedAt ? new Date(kp.updatedAt) : new Date()

      for (const interval of EBINGHAUS_INTERVALS) {
        const reviewDate = new Date(lastStudied)
        reviewDate.setDate(reviewDate.getDate() + interval)

        // 只包含在计划天数内的复习日期
        const maxDate = new Date(startDate)
        maxDate.setDate(maxDate.getDate() + days)

        if (reviewDate <= maxDate) {
          intervals.push(reviewDate)
        }
      }

      if (intervals.length > 0) {
        reviewSchedule.set(kp.id, intervals)
      }
    }

    // 添加新知识学习（如果启用）
    if (includeNewKnowledge) {
      const newPoints = knowledgePoints.filter(kp =>
        kp.status === 'NEED_REVIEW' || kp.status === 'NOT_STARTED'
      )

      // 均匀分配新知识到每天
      let dayIndex = 0
      for (const kp of newPoints) {
        const studyDate = new Date(startDate)
        studyDate.setDate(studyDate.getDate() + (dayIndex % days))

        const existing = reviewSchedule.get(kp.id) || []
        existing.push(studyDate)
        reviewSchedule.set(kp.id, existing)

        dayIndex++
      }
    }

    // 生成每日计划
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + i)
      const dateStr = currentDate.toISOString().split('T')[0]

      const dayItems: Array<{
        type: string
        knowledgePointId: string
        knowledgePointName: string
        reason: string
        priority: string
        estimatedTime: number
        masteryScore: number
      }> = []

      let totalTime = 0

      for (const kp of uniqueCandidates) {
        const intervals = reviewSchedule.get(kp.id) || []
        const reviewDate = intervals.find(d => d.toISOString().split('T')[0] === dateStr)

        if (reviewDate) {
          // 计算优先级
          let priority: string
          if (kp.masteryScore < 30 || kp.status === 'WEAK') {
            priority = 'high'
          } else if (kp.masteryScore < 60) {
            priority = 'medium'
          } else {
            priority = 'low'
          }

          // 计算复习原因
          const daysSinceLastStudy = Math.floor(
            (currentDate.getTime() - new Date(kp.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
          )
          const reviewIndex = EBINGHAUS_INTERVALS.findIndex(
            interval => Math.abs(interval - daysSinceLastStudy) <= 1
          )

          let reason: string
          if (reviewIndex === 0) {
            reason = '首次复习'
          } else if (reviewIndex > 0) {
            reason = `第${reviewIndex + 1}次复习（艾宾浩斯曲线）`
          } else {
            reason = `上次学习已过${daysSinceLastStudy}天`
          }

          // 估算时间（新知识30分钟，复习15分钟）
          const estimatedTime = kp.status === 'NEED_REVIEW' ? 30 : 15

          dayItems.push({
            type: kp.status === 'NEED_REVIEW' ? 'new' : 'review',
            knowledgePointId: kp.id,
            knowledgePointName: kp.name,
            reason,
            priority,
            estimatedTime,
            masteryScore: kp.masteryScore
          })

          totalTime += estimatedTime
        }
      }

      // 按优先级排序
      dayItems.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority as keyof typeof priorityOrder] -
          priorityOrder[b.priority as keyof typeof priorityOrder]
      })

      dailyPlan.push({
        date: dateStr,
        items: dayItems,
        totalTime
      })
    }

    // 计算统计
    const totalReviewItems = Array.from(reviewSchedule.values()).flat().length

    res.json({
      success: true,
      data: {
        courseId: course.id,
        courseName: course.name,
        planStartDate: startDate.toISOString().split('T')[0],
        planEndDate: new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        totalReviewItems,
        estimatedDailyTime: Math.round(totalReviewItems / days),
        dailyPlan,
        reviewStrategy: {
          method: '艾宾浩斯遗忘曲线',
          intervals: EBINGHAUS_INTERVALS,
          description: '根据遗忘曲线，在学习后的第1、3、7、14、30天进行复习'
        }
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error generating review plan:', error)
    res.status(500).json({
      success: false,
      error: '生成复习计划失败',
      code: 'GENERATE_PLAN_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/review/today - 获取今日复习任务 ====================

router.get('/review/today', async (_req: Request, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 获取需要复习的知识点
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: {
        updatedAt: {
          gte: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        id: true,
        name: true,
        masteryScore: true,
        status: true,
        updatedAt: true,
        importance: true,
        chapter: {
          select: {
            course: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    // 筛选今天需要复习的
    const todayItems: Array<{
      id: string
      knowledgePointId: string
      knowledgePointName: string
      courseName: string
      type: 'review' | 'new'
      reviewCount: number
      reason: string
      estimatedTime: number
      masteryScore: number
    }> = []

    let totalTime = 0

    for (const kp of knowledgePoints) {
      const daysSinceLastStudy = Math.floor(
        (today.getTime() - new Date(kp.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )

      // 判断是否需要今天复习
      const needsReview = EBINGHAUS_INTERVALS.some(interval =>
        Math.abs(interval - daysSinceLastStudy) <= 1
      ) || kp.status === 'NEED_REVIEW' || kp.status === 'WEAK'

      if (needsReview) {
        // 计算是第几次复习
        let reviewCount = 1
        for (let i = 0; i < EBINGHAUS_INTERVALS.length; i++) {
          if (daysSinceLastStudy >= EBINGHAUS_INTERVALS[i]) {
            reviewCount = i + 2
          }
        }

        // 生成原因
        let reason: string
        if (kp.status === 'NEED_REVIEW') {
          reason = '需要学习的新知识'
        } else if (kp.status === 'WEAK') {
          reason = '薄弱知识点，需要加强复习'
        } else if (daysSinceLastStudy === 0) {
          reason = '今天刚学习'
        } else {
          reason = `上次学习已过${daysSinceLastStudy}天`
        }

        const estimatedTime = kp.status === 'NEED_REVIEW' ? 30 : 15

        todayItems.push({
          id: `review-${kp.id}-${today.toISOString().split('T')[0]}`,
          knowledgePointId: kp.id,
          knowledgePointName: kp.name,
          courseName: kp.chapter.course.name,
          type: kp.status === 'NEED_REVIEW' ? 'new' : 'review',
          reviewCount,
          reason,
          estimatedTime,
          masteryScore: kp.masteryScore
        })

        totalTime += estimatedTime
      }
    }

    // 按优先级排序
    todayItems.sort((a, b) => {
      if (a.type === 'new' && b.type !== 'new') return -1
      if (a.type !== 'new' && b.type === 'new') return 1
      return b.masteryScore - a.masteryScore
    })

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        totalItems: todayItems.length,
        totalTime,
        items: todayItems
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting today review:', error)
    res.status(500).json({
      success: false,
      error: '获取今日复习任务失败',
      code: 'GET_TODAY_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/review/:knowledgePointId/complete - 记录复习完成 ====================

router.post('/review/:knowledgePointId/complete', [
  param('knowledgePointId').isUUID().withMessage('知识点ID必须是有效的UUID'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('难度必须是 easy/medium/hard'),
  body('timeSpent').optional().isInt({ min: 1 }).withMessage('学习时间必须是正整数'),
  body('notes').optional().isString(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { knowledgePointId } = req.params
    const { difficulty = 'medium', timeSpent, notes } = req.body

    // 检查知识点是否存在
    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id: knowledgePointId }
    })

    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        error: '知识点不存在',
        code: 'KNOWLEDGE_POINT_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 根据复习效果更新掌握度
    let masteryDelta = 0
    switch (difficulty) {
      case 'easy':
        masteryDelta = 15
        break
      case 'medium':
        masteryDelta = 10
        break
      case 'hard':
        masteryDelta = 5
        break
    }

    const newMasteryScore = Math.min(100, knowledgePoint.masteryScore + masteryDelta)

    // 确定新状态
    let newStatus: string
    if (newMasteryScore >= 80) {
      newStatus = 'MASTERED'
    } else if (newMasteryScore >= 50) {
      newStatus = 'LEARNING'
    } else if (newMasteryScore > 0) {
      newStatus = 'WEAK'
    } else {
      newStatus = 'NOT_STARTED'
    }

    // 更新知识点
    const updatedPoint = await prisma.knowledgePoint.update({
      where: { id: knowledgePointId },
      data: {
        masteryScore: newMasteryScore,
        status: newStatus,
        updatedAt: new Date()
      }
    })

    // 计算下次复习日期
    const nextReviewDate = new Date()
    let nextInterval = 1 // 默认1天后

    if (difficulty === 'easy') {
      nextInterval = EBINGHAUS_INTERVALS[Math.min(4, Math.floor(newMasteryScore / 20))]
    } else if (difficulty === 'medium') {
      nextInterval = EBINGHAUS_INTERVALS[Math.min(3, Math.floor(newMasteryScore / 25))]
    } else {
      nextInterval = 1 // 困难则1天后继续
    }

    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval)

    res.json({
      success: true,
      data: {
        knowledgePointId: knowledgePoint.id,
        knowledgePointName: knowledgePoint.name,
        previousMasteryScore: knowledgePoint.masteryScore,
        currentMasteryScore: newMasteryScore,
        status: newStatus,
        masteryDelta,
        difficulty,
        timeSpent,
        nextReviewDate: nextReviewDate.toISOString().split('T')[0],
        nextReviewReason: `根据${difficulty}难度，下一次复习安排在${nextInterval}天后`,
        updatedAt: updatedPoint.updatedAt
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error recording review completion:', error)
    res.status(500).json({
      success: false,
      error: '记录复习完成失败',
      code: 'RECORD_COMPLETE_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/review/statistics - 获取复习统计 ====================

router.get('/review/statistics', async (_req: Request, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    // 获取本周复习的知识点
    const weeklyReviews = await prisma.knowledgePoint.findMany({
      where: {
        updatedAt: {
          gte: weekAgo
        }
      },
      select: {
        id: true,
        name: true,
        masteryScore: true,
        status: true,
        updatedAt: true
      }
    })

    // 计算统计数据
    const totalReviewed = weeklyReviews.length
    const masteredThisWeek = weeklyReviews.filter(kp => kp.status === 'MASTERED').length
    const weakPoints = weeklyReviews.filter(kp => kp.status === 'WEAK' || kp.masteryScore < 50).length

    // 计算平均掌握度提升
    const totalImprovement = weeklyReviews.reduce((sum, kp) => {
      // 这里简化处理，实际应该存储历史记录
      return sum + (kp.masteryScore > 0 ? 5 : 0)
    }, 0)

    // 获取今日复习任务完成情况
    const todayReviews = weeklyReviews.filter(kp =>
      new Date(kp.updatedAt).toISOString().split('T')[0] === today.toISOString().split('T')[0]
    )

    res.json({
      success: true,
      data: {
        period: {
          start: weekAgo.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0]
        },
        statistics: {
          totalReviewedThisWeek: totalReviewed,
          masteredThisWeek,
          weakPointsRemaining: weakPoints,
          averageImprovement: totalReviewed > 0 ? Math.round(totalImprovement / totalReviewed) : 0
        },
        todayProgress: {
          targetItems: 0, // 需要从today接口获取
          completedItems: todayReviews.length,
          completionRate: 0
        },
        upcomingReviews: EBINGHAUS_INTERVALS.map(interval => {
          const reviewDate = new Date(today)
          reviewDate.setDate(reviewDate.getDate() + interval)
          return {
            date: reviewDate.toISOString().split('T')[0],
            interval: `${interval}天后`,
            estimatedItems: Math.ceil(totalReviewed / EBINGHAUS_INTERVALS.length)
          }
        })
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting review statistics:', error)
    res.status(500).json({
      success: false,
      error: '获取复习统计失败',
      code: 'GET_STATISTICS_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/review/course/:courseId - 获取课程复习计划 ====================

router.get('/review/course/:courseId', [
  param('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params

    // 检查课程是否存在
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

    // 获取该课程所有知识点
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: {
        chapter: { courseId }
      },
      select: {
        id: true,
        name: true,
        status: true,
        masteryScore: true,
        updatedAt: true,
        importance: true
      }
    })

    // 按状态分组
    const byStatus = {
      mastered: knowledgePoints.filter(kp => kp.status === 'MASTERED'),
      learning: knowledgePoints.filter(kp => kp.status === 'LEARNING'),
      weak: knowledgePoints.filter(kp => kp.status === 'WEAK'),
      needReview: knowledgePoints.filter(kp => kp.status === 'NEED_REVIEW'),
      notStarted: knowledgePoints.filter(kp => kp.status === 'NOT_STARTED')
    }

    // 计算下次复习
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const upcomingReviews = knowledgePoints
      .filter(kp => kp.updatedAt)
      .map(kp => {
        const daysSince = Math.floor(
          (today.getTime() - new Date(kp.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        )
        const nextInterval = EBINGHAUS_INTERVALS.find(interval => interval > daysSince) || 30
        const nextDate = new Date(today)
        nextDate.setDate(nextDate.getDate() + (nextInterval - daysSince))

        return {
          knowledgePointId: kp.id,
          name: kp.name,
          masteryScore: kp.masteryScore,
          lastReviewed: new Date(kp.updatedAt).toISOString().split('T')[0],
          nextReviewDate: nextDate.toISOString().split('T')[0],
          daysUntilNextReview: nextInterval - daysSince,
          priority: kp.status === 'WEAK' || kp.masteryScore < 30 ? 'high' : 'medium'
        }
      })
      .filter(kp => kp.daysUntilNextReview <= 7)
      .sort((a, b) => a.daysUntilNextReview - b.daysUntilNextReview)

    res.json({
      success: true,
      data: {
        courseId: course.id,
        courseName: course.name,
        totalKnowledgePoints: knowledgePoints.length,
        statusSummary: {
          mastered: byStatus.mastered.length,
          learning: byStatus.learning.length,
          weak: byStatus.weak.length,
          needReview: byStatus.needReview.length,
          notStarted: byStatus.notStarted.length
        },
        upcomingReviewsThisWeek: upcomingReviews,
        reviewPriority: {
          high: upcomingReviews.filter(r => r.priority === 'high').length,
          medium: upcomingReviews.filter(r => r.priority === 'medium').length
        }
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting course review:', error)
    res.status(500).json({
      success: false,
      error: '获取课程复习计划失败',
      code: 'GET_COURSE_REVIEW_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== PUT /api/review/replan - 任务重排 ====================

/**
 * 任务重排 API
 * 动态调整复习计划，当用户未完成某日任务时，自动将任务重新分配到后续日期
 */
router.put('/review/replan', [
  body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
  body('completedTaskIds').optional().isArray().withMessage('已完成任务ID列表必须是数组'),
  body('skipTaskIds').optional().isArray().withMessage('跳过的任务ID列表必须是数组'),
  body('remainingDays').optional().isInt({ min: 1, max: 90 }).withMessage('剩余天数必须是1-90的整数'),
  body('currentDay').optional().isInt({ min: 1 }).withMessage('当前天数必须是正整数'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const {
      courseId,
      completedTaskIds = [],
      skipTaskIds = [],
      remainingDays = 7,
      currentDay = 1
    } = req.body

    // 验证课程存在
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          include: {
            knowledgePoints: true
          }
        }
      }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: '课程不存在',
        code: 'COURSE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 获取该课程所有知识点
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: {
        chapter: { courseId }
      },
      select: {
        id: true,
        name: true,
        status: true,
        masteryScore: true,
        importance: true,
        updatedAt: true
      }
    })

    // 合并已完成和跳过的任务ID
    const processedTaskIds = [...completedTaskIds, ...skipTaskIds]

    // 筛选出未完成的任务
    const pendingKnowledgePoints = knowledgePoints.filter(kp => {
      const taskId = `review-${kp.id}`
      return !processedTaskIds.includes(taskId) && !processedTaskIds.includes(kp.id)
    })

    // 生成重新分配的计划
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)

    const replannedPlan: Array<{
      date: string
      items: Array<{
        knowledgePointId: string
        knowledgePointName: string
        reason: string
        priority: string
        estimatedTime: number
        originalDate?: string
      }>
      totalTime: number
    }> = []

    // 将未完成任务均匀分配到剩余天数
    const itemsPerDay = Math.ceil(pendingKnowledgePoints.length / remainingDays)
    let itemIndex = 0

    for (let day = 0; day < remainingDays; day++) {
      const currentDate = new Date(startDate)
      currentDate.setDate(currentDate.getDate() + day)
      const dateStr = currentDate.toISOString().split('T')[0]

      const dayItems: Array<{
        knowledgePointId: string
        knowledgePointName: string
        reason: string
        priority: string
        estimatedTime: number
      }> = []

      let totalTime = 0

      for (let i = 0; i < itemsPerDay && itemIndex < pendingKnowledgePoints.length; i++) {
        const kp = pendingKnowledgePoints[itemIndex]
        itemIndex++

        // 计算优先级
        let priority: string
        if (kp.masteryScore < 30 || kp.status === 'WEAK') {
          priority = 'high'
        } else if (kp.masteryScore < 60) {
          priority = 'medium'
        } else {
          priority = 'low'
        }

        // 生成重排原因
        let reason: string
        if (skipTaskIds.includes(kp.id)) {
          reason = '之前跳过，现重新安排'
        } else if (day > 0) {
          reason = '从之前的日期顺延'
        } else {
          reason = '未完成，继续学习'
        }

        const estimatedTime = kp.status === 'NEED_REVIEW' || kp.status === 'NOT_STARTED' ? 30 : 15

        dayItems.push({
          knowledgePointId: kp.id,
          knowledgePointName: kp.name,
          reason,
          priority,
          estimatedTime
        })

        totalTime += estimatedTime
      }

      // 按优先级排序
      dayItems.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return priorityOrder[a.priority as keyof typeof priorityOrder] -
          priorityOrder[b.priority as keyof typeof priorityOrder]
      })

      if (dayItems.length > 0 || day < 7) {
        replannedPlan.push({
          date: dateStr,
          items: dayItems,
          totalTime
        })
      }
    }

    res.json({
      success: true,
      data: {
        courseId: course.id,
        courseName: course.name,
        originalTotalTasks: knowledgePoints.length,
        completedTasks: completedTaskIds.length,
        skippedTasks: skipTaskIds.length,
        pendingTasks: pendingKnowledgePoints.length,
        replannedDays: remainingDays,
        replannedPlan,
        summary: {
          movedTasks: pendingKnowledgePoints.length,
          removedTasks: skipTaskIds.length,
          message: `已将${pendingKnowledgePoints.length}个未完成任务重新分配到${remainingDays}天`
        }
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error replanning review:', error)
    res.status(500).json({
      success: false,
      error: '任务重排失败',
      code: 'REPLAN_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/review/optimize - 多学科统筹优化 ====================

/**
 * 多学科统筹优化 API
 * 多课程同时备考时，智能分配每日学习时间
 */
router.post('/review/optimize', [
  body('courseIds').isArray({ min: 1 }).withMessage('课程ID列表不能为空'),
  body('dailyStudyHours').optional().isFloat({ min: 0.5, max: 12 }).withMessage('每日学习时长必须是0.5-12的小时数'),
  body('preferences').optional().isObject(),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const {
      courseIds,
      dailyStudyHours = 3,
      preferences = {}
    } = req.body

    // 验证所有课程存在
    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds }
      },
      include: {
        chapters: {
          include: {
            knowledgePoints: true
          }
        }
      }
    })

    if (courses.length !== courseIds.length) {
      return res.status(404).json({
        success: false,
        error: '部分课程不存在',
        code: 'COURSE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 计算每个课程的参数
    const courseAnalysis = courses.map(course => {
      const totalKnowledgePoints = course.chapters.reduce((sum, ch) => sum + ch.knowledgePoints.length, 0)

      // 计算薄弱知识点数量
      const weakPoints = course.chapters
        .flatMap(ch => ch.knowledgePoints)
        .filter(kp => kp.status === 'WEAK' || kp.masteryScore < 50).length

      // 计算未掌握知识点
      const notMastered = course.chapters
        .flatMap(ch => ch.knowledgePoints)
        .filter(kp => kp.status !== 'MASTERED').length

      // 获取考试日期（如果有）
      const examDate = course.examDate ? new Date(course.examDate) : null
      const daysUntilExam = examDate
        ? Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 30 // 默认30天

      return {
        courseId: course.id,
        courseName: course.name,
        totalKnowledgePoints,
        weakPoints,
        notMastered,
        examDate: course.examDate,
        daysUntilExam,
        priority: daysUntilExam <= 14 ? 'high' : daysUntilExam <= 30 ? 'medium' : 'low'
      }
    })

    // 计算紧迫度分数
    const urgencyScores = courseAnalysis.map(c => {
      const weakRatio = c.weakPoints / Math.max(c.totalKnowledgePoints, 1)
      const notMasteredRatio = c.notMastered / Math.max(c.totalKnowledgePoints, 1)
      const timePressure = 30 / Math.max(c.daysUntilExam, 1)

      return {
        courseId: c.courseId,
        urgencyScore: weakRatio * 30 + notMasteredRatio * 20 + timePressure * 25,
        weakRatio,
        timePressure
      }
    })

    // 计算总紧迫度
    const totalUrgency = urgencyScores.reduce((sum, c) => sum + c.urgencyScore, 0)

    // 分配每日学习时间
    const dailyAllocation = courseAnalysis.map(c => {
      const urgency = urgencyScores.find(u => u.courseId === c.courseId)!
      const ratio = totalUrgency > 0 ? urgency.urgencyScore / totalUrgency : 1 / courseAnalysis.length
      const allocatedHours = Math.round(dailyStudyHours * ratio * 10) / 10

      // 计算预估完成时间
      const pointsPerHour = 2 // 假设每小时学习2个知识点
      const estimatedDays = Math.ceil(c.notMastered / Math.max(allocatedHours * pointsPerHour, 1))

      return {
        courseId: c.courseId,
        courseName: c.courseName,
        allocatedHours,
        estimatedDays,
        priority: c.priority,
        weakPoints: c.weakPoints,
        notMastered: c.notMastered,
        daysUntilExam: c.daysUntilExam,
        examDate: c.examDate
      }
    })

    // 生成每日统筹计划（示例：未来7天）
    const optimizedSchedule: Record<string, {
      courses: Array<{
        courseId: string
        courseName: string
        hours: number
        focus: string
        tasks: string[]
      }>
      totalHours: number
    }> = {}

    const daysToShow = 7
    const dailyMinutesTotal = dailyStudyHours * 60

    for (let day = 0; day < daysToShow; day++) {
      const currentDate = new Date()
      currentDate.setDate(currentDate.getDate() + day)
      const dateStr = currentDate.toISOString().split('T')[0]

      const dayCourses: Array<{
        courseId: string
        courseName: string
        hours: number
        focus: string
        tasks: string[]
      }> = []

      let remainingMinutes = dailyMinutesTotal

      for (const allocation of dailyAllocation) {
        // 根据日期调整每天的重点
        const dayMod = day % dailyAllocation.length
        const isTodayFocus = dailyAllocation.findIndex(a => a.courseId === allocation.courseId) === dayMod

        // 分配时间
        let hours = allocation.allocatedHours
        if (!isTodayFocus) {
          hours = Math.max(hours * 0.5, 0.5) // 非重点课程减少时间
        }

        const minutes = Math.round(hours * 60)
        remainingMinutes -= minutes

        // 确定当天重点
        let focus = '复习'
        const tasks: string[] = []

        if (allocation.weakPoints > 0 && day < 3) {
          focus = '薄弱点突破'
          tasks.push('错题复习', '重点知识点')
        } else if (day % 3 === 0) {
          focus = '新知识学习'
          tasks.push('新章节', '章节练习')
        } else {
          focus = '综合复习'
          tasks.push('综合练习', '知识点回顾')
        }

        // 检查是否能在考试前完成
        const canComplete = allocation.daysUntilExam >= allocation.estimatedDays
        if (!canComplete) {
          tasks.push('⚠️ 建议增加学习时间')
        }

        dayCourses.push({
          courseId: allocation.courseId,
          courseName: allocation.courseName,
          hours: Math.round(minutes / 60 * 10) / 10,
          focus,
          tasks
        })
      }

      optimizedSchedule[dateStr] = {
        courses: dayCourses,
        totalHours: Math.round((dailyMinutesTotal - remainingMinutes) / 60 * 10) / 10
      }
    }

    // 生成警告
    const warnings: string[] = []
    for (const allocation of dailyAllocation) {
      if (allocation.daysUntilExam <= 14 && allocation.allocatedHours < 1) {
        warnings.push(`${allocation.courseName}距离考试仅${allocation.daysUntilExam}天，建议增加学习时间`)
      }
      if (allocation.notMastered > allocation.estimatedDays * 2) {
        warnings.push(`${allocation.courseName}知识点较多，建议优先处理薄弱环节`)
      }
    }

    res.json({
      success: true,
      data: {
        courseAnalysis,
        dailyAllocation,
        optimizedSchedule,
        warnings: warnings.length > 0 ? warnings : ['学习计划安排合理'],
        summary: {
          totalCourses: courses.length,
          totalDailyHours: dailyStudyHours,
          totalKnowledgePoints: courseAnalysis.reduce((sum, c) => sum + c.totalKnowledgePoints, 0),
          totalWeakPoints: courseAnalysis.reduce((sum, c) => sum + c.weakPoints, 0),
          averageDaysUntilExam: Math.round(
            courseAnalysis.reduce((sum, c) => sum + c.daysUntilExam, 0) / courseAnalysis.length
          )
        }
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error optimizing review:', error)
    res.status(500).json({
      success: false,
      error: '多学科统筹优化失败',
      code: 'OPTIMIZE_FAILED'
    } as ApiResponse<undefined>)
  }
})

export default router
