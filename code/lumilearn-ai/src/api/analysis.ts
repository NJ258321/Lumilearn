// =====================================================
// P4 - 数据分析 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type {
  ApiResponse,
  KnowledgeCorrelationResponse,
  LearningSequenceResponse,
  BottleneckResponse,
  LearningEvaluation,
  LearningEfficiency,
  ComparisonAnalysis,
  GenerateEvaluationRequest,
} from '../../types'

/**
 * 获取知识点关联度矩阵
 * @param courseId 课程ID
 * @param limit 返回数量限制
 */
export async function getKnowledgeCorrelation(
  courseId: string,
  limit?: number
): Promise<ApiResponse<KnowledgeCorrelationResponse>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.analysis.knowledgeCorrelation}/${courseId}/correlation`
    const params = limit ? { limit } : undefined
    return await api.get<KnowledgeCorrelationResponse>(endpoint, params)
  } catch (error) {
    console.error('[analysis] getKnowledgeCorrelation error:', error)
    return { success: false, error: '获取知识点关联度失败' }
  }
}

/**
 * 获取学习顺序建议
 * @param courseId 课程ID
 */
export async function getLearningSequence(
  courseId: string
): Promise<ApiResponse<LearningSequenceResponse>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.analysis.learningSequence}/${courseId}`
    return await api.get<LearningSequenceResponse>(endpoint)
  } catch (error) {
    console.error('[analysis] getLearningSequence error:', error)
    return { success: false, error: '获取学习顺序建议失败' }
  }
}

/**
 * 获取知识点掌握瓶颈
 * @param courseId 课程ID
 */
export async function getBottlenecks(
  courseId: string
): Promise<ApiResponse<BottleneckResponse>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.analysis.bottlenecks}/${courseId}`
    return await api.get<BottleneckResponse>(endpoint)
  } catch (error) {
    console.error('[analysis] getBottlenecks error:', error)
    return { success: false, error: '获取知识点瓶颈失败' }
  }
}

/**
 * 生成学习评估报告
 * @param data 评估请求数据
 */
export async function generateEvaluation(
  data: GenerateEvaluationRequest
): Promise<ApiResponse<LearningEvaluation>> {
  try {
    return await api.post<LearningEvaluation>(API_CONFIG.endpoints.analysis.evaluate, data)
  } catch (error) {
    console.error('[analysis] generateEvaluation error:', error)
    return { success: false, error: '生成学习评估报告失败' }
  }
}

/**
 * 获取学习效率分析
 * @param courseId 课程ID
 */
export async function getLearningEfficiency(
  courseId: string
): Promise<ApiResponse<LearningEfficiency>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.analysis.efficiency}/${courseId}`
    return await api.get<LearningEfficiency>(endpoint)
  } catch (error) {
    console.error('[analysis] getLearningEfficiency error:', error)
    return { success: false, error: '获取学习效率分析失败' }
  }
}

/**
 * 获取对比分析
 * @param courseId 课程ID
 */
export async function getComparisonAnalysis(
  courseId: string
): Promise<ApiResponse<ComparisonAnalysis>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.analysis.compare}/${courseId}`
    return await api.get<ComparisonAnalysis>(endpoint)
  } catch (error) {
    console.error('[analysis] getComparisonAnalysis error:', error)
    return { success: false, error: '获取对比分析失败' }
  }
}
