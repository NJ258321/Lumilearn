// =====================================================
// NoteIndex - 笔记索引组件
// 展示笔记按时间戳列表，点击可跳转
// =====================================================

import React, { useMemo } from 'react'
import { FileText, Clock, ChevronRight } from 'lucide-react'
import type { TimeMark } from '../../types'

interface NoteIndexProps {
  timeMarks: TimeMark[]
  currentTime: number
  onSeek: (time: number) => void
}

// 过滤并格式化笔记数据
const NoteIndex: React.FC<NoteIndexProps> = ({
  timeMarks,
  currentTime,
  onSeek,
}) => {
  // 过滤出笔记类型的标记（NOTE类型）
  const notes = useMemo(() => {
    return timeMarks
      .filter(mark => mark.type === 'NOTE')
      .sort((a, b) => a.timestamp - b.timestamp)
  }, [timeMarks])

  // 格式化时间
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 获取当前激活的笔记索引
  const getActiveIndex = (): number => {
    if (notes.length === 0) return -1
    for (let i = notes.length - 1; i >= 0; i--) {
      if (currentTime >= notes[i].timestamp) {
        return i
      }
    }
    return -1
  }

  const activeIndex = getActiveIndex()

  // 没有笔记时显示空状态
  if (notes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400">
        <FileText size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-sm">暂无笔记</p>
        <p className="text-xs mt-1">点击上方"添加标记"创建笔记</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* 笔记数量统计 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500">
          共 {notes.length} 条笔记
        </span>
        <span className="text-xs text-slate-400">
          点击跳转
        </span>
      </div>

      {/* 笔记列表 */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {notes.map((note, index) => {
          const isActive = index === activeIndex
          const isPast = currentTime > note.timestamp

          return (
            <button
              key={note.id}
              onClick={() => onSeek(note.timestamp)}
              className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 border-blue-200 shadow-sm'
                  : isPast
                  ? 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                  : 'bg-slate-50 border-slate-100 opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* 时间标识 */}
                <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-mono font-bold ${
                  isActive
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {formatTime(note.timestamp)}
                </div>

                {/* 笔记内容 */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm line-clamp-2 ${
                    isActive ? 'text-blue-800 font-medium' : 'text-slate-600'
                  }`}>
                    {note.content || note.data?.noteText || '暂无内容'}
                  </p>
                </div>

                {/* 跳转指示器 */}
                <ChevronRight
                  size={16}
                  className={`flex-shrink-0 transition-transform ${
                    isActive
                      ? 'text-blue-500 translate-x-1'
                      : 'text-slate-300 group-hover:translate-x-1'
                  }`}
                />
              </div>
            </button>
          )
        })}
      </div>

      {/* 快捷操作提示 */}
      <div className="pt-3 border-t border-slate-100 mt-3">
        <p className="text-xs text-slate-400 text-center">
          笔记与时间轴同步播放时自动高亮
        </p>
      </div>
    </div>
  )
}

export default NoteIndex
