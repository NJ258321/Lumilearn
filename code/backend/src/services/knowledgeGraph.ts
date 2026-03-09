/**
 * 知识图谱分析服务
 * 实现 KG-01: 短板发现算法
 *
 * 功能：
 * 1. 检测前置概念缺失
 * 2. 检测高频引用但低覆盖节点
 * 3. 生成结构性没学懂预警
 */

import prisma from '../lib/prisma.js'

// ==================== 类型定义 ====================

/** 短板分析结果 */
export interface WeaknessResult {
  courseId?: string
  totalKnowledgePoints: number
  weakPoints: WeakPoint[]
  warnings: StructuralWarning[]
  statistics: WeaknessStatistics
}

/** 单个薄弱点 */
export interface WeakPoint {
  id: string
  name: string
  masteryScore: number
  status: string
  issue: 'missing_prerequisite' | 'low_coverage' | 'structural_gap'
  relatedCount: number
  prerequisiteStatus?: 'missing' | 'weak' | 'mastered'
  suggestion: string
  priority: number // 1-10, 越高越紧急
}

/** 结构性预警 */
export interface StructuralWarning {
  type: 'prerequisite_gap' | 'coverage_gap' | 'learning_path_broken'
  severity: 'low' | 'medium' | 'high'
  message: string
  affectedPoints: string[]
  recommendation: string
}

/** 统计信息 */
export interface WeaknessStatistics {
  totalPrerequisiteGaps: number
  totalLowCoveragePoints: number
  totalStructuralGaps: number
  averageMasteryScore: number
  criticalCount: number
  urgentCount: number
}

/** 图谱缺口检测结果 */
export interface GapDetectionResult {
  isComplete: boolean
  gaps: GraphGap[]
  completenessScore: number // 0-100
}

