import { Router, type Request, type Response } from 'express'
import { body, param, query } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type { ApiResponse } from '../types/index.js'
import prisma from '../lib/prisma.js'
import minimaxService from '../services/minimax.js'
import geminiService from '../services/gemini.js'
import { multimodalAnalyzer } from '../services/multimodalAnalyzer.js'

const router = Router()

// ==================== GET /api/ai/status - 获取AI服务状态 ====================

router.get('/ai/status', async (_req: Request, res: Response) => {
  try {
    const status = minimaxService.getStatus()

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
    const explanation = await minimaxService.explainKnowledgePoint({
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
    const suggestion = await minimaxService.generateSuggestion({
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
      const analysis = await minimaxService.analyzeWeakPoints({
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
    const resources = await minimaxService.searchResources({
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

// ==================== POST /api/ai/analyze-time-mark - 分析时间标记 ====================

router.post('/ai/analyze-time-mark', [
  body('timeMarkId').isUUID().withMessage('时间标记ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { timeMarkId } = req.body

    // 获取时间标记详情
    const timeMark = await prisma.timeMark.findUnique({
      where: { id: timeMarkId },
      include: {
        studyRecord: {
          select: {
            id: true,
            title: true,
            notes: true
          }
        },
        knowledgePoint: true
      }
    })

    if (!timeMark) {
      return res.status(404).json({
        success: false,
        error: '时间标记不存在'
      } as ApiResponse<undefined>)
    }

    // 判断是否是板书图片标记
    const hasImageUrl = !!(timeMark as any).imageUrl
    let aiAnalysis: any = null
    let imageAnalysis: any = null

    if (hasImageUrl) {
      // ===== 板书图片分析：使用 Qwen3.5-Flash 视觉模型 =====
      console.log(`[AI Analysis] Analyzing board image: ${(timeMark as any).imageUrl}`)
      
      try {
        // 构建完整图片 URL
        const imageUrl = (timeMark as any).imageUrl
        const fullImageUrl = imageUrl.startsWith('http') 
          ? imageUrl 
          : `${process.env.API_BASE_URL || 'http://localhost:3000'}${imageUrl}`
        
        // 调用多模态分析器分析单张图片
        const imageMark = await multimodalAnalyzer['analyzeSingleImage'](fullImageUrl, 0)
        
        if (imageMark && imageMark.content) {
          imageAnalysis = imageMark
          aiAnalysis = {
            summary: imageMark.content,
            keyPoints: [imageMark.content, `板书类型: ${imageMark.type || '板书'}`],
            knowledgePoints: ['板书内容', imageMark.type || '板书'],
            reviewSuggestions: {
              firstReview: '1',
              secondReview: '3',
              consolidation: '7'
            },
            memoryTips: '建议结合图片内容进行复习，理解板书上的关键公式和概念'
          }
          console.log('[AI Analysis] Image analysis complete:', imageMark)
        }
      } catch (imageError) {
        console.error('[AI Analysis] Image analysis failed:', imageError)
      }
    }

    // 如果没有图片分析结果（非图片标记或图片分析失败），使用文本分析
    if (!aiAnalysis) {
      // 提取该时间标记附近的内容（前后30秒）
      const markTimestamp = timeMark.timestamp // 毫秒
      const transcript = timeMark.studyRecord.notes || ''
      
      // 尝试从转录文本中提取相关片段
      let relevantSegment = transcript
      
      // 如果转录文本包含时间戳格式 [00:00] 或 00:00:00，尝试提取相关片段
      if (transcript && transcript.length > 0) {
        const lines = transcript.split('\n')
        const relevantLines: string[] = []
        
        for (const line of lines) {
          // 尝试匹配各种时间格式 [00:00], 00:00, 00:00:00 等
          const timeMatch = line.match(/\[?(\d{1,2}):(\d{2})\]?:?\s*/)
          if (timeMatch) {
            const minutes = parseInt(timeMatch[1])
            const seconds = parseInt(timeMatch[2])
            const lineTimestamp = (minutes * 60 + seconds) * 1000 // 转为毫秒
            
            // 提取前后60秒内的内容
            if (Math.abs(lineTimestamp - markTimestamp) <= 60000) {
              relevantLines.push(line.replace(/^\[?\d{1,2}:\d{2}\]?:?\s*/, '').trim())
            }
          } else {
            // 没有时间戳的行，如果前面有相关行，也包含进来
            if (relevantLines.length > 0 && line.trim()) {
              relevantLines.push(line.trim())
            }
          }
        }
        
        if (relevantLines.length > 0) {
          relevantSegment = relevantLines.join(' ')
        }
      }
      
      // 限制片段长度
      if (relevantSegment.length > 800) {
        relevantSegment = relevantSegment.substring(0, 800) + '...'
      }

      // 构建分析上下文
      const context = `
学习记录：${timeMark.studyRecord.title}
标记类型：${timeMark.type}
标记内容：${timeMark.content || '无'}
时间点：${Math.floor(markTimestamp / 60000)}分${Math.floor((markTimestamp % 60000) / 1000)}秒

该时间点附近的讲解内容：
${relevantSegment || '无详细内容'}

完整文字稿（供参考）：
${transcript?.substring(0, 500) || '无'}${transcript?.length > 500 ? '...' : ''}
      `.trim()

      // 调用 AI 进行分析
      const analysisPrompt = `你是一位学习分析专家。请根据以下课堂内容进行分析，重点关注标记时间点附近的讲解内容：

${context}

要求：
1. 摘要必须基于"该时间点附近的讲解内容"，不能只是重复标记标题
2. 提取该时间段内的核心概念、定义、公式或结论
3. 关键要点要有实质内容，不能泛泛而谈
4. 如果有数学公式或技术术语，请保留并解释

请返回JSON格式的分析结果：
{
  "summary": "基于讲解内容的详细摘要（50-100字），说明具体讲了什么",
  "keyPoints": ["具体要点1", "具体要点2", "具体要点3"],
  "knowledgePoints": ["涉及的知识点1", "知识点2"],
  "reviewSuggestions": {
    "firstReview": "1",
    "secondReview": "3",
    "consolidation": "7"
  },
  "memoryTips": "针对该内容的记忆技巧"
}

请只返回JSON，不要其他内容。`

      try {
        const aiResponse = await geminiService.chat(analysisPrompt, {
          messages: [{ role: 'user', content: analysisPrompt }],
          systemInstruction: '你是一位专业的学习分析师，擅长分析学习内容并给出复习建议。请用中文回答。'
        })

        // 尝试解析AI返回的JSON
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0])
        }
      } catch (aiError) {
        console.error('AI分析失败:', aiError)
      }

      // 如果AI分析失败，使用默认数据
      if (!aiAnalysis) {
        aiAnalysis = {
          summary: timeMark.content?.substring(0, 50) || '暂无内容摘要',
          keyPoints: [timeMark.content || '暂无关键点'],
          knowledgePoints: timeMark.knowledgePoint ? [timeMark.knowledgePoint.name] : ['待关联'],
          reviewSuggestions: {
            firstReview: '1',
            secondReview: '3',
            consolidation: '7'
          },
          memoryTips: '建议通过多次复习来巩固记忆'
        }
      }
    }

    // 获取关联的知识点（从数据库）
    let relatedKnowledgePoints: Array<{ id: string; name: string; masteryScore?: number }> = []

    if (timeMark.knowledgePointId) {
      // 查找关联的知识点
      const relations = await prisma.knowledgeRelation.findMany({
        where: {
          OR: [
            { sourceId: timeMark.knowledgePointId },
            { targetId: timeMark.knowledgePointId }
          ]
        },
        include: {
          source: { select: { id: true, name: true } },
          target: { select: { id: true, name: true } }
        },
        take: 5
      })

      relatedKnowledgePoints = relations.map(rel => ({
        id: rel.sourceId === timeMark.knowledgePointId ? rel.targetId : rel.sourceId,
        name: rel.sourceId === timeMark.knowledgePointId ? rel.target.name : rel.source.name,
        masteryScore: Math.floor(Math.random() * 40) + 60 // 模拟掌握度
      }))
    }

    // 计算复习日期（基于艾宾浩斯遗忘曲线）
    const now = new Date()
    const getReviewDate = (days: number) => {
      const date = new Date(now)
      date.setDate(date.getDate() + parseInt(days.toString()))
      return date.toISOString().split('T')[0]
    }

    res.json({
      success: true,
      data: {
        timeMarkId: timeMark.id,
        type: timeMark.type,
        content: timeMark.content,
        // AI分析结果
        analysis: {
          summary: aiAnalysis.summary,
          keyPoints: aiAnalysis.keyPoints,
          knowledgePoints: aiAnalysis.knowledgePoints,
          reviewSuggestions: {
            firstReview: getReviewDate(aiAnalysis.reviewSuggestions?.firstReview || 1),
            secondReview: getReviewDate(aiAnalysis.reviewSuggestions?.secondReview || 3),
            consolidation: getReviewDate(aiAnalysis.reviewSuggestions?.consolidation || 7)
          },
          memoryTips: aiAnalysis.memoryTips
        },
        // 数据库中的关联知识点
        relatedKnowledgePoints: relatedKnowledgePoints,
        // 当前时间标记关联的知识点
        currentKnowledgePoint: timeMark.knowledgePoint ? {
          id: timeMark.knowledgePoint.id,
          name: timeMark.knowledgePoint.name
        } : null
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error analyzing time mark:', error)
    res.status(500).json({
      success: false,
      error: '分析时间标记失败'
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
    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = []
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction })
    }
    messages.push({ role: 'user', content: message })
    const response = await minimaxService.chat(messages)

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
