// =====================================================
// 文件上传 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type { ApiResponse, UploadedFile } from '../../types'

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
