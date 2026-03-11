// =====================================================
// 知识点 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse, KnowledgePoint, PaginatedResponse, PaginationParams } from '../../types'

// 知识点列表查询参数
export interface KnowledgePointListParams extends PaginationParams {
  courseId?: string
  chapterId?: string
  status?: string
  search?: string
}

// 创建知识点请求体
export interface CreateKnowledgePointBody {
  chapterId: string  // 后端必填
  name: string
  description?: string
  status?: string
  importance?: number
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

// 获取知识点列表（后端直接返回数组）
export async function getKnowledgePointList(
  params: KnowledgePointListParams = {}
): Promise<ApiResponse<KnowledgePoint[]>> {
  try {
    return await api.get<KnowledgePoint[]>(
      API_CONFIG.endpoints.knowledgePoints,
      params as Record<string, unknown>
    )
  } catch (error) {
    return { success: false, error: '获取知识点列表失败' }
  }
}

// 获取知识点详情
export async function getKnowledgePointById(id: string): Promise<ApiResponse<KnowledgePoint>> {
  try {
    return await api.get<KnowledgePoint>(`${API_CONFIG.endpoints.knowledgePoints}/${id}`)
  } catch (error) {
    return { success: false, error: '获取知识点详情失败' }
  }
}

// 创建知识点
export async function createKnowledgePoint(
  body: CreateKnowledgePointBody
): Promise<ApiResponse<KnowledgePoint>> {
  try {
    return await api.post<KnowledgePoint>(API_CONFIG.endpoints.knowledgePoints, body)
  } catch (error) {
    return { success: false, error: '创建知识点失败' }
  }
}

// 更新知识点
export async function updateKnowledgePoint(
  id: string,
  body: UpdateKnowledgePointBody
): Promise<ApiResponse<KnowledgePoint>> {
  try {
    return await api.put<KnowledgePoint>(`${API_CONFIG.endpoints.knowledgePoints}/${id}`, body)
  } catch (error) {
    return { success: false, error: '更新知识点失败' }
  }
}

// 删除知识点
export async function deleteKnowledgePoint(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    return await api.delete<{ id: string }>(`${API_CONFIG.endpoints.knowledgePoints}/${id}`)
  } catch (error) {
    return { success: false, error: '删除知识点失败' }
  }
}

// 更新知识点掌握度
export async function updateMastery(
  id: string,
  body: UpdateMasteryBody
): Promise<ApiResponse<KnowledgePoint>> {
  try {
    return await api.patch<KnowledgePoint>(
      `${API_CONFIG.endpoints.knowledgePoints}/${id}/mastery`,
      body
    )
  } catch (error) {
    return { success: false, error: '更新掌握度失败' }
  }
}

// 获取薄弱点列表（后端直接返回数组）
export async function getWeakPoints(
  params: Omit<KnowledgePointListParams, 'status'> = {}
): Promise<ApiResponse<KnowledgePoint[]>> {
  try {
    return await api.get<KnowledgePoint[]>(
      API_CONFIG.endpoints.weakPoints,
      params as Record<string, unknown>
    )
  } catch (error) {
    return { success: false, error: '获取薄弱点列表失败' }
  }
}

// 获取最近复习的知识点
export async function getRecentlyReviewed(
  params: Omit<KnowledgePointListParams, 'status'> = {}
): Promise<ApiResponse<KnowledgePoint[]>> {
  try {
    return await api.get<KnowledgePoint[]>(
      API_CONFIG.endpoints.recentlyReviewed,
      params as Record<string, unknown>
    )
  } catch (error) {
    return { success: false, error: '获取最近复习知识点失败' }
  }
}

// 批量创建知识点
export async function batchCreateKnowledgePoints(
  items: CreateKnowledgePointBody[]
): Promise<ApiResponse<KnowledgePoint[]>> {
  try {
    return await api.post<KnowledgePoint[]>(`${API_CONFIG.endpoints.knowledgePoints}/batch`, { items })
  } catch (error) {
    return { success: false, error: '批量创建知识点失败' }
  }
}

// 批量更新知识点状态
export async function batchUpdateStatus(
  ids: string[],
  status: string
): Promise<ApiResponse<{ updated: number }>> {
  try {
    return await api.put<{ updated: number }>(`${API_CONFIG.endpoints.knowledgePoints}/batch/status`, {
      ids,
      status,
    })
  } catch (error) {
    return { success: false, error: '批量更新知识点状态失败' }
  }
}

// 获取知识点的时间分布 (Task-2.2.2)
export async function getKnowledgePointTimeline(
  id: string
): Promise<ApiResponse<{
  knowledgePoint: { id: string; name: string }
  timeline: Array<{
    timeMarkId: string
    studyRecordId: string
    studyRecordTitle: string
    timestamp: number
    type: string
    createdAt: string
  }>
}>> {
  try {
    return await api.get<any>(`${API_CONFIG.endpoints.knowledgePoints}/${id}/timeline`)
  } catch (error) {
    return { success: false, error: '获取知识点时间分布失败' }
  }
}
