// =====================================================
// LumiTrace AI - API 请求封装
// =====================================================

import type { ApiResponse } from '../types'

// 全局配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 导入错误处理
import { getErrorMessage, isNetworkError } from './errorMessages'

// Token 存储 key
const TOKEN_KEY = 'lumilearn_token'

// 获取本地存储的 token
function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * API 客户端类
 * 统一处理所有 HTTP 请求、错误响应和状态码
 */
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  /**
   * 核心请求方法
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    console.log('[API Request] URL:', url, 'Method:', options.method || 'GET')

    try {
      // 提取自定义 headers，移除内部的 _skipDefaultContentType 标记
      const customHeaders = (options.headers as Record<string, string>) || {}
      const skipDefaultContentType = (customHeaders as any)._skipDefaultContentType
      const sanitizedHeaders = { ...customHeaders }
      delete (sanitizedHeaders as any)._skipDefaultContentType

      // 只有当没有明确设置 Content-Type 且不是跳过默认时才添加 JSON 头
      const hasContentType = Object.keys(sanitizedHeaders).some(k => k.toLowerCase() === 'content-type')

      // 获取 token 并添加到请求头
      const token = getToken()
      console.log('[API Request] Token:', token ? `${token.substring(0, 20)}...` : 'null')
      const authHeaders: Record<string, string> = {}
      if (token) {
        authHeaders['Authorization'] = `Bearer ${token}`
      }

      const headers = hasContentType || skipDefaultContentType
        ? { ...sanitizedHeaders, ...authHeaders }
        : { ...sanitizedHeaders, 'Content-Type': 'application/json', ...authHeaders }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      // 处理业务层错误
      if (!response.ok || !data.success) {
        // 尝试从响应中获取错误码
        const errorCode = data.code
        // 处理 error 可能是对象或字符串的情况
        const originalError = typeof data.error === 'string' ? data.error : data.error?.message
        // 使用错误码映射转换为友好提示
        const friendlyError = getErrorMessage(errorCode, originalError)

        return {
          success: false,
          error: friendlyError,
          code: errorCode,
          details: data.details,
        }
      }

      return data as ApiResponse<T>
    } catch (error: unknown) {
      // 处理网络错误
      console.error('[API Error]', error)

      let errorMessage = '网络错误，请检查网络连接'
      if (isNetworkError(error)) {
        errorMessage = '无法连接到服务器，请检查网络连接'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * GET 请求
   */
  async get<T>(endpoint: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params as Record<string, string>).toString()}`
      : endpoint
    return this.request<T>(url, { method: 'GET' })
  }

  /**
   * POST 请求
   */
  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * POST FormData 请求（用于文件上传）
   */
  async postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
      headers: { _skipDefaultContentType: true } as any, // 跳过默认的 JSON Content-Type，让浏览器自动处理 multipart/form-data
    })
  }

  /**
   * PUT 请求
   */
  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PATCH 请求
   */
  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETE 请求
   */
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// 导出默认 API 实例
export const api = new ApiClient(API_BASE_URL)

// 导出类以便扩展
export { ApiClient }

// 导出错误处理工具函数
export { getErrorMessage, isNetworkError, ERROR_MESSAGES } from './errorMessages'
export type { ErrorCode } from './errorMessages'

// 导出配置常量
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  endpoints: {
    // 课程
    courses: '/api/courses',
    // 章节
    chapters: '/api/chapters',
    // 知识点
    knowledgePoints: '/api/knowledge-points',
    weakPoints: '/api/knowledge-points/weak',
    recentlyReviewed: '/api/knowledge-points/recently-reviewed',
    // 学习记录
    studyRecords: '/api/study-records',
    studyRecordsSearch: '/api/study-records/search',
    // 时间标记
    timeMarks: '/api/time-marks',
    // 文件上传
    uploadAudio: '/api/upload/audio',
    uploadImage: '/api/upload/image',
    uploadDocument: '/api/upload/document',
    uploadBase: '/api/upload',
    // 音频处理
    audioMetadata: '/api/audio',  // :id/metadata
    audioTranscribe: '/api/audio',  // :id/transcribe
    audioTranscribeStatus: '/api/audio/transcribe/status',
    audioSegment: '/api/audio',  // :id/segment
    // 知识关系
    knowledgeRelations: '/api/knowledge-relations',
    knowledgeRelationsBatch: '/api/knowledge-relations/batch',
    // AI服务
    aiExplain: '/api/ai/explain',
    aiSuggest: '/api/ai/suggest',
    aiAnalyzeWeakPoints: '/api/ai/analyze-weak-points',
    aiSearchResources: '/api/ai/search-resources',
    audioVad: '/api/audio',  // :id/vad
    audioVadStatus: '/api/audio/vad/status',
    // P4 - 学习数据统计
    statistics: {
      courseOverview: '/api/statistics/course',  // :courseId/overview
      knowledgePointsMastery: '/api/statistics/knowledge-points',  // :courseId/mastery
      activities: '/api/statistics/activities',
      chapterSummary: '/api/statistics/chapter',  // :chapterId/summary
      dashboard: '/api/statistics/dashboard',
    },
    // P4 - 学习进度追踪
    progress: {
      course: '/api/progress/course',  // :courseId
      knowledgePoint: '/api/progress/knowledge-point',  // :id
      updateStatus: '/api/progress/knowledge-point',  // :id/status
      recordProgress: '/api/progress/knowledge-point',  // :id/progress
      milestones: '/api/progress/milestones',  // :courseId
      overview: '/api/progress/overview',
    },
    // P4 - 复习计划
    review: {
      generatePlan: '/api/review/generate-plan',
      today: '/api/review/today',
      complete: '/api/review',  // :knowledgePointId/complete
      statistics: '/api/review/statistics',
      course: '/api/review/course',  // :courseId
      dailyReviewOverview: '/api/daily-review/overview',
    },
    // P4 - 数据分析
    analysis: {
      knowledgeCorrelation: '/api/analysis/knowledge-points',  // :courseId/correlation
      learningSequence: '/api/analysis/learning-sequence',  // :courseId
      bottlenecks: '/api/analysis/bottlenecks',  // :courseId
      evaluate: '/api/analysis/evaluate',
      efficiency: '/api/analysis/efficiency',  // :courseId
      compare: '/api/analysis/compare',  // :courseId
    },
    // P5 - 用户认证
    auth: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      me: '/api/auth/me',
      profile: '/api/auth/profile',
      password: '/api/auth/password',
      users: '/api/auth/users',  // 管理员
      userRole: '/api/auth/users',  // :id/role
    },
    // P5 - 个性化推荐
    recommendations: {
      daily: '/api/recommendations/daily',
      learningPath: '/api/recommendations/learning-path',  // :courseId
      resources: '/api/recommendations/resources',  // :knowledgePointId
      feedback: '/api/recommendations/feedback',
      popular: '/api/recommendations/popular',
    },
    // P5 - 学习提醒
    reminders: {
      base: '/api/reminders',
      today: '/api/reminders/today',
      complete: '/api/reminders',  // :id/complete
      batchDelete: '/api/reminders/batch-delete',
    },
    // P5 - 数据导出
    export: {
      data: '/api/export/data',
      report: '/api/export/report',
    },
    // P5 - 数据同步
    sync: {
      status: '/api/sync/status',
      trigger: '/api/sync/trigger',
    },
    // P5 - 数据导入
    import: {
      data: '/api/import/data',
    },
    // P5 - 用户设置
    settings: {
      base: '/api/settings',
      default: '/api/settings/default',
    },
    // P5 - 复习计划增强
    reviewEnhance: {
      replan: '/api/review/replan',
      optimize: '/api/review/optimize',
    },
    // P6 - 题目管理
    questions: {
      list: '/api/questions',
      detail: (id: string) => `/api/questions/${id}`,
      create: '/api/questions',
      update: (id: string) => `/api/questions/${id}`,
      delete: (id: string) => `/api/questions/${id}`,
      import: '/api/questions/import',
      export: '/api/questions/export',
    },
    // P6 - 考试与练习
    exams: {
      generate: '/api/exams/generate',
      generateByFilters: '/api/exams/generate-by-filters',
      random: '/api/exams/random',
      dailyPractice: '/api/exams/daily-practice',
      challenge: '/api/exams/challenge',
      sessions: '/api/exams/sessions',
      sessionAnswers: (sessionId: string) => `/api/exams/${sessionId}/answers`,
      sessionSubmit: (sessionId: string) => `/api/exams/${sessionId}/submit`,
      records: '/api/exams/records',
      statistics: '/api/exams/statistics',
      mistakes: '/api/exams/mistakes',
      mistakesRetry: '/api/exams/mistakes/retry',
      personalizedPractice: '/api/exams/personalized-practice',
    },
  },
} as const
