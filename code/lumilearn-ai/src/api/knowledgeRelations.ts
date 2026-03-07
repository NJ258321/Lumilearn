// =====================================================
// 知识关系 API 服务
// 封装知识关系CRUD和知识图谱相关接口
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse } from '../types'

// =====================================================
// 类型定义
// =====================================================

// 关系类型
export type KnowledgeRelationType = 'PREREQUISITE' | 'RELATED' | 'EXTENDS' | 'EXAMPLE'

// 知识关系
export interface KnowledgeRelation {
  id: string
  sourceId: string
  targetId: string
  relationType: KnowledgeRelationType
  weight: number
  createdAt: string
}

// 知识关系图节点
export interface KnowledgeNode {
  id: string
  name: string
  status?: string
  masteryScore?: number
}

// 知识关系图数据
export interface KnowledgeGraphData {
  root: KnowledgeNode
  relations: KnowledgeRelation[]
  prerequisites: KnowledgeNode[]
  related: KnowledgeNode[]
}

// 创建知识关系请求体
export interface CreateKnowledgeRelationBody {
  sourceId: string
  targetId: string
  relationType: KnowledgeRelationType
  weight?: number
}

// 批量创建知识关系请求体
export interface BatchCreateKnowledgeRelationsBody {
  relations: CreateKnowledgeRelationBody[]
}

// 更新知识关系请求体
export interface UpdateKnowledgeRelationBody {
  relationType?: KnowledgeRelationType
  weight?: number
}

// =====================================================
// API 函数
// =====================================================

/**
 * 获取知识关系图
 * @param id 知识点ID
 * @param depth 追溯深度，默认2
 */
export async function getKnowledgeRelations(
  id: string,
  depth: number = 2
): Promise<ApiResponse<KnowledgeGraphData>> {
  try {
    return await api.get<KnowledgeGraphData>(
      `${API_CONFIG.endpoints.knowledgePoints}/${id}/relations`,
      { depth }
    )
  } catch (error) {
    return { success: false, error: '获取知识关系图失败' }
  }
}

/**
 * 创建知识关系
 * @param body 创建参数
 */
export async function createKnowledgeRelation(
  body: CreateKnowledgeRelationBody
): Promise<ApiResponse<KnowledgeRelation>> {
  try {
    return await api.post<KnowledgeRelation>(
      API_CONFIG.endpoints.knowledgeRelations,
      body
    )
  } catch (error) {
    return { success: false, error: '创建知识关系失败' }
  }
}

/**
 * 批量创建知识关系
 * @param body 批量创建参数
 */
export async function batchCreateKnowledgeRelations(
  body: BatchCreateKnowledgeRelationsBody
): Promise<ApiResponse<KnowledgeRelation[]>> {
  try {
    return await api.post<KnowledgeRelation[]>(
      `${API_CONFIG.endpoints.knowledgeRelations}/batch`,
      body
    )
  } catch (error) {
    return { success: false, error: '批量创建知识关系失败' }
  }
}

/**
 * 更新知识关系
 * @param id 关系ID
 * @param body 更新参数
 */
export async function updateKnowledgeRelation(
  id: string,
  body: UpdateKnowledgeRelationBody
): Promise<ApiResponse<KnowledgeRelation>> {
  try {
    return await api.put<KnowledgeRelation>(
      `${API_CONFIG.endpoints.knowledgeRelations}/${id}`,
      body
    )
  } catch (error) {
    return { success: false, error: '更新知识关系失败' }
  }
}

/**
 * 删除知识关系
 * @param id 关系ID
 */
export async function deleteKnowledgeRelation(
  id: string
): Promise<ApiResponse<{ id: string }>> {
  try {
    return await api.delete<{ id: string }>(
      `${API_CONFIG.endpoints.knowledgeRelations}/${id}`
    )
  } catch (error) {
    return { success: false, error: '删除知识关系失败' }
  }
}

// =====================================================
// 工具函数
// =====================================================

/**
 * 获取关系类型的中文名称
 */
export function getRelationTypeLabel(type: KnowledgeRelationType): string {
  const labels: Record<KnowledgeRelationType, string> = {
    PREREQUISITE: '前置知识',
    RELATED: '相关知识',
    EXTENDS: '扩展知识',
    EXAMPLE: '示例关系',
  }
  return labels[type] || type
}

/**
 * 获取关系类型的颜色
 */
export function getRelationTypeColor(type: KnowledgeRelationType): string {
  const colors: Record<KnowledgeRelationType, string> = {
    PREREQUISITE: 'text-blue-600 bg-blue-50',
    RELATED: 'text-green-600 bg-green-50',
    EXTENDS: 'text-purple-600 bg-purple-50',
    EXAMPLE: 'text-orange-600 bg-orange-50',
  }
  return colors[type] || 'text-gray-600 bg-gray-50'
}

/**
 * 获取关系类型的图标
 */
export function getRelationTypeIcon(type: KnowledgeRelationType): string {
  const icons: Record<KnowledgeRelationType, string> = {
    PREREQUISITE: '↩',
    RELATED: '↔',
    EXTENDS: '→',
    EXAMPLE: '💡',
  }
  return icons[type] || '•'
}
