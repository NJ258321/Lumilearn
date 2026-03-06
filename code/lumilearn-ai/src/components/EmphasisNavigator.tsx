// =====================================================
// EmphasisNavigator - 重点标记导航组件
// 展示重点标记列表，一键跳转
// =====================================================

import React, { useMemo } from 'react'
import { Flag, Clock, Zap, ChevronRight } from 'lucide-react'
import type { TimeMark } from '../../types'

interface EmphasisNavigatorProps {
  timeMarks: TimeMark[]
  currentTime: number
  onSeek: (time: number) => void
}

const EmphasisNavigator: React.FC<EmphasisNavigatorProps> = ({
  timeMarks,
  currentTime,
  onSeek,
}) => {
  // 过滤出重点类型的标记（EMPHASIS）
  const emphasisMarks = useMemo(() => {
    return timeMarks
      .filter(mark => mark.type === 'EMPHASIS')
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [timeMarks])

  // 格式化时间
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 获取当前激活的重点索引
  const getActiveIndex = (): number => {
    if (emphasisMarks.length === 0) return -1
    for (let i = emphasisMarks.length - 1; i >= 0; i--) {
      if (currentTime >= emphasisMarks[i].timestamp) {
        return i
      }
    }
    return -1
  }

  const activeIndex = getActiveIndex()

  // 跳转到下一个重点
  const jumpToNext = () => {
    const nextIndex = activeIndex + 1
    if (nextIndex < emphasisMarks.length) {
      onSeek(emphasisMarks[nextIndex].timestamp)
    }
  }

  // 跳转到上一个重点
  const jumpToPrev = () => {
    const prevIndex = activeIndex - 1
    if (prevIndex >= 0) {
      onSeek(emphasisMarks[prevIndex].timestamp)
    }
  }

  // 没有重点标记时显示空状态
  if (emphasisMarks.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400">
        <Flag size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无重点标记</p>
        <p className="text-xs mt-1">使用"快速标记"添加重点</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 快捷导航按钮 */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={jumpToPrev}
          disabled={activeIndex <= 0}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeIndex > 0
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-slate-50 text-slate-300 cursor-not-allowed'
          }`}
        >
          上一条
        </button>
        <div className="text-xs text-slate-400 font-medium px-2">
          {activeIndex >= 0 ? `${activeIndex + 1}` : '0'} / {emphasisMarks.length}
        </div>
        <button
          onClick={jumpToNext}
          disabled={activeIndex >= emphasisMarks.length - 1}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            activeIndex < emphasisMarks.length - 1
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              : 'bg-slate-50 text-slate-300 cursor-not-allowed'
          }`}
        >
          下一条
        </button>
      </div>

      {/* 重点标记列表 */}
      <div className="space-y-2 max-h-[250px] overflow-y-auto">
        {emphasisMarks.map((mark, index) => {
          const isActive = index === activeIndex
          const isPast = currentTime > mark.timestamp

          return (
            <button
              key={mark.id}
              onClick={() => onSeek(mark.timestamp)}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
                isActive
                  ? 'bg-red-50 border-red-200 shadow-sm'
                  : isPast
                  ? 'bg-white border-slate-100 hover:border-red-200 hover:bg-red-50/50'
                  : 'bg-slate-50 border-slate-100 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 序号标识 */}
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isActive
                    ? 'bg-red-500 text-white'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {index + 1}
                </div>

                {/* 时间 */}
                <div className="flex items-center gap-1 text-xs font-mono text-slate-500">
                  <Clock size={12} />
                  {formatTime(mark.timestamp)}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${
                    isActive ? 'text-red-800 font-medium' : 'text-slate-600'
                  }`}>
                    {mark.content || mark.data?.noteText || '重点内容'}
                  </p>
                </div>

                {/* 跳转指示 */}
                <ChevronRight
                  size={16}
                  className={`flex-shrink-0 transition-transform ${
                    isActive
                      ? 'text-red-500 translate-x-1'
                      : 'text-slate-300 group-hover:translate-x-1'
                  }`}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* 底部提示 */}
      <div className="pt-3 border-t border-red-100 mt-3">
        <div className="flex items-center justify-center gap-2 text-xs text-red-400">
          <Zap size={12} />
          <span>共 {emphasisMarks.length} 个重点，随时间轴自动追踪</span>
        </div>
      </div>
    </div>
  )
}

export default EmphasisNavigator
