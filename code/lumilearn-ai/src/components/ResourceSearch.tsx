// =====================================================
// ResourceSearch - AI资源检索展示组件
// 展示AI推荐的学习资源，支持资源类型筛选
// =====================================================

import React, { useState, useEffect } from 'react'
import { Loader2, AlertCircle, RefreshCw, Search, ExternalLink, Clock, FileText, Video, PenTool, Filter } from 'lucide-react'
import { searchResources, SearchResourcesResult, SearchResourcesBody, Resource, getResourceTypeIcon, getResourceQualityLabel } from '../api/ai'

interface ResourceSearchProps {
  knowledgePointId: string
  className?: string
}

const ResourceSearch: React.FC<ResourceSearchProps> = ({
  knowledgePointId,
  className = '',
}) => {
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SearchResourcesResult | null>(null)
  // 筛选状态
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'document' | 'practice'>('all')
  // 表单参数
  const [resourceTypes, setResourceTypes] = useState<Array<'video' | 'document' | 'practice'>>(['video', 'document', 'practice'])
  const [language, setLanguage] = useState('zh')
  const [maxResults, setMaxResults] = useState(10)

  // 加载资源
  const loadResources = async () => {
    if (!knowledgePointId) return

    setLoading(true)
    setError(null)

    try {
      const body: SearchResourcesBody = {
        knowledgePointId,
        resourceTypes: resourceTypes.length > 0 ? resourceTypes : undefined,
        language,
        maxResults,
      }
      const response = await searchResources(body)

      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || '搜索失败')
      }
    } catch (err) {
      setError('搜索资源失败')
    } finally {
      setLoading(false)
    }
  }

  // 首次加载
  useEffect(() => {
    loadResources()
  }, [knowledgePointId])

  // 切换资源类型
  const toggleResourceType = (type: 'video' | 'document' | 'practice') => {
    setResourceTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  // 筛选资源
  const filteredResources = data?.resources.filter(
    resource => typeFilter === 'all' || resource.type === typeFilter
  ) || []

  // 获取资源类型图标
  const getTypeIcon = (type: Resource['type']) => {
    switch (type) {
      case 'video':
        return <Video size={16} className="text-red-500" />
      case 'document':
        return <FileText size={16} className="text-blue-500" />
      case 'practice':
        return <PenTool size={16} className="text-green-500" />
    }
  }

  // 获取质量颜色
  const getQualityColor = (quality: Resource['quality']): string => {
    switch (quality) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low':
        return 'text-slate-600 bg-slate-50 border-slate-200'
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
        <span className="text-slate-500">搜索学习资源...</span>
      </div>
    )
  }

  // 错误状态
  if (error || !data) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle size={20} />
          <span>{error || '无法搜索资源'}</span>
        </div>

        {/* 参数设置 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-2">资源类型</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleResourceType('video')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  resourceTypes.includes('video')
                    ? 'bg-red-100 text-red-600 border border-red-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                🎬 视频
              </button>
              <button
                onClick={() => toggleResourceType('document')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  resourceTypes.includes('document')
                    ? 'bg-blue-100 text-blue-600 border border-blue-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                📄 文档
              </button>
              <button
                onClick={() => toggleResourceType('practice')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  resourceTypes.includes('practice')
                    ? 'bg-green-100 text-green-600 border border-green-200'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                📝 练习
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">语言</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="zh">中文</option>
              <option value="en">英文</option>
              <option value="all">中英文</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">最大结果数</label>
            <input
              type="number"
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              min={1}
              max={20}
            />
          </div>

          <button
            onClick={loadResources}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            <Search size={16} />
            <span>搜索资源</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-800 flex items-center space-x-2">
          <Search size={18} className="text-blue-500" />
          <span>学习资源</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadResources}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            title="重新搜索"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 知识点信息 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <span className="text-sm text-slate-500">相关知识点：</span>
        <span className="ml-2 font-medium text-blue-700">{data.knowledgePoint.name}</span>
      </div>

      {/* 筛选 */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500">筛选</span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              typeFilter === 'all'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全部 ({data.resources.length})
          </button>
          <button
            onClick={() => setTypeFilter('video')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              typeFilter === 'video'
                ? 'bg-red-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            视频 ({data.resources.filter(r => r.type === 'video').length})
          </button>
          <button
            onClick={() => setTypeFilter('document')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              typeFilter === 'document'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            文档 ({data.resources.filter(r => r.type === 'document').length})
          </button>
          <button
            onClick={() => setTypeFilter('practice')}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              typeFilter === 'practice'
                ? 'bg-green-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            练习 ({data.resources.filter(r => r.type === 'practice').length})
          </button>
        </div>
      </div>

      {/* 资源列表 */}
      {filteredResources.length > 0 ? (
        <div className="space-y-3">
          {filteredResources.map((resource, index) => (
            <div
              key={index}
              className="p-4 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(resource.type)}
                  <span className="text-sm font-medium text-slate-700">
                    {resource.title}
                  </span>
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-slate-200 rounded text-blue-500 transition-colors"
                  title="打开链接"
                >
                  <ExternalLink size={14} />
                </a>
              </div>

              {/* 来源和时长/页数 */}
              <div className="flex items-center space-x-4 text-xs text-slate-500 mb-2">
                <span>{resource.source}</span>
                {resource.duration && (
                  <span className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{resource.duration}</span>
                  </span>
                )}
                {resource.pages && (
                  <span>{resource.pages} 页</span>
                )}
              </div>

              {/* 描述 */}
              <p className="text-xs text-slate-600 mb-2 line-clamp-2">
                {resource.description}
              </p>

              {/* 质量和匹配原因 */}
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 text-xs rounded border ${getQualityColor(resource.quality)}`}>
                  {getResourceQualityLabel(resource.quality)}
                </span>
                <span className="text-xs text-blue-500 max-w-[60%] truncate">
                  {resource.matchReason}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Search size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 text-sm">没有找到相关资源</p>
        </div>
      )}

      {/* 生成时间 */}
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
        生成时间：{new Date(data.generatedAt).toLocaleString('zh-CN')}
      </div>
    </div>
  )
}

export default ResourceSearch
