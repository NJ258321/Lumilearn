// =====================================================
// 文件上传 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse, UploadedFile } from '../types'

// 上传音频文件
export async function uploadAudio(file: File): Promise<ApiResponse<UploadedFile>> {
  try {
    const formData = new FormData()
    formData.append('audio', file)
    return await api.postFormData<UploadedFile>(API_CONFIG.endpoints.uploadAudio, formData)
  } catch (error) {
    return { success: false, error: '上传音频失败' }
  }
}

// 上传图片文件
export async function uploadImage(file: File): Promise<ApiResponse<UploadedFile>> {
  try {
    const formData = new FormData()
    formData.append('image', file)
    return await api.postFormData<UploadedFile>(API_CONFIG.endpoints.uploadImage, formData)
  } catch (error) {
    return { success: false, error: '上传图片失败' }
  }
}

// 上传多个图片
export async function uploadImages(files: File[]): Promise<ApiResponse<UploadedFile[]>> {
  try {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('images', file)
    })
    return await api.postFormData<UploadedFile[]>(API_CONFIG.endpoints.uploadImage, formData)
  } catch (error) {
    return { success: false, error: '上传图片失败' }
  }
}

// 上传文档文件
export async function uploadDocument(file: File): Promise<ApiResponse<UploadedFile>> {
  try {
    const formData = new FormData()
    formData.append('document', file)
    return await api.postFormData<UploadedFile>(API_CONFIG.endpoints.uploadDocument, formData)
  } catch (error) {
    return { success: false, error: '上传文档失败' }
  }
}

// 删除文件
export async function deleteFile(filename: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    return await api.delete<{ success: boolean }>(`/api/upload/${filename}`)
  } catch (error) {
    return { success: false, error: '删除文件失败' }
  }
}

// 获取文件访问URL
export function getFileUrl(filename: string): string {
  // 编码文件名，确保特殊字符被正确处理
  const encodedFilename = encodeURIComponent(filename)
  return `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.uploadBase}/${encodedFilename}`
}

// 获取文件信息（通过URL解析）
export function getFileInfo(url: string): { filename: string; type: 'image' | 'audio' | 'video' | 'document' | 'unknown' } | null {
  try {
    const urlObj = new URL(url)
    const pathname = urlObj.pathname
    const filename = pathname.split('/').pop() || ''

    // 根据扩展名判断文件类型
    const ext = filename.split('.').pop()?.toLowerCase() || ''

    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
    const audioExts = ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac', 'flac']
    const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv']
    const documentExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']

    if (imageExts.includes(ext)) return { filename, type: 'image' }
    if (audioExts.includes(ext)) return { filename, type: 'audio' }
    if (videoExts.includes(ext)) return { filename, type: 'video' }
    if (documentExts.includes(ext)) return { filename, type: 'document' }

    return { filename, type: 'unknown' }
  } catch {
    return null
  }
}

// 验证文件类型
export function validateFileType(filename: string, allowedTypes: Array<'image' | 'audio' | 'video' | 'document' | 'unknown'>): boolean {
  const fileInfo = getFileInfo(filename)
  if (!fileInfo) return false
  return allowedTypes.includes(fileInfo.type)
}

// 获取文件扩展名
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || ''
}

// 获取文件名（不含扩展名）
export function getFileNameWithoutExt(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot > 0 ? filename.substring(0, lastDot) : filename
}
