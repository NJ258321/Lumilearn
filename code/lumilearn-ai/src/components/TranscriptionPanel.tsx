// =====================================================
// TranscriptionPanel - 转写状态组件
// 显示音频转写状态和结果（预留框架）
// =====================================================

import React, { useState, useEffect } from 'react'
import { FileText, Play, Pause, Loader2, AlertCircle, RefreshCw, Clock, CheckCircle, XCircle, Hourglass } from 'lucide-react'
import { transcribeAudio, getTranscribeStatus, ServiceStatus, TranscriptionResult } from '../api/audio'

interface TranscriptionPanelProps {
  recordId: string
  audioUrl?: string
  onTranscribeComplete?: (result: TranscriptionResult) => void
  className?: string
}

// 转写状态类型
type TranscribeStatus = 'idle' | 'pending' | 'processing' | 'completed' | 'failed'

const TranscriptionPanel: React.FC<TranscriptionPanelProps> = ({
  recordId,
  audioUrl,
  onTranscribeComplete,
  className = '',
}) => {
  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<TranscribeStatus>('idle')
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null)
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  // 预览音频
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null)

  // 加载服务状态
  useEffect(() => {
    loadServiceStatus()
  }, [])

  // 创建音频元素
  useEffect(() => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audio.addEventListener('ended', () => setPlaying(false))
      setAudioElement(audio)
      return () => {
        audio.pause()
        audio.src = ''
      }
    }
  }, [audioUrl])

  const loadServiceStatus = async () => {
    try {
      const response = await getTranscribeStatus()
      if (response.success && response.data) {
        setServiceStatus(response.data)
        if (!response.data.available) {
          setStatus('failed')
        }
      }
    } catch (err) {
      console.error('获取转写服务状态失败:', err)
    }
  }

  // 开始转写
  const handleTranscribe = async () => {
    if (!recordId) return

    setLoading(true)
    setError(null)
    setStatus('pending')

    try {
      const response = await transcribeAudio(recordId, { language: 'zh-CN' })

      if (response.success && response.data) {
        setTranscription(response.data)
        setStatus('completed')
        onTranscribeComplete?.(response.data)
      } else {
        setError(response.error || '转写失败')
        setStatus('failed')
      }
    } catch (err) {
      setError('转写失败，请重试')
      setStatus('failed')
    } finally {
      setLoading(false)
    }
  }

  // 播放片段
  const playSegment = (segment: { start: number; end: number }) => {
    if (!audioElement) return

    audioElement.currentTime = segment.start
    audioElement.play()
    setPlaying(true)

    // 设置停止时间
    const checkEnd = setInterval(() => {
      if (audioElement.currentTime >= segment.end) {
        audioElement.pause()
        setPlaying(false)
        clearInterval(checkEnd)
      }
    }, 100)
  }

  // 停止播放
  const stopPlaying = () => {
    if (audioElement) {
      audioElement.pause()
      audioElement.currentTime = 0
      setPlaying(false)
    }
  }

  // 获取状态图标和颜色
  const getStatusInfo = () => {
    switch (status) {
      case 'pending':
        return { icon: <Hourglass size={20} />, color: 'text-amber-500', bg: 'bg-amber-50', label: '等待中' }
      case 'processing':
        return { icon: <Loader2 size={20} className="animate-spin" />, color: 'text-blue-500', bg: 'bg-blue-50', label: '转写中' }
      case 'completed':
        return { icon: <CheckCircle size={20} />, color: 'text-green-500', bg: 'bg-green-50', label: '已完成' }
      case 'failed':
        return { icon: <XCircle size={20} />, color: 'text-red-500', bg: 'bg-red-50', label: '失败' }
      default:
        return { icon: <Clock size={20} />, color: 'text-slate-400', bg: 'bg-slate-50', label: '未开始' }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-800 flex items-center space-x-2">
          <FileText size={18} className="text-blue-500" />
          <span>语音转写</span>
        </h3>
        <button
          onClick={loadServiceStatus}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          title="刷新状态"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 服务状态 */}
      {serviceStatus && !serviceStatus.available && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2 text-amber-600 text-sm">
            <AlertCircle size={16} />
            <span>{serviceStatus.message || '转写服务暂不可用'}</span>
          </div>
        </div>
      )}

      {/* 状态显示 */}
      <div className={`flex items-center space-x-3 p-3 rounded-lg ${statusInfo.bg} mb-4`}>
        <div className={statusInfo.color}>{statusInfo.icon}</div>
        <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
          <span className="text-slate-500">正在转写，请稍候...</span>
        </div>
      )}

      {/* 错误状态 */}
      {error && !loading && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <div className="flex items-center space-x-2 text-red-600 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 转写结果 */}
      {!loading && transcription && (
        <div className="mb-4">
          {/* 全文 */}
          <div className="mb-4">
            <p className="text-sm text-slate-500 mb-2">转写文本</p>
            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 max-h-40 overflow-y-auto">
              {transcription.text || '（无文本内容）'}
            </div>
          </div>

          {/* 分段 */}
          {transcription.segments && transcription.segments.length > 0 && (
            <div>
              <p className="text-sm text-slate-500 mb-2">
                分段 ({transcription.segments.length}个)
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {transcription.segments.map((segment, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSegment === index
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                    onClick={() => setSelectedSegment(index)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">
                        {formatTime(segment.start)} - {formatTime(segment.end)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          playing ? stopPlaying() : playSegment(segment)
                        }}
                        className="p-1 hover:bg-white/50 rounded-full text-blue-500"
                      >
                        {playing && selectedSegment === index ? (
                          <Pause size={14} />
                        ) : (
                          <Play size={14} />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-slate-700">{segment.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 语言信息 */}
          <p className="text-xs text-slate-400 mt-3">
            语言：{transcription.language || 'zh-CN'}
          </p>
        </div>
      )}

      {/* 空状态 - 未转写 */}
      {!loading && !transcription && !error && (
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <FileText size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm mb-4">
            将音频转换为文字（功能预留）
          </p>
          <button
            onClick={handleTranscribe}
            disabled={!recordId || !serviceStatus?.available}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            开始转写
          </button>
        </div>
      )}
    </div>
  )
}

// 格式化时间
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default TranscriptionPanel
