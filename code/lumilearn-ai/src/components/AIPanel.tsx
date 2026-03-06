// =====================================================
// AIPanel - AI 增强面板
// 展示知识点关联、推荐内容
// =====================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Sparkles, X, Play, ChevronRight, Loader2, BookOpen, ExternalLink, Clock, Target } from 'lucide-react'
import type { KnowledgePoint, TimeMark } from '../../types'
import { getKnowledgePointList } from '../api/knowledgePoints'

interface AIPanelProps {
  studyRecordId: string
  currentTime: number
  timeMarks: TimeMark[]
  relatedMarks?: TimeMark[]
  onClose: () => void
  onSeek: (time: number) => void
  panelHeight: number
}

interface RelatedKnowledge {
  id: string
  name: string
  status: string
  description?: string
}

// 模拟的外部推荐资源
const MOCK_EXTERNAL_RESOURCES = [
  {
    id: '1',
    title: '递归算法可视化演示',
    source: 'Bilibili',
    duration: '03:20',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400',
  },
  {
    id: '2',
    title: '栈空间变化深度剖析',
    source: 'Youtube',
    duration: '12:45',
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400',
  },
]

const AIPanel: React.FC<AIPanelProps> = ({
  studyRecordId,
  currentTime,
  timeMarks,
  relatedMarks: propRelatedMarks,
  onClose,
  onSeek,
  panelHeight,
}) => {
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([])
  const [loading, setLoading] = useState(true)

  // 获取知识点列表
  const fetchKnowledgePoints = useCallback(async () => {
    setLoading(true)
    try {
      const response = await getKnowledgePointList({})
      if (response.success && response.data) {
        setKnowledgePoints(response.data)
      }
    } catch (err) {
      console.error('获取知识点失败', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKnowledgePoints()
  }, [fetchKnowledgePoints])

  // 根据当前时间获取相关的知识点和时间标记
  const relatedContent = useMemo(() => {
    // 优先使用API获取的相关标记，否则使用本地过滤
    const marks = propRelatedMarks && propRelatedMarks.length > 0
      ? propRelatedMarks
      : timeMarks
          .filter(mark => Math.abs(mark.timestamp - currentTime) < 30) // 30秒内的标记
          .slice(0, 3)

    // 获取相关知识点（随机取2个作为演示）
    const relatedKps = knowledgePoints.slice(0, 2)

    return {
      marks,
      knowledgePoints: relatedKps,
    }
  }, [currentTime, timeMarks, knowledgePoints, propRelatedMarks])

  // 格式化时间
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // 获取状态颜色
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'MASTERED':
        return { bg: 'bg-green-100', text: 'text-green-600', label: '已掌握' }
      case 'WEAK':
        return { bg: 'bg-red-100', text: 'text-red-600', label: '薄弱' }
      case 'NEED_REVIEW':
        return { bg: 'bg-yellow-100', text: 'text-yellow-600', label: '待复习' }
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-600', label: '学习中' }
    }
  }

  return (
    <div
      className="w-full bg-white z-[60] shadow-[0_-15px_60px_rgba(0,0,0,0.3)] flex flex-col rounded-t-[32px] overflow-hidden"
      style={{ height: `${panelHeight}px` }}
    >
      {/* 顶部标题区 */}
      <div className="px-8 pt-4 pb-2 flex-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles size={20} className="text-blue-600" />
            <h3 className="font-black text-lg text-slate-900 tracking-tight">知识增强</h3>
          </div>
          <button
            onClick={onClose}
            className="bg-blue-600 p-1.5 rounded-full text-white shadow-md active:scale-90 transition-transform"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-8 pb-8 pt-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-blue-500" />
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* 摘要卡片 */}
            <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100">
              <p className="text-sm text-blue-800 leading-relaxed font-bold">
                {relatedContent.knowledgePoints.length > 0 ? (
                  <>
                    检测到正在讲解 <span className="underline decoration-blue-500/50 decoration-4">「{relatedContent.knowledgePoints[0].name}」</span>
                    ，已为您关联了相关知识点及深度剖析。
                  </>
                ) : relatedContent.marks.length > 0 ? (
                  <>
                    检测到当前时间点有 <span className="underline decoration-blue-500/50 decoration-4">{relatedContent.marks.length}个</span> 重点标记
                  </>
                ) : (
                  '正在分析您的学习内容，请稍候...'
                )}
              </p>
            </div>

            {/* 关联知识点 */}
            {relatedContent.knowledgePoints.length > 0 && (
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen size={16} className="text-slate-600" />
                  <span className="text-sm font-bold text-slate-700">关联知识点</span>
                </div>
                <div className="space-y-3">
                  {relatedContent.knowledgePoints.map((kp) => {
                    const badge = getStatusBadge(kp.status)
                    return (
                      <div
                        key={kp.id}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800 truncate">{kp.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>
                              {badge.label}
                            </span>
                          </div>
                          {kp.description && (
                            <p className="text-xs text-slate-400 mt-1 truncate">{kp.description}</p>
                          )}
                        </div>
                        <ChevronRight size={16} className="text-slate-300" />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 相关时间标记 */}
            {relatedContent.marks.length > 0 && (
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <div className="flex items-center space-x-2 mb-4">
                  <Clock size={16} className="text-slate-600" />
                  <span className="text-sm font-bold text-slate-700">附近重点</span>
                </div>
                <div className="space-y-2">
                  {relatedContent.marks.map((mark) => (
                    <button
                      key={mark.id}
                      onClick={() => onSeek(mark.timestamp)}
                      className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-red-200 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                          {formatTime(mark.timestamp)}
                        </span>
                        <span className="text-sm text-slate-700 truncate">
                          {mark.content || mark.data?.noteText || '重点内容'}
                        </span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 推荐外部资源（模拟数据） */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-[#2563EB] text-white text-[10px] font-black px-2.5 py-1 rounded uppercase">推荐学习</div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">精选内容</span>
              </div>
              <div className="space-y-3">
                {MOCK_EXTERNAL_RESOURCES.map((resource) => (
                  <div
                    key={resource.id}
                    className="flex gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="w-20 h-14 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                      <img src={resource.thumbnail} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-slate-800 line-clamp-2">{resource.title}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-slate-400">{resource.source}</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock size={10} />
                          {resource.duration}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-3 bg-[#2563EB] rounded-xl text-white font-bold text-sm flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors">
                <span>查看更多推荐</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIPanel
