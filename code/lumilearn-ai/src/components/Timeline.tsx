// =====================================================
// Timeline - 时间轴组件
// 支持可视化时间轴、标记点交互、拖拽定位
// =====================================================

import React, { useState, useRef, useCallback, useMemo } from 'react'
import { Flag, AlertCircle, CheckCircle, FileText, HelpCircle, XCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react'
import type { TimeMark, TimeMarkType } from '../../types'

interface TimelineProps {
  duration: number
  currentTime: number
  timeMarks: TimeMark[]
  onSeek: (time: number) => void
  disabled?: boolean
  // 是否显示错题标记
  showMistakeMarks?: boolean
  // 错题数据
  mistakeMarks?: { timestamp: number; title: string }[]
}

// 标记类型图标和颜色
const MARK_TYPE_CONFIG: { [key in TimeMarkType]?: { icon: React.ReactNode; color: string; bgColor: string; label: string } } = {
  EMPHASIS: {
    icon: <Flag size={10} />,
    color: 'bg-red-500',
    bgColor: 'bg-red-100',
    label: '重点'
  },
  NOTE: {
    icon: <FileText size={10} />,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100',
    label: '笔记'
  },
  QUESTION: {
    icon: <HelpCircle size={10} />,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-100',
    label: '疑问'
  },
  BOARD_CHANGE: {
    icon: <AlertCircle size={10} />,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-100',
    label: '板书'
  },
  START: {
    icon: <Circle size={10} />,
    color: 'bg-green-500',
    bgColor: 'bg-green-100',
    label: '开始'
  },
  END: {
    icon: <XCircle size={10} />,
    color: 'bg-gray-500',
    bgColor: 'bg-gray-100',
    label: '结束'
  },
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  timeMarks,
  onSeek,
  disabled = false,
  showMistakeMarks = false,
  mistakeMarks = []
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipTime, setTooltipTime] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState(0)
  const [selectedMark, setSelectedMark] = useState<TimeMark | null>(null)

  // 合并所有标记（时间标记 + 错题标记）
  const allMarks = useMemo(() => {
    const timeMarkPositions = timeMarks.map(m => ({ ...m, markType: 'time' as const }))
    const mistakePositions = mistakeMarks.map(m => ({
      ...m,
      id: `mistake-${m.timestamp}`,
      type: 'QUESTION' as TimeMarkType,
      markType: 'mistake' as const
    }))
    return [...timeMarkPositions, ...mistakePositions]
  }, [timeMarks, mistakeMarks])

  // 跳转到上一个/下一个标记
  // 注意：mark.timestamp 是毫秒，currentTime 是秒
  const jumpToPrevMark = useCallback(() => {
    const prevMark = allMarks
      .filter(m => m.timestamp / 1000 < currentTime - 1)
      .sort((a, b) => b.timestamp - a.timestamp)[0]
    if (prevMark) onSeek(prevMark.timestamp / 1000) // 转换为秒
  }, [allMarks, currentTime, onSeek])

  const jumpToNextMark = useCallback(() => {
    const nextMark = allMarks
      .filter(m => m.timestamp / 1000 > currentTime + 1)
      .sort((a, b) => a.timestamp - b.timestamp)[0]
    if (nextMark) onSeek(nextMark.timestamp / 1000) // 转换为秒
  }, [allMarks, currentTime, onSeek])

  // 格式化时间
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 处理点击时间轴
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !trackRef.current) return

    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const seekTime = percentage * duration

    onSeek(seekTime)
  }, [duration, onSeek, disabled])

  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    setIsDragging(true)

    const updateTimeFromPosition = (clientX: number) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const seekTime = percentage * duration
      onSeek(seekTime)
    }

    updateTimeFromPosition(e.clientX)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      updateTimeFromPosition(moveEvent.clientX)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [duration, onSeek, disabled])

  // 处理鼠标移动显示tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!trackRef.current) return

    let clientX: number
    if ('touches' in e) {
      if (e.touches.length === 0) return
      clientX = e.touches[0].clientX
    } else {
      clientX = e.clientX
    }

    const rect = trackRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const hoverTime = percentage * duration

    setTooltipTime(hoverTime)
    setTooltipPosition(percentage * 100)
    setShowTooltip(true)
  }, [duration])

  // 处理触摸开始
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (disabled) return
    setIsDragging(true)

    const updateTimeFromTouch = (touch: Touch) => {
      if (!trackRef.current) return
      const rect = trackRef.current.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const seekTime = percentage * duration
      onSeek(seekTime)
    }

    updateTimeFromTouch(e.touches[0])

    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.touches.length > 0) {
        updateTimeFromTouch(moveEvent.touches[0])
      }
    }

    const handleTouchEnd = () => {
      setIsDragging(false)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }

    document.addEventListener('touchmove', handleTouchMove)
    document.addEventListener('touchend', handleTouchEnd)
  }, [duration, onSeek, disabled])

  // 进度百分比
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  // 获取标记在时间轴上的位置
  // 注意：timestamp 是毫秒，需要转换为秒
  const getMarkPosition = (timestamp: number) => {
    const timestampInSeconds = timestamp / 1000
    return duration > 0 ? (timestampInSeconds / duration) * 100 : 0
  }

  return (
    <div className="relative w-full">
      {/* 时间轴轨道 */}
      <div
        ref={trackRef}
        className={`h-3 bg-slate-200 rounded-full cursor-pointer relative overflow-visible ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={handleTouchStart}
      >
        {/* 已播放进度 */}
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full relative"
          style={{ width: `${progressPercentage}%` }}
        >
          {/* 播放头 */}
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg border-2 border-blue-500 transition-transform ${
              isDragging ? 'scale-125' : 'scale-100'
            }`}
          />
        </div>

        {/* 标记点 */}
        {allMarks.map((mark) => {
          const markPosValue = getMarkPosition(mark.timestamp)
          const config = MARK_TYPE_CONFIG[mark.type]
          const isSelected = selectedMark?.id === mark.id
          const isMistake = 'markType' in mark && mark.markType === 'mistake'
          const isLeft = markPosValue < 15
          const isRight = markPosValue > 85
          
          return (
            <div
              key={mark.id}
              className={`absolute rounded-full cursor-pointer transition-all z-10 group
                ${isSelected ? 'w-5 h-5' : 'w-3 h-3 hover:scale-150'}
                ${isMistake ? 'ring-2 ring-red-300' : ''}`}
              style={{ 
                left: `${markPosValue}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedMark(mark as TimeMark)
                onSeek(mark.timestamp / 1000)
              }}
              onMouseEnter={() => {
                setTooltipTime(mark.timestamp / 1000)
                setTooltipPosition(markPosValue)
              }}
            >
              <div className={`w-full h-full rounded-full ${
                isMistake ? 'bg-orange-500 animate-pulse' : (config?.color || 'bg-gray-500')
              }`} />

              {/* 悬停/选中时的详细信息 */}
              <div 
                className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap"
                style={{
                  left: isLeft ? '0%' : isRight ? 'auto' : '50%',
                  right: isRight ? '0%' : 'auto',
                  transform: isLeft || isRight ? 'none' : 'translateX(-50%)'
                }}
              >
                <div className="bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {/* 时间显示 */}
                  {formatTime(mark.timestamp / 1000)}
                  
                  {/* PPT页码标记 */}
                  {(mark as any).pptPage && (
                    <span className="text-purple-300 ml-1">· PPT第{(mark as any).pptPage}页</span>
                  )}
                  
                  {/* 图片标记 */}
                  {(mark as any).imageUrl && (
                    <span className="text-green-300 ml-1">· 📷图片</span>
                  )}
                  
                  {/* 内容 */}
                  {mark.content && (
                    <span className="text-slate-300 ml-1">· {mark.content.substring(0, 15)}{mark.content.length > 15 ? '...' : ''}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}             
      </div>

      {/* 底部控制栏 */}
      <div className="flex items-center justify-between mt-2">
        {/* 跳转按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={jumpToPrevMark}
            disabled={allMarks.filter(m => m.timestamp < currentTime - 1).length === 0}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="上一个标记"
          >
            <ChevronLeft size={14} className="text-slate-400" />
          </button>
          <button
            onClick={jumpToNextMark}
            disabled={allMarks.filter(m => m.timestamp > currentTime + 1).length === 0}
            className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
            title="下一个标记"
          >
            <ChevronRight size={14} className="text-slate-400" />
          </button>
        </div>

        {/* 时间显示 */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>/</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Hover Tooltip */}
      {showTooltip && !isDragging && (
        <div
          className="absolute top-0 -translate-x-1/2 -translate-y-full mb-1 pointer-events-none"
          style={{ left: `${tooltipPosition}%` }}
        >
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded">
            {formatTime(tooltipTime)}
          </div>
        </div>
      )}

      {/* 标记图例 */}
      {(timeMarks.length > 0 || (showMistakeMarks && mistakeMarks.length > 0)) && (
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500 flex-wrap">
          <span className="mr-1">标记:</span>
          {Object.entries(MARK_TYPE_CONFIG).map(([type, config]) => {
            const hasMark = timeMarks.some(m => m.type === type)
            if (!hasMark) return null

            return (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${config?.color}`} />
                <span>{config?.label}</span>
              </div>
            )
          })}
          {showMistakeMarks && mistakeMarks.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-orange-500 ring-2 ring-orange-200" />
              <span>错题</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Timeline
