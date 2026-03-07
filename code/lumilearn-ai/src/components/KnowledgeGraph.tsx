// =====================================================
// KnowledgeGraph - 知识图谱可视化组件
// 展示知识点关系图谱
// =====================================================

import React, { useState, useEffect } from 'react'
import { Network, ZoomIn, ZoomOut, RotateCcw, Loader2, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react'
import { getKnowledgeRelations, KnowledgeGraphData, KnowledgeRelationType, getRelationTypeLabel, getRelationTypeColor } from '../api/knowledgeRelations'

interface KnowledgeGraphProps {
  knowledgePointId: string
  depth?: number
  onNodeClick?: (nodeId: string, nodeName: string) => void
  className?: string
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  knowledgePointId,
  depth = 2,
  onNodeClick,
  className = '',
}) => {
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<KnowledgeGraphData | null>(null)
  const [zoom, setZoom] = useState(1)
  const [filter, setFilter] = useState<KnowledgeRelationType | 'all'>('all')

  // 加载知识图谱
  const loadGraph = async () => {
    if (!knowledgePointId) return

    setLoading(true)
    setError(null)

    try {
      const response = await getKnowledgeRelations(knowledgePointId, depth)
      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || '加载失败')
      }
    } catch (err) {
      setError('加载知识图谱失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGraph()
  }, [knowledgePointId, depth])

  // 过滤后的关系
  const filteredRelations = data?.relations.filter(
    r => filter === 'all' || r.relationType === filter
  ) || []

  // 缩放操作
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4))
  const handleResetZoom = () => setZoom(1)

  // 加载中
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
        <span className="text-slate-500">加载知识图谱...</span>
      </div>
    )
  }

  // 错误状态
  if (error || !data) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-xl ${className}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle size={20} />
          <span>{error || '无法加载知识图谱'}</span>
        </div>
        <button
          onClick={loadGraph}
          className="mt-3 flex items-center space-x-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 text-sm transition-colors"
        >
          <RefreshCw size={14} />
          <span>重试</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {/* 标题和控制栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-800 flex items-center space-x-2">
          <Network size={18} className="text-blue-500" />
          <span>知识图谱</span>
        </h3>
        <div className="flex items-center space-x-2">
          {/* 关系类型筛选 */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as KnowledgeRelationType | 'all')}
              className="appearance-none pl-3 pr-8 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">全部关系</option>
              <option value="PREREQUISITE">前置知识</option>
              <option value="RELATED">相关知识</option>
              <option value="EXTENDS">扩展知识</option>
              <option value="EXAMPLE">示例关系</option>
            </select>
            <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* 缩放控制 */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            title="缩小"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-xs text-slate-400 min-w-[40px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            title="放大"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"
            title="重置"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* 图谱可视化区域 */}
      <div
        className="relative min-h-[300px] bg-slate-50 rounded-lg overflow-hidden"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
      >
        {/* 根节点 */}
        <div className="absolute left-1/2 top-8 -translate-x-1/2">
          <button
            onClick={() => onNodeClick?.(data.root.id, data.root.name)}
            className="px-4 py-2 bg-blue-500 text-white rounded-full font-medium text-sm hover:bg-blue-600 transition-colors shadow-md"
          >
            {data.root.name}
          </button>
          {data.root.status && (
            <span className={`absolute -top-1 -right-1 px-1.5 py-0.5 text-xs rounded-full ${
              data.root.status === 'MASTERED' ? 'bg-green-100 text-green-600' :
              data.root.status === 'WEAK' ? 'bg-red-100 text-red-600' :
              'bg-amber-100 text-amber-600'
            }`}>
              {data.root.status === 'MASTERED' ? '已掌握' :
               data.root.status === 'WEAK' ? '薄弱' : '待复习'}
            </span>
          )}
        </div>

        {/* 前置知识 */}
        {data.prerequisites.length > 0 && (
          <div className="absolute left-4 top-24">
            <p className="text-xs text-slate-400 mb-2">前置知识</p>
            <div className="space-y-2">
              {data.prerequisites.map((prereq, index) => (
                <button
                  key={prereq.id}
                  onClick={() => onNodeClick?.(prereq.id, prereq.name)}
                  className="block w-full px-3 py-1.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-left transition-colors"
                >
                  {prereq.name}
                  {prereq.masteryScore !== undefined && (
                    <span className="ml-2 text-blue-400">{prereq.masteryScore}%</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 相关知识 */}
        {data.related.length > 0 && (
          <div className="absolute right-4 top-24">
            <p className="text-xs text-slate-400 mb-2">相关知识</p>
            <div className="space-y-2">
              {data.related.map((rel, index) => (
                <button
                  key={rel.id}
                  onClick={() => onNodeClick?.(rel.id, rel.name)}
                  className="block w-full px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-left transition-colors"
                >
                  {rel.name}
                  {rel.masteryScore !== undefined && (
                    <span className="ml-2 text-green-400">{rel.masteryScore}%</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 关系线（简化版，使用颜色区分） */}
        {filteredRelations.length > 0 && (
          <div className="absolute bottom-4 left-4 right-4">
            <p className="text-xs text-slate-400 mb-2">关系 ({filteredRelations.length})</p>
            <div className="flex flex-wrap gap-2">
              {filteredRelations.slice(0, 5).map((rel) => (
                <span
                  key={rel.id}
                  className={`px-2 py-1 text-xs rounded ${getRelationTypeColor(rel.relationType)}`}
                >
                  {getRelationTypeLabel(rel.relationType)}
                </span>
              ))}
              {filteredRelations.length > 5 && (
                <span className="px-2 py-1 text-xs text-slate-400">
                  +{filteredRelations.length - 5} 更多
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 图例 */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 mb-2">关系类型</p>
        <div className="flex flex-wrap gap-3">
          <LegendItem type="PREREQUISITE" label="前置知识" color="bg-blue-500" />
          <LegendItem type="RELATED" label="相关知识" color="bg-green-500" />
          <LegendItem type="EXTENDS" label="扩展知识" color="bg-purple-500" />
          <LegendItem type="EXAMPLE" label="示例关系" color="bg-orange-500" />
        </div>
      </div>
    </div>
  )
}

// 图例项组件
interface LegendItemProps {
  type: string
  label: string
  color: string
}

const LegendItem: React.FC<LegendItemProps> = ({ label, color }) => (
  <div className="flex items-center space-x-1.5">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-xs text-slate-500">{label}</span>
  </div>
)

export default KnowledgeGraph
