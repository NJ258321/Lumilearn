// =====================================================
// LumiTrace AI - TypeScript 类型定义
// =====================================================

// ========== 通用响应类型 ==========
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string  // 错误码
  details?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}

// ========== 分页类型 ==========
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

// ========== 文件上传类型 ==========
export interface UploadedFile {
  filename: string
  originalName: string
  size: number
  mimetype: string
  url: string
}

// ========== 课程类型 ==========
export type CourseStatus = 'STUDYING' | 'REVIEWING' | 'ARCHIVED'
export type CourseType = 'PROFESSIONAL' | 'CROSS_MAJOR' | 'ELECTIVE'
export type TargetGrade = 'S' | 'A' | 'B' | 'C'

export interface Course {
  id: string
  name: string
  description?: string
  type: CourseType
  status: CourseStatus
  targetGrade?: TargetGrade
  examDate?: string
  createdAt: string
  updatedAt: string
  // 额外属性用于前端展示
  lastReview?: string
  semester?: string
}

// ========== 章节类型 ==========
export interface Chapter {
  id: string
  courseId: string
  name: string
  order: number
  description?: string
  createdAt: string
  updatedAt: string
}

// ========== 知识点类型 ==========
export type KnowledgeStatus = 'MASTERED' | 'WEAK' | 'NEED_REVIEW' | 'TODAY_REVIEW' | 'LEARNING' | 'NOT_STARTED'

export interface KnowledgePoint {
  id: string
  courseId: string
  chapterId?: string
  name: string
  description?: string
  status: KnowledgeStatus
  masteryLevel?: number
  lastReviewedAt?: string
  createdAt: string
  updatedAt: string
}

// ========== 学习记录类型 ==========
export interface StudyRecord {
  id: string
  courseId: string
  chapterId?: string
  title: string
  audioUrl?: string
  imageUrls?: string[]
  notes?: string
  duration?: number
  recordedAt?: string
  createdAt: string
  updatedAt: string
  course?: Course
  chapter?: Chapter
}

// ========== 时间标记类型 ==========
export type TimeMarkType = 'START' | 'END' | 'EMPHASIS' | 'BOARD_CHANGE' | 'NOTE' | 'QUESTION'

export interface TimeMarkData {
  pptPage?: number
  noteText?: string
  imageUrl?: string
}

export interface TimeMark {
  id: string
  studyRecordId: string
  timestamp: number
  type: TimeMarkType
  data?: TimeMarkData
  knowledgePointId?: string
  createdAt: string
  updatedAt: string
  knowledgePoint?: KnowledgePoint
}

// ========== 回溯数据类型 ==========
export interface PlaybackData {
  id: string
  courseId: string
  chapterId?: string
  audioUrl?: string
  duration?: number
  notes?: string
  timeMarks: TimeMark[]
  course?: Course
  chapter?: Chapter
}

export interface TimelineItem {
  id: string
  timestamp: number
  type: TimeMarkType
  title?: string
}

export interface EmphasisPoint {
  id: string
  timestamp: number
  note?: string
  knowledgePoint?: KnowledgePoint
}

// ========== 搜索类型 ==========
export interface StudyRecordSearchParams {
  startDate?: string
  endDate?: string
  courseId?: string
  keyword?: string
}

export interface RelatedMarksParams {
  timestamp: number
  range?: number // 秒，默认 30
}

// ========== P4 - 学习数据统计类型 ==========

// 每日学习时长
export interface StudyTimeByDay {
  date: string
  time: number
}

// 知识点掌握度分布
export interface KnowledgeMasteryDistribution {
  excellent: number
  good: number
  medium: number
  weak: number
}

// 课程学习概览
export interface CourseOverview {
  courseId: string
  courseName: string
  totalStudyTime: number
  studyDays: number
  knowledgePointsCount: number
  masteredCount: number
  weakCount: number
  completionRate: number
  averageMasteryScore: number
  studyTimeByDay: StudyTimeByDay[]
  knowledgeMasteryDistribution: KnowledgeMasteryDistribution
}

// 知识点掌握详情
export interface KnowledgePointMastery {
  id: string
  name: string
  masteryScore: number
  status: KnowledgeStatus
  studyCount: number
  mistakeCount?: number
  lastStudiedAt?: string
}

// 知识点掌握统计
export interface KnowledgeMastery {
  courseId: string
  courseName: string
  totalPoints: number
  masteredPoints: number
  learningPoints: number
  weakPoints: number
  notStartedPoints: number
  averageScore: number
  points: KnowledgePointMastery[]
}

// 学习活动项
export interface RecentActivity {
  type: string
  title: string
  courseName?: string
  chapterName?: string
  duration?: number
  timestamp: string
}

// 学习活动统计
export interface ActivityStats {
  studyRecordsCount: number
  notesCount: number
  timeMarksCount: number
  emphasisCount: number
  mistakesCount: number
  recentActivities: RecentActivity[]
}

