// =====================================================
// 音频 API 服务
// 封装音频元数据、转写、片段提取、VAD等接口
// =====================================================

import { api, API_CONFIG } from './request'

// 音频端点基础路径
const AUDIO_BASE = '/api/audio'
import type { ApiResponse } from '../types'

// =====================================================
// 类型定义
// =====================================================

// 音频元数据
export interface AudioMetadata {
  id: string
  title: string
  audioUrl: string
  duration: number
  format: string
  bitrate: number
  sampleRate: number
  channels: number
  size: number
  createdAt: string
  knowledgePoints: Array<{ id: string; name: string }>
  timeMarksCount: number
}

// 转写请求体
export interface TranscribeBody {
  language?: string
}

// 转写响应
export interface TranscriptionResult {
  text: string
  segments: Array<{
    start: number
    end: number
    text: string
  }>
  language: string
}

// 音频片段参数
export interface AudioSegmentParams {
  start: number  // 开始时间（秒）
  end: number    // 结束时间（秒）
}

// VAD请求体
export interface VadBody {
  sensitivity?: number  // 灵敏度 0-100，默认 50
}

// VAD响应
export interface VadResult {
  segments: Array<{ start: number; end: number }>
  totalSpeechDuration: number
  audioDuration: number
}

// 服务状态
export interface ServiceStatus {
  available: boolean
  message?: string
}

// =====================================================
// API 函数
// =====================================================

/**
 * 获取音频元数据
 * @param id 学习记录 ID
 */
export async function getAudioMetadata(
  id: string
): Promise<ApiResponse<AudioMetadata>> {
  try {
    return await api.get<AudioMetadata>(`${AUDIO_BASE}/${id}/metadata`)
  } catch (error) {
    return { success: false, error: '获取音频元数据失败' }
  }
}

/**
 * 音频转写（预留框架）
 * @param id 学习记录 ID
 * @param body 转写参数
 */
export async function transcribeAudio(
  id: string,
  body: TranscribeBody = {}
): Promise<ApiResponse<TranscriptionResult>> {
  try {
    return await api.post<TranscriptionResult>(`${AUDIO_BASE}/${id}/transcribe`, body)
  } catch (error) {
    return { success: false, error: '音频转写失败' }
  }
}

/**
 * 获取转写服务状态
 */
export async function getTranscribeStatus(): Promise<ApiResponse<ServiceStatus>> {
  try {
    return await api.get<ServiceStatus>(`${AUDIO_BASE}/transcribe/status`)
  } catch (error) {
    return { success: false, error: '获取转写服务状态失败' }
  }
}

/**
 * 获取音频片段
 * @param id 学习记录 ID
 * @param params 片段参数 { start, end }
 * @returns 返回blob响应
 */
export async function getAudioSegment(
  id: string,
  params: AudioSegmentParams
): Promise<Blob | null> {
  try {
    const url = `${API_CONFIG.BASE_URL}${AUDIO_BASE}/${id}/segment?start=${params.start}&end=${params.end}`
    const response = await fetch(url)

    if (!response.ok) {
      const data = await response.json()
      console.error('获取音频片段失败:', data.error)
      return null
    }

    return await response.blob()
  } catch (error) {
    console.error('获取音频片段失败:', error)
    return null
  }
}

/**
 * 获取音频片段下载链接
 * @param id 学习记录 ID
 * @param params 片段参数 { start, end }
 */
export function getAudioSegmentUrl(
  id: string,
  params: AudioSegmentParams
): string {
  return `${API_CONFIG.BASE_URL}${AUDIO_BASE}/${id}/segment?start=${params.start}&end=${params.end}`
}

/**
 * 语音活动检测
 * @param id 学习记录 ID
 * @param body VAD参数
 */
export async function detectVad(
  id: string,
  body: VadBody = {}
): Promise<ApiResponse<VadResult>> {
  try {
    return await api.post<VadResult>(`${AUDIO_BASE}/${id}/vad`, body)
  } catch (error) {
    return { success: false, error: '语音活动检测失败' }
  }
}

/**
 * 获取VAD服务状态
 */
export async function getVadStatus(): Promise<ApiResponse<ServiceStatus>> {
  try {
    return await api.get<ServiceStatus>(`${AUDIO_BASE}/vad/status`)
  } catch (error) {
    return { success: false, error: '获取VAD服务状态失败' }
  }
}

/**
 * 下载音频片段
 * @param id 学习记录 ID
 * @param params 片段参数
 * @param filename 下载文件名
 */
export async function downloadAudioSegment(
  id: string,
  params: AudioSegmentParams,
  filename?: string
): Promise<boolean> {
  try {
    const blob = await getAudioSegment(id, params)
    if (!blob) return false

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `audio_segment_${params.start}-${params.end}.mp3`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    return true
  } catch (error) {
    console.error('下载音频片段失败:', error)
    return false
  }
}

// =====================================================
// 语义分析类型定义
// =====================================================

// 语义标记点
export interface SemanticMark {
  timestamp: number
  content: string
  type: string
  importance: number
}

// 语义分析响应
export interface SemanticAnalysisResult {
  studyRecordId: string
  courseName: string
  chapterName: string
  audioDuration: number
  transcription: string
  transcriptionSegments: Array<{
    start: number
    end: number
    text: string
  }>
  semanticMarks: SemanticMark[]
  hasTranscription: boolean
  hasSemanticAnalysis: boolean
  message?: string
  requires配置?: {
    OPENAI_API_KEY?: string
    GEMINI_API_KEY?: string
  }
}

/**
 * AI语义分析 - 生成智能标记点
 * @param id 学习记录ID
 */
export async function semanticAnalysis(
  id: string
): Promise<ApiResponse<SemanticAnalysisResult>> {
  try {
    return await api.post<SemanticAnalysisResult>(`${AUDIO_BASE}/${id}/semantic-analysis`)
  } catch (error) {
    console.error('语义分析失败:', error)
    return { success: false, error: '语义分析失败' }
  }
}

/**
 * 格式化时长为 mm:ss 或 hh:mm:ss
 * @param seconds 秒数
 */
export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

/**
 * 解析时长字符串为秒数
 * @param timeStr 时长字符串 (mm:ss 或 hh:mm:ss)
 */
export function parseDuration(timeStr: string): number | null {
  const parts = timeStr.split(':').map(Number)

  if (parts.length === 2) {
    const [minutes, seconds] = parts
    if (isNaN(minutes) || isNaN(seconds)) return null
    return minutes * 60 + seconds
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null
    return hours * 3600 + minutes * 60 + seconds
  }

  return null
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`
}

/**
 * 格式化比特率
 * @param bitrate 比特率 (bps)
 */
export function formatBitrate(bitrate: number): string {
  if (bitrate >= 1000) {
    return `${(bitrate / 1000).toFixed(0)} kbps`
  }
  return `${bitrate} bps`
}

/**
 * 格式化采样率
 * @param sampleRate 采样率 (Hz)
 */
export function formatSampleRate(sampleRate: number): string {
  if (sampleRate >= 1000) {
    return `${(sampleRate / 1000).toFixed(1)} kHz`
  }
  return `${sampleRate} Hz`
}
