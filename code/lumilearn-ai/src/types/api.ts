// =====================================================
// LumiTrace AI - TypeScript 类型定义
// =====================================================

// ========== 通用响应类型 ==========
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
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
export type KnowledgeStatus = 'MASTERED' | 'WEAK' | 'NEED_REVIEW' | 'TODAY_REVIEW'

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
