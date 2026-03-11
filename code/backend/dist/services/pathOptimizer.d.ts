/**
 * 智能路径优化服务
 * 实现 PLAN-02: 智能路径优化 API
 */
export interface PathOptimizationRequest {
    courseId?: string;
    targetMastery?: number;
    dailyHours?: number;
    examDate?: string;
    constraints?: OptimizationConstraints;
}
export interface OptimizationConstraints {
    maxSessionMinutes?: number;
    breakMinutes?: number;
    includeMockExam?: boolean;
    mockExamDays?: number[];
}
export interface PathOptimizationResult {
    path: LearningPath;
    optimization: OptimizationDetails;
    schedule: DetailedSchedule[];
    projection: MasteryProjection;
    mockExams?: MockExamSchedule[];
}
export interface LearningPath {
    stages: LearningStage[];
    totalDays: number;
    estimatedCompletionDate: string;
    strategy: string;
}
export interface LearningStage {
    stage: number;
    name: string;
    description: string;
    focusPoints: string[];
    targetDuration: number;
    expectedMasteryGain: number;
}
export interface OptimizationDetails {
    objectiveFunction: string;
    constraints: AppliedConstraints;
    algorithm: string;
    iterations: number;
    convergenceScore: number;
}
export interface AppliedConstraints {
    dailyTimeMinutes: number;
    maxSessionMinutes: number;
    breakMinutes: number;
    daysUntilExam: number;
    mockExamsIncluded: boolean;
}
export interface DetailedSchedule {
    day: number;
    date: string;
    sessions: ScheduleSession[];
    dailyGoal: string;
    totalMinutes: number;
    masteryTarget: number;
}
export interface ScheduleSession {
    timeSlot: string;
    activityType: string;
    topic: string;
    knowledgePointId?: string;
    duration: number;
    difficulty: string;
    expectedScoreGain: number;
}
export interface MasteryProjection {
    currentMastery: number;
    projectedFinal: number;
    milestones: MasteryMilestone[];
    confidence: number;
    riskFactors: string[];
}
export interface MasteryMilestone {
    day: number;
    date: string;
    targetMastery: number;
    status: string;
    action?: string;
}
export interface MockExamSchedule {
    day: number;
    date: string;
    scope: string;
    duration: number;
    purpose: string;
}
export declare function optimizeLearningPath(userId: string, request: PathOptimizationRequest): Promise<PathOptimizationResult>;
export declare function optimizeSinglePointPath(knowledgePointId: string, targetMastery?: number): Promise<{
    knowledgePoint: {
        id: string;
        name: string;
        currentMastery: number;
        targetMastery: number;
    };
    prerequisites: {
        required: {
            id: string;
            name: string;
            mastery: number;
        }[];
        unmet: {
            id: string;
            name: string;
            mastery: number;
        }[];
    };
    recommendedPath: {
        totalMinutes: number;
        sessions: number;
        strategy: string;
        suggestions: string[];
    };
}>;
//# sourceMappingURL=pathOptimizer.d.ts.map