// 章节知识点统计
export interface ChapterKnowledgeStats {
  total: number
  mastered: number
  weak: number
  progress: number
}

// 章节学习记录统计
export interface ChapterStudyRecordStats {
  total: number
  completed: number
  totalStudyTime: number
}

// 章节学习摘要
export interface ChapterSummary {
  chapterId: string
  chapterName: string
  courseId: string
  courseName: string
  knowledgePoints: ChapterKnowledgeStats
  studyRecords: ChapterStudyRecordStats
  masteryDistribution: KnowledgeMasteryDistribution
  averageScore: number
}

// 知识点统计
export interface KnowledgePointsStats {
  total: number
  mastered: number
  weak: number
  progress: number
}

// 周统计
export interface WeeklyStats {
  studyTime: number    // 本周学习时长（分钟）
  studyDays: number   // 学习天数
  mistakes: number    // 本周错题数
}

// 进度警告
export interface ProgressWarning {
  level: 'HIGH' | 'NORMAL' | 'LOW'  // 警告等级
  message: string                       // 警告消息
  lagPercentage: number                // 滞后百分比
  completedTasks: number               // 已完成任务数
  totalTasks: number                   // 总任务数
  timeProgress: number                 // 时间进度百分比
  taskProgress: number                 // 任务进度百分比
}

// 总体学习仪表盘
// 今日统计
export interface TodayStats {
  dailyGoal: number     // 今日目标学习时长（分钟）
  studyTime: number    // 今日已学习时长（分钟）
  taskTotal: number    // 今日任务总数
  taskCompleted: number // 今日已完成任务数
  progress: number     // 任务完成进度（百分比）
}

export interface Dashboard {
  coursesCount: number
  knowledgePoints: KnowledgePointsStats
  weeklyStats: WeeklyStats
  todayStats: TodayStats  // 今日统计
  progressWarning: ProgressWarning | null  // 进度警告
  totalMistakes: number
  recentStudyRecords: Array<{ date: string; duration: number }>
}

// ========== P4 - 学习进度类型 ==========

// 章节进度
export interface ChapterProgress {
  id: string
  name: string
  progress: number
  status: 'completed' | 'in_progress' | 'not_started'
  knowledgePoints: {
    total: number
    completed: number
  }
}

// 课程学习进度
export interface CourseProgress {
  courseId: string
  courseName: string
  totalChapters: number
  completedChapters: number
  totalKnowledgePoints: number
  completedKnowledgePoints: number
  overallProgress: number
  chapters: ChapterProgress[]
  nextSuggestion: string
  estimatedRemainingTime: number
}

// 知识点进度章节信息
export interface KnowledgePointChapter {
  id: string
  name: string
  courseId: string
  courseName: string
}

// 知识点进度统计
export interface KnowledgePointStats {
  studyCount: number
  mistakeCount: number
}

// 知识点进度
export interface KnowledgePointProgress {
  id: string
  name: string
  status: KnowledgeStatus
  masteryScore: number
  importance?: number
  chapter: KnowledgePointChapter
  stats: KnowledgePointStats
  recentStudyRecords: StudyRecord[]
  createdAt: string
  updatedAt: string
}

// 知识点状态更新请求
export interface UpdateKnowledgePointStatusRequest {
  status: 'NOT_STARTED' | 'LEARNING' | 'MASTERED' | 'WEAK'
  masteryScore?: number
}

// 记录知识点进度请求
export interface RecordKnowledgePointProgressRequest {
  studyTime?: number
  notes?: string
}

// 记录知识点进度响应
export interface RecordKnowledgePointProgressResponse {
  id: string
  name: string
  previousMasteryScore: number
  currentMasteryScore: number
  status: KnowledgeStatus
  progress: number
  updatedAt: string
}

// 里程碑
export interface Milestone {
  id: string
  title: string
  description?: string
  targetDate?: string | null
  progress: number
  status: 'pending' | 'in_progress' | 'completed'
  type?: string
}

// 学习里程碑响应
export interface CourseMilestones {
  courseId: string
  courseName: string
  milestones: Milestone[]
  achievedCount: number
  totalCount: number
  overallProgress: number
}

// 课程进度概览项
export interface CourseProgressOverviewItem {
  courseId: string
  courseName: string
  totalChapters: number
  totalKnowledgePoints: number
  completedKnowledgePoints: number
  progress: number
  status: CourseStatus
}

// 所有课程进度概览
export interface CourseProgressOverview {
  coursesCount: number
  overallProgress: number
  totalKnowledgePoints: number
  completedKnowledgePoints: number
  courses: CourseProgressOverviewItem[]
}

// ========== P4 - 复习计划类型 ==========

