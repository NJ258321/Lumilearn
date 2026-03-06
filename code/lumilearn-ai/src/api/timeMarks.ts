// =====================================================
// 时间标记 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse, TimeMark, PaginatedResponse, PaginationParams } from '../../types'

// 时间标记列表查询参数
export interface TimeMarkListParams extends PaginationParams {
  studyRecordId?: string
  type?: string
}

// 创建时间标记请求体
export interface CreateTimeMarkBody {
  studyRecordId: string
  timestamp: number
  type: string
  knowledgePointId?: string
  pptPage?: number
  content?: string
  imageUrl?: string
}

// 更新时间标记请求体
export interface UpdateTimeMarkBody {
  timestamp?: number
  type?: string
  knowledgePointId?: string
  pptPage?: number
  content?: string
  imageUrl?: string
}

// 获取学习记录的时间标记列表
export async function getTimeMarkList(
  studyRecordId: string
): Promise<ApiResponse<TimeMark[]>> {
  try {
    return await api.get<TimeMark[]>(
      `${API_CONFIG.endpoints.studyRecords}/${studyRecordId}/time-marks`
    )
  } catch (error) {
    return { success: false, error: '获取时间标记列表失败' }
  }
}

// 创建时间标记
export async function createTimeMark(
  studyRecordId: string,
  body: Omit<CreateTimeMarkBody, 'studyRecordId'>
): Promise<ApiResponse<TimeMark>> {
  try {
    return await api.post<TimeMark>(
      `${API_CONFIG.endpoints.studyRecords}/${studyRecordId}/time-marks`,
      body
    )
  } catch (error) {
    return { success: false, error: '创建时间标记失败' }
  }
}

// 更新时间标记
export async function updateTimeMark(
  id: string,
  body: UpdateTimeMarkBody
): Promise<ApiResponse<TimeMark>> {
  try {
    return await api.put<TimeMark>(`${API_CONFIG.endpoints.studyRecords}/time-marks/${id}`, body)
  } catch (error) {
    return { success: false, error: '更新时间标记失败' }
  }
}

// 删除时间标记
export async function deleteTimeMark(id: string): Promise<ApiResponse<{ id: string }>> {
  try {
    return await api.delete<{ id: string }>(`${API_CONFIG.endpoints.studyRecords}/time-marks/${id}`)
  } catch (error) {
    return { success: false, error: '删除时间标记失败' }
  }
}

// 快速标记重点
export async function quickMarkEmphasis(
  studyRecordId: string,
  timestamp: number,
  note?: string
): Promise<ApiResponse<TimeMark>> {
  try {
    return await api.post<TimeMark>(`${API_CONFIG.endpoints.studyRecords}/${studyRecordId}/emphasis`, {
      timestamp,
      content: note,
    })
  } catch (error) {
    return { success: false, error: '快速标记重点失败' }
  }
}

// 获取某个时间点附近的时间标记
export async function getRelatedMarks(
  studyRecordId: string,
  timestamp: number,
  range: number = 30
): Promise<ApiResponse<TimeMark[]>> {
  try {
    // 注意：API 返回格式为 { range, results: [{ mark, relatedMarks }] }
    // 这里我们只需要提取所有标记
    const response = await api.get<any>(`${API_CONFIG.endpoints.studyRecords}/${studyRecordId}/related-marks`, {
      range: range.toString(),
    })
    if (response.success && response.data) {
      // 提取所有相关标记
      const allMarks: TimeMark[] = []
      if (response.data.results && Array.isArray(response.data.results)) {
        response.data.results.forEach((item: any) => {
          if (item.mark) allMarks.push(item.mark)
          if (item.relatedMarks && Array.isArray(item.relatedMarks)) {
            item.relatedMarks.forEach((rm: any) => allMarks.push(rm))
          }
        })
      }
      return { success: true, data: allMarks }
    }
    return response
  } catch (error) {
    return { success: false, error: '获取相关标记失败' }
  }
}

// 批量创建时间标记 (Task-1.4.2)
export interface BatchTimeMarkItem {
  type: string
  timestamp: number
  knowledgePointId?: string
  pptPage?: number
  content?: string
  imageUrl?: string
}

export async function batchCreateTimeMarks(
  studyRecordId: string,
  timeMarks: BatchTimeMarkItem[]
): Promise<ApiResponse<{ count: number }>> {
  try {
    return await api.post<{ count: number }>(
      `${API_CONFIG.endpoints.studyRecords}/${studyRecordId}/time-marks/batch`,
      { timeMarks }
    )
  } catch (error) {
    return { success: false, error: '批量添加时间标记失败' }
  }
}
