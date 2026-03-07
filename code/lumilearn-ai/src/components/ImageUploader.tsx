// =====================================================
// ImageUploader - 图片上传组件
// 支持图片预览、上传、删除已上传图片
// =====================================================

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Image, Loader2, CheckCircle, AlertCircle, Plus, Trash2, ExternalLink } from 'lucide-react'
import { uploadImage, deleteFile, getFileInfo } from '../api/upload'

interface ImageUploaderProps {
  onSuccess?: (urls: string[]) => void
  onError?: (error: string) => void
  onDelete?: (url: string) => void
  maxSizeMB?: number
  maxCount?: number
  acceptedFormats?: string[]
  label?: string
  multiple?: boolean
  // 已上传的图片URL列表（用于编辑模式）
  initialImages?: string[]
}

const DEFAULT_ACCEPTED_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
const DEFAULT_MAX_SIZE_MB = 10
const DEFAULT_MAX_COUNT = 9

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onSuccess,
  onError,
  onDelete,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  maxCount = DEFAULT_MAX_COUNT,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  label = '上传图片',
  multiple = true,
  initialImages = [],
}) => {
  // State
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  // 已上传的图片列表（URL和上传后的filename对应）
  const [uploadedImages, setUploadedImages] = useState<Array<{ url: string; filename: string }>>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  // 删除确认
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; index: number; url: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 初始化已上传的图片
  useEffect(() => {
    if (initialImages.length > 0) {
      const images = initialImages.map(url => {
        const info = getFileInfo(url)
        return { url, filename: info?.filename || '' }
      })
      setUploadedImages(images)
    }
  }, [initialImages])

  // 计算剩余可上传数量
  const remainingSlots = maxCount - selectedFiles.length - uploadedImages.length

  // Validate single file
  const validateFile = (file: File): string | null => {
    // Check format
    if (!acceptedFormats.includes(file.type)) {
      return `不支持的格式，请上传 ${acceptedFormats.map(f => f.split('/')[1]).join('、')} 格式`
    }

    // Check size
    const maxBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxBytes) {
      return `文件大小不能超过 ${maxSizeMB}MB`
    }

    return null
  }

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[]
    if (files.length === 0) return

    // Reset state
    setError(null)
    setSuccess(false)

    // Check max count (考虑已上传的图片)
    if (remainingSlots <= 0) {
      setError(`最多只能上传 ${maxCount} 张图片`)
      onError?.(`最多只能上传 ${maxCount} 张图片`)
      return
    }

    // Limit files to remaining slots
    const filesToAdd = multiple ? files.slice(0, remainingSlots) : [files[0]]

    // Validate all files
    const invalidFiles: string[] = []
    const validFiles: File[] = []

    filesToAdd.forEach(file => {
      const validationError = validateFile(file)
      if (validationError) {
        invalidFiles.push(`${file.name}: ${validationError}`)
      } else {
        validFiles.push(file)
      }
    })

    if (invalidFiles.length > 0) {
      setError(invalidFiles.join('\n'))
      onError?.(invalidFiles.join('\n'))
    }

    if (validFiles.length === 0) return

    // Add preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file))

    setSelectedFiles(prev => [...prev, ...validFiles])
    setPreviewUrls(prev => [...prev, ...newPreviewUrls])

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle remove file
  const handleRemove = (index: number) => {
    // Revoke URL to avoid memory leak
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index])
    }

    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setPreviewUrls(prev => prev.filter((_, i) => i !== index))
    setError(null)
  }

  // Handle upload
  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    const uploadedUrls: string[] = []

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const response = await uploadImage(file)

        if (response.success && response.data) {
          uploadedUrls.push(response.data.url)
        } else {
          throw new Error(response.error || '上传失败')
        }

        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100))
      }

      setSuccess(true)
      onSuccess?.(uploadedUrls)

      // Clear after success
      setTimeout(() => {
        setSelectedFiles([])
        setPreviewUrls([])
        setSuccess(false)
      }, 2000)

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '上传失败，请检查网络连接'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  // Handle clear all (只清空待上传的，不清空已上传的)
  const handleClearAll = () => {
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    setSelectedFiles([])
    setPreviewUrls([])
    setError(null)
    setSuccess(false)
  }

  // 删除已上传的图片
  const handleDeleteUploaded = async () => {
    if (!deleteConfirm) return

    setDeleting(true)
    const { index, url } = deleteConfirm

    try {
      const image = uploadedImages[index]
      if (image && image.filename) {
        const response = await deleteFile(image.filename)
        if (!response.success) {
          throw new Error(response.error || '删除失败')
        }
      }

      // 从列表中移除
      setUploadedImages(prev => prev.filter((_, i) => i !== index))
      onDelete?.(url)
      setDeleteConfirm(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '删除失败，请重试'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setDeleting(false)
    }
  }

  // 打开删除确认
  const openDeleteConfirm = (index: number, url: string) => {
    setDeleteConfirm({ show: true, index, url })
  }

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const canAddMore = remainingSlots > 0

  return (
    <div className="w-full">
      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        multiple={multiple}
        className="hidden"
      />

      {/* 已上传的图片列表 */}
      {uploadedImages.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-slate-600 mb-2">已上传图片 ({uploadedImages.length}/{maxCount})</p>
          <div className="grid grid-cols-3 gap-3">
            {uploadedImages.map((image, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group"
              >
                <img
                  src={image.url}
                  alt={`已上传 ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => openDeleteConfirm(index, image.url)}
                    className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                    title="删除"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Delete button always visible */}
                <button
                  onClick={() => openDeleteConfirm(index, image.url)}
                  className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload area - show when can add more */}
      {canAddMore && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all mb-4"
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Upload size={24} className="text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400 mt-1">
              已选择 {selectedFiles.length}/{maxCount} 张，支持 {acceptedFormats.map(f => f.split('/')[1]).join('、')}
            </p>
          </div>
        </div>
      )}

      {/* Preview grid */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {previewUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 group"
            >
              <img
                src={url}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handleRemove(index)}
                  className="p-2 bg-white/20 rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Remove button always visible */}
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2 text-red-600 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <div className="whitespace-pre-line">{error}</div>
          </div>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2 text-green-600 text-sm">
            <CheckCircle size={16} />
            <span>上传成功！</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {selectedFiles.length > 0 && (
        <div className="flex space-x-3">
          <button
            onClick={handleUpload}
            disabled={uploading || selectedFiles.length === 0}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>上传中 {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload size={18} />
                <span>上传 {selectedFiles.length} 张图片</span>
              </>
            )}
          </button>

          <button
            onClick={handleClearAll}
            disabled={uploading}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            清空
          </button>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="mt-4">
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {deleteConfirm?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h3 className="text-lg font-medium text-center text-slate-800 mb-2">
              确认删除
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              确定要删除这张图片吗？删除后无法恢复。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDeleteUploaded}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center"
              >
                {deleting ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" />
                    删除中...
                  </>
                ) : (
                  '删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageUploader
