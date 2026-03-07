// =====================================================
// ImagePreview - 图片预览组件
// 支持缩放、旋转、拖拽、多图切换
// =====================================================

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Download, Move } from 'lucide-react'

interface ImagePreviewProps {
  src: string
  alt?: string
  onClose?: () => void
  onNext?: () => void
  onPrev?: () => void
  showNav?: boolean
  showDownload?: boolean
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt = '图片预览',
  onClose,
  onNext,
  onPrev,
  showNav = false,
  showDownload = true,
}) => {
  // State
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)

  // 重置状态
  const resetState = useCallback(() => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
    setImageLoaded(false)
    setImageError(false)
  }, [])

  // 加载新图片时重置
  useEffect(() => {
    resetState()
  }, [src, resetState])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose?.()
          break
        case 'ArrowLeft':
          if (showNav && onPrev) onPrev()
          break
        case 'ArrowRight':
          if (showNav && onNext) onNext()
          break
        case '+':
        case '=':
          handleZoomIn()
          break
        case '-':
          handleZoomOut()
          break
        case 'r':
        case 'R':
          handleRotate()
          break
        case '0':
          resetState()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNext, onPrev, showNav])

  // 缩放操作
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 5))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.1))
  }

  // 旋转操作
  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  // 拖拽操作
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      handleZoomIn()
    } else {
      handleZoomOut()
    }
  }

  // 下载图片
  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = alt || 'image'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载失败:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* 导航按钮 - 左 */}
      {showNav && onPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* 导航按钮 - 右 */}
      {showNav && onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* 底部工具栏 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
        <button
          onClick={handleZoomOut}
          className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
          title="缩小"
        >
          <ZoomOut size={20} />
        </button>
        <span className="text-white text-sm min-w-[60px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
          title="放大"
        >
          <ZoomIn size={20} />
        </button>

        <div className="w-px h-6 bg-white/30 mx-1" />

        <button
          onClick={handleRotate}
          className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
          title="旋转"
        >
          <RotateCw size={20} />
        </button>

        <div className="w-px h-6 bg-white/30 mx-1" />

        <button
          onClick={resetState}
          className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
          title="重置"
        >
          <Move size={20} />
        </button>

        {showDownload && (
          <>
            <div className="w-px h-6 bg-white/30 mx-1" />
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/20 rounded-full text-white transition-colors"
              title="下载"
            >
              <Download size={20} />
            </button>
          </>
        )}
      </div>

      {/* 图片容器 */}
      <div
        ref={containerRef}
        className="max-w-[90vw] max-h-[80vh] overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      >
        {!imageLoaded && !imageError && (
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {imageError && (
          <div className="flex items-center justify-center text-white">
            <p>图片加载失败</p>
          </div>
        )}

        <img
          src={src}
          alt={alt}
          className={`max-w-full max-h-[80vh] object-contain transition-transform duration-200 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg) translate(${position.x}px, ${position.y}px)`,
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          draggable={false}
        />
      </div>
    </div>
  )
}

export default ImagePreview
