/**
 * 知识图谱分析服务
 * 实现 KG-01: 短板发现算法
 *
 * 功能：
 * 1. 检测前置概念缺失
 * 2. 检测高频引用但低覆盖节点
 * 3. 生成结构性没学懂预警
 */
/** 短板分析结果 */
export interface WeaknessResult {
    courseId?: string;
    totalKnowledgePoints: number;
    weakPoints: WeakPoint[];
    warnings: StructuralWarning[];
    statistics: WeaknessStatistics;
}
/** 单个薄弱点 */
export interface WeakPoint {
    id: string;
    name: string;
    masteryScore: number;
    status: string;
    issue: 'missing_prerequisite' | 'low_coverage' | 'structural_gap';
    relatedCount: number;
    prerequisiteStatus?: 'missing' | 'weak' | 'mastered';
    suggestion: string;
    priority: number;
}
/** 结构性预警 */
export interface StructuralWarning {
    type: 'prerequisite_gap' | 'coverage_gap' | 'learning_path_broken';
    severity: 'low' | 'medium' | 'high';
    message: string;
    affectedPoints: string[];
    recommendation: string;
}
/** 统计信息 */
export interface WeaknessStatistics {
    totalPrerequisiteGaps: number;
    totalLowCoveragePoints: number;
    totalStructuralGaps: number;
    averageMasteryScore: number;
    criticalCount: number;
    urgentCount: number;
}
/** 图谱缺口检测结果 */
export interface GapDetectionResult {
    isComplete: boolean;
    gaps: GraphGap[];
    completenessScore: number;
}
/** 图谱缺口 */
export interface GraphGap {
    type: 'missing_prerequisite' | 'orphaned_node' | 'circular_dependency';
    nodeId?: string;
    nodeName?: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
}
/**
 * 短板发现算法主入口
 * 分析课程或全部知识点的学习短板
 */
export declare function detectWeaknesses(options: {
    courseId?: string;
    userId?: string;
    minPriority?: number;
}): Promise<WeaknessResult>;
/**
 * 图谱缺口检测
 * 检测知识图谱的完整性问题
 */
export declare function detectGraphGaps(courseId?: string): Promise<GapDetectionResult>;
/**
 * 获取学习路径建议
 * 基于图结构分析，推荐最优学习顺序
 */
export declare function getLearningPath(knowledgePointId: string): Promise<{
    path: Array<{
        id: string;
        name: string;
        type: 'prerequisite' | 'current' | 'next';
    }>;
    estimatedTime: number;
    recommendations: string[];
}>;
/**
 * 计算知识点的重要性分数
 * 基于：被引用次数 * 重要性权重 + 难度系数
 */
export declare function calculateImportance(knowledgePointId: string): Promise<{
    baseScore: number;
    referenceScore: number;
    difficultyScore: number;
    totalScore: number;
}>;
/** 图结构优先级分析结果 */
export interface GraphPriorityResult {
    priorities: GraphPriority[];
    insights: PriorityInsight[];
    learningOrder: string[];
    statistics: {
        highPriorityCount: number;
        mediumPriorityCount: number;
        lowPriorityCount: number;
        averagePriority: number;
    };
}
/** 单个知识点的优先级 */
export interface GraphPriority {
    id: string;
    name: string;
    masteryScore: number;
    priorityScore: number;
    priorityLevel: 'critical' | 'high' | 'medium' | 'low';
    factors: {
        masteryFactor: number;
        influenceFactor: number;
        prerequisiteFactor: number;
        cascadeFactor: number;
    };
    impactRadius: number;
    recommendedAction: string;
}
/** 优先级洞察 */
export interface PriorityInsight {
    type: 'bottleneck' | 'cascade_risk' | 'quick_win' | 'foundation';
    message: string;
    affectedPointIds: string[];
    suggestion: string;
}
/**
 * 基于图结构的优先级分析（KG-03）
 * 使用 PageRank 风格的影响力传播算法
 */
export declare function analyzeGraphPriority(options: {
    courseId?: string;
    threshold?: number;
}): Promise<GraphPriorityResult>;
//# sourceMappingURL=knowledgeGraph.d.ts.map