// 复习计划项
export interface ReviewPlanItem {
  type: 'new' | 'review'
  knowledgePointId: string
  knowledgePointName: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  estimatedTime: number
  masteryScore?: number
}

// 每日复习计划
export interface DailyReviewPlan {
  date: string
  items: ReviewPlanItem[]
  totalTime: number
}

// 复习策略
export interface ReviewStrategy {
  method: string
  intervals: number[]
  description?: string
}

// 复习计划
export interface ReviewPlan {
  courseId: string
  courseName: string
  planStartDate: string
  planEndDate: string
  totalReviewItems: number
  estimatedDailyTime: number
  dailyPlan: DailyReviewPlan[]
  reviewStrategy: ReviewStrategy
}

// 复习计划请求
export interface GenerateReviewPlanRequest {
  courseId: string
  days?: number
  dailyReviewTime?: number
  focusAreas?: string[]
  includeNewKnowledge?: boolean
}

// 今日复习任务项
export interface TodayReviewItem {
  id: string
  knowledgePointId?: string
  knowledgePointName?: string
  courseName: string
  courseId: string
  courseStatus: string
  type: 'new' | 'weak_point' | 'review' | 'consolidation' | 'CHAPTER_REVIEW' | 'MOCK_EXAM' | 'WEAK_POINT'
  reason: string
  estimatedTime: number
  restTime: number
  masteryScore?: number
  source: 'exam_task' | 'dynamic'
  examTaskId?: string
}

// 今日复习任务
export interface TodayReview {
  date: string
  dailyGoal: number
  totalItems: number
  totalTime: number
  totalRestTime: number
  totalTaskAndRestTime: number
  coveredCourses: number
  schedule: SchedulePreferences
  courses: Array<{
    courseId: string
    courseName: string
    courseStatus: string
    daysUntilExam: number
    taskCount: number
    taskTypes: string[]
  }>
  items: TodayReviewItem[]
}

// 复习完成请求
export interface CompleteReviewRequest {
  difficulty?: 'easy' | 'medium' | 'hard'
  timeSpent?: number
  notes?: string
}

// 复习完成响应
export interface CompleteReviewResponse {
  knowledgePointId: string
  knowledgePointName: string
  previousMasteryScore: number
  currentMasteryScore: number
  status: KnowledgeStatus
  masteryDelta: number
  difficulty: string
  timeSpent: number
  nextReviewDate: string
  nextReviewReason: string
  updatedAt: string
}

// 复习统计
export interface ReviewStatistics {
  period: {
    start: string
    end: string
  }
  statistics: {
    totalReviewedThisWeek: number
    masteredThisWeek: number
    weakPointsRemaining: number
    averageImprovement: number
  }
  todayProgress: {
    targetItems: number
    completedItems: number
    completionRate: number
  }
  upcomingReviews: Array<{
    date: string
    interval: string
    estimatedItems: number
  }>
}

// 课程复习计划状态汇总
export interface ReviewStatusSummary {
  mastered: number
  learning: number
  weak: number
  needReview: number
  notStarted: number
}

// 课程复习计划即将复习项
export interface UpcomingReviewItem {
  knowledgePointId: string
  name: string
  masteryScore: number
  lastReviewed: string
  nextReviewDate: string
  daysUntilNextReview: number
  priority: 'high' | 'medium' | 'low'
}

// 课程复习计划
export interface CourseReview {
  courseId: string
  courseName: string
  totalKnowledgePoints: number
  statusSummary: ReviewStatusSummary
  upcomingReviewsThisWeek: UpcomingReviewItem[]
  reviewPriority: {
    high: number
    medium: number
  }
}

// ========== P4 - 分析类型 ==========

// 知识点关联
export interface KnowledgeCorrelation {
  sourceId: string
  sourceName: string
  targetId: string
  targetName: string
  correlation: number
  relationType: string
  reason: string
}

// 知识点集群
export interface KnowledgeCluster {
  name: string
  knowledgePoints: string[]
  centralPoint: string
  pointCount: number
}

// 知识点关联度响应
export interface KnowledgeCorrelationResponse {
  courseId: string
  courseName: string
  totalKnowledgePoints: number
  totalCorrelations: number
  correlationMatrix: KnowledgeCorrelation[]
  clusters: KnowledgeCluster[]
}

// 学习顺序项
export interface LearningSequenceItem {
  order: number
  knowledgePointId: string
  name: string
  chapterName: string
  status: KnowledgeStatus
  masteryScore: number
  importance?: number
  prerequisites: string[]
  reason: string
  estimatedTime: number
}

// 学习顺序响应
export interface LearningSequenceResponse {
  courseId: string
  courseName: string
  totalKnowledgePoints: number
  masteredPoints: number
  suggestedSequence: LearningSequenceItem[]
  totalEstimatedTime: number
  skipableTime: number
  effectiveTime: number
  learningStrategy: {
    method: string
    description: string
  }
}

