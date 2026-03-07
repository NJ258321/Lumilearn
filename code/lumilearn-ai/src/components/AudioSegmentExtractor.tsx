// =====================================================
// AudioSegmentExtractor - 音频片段提取组件
// 支持选择时间范围并提取/下载音频片段
// =====================================================

import React, { useState, useRef, useEffect } from 'react'
import { Scissors, Download, Play, Pause, AlertCircle, Loader2, Clock, X } from 'lucide-react'
import { getAudioSegmentUrl, downloadAudioSegment, formatDuration, parseDuration, AudioSegmentParams } from '../api/audio'

interface AudioSegmentExtractorProps {
  recordId: string
  audioSrc?: string  // 音频文件URL，用于预览
  duration: number    // 音频总时长（秒）
  onExtract?: (segment: AudioSegmentParams) => void
  maxDuration?: number  // 最大允许片段时长（秒），默认 5分钟
  className?: string
}

const AudioSegmentExtractor: React.FC<AudioSegmentExtractorProps> = ({
  recordId,
  audioSrc,
  duration,
  onExtract,
  maxDuration = 300,  // 默认5分钟
  className = '',
}) => {
  // State
  const [startTime, setStartTime] = useState<number>(0)
  const [endTime, setEndTime] = useState<number>(Math.min(60, duration))  // 默认取前60秒
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewPlaying, setPreviewPlaying] = useState(false)

  // 预览音频
  const previewRef = useRef<HTMLAudioElement>(null)

  // 输入框状态（支持 mm:ss 格式）
  const [startTimeInput, setStartTimeInput] = useState(formatDuration(0))
  const [endTimeInput, setEndTimeInput] = useState(formatDuration(Math.min(60, duration)))

  // 更新输入框显示
  useEffect(() => {
    setStartTimeInput(formatDuration(startTime))
    setEndTimeInput(formatDuration(endTime))
  }, [startTime, endTime])

  // 验证时间范围
  const validateTimeRange = (start: number, end: number): string | null => {
    if (start < 0 || start >= duration) {
      return `开始时间应在 0 ~ ${formatDuration(duration)} 之间`
    }
    if (end <= start || end > duration) {
      return `结束时间应在 ${formatDuration(start)} ~ ${formatDuration(duration)} 之间`
    }
    if (end - start > maxDuration) {
      return `片段时长不能超过 ${formatDuration(maxDuration)}`
    }
    return null
  }

  // 处理开始时间输入
  const handleStartTimeChange = (value: string) => {
    setStartTimeInput(value)

    // 尝试解析
    const parsed = parseDuration(value)
    if (parsed !== null && parsed >= 0 && parsed < duration) {
      setStartTime(parsed)
      setError(null)
    }
  }

  // 处理结束时间输入
  const handleEndTimeChange = (value: string) => {
    setEndTimeInput(value)

    // 尝试解析
    const parsed = parseDuration(value)
    if (parsed !== null && parsed > startTime && parsed <= duration) {
      setEndTime(parsed)
      setError(null)
    }
  }

  // 滑动条变化
  const handleStartSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = parseFloat(e.target.value)
    if (newStart < endTime) {
      setStartTime(newStart)
      setError(null)
    }
  }

  const handleEndSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnd = parseFloat(e.target.value)
    if (newEnd > startTime) {
      setEndTime(newEnd)
      setError(null)
    }
  }

  // 预览播放
  const togglePreview = () => {
    if (!previewRef.current || !audioSrc) return

    if (previewPlaying) {
      previewRef.current.pause()
      previewRef.current.currentTime = startTime
    } else {
      previewRef.current.currentTime = startTime
      previewRef.current.play()
    }
    setPreviewPlaying(!previewPlaying)
  }

  // 预览结束
  const handlePreviewEnded = () => {
    setPreviewPlaying(false)
  }

  // 提取/下载片段
  const handleExtract = async () => {
    // 验证
    const validationError = validateTimeRange(startTime, endTime)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const segment = { start: startTime, end: endTime }

      // 触发回调
      onExtract?.(segment)

      // 下载片段
      const filename = `audio_segment_${formatDuration(startTime).replace(/:/g, '-')}_${formatDuration(endTime).replace(/:/g, '-')}.mp3`
      const success = await downloadAudioSegment(recordId, segment, filename)

      if (!success) {
        setError('下载失败，请重试')
      }
    } catch (err) {
      setError('提取失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 获取片段时长
  const segmentDuration = endTime - startTime

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center space-x-2 mb-4">
        <Scissors size={18} className="text-blue-500" />
        <h3 className="font-medium text-slate-800">提取音频片段</h3>
      </div>

      {/* 隐藏的音频元素 */}
      {audioSrc && (
        <audio
          ref={previewRef}
          src={audioSrc}
          onEnded={handlePreviewEnded}
          onTimeUpdate={(e) => {
            const audio = e.currentTarget
            if (previewPlaying && audio.currentTime >= endTime) {
              audio.pause()
              audio.currentTime = startTime
              setPreviewPlaying(false)
            }
          }}
        />
      )}

      {/* 时间范围选择 */}
      <div className="space-y-4">
        {/* 开始时间 */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-600">开始时间</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={startTimeInput}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              placeholder="mm:ss"
              className="w-20 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">{formatDuration(startTime)}</span>
          </div>
        </div>

        {/* 开始时间滑动条 */}
        <input
          type="range"
          min={0}
          max={duration}
          step={1}
          value={startTime}
          onChange={handleStartSliderChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />

        {/* 结束时间 */}
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-600">结束时间</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={endTimeInput}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              placeholder="mm:ss"
              className="w-20 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">{formatDuration(endTime)}</span>
          </div>
        </div>

        {/* 结束时间滑动条 */}
        <input
          type="range"
          min={0}
          max={duration}
          step={1}
          value={endTime}
          onChange={handleEndSliderChange}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      {/* 片段信息 */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">片段时长</span>
          <span className="font-medium text-slate-700">
            {formatDuration(segmentDuration)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-slate-500">最大允许</span>
          <span className="text-slate-400">{formatDuration(maxDuration)}</span>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mt-3 flex items-center space-x-2 text-red-500 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* 预览和下载按钮 */}
      <div className="flex space-x-3 mt-4">
        {/* 预览按钮 */}
        {audioSrc && (
          <button
            onClick={togglePreview}
            disabled={loading}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            {previewPlaying ? (
              <>
                <Pause size={18} />
                <span>停止预览</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>预览片段</span>
              </>
            )}
          </button>
        )}

        {/* 提取/下载按钮 */}
        <button
          onClick={handleExtract}
          disabled={loading || segmentDuration <= 0}
          className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>处理中...</span>
            </>
          ) : (
            <>
              <Download size={18} />
              <span>下载片段</span>
            </>
          )}
        </button>
      </div>

      {/* 快捷按钮 */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-400 mb-2">快捷选择</p>
        <div className="flex flex-wrap gap-2">
          <QuickButton
            label="前1分钟"
            onClick={() => { setStartTime(0); setEndTime(Math.min(60, duration)) }}
          />
          <QuickButton
            label="前5分钟"
            onClick={() => { setStartTime(0); setEndTime(Math.min(300, duration)) }}
          />
          <QuickButton
            label="后1分钟"
            onClick={() => { setStartTime(Math.max(0, duration - 60)); setEndTime(duration) }}
          />
          <QuickButton
            label="后5分钟"
            onClick={() => { setStartTime(Math.max(0, duration - 300)); setEndTime(duration) }}
          />
        </div>
      </div>
    </div>
  )
}

// 快捷按钮组件
interface QuickButtonProps {
  label: string
  onClick: () => void
}

const QuickButton: React.FC<QuickButtonProps> = ({ label, onClick }) => (
  <button
    onClick={onClick}
    className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors"
  >
    {label}
  </button>
)

export default AudioSegmentExtractor
