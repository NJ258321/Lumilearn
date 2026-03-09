// =====================================================
// 章节 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse, Chapter, PaginatedResponse, PaginationParams } from '../types/api'

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

// 获取章节列表
export async function getChapterList(
  params: ChapterListParams = {}
): Promise<ApiResponse<PaginatedResponse<Chapter>>> {
  return api.get<PaginatedResponse<Chapter>>(
    API_CONFIG.endpoints.chapters,
    params as Record<string, any>
  )
}

// 获取章节详情
export async function getChapterById(id: string): Promise<ApiResponse<Chapter>> {
  return api.get<Chapter>(`${API_CONFIG.endpoints.chapters}/${id}`)
}

// 创建章节
export async function createChapter(
  body: CreateChapterBody
): Promise<ApiResponse<Chapter>> {
  return api.post<Chapter>(API_CONFIG.endpoints.chapters, body)
}

// 更新章节
export async function updateChapter(
  id: string,
  body: UpdateChapterBody
): Promise<ApiResponse<Chapter>> {
  return api.put<Chapter>(`${API_CONFIG.endpoints.chapters}/${id}`, body)
}

// 删除章节
export async function deleteChapter(id: string): Promise<ApiResponse<{ id: string }>> {
  return api.delete<{ id: string }>(`${API_CONFIG.endpoints.chapters}/${id}`)
}