// 瓶颈阻塞项
export interface BottleneckBlocker {
  blockerPoint: string
  blockerStatus?: KnowledgeStatus
  blockerScore?: number
  impact: number
  suggestion: string
}

// 知识点瓶颈
export interface Bottleneck {
  knowledgePointId: string
  name: string
  chapterName: string
  difficulty: 'easy' | 'medium' | 'hard'
  bottleneckScore: number
  blockers: BottleneckBlocker[]
  recommendedPrerequisites: string[]
  reasons: string[]
}

// 瓶颈分析摘要
export interface AnalysisSummary {
  totalBottlenecks: number
  mainReasons: {
    weakPrerequisites: number
    lowMastery: number
    manyMistakes: number
  }
}

// 瓶颈分析响应
export interface BottleneckResponse {
  courseId: string
  courseName: string
  totalKnowledgePoints: number
  bottleneckCount: number
  difficultyStats: {
    hard: number
    medium: number
    easy: number
  }
  bottlenecks: Bottleneck[]
  analysisSummary: AnalysisSummary
}

// 评估维度分数
export interface EvaluationDimensionScore {
  score: number
  rating: string
  details: string
}

// 评估报告周期
export interface ReportPeriod {
  start: string
  end: string
  timeRange: string
}

// 学习评估报告
export interface LearningEvaluation {
  courseId: string
  courseName: string
  reportPeriod: ReportPeriod
  overallScore: number
  grade: 'S' | 'A' | 'B' | 'C' | 'D'
  dimensions: {
    studyTime: EvaluationDimensionScore
    knowledgeMastery: EvaluationDimensionScore
    practice: EvaluationDimensionScore
    review: EvaluationDimensionScore
  }
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  trend: 'improving' | 'stable' | 'declining'
  generatedAt: string
}

// 评估请求
export interface GenerateEvaluationRequest {
  courseId: string
  timeRange?: 'week' | 'month' | 'semester'
  includeDetails?: boolean
}

// 学习效率指标
export interface EfficiencyMetrics {
  timePerPoint: number
  retentionRate: number
  sessionsPerDay: number
  averageSessionLength: number
}

// 学习模式
export interface StudyPatterns {
  preferredTime: 'morning' | 'afternoon' | 'late_afternoon' | 'evening' | 'night'
  averageSessionLength: number
  sessionsPerDay: number
  totalStudyDays?: number
  totalSessions?: number
  mostProductiveDay?: string
}

// 学习效率分析
export interface LearningEfficiency {
  courseId: string
  courseName: string
  efficiencyScore: number
  metrics: EfficiencyMetrics
  studyPatterns: StudyPatterns
  recommendations: string[]
}

// 对比分析维度
export interface DimensionComparison {
  dimension: string
  classAverage: number
  yourScore: number
  difference: string
}

// 对比分析
export interface ComparisonAnalysis {
  courseId: string
  courseName: string
  comparison: {
    classAverage: number
    yourScore: number
    percentile: number
    rank: number
    totalStudents: number
    level: string
  }
  dimensionComparison: DimensionComparison[]
  note?: string
}

// ========== P5 - 用户认证类型 ==========

// 用户角色
export type UserRole = 'USER' | 'ADMIN'

// 用户信息
export interface User {
  id: string
  username: string
  email: string
  displayName?: string
  role: UserRole
  preferences?: UserPreferences
  createdAt: string
  updatedAt?: string
}

// 用户偏好设置
export interface UserPreferences {
  learning?: LearningPreferences
  notifications?: NotificationPreferences
  ai?: AIPreferences
  display?: DisplayPreferences
}

// 学习偏好
export interface LearningPreferences {
  dailyGoal: number  // 每日学习目标（分钟）
  weeklyGoal: number
  targetGrade?: TargetGrade
  examDate?: string | null
}

// 通知偏好
export interface NotificationPreferences {
  studyReminder: boolean
  reviewReminder: boolean
  examReminder: boolean
  reminderTime: string  // HH:mm
}

// AI 偏好
export interface AIPreferences {
  autoExplain: boolean
  autoSuggest: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}

// 显示偏好
export interface DisplayPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
}

// 学习计划时间段偏好
export interface SchedulePreferences {
  enabled: boolean
  morning: {
    start: string  // HH:mm 格式，如 "09:00"
    end: string   // HH:mm 格式，如 "12:00"
  }
  afternoon: {
    start: string  // HH:mm 格式
    end: string   // HH:mm 格式
  }
  evening: {
    start: string  // HH:mm 格式
    end: string   // HH:mm 格式
  }
}

// 认证响应（包含 token）
export interface AuthResponse {
  user: User
  token: string
}

// 注册请求
export interface RegisterRequest {
  username: string
  email: string
  password: string
  displayName?: string
}

