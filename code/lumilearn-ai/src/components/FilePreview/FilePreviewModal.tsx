// =====================================================
// FilePreviewModal - 统一文件预览Modal
// 根据文件类型自动选择预览组件
// =====================================================

import React, { useMemo } from 'react'
import ReactDOM from 'react-dom'
import { X, File } from 'lucide-react'
import ImagePreview from './ImagePreview'
import AudioPlayer from './AudioPlayer'
import VideoPlayer from './VideoPlayer'
import DocumentViewer, { SimpleDocumentViewer } from './DocumentViewer'
import { getFileInfo, getFileUrl } from '../../api/upload'

interface FilePreviewModalProps {
  // 文件来源（可选其一）
  filename?: string
  url?: string
  // 标题
  title?: string
  // 多图预览支持
  images?: string[]  // 多图URL数组
  currentIndex?: number  // 当前显示的图片索引
  onIndexChange?: (index: number) => void
  // 回调
  onClose: () => void
  // 配置
  showDownload?: boolean
}

type FileType = 'image' | 'audio' | 'video' | 'document' | 'unknown'

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  filename,
  url,
  title,
  images = [],
  currentIndex = 0,
  onIndexChange,
  onClose,
  showDownload = true,
}) => {
  // 解析文件信息
  const fileInfo = useMemo(() => {
    if (url) {
      const info = getFileInfo(url)
      if (info) return info
    }
    if (filename) {
      const ext = filename.split('.').pop()?.toLowerCase() || ''
      const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg']
      const audioExts = ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac', 'flac']
      const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv']
      const documentExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx']

      let type: FileType = 'unknown'
      if (imageExts.includes(ext)) type = 'image'
      else if (audioExts.includes(ext)) type = 'audio'
      else if (videoExts.includes(ext)) type = 'video'
      else if (documentExts.includes(ext)) type = 'document'

      return { filename, type }
    }
    return null
  }, [filename, url])

  // 获取文件URL
  const fileUrl = useMemo(() => {
    if (url) return url
    if (filename) return getFileUrl(filename)
    return ''
  }, [filename, url])

  // 如果有 images 数组，优先使用多图模式
  const isMultiImage = images.length > 1

  // 渲染预览内容
  const renderPreview = () => {
    // 多图模式
    if (isMultiImage) {
      const currentUrl = images[currentIndex]
      const currentFileInfo = getFileInfo(currentUrl)
      const currentFilename = currentFileInfo?.filename || `图片 ${currentIndex + 1}`

      return (
        <ImagePreview
          src={currentUrl}
          alt={currentFilename}
          onClose={onClose}
          onNext={() => onIndexChange?.((currentIndex + 1) % images.length)}
          onPrev={() => onIndexChange?.((currentIndex - 1 + images.length) % images.length)}
          showNav={true}
          showDownload={showDownload}
        />
      )
    }

    // 单图模式
    if (!fileInfo) {
      return <UnknownFilePreview url={fileUrl} title={title} onClose={onClose} showDownload={showDownload} />
    }

    switch (fileInfo.type) {
      case 'image':
        return (
          <ImagePreview
            src={fileUrl}
            alt={fileInfo.filename}
            onClose={onClose}
            showDownload={showDownload}
          />
        )

      case 'audio':
        return (
          <div className="flex items-center justify-center min-h-[300px] bg-slate-900 rounded-xl p-4">
            <AudioPlayer
              src={fileUrl}
              title={title || fileInfo.filename}
              onClose={onClose}
              showDownload={showDownload}
            />
          </div>
        )

      case 'video':
        return (
          <div className="w-full max-w-4xl">
            <VideoPlayer
              src={fileUrl}
              title={title || fileInfo.filename}
              onClose={onClose}
              showDownload={showDownload}
            />
          </div>
        )

      case 'document':
        // PDF 使用嵌入预览，其他文档提供下载
        const ext = fileInfo.filename.split('.').pop()?.toLowerCase()
        if (ext === 'pdf') {
          return (
            <div className="w-full h-full max-w-5xl">
              <DocumentViewer
                src={fileUrl}
                title={title || fileInfo.filename}
                onClose={onClose}
                showDownload={showDownload}
              />
            </div>
          )
        }
        return <UnknownFilePreview url={fileUrl} title={title || fileInfo.filename} onClose={onClose} showDownload={showDownload} />

      default:
        return <UnknownFilePreview url={fileUrl} title={title} onClose={onClose} showDownload={showDownload} />
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      {renderPreview()}

      {/* 多图模式下的底部缩略图导航 */}
      {isMultiImage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-black/70 backdrop-blur-sm rounded-full px-4 py-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onIndexChange?.(idx)}
              className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                idx === currentIndex ? 'border-blue-500 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`缩略图 ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
          <span className="text-white text-sm ml-2">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  )
}

// 未知文件类型预览
const UnknownFilePreview: React.FC<{
  url: string
  title?: string
  onClose: () => void
  showDownload?: boolean
}> = ({ url, title, onClose, showDownload = true }) => {
  const handleDownload = async () => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = title || 'file'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('下载失败:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex items-center justify-center">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X size={24} />
      </button>

      <div className="text-center p-8">
        <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <File size={48} className="text-slate-400" />
        </div>
        <h3 className="text-white text-xl font-medium mb-2">
          {title || '无法预览此文件'}
        </h3>
        <p className="text-slate-400 mb-6">
          该文件类型暂不支持在线预览
        </p>

        {showDownload && (
          <button
            onClick={handleDownload}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            下载文件
          </button>
        )}
      </div>
    </div>
  )
}

export default FilePreviewModal

// =====================================================
// 便捷函数：打开文件预览
// =====================================================

interface OpenPreviewOptions {
  filename?: string
  url?: string
  title?: string
  images?: string[]
  currentIndex?: number
  onIndexChange?: (index: number) => void
  showDownload?: boolean
}

// 创建一个预览Modal并挂载到DOM
export function openFilePreview(options: OpenPreviewOptions) {
  const {
    filename,
    url,
    title,
    images,
    currentIndex = 0,
    onIndexChange,
    showDownload = true,
  } = options

  // 创建容器
  const container = document.createElement('div')
  container.id = 'file-preview-modal-container'
  document.body.appendChild(container)

  // 关闭函数
  const handleClose = () => {
    import('react-dom/client').then(({ createRoot }) => {
      const root = createRoot(container)
      root.unmount()
    })
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  // 使用 React 18 的 createRoot
  import('react-dom/client').then(({ createRoot }) => {
    const root = createRoot(container)
    root.render(
      <FilePreviewModal
        filename={filename}
        url={url}
        title={title}
        images={images}
        currentIndex={currentIndex}
        onIndexChange={onIndexChange}
        onClose={handleClose}
        showDownload={showDownload}
      />
    )
  })

  return { close: handleClose }
}
