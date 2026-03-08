// =====================================================
// API 类型定义
// =====================================================

// Re-export all types from src/types/api
// Use re-export with 'type' keyword to avoid value conflicts
export * from './src/types/api'
export type { User as UserType } from './src/types/api'

// 通用响应类型
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

// 分页类型
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

// 文件上传类型
export interface UploadedFile {
  filename: string
  originalName: string
  size: number
  mimetype: string
  url: string
}

// 课程类型
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

// 章节类型
export interface Chapter {
  id: string
  courseId: string
  name: string
  order: number
  description?: string
  createdAt: string
  updatedAt: string
}

// 知识点类型
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

// 学习记录类型
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

// 时间标记类型
export type TimeMarkType = 'START' | 'END' | 'EMPHASIS' | 'BOARD_CHANGE' | 'NOTE' | 'QUESTION'

export interface TimeMarkData {
  pptPage?: number
  noteText?: string
  imageUrl?: string
}

export interface TimeMark {
  id: string
  studyRecordId: string
  timestamp: number  // 后端是毫秒
  type: TimeMarkType
  data?: TimeMarkData
  pptPage?: number
  content?: string  // 后端用 content 字段
  imageUrl?: string
  knowledgePointId?: string
  createdAt: string
  updatedAt?: string
  knowledgePoint?: KnowledgePoint
  studyRecord?: {
    id: string
    title: string
  }
}

// 回溯数据类型
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

// =====================================================
// 应用类型定义
// =====================================================

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  COURSES = 'COURSES',
  CHAPTER_MANAGER = 'CHAPTER_MANAGER',
  KNOWLEDGE_MANAGER = 'KNOWLEDGE_MANAGER',
  AGENT = 'AGENT',
  DRILL = 'DRILL',
  TIME_MACHINE = 'TIME_MACHINE',
  RECORDER = 'RECORDER',
  COURSE_DETAIL_REVIEW = 'COURSE_DETAIL_REVIEW',
  COURSE_DETAIL_STUDY = 'COURSE_DETAIL_STUDY',
  ANALYSIS = 'ANALYSIS',
  PRACTICE_LIST = 'PRACTICE_LIST',
  // P5 - 用户系统
  AUTH = 'AUTH',
  SETTINGS = 'SETTINGS',
  // P6 - 智能组卷与测评
  EXAM = 'EXAM',
  EXAM_RESULT = 'EXAM_RESULT',
  MISTAKES = 'MISTAKES',
}

export interface Task {
  id: string;
  courseName: string;
  title: string;
  duration: string;
  status: 'pending' | 'in-progress' | 'completed';
  type: 'review' | 'quiz' | 'paper' | 'mistake';
  tag: string; // e.g. "一轮复习"
}

export interface TaskGroup {
  courseId: string;
  courseName: string;
  tag: string;
  tagColor: 'red' | 'orange' | 'blue';
  progress: string;
  tasks: Task[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface TranscriptSegment {
  time: number; // seconds
  text: string;
  isKeypoint?: boolean;
}
