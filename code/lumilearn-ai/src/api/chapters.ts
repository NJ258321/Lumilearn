// =====================================================
// 章节 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse, Chapter, PaginatedResponse, PaginationParams } from '../../types'

// 章节列表查询参数
export interface ChapterListParams extends PaginationParams {
  courseId?: string
  search?: string
}

// 创建章节请求体
export interface CreateChapterBody {
  courseId: string
  name: string
  order?: number
  description?: string
}

// 更新章节请求体
export interface UpdateChapterBody {
  name?: string
  order?: number
  description?: string
}

// 获取章节列表（后端直接返回数组）
export async function getChapterList(
  params: ChapterListParams = {}
): Promise<ApiResponse<Chapter[]>> {
  try {
    return await api.get<Chapter[]>(
      API_CONFIG.endpoints.chapters,
      params as Record<string, unknown>
    )
  } catch (error) {
    return { success: false, error: '获取章节列表失败' }
  }
}

// 获取章节详情
export async function getChapterById(id: string): Promise<ApiResponse<Chapter>> {
  try {
    return await api.get<Chapter>(`${API_CONFIG.endpoints.chapters}/${id}`)
  } catch (error) {
    return { success: false, error: '获取章节详情失败' }
  }
}

// 创建章节
export async function createChapter(
  body: CreateChapterBody
): Promise<ApiResponse<Chapter>> {
  try {
    return await api.post<Chapter>(API_CONFIG.endpoints.chapters, body)
  } catch (error) {
    return { success: false, error: '创建章节失败' }
  }
}

// 更新章节
export async function updateChapter(
  id: string,
  body: UpdateChapterBody
): Promise<ApiResponse<Chapter>> {
  try {
    return await api.put<Chapter>(`${API_CONFIG.endpoints.chapters}/${id}`, body)
  } catch (error) {
    return { success: false, error: '更新章节失败' }
  }
}

// 删除章节
export async function deleteChapter(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    return await api.delete<{ id: string }>(`${API_CONFIG.endpoints.chapters}/${id}`)
  } catch (error) {
    return { success: false, error: '删除章节失败' }
  }
}
