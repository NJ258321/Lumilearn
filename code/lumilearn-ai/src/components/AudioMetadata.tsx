// =====================================================
// AudioMetadata - 音频元数据展示组件
// 显示音频文件的元数据信息
// =====================================================

import React, { useState, useEffect } from 'react'
import { Music, Clock, FileAudio, Gauge, Layers, Bookmark, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { getAudioMetadata, AudioMetadata as AudioMetadataType, formatDuration, formatFileSize, formatBitrate, formatSampleRate } from '../api/audio'

interface AudioMetadataProps {
  recordId: string
  onRefresh?: () => void
  className?: string
}

const AudioMetadata: React.FC<AudioMetadataProps> = ({
  recordId,
  onRefresh,
  className = '',
}) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<AudioMetadataType | null>(null)

  // 加载元数据
  const loadMetadata = async () => {
    if (!recordId) return

    setLoading(true)
    setError(null)

    try {
      const response = await getAudioMetadata(recordId)
      if (response.success && response.data) {
        setMetadata(response.data)
      } else {
        setError(response.error || '加载失败')
      }
    } catch (err) {
      setError('加载元数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMetadata()
  }, [recordId])

  // 刷新
  const handleRefresh = () => {
    loadMetadata()
    onRefresh?.()
  }

  // 加载中
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
        <span className="text-slate-500">加载元数据...</span>
      </div>
    )
  }

  // 错误状态
  if (error || !metadata) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-xl ${className}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle size={20} />
          <span>{error || '无法加载元数据'}</span>
        </div>
        <button
          onClick={handleRefresh}
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
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-800 flex items-center space-x-2">
          <Music size={18} className="text-blue-500" />
          <span>音频信息</span>
        </h3>
        {onRefresh && (
          <button
            onClick={handleRefresh}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            title="刷新"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>

      {/* 元数据网格 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 时长 */}
        <MetadataItem
          icon={<Clock size={16} />}
          label="时长"
          value={formatDuration(metadata.duration)}
        />

        {/* 格式 */}
        <MetadataItem
          icon={<FileAudio size={16} />}
          label="格式"
          value={metadata.format.toUpperCase()}
        />

        {/* 文件大小 */}
        <MetadataItem
          icon={<Gauge size={16} />}
          label="大小"
          value={formatFileSize(metadata.size)}
        />

        {/* 比特率 */}
        <MetadataItem
          icon={<Gauge size={16} />}
          label="比特率"
          value={formatBitrate(metadata.bitrate)}
        />

        {/* 采样率 */}
        <MetadataItem
          icon={<Layers size={16} />}
          label="采样率"
          value={formatSampleRate(metadata.sampleRate)}
        />

        {/* 声道数 */}
        <MetadataItem
          icon={<Layers size={16} />}
          label="声道数"
          value={metadata.channels === 1 ? '单声道' : '立体声'}
        />

        {/* 知识点数量 */}
        <MetadataItem
          icon={<Bookmark size={16} />}
          label="知识点"
          value={metadata.knowledgePoints?.length || 0}
        />

        {/* 时间标记数量 */}
        <MetadataItem
          icon={<Bookmark size={16} />}
          label="时间标记"
          value={metadata.timeMarksCount || 0}
        />
      </div>

      {/* 关联知识点 */}
      {metadata.knowledgePoints && metadata.knowledgePoints.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-sm text-slate-500 mb-2">关联知识点</p>
          <div className="flex flex-wrap gap-2">
            {metadata.knowledgePoints.map((kp, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg"
              >
                {kp.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 创建时间 */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          录制时间：{new Date(metadata.createdAt).toLocaleString('zh-CN')}
        </p>
      </div>
    </div>
  )
}

// 元数据项组件
interface MetadataItemProps {
  icon: React.ReactNode
  label: string
  value: string | number
}

const MetadataItem: React.FC<MetadataItemProps> = ({ icon, label, value }) => (
  <div className="flex items-center space-x-3">
    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
      {icon}
    </div>
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-700">{value}</p>
    </div>
  </div>
)

export default AudioMetadata
