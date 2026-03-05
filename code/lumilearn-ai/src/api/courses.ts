// =====================================================
// 课程 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse, Course } from '../../types'

// 课程列表查询参数
export interface CourseListParams {
  status?: 'STUDYING' | 'REVIEWING' | 'ARCHIVED'
}

// 获取课程列表
export async function getCourseList(
  params: CourseListParams = {}
): Promise<ApiResponse<Course[]>> {
  try {
    return await api.get<Course[]>(
      API_CONFIG.endpoints.courses,
      params as Record<string, unknown>
    )
  } catch (error) {
    return { success: false, error: '获取课程列表失败' }
  }
}

// 获取课程详情
export async function getCourseById(id: string): Promise<ApiResponse<Course>> {
  try {
    return await api.get<Course>(`${API_CONFIG.endpoints.courses}/${id}`)
  } catch (error) {
    return { success: false, error: '获取课程详情失败' }
  }
}
