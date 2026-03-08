import { Router, type Request, type Response } from 'express'
import { param, body } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type { ApiResponse } from '../types/index.js'
import prisma from '../lib/prisma.js'

const router = Router()

// ==================== GET /api/progress/course/:courseId - 获取课程学习进度 ====================

router.get('/progress/course/:courseId', [
  param('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params

    // 获取课程信息及章节
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            knowledgePoints: {
              select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true
              }
            }
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

    // 计算总章节数和知识点数
    const totalChapters = course.chapters.length
    const totalKnowledgePoints = course.chapters.reduce((sum, ch) => sum + ch.knowledgePoints.length, 0)

    // 计算完成的章节和知识点
    let completedChapters = 0
    let completedKnowledgePoints = 0
    const chaptersProgress = course.chapters.map(chapter => {
      const chapterTotalPoints = chapter.knowledgePoints.length
      const chapterCompletedPoints = chapter.knowledgePoints.filter(kp => kp.status === 'MASTERED').length
      const chapterProgress = chapterTotalPoints > 0 ? chapterCompletedPoints / chapterTotalPoints : 0

      let chapterStatus: string
      if (chapterProgress === 1) {
        completedChapters++
        chapterStatus = 'completed'
      } else if (chapterProgress > 0) {
        chapterStatus = 'in_progress'
      } else {
        chapterStatus = 'not_started'
      }

      if (chapterProgress === 1) {
        completedKnowledgePoints += chapterTotalPoints
      } else {
        completedKnowledgePoints += chapterCompletedPoints
      }

      return {
        id: chapter.id,
        name: chapter.name,
        progress: Math.round(chapterProgress * 100) / 100,
        status: chapterStatus,
        knowledgePoints: {
          total: chapterTotalPoints,
          completed: chapterCompletedPoints
        }
      }
    })

    // 计算整体进度
    const overallProgress = totalKnowledgePoints > 0 ? completedKnowledgePoints / totalKnowledgePoints : 0

    // 生成下一步建议
    let nextSuggestion = ''
    if (overallProgress === 0) {
      nextSuggestion = '建议开始学习第一章内容'
    } else if (overallProgress < 0.5) {
      nextSuggestion = '建议继续按章节顺序学习'
    } else if (overallProgress < 1) {
      nextSuggestion = '建议开始复习前面的知识点'
    } else {
      nextSuggestion = '课程内容已全部学完，建议进行综合复习'
    }

    // 估算剩余时间（假设每个知识点平均需要30分钟）
    const remainingPoints = totalKnowledgePoints - completedKnowledgePoints
    const estimatedRemainingTime = remainingPoints * 30 * 60 // 转换为秒

    res.json({
      success: true,
      data: {
        courseId: course.id,
        courseName: course.name,
        totalChapters,
        completedChapters,
        totalKnowledgePoints,
        completedKnowledgePoints,
        overallProgress: Math.round(overallProgress * 100) / 100,
        chapters: chaptersProgress,
        nextSuggestion,
        estimatedRemainingTime
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting course progress:', error)
    res.status(500).json({
      success: false,
      error: '获取课程学习进度失败',
      code: 'GET_PROGRESS_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== PUT /api/progress/knowledge-point/:id/status - 更新知识点学习状态 ====================

router.put('/progress/knowledge-point/:id/status', [
  param('id').isUUID().withMessage('知识点ID必须是有效的UUID'),
  body('status').isIn(['NOT_STARTED', 'LEARNING', 'MASTERED', 'WEAK']).withMessage('状态必须是 NOT_STARTED/LEARNING/MASTERED/WEAK'),
  body('masteryScore').optional().isInt({ min: 0, max: 100 }).withMessage('掌握度必须是0-100的整数'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { status, masteryScore } = req.body

    // 检查知识点是否存在
    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id }
    })

    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        error: '知识点不存在',
        code: 'KNOWLEDGE_POINT_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 更新知识点状态和掌握度
    const updatedPoint = await prisma.knowledgePoint.update({
      where: { id },
      data: {
        status,
        masteryScore: masteryScore !== undefined ? masteryScore : knowledgePoint.masteryScore,
        updatedAt: new Date()
      },
      include: {
        chapter: {
          select: {
            id: true,
            name: true,
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

    res.json({
      success: true,
      data: {
        id: updatedPoint.id,
        name: updatedPoint.name,
        status: updatedPoint.status,
        masteryScore: updatedPoint.masteryScore,
        chapter: {
          id: updatedPoint.chapter.id,
          name: updatedPoint.chapter.name,
          courseId: updatedPoint.chapter.course.id,
          courseName: updatedPoint.chapter.course.name
        },
        updatedAt: updatedPoint.updatedAt
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error updating knowledge point status:', error)
    res.status(500).json({
      success: false,
      error: '更新知识点状态失败',
      code: 'UPDATE_STATUS_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/progress/knowledge-point/:id - 获取单个知识点进度 ====================

router.get('/progress/knowledge-point/:id', [
  param('id').isUUID().withMessage('知识点ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 获取知识点详情
    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id },
      include: {
        chapter: {
          select: {
            id: true,
            name: true,
            course: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            mistakes: true,
            timeMarks: true
          }
        }
      }
    })

    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        error: '知识点不存在',
        code: 'KNOWLEDGE_POINT_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 获取相关的学习记录
    const relatedTimeMarks = await prisma.timeMark.findMany({
      where: { knowledgePointId: id },
      orderBy: { timestamp: 'asc' },
      take: 10
    })

    res.json({
      success: true,
      data: {
        id: knowledgePoint.id,
        name: knowledgePoint.name,
        status: knowledgePoint.status,
        masteryScore: knowledgePoint.masteryScore,
        importance: knowledgePoint.importance,
        chapter: {
          id: knowledgePoint.chapter.id,
          name: knowledgePoint.chapter.name,
          courseId: knowledgePoint.chapter.course.id,
          courseName: knowledgePoint.chapter.course.name
        },
        stats: {
          studyCount: knowledgePoint._count.timeMarks,
          mistakeCount: knowledgePoint._count.mistakes
        },
        recentStudyRecords: relatedTimeMarks.map(tm => ({
          id: tm.id,
          timestamp: tm.timestamp,
          type: tm.type
        })),
        createdAt: knowledgePoint.createdAt,
        updatedAt: knowledgePoint.updatedAt
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting knowledge point progress:', error)
    res.status(500).json({
      success: false,
      error: '获取知识点进度失败',
      code: 'GET_POINT_PROGRESS_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/progress/milestones/:courseId - 获取学习里程碑 ====================

router.get('/progress/milestones/:courseId', [
  param('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId } = req.params

    // 检查课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
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

    // 生成默认里程碑（基于章节）
    const milestones: Array<{
      id: string
      title: string
      description: string
      targetDate: string | null
      progress: number
      status: string
      type: string
    }> = []

    let completedCount = 0
    let totalPoints = 0
    let completedPoints = 0

    // 按章节生成里程碑
    course.chapters.forEach((chapter, index) => {
      const chapterPoints = chapter.knowledgePoints.length
      const masteredPoints = chapter.knowledgePoints.filter(kp => kp.status === 'MASTERED').length
      const progress = chapterPoints > 0 ? masteredPoints / chapterPoints : 0

      totalPoints += chapterPoints
      completedPoints += masteredPoints

      let status: string
      if (progress === 1) {
        status = 'completed'
        completedCount++
      } else if (progress > 0) {
        status = 'in_progress'
      } else {
        status = 'pending'
      }

      milestones.push({
        id: `chapter-${chapter.id}`,
        title: `完成第${index + 1}章: ${chapter.name}`,
        description: `掌握${chapter.name}的所有知识点`,
        targetDate: null,
        progress: Math.round(progress * 100) / 100,
        status,
        type: 'chapter'
      })
    })

    // 添加整体里程碑
    const overallProgress = totalPoints > 0 ? completedPoints / totalPoints : 0

    milestones.push({
      id: 'course-completion',
      title: '完成课程学习',
      description: `掌握${course.name}的所有知识点`,
      targetDate: null,
      progress: overallProgress,
      status: overallProgress === 1 ? 'completed' : overallProgress > 0 ? 'in_progress' : 'pending',
      type: 'course'
    })

    // 添加期中里程碑（如果课程足够长）
    if (course.chapters.length >= 4) {
      const midChapterIndex = Math.floor(course.chapters.length / 2) - 1
      const midChapter = course.chapters[midChapterIndex]
      let midPoints = 0
      let midCompleted = 0

      for (let i = 0; i <= midChapterIndex; i++) {
        midPoints += course.chapters[i].knowledgePoints.length
        midCompleted += course.chapters[i].knowledgePoints.filter(kp => kp.status === 'MASTERED').length
      }

      const midProgress = midPoints > 0 ? midCompleted / midPoints : 0

      milestones.push({
        id: 'mid-term',
        title: '完成课程前半部分',
        description: '掌握前半学期的知识点',
        targetDate: null,
        progress: Math.round(midProgress * 100) / 100,
        status: midProgress === 1 ? 'completed' : midProgress > 0 ? 'in_progress' : 'pending',
        type: 'milestone'
      })
    }

    res.json({
      success: true,
      data: {
        courseId: course.id,
        courseName: course.name,
        milestones,
        achievedCount: completedCount,
        totalCount: milestones.length,
        overallProgress: Math.round(overallProgress * 100) / 100
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting milestones:', error)
    res.status(500).json({
      success: false,
      error: '获取学习里程碑失败',
      code: 'GET_MILESTONES_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/progress/knowledge-point/:id/progress - 记录知识点学习进度 ====================

router.post('/progress/knowledge-point/:id/progress', [
  param('id').isUUID().withMessage('知识点ID必须是有效的UUID'),
  body('studyTime').optional().isInt({ min: 1 }).withMessage('学习时间必须是正整数'),
  body('notes').optional().isString(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { studyTime, notes } = req.body

    // 检查知识点是否存在
    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id }
    })

    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        error: '知识点不存在',
        code: 'KNOWLEDGE_POINT_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 更新知识点：增加学习次数，更新掌握度
    const newMasteryScore = Math.min(100, knowledgePoint.masteryScore + 5) // 每次学习增加5分

    const updatedPoint = await prisma.knowledgePoint.update({
      where: { id },
      data: {
        masteryScore: newMasteryScore,
        status: newMasteryScore >= 80 ? 'MASTERED' : newMasteryScore >= 50 ? 'LEARNING' : 'WEAK',
        updatedAt: new Date()
      }
    })

    // 如果提供了学习时间，记录一个时间标记
    if (studyTime) {
      // 查找该知识点的最新学习记录
      const latestRecord = await prisma.timeMark.findFirst({
        where: { knowledgePointId: id },
        orderBy: { timestamp: 'desc' }
      })

      if (latestRecord) {
        // 更新学习记录的时长
        // 这里简化处理，实际可能需要关联到学习记录
      }
    }

    res.json({
      success: true,
      data: {
        id: updatedPoint.id,
        name: updatedPoint.name,
        previousMasteryScore: knowledgePoint.masteryScore,
        currentMasteryScore: updatedPoint.masteryScore,
        status: updatedPoint.status,
        progress: Math.round(((updatedPoint.masteryScore - knowledgePoint.masteryScore) / (100 - knowledgePoint.masteryScore)) * 100) || 0,
        updatedAt: updatedPoint.updatedAt
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error recording progress:', error)
    res.status(500).json({
      success: false,
      error: '记录学习进度失败',
      code: 'RECORD_PROGRESS_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/progress/overview - 获取所有课程进度概览 ====================

router.get('/progress/overview', async (_req: Request, res: Response) => {
  try {
    // 获取所有课程及其进度
    const courses = await prisma.course.findMany({
      include: {
        chapters: {
          include: {
            knowledgePoints: {
              select: {
                id: true,
                status: true,
                masteryScore: true
              }
            }
          }
        }
      }
    })

    const courseProgress = courses.map(course => {
      const totalPoints = course.chapters.reduce((sum, ch) => sum + ch.knowledgePoints.length, 0)
      const completedPoints = course.chapters.reduce(
        (sum, ch) => sum + ch.knowledgePoints.filter(kp => kp.status === 'MASTERED').length,
        0
      )
      const progress = totalPoints > 0 ? completedPoints / totalPoints : 0

      return {
        courseId: course.id,
        courseName: course.name,
        totalChapters: course.chapters.length,
        totalKnowledgePoints: totalPoints,
        completedKnowledgePoints: completedPoints,
        progress: Math.round(progress * 100) / 100,
        status: course.status
      }
    })

    // 计算总体进度
    const totalPointsAll = courseProgress.reduce((sum, cp) => sum + cp.totalKnowledgePoints, 0)
    const completedPointsAll = courseProgress.reduce((sum, cp) => sum + cp.completedKnowledgePoints, 0)
    const overallProgress = totalPointsAll > 0 ? completedPointsAll / totalPointsAll : 0

    res.json({
      success: true,
      data: {
        coursesCount: courses.length,
        overallProgress: Math.round(overallProgress * 100) / 100,
        totalKnowledgePoints: totalPointsAll,
        completedKnowledgePoints: completedPointsAll,
        courses: courseProgress
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting progress overview:', error)
    res.status(500).json({
      success: false,
      error: '获取进度概览失败',
      code: 'GET_OVERVIEW_FAILED'
    } as ApiResponse<undefined>)
  }
})

export default router