/** 图谱缺口 */
export interface GraphGap {
  type: 'missing_prerequisite' | 'orphaned_node' | 'circular_dependency'
  nodeId?: string
  nodeName?: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

// ==================== 核心算法实现 ====================

/**
 * 短板发现算法主入口
 * 分析课程或全部知识点的学习短板
 */
export async function detectWeaknesses(options: {
  courseId?: string
  userId?: string
  minPriority?: number
}): Promise<WeaknessResult> {
  const { courseId, userId, minPriority = 0 } = options

  // 1. 获取知识点数据
  const knowledgePoints = await prisma.knowledgePoint.findMany({
    where: courseId ? { chapter: { courseId } } : undefined,
    include: {
      chapter: {
        select: { id: true, name: true, courseId: true }
      },
      outgoingRelations: {
        where: { relationType: 'PREREQUISITE' },
        include: {
          target: {
            select: { id: true, name: true, masteryScore: true, status: true }
          }
        }
      },
      incomingRelations: {
        where: { relationType: 'PREREQUISITE' },
        include: {
          source: {
            select: { id: true, name: true, masteryScore: true, status: true }
          }
        }
      }
    }
  })

  if (knowledgePoints.length === 0) {
    return {
      courseId,
      totalKnowledgePoints: 0,
      weakPoints: [],
      warnings: [],
      statistics: {
        totalPrerequisiteGaps: 0,
        totalLowCoveragePoints: 0,
        totalStructuralGaps: 0,
        averageMasteryScore: 0,
        criticalCount: 0,
        urgentCount: 0
      }
    }
  }

  const weakPoints: WeakPoint[] = []
  const warnings: StructuralWarning[] = []

  // 2. 遍历每个知识点，分析短板
  for (const point of knowledgePoints) {
    const issues: Array<{ type: WeakPoint['issue']; priority: number; suggestion: string; prerequisiteStatus?: 'missing' | 'weak' | 'mastered' }> = []

    // 2.1 检测前置概念缺失
    const missingPrerequisites = point.outgoingRelations
      .filter(rel => rel.target.masteryScore < 30 || rel.target.status === 'NEED_REVIEW')
      .map(rel => rel.target)

    if (missingPrerequisites.length > 0) {
      const avgScore = missingPrerequisites.reduce((sum, p) => sum + p.masteryScore, 0) / missingPrerequisites.length
      issues.push({
        type: 'missing_prerequisite',
        priority: Math.min(10, Math.floor((100 - avgScore) / 10) + 1),
        suggestion: `前置概念未掌握：${missingPrerequisites.map(p => p.name).join('、')}`,
        prerequisiteStatus: avgScore < 30 ? 'missing' : 'weak'
      })
    }

    // 2.2 检测高频引用但低覆盖节点
    const incomingCount = point.incomingRelations.length
    const isHighReference = incomingCount >= 3 // 被3个以上知识点引用
    const isLowCoverage = point.masteryScore < 60 || point.status === 'WEAK'

    if (isHighReference && isLowCoverage) {
      issues.push({
        type: 'low_coverage',
        priority: Math.min(10, Math.floor((100 - point.masteryScore) / 10) + incomingCount),
        suggestion: `被${incomingCount}个知识点引用，但掌握度仅${point.masteryScore}%，建议优先巩固`
      })
    }

    // 2.3 检测结构性缺口（前置概念缺失超过阈值）
    if (missingPrerequisites.length >= 2) {
      issues.push({
        type: 'structural_gap',
        priority: Math.min(10, missingPrerequisites.length + 3),
        suggestion: `有${missingPrerequisites.length}个前置概念未掌握，学习路径存在结构性断层`
      })
    }

    // 将问题点加入结果
    for (const issue of issues) {
      if (issue.priority >= minPriority) {
        weakPoints.push({
          id: point.id,
          name: point.name,
          masteryScore: point.masteryScore,
          status: point.status,
          issue: issue.type,
          relatedCount: incomingCount,
          prerequisiteStatus: issue.prerequisiteStatus,
          suggestion: issue.suggestion,
          priority: issue.priority
        })
      }
    }
  }

  // 3. 生成结构性预警
  const criticalPoints = weakPoints.filter(w => w.priority >= 8)
  const urgentPoints = weakPoints.filter(w => w.priority >= 5 && w.priority < 8)

  if (criticalPoints.length > 0) {
    warnings.push({
      type: 'prerequisite_gap',
      severity: 'high',
      message: `发现${criticalPoints.length}个关键知识点存在严重前置概念缺失`,
      affectedPoints: criticalPoints.map(p => p.id),
      recommendation: '建议立即停止新知识学习，优先补齐这些知识点的前置概念'
    })
  }

  const lowCoveragePoints = weakPoints.filter(w => w.issue === 'low_coverage')
  if (lowCoveragePoints.length >= 3) {
    warnings.push({
      type: 'coverage_gap',
      severity: 'high',
      message: `有${lowCoveragePoints.length}个高频引用知识点掌握度不足`,
      affectedPoints: lowCoveragePoints.map(p => p.id),
      recommendation: '这些知识点是其他知识点的学习基础，建议优先巩固'
    })
  }

  // 检测学习路径断裂
  const orphanedPoints = knowledgePoints.filter(p =>
    p.incomingRelations.length === 0 &&
    p.outgoingRelations.length === 0 &&
    p.masteryScore < 50
  )

  if (orphanedPoints.length > 0) {
    warnings.push({
      type: 'learning_path_broken',
      severity: 'medium',
      message: `发现${orphanedPoints.length}个孤立知识点，未与其他知识点建立联系`,
      affectedPoints: orphanedPoints.map(p => p.id),
      recommendation: '建议为这些知识点建立知识关联，形成完整学习路径'
    })
  }

  // 4. 计算统计信息
  const allScores = knowledgePoints.map(p => p.masteryScore)
  const averageMasteryScore = allScores.reduce((a, b) => a + b, 0) / allScores.length

  const statistics: WeaknessStatistics = {
    totalPrerequisiteGaps: weakPoints.filter(w => w.issue === 'missing_prerequisite').length,
    totalLowCoveragePoints: weakPoints.filter(w => w.issue === 'low_coverage').length,
    totalStructuralGaps: weakPoints.filter(w => w.issue === 'structural_gap').length,
    averageMasteryScore: Math.round(averageMasteryScore),
    criticalCount: criticalPoints.length,
    urgentCount: urgentPoints.length
  }

  // 按优先级排序
  weakPoints.sort((a, b) => b.priority - a.priority)

  return {
    courseId,
    totalKnowledgePoints: knowledgePoints.length,
    weakPoints,
    warnings,
    statistics
  }
}

/**
 * 图谱缺口检测
 * 检测知识图谱的完整性问题
 */
export async function detectGraphGaps(courseId?: string): Promise<GapDetectionResult> {
  const knowledgePoints = await prisma.knowledgePoint.findMany({
    where: courseId ? { chapter: { courseId } } : undefined,
    include: {
      outgoingRelations: true,
      incomingRelations: true
    }
  })

  const gaps: GraphGap[] = []

  // 1. 检测孤立节点
  for (const point of knowledgePoints) {
    if (point.incomingRelations.length === 0 && point.outgoingRelations.length === 0) {
      gaps.push({
        type: 'orphaned_node',
        nodeId: point.id,
        nodeName: point.name,
        description: `知识点"${point.name}"未与任何其他知识点建立关联`,
        severity: 'low'
      })
    }
  }

  // 2. 检测前置概念缺失
  for (const point of knowledgePoints) {
    const prerequisites = point.outgoingRelations.filter(r => r.relationType === 'PREREQUISITE')

    // 如果一个重要知识点没有任何前置概念，可能不完整
    if (prerequisites.length === 0 && point.importance >= 7) {
      gaps.push({
        type: 'missing_prerequisite',
        nodeId: point.id,
        nodeName: point.name,
        description: `重要知识点"${point.name}"缺少前置概念定义`,
        severity: point.importance >= 9 ? 'high' : 'medium'
      })
    }
  }

  // 3. 检测循环依赖
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  function hasCycle(nodeId: string, path: string[]): string[] | null {
    visited.add(nodeId)
    recursionStack.add(nodeId)

    const node = knowledgePoints.find(p => p.id === nodeId)
    if (!node) return null

    for (const rel of node.outgoingRelations) {
      if (rel.relationType === 'PREREQUISITE') {
        if (!visited.has(rel.targetId)) {
          const cycle = hasCycle(rel.targetId, [...path, nodeId])
          if (cycle) return cycle
        } else if (recursionStack.has(rel.targetId)) {
          return [...path, nodeId, rel.targetId]
        }
      }
    }

    recursionStack.delete(nodeId)
    return null
  }

  for (const point of knowledgePoints) {
    visited.clear()
    recursionStack.clear()
    const cycle = hasCycle(point.id, [])
    if (cycle) {
      gaps.push({
        type: 'circular_dependency',
        description: `发现循环前置依赖: ${cycle.join(' -> ')}`,
        severity: 'high'
      })
      break // 只报告一个循环
    }
  }

  // 计算完整性分数
  const maxPossibleGaps = knowledgePoints.length
  const gapPenalty = gaps.reduce((sum, gap) => {
    switch (gap.severity) {
      case 'high': return sum + 15
      case 'medium': return sum + 10
      case 'low': return sum + 5
      default: return sum
    }
  }, 0)

  const completenessScore = Math.max(0, 100 - Math.min(100, gapPenalty))

  return {
    isComplete: gaps.length === 0,
    gaps,
    completenessScore
  }
}

/**
 * 获取学习路径建议
 * 基于图结构分析，推荐最优学习顺序
 */
export async function getLearningPath(knowledgePointId: string): Promise<{
  path: Array<{ id: string; name: string; type: 'prerequisite' | 'current' | 'next' }>
  estimatedTime: number // 预估学习时间（分钟）
  recommendations: string[]
}> {
  // 获取目标知识点
  const targetPoint = await prisma.knowledgePoint.findUnique({
    where: { id: knowledgePointId }
  })

  if (!targetPoint) {
    throw new Error('知识点不存在')
  }

  // 获取所有前置知识点（递归）
  const prerequisites: Array<{ id: string; name: string; masteryScore: number }> = []

  async function getAllPrereqs(pointId: string) {
    const relations = await prisma.knowledgeRelation.findMany({
      where: {
        targetId: pointId,
        relationType: 'PREREQUISITE'
      },
      include: {
        source: {
          select: { id: true, name: true, masteryScore: true }
        }
      }
    })

    for (const rel of relations) {
      const prereq = rel.source
      if (!prerequisites.find(p => p.id === prereq.id)) {
        prerequisites.push(prereq)
        await getAllPrereqs(prereq.id)
      }
    }
  }

  await getAllPrereqs(knowledgePointId)

  // 构建学习路径
  const path = [
    ...prerequisites.filter(p => p.masteryScore < 60).map(p => ({
      id: p.id,
      name: p.name,
      type: 'prerequisite' as const
    })),
    {
      id: targetPoint.id,
      name: targetPoint.name,
      type: 'current' as const
    }
  ]

  // 预估时间（假设每个薄弱知识点需要15分钟）
  const weakCount = prerequisites.filter(p => p.masteryScore < 60).length
  const estimatedTime = weakCount * 15 + 30 // 加上当前知识点的时间

  // 生成建议
  const recommendations: string[] = []

  if (weakCount > 0) {
    recommendations.push(`建议先学习${weakCount}个前置知识点`)
  }

  if (targetPoint.masteryScore < 60) {
    recommendations.push('当前知识点掌握度不足，建议先巩固')
  }

  if (prerequisites.length > 5) {
    recommendations.push('前置知识较多，建议分批学习')
  }

  return {
    path,
    estimatedTime,
    recommendations
  }
}

/**
 * 计算知识点的重要性分数
 * 基于：被引用次数 * 重要性权重 + 难度系数
 */
export async function calculateImportance(knowledgePointId: string): Promise<{
  baseScore: number
  referenceScore: number
  difficultyScore: number
  totalScore: number
}> {
  const point = await prisma.knowledgePoint.findUnique({
    where: { id: knowledgePointId }
  })

  if (!point) {
    throw new Error('知识点不存在')
  }

  // 被引用次数
  const referenceCount = await prisma.knowledgeRelation.count({
    where: {
      targetId: knowledgePointId,
      relationType: 'PREREQUISITE'
    }
  })

  // 基础分数：重要性 * 10
  const baseScore = point.importance * 10

  // 引用分数：被引用次数 * 5
  const referenceScore = referenceCount * 5

  // 难度分数：基于掌握度（掌握度低说明难）
  const difficultyScore = Math.max(0, 100 - point.masteryScore)

  return {
    baseScore,
    referenceScore,
    difficultyScore,
    totalScore: baseScore + referenceScore + difficultyScore
  }
}

// ==================== KG-03: 图结构优先级计算 ====================

/** 图结构优先级分析结果 */
export interface GraphPriorityResult {
  priorities: GraphPriority[]
  insights: PriorityInsight[]
  learningOrder: string[]
  statistics: {
    highPriorityCount: number
    mediumPriorityCount: number
    lowPriorityCount: number
    averagePriority: number
  }
}

/** 单个知识点的优先级 */
export interface GraphPriority {
  id: string
  name: string
  masteryScore: number
  priorityScore: number // 综合优先级分数 0-100
  priorityLevel: 'critical' | 'high' | 'medium' | 'low'
  factors: {
    masteryFactor: number // 掌握度因子
    influenceFactor: number // 影响力因子
    prerequisiteFactor: number // 前置依赖因子
    cascadeFactor: number // 连锁影响因子
  }
  impactRadius: number // 影响半径（会被影响到的知识点数量）
  recommendedAction: string
}

/** 优先级洞察 */
export interface PriorityInsight {
  type: 'bottleneck' | 'cascade_risk' | 'quick_win' | 'foundation'
  message: string
  affectedPointIds: string[]
  suggestion: string
}

/**
 * 基于图结构的优先级分析（KG-03）
 * 使用 PageRank 风格的影响力传播算法
 */
export async function analyzeGraphPriority(options: {
  courseId?: string
  threshold?: number // 优先级阈值，默认 50
}): Promise<GraphPriorityResult> {
  const { courseId, threshold = 50 } = options

  // 1. 获取所有知识点及其关系
  const knowledgePoints = await prisma.knowledgePoint.findMany({
    where: courseId ? { chapter: { courseId } } : undefined,
    include: {
      chapter: {
        select: { id: true, name: true }
      },
      outgoingRelations: {
        where: { relationType: 'PREREQUISITE' }
      },
      incomingRelations: {
        where: { relationType: 'PREREQUISITE' }
      }
    }
  })

  if (knowledgePoints.length === 0) {
    return {
      priorities: [],
      insights: [],
      learningOrder: [],
      statistics: {
        highPriorityCount: 0,
        mediumPriorityCount: 0,
        lowPriorityCount: 0,
        averagePriority: 0
      }
    }
  }

  // 2. 构建图结构
  const graph = new Map<string, {
    point: typeof knowledgePoints[0]
    outgoing: string[]
    incoming: string[]
  }>()

  for (const point of knowledgePoints) {
    graph.set(point.id, {
      point,
      outgoing: point.outgoingRelations.map(r => r.targetId),
      incoming: point.incomingRelations.map(r => r.sourceId)
    })
  }

  // 3. 计算每个节点的 PageRank 风格影响力分数
  const influenceScores = calculateInfluenceScores(graph)

  // 4. 计算每个知识点的优先级
  const priorities: GraphPriority[] = []
  const insights: PriorityInsight[] = []

  for (const point of knowledgePoints) {
    const node = graph.get(point.id)!
    const influence = influenceScores.get(point.id) || 0

    // 计算各维度因子
    const masteryFactor = (100 - point.masteryScore) / 100 // 掌握度越低，因子越高
    const prerequisiteFactor = node.outgoing.length > 0
      ? node.outgoing.filter(id => {
          const target = knowledgePoints.find(p => p.id === id)
          return target && target.masteryScore < 60
        }).length / node.outgoing.length
      : 0

    // 连锁影响因子：被多少未掌握的知识点依赖
    const cascadeTargets = node.incoming.filter(id => {
      const source = knowledgePoints.find(p => p.id === id)
      return source && source.masteryScore < 60
    })
    const cascadeFactor = cascadeTargets.length > 0 ? cascadeTargets.length / 10 : 0

    // 综合优先级分数
    const priorityScore = Math.min(100, Math.round(
      masteryFactor * 40 + // 掌握度权重 40%
      influence * 30 + // 影响力权重 30%
      prerequisiteFactor * 20 + // 前置依赖权重 20%
      cascadeFactor * 10 // 连锁影响权重 10%
    ))

    // 确定优先级等级
    let priorityLevel: GraphPriority['priorityLevel']
    if (priorityScore >= 80) priorityLevel = 'critical'
    else if (priorityScore >= 60) priorityLevel = 'high'
    else if (priorityScore >= 40) priorityLevel = 'medium'
    else priorityLevel = 'low'

    // 计算影响半径
    const impactRadius = node.incoming.length

    // 生成建议
    let recommendedAction = ''
    if (priorityScore >= 80) {
      recommendedAction = '紧急优先学习 - 这是关键瓶颈点'
    } else if (priorityScore >= 60) {
      recommendedAction = '建议优先学习 - 影响较多后续知识点'
    } else if (priorityScore >= 40) {
      recommendedAction = '可以稍后学习 - 有一定前置依赖'
    } else {
      recommendedAction = '可按计划学习 - 掌握度较好'
    }

    priorities.push({
      id: point.id,
      name: point.name,
      masteryScore: point.masteryScore,
      priorityScore,
      priorityLevel,
      factors: {
        masteryFactor: Math.round(masteryFactor * 100) / 100,
        influenceFactor: Math.round(influence * 100) / 100,
        prerequisiteFactor: Math.round(prerequisiteFactor * 100) / 100,
        cascadeFactor: Math.round(cascadeFactor * 100) / 100
      },
      impactRadius,
      recommendedAction
    })
  }

  // 5. 生成洞察
  const criticalPoints = priorities.filter(p => p.priorityLevel === 'critical')
  const highCascadePoints = priorities.filter(p => p.factors.cascadeFactor >= 0.3)

  // 瓶颈点洞察
  if (criticalPoints.length > 0) {
    insights.push({
      type: 'bottleneck',
      message: `发现 ${criticalPoints.length} 个关键瓶颈知识点，这些知识点掌握度低且影响范围广`,
      affectedPointIds: criticalPoints.map(p => p.id),
      suggestion: '建议优先突破这些瓶颈点，可以带动整体学习效率提升'
    })
  }

  // 连锁风险洞察
  if (highCascadePoints.length > 0) {
    insights.push({
      type: 'cascade_risk',
      message: `有 ${highCascadePoints.length} 个知识点影响其他未掌握的知识点的学习`,
      affectedPointIds: highCascadePoints.map(p => p.id),
      suggestion: '这些知识点是学习路径上的关键节点，需要重点关注'
    })
  }

  // 快速胜利洞察
  const quickWins = priorities.filter(p =>
    p.priorityLevel === 'low' && p.masteryScore >= 80
  )
  if (quickWins.length > 0) {
    insights.push({
      type: 'quick_win',
      message: `有 ${quickWins.length} 个知识点已接近完全掌握`,
      affectedPointIds: quickWins.map(p => p.id),
      suggestion: '这些知识点可以作为学习后的快速复习，巩固学习信心'
    })
  }

  // 基础点洞察
  const foundationPoints = priorities.filter(p =>
    p.impactRadius >= 3 && p.masteryScore < 60
  )
  if (foundationPoints.length > 0) {
    insights.push({
      type: 'foundation',
      message: `有 ${foundationPoints.length} 个基础知识点被多个知识点依赖`,
      affectedPointIds: foundationPoints.map(p => p.id),
      suggestion: '这些是学习其他知识的基础，建议优先掌握'
    })
  }

  // 6. 生成推荐学习顺序（拓扑排序 + 优先级）
  const learningOrder = generateLearningOrder(priorities, graph)

  // 7. 统计信息
  const priorityScores = priorities.map(p => p.priorityScore)
  const averagePriority = priorityScores.reduce((a, b) => a + b, 0) / priorityScores.length

  // 按优先级排序
  priorities.sort((a, b) => b.priorityScore - a.priorityScore)

  return {
    priorities,
    insights,
    learningOrder,
    statistics: {
      highPriorityCount: priorities.filter(p => p.priorityScore >= 60).length,
      mediumPriorityCount: priorities.filter(p => p.priorityScore >= 40 && p.priorityScore < 60).length,
      lowPriorityCount: priorities.filter(p => p.priorityScore < 40).length,
      averagePriority: Math.round(averagePriority)
    }
  }
}

/**
 * 使用简化的 PageRank 算法计算节点影响力
 */
function calculateInfluenceScores(graph: Map<string, {
  point: any
  outgoing: string[]
  incoming: string[]
}>): Map<string, number> {
  const scores = new Map<string, number>()
  const nodes = Array.from(graph.keys())

  // 初始化分数
  for (const node of nodes) {
    scores.set(node, 1.0)
  }

  // 迭代计算（简化版 PageRank）
  const dampingFactor = 0.85
  const iterations = 20

  for (let i = 0; i < iterations; i++) {
    const newScores = new Map<string, number>()

    for (const node of nodes) {
      const nodeData = graph.get(node)!

      // 计算来自入边的贡献
      let inboundScore = 0
      for (const inboundNode of nodeData.incoming) {
        const inboundData = graph.get(inboundNode)
        if (inboundData && inboundData.outgoing.length > 0) {
          const prevScore = scores.get(inboundNode) || 0
          inboundScore += prevScore / inboundData.outgoing.length
        }
      }

      // PageRank 公式
      const newScore = (1 - dampingFactor) + dampingFactor * inboundScore
      newScores.set(node, newScore)
    }

    // 归一化
    const maxScore = Math.max(...Array.from(newScores.values()))
    for (const [node, score] of newScores) {
      newScores.set(node, score / maxScore)
    }

    // 更新分数
    for (const [node, score] of newScores) {
      scores.set(node, score)
    }
  }

  return scores
}

/**
 * 生成推荐学习顺序
 * 基于拓扑排序 + 优先级
 */
function generateLearningOrder(
  priorities: GraphPriority[],
  graph: Map<string, { point: any; outgoing: string[]; incoming: string[] }>
): string[] {
  // 按优先级排序（优先学习优先级高的）
  const sorted = [...priorities].sort((a, b) => b.priorityScore - a.priorityScore)

  // 但需要确保前置知识点在学习目标知识点之前
  const order: string[] = []
  const visited = new Set<string>()

  function ensurePrerequisites(pointId: string) {
    if (visited.has(pointId)) return

    const node = graph.get(pointId)
    if (!node) return

    // 先访问所有前置知识点
    for (const prereqId of node.outgoing) {
      ensurePrerequisites(prereqId)
    }

    visited.add(pointId)
    order.push(pointId)
  }

  for (const p of sorted) {
    ensurePrerequisites(p.id)
  }

  return order
}
