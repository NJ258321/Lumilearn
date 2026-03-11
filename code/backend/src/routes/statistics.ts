import { Router, type Request, type Response } from 'express'
import { param, query } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type { ApiResponse } from '../types/index.js'
import prisma from '../lib/prisma.js'

const router = Router()

// ==================== GET /api/statistics/course/:courseId/overview - 课程学习概览 ====================

router.get('/statistics/course/:courseId/overview', [
  param('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
  query('timeRange').optional().isIn(['week', 'month', 'semester']).withMessage('时间范围必须是 week/month/semester'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params
    const { timeRange = 'month' } = req.query

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

    // 计算时间范围
    const now = new Date()
    let startDate: Date
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'semester':
        startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // 获取该时间范围内的学习记录
    const studyRecords = await prisma.studyRecord.findMany({
      where: {
        courseId,
        date: { gte: startDate }
      },
      select: {
        date: true,
        duration: true
      }
    })

    // 计算总学习时长
    const totalStudyTime = studyRecords.reduce((sum, record) => sum + record.duration, 0)

    // 计算学习天数
    const studyDaysSet = new Set(studyRecords.map(r => r.date.toISOString().split('T')[0]))
    const studyDays = studyDaysSet.size

    // 统计知识点
    const allKnowledgePoints = course.chapters.flatMap(ch => ch.knowledgePoints)
    const totalKnowledgePoints = allKnowledgePoints.length
    const masteredCount = allKnowledgePoints.filter(kp => kp.status === 'MASTERED').length
    const weakCount = allKnowledgePoints.filter(kp => kp.status === 'WEAK').length

    // 计算完成率
    const completionRate = totalKnowledgePoints > 0 ? masteredCount / totalKnowledgePoints : 0

    // 计算平均掌握度
    const averageMasteryScore = totalKnowledgePoints > 0
      ? Math.round(allKnowledgePoints.reduce((sum, kp) => sum + kp.masteryScore, 0) / totalKnowledgePoints)
      : 0

    // 按天统计学习时长
    const studyTimeByDayMap = new Map<string, number>()
    studyRecords.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0]
      studyTimeByDayMap.set(dateKey, (studyTimeByDayMap.get(dateKey) || 0) + record.duration)
    })

    const studyTimeByDay = Array.from(studyTimeByDayMap.entries())
      .map(([date, time]) => ({ date, time }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // 知识点掌握度分布
    const masteryDistribution = {
      excellent: allKnowledgePoints.filter(kp => kp.masteryScore >= 90).length,
      good: allKnowledgePoints.filter(kp => kp.masteryScore >= 70 && kp.masteryScore < 90).length,
      medium: allKnowledgePoints.filter(kp => kp.masteryScore >= 50 && kp.masteryScore < 70).length,
      weak: allKnowledgePoints.filter(kp => kp.masteryScore < 50).length
    }

    res.json({
      success: true,
      data: {
        courseId: course.id,
        courseName: course.name,
        totalStudyTime,
        studyDays,
        knowledgePointsCount: totalKnowledgePoints,
        masteredCount,
        weakCount,
        completionRate: Math.round(completionRate * 100) / 100,
        averageMasteryScore,
        studyTimeByDay,
        knowledgeMasteryDistribution: masteryDistribution
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting course overview:', error)
    res.status(500).json({
      success: false,
      error: '获取课程学习概览失败',
      code: 'GET_OVERVIEW_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/statistics/knowledge-points/:courseId/mastery - 知识点掌握统计 ====================

router.get('/statistics/knowledge-points/:courseId/mastery', [
  param('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params

    // 获取课程信息
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

    // 获取该课程所有知识点及其统计
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
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            mistakes: true,
            timeMarks: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // 统计各状态数量
    const masteredPoints = knowledgePoints.filter(kp => kp.status === 'MASTERED').length
    const learningPoints = knowledgePoints.filter(kp => kp.status === 'LEARNING' || kp.status === 'NEED_REVIEW').length
    const weakPoints = knowledgePoints.filter(kp => kp.status === 'WEAK').length
    const notStartedPoints = knowledgePoints.filter(kp => kp.status === 'NOT_STARTED').length

    // 计算平均分
    const totalScore = knowledgePoints.reduce((sum, kp) => sum + kp.masteryScore, 0)
    const averageScore = knowledgePoints.length > 0
      ? Math.round(totalScore / knowledgePoints.length)
      : 0

    // 格式化知识点数据
    const points = knowledgePoints.map(kp => ({
      id: kp.id,
      name: kp.name,
      masteryScore: kp.masteryScore,
      status: kp.status,
      studyCount: kp._count.timeMarks || 0,
      mistakeCount: kp._count.mistakes || 0,
      lastStudiedAt: kp.updatedAt
    }))

    res.json({
      success: true,
      data: {
        courseId: course.id,
        courseName: course.name,
        totalPoints: knowledgePoints.length,
        masteredPoints,
        learningPoints,
        weakPoints,
        notStartedPoints,
        averageScore,
        points
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting knowledge points mastery:', error)
    res.status(500).json({
      success: false,
      error: '获取知识点掌握统计失败',
      code: 'GET_MASTERY_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/statistics/activities - 学习活动统计 ====================

router.get('/statistics/activities', async (_req: Request, res: Response) => {
  try {
    // 获取各类活动数量
    const [
      studyRecordsCount,
      notesCount,
      timeMarksCount,
      emphasisCount,
      mistakesCount
    ] = await Promise.all([
      prisma.studyRecord.count(),
      prisma.studyRecord.count({
        where: {
          notes: { not: '' }
        }
      }),
      prisma.timeMark.count(),
      prisma.timeMark.count({
        where: {
          type: 'EMPHASIS'
        }
      }),
      prisma.mistake.count()
    ])

    // 获取最近的活动记录
    const recentStudyRecords = await prisma.studyRecord.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        date: true,
        duration: true,
        courseId: true,
        chapterId: true
      }
    })

    const recentMistakes = await prisma.mistake.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        question: true,
        knowledgePointId: true,
        createdAt: true
      }
    })

    // 获取课程和章节信息
    const courseMap = new Map()
    const chapterMap = new Map()

    const courses = await prisma.course.findMany({
      select: { id: true, name: true }
    })
    courses.forEach(c => courseMap.set(c.id, c.name))

    const chapters = await prisma.chapter.findMany({
      select: { id: true, name: true }
    })
    chapters.forEach(c => chapterMap.set(c.id, c.name))

    // 格式化最近活动
    const recentActivities = [
      ...recentStudyRecords.map(r => ({
        type: 'study' as const,
        title: r.title,
        courseName: courseMap.get(r.courseId) || '未知课程',
        chapterName: chapterMap.get(r.chapterId) || '未知章节',
        duration: r.duration,
        timestamp: r.date
      })),
      ...recentMistakes.map(m => ({
        type: 'mistake' as const,
        title: m.question.substring(0, 30) + (m.question.length > 30 ? '...' : ''),
        timestamp: m.createdAt
      }))
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    res.json({
      success: true,
      data: {
        studyRecordsCount,
        notesCount,
        timeMarksCount,
        emphasisCount,
        mistakesCount,
        recentActivities
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting activities:', error)
    res.status(500).json({
      success: false,
      error: '获取学习活动统计失败',
      code: 'GET_ACTIVITIES_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/statistics/chapter/:chapterId/summary - 章节学习摘要 ====================

router.get('/statistics/chapter/:chapterId/summary', [
  param('chapterId').isUUID().withMessage('章节ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params

    // 获取章节信息
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      include: {
        course: {
          select: { id: true, name: true }
        },
        knowledgePoints: true,
        studyRecords: {
          select: {
            id: true,
            title: true,
            duration: true,
            date: true,
            status: true
          }
        }
      }
    })

    if (!chapter) {
      return res.status(404).json({
        success: false,
        error: '章节不存在',
        code: 'CHAPTER_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 统计知识点
    const totalKnowledgePoints = chapter.knowledgePoints.length
    const masteredCount = chapter.knowledgePoints.filter(kp => kp.status === 'MASTERED').length
    const weakCount = chapter.knowledgePoints.filter(kp => kp.status === 'WEAK').length

    // 统计学习记录
    const totalStudyTime = chapter.studyRecords.reduce((sum, r) => sum + r.duration, 0)
    const completedRecords = chapter.studyRecords.filter(r => r.status === 'COMPLETED').length

    // 计算掌握度分布
    const masteryDistribution = {
      excellent: chapter.knowledgePoints.filter(kp => kp.masteryScore >= 90).length,
      good: chapter.knowledgePoints.filter(kp => kp.masteryScore >= 70 && kp.masteryScore < 90).length,
      medium: chapter.knowledgePoints.filter(kp => kp.masteryScore >= 50 && kp.masteryScore < 70).length,
      weak: chapter.knowledgePoints.filter(kp => kp.masteryScore < 50).length
    }

    // 计算平均掌握度
    const averageScore = totalKnowledgePoints > 0
      ? Math.round(chapter.knowledgePoints.reduce((sum, kp) => sum + kp.masteryScore, 0) / totalKnowledgePoints)
      : 0

    res.json({
      success: true,
      data: {
        chapterId: chapter.id,
        chapterName: chapter.name,
        courseId: chapter.course.id,
        courseName: chapter.course.name,
        knowledgePoints: {
          total: totalKnowledgePoints,
          mastered: masteredCount,
          weak: weakCount,
          progress: totalKnowledgePoints > 0 ? Math.round((masteredCount / totalKnowledgePoints) * 100) : 0
        },
        studyRecords: {
          total: chapter.studyRecords.length,
          completed: completedRecords,
          totalStudyTime
        },
        masteryDistribution,
        averageScore
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting chapter summary:', error)
    res.status(500).json({
      success: false,
      error: '获取章节学习摘要失败',
      code: 'GET_CHAPTER_SUMMARY_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/statistics/dashboard - 总体学习仪表盘 ====================

router.get('/statistics/dashboard', async (req: Request, res: Response) => {
  try {
    // 获取用户ID
    const userId = (req.query.userId as string) || null

    // 获取所有课程概览
    const courses = await prisma.course.findMany({
      include: {
        chapters: {
          include: {
            knowledgePoints: true
          }
        }
      }
    })

    // 统计总体数据
    let totalKnowledgePoints = 0
    let totalMastered = 0
    let totalWeak = 0

    courses.forEach(course => {
      const points = course.chapters.flatMap(ch => ch.knowledgePoints)
      totalKnowledgePoints += points.length
      totalMastered += points.filter(kp => kp.status === 'MASTERED').length
      totalWeak += points.filter(kp => kp.status === 'WEAK').length
    })

    // 获取最近7天的学习数据
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentStudyRecords = await prisma.studyRecord.findMany({
      where: {
        date: { gte: weekAgo }
      },
      select: {
        date: true,
        duration: true
      }
    })

    // 将秒转换为分钟
    const weeklyStudyTimeMinutes = Math.round(recentStudyRecords.reduce((sum, r) => sum + r.duration, 0) / 60)
    const weeklyStudyDays = new Set(recentStudyRecords.map(r => r.date.toISOString().split('T')[0])).size

    // 获取错题统计
    const totalMistakes = await prisma.mistake.count()
    const recentMistakes = await prisma.mistake.count({
      where: {
        createdAt: { gte: weekAgo }
      }
    })

    // 计算学习进度
    const overallProgress = totalKnowledgePoints > 0 ? Math.round((totalMastered / totalKnowledgePoints) * 100) : 0

    // ==================== 今日统计数据 ====================
    // 计算每日学习目标：根据用户设置的学习时间段
    // 默认时间段：上午 09:00-12:00, 下午 14:00-18:00, 晚上 19:00-21:00
    const DEFAULT_SCHEDULE = {
      morning: { start: '09:00', end: '12:00' },
      afternoon: { start: '14:00', end: '18:00' },
      evening: { start: '19:00', end: '21:00' }
    }

    // 计算时间段的分钟数
    const calculatePeriodMinutes = (start: string, end: string): number => {
      const [startHour, startMin] = start.split(':').map(Number)
      const [endHour, endMin] = end.split(':').map(Number)
      return (endHour * 60 + endMin) - (startHour * 60 + startMin)
    }

    // 根据用户设置计算每日学习目标
    let dailyGoal = 540 // 默认540分钟（9小时）
    let userSchedule = DEFAULT_SCHEDULE

    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { preferences: true }
        })
        if (user?.preferences) {
          const prefs = JSON.parse(user.preferences)
          // 优先使用用户设置的 schedule
          if (prefs.schedule?.enabled !== false) {
            userSchedule = {
              morning: prefs.schedule?.morning || DEFAULT_SCHEDULE.morning,
              afternoon: prefs.schedule?.afternoon || DEFAULT_SCHEDULE.afternoon,
              evening: prefs.schedule?.evening || DEFAULT_SCHEDULE.evening
            }
          }
        }
      } catch (e) {
        // 使用默认值
      }
    }

    // 计算总可用学习时间
    const morningMinutes = calculatePeriodMinutes(userSchedule.morning.start, userSchedule.morning.end)
    const afternoonMinutes = calculatePeriodMinutes(userSchedule.afternoon.start, userSchedule.afternoon.end)
    const eveningMinutes = calculatePeriodMinutes(userSchedule.evening.start, userSchedule.evening.end)
    dailyGoal = morningMinutes + afternoonMinutes + eveningMinutes

    // 获取今日学习记录
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayStudyRecords = await prisma.studyRecord.findMany({
      where: {
        date: {
          gte: today,
          lt: tomorrow
        }
      },
      select: {
        duration: true
      }
    })

    // 将秒转换为分钟
    const todayStudyTimeMinutes = Math.round(todayStudyRecords.reduce((sum, r) => sum + r.duration, 0) / 60)

    // 获取今日复习任务完成情况
    let todayTaskTotal = 0
    let todayTaskCompleted = 0

    const todayExamTasks = await prisma.examTask.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow
        }
      }
    })

    todayTaskTotal = todayExamTasks.length
    todayTaskCompleted = todayExamTasks.filter(t => t.status === 'COMPLETED').length

    // 计算今日任务完成进度
    const todayProgress = todayTaskTotal > 0
      ? Math.round((todayTaskCompleted / todayTaskTotal) * 100)
      : 0

    // ==================== 计算进度警告 ====================
    // 使用用户设置的学习时间段计算时间进度
    const now = new Date()

    // 解析用户设置的时间段
    const parseTime = (timeStr: string): number => {
      const [hour, min] = timeStr.split(':').map(Number)
      return hour * 60 + min
    }

    const morningStartMin = parseTime(userSchedule.morning.start)
    const eveningEndMin = parseTime(userSchedule.evening.end)
    const totalStudyMinutes = eveningEndMin - morningStartMin // 总学习时长（分钟）

    // 计算当前时间在一天中的位置（从学习开始到现在经过的分钟数）
    const currentMin = now.getHours() * 60 + now.getMinutes()
    let elapsedMinutes = currentMin - morningStartMin

    // 计算时间进度百分比
    let timeProgress = 0
    if (elapsedMinutes <= 0) {
      // 学习还没开始
      timeProgress = 0
    } else if (elapsedMinutes >= totalStudyMinutes) {
      // 学习时间已经结束
      timeProgress = 100
    } else {
      timeProgress = Math.round((elapsedMinutes / totalStudyMinutes) * 100)
    }

    // 计算任务进度
    const taskProgress = todayTaskTotal > 0
      ? Math.round((todayTaskCompleted / todayTaskTotal) * 100)
      : 0

    // 计算滞后百分比（时间进度 - 任务进度）
    const lagPercentage = timeProgress - taskProgress

    // 确定警告等级和消息
    let warningLevel: 'HIGH' | 'NORMAL' | 'LOW' = 'LOW'
    let warningMessage = ''

    if (lagPercentage > 20) {
      warningLevel = 'HIGH'
      warningMessage = `进度严重滞后！已落后 ${lagPercentage}%，请立即调整学习计划`
    } else if (lagPercentage > 10) {
      warningLevel = 'NORMAL'
      warningMessage = `进度有些滞后，当前完成 ${taskProgress}%，建议调整`
    }

    // 构建警告对象
    const progressWarning = lagPercentage > 10 ? {
      level: warningLevel,
      message: warningMessage,
      lagPercentage,
      completedTasks: todayTaskCompleted,
      totalTasks: todayTaskTotal,
      timeProgress,
      taskProgress
    } : null

    res.json({
      success: true,
      data: {
        coursesCount: courses.length,
        knowledgePoints: {
          total: totalKnowledgePoints,
          mastered: totalMastered,
          weak: totalWeak,
          progress: overallProgress
        },
        weeklyStats: {
          studyTime: weeklyStudyTimeMinutes,
          studyDays: weeklyStudyDays,
          mistakes: recentMistakes
        },
        // 今日统计（studyTime单位：分钟）
        todayStats: {
          dailyGoal,
          studyTime: todayStudyTimeMinutes,
          taskTotal: todayTaskTotal,
          taskCompleted: todayTaskCompleted,
          progress: todayProgress
        },
        progressWarning,
        totalMistakes,
        recentStudyRecords: recentStudyRecords.slice(0, 5).map(r => ({
          date: r.date,
          duration: r.duration
        }))
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting dashboard:', error)
    res.status(500).json({
      success: false,
      error: '获取学习仪表盘失败',
      code: 'GET_DASHBOARD_FAILED'
    } as ApiResponse<undefined>)
  }
})

export default router
