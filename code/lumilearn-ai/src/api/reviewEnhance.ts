// =====================================================
// P5 - 复习计划增强 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type {
  ApiResponse,
  ReplanRequest,
  ReplanResponse,
  OptimizeRequest,
  OptimizeResponse,
} from '../../types'

/**
 * 任务重排
 * @param data 重排请求信息
 */
export async function replanReview(
  data: ReplanRequest
): Promise<ApiResponse<ReplanResponse>> {
  try {
    return await api.put<ReplanResponse>(API_CONFIG.endpoints.reviewEnhance.replan, data)
  } catch (error) {
    console.error('[reviewEnhance] replanReview error:', error)
    return { success: false, error: '任务重排失败' }
  }
}

/**
 * 多学科统筹优化
 * @param data 优化请求信息
 */
export async function optimizeReview(
  data: OptimizeRequest
): Promise<ApiResponse<OptimizeResponse>> {
  try {
    return await api.post<OptimizeResponse>(API_CONFIG.endpoints.reviewEnhance.optimize, data)
  } catch (error) {
    console.error('[reviewEnhance] optimizeReview error:', error)
    return { success: false, error: '多学科优化失败' }
  }
}
