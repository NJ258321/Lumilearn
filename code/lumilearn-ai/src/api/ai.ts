// =====================================================
// AI 服务 API
// 封装AI相关接口：知识点解释、学习建议、薄弱点分析、资源检索
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse } from '../types'

// =====================================================
// 类型定义
// =====================================================

// 知识点解释请求体
export interface ExplainKnowledgePointBody {
  knowledgePointId: string
  style?: 'brief' | 'detailed' | 'example'
  includeRelated?: boolean
  includeExamples?: boolean
}

// 知识点解释响应
export interface ExplainKnowledgePointResult {
  knowledgePoint: {
    id: string
    name: string
  }
  explanation: string
  relatedPoints: Array<{ id: string; name: string }>
  examples: Array<{ question: string; answer: string }>
  generatedAt: string
}

// 学习建议请求体
export interface GenerateSuggestionBody {
  courseId: string
  targetGrade?: 'S' | 'A' | 'B' | 'C'
  daysUntilExam?: number
  dailyStudyTime?: number
  focusAreas?: Array<'weak_points' | 'high_frequency' | 'important_chapters'>
}

// 学习建议响应
export interface GenerateSuggestionResult {
  courseId: string
  courseName: string
  overallAssessment: string
  suggestions: Array<{
    priority: number
    type: string
    title: string
    reason: string
    action: string
    estimatedTime: number
  }>
  studyPlan: Record<string, string[]>
  generatedAt: string
}

// 薄弱点分析请求体
export interface AnalyzeWeakPointsBody {
  courseId: string
  analyzeDepth?: 'quick' | 'comprehensive'
}

// 薄弱点分析响应
export interface AnalyzeWeakPointsResult {
  courseId: string
  totalKnowledgePoints: number
  weakPoints: Array<{
    knowledgePoint: {
      id: string
      name: string
      masteryScore: number
      status: string
    }
    analysis: {
      mistakeRate: number
      reviewMissCount: number
      lastReviewDate: string
      avgTimeSpent: number
      errorPatterns: string[]
    }
    priority: 'high' | 'medium' | 'low'
    suggestedAction: string
  }>
  learningInsights: string[]
  generatedAt: string
}

// 资源检索请求体
export interface SearchResourcesBody {
  knowledgePointId: string
  resourceTypes?: Array<'video' | 'document' | 'practice'>
  language?: string
  maxResults?: number
}

// 资源项
export interface Resource {
  type: 'video' | 'document' | 'practice'
  title: string
  source: string
  url: string
  duration?: string
  pages?: number
  quality: 'high' | 'medium' | 'low'
  description: string
  matchReason: string
}

// 资源检索响应
export interface SearchResourcesResult {
  knowledgePoint: {
    id: string
    name: string
  }
  resources: Resource[]
  generatedAt: string
}

// 服务状态
export interface AIServiceStatus {
  gemini: {
    available: boolean
    message?: string
  }
  bilibili: {
    available: boolean
    message?: string
  }
}

// =====================================================
// API 函数
// =====================================================

/**
 * 生成知识点解释
 * @param body 解释参数
 */
export async function explainKnowledgePoint(
  body: ExplainKnowledgePointBody
): Promise<ApiResponse<ExplainKnowledgePointResult>> {
  try {
    return await api.post<ExplainKnowledgePointResult>(
      API_CONFIG.endpoints.aiExplain,
      body
    )
  } catch (error) {
    return { success: false, error: '生成知识点解释失败' }
  }
}

/**
 * 生成学习建议
 * @param body 建议参数
 */
export async function generateStudySuggestion(
  body: GenerateSuggestionBody
): Promise<ApiResponse<GenerateSuggestionResult>> {
  try {
    return await api.post<GenerateSuggestionResult>(
      API_CONFIG.endpoints.aiSuggest,
      body
    )
  } catch (error) {
    return { success: false, error: '生成学习建议失败' }
  }
}

/**
 * 分析薄弱点
 * @param body 分析参数
 */
export async function analyzeWeakPoints(
  body: AnalyzeWeakPointsBody
): Promise<ApiResponse<AnalyzeWeakPointsResult>> {
  try {
    return await api.post<AnalyzeWeakPointsResult>(
      API_CONFIG.endpoints.aiAnalyzeWeakPoints,
      body
    )
  } catch (error) {
    return { success: false, error: '分析薄弱点失败' }
  }
}

/**
 * 搜索外部资源
 * @param body 搜索参数
 */
export async function searchResources(
  body: SearchResourcesBody
): Promise<ApiResponse<SearchResourcesResult>> {
  try {
    return await api.post<SearchResourcesResult>(
      API_CONFIG.endpoints.aiSearchResources,
      body
    )
  } catch (error) {
    return { success: false, error: '搜索资源失败' }
  }
}

// =====================================================
// 工具函数
// =====================================================

/**
 * 获取资源类型的图标
 */
export function getResourceTypeIcon(type: Resource['type']): string {
  const icons: Record<Resource['type'], string> = {
    video: '🎬',
    document: '📄',
    practice: '📝',
  }
  return icons[type] || '📁'
}

/**
 * 获取资源质量标签
 */
export function getResourceQualityLabel(quality: Resource['quality']): string {
  const labels: Record<Resource['quality'], string> = {
    high: '高质量',
    medium: '中等',
    low: '一般',
  }
  return labels[quality] || quality
}

/**
 * 获取优先级标签
 */
export function getPriorityLabel(priority: 'high' | 'medium' | 'low'): string {
  const labels: Record<string, string> = {
    high: '高优先级',
    medium: '中优先级',
    low: '低优先级',
  }
  return labels[priority] || priority
}

/**
 * 获取优先级颜色
 */
export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  const colors: Record<string, string> = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-green-600 bg-green-50',
  }
  return colors[priority] || 'text-gray-600 bg-gray-50'
}

/**
 * 获取建议类型标签
 */
export function getSuggestionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    review: '复习',
    practice: '练习',
    preview: '预习',
    rest: '休息',
  }
  return labels[type] || type
}
