// =====================================================
// P4 - 学习数据统计 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type {
  ApiResponse,
  CourseOverview,
  KnowledgeMastery,
  ActivityStats,
  ChapterSummary,
  Dashboard,
} from '../../types'

// 时间范围类型
export type TimeRange = 'week' | 'month' | 'semester'

/**
 * 获取课程学习概览
 * @param courseId 课程ID
 * @param timeRange 时间范围
 */
export async function getCourseOverview(
  courseId: string,
  timeRange?: TimeRange
): Promise<ApiResponse<CourseOverview>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.statistics.courseOverview}/${courseId}/overview`
    const params = timeRange ? { timeRange } : undefined
    return await api.get<CourseOverview>(endpoint, params)
  } catch (error) {
    console.error('[statistics] getCourseOverview error:', error)
    return { success: false, error: '获取课程学习概览失败' }
  }
}

/**
 * 获取知识点掌握统计
 * @param courseId 课程ID
 */
export async function getKnowledgeMastery(
  courseId: string
): Promise<ApiResponse<KnowledgeMastery>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.statistics.knowledgePointsMastery}/${courseId}/mastery`
    return await api.get<KnowledgeMastery>(endpoint)
  } catch (error) {
    console.error('[statistics] getKnowledgeMastery error:', error)
    return { success: false, error: '获取知识点掌握统计失败' }
  }
}

/**
 * 获取学习活动统计
 */
export async function getActivityStats(): Promise<ApiResponse<ActivityStats>> {
  try {
    return await api.get<ActivityStats>(API_CONFIG.endpoints.statistics.activities)
  } catch (error) {
    console.error('[statistics] getActivityStats error:', error)
    return { success: false, error: '获取学习活动统计失败' }
  }
}

/**
 * 获取章节学习摘要
 * @param chapterId 章节ID
 */
export async function getChapterSummary(
  chapterId: string
): Promise<ApiResponse<ChapterSummary>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.statistics.chapterSummary}/${chapterId}/summary`
    return await api.get<ChapterSummary>(endpoint)
  } catch (error) {
    console.error('[statistics] getChapterSummary error:', error)
    return { success: false, error: '获取章节学习摘要失败' }
  }
}

/**
 * 获取总体学习仪表盘
 */
export async function getDashboard(): Promise<ApiResponse<Dashboard>> {
  try {
    return await api.get<Dashboard>(API_CONFIG.endpoints.statistics.dashboard)
  } catch (error) {
    console.error('[statistics] getDashboard error:', error)
    return { success: false, error: '获取学习仪表盘失败' }
  }
}