// 登录请求
export interface LoginRequest {
  email: string
  password: string
}

// 修改密码请求
export interface UpdatePasswordRequest {
  currentPassword: string
  newPassword: string
}

// 更新用户信息请求
export interface UpdateProfileRequest {
  displayName?: string
  preferences?: UserPreferences
}

// 用户列表响应（管理员）
export interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// ========== P5 - 个性化推荐类型 ==========

// 推荐项类型
export type RecommendedItemType = 'knowledge_point' | 'resource'

// 推荐优先级
export type RecommendationPriority = 'high' | 'medium' | 'low'

// 推荐项
export interface RecommendedItem {
  type: RecommendedItemType
  id: string
  name: string
  courseName?: string
  chapterName?: string
  status?: KnowledgeStatus
  masteryScore?: number
  reason: string
  priority: RecommendationPriority
  estimatedTime: number
}

// 每日推荐
export interface DailyRecommendation {
  date: string
  recommendedItems: RecommendedItem[]
  focusAreas: string[]
  statistics?: {
    totalStudyTime: number
    studyDays: number
    masteredPoints: number
    weakPoints: number
  }
  generatedAt: string
}

// 学习路径项
export interface LearningPathItem {
  order: number
  type: 'review' | 'new'
  knowledgePointId: string
  name: string
  chapterName?: string
  status?: KnowledgeStatus
  masteryScore?: number
  priority: RecommendationPriority
  reason: string
}

// 学习路径
export interface LearningPath {
  courseId: string
  courseName: string
  totalPoints: number
  masteredPoints: number
  recommendedPath: LearningPathItem[]
  estimatedTotalTime: number
  learningStrategy?: {
    method: string
    description: string
  }
}

// 推荐资源项
export interface RecommendedResource {
  type: string
  id: string
  name: string
  description?: string
  relevance?: number
  url?: string
}

// 推荐资源响应
export interface RecommendedResourcesResponse {
  knowledgePointId: string
  knowledgePointName: string
  courseName?: string
  currentStatus?: {
    status: KnowledgeStatus
    masteryScore: number
    importance?: number
  }
  resources: RecommendedResource[]
  summary?: {
    totalResources: number
    relatedPoints: number
    studyRecords: number
    mistakeRelated: number
  }
}

// 推荐反馈请求
export interface RecommendationFeedbackRequest {
  itemId: string
  itemType: 'knowledge_point' | 'resource' | 'learning_path'
  action: 'view' | 'complete' | 'skip' | 'helpful' | 'not_helpful'
  feedback?: string
}

// 推荐反馈响应
export interface RecommendationFeedbackResponse {
  itemId: string
  itemType: string
  action: string
  message: string
  recordedAt: string
}

// 热门推荐项
export interface PopularRecommendation {
  type: 'knowledge_point'
  id: string
  name: string
  courseName: string
  chapterName?: string
  studyCount: number
  mistakeCount?: number
  masteryScore?: number
  hotScore: number
}

// 热门推荐响应
export interface PopularRecommendationsResponse {
  period: string
  popularItems: PopularRecommendation[]
  generatedAt: string
}

// ========== P5 - 学习提醒类型 ==========

// 提醒类型
export type ReminderType = 'study_time' | 'review' | 'exam' | 'goal'

// 提醒状态
export type ReminderStatus = 'pending' | 'completed' | 'cancelled'

// 重复模式
export type RecurringPattern = 'daily' | 'weekly' | 'weekdays'

// 重复设置
export interface RecurringSettings {
  enabled: boolean
  pattern?: RecurringPattern
  daysOfWeek?: number[]
}

// 提醒
export interface Reminder {
  id: string
  userId?: string
  type: ReminderType
  title: string
  message?: string
  scheduledAt: string
  scheduledTime?: string  // HH:mm 格式
  recurring?: RecurringSettings | null
  status: ReminderStatus
  completedAt?: string | null
  createdAt: string
  courseId?: string
}

// 创建提醒请求
export interface CreateReminderRequest {
  type: ReminderType
  title: string
  message?: string
  scheduledAt: string
  recurring?: RecurringSettings
  courseId?: string
}

// 更新提醒请求
export interface UpdateReminderRequest {
  title?: string
  message?: string
  scheduledAt?: string
  status?: ReminderStatus
  recurring?: RecurringSettings
}

