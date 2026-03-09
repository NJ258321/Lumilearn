// =====================================================
// 知识点 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse, KnowledgePoint, PaginatedResponse, PaginationParams } from '../types/api'

// 知识点列表查询参数
export interface KnowledgePointListParams extends PaginationParams {
  courseId?: string
  chapterId?: string
  status?: string
  search?: string
}

// 创建知识点请求体
export interface CreateKnowledgePointBody {
  courseId: string
  chapterId?: string
  name: string
  description?: string
  status?: string
}

// 更新知识点请求体
export interface UpdateKnowledgePointBody {
  name?: string
  description?: string
  status?: string
  masteryLevel?: number
}

// 更新掌握度请求体
export interface UpdateMasteryBody {
  status: string
  masteryLevel?: number
}

// 获取知识点列表
export async function getKnowledgePointList(
  params: KnowledgePointListParams = {}
): Promise<ApiResponse<PaginatedResponse<KnowledgePoint>>> {
  return api.get<PaginatedResponse<KnowledgePoint>>(
    API_CONFIG.endpoints.knowledgePoints,
    params as Record<string, any>
  )
}

// 获取知识点详情
export async function getKnowledgePointById(id: string): Promise<ApiResponse<KnowledgePoint>> {
  return api.get<KnowledgePoint>(`${API_CONFIG.endpoints.knowledgePoints}/${id}`)
}

// 创建知识点
export async function createKnowledgePoint(
  body: CreateKnowledgePointBody
): Promise<ApiResponse<KnowledgePoint>> {
  return api.post<KnowledgePoint>(API_CONFIG.endpoints.knowledgePoints, body)
}

// 更新知识点
export async function updateKnowledgePoint(
  id: string,
  body: UpdateKnowledgePointBody
): Promise<ApiResponse<KnowledgePoint>> {
  return api.put<KnowledgePoint>(`${API_CONFIG.endpoints.knowledgePoints}/${id}`, body)
}

// 删除知识点
export async function deleteKnowledgePoint(id: string): Promise<ApiResponse<{ id: string }>> {
  return api.delete<{ id: string }>(`${API_CONFIG.endpoints.knowledgePoints}/${id}`)
}

// 更新知识点掌握度
export async function updateMastery(
  id: string,
  body: UpdateMasteryBody
): Promise<ApiResponse<KnowledgePoint>> {
  return api.patch<KnowledgePoint>(
    `${API_CONFIG.endpoints.knowledgePoints}/${id}/mastery`,
    body
  )
}

// 获取薄弱点列表
export async function getWeakPoints(
  params: Omit<KnowledgePointListParams, 'status'> = {}
): Promise<ApiResponse<PaginatedResponse<KnowledgePoint>>> {
  return api.get<PaginatedResponse<KnowledgePoint>>(
    API_CONFIG.endpoints.weakPoints,
    params as Record<string, any>
  )
}

// 获取最近复习的知识点
export async function getRecentlyReviewed(
  params: Omit<KnowledgePointListParams, 'status'> = {}
): Promise<ApiResponse<KnowledgePoint[]>> {
  return api.get<KnowledgePoint[]>(
    API_CONFIG.endpoints.recentlyReviewed,
    params as Record<string, any>
  )
}

// 批量创建知识点
export async function batchCreateKnowledgePoints(
  items: CreateKnowledgePointBody[]
): Promise<ApiResponse<KnowledgePoint[]>> {
  return api.post<KnowledgePoint[]>(`${API_CONFIG.endpoints.knowledgePoints}/batch`, { items })
}

// 批量更新知识点状态
export async function batchUpdateStatus(
  ids: string[],
  status: string
): Promise<ApiResponse<{ updated: number }>> {
  return api.put<{ updated: number }>(`${API_CONFIG.endpoints.knowledgePoints}/batch/status`, {
    ids,
    status,
  })
}
