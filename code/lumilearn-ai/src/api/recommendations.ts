// =====================================================
// P5 - 个性化推荐 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type {
  ApiResponse,
  DailyRecommendation,
  LearningPath,
  RecommendedResourcesResponse,
  RecommendationFeedbackRequest,
  RecommendationFeedbackResponse,
  PopularRecommendationsResponse,
} from '../../types'

/**
 * 获取每日推荐
 */
export async function getDailyRecommendation(): Promise<ApiResponse<DailyRecommendation>> {
  try {
    return await api.get<DailyRecommendation>(API_CONFIG.endpoints.recommendations.daily)
  } catch (error) {
    console.error('[recommendations] getDailyRecommendation error:', error)
    return { success: false, error: '获取每日推荐失败' }
  }
}

/**
 * 获取推荐学习路径
 * @param courseId 课程ID
 */
export async function getLearningPath(
  courseId: string
): Promise<ApiResponse<LearningPath>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.recommendations.learningPath}/${courseId}`
    return await api.get<LearningPath>(endpoint)
  } catch (error) {
    console.error('[recommendations] getLearningPath error:', error)
    return { success: false, error: '获取学习路径失败' }
  }
}

/**
 * 获取推荐资源
 * @param knowledgePointId 知识点ID
 */
export async function getRecommendedResources(
  knowledgePointId: string
): Promise<ApiResponse<RecommendedResourcesResponse>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.recommendations.resources}/${knowledgePointId}`
    return await api.get<RecommendedResourcesResponse>(endpoint)
  } catch (error) {
    console.error('[recommendations] getRecommendedResources error:', error)
    return { success: false, error: '获取推荐资源失败' }
  }
}

/**
 * 记录推荐反馈
 * @param data 反馈信息
 */
export async function submitRecommendationFeedback(
  data: RecommendationFeedbackRequest
): Promise<ApiResponse<RecommendationFeedbackResponse>> {
  try {
    return await api.post<RecommendationFeedbackResponse>(
      API_CONFIG.endpoints.recommendations.feedback,
      data
    )
  } catch (error) {
    console.error('[recommendations] submitFeedback error:', error)
    return { success: false, error: '提交反馈失败' }
  }
}

/**
 * 获取热门推荐
 * @param limit 返回数量限制
 */
export async function getPopularRecommendations(
  limit: number = 10
): Promise<ApiResponse<PopularRecommendationsResponse>> {
  try {
    return await api.get<PopularRecommendationsResponse>(
      API_CONFIG.endpoints.recommendations.popular,
      { limit }
    )
  } catch (error) {
    console.error('[recommendations] getPopularRecommendations error:', error)
    return { success: false, error: '获取热门推荐失败' }
  }
}
