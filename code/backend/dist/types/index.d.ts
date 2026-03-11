/** 课程状态 */
export type CourseStatus = 'STUDYING' | 'REVIEWING' | 'ARCHIVED';
/** 课程类型 */
export type CourseType = 'PROFESSIONAL' | 'CROSS_MAJOR' | 'ELECTIVE';
/** 目标等级 */
export type TargetGrade = 'S' | 'A' | 'B' | 'C';
/** 知识点状态 */
export type KnowledgeStatus = 'MASTERED' | 'WEAK' | 'NEED_REVIEW' | 'TODAY_REVIEW';
/** 学习记录状态 */
export type StudyRecordStatus = 'RECORDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
/** 时间标记类型 */
export type TimeMarkType = 'START' | 'END' | 'EMPHASIS' | 'BOARD_CHANGE' | 'NOTE' | 'QUESTION';
/** 考试任务类型 */
export type TaskType = 'CHAPTER_REVIEW' | 'MOCK_EXAM' | 'WEAK_POINT';
/** 考试任务状态 */
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';
/** 知识关系类型 */
export type RelationType = 'PREREQUISITE' | 'RELATED' | 'EXTENDS' | 'EXAMPLE';
/** 课程 */
export interface Course {
    id: string;
    name: string;
    status: CourseStatus;
    type: CourseType;
    examDate: Date | null;
    reviewStartDate: Date | null;
    targetGrade: TargetGrade | null;
    createdAt: Date;
    updatedAt: Date;
}
/** 创建课程请求 */
export interface CreateCourseRequest {
    name: string;
    status?: CourseStatus;
    type?: CourseType;
    examDate?: string;
    reviewStartDate?: string;
    targetGrade?: TargetGrade;
}
/** 更新课程请求 */
export interface UpdateCourseRequest {
    name?: string;
    status?: CourseStatus;
    type?: CourseType;
    examDate?: string;
    reviewStartDate?: string;
    targetGrade?: TargetGrade;
}
/** 章节 */
export interface Chapter {
    id: string;
    courseId: string;
    name: string;
    order: number;
    createdAt: Date;
    course?: Course;
}
/** 创建章节请求 */
export interface CreateChapterRequest {
    courseId: string;
    name: string;
    order: number;
}
/** 更新章节请求 */
export interface UpdateChapterRequest {
    name?: string;
    order?: number;
}
/** 知识点 */
export interface KnowledgePoint {
    id: string;
    chapterId: string;
    name: string;
    status: KnowledgeStatus;
    importance: number;
    masteryScore: number;
    createdAt: Date;
    updatedAt: Date;
    chapter?: Chapter;
}
/** 创建知识点请求 */
export interface CreateKnowledgePointRequest {
    chapterId: string;
    name: string;
    status?: KnowledgeStatus;
    importance?: number;
}
/** 更新知识点请求 */
export interface UpdateKnowledgePointRequest {
    name?: string;
    status?: KnowledgeStatus;
    importance?: number;
    masteryScore?: number;
}
/** 更新掌握度请求 */
export interface UpdateMasteryRequest {
    masteryScore: number;
}
/** 学习记录 */
export interface StudyRecord {
    id: string;
    courseId: string;
    chapterId: string;
    title: string;
    date: Date;
    audioUrl: string;
    duration: number;
    status: StudyRecordStatus;
    notes: string;
    createdAt: Date;
    course?: Course;
    chapter?: Chapter;
    timeMarks?: TimeMark[];
}
/** 创建学习记录请求 */
export interface CreateStudyRecordRequest {
    courseId: string;
    chapterId: string;
    title: string;
    date: string;
    audioUrl: string;
    duration: number;
    status?: StudyRecordStatus;
    notes?: string;
}
/** 更新学习记录请求 */
export interface UpdateStudyRecordRequest {
    title?: string;
    duration?: number;
    status?: StudyRecordStatus;
    notes?: string;
}
/** 时间标记 */
export interface TimeMark {
    id: string;
    studyRecordId: string;
    knowledgePointId: string | null;
    type: TimeMarkType;
    timestamp: number;
    pptPage: number | null;
    content: string | null;
    imageUrl: string | null;
    createdAt: Date;
    studyRecord?: StudyRecord;
    knowledgePoint?: KnowledgePoint;
}
/** 创建时间标记请求 */
export interface CreateTimeMarkRequest {
    studyRecordId: string;
    knowledgePointId?: string;
    type: TimeMarkType;
    timestamp: number;
    pptPage?: number;
    content?: string;
    imageUrl?: string;
}
/** 更新时间标记请求 */
export interface UpdateTimeMarkRequest {
    type?: TimeMarkType;
    timestamp?: number;
    pptPage?: number;
    content?: string;
    imageUrl?: string;
    knowledgePointId?: string;
}
/** 批量创建时间标记请求 */
export interface BatchCreateTimeMarksRequest {
    studyRecordId: string;
    timeMarks: Omit<CreateTimeMarkRequest, 'studyRecordId'>[];
}
/** 快速标记重点请求 */
export interface CreateEmphasisRequest {
    timestamp: number;
    content?: string;
    pptPage?: number;
    imageUrl?: string;
    knowledgePointId?: string;
}
/** 考试任务 */
export interface ExamTask {
    id: string;
    courseId: string;
    type: TaskType;
    scheduledDate: Date;
    status: TaskStatus;
    estimatedDuration: number;
    round: number;
    details: string | null;
    createdAt: Date;
    updatedAt: Date;
    course?: Course;
}
/** 创建考试任务请求 */
export interface CreateExamTaskRequest {
    courseId: string;
    type: TaskType;
    scheduledDate: string;
    status?: TaskStatus;
    estimatedDuration: number;
    round?: number;
    details?: string;
}
/** 更新考试任务请求 */
export interface UpdateExamTaskRequest {
    type?: TaskType;
    scheduledDate?: string;
    status?: TaskStatus;
    estimatedDuration?: number;
    round?: number;
    details?: string;
}
/** 错题 */
export interface Mistake {
    id: string;
    courseId: string;
    knowledgePointId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    reason: string | null;
    createdAt: Date;
    course?: Course;
    knowledgePoint?: KnowledgePoint;
}
/** 创建错题请求 */
export interface CreateMistakeRequest {
    courseId: string;
    knowledgePointId: string;
    question: string;
    userAnswer: string;
    correctAnswer: string;
    reason?: string;
}
/** API 响应基础结构 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    details?: ValidationError[];
}
/** 验证错误 */
export interface ValidationError {
    field: string;
    message: string;
}
/** 分页响应 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
}
/** 分页请求参数 */
export interface PaginationParams {
    page?: number;
    pageSize?: number;
}
/** 回溯详情响应 */
export interface PlaybackResponse {
    id: string;
    courseId: string;
    chapterId: string;
    title: string;
    audioUrl: string;
    duration: number;
    notes: string;
    timeMarks: TimeMark[];
    course: Pick<Course, 'id' | 'name'>;
    chapter: Pick<Chapter, 'id' | 'name'>;
}
/** 时间轴数据 */
export interface TimelineData {
    timeMarks: TimeMark[];
    emphasisPoints: TimeMark[];
    boardChanges: TimeMark[];
    notes: TimeMark[];
}
/** 笔记时间索引 */
export interface NoteTimeline {
    timestamp: number;
    content: string;
    knowledgePoint?: Pick<KnowledgePoint, 'id' | 'name'>;
}
/** 知识点时间分布 */
export interface KnowledgePointTimeline {
    knowledgePointId: string;
    knowledgePointName: string;
    timestamps: number[];
    totalDuration: number;
}
/** 批量创建知识点请求 */
export interface BatchCreateKnowledgePointsRequest {
    chapterId: string;
    knowledgePoints: Omit<CreateKnowledgePointRequest, 'chapterId'>[];
}
/** 批量更新知识点状态请求 */
export interface BatchUpdateKnowledgePointsStatusRequest {
    ids: string[];
    status: KnowledgeStatus;
}
/** 上传文件响应 */
export interface UploadResponse {
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    url: string;
}
/** 支持的文件类型 */
export declare const SUPPORTED_AUDIO_TYPES: readonly ["audio/mpeg", "audio/wav", "audio/m4a", "audio/mp3"];
export declare const SUPPORTED_IMAGE_TYPES: readonly ["image/jpeg", "image/png", "image/gif", "image/webp"];
export declare const SUPPORTED_DOCUMENT_TYPES: readonly ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
/** 掌握度阈值 */
export declare const MASTERY_THRESHOLDS: {
    readonly MASTERED: 80;
    readonly NEED_REVIEW: 60;
    readonly WEAK: 0;
};
/** 掌握度对应的默认状态 */
export declare const getMasteryStatus: (score: number) => KnowledgeStatus;
/** 复习轮次配置 */
export declare const ROUND_CONFIG: {
    readonly 1: {
        readonly name: "一轮复习";
        readonly weight: 0.4;
    };
    readonly 2: {
        readonly name: "二轮复习";
        readonly weight: 0.35;
    };
    readonly 3: {
        readonly name: "三轮复习";
        readonly weight: 0.25;
    };
};
/** 知识关系 */
export interface KnowledgeRelation {
    id: string;
    sourceId: string;
    targetId: string;
    relationType: RelationType;
    weight: number;
    createdAt: Date;
    source?: KnowledgePoint;
    target?: KnowledgePoint;
}
/** 创建知识关系请求 */
export interface CreateKnowledgeRelationRequest {
    sourceId: string;
    targetId: string;
    relationType: RelationType;
    weight?: number;
}
/** 更新知识关系请求 */
export interface UpdateKnowledgeRelationRequest {
    relationType?: RelationType;
    weight?: number;
}
/** 批量创建知识关系请求 */
export interface BatchCreateKnowledgeRelationsRequest {
    relations: CreateKnowledgeRelationRequest[];
}
/** 知识关系图响应 */
export interface KnowledgeGraphResponse {
    root: {
        id: string;
        name: string;
        status: KnowledgeStatus;
        masteryScore: number;
    };
    relations: KnowledgeRelation[];
    prerequisites: Array<{
        id: string;
        name: string;
        masteryScore: number;
    }>;
    related: Array<{
        id: string;
        name: string;
        masteryScore: number;
    }>;
}
//# sourceMappingURL=index.d.ts.map