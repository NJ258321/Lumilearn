import { Router, type Request, type Response } from 'express'
import { body, param, query } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type {
  ApiResponse,
  KnowledgeRelation,
  CreateKnowledgeRelationRequest,
  UpdateKnowledgeRelationRequest,
  BatchCreateKnowledgeRelationsRequest,
  KnowledgeGraphResponse,
  RelationType
} from '../types/index.js'
import prisma from '../lib/prisma.js'
import { detectWeaknesses, detectGraphGaps, getLearningPath, calculateImportance, analyzeGraphPriority } from '../services/knowledgeGraph.js'

const router = Router()

// ==================== Validators ====================

const RELATION_TYPES = ['PREREQUISITE', 'RELATED', 'EXTENDS', 'EXAMPLE']

// ==================== GET /api/knowledge-points/:id/relations - 获取知识关系图 ====================

router.get('/knowledge-points/:id/relations', [
  param('id').isUUID().withMessage('知识点ID必须是有效的UUID'),
  query('depth').optional().isInt({ min: 1, max: 5 }).toInt(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const depth = parseInt(req.query.depth as string) || 2

    // 获取根知识点
    const rootPoint = await prisma.knowledgePoint.findUnique({
      where: { id },
      include: {
        chapter: {
          select: { id: true, name: true }
        }
      }
    })

    if (!rootPoint) {
      return res.status(404).json({
        success: false,
        error: '知识点不存在'
      } as ApiResponse<undefined>)
    }

    // 获取所有出向关系（作为source）
    const outgoingRelations = await prisma.knowledgeRelation.findMany({
      where: { sourceId: id },
      include: {
        target: {
          select: {
            id: true,
            name: true,
            status: true,
            masteryScore: true
          }
        }
      }
    })

    // 获取所有入向关系（作为target）
    const incomingRelations = await prisma.knowledgeRelation.findMany({
      where: { targetId: id },
      include: {
        source: {
          select: {
            id: true,
            name: true,
            status: true,
            masteryScore: true
          }
        }
      }
    })

    // 按关系类型分组
    const prerequisites = outgoingRelations
      .filter(r => r.relationType === 'PREREQUISITE')
      .map(r => ({
        id: r.target.id,
        name: r.target.name,
        masteryScore: r.target.masteryScore
      }))

    const related = outgoingRelations
      .filter(r => r.relationType !== 'PREREQUISITE')
      .map(r => ({
        id: r.target.id,
        name: r.target.name,
        masteryScore: r.target.masteryScore
      }))

    // 如果有深度要求，递归获取更多关系
    if (depth > 1) {
      const targetIds = outgoingRelations.map(r => r.targetId)

      if (targetIds.length > 0) {
        const nextLevelRelations = await prisma.knowledgeRelation.findMany({
          where: {
            sourceId: { in: targetIds }
          },
          include: {
            target: {
              select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true
              }
            }
          }
        })

        // 添加到related中（避免重复）
        nextLevelRelations.forEach(r => {
          if (!related.find(item => item.id === r.target.id)) {
            related.push({
              id: r.target.id,
              name: r.target.name,
              masteryScore: r.target.masteryScore
            })
          }
        })
      }
    }

    const response: KnowledgeGraphResponse = {
      root: {
        id: rootPoint.id,
        name: rootPoint.name,
        status: rootPoint.status as any,
        masteryScore: rootPoint.masteryScore
      },
      relations: outgoingRelations as any,
      prerequisites,
      related
    }

    res.json({
      success: true,
      data: response
    } as ApiResponse<KnowledgeGraphResponse>)
  } catch (error: any) {
    console.error('Error fetching knowledge relations:', error)
    res.status(500).json({
      success: false,
      error: '获取知识关系失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/knowledge-relations - 获取所有知识关系（可筛选） ====================

router.get('/knowledge-relations', [
  query('sourceId').optional().isUUID(),
  query('targetId').optional().isUUID(),
  query('relationType').optional().isIn(RELATION_TYPES),
  validate
], async (req: Request, res: Response) => {
  try {
    const sourceId = req.query.sourceId as string | undefined
    const targetId = req.query.targetId as string | undefined
    const relationType = req.query.relationType as RelationType | undefined

    const where: any = {}
    if (sourceId) where.sourceId = sourceId
    if (targetId) where.targetId = targetId
    if (relationType) where.relationType = relationType

    const relations = await prisma.knowledgeRelation.findMany({
      where,
      include: {
        source: {
          select: { id: true, name: true }
        },
        target: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      success: true,
      data: relations as any
    } as ApiResponse<KnowledgeRelation[]>)
  } catch (error: any) {
    console.error('Error fetching knowledge relations:', error)
    res.status(500).json({
      success: false,
      error: '获取知识关系失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/knowledge-relations - 创建知识关系 ====================

router.post('/knowledge-relations', [
  body('sourceId').isUUID().withMessage('源知识点ID必须是有效的UUID'),
  body('targetId').isUUID().withMessage('目标知识点ID必须是有效的UUID'),
  body('relationType').isIn(RELATION_TYPES).withMessage('关系类型必须是有效的值'),
  body('weight').optional().isInt({ min: 1, max: 10 }).toInt(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { sourceId, targetId, relationType, weight = 5 } = req.body as CreateKnowledgeRelationRequest

    // 检查源知识点是否存在
    const sourcePoint = await prisma.knowledgePoint.findUnique({
      where: { id: sourceId }
    })

    if (!sourcePoint) {
      return res.status(404).json({
        success: false,
        error: '源知识点不存在'
      } as ApiResponse<undefined>)
    }

    // 检查目标知识点是否存在
    const targetPoint = await prisma.knowledgePoint.findUnique({
      where: { id: targetId }
    })

    if (!targetPoint) {
      return res.status(404).json({
        success: false,
        error: '目标知识点不存在'
      } as ApiResponse<undefined>)
    }

    // 不能创建自关联关系
    if (sourceId === targetId) {
      return res.status(400).json({
        success: false,
        error: '不能创建自关联关系'
      } as ApiResponse<undefined>)
    }

    // 检查关系是否已存在
    const existingRelation = await prisma.knowledgeRelation.findUnique({
      where: {
        sourceId_targetId_relationType: {
          sourceId,
          targetId,
          relationType
        }
      }
    })

    if (existingRelation) {
      return res.status(409).json({
        success: false,
        error: '该知识关系已存在'
      } as ApiResponse<undefined>)
    }

    // 创建知识关系
    const relation = await prisma.knowledgeRelation.create({
      data: {
        sourceId,
        targetId,
        relationType,
        weight
      },
      include: {
        source: {
          select: { id: true, name: true }
        },
        target: {
          select: { id: true, name: true }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: relation as any
    } as ApiResponse<KnowledgeRelation>)
  } catch (error: any) {
    console.error('Error creating knowledge relation:', error)
    res.status(500).json({
      success: false,
      error: '创建知识关系失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/knowledge-relations/batch - 批量创建知识关系 ====================

router.post('/knowledge-relations/batch', [
  body('relations').isArray({ min: 1 }).withMessage('关系数组不能为空'),
  body('relations.*.sourceId').isUUID().withMessage('源知识点ID必须是有效的UUID'),
  body('relations.*.targetId').isUUID().withMessage('目标知识点ID必须是有效的UUID'),
  body('relations.*.relationType').isIn(RELATION_TYPES).withMessage('关系类型必须是有效的值'),
  body('relations.*.weight').optional().isInt({ min: 1, max: 10 }).toInt(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { relations } = req.body as BatchCreateKnowledgeRelationsRequest

    const createdRelations: any[] = []
    const errors: string[] = []

    // 逐个创建关系
    for (const rel of relations) {
      try {
        // 检查自关联
        if (rel.sourceId === rel.targetId) {
          errors.push(`知识点不能自关联`)
          continue
        }

        // 检查关系是否已存在
        const existing = await prisma.knowledgeRelation.findUnique({
          where: {
            sourceId_targetId_relationType: {
              sourceId: rel.sourceId,
              targetId: rel.targetId,
              relationType: rel.relationType
            }
          }
        })

        if (existing) {
          errors.push(`关系已存在: ${rel.sourceId} -> ${rel.targetId}`)
          continue
        }

        const relation = await prisma.knowledgeRelation.create({
          data: {
            sourceId: rel.sourceId,
            targetId: rel.targetId,
            relationType: rel.relationType,
            weight: rel.weight || 5
          }
        })

        createdRelations.push(relation)
      } catch (err: any) {
        errors.push(`创建失败: ${err.message}`)
      }
    }

    res.status(201).json({
      success: true,
      data: {
        created: createdRelations,
        failed: errors.length,
        errors
      }
    } as ApiResponse<{ created: any[]; failed: number; errors: string[] }>)
  } catch (error: any) {
    console.error('Error batch creating knowledge relations:', error)
    res.status(500).json({
      success: false,
      error: '批量创建知识关系失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/knowledge-relations/:id - 获取单个知识关系 ====================

router.get('/knowledge-relations/:id', [
  param('id').isUUID().withMessage('知识关系ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const relation = await prisma.knowledgeRelation.findUnique({
      where: { id },
      include: {
        source: {
          select: { id: true, name: true }
        },
        target: {
          select: { id: true, name: true }
        }
      }
    })

    if (!relation) {
      return res.status(404).json({
        success: false,
        error: '知识关系不存在'
      } as ApiResponse<undefined>)
    }

    res.json({
      success: true,
      data: relation as any
    } as ApiResponse<KnowledgeRelation>)
  } catch (error: any) {
    console.error('Error fetching knowledge relation:', error)
    res.status(500).json({
      success: false,
      error: '获取知识关系失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== PUT /api/knowledge-relations/:id - 更新知识关系 ====================

router.put('/knowledge-relations/:id', [
  param('id').isUUID().withMessage('知识关系ID必须是有效的UUID'),
  body('relationType').optional().isIn(RELATION_TYPES).withMessage('关系类型必须是有效的值'),
  body('weight').optional().isInt({ min: 1, max: 10 }).toInt(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { relationType, weight } = req.body as UpdateKnowledgeRelationRequest

    // 检查知识关系是否存在
    const existingRelation = await prisma.knowledgeRelation.findUnique({
      where: { id }
    })

    if (!existingRelation) {
      return res.status(404).json({
        success: false,
        error: '知识关系不存在'
      } as ApiResponse<undefined>)
    }

    // 如果更新relationType，检查是否已存在相同关系
    if (relationType && relationType !== existingRelation.relationType) {
      const duplicate = await prisma.knowledgeRelation.findUnique({
        where: {
          sourceId_targetId_relationType: {
            sourceId: existingRelation.sourceId,
            targetId: existingRelation.targetId,
            relationType
          }
        }
      })

      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: '该类型的知识关系已存在'
        } as ApiResponse<undefined>)
      }
    }

    // 更新知识关系
    const updatedRelation = await prisma.knowledgeRelation.update({
      where: { id },
      data: {
        ...(relationType && { relationType }),
        ...(weight !== undefined && { weight })
      },
      include: {
        source: {
          select: { id: true, name: true }
        },
        target: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      success: true,
      data: updatedRelation as any
    } as ApiResponse<KnowledgeRelation>)
  } catch (error: any) {
    console.error('Error updating knowledge relation:', error)
    res.status(500).json({
      success: false,
      error: '更新知识关系失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== DELETE /api/knowledge-relations/:id - 删除知识关系 ====================

router.delete('/knowledge-relations/:id', [
  param('id').isUUID().withMessage('知识关系ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 检查知识关系是否存在
    const existingRelation = await prisma.knowledgeRelation.findUnique({
      where: { id }
    })

    if (!existingRelation) {
      return res.status(404).json({
        success: false,
        error: '知识关系不存在'
      } as ApiResponse<undefined>)
    }

    // 删除知识关系
    await prisma.knowledgeRelation.delete({
      where: { id }
    })

    res.json({
      success: true,
      data: { id, message: '知识关系已删除' }
    } as ApiResponse<{ id: string; message: string }>)
  } catch (error: any) {
    console.error('Error deleting knowledge relation:', error)
    res.status(500).json({
      success: false,
      error: '删除知识关系失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== DELETE /api/knowledge-relations - 批量删除知识关系 ====================

router.delete('/knowledge-relations', [
  body('ids').isArray({ min: 1 }).withMessage('ID数组不能为空'),
  body('ids.*').isUUID().withMessage('每个ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { ids } = req.body as { ids: string[] }

    // 批量删除
    const result = await prisma.knowledgeRelation.deleteMany({
      where: {
        id: { in: ids }
      }
    })

    res.json({
      success: true,
      data: {
        deleted: result.count,
        requested: ids.length
      }
    } as ApiResponse<{ deleted: number; requested: number }>)
  } catch (error: any) {
    console.error('Error batch deleting knowledge relations:', error)
    res.status(500).json({
      success: false,
      error: '批量删除知识关系失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/knowledge-graph/weakness-analysis - 短板分析（KG-01） ====================

/**
 * 知识图谱短板分析
 * 检测前置概念缺失、高频引用低覆盖节点、生成结构性预警
 */
router.post('/knowledge-graph/weakness-analysis', [
  body('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
  body('minPriority').optional().isInt({ min: 0, max: 10 }).toInt(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId, minPriority } = req.body as {
      courseId?: string
      minPriority?: number
    }

    const result = await detectWeaknesses({
      courseId,
      minPriority: minPriority || 0
    })

    res.json({
      success: true,
      data: result
    } as ApiResponse<typeof result>)
  } catch (error: any) {
    console.error('Error in weakness analysis:', error)
    res.status(500).json({
      success: false,
      error: '短板分析失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/knowledge-graph/detect-gaps - 图谱缺口检测（KG-02） ====================

/**
 * 知识图谱缺口检测
 * 检测图谱完整性：孤立节点、前置缺失、循环依赖
 */
router.post('/knowledge-graph/detect-gaps', [
  body('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId } = req.body as { courseId?: string }

    const result = await detectGraphGaps(courseId)

    res.json({
      success: true,
      data: result
    } as ApiResponse<typeof result>)
  } catch (error: any) {
    console.error('Error in gap detection:', error)
    res.status(500).json({
      success: false,
      error: '缺口检测失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/knowledge-graph/learning-path/:id - 学习路径建议（KG-01扩展） ====================

/**
 * 获取知识点学习路径建议
 * 基于图结构推荐最优学习顺序
 */
router.get('/knowledge-graph/learning-path/:id', [
  param('id').isUUID().withMessage('知识点ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await getLearningPath(id)

    res.json({
      success: true,
      data: result
    } as ApiResponse<typeof result>)
  } catch (error: any) {
    console.error('Error in learning path:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取学习路径失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/knowledge-graph/importance/:id - 知识点重要性计算（KG-01扩展） ====================

/**
 * 计算知识点重要性分数
 * 综合考虑基础重要性、被引用次数、难度
 */
router.get('/knowledge-graph/importance/:id', [
  param('id').isUUID().withMessage('知识点ID必须是有效的UUID'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await calculateImportance(id)

    res.json({
      success: true,
      data: result
    } as ApiResponse<typeof result>)
  } catch (error: any) {
    console.error('Error in importance calculation:', error)
    res.status(500).json({
      success: false,
      error: error.message || '计算重要性失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/knowledge-graph/priority - 图结构优先级分析（KG-03） ====================

/**
 * 基于图结构的优先级分析
 * 使用 PageRank 风格的影响力传播算法，综合多维度计算优先级
 */
router.post('/knowledge-graph/priority', [
  body('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
  body('threshold').optional().isInt({ min: 0, max: 100 }).toInt(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId, threshold } = req.body as {
      courseId?: string
      threshold?: number
    }

    const result = await analyzeGraphPriority({
      courseId,
      threshold
    })

    res.json({
      success: true,
      data: result
    } as ApiResponse<typeof result>)
  } catch (error: any) {
    console.error('Error in graph priority analysis:', error)
    res.status(500).json({
      success: false,
      error: '图结构优先级分析失败'
    } as ApiResponse<undefined>)
  }
})

export default router
