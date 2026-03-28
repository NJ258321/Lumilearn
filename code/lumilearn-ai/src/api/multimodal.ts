/**
 * 多模态分析 API
 * 支持音频 + PPT + 图片的统一分析
 */

import { api } from './request'

export interface MultimodalAnalysisResult {
  studyRecordId: string
  audioMarksCount: number
  pptMarksCount: number
  imageMarksCount: number
  totalMarks: number
  marks: UnifiedMark[]
  processTimeMs: number
}

export interface UnifiedMark {
  timestamp: number // 毫秒
  type: 'START' | 'END' | 'EMPHASIS' | 'BOARD_CHANGE' | 'NOTE' | 'QUESTION'
  content: string
  pptPage?: number
  imageUrl?: string
  source: 'audio' | 'ppt' | 'image'
}

export interface MultimodalContent {
  studyRecordId: string
  duration: number
  audio: {
    url: string | null
    marks: TimeMark[]
  }
  ppt: {
    url: string | null
    marks: TimeMark[]
  }
  images: {
    urls: string[]
    marks: TimeMark[]
  }
  allMarks: TimeMark[]
}

interface TimeMark {
  id: string
  studyRecordId: string
  type: string
  timestamp: number
  content: string | null
  pptPage: number | null
  imageUrl: string | null
  knowledgePointId: string | null
}

/**
 * 触发多模态分析
 * @param studyRecordId 学习记录ID
 */
export async function analyzeMultimodal(studyRecordId: string): Promise<{ success: boolean; data?: MultimodalAnalysisResult; error?: string }> {
  try {
    const response = await api.request(`/api/study-records/${studyRecordId}/multimodal-analysis`, {
      method: 'POST'
    })
    return response
  } catch (error: any) {
    console.error('[Multimodal API] Analysis failed:', error)
    return {
      success: false,
      error: error.message || '分析失败'
    }
  }
}

/**
 * 获取多模态内容详情
 * @param studyRecordId 学习记录ID
 */
export async function getMultimodalContent(studyRecordId: string): Promise<{ success: boolean; data?: MultimodalContent; error?: string }> {
  try {
    const response = await api.request(`/api/study-records/${studyRecordId}/multimodal-content`)
    return response
  } catch (error: any) {
    console.error('[Multimodal API] Get content failed:', error)
    return {
      success: false,
      error: error.message || '获取内容失败'
    }
  }
}
