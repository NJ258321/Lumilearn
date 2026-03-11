/**
 * 多学科统筹与任务平摊服务
 * 实现 PLAN-03: 多学科统筹
 * 实现 PLAN-04: 任务智能平摊
 */
export interface MultiCourseRequest {
    courseIds: string[];
    dailyStudyHours: number;
    examDates?: Record<string, string>;
    preferences?: {
        prioritizeWeaker?: boolean;
        prioritizeExamDate?: boolean;
        morningCourse?: string;
        eveningCourse?: string;
    };
}
export interface MultiCourseResult {
    allocation: CourseAllocation[];
    dailySchedule: DailyMultiCourseSchedule[];
    statistics: MultiCourseStatistics;
    recommendations: string[];
}
export interface CourseAllocation {
    courseId: string;
    courseName: string;
    dailyHours: number;
    priority: 'high' | 'medium' | 'low';
    urgencyScore: number;
    knowledgePoints: {
        total: number;
        weak: number;
        medium: number;
        mastered: number;
    };
    examDate?: string;
    daysUntilExam: number;
}
export interface DailyMultiCourseSchedule {
    date: string;
    dayOfWeek: string;
    sessions: MultiCourseSession[];
    totalHours: number;
}
export interface MultiCourseSession {
    timeSlot: string;
    courseId: string;
    courseName: string;
    activity: string;
    duration: number;
}
export interface MultiCourseStatistics {
    totalCourses: number;
    totalKnowledgePoints: number;
    totalDailyHours: number;
    averageCourseHours: number;
    highPriorityCourses: number;
}
export interface TaskBalanceRequest {
    courseId?: string;
    daysAhead?: number;
    maxDailyTasks?: number;
}
export interface TaskBalanceResult {
    unbalanced: UnbalancedTask[];
    rescheduled: RescheduledTask[];
    priorities: TaskPriority[];
    statistics: TaskBalanceStatistics;
    recommendations: string[];
}
export interface UnbalancedTask {
    taskId: string;
    taskName: string;
    courseId: string;
    courseName: string;
    originalDate: string;
    currentStatus: 'overdue' | 'due_today' | 'at_risk' | 'on_track';
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    reason: string;
}
export interface RescheduledTask {
    taskId: string;
    taskName: string;
    originalDate: string;
    newDate: string;
    reason: string;
}
export interface TaskPriority {
    taskId: string;
    taskName: string;
    priority: number;
    score: number;
    factors: {
        difficulty: number;
        importance: number;
        overdueDays: number;
        examProximity: number;
    };
}
export interface TaskBalanceStatistics {
    totalTasks: number;
    overdueTasks: number;
    atRiskTasks: number;
    rescheduledTasks: number;
    completionRate: number;
}
export declare function optimizeMultiCourse(userId: string, request: MultiCourseRequest): Promise<MultiCourseResult>;
export declare function balanceTasks(userId: string, request: TaskBalanceRequest): Promise<TaskBalanceResult>;
//# sourceMappingURL=multiCourse.d.ts.map