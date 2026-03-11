/**
 * 智能备考规划服务
 * 实现 PLAN-01: 复习计划优化算法
 *
 * 功能：
 * 1. 强化学习/约束优化算法基础
 * 2. 状态建模：掌握度向量、剩余时间
 * 3. 动作空间定义
 */
/** 复习状态 */
export interface ReviewState {
    userId: string;
    knowledgePoints: KnowledgePointState[];
    examDate: Date | null;
    daysRemaining: number;
    dailyTimeBudget: number;
    currentMasteryVector: number[];
}
/** 知识点状态 */
export interface KnowledgePointState {
    id: string;
    name: string;
    masteryScore: number;
    difficulty: 'easy' | 'medium' | 'hard';
    importance: number;
    lastReviewDate: Date | null;
    reviewCount: number;
    forgettingCurve: number;
    prerequisiteIds: string[];
}
/** 复习动作 */
export interface ReviewAction {
    knowledgePointId: string;
    actionType: 'review' | 'practice' | 'rest';
    duration: number;
    expectedGain: number;
    priority: number;
}
/** 优化结果 */
export interface OptimizationResult {
    schedule: DailySchedule[];
    statistics: OptimizationStatistics;
    recommendations: string[];
    feasibility: FeasibilityAnalysis;
}
/** 每日计划 */
export interface DailySchedule {
    date: string;
    dayOfWeek: string;
    sessions: ReviewSession[];
    totalMinutes: number;
    estimatedMasteryGain: number;
}
/** 复习时段 */
export interface ReviewSession {
    startTime: string;
    endTime: string;
    knowledgePointId: string;
    knowledgePointName: string;
    activityType: 'new_learn' | 'review' | 'practice' | 'mock_exam';
    duration: number;
    expectedGain: number;
    priority: number;
}
/** 优化统计 */
export interface OptimizationStatistics {
    totalKnowledgePoints: number;
    totalStudyDays: number;
    totalStudyMinutes: number;
    averageDailyMinutes: number;
    projectedMastery: number;
    confidence: number;
}
/** 可行性分析 */
export interface FeasibilityAnalysis {
    isFeasible: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    issues: string[];
    suggestions: string[];
}
/** 约束条件 */
export interface Constraints {
    examDate: Date | null;
    dailyTimeBudget: number;
    maxSingleSession: number;
    preferredTimeSlots: Array<{
        start: number;
        end: number;
    }>;
    breakDuration: number;
    maxDailySessions: number;
}
/**
 * 状态建模：构建学习状态
 */
export declare function buildReviewState(userId: string, courseId?: string): Promise<ReviewState>;
/**
 * 动作空间定义：生成可用的复习动作
 */
export declare function defineActionSpace(state: ReviewState): ReviewAction[];
/**
 * 强化学习优化算法
 * 使用简化版 Q-learning 进行路径优化
 */
export declare function optimizeReviewPlan(userId: string, options: {
    courseId?: string;
    dailyStudyHours?: number;
    constraints?: Partial<Constraints>;
}): Promise<OptimizationResult>;
/**
 * 获取学习效率分析
 */
export declare function getEfficiencyAnalysis(userId: string, courseId?: string): Promise<{
    masteryDistribution: {
        mastered: number;
        medium: number;
        weak: number;
    };
    efficiencyScore: number;
    timeEfficiency: number;
    totalPoints: number;
    daysRemaining: number;
    recommendations: string[];
}>;
//# sourceMappingURL=planning.d.ts.map