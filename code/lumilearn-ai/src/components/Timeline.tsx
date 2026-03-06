// =====================================================
// Timeline - 时间轴组件
// 支持可视化时间轴、标记点交互、拖拽定位
// =====================================================

import React, { useState, useRef, useCallback } from 'react'
import { Flag, AlertCircle, CheckCircle, FileText, HelpCircle } from 'lucide-react'
import type { TimeMark, TimeMarkType } from '../../types'

interface TimelineProps {
  duration: number
  currentTime: number
  timeMarks: TimeMark[]
  onSeek: (time: number) => void
  disabled?: boolean
}

// 标记类型图标和颜色
const MARK_TYPE_CONFIG: { [key in TimeMarkType]?: { icon: React.ReactNode; color: string; bgColor: string } } = {
  EMPHASIS: {
    icon: <Flag size={10} />,
    color: 'bg-red-500',
    bgColor: 'bg-red-100'
  },
  NOTE: {
    icon: <FileText size={10} />,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-100'
  },
  QUESTION: {
    icon: <HelpCircle size={10} />,
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-100'
  },
  BOARD_CHANGE: {
    icon: <AlertCircle size={10} />,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-100'
  },
}

const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  timeMarks,
  onSeek,
  disabled = false
}) => {
  const trackRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipTime, setTooltipTime] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState(0)

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
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return

    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(1, x / rect.width))
    const hoverTime = percentage * duration

    setTooltipTime(hoverTime)
    setTooltipPosition(percentage * 100)
    setShowTooltip(true)
  }, [duration])

  // 进度百分比
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  // 获取标记在时间轴上的位置
  const getMarkPosition = (timestamp: number) => {
    return duration > 0 ? (timestamp / duration) * 100 : 0
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
        {timeMarks.map((mark) => {
          const markPos = getMarkPosition(mark.timestamp)
          const config = MARK_TYPE_CONFIG[mark.type]

          return (
            <div
              key={mark.id}
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${config?.color || 'bg-gray-500'}
                cursor-pointer hover:scale-150 transition-transform z-10 group`}
              style={{ left: `${markPos}%` }}
              onClick={(e) => {
                e.stopPropagation()
                onSeek(mark.timestamp)
              }}
              title={`${formatTime(mark.timestamp)} - ${mark.data?.noteText || ''}`}
            >
              {/* 标记提示 */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-black/80 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  {formatTime(mark.timestamp)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 底部时间显示 */}
      <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-mono">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
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
      {timeMarks.length > 0 && (
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
          <span className="mr-1">标记:</span>
          {Object.entries(MARK_TYPE_CONFIG).map(([type, config]) => {
            const hasMark = timeMarks.some(m => m.type === type)
            if (!hasMark) return null

            return (
              <div key={type} className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${config?.color}`} />
                <span>{type === 'EMPHASIS' ? '重点' :
                       type === 'NOTE' ? '笔记' :
                       type === 'QUESTION' ? '疑问' : '板书'}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Timeline