// 提醒列表响应
export interface ReminderListResponse {
  reminders: Reminder[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 今日提醒响应
export interface TodayRemindersResponse {
  date: string
  reminders: Reminder[]
  statistics: {
    total: number
    studyTime: number
    review: number
    exam: number
    goal: number
  }
}

// 标记完成响应
export interface CompleteReminderResponse extends Reminder {
  message?: string
}

// ========== P5 - 数据导出/同步类型 ==========

// 导出数据类型
export type ExportDataType = 'courses' | 'chapters' | 'knowledge_points' | 'study_records' | 'mistakes' | 'notes'

// 导出格式
export type ExportFormat = 'json' | 'csv'

// 导出数据类型
export interface ExportDataRequest {
  format: ExportFormat
  dataTypes: ExportDataType[]
  timeRange?: {
    start: string
    end: string
  }
}

// 导出信息
export interface ExportInfo {
  format: ExportFormat
  dataTypes: ExportDataType[]
  timeRange?: {
    start: string
    end: string
  }
  exportedAt: string
}

// 导出数据统计
export interface ExportStatistics {
  totalRecords: number
  breakdown: Record<string, number>
}

// 导出数据响应
export interface ExportDataResponse {
  exportInfo: ExportInfo
  statistics: ExportStatistics
  data: Record<string, unknown[]>
  downloadUrl?: string
}

// 导出报告请求
export interface ExportReportRequest {
  courseId: string
  format?: 'json' | 'pdf'
  include?: ('progress' | 'statistics' | 'evaluation' | 'recommendations')[]
}

// 导出报告响应
export interface ExportReportResponse {
  course: Course
  progress: {
    chapters: Array<{
      id: string
      name: string
      order: number
      totalPoints: number
      masteredPoints: number
      progress: number
    }>
    overall: {
      totalChapters: number
      totalKnowledgePoints: number
      masteredPoints: number
      progress: number
    }
  }
  statistics: {
    totalStudyTime: number
    studyDays: number
    averageSessionLength: number
    totalMistakes: number
    mistakeRate: number
  }
  evaluation: {
    averageMasteryScore: number
    grade: TargetGrade
    status: {
      mastered: number
      learning: number
      weak: number
      notStarted: number
    }
  }
  recommendations: {
    priorityTopics: string[]
    suggestions: string[]
  }
  metadata: {
    generatedAt: string
    courseId: string
    format: string
  }
}

// 设备信息
export interface DeviceInfo {
  deviceId: string
  deviceName: string
  lastActive: string
  platform?: string
}

// 同步设置
export interface SyncSettings {
  autoSync: boolean
  syncInterval: number
  lastSuccessfulSync: string
}

// 同步状态
export interface SyncStatus {
  lastSyncAt: string
  syncStatus: 'synced' | 'syncing' | 'pending' | 'error'
  pendingChanges: number
  devices: DeviceInfo[]
  syncSettings: SyncSettings
}

// 触发同步请求
export interface TriggerSyncRequest {
  force?: boolean
}

// 同步结果统计
export interface SyncStats {
  courses: number
  chapters: number
  knowledgePoints: number
  studyRecords: number
  mistakes: number
  timeMarks: number
}

// 同步变化
export interface SyncChanges {
  uploaded: number
  downloaded: number
  conflicts: number
}

// 触发同步响应
export interface TriggerSyncResponse {
  syncId: string
  status: string
  startedAt: string
  completedAt?: string
  stats: SyncStats
  changes: SyncChanges
  message: string
}

// 合并策略
export type MergeStrategy = 'merge' | 'replace'

// 导入数据请求
export interface ImportDataRequest {
  format: ExportFormat
  mergeStrategy: MergeStrategy
  data: {
    courses?: unknown[]
    chapters?: unknown[]
    knowledgePoints?: unknown[]
    studyRecords?: unknown[]
    mistakes?: unknown[]
  }
}

// 导入统计
export interface ImportStatistics {
  imported: Record<string, number>
  skipped: Record<string, number>
  errors: string[]
}

// 导入响应
export interface ImportDataResponse {
  imported: Record<string, number>
  skipped: Record<string, number>
  errors: string[]
}

// ========== P5 - 用户设置类型 ==========

// 用户设置响应
export interface UserSettingsResponse {
  userId: string
  username: string
  email: string
  displayName: string
  learning: LearningPreferences
  notifications: NotificationPreferences
  ai: AIPreferences
  display: DisplayPreferences
  schedule: SchedulePreferences
}

// 更新设置请求
export interface UpdateSettingsRequest {
  displayName?: string
  learning?: Partial<LearningPreferences>
  notifications?: Partial<NotificationPreferences>
  ai?: Partial<AIPreferences>
  display?: Partial<DisplayPreferences>
  schedule?: Partial<SchedulePreferences>
}

// 默认设置响应
export interface DefaultSettingsResponse {
  learning: LearningPreferences
  notifications: NotificationPreferences
  ai: AIPreferences
  display: DisplayPreferences
  schedule: SchedulePreferences
}

// ========== P5 - 复习计划增强类型 ==========

// 任务重排请求
export interface ReplanRequest {
  courseId: string
  completedTaskIds?: string[]
  skipTaskIds?: string[]
  remainingDays?: number
  currentDay?: number
}

// 重排摘要
export interface ReplanSummary {
  movedTasks: number
  removedTasks: number
  message: string
}

// 重排响应
export interface ReplanResponse {
  courseId: string
  courseName: string
  originalTotalTasks: number
  completedTasks: number
  skippedTasks: number
  pendingTasks: number
  replannedDays: number
  replannedPlan: DailyReviewPlan[]
  summary: ReplanSummary
}

// 多学科优化请求
export interface OptimizeRequest {
  courseIds: string[]
  dailyStudyHours?: number
  preferences?: {
    morningFocus?: string[]
  }
}

// 课程分析
export interface CourseAnalysis {
  courseId: string
  courseName: string
  totalKnowledgePoints: number
  weakPoints: number
  notMastered: number
  daysUntilExam?: number
  priority: 'high' | 'medium' | 'low'
}

// 每日分配
export interface DailyAllocation {
  courseId: string
  courseName: string
  allocatedHours: number
  estimatedDays: number
  priority: 'high' | 'medium' | 'low'
  weakPoints: number
  notMastered: number
}

// 优化日程
export interface OptimizedSchedule {
  [date: string]: {
    courses: Array<{
      courseId: string
      courseName: string
      hours: number
      focus: string
      tasks: string[]
    }>
    totalHours: number
  }
}

// 优化摘要
export interface OptimizeSummary {
  totalCourses: number
  totalDailyHours: number
  totalKnowledgePoints: number
  totalWeakPoints: number
  averageDaysUntilExam: number
}

// 优化响应
export interface OptimizeResponse {
  courseAnalysis: CourseAnalysis[]
  dailyAllocation: DailyAllocation[]
  optimizedSchedule: OptimizedSchedule
  warnings: string[]
  summary: OptimizeSummary
}

// ========== P6 - 题目管理类型 ==========

// 题目类型
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY'

// 题目状态
export type QuestionStatus = 'ACTIVE' | 'INACTIVE' | 'REVIEW'

// 题目
export interface Question {
  id: string
  courseId: string
  chapterId?: string
  knowledgePointId?: string
  type: QuestionType
  content: string
  options?: Record<string, string>[]
  answer: Record<string, unknown>
  explanation?: string
  difficulty: number
  score: number
  timeLimit?: number
  tags?: string[]
  source?: string
  usedCount: number
  correctRate: number
  status: QuestionStatus
  createdAt: string
  updatedAt: string
  course?: Course
  chapter?: Chapter
  knowledgePoint?: KnowledgePoint
}

// 题目筛选条件
export interface QuestionFilters {
  courseId?: string
  chapterId?: string
  type?: QuestionType
  difficulty?: number
  status?: QuestionStatus
  search?: string
  page?: number
  pageSize?: number
}

// 题目列表响应
export interface QuestionListResponse {
  questions: Question[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 创建题目请求
export interface CreateQuestionRequest {
  courseId: string
  chapterId?: string
  knowledgePointId?: string
  type: QuestionType
  content: string
  options?: Record<string, string>[]
  answer: Record<string, unknown>
  explanation?: string
  difficulty?: number
  score?: number
  timeLimit?: number
  tags?: string[]
  source?: string
}

// 更新题目请求
export interface UpdateQuestionRequest {
  content?: string
  options?: Record<string, string>[]
  answer?: Record<string, unknown>
  explanation?: string
  difficulty?: number
  score?: number
  timeLimit?: number
  tags?: string[]
  status?: QuestionStatus
}

// 批量导入请求
export interface ImportQuestionsRequest {
  courseId: string
  questions: Partial<CreateQuestionRequest>[]
}

// 批量导入响应
export interface ImportQuestionsResponse {
  imported: number
  skipped: number
  errors: number
  details: {
    imported: string[]
    skipped: string[]
    errors: string[]
  }
}

// 导出请求
export interface ExportQuestionsRequest {
  courseId?: string
  format?: 'json' | 'csv'
}

// 导出响应
export interface ExportQuestionsResponse {
  exportInfo: {
    format: string
    courseId?: string
    totalQuestions: number
    exportedAt: string
  }
  questions: Question[]
}

// ========== P6 - 考试与练习类型 ==========

// 考试会话类型
export type ExamSessionType = 'MOCK_EXAM' | 'PRACTICE' | 'RANDOM_TEST' | 'AI_GENERATED'

// 考试会话状态
export type ExamSessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'

// 考试会话
export interface ExamSession {
  id: string
  userId: string
  courseId?: string
  type: ExamSessionType
  title: string
  description?: string
  questionIds?: string[]
  totalQuestions: number
  totalScore?: number
  answeredCount: number
  correctCount: number
  score?: number
  startedAt: string
  completedAt?: string
  status: ExamSessionStatus
  course?: Course
  questions?: Question[]
}

// 答题记录
export interface AnswerRecord {
  id: string
  userId: string
  questionId: string
  examSessionId?: string
  userAnswer: string
  isCorrect: boolean
  timeSpent?: number
  answeredAt: string
  aiAnalysis?: string
  suggestedReview?: string
  question?: Question
}

// 答题记录列表响应
export interface AnswerRecordListResponse {
  records: AnswerRecord[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// 组卷配置
export interface ExamGenerateConfig {
  totalQuestions: number
  totalScore?: number
  difficulty: {
    easy: number
    medium: number
    hard: number
  }
  typeDistribution?: Partial<Record<QuestionType, number>>
  knowledgePointCoverage?: number
  includeOldMistakes?: boolean
  timeLimit?: number
}

// AI组卷请求
export interface GenerateExamRequest {
  courseId: string
  title: string
  description?: string
  config: ExamGenerateConfig
}

// AI组卷响应
export interface GenerateExamResponse {
  examSessionId: string
  title: string
  questions: Question[]
  totalQuestions: number
  totalScore: number
  timeLimit?: number
  generatedAt: string
}

// 条件组卷请求
export interface GenerateByFiltersRequest {
  courseId: string
  questionCount: number
  chapterIds?: string[]
  knowledgePointIds?: string[]
  types?: QuestionType[]
  difficultyRange?: [number, number]
  randomOrder?: boolean
  title?: string
}

// 随机抽题请求
export interface RandomDrawRequest {
  courseId: string
  count: number
  excludeIds?: string[]
  filters?: {
    type?: QuestionType
    difficulty?: [number, number]
    knowledgePointId?: string
  }
}

// 随机抽题响应
export interface RandomDrawResponse {
  questions: Question[]
  count: number
}

// 挑战模式类型
export type ChallengeMode = 'speed' | 'accuracy' | 'endurance'

// 挑战模式请求
export interface ChallengeRequest {
  courseId: string
  mode: ChallengeMode
  count?: number
}

// 挑战模式响应
export interface ChallengeResponse {
  sessionId: string
  mode: ChallengeMode
  questions: Question[]
  totalQuestions: number
  timeLimit?: number
  startedAt: string
}

// 每日一练响应
export interface DailyPracticeResponse {
  date: string
  question: Question
  streak: number
  totalAnswered: number
  correctRate: number
}

// 创建会话请求
export interface CreateSessionRequest {
  type: ExamSessionType
  courseId?: string
  title: string
  questionIds?: string[]
}

// 提交答案请求
export interface SubmitAnswerRequest {
  questionId: string
  userAnswer: string
  timeSpent?: number
}

// 提交答案响应
export interface SubmitAnswerResponse {
  isCorrect: boolean
  correctAnswer: string
  explanation?: string
  score: number
  aiAnalysis?: string
  streak: number
}

// 交卷响应
export interface SubmitExamResponse {
  id: string
  type: ExamSessionType
  title: string
  totalQuestions: number
  answeredCount: number
  correctCount: number
  score: number
  status: ExamSessionStatus
  completedAt: string
}

// 答题统计 - 按题型
export interface StatisticsByType {
  total: number
  correct: number
  rate: number
}

// 答题统计 - 按难度
export interface StatisticsByDifficulty {
  total: number
  correct: number
  rate: number
}

// 薄弱知识点
export interface WeakArea {
  knowledgePointId: string
  name: string
  correctRate: number
}

// 答题趋势
export interface StatisticsTrend {
  date: string
  correctRate: number
}

// 答题统计响应
export interface ExamStatisticsResponse {
  totalAnswered: number
  correctCount: number
  correctRate: number
  averageTime: number
  byType: Record<QuestionType, StatisticsByType>
  byDifficulty: Record<string, StatisticsByDifficulty>
  weakAreas: WeakArea[]
  trend: StatisticsTrend[]
}

// 错题
export interface Mistake {
  questionId: string
  content: string
  options?: Record<string, string>[]
  userAnswer: string
  correctAnswer: string
  wrongCount: number
  lastAnsweredAt: string
  knowledgePointId?: string
  knowledgePointName?: string
}

// 错题统计
export interface MistakeStatistics {
  total: number
  reviewed: number
  notReviewed: number
}

// 错题本响应
export interface MistakesResponse {
  mistakes: Mistake[]
  statistics: MistakeStatistics
}

// 错题重做请求
export interface RetryMistakesRequest {
  knowledgePointId?: string
  count?: number
}

// 错题重做响应
export interface RetryMistakesResponse {
  sessionId: string
  title: string
  questions: Question[]
  totalQuestions: number
  startedAt: string
}

// 个性化练习请求
export interface PersonalizedPracticeRequest {
  courseId: string
  count?: number
  difficulty?: number
  focusAreas?: string[]
}

// 个性化练习响应
export interface PersonalizedPracticeResponse {
  sessionId: string
  title: string
  questions: Question[]
  totalQuestions: number
  startedAt: string
}
