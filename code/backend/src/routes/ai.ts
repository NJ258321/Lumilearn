import { Router, type Request, type Response } from 'express'
import { body, param, query } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type { ApiResponse } from '../types/index.js'
import prisma from '../lib/prisma.js'
import geminiService from '../services/gemini.js'

const router = Router()

// ==================== GET /api/ai/status - 获取AI服务状态 ====================

router.get('/ai/status', async (_req: Request, res: Response) => {
  try {
    const status = geminiService.getStatus()

    res.json({
      success: true,
      data: {
        ...status,
        features: {
          explain: true,
          suggest: true,
          analyzeWeakPoints: true,
          searchResources: true
        }
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting AI status:', error)
    res.status(500).json({
      success: false,
      error: '获取AI服务状态失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/ai/explain - 知识点解释生成 ====================

router.post('/ai/explain', [
  body('knowledgePointId').isUUID().withMessage('知识点ID必须是有效的UUID'),
  body('style').optional().isIn(['brief', 'detailed', 'example']).withMessage('解释风格必须是 brief/detailed/example'),
  body('includeRelated').optional().isBoolean(),
  body('includeExamples').optional().isBoolean(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { knowledgePointId, style = 'detailed', includeRelated = true, includeExamples = true } = req.body

    // 获取知识点详情
    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id: knowledgePointId },
      include: {
        chapter: {
          include: {
            course: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        error: '知识点不存在'
      } as ApiResponse<undefined>)
    }

    // 获取关联知识点
    let relatedPoints: Array<{ name: string; masteryScore: number }> = []

    if (includeRelated) {
      const relations = await prisma.knowledgeRelation.findMany({
        where: {
          OR: [
            { sourceId: knowledgePointId },
            { targetId: knowledgePointId }
          ]
        },
        include: {
          source: { select: { id: true, name: true, masteryScore: true } },
          target: { select: { id: true, name: true, masteryScore: true } }
        }
      })

      relatedPoints = relations
        .map(r => {
          const other = r.sourceId === knowledgePointId ? r.target : r.source
          return {
            name: other.name,
            masteryScore: other.masteryScore
          }
        })
        .slice(0, 5)
    }

    // 调用 AI 服务生成解释
    const explanation = await geminiService.explainKnowledgePoint({
      knowledgePoint: {
        name: knowledgePoint.name,
        chapterName: knowledgePoint.chapter.name,
        courseName: knowledgePoint.chapter.course.name,
        masteryScore: knowledgePoint.masteryScore
      },
      style,
      includeRelated,
      includeExamples,
      relatedPoints
    })

    res.json({
      success: true,
      data: {
        knowledgePoint: {
          id: knowledgePoint.id,
          name: knowledgePoint.name
        },
        explanation,
        relatedPoints,
        generatedAt: new Date().toISOString()
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error generating explanation:', error)
    res.status(500).json({
      success: false,
      error: '生成知识点解释失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/ai/suggest - 学习建议生成 ====================

router.post('/ai/suggest', [
  body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
  body('targetGrade').optional().isIn(['S', 'A', 'B', 'C']),
  body('daysUntilExam').optional().isInt({ min: 1 }),
  body('dailyStudyTime').optional().isInt({ min: 30, max: 600 }),
  body('focusAreas').optional().isArray(),
  validate
], async (req: Request, res: Response) => {
  try {
    const {
      courseId,
      targetGrade = 'B',
      daysUntilExam = 30,
      dailyStudyTime = 120,
      focusAreas = ['weak_points']
    } = req.body

    // 获取课程信息
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: '课程不存在'
      } as ApiResponse<undefined>)
    }

    // 获取薄弱知识点
    const weakPoints = await prisma.knowledgePoint.findMany({
      where: {
        chapter: { courseId },
        OR: [
          { status: 'WEAK' },
          { masteryScore: { lt: 60 } }
        ]
      },
      select: {
        id: true,
        name: true,
        masteryScore: true
      },
      take: 10
    })

    // 获取错题统计
    const mistakeStats = await prisma.mistake.groupBy({
      by: ['knowledgePointId'],
      where: { courseId },
      _count: true,
      orderBy: {
        _count: {
          knowledgePointId: 'desc'
        }
      }
    })

    // 获取学习记录统计
    const studyRecords = await prisma.studyRecord.findMany({
      where: { courseId },
      select: {
        title: true,
        duration: true
      }
    })

    // 格式化薄弱点数据
    const formattedWeakPoints = weakPoints.map(kp => {
      const stats = mistakeStats.find(s => s.knowledgePointId === kp.id)
      const mistakeCount = stats?._count || 0
      const totalAttempts = mistakeCount + 1 // 估算

      return {
        name: kp.name,
        masteryScore: kp.masteryScore,
        mistakeRate: mistakeCount / totalAttempts
      }
    })

    // 调用 AI 服务生成建议
    const suggestion = await geminiService.generateSuggestion({
      courseName: course.name,
      targetGrade,
      daysUntilExam,
      dailyStudyTime,
      focusAreas,
      weakPoints: formattedWeakPoints,
      studyRecords
    })

    res.json({
      success: true,
      data: {
        courseId: course.id,
        courseName: course.name,
        overallSuggestion: suggestion,
        weakPointsCount: weakPoints.length,
        studyRecordsCount: studyRecords.length,
        generatedAt: new Date().toISOString()
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error generating suggestion:', error)
    res.status(500).json({
      success: false,
      error: '生成学习建议失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/ai/analyze-weak-points - 薄弱点分析 ====================

router.post('/ai/analyze-weak-points', [
  body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
  body('analyzeDepth').optional().isIn(['quick', 'comprehensive']),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId, analyzeDepth = 'quick' } = req.body

    // 获取课程信息
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: '课程不存在'
      } as ApiResponse<undefined>)
    }

    // 获取所有知识点
    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: {
        chapter: { courseId }
      },
      select: {
        id: true,
        name: true,
        status: true,
        masteryScore: true,
        updatedAt: true
      }
    })

    // 获取错题统计
    const mistakeStats = await prisma.mistake.groupBy({
      by: ['knowledgePointId'],
      where: { courseId },
      _count: true
    })

    const mistakeMap = new Map(mistakeStats.map(m => [m.knowledgePointId, m._count]))

    // 分析薄弱点
    const analyzedPoints = knowledgePoints.map(kp => {
      const mistakeCount = mistakeMap.get(kp.id) || 0

      // 计算错题率
      const totalAttempts = mistakeCount + 1
      const mistakeRate = mistakeCount / totalAttempts

      // 计算未复习天数
      const daysSinceReview = Math.floor(
        (Date.now() - new Date(kp.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      const reviewMissCount = Math.max(0, Math.floor(daysSinceReview / 7)) // 超过7天算未复习

      return {
        knowledgePoint: {
          id: kp.id,
          name: kp.name,
          masteryScore: kp.masteryScore,
          status: kp.status
        },
        mistakeRate,
        reviewMissCount,
        lastReviewDate: kp.updatedAt.toISOString(),
        avgTimeSpent: 15, // 估算值
        errorPatterns: [] // 可后续扩展
      }
    })

    // 如果需要深入分析，调用 AI
    let insights: string[] = []
    let detailedAnalysis: any = null

    if (analyzeDepth === 'comprehensive') {
      // 调用 AI 进行深入分析
      const analysis = await geminiService.analyzeWeakPoints({
        courseId,
        courseName: course.name,
        knowledgePoints: analyzedPoints.slice(0, 20) // 限制数量
      })

      // 解析 AI 分析结果
      detailedAnalysis = analysis
    }

    // 本地计算薄弱点优先级
    const weakPointsWithPriority = analyzedPoints.map(kp => {
      // 薄弱度评分
      const mistakeScore = kp.mistakeRate * 40
      const reviewMissScore = kp.reviewMissCount * 10 * 0.3
      const masteryScore = (100 - kp.knowledgePoint.masteryScore) * 0.3

      const score = Math.min(100, mistakeScore + reviewMissScore + masteryScore)

      let priority: 'high' | 'medium' | 'low'
      if (score >= 70 || kp.mistakeRate > 0.5) {
        priority = 'high'
      } else if (score >= 40) {
        priority = 'medium'
      } else {
        priority = 'low'
      }

      return {
        ...kp,
        score,
        priority
      }
    })

    // 按优先级排序
    const sortedWeakPoints = weakPointsWithPriority
      .filter(p => p.priority !== 'low')
      .sort((a, b) => b.score - a.score)

    // 生成基础洞察
    const highCount = weakPointsWithPriority.filter(p => p.priority === 'high').length
    const mediumCount = weakPointsWithPriority.filter(p => p.priority === 'medium').length
    const avgMistakeRate = analyzedPoints.reduce((sum, p) => sum + p.mistakeRate, 0) / analyzedPoints.length

    insights = [
      `共发现 ${highCount} 个高优先级薄弱点，${mediumCount} 个中优先级薄弱点`,
      `平均错题率为 ${(avgMistakeRate * 100).toFixed(1)}%`,
      highCount > 5 ? '建议优先解决高优先级薄弱点' : '薄弱点数量在可控范围内'
    ]

    res.json({
      success: true,
      data: {
        courseId: course.id,
        totalKnowledgePoints: knowledgePoints.length,
        weakPoints: sortedWeakPoints.slice(0, 20),
        insights,
        detailedAnalysis,
        generatedAt: new Date().toISOString()
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error analyzing weak points:', error)
    res.status(500).json({
      success: false,
      error: '分析薄弱点失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/ai/search-resources - 外部资源检索 ====================

router.post('/ai/search-resources', [
  body('knowledgePointId').isUUID().withMessage('知识点ID必须是有效的UUID'),
  body('resourceTypes').optional().isArray().custom((value) => {
    if (value && Array.isArray(value)) {
      const validTypes = ['video', 'document', 'practice']
      for (const item of value) {
        if (!validTypes.includes(item)) {
          throw new Error('资源类型必须是 video/document/practice')
        }
      }
    }
    return true
  }),
  body('language').optional().isIn(['zh-CN', 'en']),
  body('maxResults').optional().isInt({ min: 1, max: 10 }),
  validate
], async (req: Request, res: Response) => {
  try {
    const {
      knowledgePointId,
      resourceTypes = ['video', 'document', 'practice'],
      language = 'zh-CN',
      maxResults = 5
    } = req.body

    // 获取知识点信息
    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id: knowledgePointId },
      include: {
        chapter: {
          include: {
            course: {
              select: { name: true }
            }
          }
        }
      }
    })

    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        error: '知识点不存在'
      } as ApiResponse<undefined>)
    }

    // 调用 AI 服务搜索资源
    const resources = await geminiService.searchResources({
      knowledgePointName: `${knowledgePoint.chapter.course.name} - ${knowledgePoint.name}`,
      resourceTypes,
      language,
      maxResults
    })

    res.json({
      success: true,
      data: {
        knowledgePoint: {
          id: knowledgePoint.id,
          name: knowledgePoint.name
        },
        resources,
        generatedAt: new Date().toISOString()
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error searching resources:', error)
    res.status(500).json({
      success: false,
      error: '搜索外部资源失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/ai/chat - AI 对话（通用） ====================

router.post('/ai/chat', [
  body('message').isString().notEmpty().withMessage('消息内容不能为空'),
  body('systemInstruction').optional().isString(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { message, systemInstruction } = req.body

    // 调用 AI 服务
    const response = await geminiService.chat(message, {
      messages: [{ role: 'user', content: message }],
      systemInstruction: systemInstruction || '你是一位学习助手，请用中文回答用户的问题。'
    })

    res.json({
      success: true,
      data: {
        message: response,
        timestamp: new Date().toISOString()
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error in chat:', error)
    res.status(500).json({
      success: false,
      error: 'AI 对话失败'
    } as ApiResponse<undefined>)
  }
})

export default router
