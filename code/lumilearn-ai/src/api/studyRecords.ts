// =====================================================
// 学习记录 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse, StudyRecord, PaginatedResponse, PaginationParams } from '../../types'

// 学习记录列表查询参数
export interface StudyRecordListParams extends PaginationParams {
  courseId?: string
  chapterId?: string
  startDate?: string
  endDate?: string
  keyword?: string
}

// 创建学习记录请求体
export interface CreateStudyRecordBody {
  courseId: string
  chapterId: string
  title: string
  date: string  // ISO8601 格式
  audioUrl?: string
  notes?: string
  duration?: number
  status?: 'RECORDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
}

// 更新学习记录请求体
export interface UpdateStudyRecordBody {
  title?: string
  notes?: string
  duration?: number
}

// 获取学习记录列表（后端直接返回数组）
export async function getStudyRecordList(
  params: StudyRecordListParams = {}
): Promise<ApiResponse<StudyRecord[]>> {
  try {
    return await api.get<StudyRecord[]>(
      API_CONFIG.endpoints.studyRecords,
      params as Record<string, unknown>
    )
  } catch (error) {
    return { success: false, error: '获取学习记录列表失败' }
  }
}

// 获取学习记录详情
export async function getStudyRecordById(id: string): Promise<ApiResponse<StudyRecord>> {
  try {
    return await api.get<StudyRecord>(`${API_CONFIG.endpoints.studyRecords}/${id}`)
  } catch (error) {
    return { success: false, error: '获取学习记录详情失败' }
  }
}

// 创建学习记录
export async function createStudyRecord(
  body: CreateStudyRecordBody
): Promise<ApiResponse<StudyRecord>> {
  try {
    return await api.post<StudyRecord>(API_CONFIG.endpoints.studyRecords, body)
  } catch (error) {
    return { success: false, error: '创建学习记录失败' }
  }
}

// 更新学习记录
export async function updateStudyRecord(
  id: string,
  body: UpdateStudyRecordBody
): Promise<ApiResponse<StudyRecord>> {
  try {
    return await api.put<StudyRecord>(`${API_CONFIG.endpoints.studyRecords}/${id}`, body)
  } catch (error) {
    return { success: false, error: '更新学习记录失败' }
  }
}

// 删除学习记录
export async function deleteStudyRecord(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    return await api.delete<{ id: string }>(`${API_CONFIG.endpoints.studyRecords}/${id}`)
  } catch (error) {
    return { success: false, error: '删除学习记录失败' }
  }
}

// 搜索学习记录（后端返回分页对象）
export async function searchStudyRecords(
  params: StudyRecordListParams
): Promise<ApiResponse<{ records: StudyRecord[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>> {
  try {
    return await api.get<{ records: StudyRecord[]; pagination: { total: number; page: number; pageSize: number; totalPages: number } }>(
      API_CONFIG.endpoints.studyRecordsSearch,
      params as Record<string, unknown>
    )
  } catch (error) {
    return { success: false, error: '搜索学习记录失败' }
  }
}
