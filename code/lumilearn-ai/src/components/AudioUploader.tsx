// =====================================================
// AudioUploader - 音频上传组件
// 支持文件选择、格式校验、进度条、上传成功回调
// =====================================================

import React, { useState, useRef } from 'react'
import { Upload, X, FileAudio, Loader2, CheckCircle, AlertCircle, Play, Pause } from 'lucide-react'
import { uploadAudio } from '../api/upload'

interface AudioUploaderProps {
  onSuccess?: (url: string, filename: string) => void
  onError?: (error: string) => void
  maxSizeMB?: number
  acceptedFormats?: string[]
  label?: string
}

const DEFAULT_ACCEPTED_FORMATS = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/x-m4a']
const DEFAULT_MAX_SIZE_MB = 50

const AudioUploader: React.FC<AudioUploaderProps> = ({
  onSuccess,
  onError,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS,
  label = '上传音频',
}) => {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Validate file
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
    const file = e.target.files?.[0]
    if (!file) return

    // Reset state
    setError(null)
    setSuccess(null)
    setPreviewUrl(null)

    // Validate
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      onError?.(validationError)
      return
    }

    setSelectedFile(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return

    setUploading(true)
    setProgress(0)
    setError(null)

    // Simulate progress (since fetch doesn't provide upload progress)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      const response = await uploadAudio(selectedFile)

      clearInterval(progressInterval)

      if (response.success && response.data) {
        setProgress(100)
        setSuccess('上传成功！')
        onSuccess?.(response.data.url, response.data.filename)

        // Clear file after successful upload
        setTimeout(() => {
          setSelectedFile(null)
          setPreviewUrl(null)
          setSuccess(null)
        }, 2000)
      } else {
        const errorMsg = response.error || '上传失败，请重试'
        setError(errorMsg)
        onError?.(errorMsg)
      }
    } catch (err) {
      clearInterval(progressInterval)
      const errorMsg = '上传失败，请检查网络连接'
      setError(errorMsg)
      onError?.(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  // Handle remove file
  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setError(null)
    setSuccess(null)
    setProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Toggle preview playback
  const togglePreview = () => {
    if (!audioRef.current || !previewUrl) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full">
      {/* Hidden audio element for preview */}
      {previewUrl && (
        <audio
          ref={audioRef}
          src={previewUrl}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              audioRef.current.volume = 0.8
            }
          }}
        />
      )}

      {/* File input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!selectedFile ? (
        /* Upload area */
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all"
        >
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Upload size={24} className="text-blue-600" />
            </div>
            <p className="text-sm font-medium text-slate-700">{label}</p>
            <p className="text-xs text-slate-400 mt-1">
              支持 {acceptedFormats.map(f => f.split('/')[1]).join('、')}，最大 {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
        /* Selected file preview */
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <div className="flex items-start space-x-3">
            {/* File icon */}
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileAudio size={20} className="text-blue-600" />
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {formatSize(selectedFile.size)}
              </p>

              {/* Preview player */}
              {previewUrl && (
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={togglePreview}
                    className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                  </button>
                  <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all"
                      style={{ width: isPlaying ? '100%' : '0%' }}
                    />
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {uploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>上传中...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mt-3 flex items-center space-x-2 text-red-500 text-xs">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}

              {/* Success message */}
              {success && (
                <div className="mt-3 flex items-center space-x-2 text-green-500 text-xs">
                  <CheckCircle size={14} />
                  <span>{success}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col space-y-2">
              {!uploading && (
                <>
                  <button
                    onClick={handleUpload}
                    className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    上传
                  </button>
                  <button
                    onClick={handleRemove}
                    className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-300 transition-colors"
                  >
                    取消
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AudioUploader
