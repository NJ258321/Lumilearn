// =====================================================
// P4 - 学习进度追踪 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type {
  ApiResponse,
  CourseProgress,
  KnowledgePointProgress,
  CourseMilestones,
  CourseProgressOverview,
  UpdateKnowledgePointStatusRequest,
  RecordKnowledgePointProgressRequest,
  RecordKnowledgePointProgressResponse,
} from '../../types'

/**
 * 获取课程学习进度
 * @param courseId 课程ID
 */
export async function getCourseProgress(
  courseId: string
): Promise<ApiResponse<CourseProgress>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.progress.course}/${courseId}`
    return await api.get<CourseProgress>(endpoint)
  } catch (error) {
    console.error('[progress] getCourseProgress error:', error)
    return { success: false, error: '获取课程学习进度失败' }
  }
}

/**
 * 获取知识点进度
 * @param id 知识点ID
 */
export async function getKnowledgePointProgress(
  id: string
): Promise<ApiResponse<KnowledgePointProgress>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.progress.knowledgePoint}/${id}`
    return await api.get<KnowledgePointProgress>(endpoint)
  } catch (error) {
    console.error('[progress] getKnowledgePointProgress error:', error)
    return { success: false, error: '获取知识点进度失败' }
  }
}

/**
 * 更新知识点学习状态
 * @param id 知识点ID
 * @param data 状态数据
 */
export async function updateKnowledgePointStatus(
  id: string,
  data: UpdateKnowledgePointStatusRequest
): Promise<ApiResponse<KnowledgePointProgress>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.progress.updateStatus}/${id}/status`
    return await api.put<KnowledgePointProgress>(endpoint, data)
  } catch (error) {
    console.error('[progress] updateKnowledgePointStatus error:', error)
    return { success: false, error: '更新知识点学习状态失败' }
  }
}

/**
 * 记录知识点学习进度
 * @param id 知识点ID
 * @param data 进度数据
 */
export async function recordKnowledgePointProgress(
  id: string,
  data: RecordKnowledgePointProgressRequest
): Promise<ApiResponse<RecordKnowledgePointProgressResponse>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.progress.recordProgress}/${id}/progress`
    return await api.post<RecordKnowledgePointProgressResponse>(endpoint, data)
  } catch (error) {
    console.error('[progress] recordKnowledgePointProgress error:', error)
    return { success: false, error: '记录知识点学习进度失败' }
  }
}

/**
 * 获取学习里程碑
 * @param courseId 课程ID
 */
export async function getMilestones(
  courseId: string
): Promise<ApiResponse<CourseMilestones>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.progress.milestones}/${courseId}`
    return await api.get<CourseMilestones>(endpoint)
  } catch (error) {
    console.error('[progress] getMilestones error:', error)
    return { success: false, error: '获取学习里程碑失败' }
  }
}

/**
 * 获取所有课程进度概览
 */
export async function getProgressOverview(): Promise<ApiResponse<CourseProgressOverview>> {
  try {
    return await api.get<CourseProgressOverview>(API_CONFIG.endpoints.progress.overview)
  } catch (error) {
    console.error('[progress] getProgressOverview error:', error)
    return { success: false, error: '获取进度概览失败' }
  }
}
