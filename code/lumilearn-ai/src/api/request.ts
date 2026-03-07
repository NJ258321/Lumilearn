// =====================================================
// LumiTrace AI - API 请求封装
// =====================================================

import type { ApiResponse } from '../types'

// 全局配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 导入错误处理
import { getErrorMessage, isNetworkError } from './errorMessages'

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

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      const data = await response.json()

      // 处理业务层错误
      if (!response.ok || !data.success) {
        // 尝试从响应中获取错误码
        const errorCode = data.code
        const originalError = data.error
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
      headers: {}, // 不设置 Content-Type，让浏览器自动处理
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
  },
} as const
