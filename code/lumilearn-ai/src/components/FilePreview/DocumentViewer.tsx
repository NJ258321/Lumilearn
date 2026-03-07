// =====================================================
// DocumentViewer - 文档预览组件
// 支持 PDF 在线预览和下载
// =====================================================

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Download, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, FileText, Loader2, AlertCircle } from 'lucide-react'

interface DocumentViewerProps {
  src: string
  title?: string
  onClose?: () => void
  showDownload?: boolean
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  src,
  title,
  onClose,
  showDownload = true,
}) => {
  // State
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 加载 PDF
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)
    setCurrentPage(1)

    // 模拟加载进度
    const progressInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 100)

    // 设置 iframe 的 src
    const loadTimeout = setTimeout(() => {
      setIsLoading(false)
      setLoadingProgress(100)
    }, 1500)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(loadTimeout)
    }
  }, [src])

  // 缩放
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  // 翻页
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  // 跳转页码
  const handlePageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const page = parseInt(e.target.value, 10)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  // 下载文档
  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = title || 'document'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('下载失败:', err)
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return

      switch (e.key) {
        case 'Escape':
          onClose?.()
          break
        case 'ArrowLeft':
          goToPrevPage()
          break
        case 'ArrowRight':
          goToNextPage()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentPage, totalPages, onClose])

  // 构建 PDF URL - 使用浏览器内置PDF渲染
  const getPdfUrl = useCallback(() => {
    // 直接返回源文件URL，让浏览器内置PDF渲染器处理
    // 或者使用 Google Docs Viewer 作为备选
    if (src.startsWith('http')) {
      // 对于跨域URL，使用 Google Docs Viewer
      return `https://docs.google.com/viewer?url=${encodeURIComponent(src)}&embedded=true`
    }
    return src
  }, [src])

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        {/* 标题和关闭 */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors"
          >
            <X size={20} />
          </button>
          <h3 className="text-white font-medium truncate max-w-[300px]">
            {title || '文档预览'}
          </h3>
        </div>

        {/* 缩放控制 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors disabled:opacity-50"
            title="缩小"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-white text-sm min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors disabled:opacity-50"
            title="放大"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        {/* 页码控制和下载 */}
        <div className="flex items-center space-x-3">
          {/* 翻页 */}
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage <= 1}
              className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center space-x-1">
              <input
                type="number"
                value={currentPage}
                onChange={handlePageInput}
                className="w-14 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm text-center focus:outline-none focus:border-blue-500"
                min={1}
                max={totalPages || 1}
              />
              <span className="text-white/60 text-sm">/</span>
              <span className="text-white text-sm">{totalPages || '?'}</span>
            </div>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages}
              className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 下载 */}
          {showDownload && (
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors"
              title="下载"
            >
              <Download size={18} />
            </button>
          )}
        </div>
      </div>

      {/* 文档预览区域 */}
      <div
        ref={containerRef}
        className="flex-1 bg-slate-100 overflow-auto flex items-start justify-center p-4"
      >
        {/* 加载状态 */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <Loader2 size={48} className="text-blue-500 animate-spin" />
            <p className="text-slate-600">加载中 {loadingProgress}%</p>
            <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <AlertCircle size={48} className="text-red-500" />
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* PDF 预览 - 使用 iframe 嵌入 Mozilla PDF.js viewer */}
        {!isLoading && !error && (
          <div
            className="bg-white shadow-lg transition-transform duration-200"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
          >
            <iframe
              ref={iframeRef}
              src={getPdfUrl()}
              className="w-[816px] h-[1056px]"
              style={{ border: 'none' }}
              title={title || 'PDF Preview'}
            />
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="px-4 py-2 bg-slate-800 border-t border-slate-700">
        <p className="text-white/50 text-xs text-center">
          使用 ← → 键翻页，+ - 键缩放，按 ESC 关闭
        </p>
      </div>
    </div>
  )
}

// 简化版文档预览（直接嵌入PDF）
interface SimpleDocumentViewerProps {
  src: string
  title?: string
  onClose?: () => void
}

export const SimpleDocumentViewer: React.FC<SimpleDocumentViewerProps> = ({
  src,
  title,
  onClose,
}) => {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col">
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg text-white transition-colors"
          >
            <X size={20} />
          </button>
          <FileText size={20} className="text-blue-400" />
          <h3 className="text-white font-medium truncate">
            {title || '文档预览'}
          </h3>
        </div>
        <button
          onClick={() => {
            const a = document.createElement('a')
            a.href = src
            a.download = title || 'document'
            a.click()
          }}
          className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition-colors"
        >
          <Download size={16} />
          <span>下载</span>
        </button>
      </div>

      {/* PDF 嵌入 */}
      <div className="flex-1 bg-slate-700">
        {error ? (
          <div className="flex flex-col items-center justify-center h-full">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <p className="text-white/70">{error}</p>
          </div>
        ) : (
          <iframe
            src={src}
            className="w-full h-full"
            title={title || 'Document'}
            onError={() => setError('文档加载失败')}
          />
        )}
      </div>
    </div>
  )
}

export default DocumentViewer
