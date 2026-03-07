// =====================================================
// AudioPlayer - 音频播放组件
// 支持播放控制、进度条、音量调节、播放速度
// =====================================================

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings,
  Download,
  X,
} from 'lucide-react'

interface AudioPlayerProps {
  src: string
  title?: string
  onClose?: () => void
  showDownload?: boolean
  autoPlay?: boolean
}

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title,
  onClose,
  showDownload = true,
  autoPlay = false,
}) => {
  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // 初始化音频
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
      if (autoPlay) {
        audio.play().catch(() => {})
        setIsPlaying(true)
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    const handleError = () => {
      setError('音频加载失败')
      setIsLoading(false)
    }

    const handleCanPlay = () => {
      setIsLoading(false)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [autoPlay])

  // 播放/暂停
  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  // 跳转播放
  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(time, duration))
  }, [duration])

  // 跳过播放
  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    seekTo(audio.currentTime + seconds)
  }, [seekTo])

  // 进度条点击
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const progress = progressRef.current
    if (!progress) return

    const rect = progress.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    seekTo(percent * duration)
  }, [duration, seekTo])

  // 音量控制
  const handleVolumeChange = useCallback((value: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = value
    setVolume(value)
    setIsMuted(value === 0)
  }, [])

  // 静音切换
  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume || 0.5
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  // 播放速度控制
  const handlePlaybackRateChange = useCallback((rate: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = rate
    setPlaybackRate(rate)
    setShowSpeedMenu(false)
  }, [])

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // 下载音频
  const handleDownload = async () => {
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = title || 'audio'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('下载失败:', err)
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.key) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          skip(-10)
          break
        case 'ArrowRight':
          skip(10)
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange(Math.min(volume + 0.1, 1))
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange(Math.max(volume - 0.1, 0))
          break
        case 'm':
        case 'M':
          toggleMute()
          break
        case 'Escape':
          onClose?.()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, skip, handleVolumeChange, volume, toggleMute, onClose])

  // 计算进度百分比
  const progressPercent = duration ? (currentTime / duration) * 100 : 0

  return (
    <div className="bg-slate-900 rounded-xl p-4 w-full max-w-md">
      {/* 隐藏的 audio 元素 */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
      />

      {/* 标题和关闭按钮 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium truncate flex-1 mr-2">
          {title || '音频播放'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="text-red-400 text-sm text-center py-4">
          {error}
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && !error && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* 播放器和控制 */}
      {!error && (
        <>
          {/* 进度条 */}
          <div
            ref={progressRef}
            className="relative h-2 bg-slate-700 rounded-full cursor-pointer mb-4 group"
            onClick={handleProgressClick}
          >
            {/* 已播放进度 */}
            <div
              className="absolute left-0 top-0 h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
            {/* 拖动点 */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPercent}% - 8px)` }}
            />
          </div>

          {/* 时间显示 */}
          <div className="flex justify-between text-white/60 text-xs mb-4">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center space-x-4">
            {/* 跳过 -10秒 */}
            <button
              onClick={() => skip(-10)}
              className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
              title="后退10秒"
            >
              <SkipBack size={20} />
            </button>

            {/* 播放/暂停 */}
            <button
              onClick={togglePlay}
              disabled={isLoading}
              className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors disabled:opacity-50"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
            </button>

            {/* 跳过 +10秒 */}
            <button
              onClick={() => skip(10)}
              className="p-2 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors"
              title="前进10秒"
            >
              <SkipForward size={20} />
            </button>
          </div>

          {/* 底部工具栏 */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
            {/* 音量控制 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMute}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-slate-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>

            {/* 播放速度 */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 rounded-lg shadow-lg py-1 min-w-[80px]">
                  {PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={`w-full px-3 py-1.5 text-sm text-left hover:bg-white/10 transition-colors ${
                        playbackRate === rate ? 'text-blue-400' : 'text-white/70'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 下载 */}
            {showDownload && (
              <button
                onClick={handleDownload}
                className="p-1.5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                title="下载"
              >
                <Download size={18} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AudioPlayer
