// =====================================================
// P4 - 复习计划 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type {
  ApiResponse,
  ReviewPlan,
  TodayReview,
  CompleteReviewResponse,
  ReviewStatistics,
  CourseReview,
  GenerateReviewPlanRequest,
  CompleteReviewRequest,
} from '../../types'

/**
 * 生成复习计划
 * @param data 复习计划请求数据
 */
export async function generateReviewPlan(
  data: GenerateReviewPlanRequest
): Promise<ApiResponse<ReviewPlan>> {
  try {
    return await api.post<ReviewPlan>(API_CONFIG.endpoints.review.generatePlan, data)
  } catch (error) {
    console.error('[review] generateReviewPlan error:', error)
    return { success: false, error: '生成复习计划失败' }
  }
}

/**
 * 获取今日复习任务
 */
export async function getTodayReview(): Promise<ApiResponse<TodayReview>> {
  try {
    return await api.get<TodayReview>(API_CONFIG.endpoints.review.today)
  } catch (error) {
    console.error('[review] getTodayReview error:', error)
    return { success: false, error: '获取今日复习任务失败' }
  }
}

/**
 * 记录复习完成
 * @param knowledgePointId 知识点ID
 * @param data 复习完成数据
 */
export async function completeReview(
  knowledgePointId: string,
  data: CompleteReviewRequest
): Promise<ApiResponse<CompleteReviewResponse>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.review.complete}/${knowledgePointId}/complete`
    return await api.post<CompleteReviewResponse>(endpoint, data)
  } catch (error) {
    console.error('[review] completeReview error:', error)
    return { success: false, error: '记录复习完成失败' }
  }
}

/**
 * 获取复习统计
 */
export async function getReviewStatistics(): Promise<ApiResponse<ReviewStatistics>> {
  try {
    return await api.get<ReviewStatistics>(API_CONFIG.endpoints.review.statistics)
  } catch (error) {
    console.error('[review] getReviewStatistics error:', error)
    return { success: false, error: '获取复习统计失败' }
  }
}

/**
 * 获取课程复习计划
 * @param courseId 课程ID
 */
export async function getCourseReview(
  courseId: string
): Promise<ApiResponse<CourseReview>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.review.course}/${courseId}`
    return await api.get<CourseReview>(endpoint)
  } catch (error) {
    console.error('[review] getCourseReview error:', error)
    return { success: false, error: '获取课程复习计划失败' }
  }
}

// =====================================================
// 今日安排 API
// =====================================================

export interface CourseReviewInfo {
  courseId: string
  courseName: string
  courseStatus: 'STUDYING' | 'REVIEWING' | 'ARCHIVED'
  examDate: string | null
  daysUntilExam: number | null
  totalChapters: number
  reviewedChapters: number
  reviewProgress: number
  totalKnowledgePoints: number
  masteredPoints: number
  weakPoints: number
  masteryRate: number
  todayTasks: {
    knowledgePoints: number
    estimatedMinutes: number
  }
  urgencyLevel: 'HIGH' | 'NORMAL' | 'LOW'
  urgencyReason: string
}

export interface DailyReviewOverviewResponse {
  courses: CourseReviewInfo[]
  summary: {
    totalCourses: number
    urgentCourses: number
    normalCourses: number
    relaxedCourses: number
  }
}

/**
 * 获取今日复习安排概览
 */
export async function getDailyReviewOverview(): Promise<ApiResponse<DailyReviewOverviewResponse>> {
  try {
    return await api.get<DailyReviewOverviewResponse>(API_CONFIG.endpoints.review.dailyReviewOverview)
  } catch (error) {
    console.error('[review] getDailyReviewOverview error:', error)
    return { success: false, error: '获取今日复习安排失败' }
  }
}
