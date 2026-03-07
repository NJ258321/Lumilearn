// =====================================================
// VadVisualizer - 语音活动检测可视化组件
// 显示音频中的语音段和非语音段
// =====================================================

import React, { useState, useEffect } from 'react'
import { Mic, MicOff, Loader2, AlertCircle, RefreshCw, Settings } from 'lucide-react'
import { detectVad, getVadStatus, VadResult, ServiceStatus } from '../api/audio'

interface VadVisualizerProps {
  recordId: string
  audioDuration: number
  onSegmentsDetected?: (segments: VadResult) => void
  className?: string
}

const VadVisualizer: React.FC<VadVisualizerProps> = ({
  recordId,
  audioDuration,
  onSegmentsDetected,
  className = '',
}) => {
  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VadResult | null>(null)
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null)
  const [sensitivity, setSensitivity] = useState(50)
  const [showSettings, setShowSettings] = useState(false)

  // 加载服务状态
  useEffect(() => {
    loadServiceStatus()
  }, [])

  const loadServiceStatus = async () => {
    try {
      const response = await getVadStatus()
      if (response.success && response.data) {
        setServiceStatus(response.data)
      }
    } catch (err) {
      console.error('获取VAD服务状态失败:', err)
    }
  }

  // 执行VAD检测
  const handleDetect = async () => {
    if (!recordId) return

    setLoading(true)
    setError(null)

    try {
      const response = await detectVad(recordId, { sensitivity })
      if (response.success && response.data) {
        setResult(response.data)
        onSegmentsDetected?.(response.data)
      } else {
        setError(response.error || '检测失败')
      }
    } catch (err) {
      setError('检测失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 计算语音占比
  const speechRatio = result ? (result.totalSpeechDuration / result.audioDuration * 100) : 0

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-800 flex items-center space-x-2">
          <Mic size={18} className="text-blue-500" />
          <span>语音活动检测</span>
        </h3>
        <div className="flex items-center space-x-2">
          {/* 设置按钮 */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors ${
              showSettings ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100 text-slate-400'
            }`}
            title="设置"
          >
            <Settings size={16} />
          </button>
          {/* 刷新按钮 */}
          <button
            onClick={handleDetect}
            disabled={loading || !recordId}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-50 transition-colors"
            title="重新检测"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 设置面板 */}
      {showSettings && (
        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-600">灵敏度</label>
            <span className="text-sm font-medium text-slate-700">{sensitivity}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={sensitivity}
            onChange={(e) => setSensitivity(parseInt(e.target.value))}
            className="w-full mt-2 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>更敏感</span>
            <span>更宽松</span>
          </div>
        </div>
      )}

      {/* 服务状态 */}
      {serviceStatus && !serviceStatus.available && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2 text-amber-600 text-sm">
            <AlertCircle size={16} />
            <span>{serviceStatus.message || 'VAD服务暂不可用'}</span>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
          <span className="text-slate-500">检测中...</span>
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

      {/* 检测结果 */}
      {!loading && result && (
        <>
          {/* 统计信息 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2 text-slate-500 text-sm mb-1">
                <Mic size={14} />
                <span>语音时长</span>
              </div>
              <p className="text-lg font-medium text-slate-700">
                {result.totalSpeechDuration.toFixed(1)}秒
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-2 text-slate-500 text-sm mb-1">
                <span>语音占比</span>
              </div>
              <p className="text-lg font-medium text-slate-700">
                {speechRatio.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* 可视化时间线 */}
          <div className="mb-4">
            <p className="text-sm text-slate-500 mb-2">语音段分布</p>
            <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
              {result.segments.map((segment, index) => {
                const startPercent = (segment.start / audioDuration) * 100
                const widthPercent = ((segment.end - segment.start) / audioDuration) * 100
                return (
                  <div
                    key={index}
                    className="absolute h-full bg-blue-400"
                    style={{
                      left: `${startPercent}%`,
                      width: `${widthPercent}%`,
                    }}
                    title={`${segment.start.toFixed(1)}s - ${segment.end.toFixed(1)}s`}
                  />
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0:00</span>
              <span>{formatTime(audioDuration)}</span>
            </div>
          </div>

          {/* 语音段列表 */}
          <div className="max-h-40 overflow-y-auto">
            <p className="text-sm text-slate-500 mb-2">
              语音段 ({result.segments.length}个)
            </p>
            <div className="space-y-2">
              {result.segments.map((segment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm"
                >
                  <span className="text-slate-600">段 {index + 1}</span>
                  <span className="font-mono text-slate-700">
                    {formatTime(segment.start)} - {formatTime(segment.end)}
                  </span>
                  <span className="text-slate-400">
                    ({(segment.end - segment.start).toFixed(1)}秒)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 空状态 - 未检测 */}
      {!loading && !result && !error && (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MicOff size={24} className="text-slate-400" />
          </div>
          <p className="text-slate-500 text-sm mb-4">
            点击按钮检测音频中的语音段
          </p>
          <button
            onClick={handleDetect}
            disabled={!recordId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            开始检测
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

export default VadVisualizer
