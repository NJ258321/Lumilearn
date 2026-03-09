// =====================================================
// HandwritingCanvas - 手写笔迹回放组件
// 支持Canvas笔迹动画、与音频同步播放
// =====================================================

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Pen, Play, Pause, RefreshCw, Settings } from 'lucide-react'

// 笔迹点数据
interface StrokePoint {
  x: number
  y: number
  timestamp: number
  pressure?: number
}

// 笔画数据
interface Stroke {
  id: string
  points: StrokePoint[]
  color: string
  width: number
}

// 笔迹数据（从后端API获取）
interface HandwritingData {
  strokes: Stroke[]
  duration: number
  width: number
  height: number
}

interface HandwritingCanvasProps {
  handwritingData?: HandwritingData
  currentTime: number
  isPlaying: boolean
  onTimeUpdate?: (time: number) => void
  className?: string
  // 模拟数据（开发测试用）
  useMockData?: boolean
}

// 模拟笔迹数据
const MOCK_HANDWRITING_DATA: HandwritingData = {
  width: 800,
  height: 600,
  duration: 50,
  strokes: [
    {
      id: 'stroke-1',
      color: '#1e40af',
      width: 3,
      points: [
        { x: 100, y: 100, timestamp: 0 },
        { x: 120, y: 110, timestamp: 1 },
        { x: 150, y: 130, timestamp: 2 },
        { x: 180, y: 160, timestamp: 3 },
        { x: 200, y: 200, timestamp: 4 },
      ]
    },
    {
      id: 'stroke-2',
      color: '#1e40af',
      width: 3,
      points: [
        { x: 200, y: 200, timestamp: 5 },
        { x: 220, y: 210, timestamp: 6 },
        { x: 250, y: 230, timestamp: 7 },
        { x: 280, y: 260, timestamp: 8 },
      ]
    },
    {
      id: 'stroke-3',
      color: '#dc2626',
      width: 2,
      points: [
        { x: 300, y: 150, timestamp: 10 },
        { x: 320, y: 170, timestamp: 11 },
        { x: 350, y: 200, timestamp: 12 },
        { x: 380, y: 240, timestamp: 13 },
        { x: 400, y: 280, timestamp: 14 },
      ]
    },
  ]
}

const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  handwritingData,
  currentTime,
  isPlaying,
  onTimeUpdate,
  className = '',
  useMockData = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  const [data, setData] = useState<HandwritingData | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [strokeColor, setStrokeColor] = useState('#1e40af')
  const [strokeWidth, setStrokeWidth] = useState(3)

  // 加载数据
  useEffect(() => {
    if (handwritingData) {
      setData(handwritingData)
    } else if (useMockData) {
      setData(MOCK_HANDWRITING_DATA)
    }
  }, [handwritingData, useMockData])

  // 初始化Canvas尺寸
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !data) return

    const canvas = canvasRef.current
    const container = containerRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // 设置Canvas尺寸为容器尺寸
    canvas.width = container.clientWidth
    canvas.height = container.clientHeight

    // 初始绘制
    drawStroke(0)
  }, [data])

  // 绘制笔画（根据当前时间）
  const drawStroke = useCallback((time: number) => {
    if (!canvasRef.current || !data) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 计算缩放比例
    const scaleX = canvas.width / data.width
    const scaleY = canvas.height / data.height

    // 绘制已完成的笔画
    data.strokes.forEach((stroke) => {
      const pointsInTime = stroke.points.filter(p => p.timestamp <= time)

      if (pointsInTime.length < 2) return

      ctx.beginPath()
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.width * Math.min(scaleX, scaleY)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // 绘制路径
      ctx.moveTo(pointsInTime[0].x * scaleX, pointsInTime[0].y * scaleY)

      for (let i = 1; i < pointsInTime.length; i++) {
        const point = pointsInTime[i]
        ctx.lineTo(point.x * scaleX, point.y * scaleY)
      }

      ctx.stroke()

      // 绘制当前正在写的笔画（带渐变效果）
      const currentStrokeTime = time
      const strokeEndTime = stroke.points[stroke.points.length - 1]?.timestamp || 0

      if (currentStrokeTime > strokeEndTime - 1 && currentStrokeTime <= strokeEndTime + 0.5) {
        // 书写中的笔画，添加发光效果
        ctx.shadowColor = stroke.color
        ctx.shadowBlur = 10
        ctx.stroke()
        ctx.shadowBlur = 0
      }
    })
  }, [data])

  // 监听时间变化
  useEffect(() => {
    drawStroke(currentTime)
  }, [currentTime, drawStroke])

  // 动画循环（用于实时绘制）
  useEffect(() => {
    if (!isPlaying || !data) return

    let lastTime = performance.now()
    let startTimestamp = currentTime

    const animate = (timestamp: number) => {
      const deltaTime = (timestamp - lastTime) / 1000
      lastTime = timestamp

      const newTime = startTimestamp + deltaTime

      if (newTime <= data.duration) {
        drawStroke(newTime)
        onTimeUpdate?.(newTime)
        animationRef.current = requestAnimationFrame(animate)
      } else {
        drawStroke(data.duration)
        onTimeUpdate?.(data.duration)
      }
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, data, onTimeUpdate])

  // 重新开始播放
  const handleRestart = () => {
    onTimeUpdate?.(0)
    drawStroke(0)
  }

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // 没有数据时的空状态
  if (!data) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-slate-800 flex items-center space-x-2">
            <Pen size={18} className="text-blue-500" />
            <span>手写笔迹</span>
          </h3>
        </div>
        <div className="flex items-center justify-center h-48 text-slate-400">
          <p>暂无笔迹数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <h3 className="font-medium text-slate-800 flex items-center space-x-2">
          <Pen size={18} className="text-blue-500" />
          <span>手写笔迹回放</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRestart}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            title="重新播放"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            title="设置"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">颜色:</span>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">粗细:</span>
              <input
                type="range"
                min="1"
                max="10"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-xs text-slate-400">{strokeWidth}px</span>
            </div>
          </div>
        </div>
      )}

      {/* Canvas 画布 */}
      <div
        ref={containerRef}
        className="relative bg-slate-50"
        style={{ height: '300px' }}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />

        {/* 播放进度指示器 */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-xs text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(data.duration)}</span>
        </div>

        {/* 时间进度条 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
          <div
            className="h-full bg-blue-500 transition-all duration-100"
            style={{ width: `${(currentTime / data.duration) * 100}%` }}
          />
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
        <div className="text-xs text-slate-500">
          {data.strokes.length} 笔画
        </div>
        <div className="flex items-center space-x-2">
          {isPlaying ? (
            <div className="flex items-center space-x-1 text-blue-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-xs">书写中</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 text-slate-400">
              <Pause size={14} />
              <span className="text-xs">已暂停</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HandwritingCanvas

// 导出类型供外部使用
export type { HandwritingData, Stroke, StrokePoint }
