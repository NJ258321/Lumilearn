
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Share2, Lightbulb, Sparkles, Video, Flag, Camera, HelpCircle, X, Loader2, Plus } from 'lucide-react';
import { AppView } from '../types';
import TimeMarker from '../src/components/TimeMarker';
import Timeline from '../src/components/Timeline';
import NoteIndex from '../src/components/NoteIndex';
import EmphasisNavigator from '../src/components/EmphasisNavigator';
import AIPanel from '../src/components/AIPanel';
import { getTimeMarkList, getRelatedMarks } from '../src/api/timeMarks';
import { getStudyRecordById } from '../src/api/studyRecords';
import { getKnowledgePointList } from '../src/api/knowledgePoints';
import { API_CONFIG } from '../src/api/request';
import type { TimeMark, StudyRecord, KnowledgePoint } from '../types';

interface TimeMachineProps {
  onBack: () => void;
  recordId?: string | null;
}

// 处理图片URL，转换为完整URL
const getFullImageUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_CONFIG.BASE_URL}${url}`;
};

// 动态生成幻灯片数据
const getSlides = (imageUrls: string[] | undefined) => {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }
  return imageUrls.map((url, index) => ({
    id: index + 1,
    url: getFullImageUrl(url),
    title: `第${index + 1}张图片`
  }));
};

const TimeMachine: React.FC<TimeMachineProps> = ({ onBack, recordId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [isRateChanging, setIsRateChanging] = useState(false);

  // PPT 触摸滑动状态
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);

  // 学习记录详情状态
  const [studyRecord, setStudyRecord] = useState<StudyRecord | null>(null);
  const [recordLoading, setRecordLoading] = useState(true);
  const [recordError, setRecordError] = useState<string | null>(null);

  // 知识点数据（用于AI面板）
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);

  // 音频播放引用
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeMarkerRef = useRef<{ openAddModal: () => void } | null>(null);

  // AI 面板状态
  const [showAiPanel, setShowAiPanel] = useState(false);
  const INITIAL_PANEL_HEIGHT = 450;
  const [panelHeight, setPanelHeight] = useState(INITIAL_PANEL_HEIGHT);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);

  // 底部笔记面板状态 (0 = 全屏, 1 = 收起)
  const [notesPanelExpanded, setNotesPanelExpanded] = useState(true);
  const [isDraggingNotesPanel, setIsDraggingNotesPanel] = useState(false);
  const notesPanelDragStartY = useRef(0);
  const notesPanelStartHeight = useRef(0);

  // 时间标记状态 - recordId 为必填，如果没有则显示提示
  const [timeMarks, setTimeMarks] = useState<TimeMark[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const studyRecordId = recordId;

  // 如果没有 recordId，显示空状态
  if (!studyRecordId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F7F9FC]">
        <div className="text-center p-8">
          <Video size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">请先选择学习记录</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 相关标记状态
  const [relatedMarks, setRelatedMarks] = useState<TimeMark[]>([]);
  const RELATED_RANGE = 30; // 默认30秒范围内

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  // 使用学习记录的时长，如果没有则使用默认值
  const duration = studyRecord?.duration || 50;

  // 获取用户上传的真实图片
  const userImages = studyRecord?.imageUrls || [];
  const slides = getSlides(userImages);
  const hasImages = slides.length > 0;

  // 当前图片索引（基于时间轴或简单索引）
  const activeSlideIndex = hasImages
    ? Math.min(
        Math.floor((currentTime / duration) * slides.length),
        slides.length - 1
      )
    : 0;

  // 手动切换图片
  const goToPrevSlide = () => {
    if (hasImages && activeSlideIndex > 0) {
      const newIndex = activeSlideIndex - 1;
      const newTime = (newIndex / slides.length) * duration;
      handleSeekTo(newTime);
    }
  };

  const goToNextSlide = () => {
    if (hasImages && activeSlideIndex < slides.length - 1) {
      const newIndex = activeSlideIndex + 1;
      const newTime = (newIndex / slides.length) * duration;
      handleSeekTo(newTime);
    }
  };

  // 触摸滑动处理
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const deltaX = e.touches[0].clientX - touchStartX
    setTouchDeltaX(deltaX)
  }

  const handleTouchEnd = () => {
    if (touchStartX === null) return
    const threshold = 50 // 滑动阈值

    if (touchDeltaX > threshold) {
      // 向右滑，上一页
      goToPrevSlide()
    } else if (touchDeltaX < -threshold) {
      // 向左滑，下一页
      goToNextSlide()
    }

    setTouchStartX(null)
    setTouchDeltaX(0)
  }

  // 获取学习记录详情
  const fetchStudyRecord = useCallback(async () => {
    setRecordLoading(true);
    setRecordError(null);
    try {
      const response = await getStudyRecordById(studyRecordId);
      if (response.success && response.data) {
        setStudyRecord(response.data);
        // 如果有音频URL，创建音频元素
        const audioUrl = response.data.audioUrl;
        console.log('原始音频URL:', audioUrl);
        if (audioUrl && audioUrl.trim()) {
          // 处理音频URL（可能是相对路径或完整URL）
          const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${API_CONFIG.BASE_URL}${audioUrl}`;
          console.log('完整音频URL:', fullAudioUrl);
          const audio = new Audio(fullAudioUrl);

          // 添加加载事件监听
          audio.addEventListener('canplaythrough', () => {
            console.log('音频已准备好播放');
          });

          audio.addEventListener('loadedmetadata', () => {
            console.log('音频元数据加载完成', { duration: audio.duration });
          });

          // 直接设置hasAudio为true，因为URL有效
          setHasAudio(true);

          audio.addEventListener('ended', () => {
            console.log('音频播放结束');
            setIsPlaying(false);
            // 播放结束后，时间归零
            audio.currentTime = 0;
            setCurrentTime(0);
          });

          audio.addEventListener('error', (e) => {
            console.error('音频加载失败:', e, audio.error);
            setHasAudio(false);
          });

          audioRef.current = audio;
          // 尝试预加载
          audio.load();
        } else {
          setHasAudio(false);
        }
      } else {
        setRecordError(response.error || '加载学习记录失败');
      }
    } catch (err) {
      setRecordError('网络错误，请检查连接');
    } finally {
      setRecordLoading(false);
    }
  }, [studyRecordId]);

  // 获取知识点列表（用于AI面板）
  const fetchKnowledgePoints = useCallback(async () => {
    try {
      const response = await getKnowledgePointList({});
      if (response.success && response.data) {
        setKnowledgePoints(response.data);
      }
    } catch (err) {
      console.error('获取知识点失败', err);
    }
  }, []);

  // 获取时间标记列表
  const fetchTimeMarks = useCallback(async () => {
    setMarksLoading(true);
    try {
      const response = await getTimeMarkList(studyRecordId);
      if (response.success && response.data) {
        setTimeMarks(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch time marks:', err);
    } finally {
      setMarksLoading(false);
    }
  }, [studyRecordId]);

  // 获取相关时间标记（根据当前播放时间）
  const fetchRelatedMarks = useCallback(async () => {
    try {
      const response = await getRelatedMarks(studyRecordId, currentTime, RELATED_RANGE);
      if (response.success && response.data) {
        setRelatedMarks(response.data);
      }
    } catch (err) {
      console.error('获取相关标记失败', err);
    }
  }, [studyRecordId, currentTime]);

  // 当时间标记更新时，重新获取相关标记
  useEffect(() => {
    if (timeMarks.length > 0) {
      fetchRelatedMarks();
    }
  }, [timeMarks, currentTime, fetchRelatedMarks]);

  // 初始获取学习记录详情、时间标记和知识点
  useEffect(() => {
    fetchStudyRecord();
    fetchTimeMarks();
    fetchKnowledgePoints();
  }, [fetchStudyRecord, fetchTimeMarks, fetchKnowledgePoints]);

  // 时间标记变化处理
  const handleMarksChange = (marks: TimeMark[]) => {
    setTimeMarks(marks);
  };

  // 跳转到指定时间
  const handleSeekTo = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(false);
    // 如果有音频，跳转到对应时间
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  // 播放/暂停控制
  const togglePlayPause = () => {
    console.log('点击播放按钮', { hasAudio: !!hasAudio, audioRef: !!audioRef.current, isPlaying });
    if (!hasAudio || !audioRef.current) {
      // 没有音频文件，使用模拟计时器
      console.log('使用模拟计时器');
      setIsPlaying(prev => !prev);
      return;
    }

    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // 设置当前时间并播放
      audio.currentTime = currentTime;
      audio.volume = 1; // 确保音量为最大
      console.log('开始播放音频', { src: audio.src, currentTime: audio.currentTime, volume: audio.volume });
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('播放成功，音频正在播放，paused:', audio.paused);
          setIsPlaying(true);
        }).catch((err) => {
          console.error('播放失败:', err.name, err.message);
        });
      }
    }
  };

  // 监听音频播放时间更新
  useEffect(() => {
    if (!audioRef.current || !hasAudio) return;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // 播放结束后，时间归零
      audio.currentTime = 0;
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [hasAudio]);

  // 播放速率变化时更新音频（带平滑过渡）
  useEffect(() => {
    if (audioRef.current) {
      // 使用平滑过渡改变播放速率
      const currentRate = audioRef.current.playbackRate;
      const steps = 10;
      const stepTime = 50;
      const stepValue = (playbackRate - currentRate) / steps;
      let currentStep = 0;

      const animateRate = () => {
        if (currentStep < steps) {
          audioRef.current!.playbackRate = currentRate + stepValue * currentStep;
          currentStep++;
          setTimeout(animateRate, stepTime);
        } else {
          audioRef.current!.playbackRate = playbackRate;
          setIsRateChanging(false);
        }
      };

      setIsRateChanging(true);
      animateRate();
    }
  }, [playbackRate]);

  // 播放/暂停时音频音量平滑过渡
  useEffect(() => {
    if (audioRef.current && hasAudio) {
      console.log('音量Effect触发', { isPlaying, volume: audioRef.current.volume, paused: audioRef.current.paused });
      if (isPlaying) {
        // 淡入：直接设置音量为1 (50%)
        audioRef.current.volume = 1;
        console.log('设置音量为1');
      } else {
        // 暂停时立即暂停
        audioRef.current.pause();
      }
    }
  }, [isPlaying, hasAudio]);

  // 模拟计时器（当没有音频时使用）
  useEffect(() => {
    let interval: any;
    if (isPlaying && !audioRef.current) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return prev + (0.1 * playbackRate);
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackRate, duration]);

  // 从学习记录中解析文字稿数据
  const transcript = React.useMemo(() => {
    if (!studyRecord?.notes) return [];
    // 假设 notes 是按时间分割的文本，每行一个片段
    // 格式：时间(秒) - 内容
    const lines = studyRecord.notes.split('\n').filter(line => line.trim());
    return lines.map((line, idx) => {
      const match = line.match(/^(\d+)\s*[-–]\s*(.+)$/);
      if (match) {
        return { time: parseInt(match[1]), text: match[2], isKeypoint: idx % 3 === 0 };
      }
      return { time: idx * 10, text: line, isKeypoint: false };
    });
  }, [studyRecord?.notes]);

  useEffect(() => {
    if (scrollRef.current && transcript.length > 0) {
        const index = transcript.findIndex(s => s.time > currentTime);
        const activeIndex = index === -1 ? transcript.length - 1 : index - 1;
        if (activeIndex >= 0) {
            const el = scrollRef.current.children[activeIndex] as HTMLElement;
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [currentTime, transcript]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  // --- 自由拖拽逻辑 ---
  const handleDragStart = (e: React.PointerEvent) => {
    setIsDraggingPanel(true);
    dragStartY.current = e.clientY;
    dragStartHeight.current = panelHeight;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDraggingPanel) return;
    const deltaY = dragStartY.current - e.clientY;
    let newHeight = dragStartHeight.current + deltaY;
    
    // 约束高度：最小露出标题(80px), 最大全屏(window.innerHeight)
    const maxHeight = window.innerHeight;
    if (newHeight < 80) newHeight = 80;
    if (newHeight > maxHeight) newHeight = maxHeight;
    
    setPanelHeight(newHeight);
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (!isDraggingPanel) return;
    setIsDraggingPanel(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

    // 吸附逻辑：接近顶部吸附至全屏
    const maxHeight = window.innerHeight;
    if (panelHeight > maxHeight * 0.85) {
      setPanelHeight(maxHeight);
    } else if (panelHeight < 200) {
      // 如果拖到过低，吸附到最小显示高度
      setPanelHeight(80);
    }
  };

  // 彻底关闭逻辑
  const closeAiPanel = () => {
    setShowAiPanel(false);
    // 动画完成后重置高度到初始位置，以便下次打开时有良好的视感
    setTimeout(() => {
      setPanelHeight(INITIAL_PANEL_HEIGHT);
    }, 500);
  };

  // --- 底部笔记面板拖拽逻辑 ---
  const handleNotesPanelDragStart = (e: React.PointerEvent) => {
    setIsDraggingNotesPanel(true);
    notesPanelDragStartY.current = e.clientY;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleNotesPanelDragMove = (e: React.PointerEvent) => {
    if (!isDraggingNotesPanel) return;
    const deltaY = notesPanelDragStartY.current - e.clientY;
    const screenHeight = window.innerHeight;
    const headerHeight = screenHeight * 0.62; // 62% 屏幕高度作为顶部
    const minHeight = 80; // 最小高度（只显示标题）

    let newHeight = headerHeight + deltaY;
    if (newHeight < minHeight) newHeight = minHeight;
    if (newHeight > screenHeight) newHeight = screenHeight;

    // 动态调整顶部区域高度
    const newTopHeight = screenHeight - newHeight;
    setNotesPanelHeight(newTopHeight);
  };

  const handleNotesPanelDragEnd = (e: React.PointerEvent) => {
    if (!isDraggingNotesPanel) return;
    setIsDraggingNotesPanel(false);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

    const screenHeight = window.innerHeight;
    // 吸附逻辑
    if (notesPanelHeight < screenHeight * 0.3) {
      // 拖到接近顶部 → 收起底部面板
      setNotesPanelExpanded(false);
      setNotesPanelHeight(0);
    } else {
      // 否则展开
      setNotesPanelExpanded(true);
    }
  };

  // 状态管理顶部区域高度
  const [notesPanelHeight, setNotesPanelHeight] = useState(0);

  return (
    <div className="flex flex-col h-screen bg-[#0F172A] text-white relative font-sans overflow-hidden">

        {/* --- A. 顶部视觉区 --- */}
        <div className={`relative px-4 pt-14 pb-4 flex flex-col transition-all duration-300 ${notesPanelExpanded ? 'h-[38%]' : 'h-full'}`}>
            <div className="absolute top-4 left-0 right-0 z-30 px-6 flex justify-between items-center">
                <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/20">
                    <ArrowLeft size={18} />
                </button>
                {recordLoading ? (
                  <div className="bg-blue-500/20 backdrop-blur-md border border-blue-500/30 px-3 py-1 rounded-full flex items-center space-x-2">
                    <Loader2 size={12} className="animate-spin text-blue-400" />
                    <span className="text-[9px] font-black tracking-widest text-blue-400 uppercase">加载中</span>
                  </div>
                ) : studyRecord ? (
                  <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-3 py-1 rounded-full flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">Classroom Sync</span>
                  </div>
                ) : (
                  <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 px-3 py-1 rounded-full">
                    <span className="text-[9px] font-black tracking-widest text-red-400 uppercase">加载失败</span>
                  </div>
                )}
                <button className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20">
                    <Share2 size={16} />
                </button>
            </div>

            {/* 学习记录标题 */}
            {!recordLoading && studyRecord && (
              <div className="absolute top-14 left-0 right-0 z-20 flex justify-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-sm px-4 py-1 rounded-full pointer-events-auto">
                  <span className="text-white text-sm font-medium">{studyRecord.title}</span>
                </div>
              </div>
            )}

            <div
              className="flex-1 w-full bg-[#1a2e26] rounded-xl border-[6px] border-[#4a3225] shadow-[0_20px_50px_rgba(0,0,0,1)] relative overflow-hidden flex flex-col touch-pan-y"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-10"></div>
                <div className="flex-1 w-full relative overflow-hidden">
                    {hasImages ? (
                        <div className="flex w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                            style={{ transform: `translateX(calc(-${activeSlideIndex * 100}% + ${touchDeltaX}px))` }}>
                            {slides.map((slide) => (
                                <div key={slide.id} className="min-w-full h-full relative flex items-center justify-center p-2">
                                    <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] pointer-events-none z-10"></div>
                                    <img src={slide.url} alt={slide.title} className="max-w-full max-h-full object-contain relative z-0" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <div className="text-center">
                                <Camera size={48} className="text-gray-600 mx-auto mb-2" />
                                <p className="text-gray-500 font-medium">暂无图片</p>
                            </div>
                        </div>
                    )}
                </div>
                {/* 可交互时间轴 */}
                <div className="px-2 py-2 bg-[#2a1f18]">
                  <Timeline
                    duration={duration}
                    currentTime={currentTime}
                    timeMarks={timeMarks}
                    onSeek={handleSeekTo}
                  />
                </div>
                {hasImages && (
                    <>
                        {/* 右上角图片计数器 */}
                        <div className="absolute top-4 right-4 z-20 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md text-[10px] font-mono border border-white/10 text-white/80">
                            {activeSlideIndex + 1}/{slides.length}
                        </div>

                        {/* 左右滑动提示 */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 opacity-50">
                            <div className="w-6 h-px bg-white/50" />
                            <span className="text-[8px] text-white/70">滑动切换</span>
                            <div className="w-6 h-px bg-white/50" />
                        </div>
                    </>
                )}
            </div>
        </div>

        {/* --- B. 中部听觉控制区 --- */}
        <div className="h-[22%] bg-[#121212]/50 backdrop-blur-md px-6 flex flex-col justify-center relative border-t border-b border-white/5">
             <div className="relative h-16 mb-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center space-x-[2px] px-2 opacity-50 z-0 pointer-events-none">
                    {[...Array(60)].map((_, i) => {
                        const progressTime = (i / 60) * duration;
                        const isPlayed = progressTime < currentTime;
                        const waveFactor = isPlaying ? Math.sin(i * 0.4 + currentTime * 3) * 12 : 0;
                        const height = 25 + waveFactor + Math.random() * 8;
                        return (
                            <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${isPlayed ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,1)]' : 'bg-gray-700'}`}
                                 style={{ height: `${height}%` }}></div>
                        );
                    })}
                </div>
                <div className="absolute inset-0 z-10">
                    {timeMarks.map((mark, index) => {
                      // 计算标记位置百分比（timestamp 是毫秒，需要转换为秒）
                      const timestampSeconds = (mark.timestamp || 0) / 1000;
                      const position = duration > 0 ? (timestampSeconds / duration) * 100 : 0;
                      // 限制在 2% - 98% 之间
                      const clampedPosition = Math.max(2, Math.min(98, position));

                      // 根据类型选择图标和颜色
                      const getMarkStyle = () => {
                        switch (mark.type) {
                          case 'EMPHASIS':
                            return { bg: 'bg-red-500', icon: <Flag size={12} className="text-white" fill="currentColor" />, pulse: true };
                          case 'NOTE':
                            return { bg: 'bg-blue-500', icon: <Camera size={12} className="text-white" />, pulse: false };
                          case 'QUESTION':
                            return { bg: 'bg-yellow-500', icon: <HelpCircle size={12} className="text-white" />, pulse: false };
                          case 'BOARD_CHANGE':
                            return { bg: 'bg-purple-500', icon: <Video size={12} className="text-white" />, pulse: false };
                          default:
                            return { bg: 'bg-green-500', icon: <Lightbulb size={12} className="text-white" />, pulse: false };
                        }
                      };

                      const style = getMarkStyle();

                      return (
                        <div
                          key={mark.id || index}
                          className="absolute top-[-10px] flex flex-col items-center group cursor-pointer"
                          style={{ left: `${clampedPosition}%` }}
                          onClick={() => handleSeekTo(timestampSeconds)}
                        >
                          <div className={`${style.bg} shadow-lg p-1.5 rounded-full mb-1 ${style.pulse ? 'animate-pulse' : ''}`}>
                            {style.icon}
                          </div>
                          <div className={`w-[1px] h-12 ${style.bg.replace('bg-', 'bg-')}/50`}></div>
                        </div>
                      );
                    })}
                </div>
             </div>

             <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-6">
                    <button className="text-gray-400 active:text-white active:scale-90 transition-all p-1" onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}>
                        <ChevronLeft size={28}/>
                    </button>
                    <button onClick={togglePlayPause} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(37,99,235,0.4)] active:scale-90 transition-all">
                        {recordLoading ? (
                          <Loader2 size={28} className="animate-spin text-white" />
                        ) : isPlaying ? (
                          <Pause size={28} fill="white" />
                        ) : (
                          <Play size={28} fill="white" className="ml-1"/>
                        )}
                    </button>
                    <button className="text-gray-400 active:text-white active:scale-90 transition-all p-1" onClick={() => setCurrentTime(Math.min(duration, currentTime + 5))}>
                        <ChevronRight size={28}/>
                    </button>
                    <button onClick={() => setPlaybackRate(r => r >= 2.0 ? 1 : r + 1)} className="text-xs font-black text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-lg px-3 py-1.5 ml-2">
                        {playbackRate.toFixed(1)}x
                    </button>
                </div>
                <div className="flex flex-col items-end font-mono">
                    <span className="text-lg font-bold text-white/90">
                      {Math.floor(currentTime / 60).toString().padStart(2, '0')}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                      / {Math.floor(duration / 60).toString().padStart(2, '0')}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                    </span>
                </div>
             </div>
        </div>

        {/* --- C. 底部内容区 (可拖拽展开/收起的笔记面板) --- */}
        <div
            className={`bg-[#FCFBF4] text-gray-900 rounded-t-[40px] shadow-[0_-4px_20px_rgba(0,0,0,0.15),0_-20px_50px_rgba(0,0,0,0.1)] relative z-20 flex flex-col overflow-hidden border-t-2 border-slate-200 transition-all duration-300 ${notesPanelExpanded ? 'flex-1' : 'h-16'}`}
            style={{
                height: isDraggingNotesPanel ? undefined : (notesPanelExpanded ? 'auto' : '64px'),
            }}
        >
            {/* 可拖拽顶部区域 */}
            <div
                className="w-full cursor-grab active:cursor-grabbing select-none touch-none flex flex-col items-center relative"
                onPointerDown={handleNotesPanelDragStart}
                onPointerMove={handleNotesPanelDragMove}
                onPointerUp={handleNotesPanelDragEnd}
            >
                {/* 拖拽指示条 */}
                <div className="w-12 h-1.5 bg-slate-300 rounded-full mt-3 mb-2"></div>

                {/* 标题栏 - 始终显示 */}
                <div className="flex items-center justify-between w-full px-5 py-2">
                    <h3 className="text-xl font-black text-slate-900 font-serif italic">课堂笔记回溯</h3>

                    {/* 蓝色加号 FAB 按钮 - 右上角 */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            // 如果面板收起，先展开
                            if (!notesPanelExpanded) {
                                setNotesPanelExpanded(true);
                            }
                            // 打开添加标记模态框
                            timeMarkerRef.current?.openAddModal();
                        }}
                        className="w-10 h-10 bg-blue-600 rounded-full shadow-[0_4px_12px_rgba(37,99,235,0.4)] flex items-center justify-center text-white hover:bg-blue-700 active:scale-95 transition-all"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* 展开时的内容区域 */}
            {notesPanelExpanded && (
                <>
                    {/* 笔记内容 */}
                    <div className="flex-1 overflow-y-auto px-5 pb-24 relative z-10" ref={scrollRef}>
                        {/* 活页本装饰线 */}
                        <div className="absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-400 opacity-20 z-0"></div>
                        <div className="absolute left-3 top-0 bottom-0 w-4 flex flex-col items-center justify-around py-8 opacity-20 pointer-events-none z-10">
                            {[...Array(10)].map((_, i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]"></div>)}
                        </div>

                        {/* 时间标记与状态 */}
                        <div className="flex items-center space-x-3 mb-4 relative z-10">
                            <TimeMarker
                                ref={timeMarkerRef}
                                studyRecordId={studyRecordId}
                                currentTime={currentTime}
                                timeMarks={timeMarks}
                                onMarksChange={handleMarksChange}
                                onSeekTo={handleSeekTo}
                            />
                        </div>

                        {/* 笔记索引展示 */}
                        <div className="mb-4">
                            <NoteIndex
                                timeMarks={timeMarks}
                                currentTime={currentTime}
                                onSeek={handleSeekTo}
                            />
                        </div>

                        {/* 重点标记导航 */}
                        <div className="mb-4 pt-4 border-t border-slate-200">
                            <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <Flag size={14} className="text-red-500" />
                                重点标记导航
                            </h4>
                            <EmphasisNavigator
                                timeMarks={timeMarks}
                                currentTime={currentTime}
                                onSeek={handleSeekTo}
                            />
                        </div>

                        {/* Transcript 内容 */}
                        {(transcript.length > 0 ? transcript : []).map((seg: any, idx: number) => {
                            const isActive = currentTime >= seg.time && (idx === transcript.length - 1 || currentTime < transcript[idx+1]?.time);
                            return (
                                <div key={idx} onClick={() => handleSeekTo(seg.time)} className={`mb-8 transition-all duration-500 cursor-pointer origin-left ${isActive ? 'opacity-100 scale-105' : 'opacity-20 grayscale'}`}>
                                    <div className="flex items-start">
                                        <div className={`mt-2.5 w-1.5 h-1.5 rounded-full mr-5 shrink-0 transition-all ${isActive ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-300 opacity-50'}`}></div>
                                        <p className={`text-lg leading-relaxed ${seg.isKeypoint ? 'font-black text-blue-900 bg-yellow-200/40 rounded px-1 -mx-1 border-b-2 border-blue-500/20 shadow-sm' : 'font-medium text-gray-800'}`}>{seg.text}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* AI 难点悬浮灯泡 */}
            {(currentTime >= 25 && currentTime < 35 && !showAiPanel) && (
                <button onClick={() => setShowAiPanel(true)}
                        className="absolute right-6 bottom-10 w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-[0_15px_40px_rgba(37,99,235,1)] flex items-center justify-center animate-bounce z-40 border-4 border-[#FCFBF4] active:scale-90 transition-transform">
                    <Lightbulb className="text-yellow-300 drop-shadow-md" fill="currentColor" size={28} />
                    <div className="absolute inset-[-15px] rounded-full bg-blue-400/10 animate-ping"></div>
                </button>
            )}

            {/* ========================================================================
                AI 侧滑增强面板 (重构为符合需求的自由拖拽 Bottom Sheet)
               ======================================================================== */}
            <div 
                className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white z-[60] shadow-[0_-15px_60px_rgba(0,0,0,0.3)] flex flex-col transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1) rounded-t-[32px] overflow-hidden ${showAiPanel ? 'translate-y-0' : 'translate-y-full'}`}
                style={{ 
                  height: `${panelHeight}px`,
                  // 拖拽时取消过渡动画，保证跟随手指不卡顿；非拖拽时保留动画实现点击打开/收起的平滑感
                  transition: isDraggingPanel ? 'none' : 'height 0.4s cubic-bezier(0.32, 0.72, 0, 1), transform 1s cubic-bezier(0.32, 0.72, 0, 1)' 
                }}
            >
                {/* 
                   顶部手柄和标题区 (拖拽控制区) 
                   通过 touch-none 禁止浏览器默认手势，完全由 pointer 接管
                */}
                <div 
                  className="w-full pt-4 pb-2 cursor-grab active:cursor-grabbing flex-none flex flex-col items-center relative select-none touch-none"
                  onPointerDown={handleDragStart}
                  onPointerMove={handleDragMove}
                  onPointerUp={handleDragEnd}
                >
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mb-4"></div>
                    <div className="w-full px-8 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Sparkles size={20} className="text-blue-600" />
                            <h3 className="font-black text-lg text-slate-900 tracking-tight">知识增强</h3>
                        </div>
                        {/* 关闭按钮：点击后面板完全收回不可见 */}
                        <button
  onPointerDown={(e) => {
    e.stopPropagation();
    closeAiPanel();
  }}
  className="relative z-50 bg-blue-600 p-1.5 rounded-full text-white shadow-md active:scale-90 transition-transform flex items-center justify-center"
  aria-label="关闭增强面板"
>
  <X size={16} strokeWidth={3} />
</button>

                           
                    </div>
                </div>

                {/* 内容区域：支持独立滚动，且在面板未全屏时操作会被父层拖拽逻辑截获 */}
                <div className="flex-1 overflow-y-auto px-8 pb-12 scrollbar-hide pt-2">
                    <div className="space-y-6 pt-2">
                        {/* 摘要卡片 */}
                        <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-100">
                            <p className="text-sm text-blue-800 leading-relaxed font-bold">
                                检测到正在讲解 <span className="underline decoration-blue-500/50 decoration-4">"递归实现原理"</span>，已为您关联了可视化演示及深度剖析。
                            </p>
                        </div>

                        {/* 相关标记导航 - Task 2.3.2 */}
                        {relatedMarks.length > 0 && (
                            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                                <div className="flex items-center space-x-2 mb-4">
                                    <Flag size={16} className="text-purple-600" />
                                    <span className="text-sm font-bold text-slate-700">相关标记</span>
                                    <span className="text-xs text-slate-400">±{RELATED_RANGE}秒</span>
                                </div>
                                <div className="space-y-2">
                                    {relatedMarks.slice(0, 5).map((mark) => (
                                        <button
                                            key={mark.id}
                                            onClick={() => handleSeekTo(mark.timestamp)}
                                            className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 hover:border-purple-200 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                                    {Math.floor(mark.timestamp / 60).toString().padStart(2, '0')}:{(mark.timestamp % 60).toString().padStart(2, '0')}
                                                </span>
                                                <span className="text-sm text-slate-700 truncate">
                                                    {mark.content || mark.data?.noteText || '标记内容'}
                                                </span>
                                            </div>
                                            <ChevronRight size={14} className="text-slate-300" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 视频卡片 */}
                        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.05)] relative overflow-hidden">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="bg-[#2563EB] text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-tighter shadow-sm shadow-blue-200">BILIBILI 优质切片</div>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">精选讲解</span>
                            </div>
                            <h4 className="font-black text-slate-800 text-lg mb-4 leading-snug">可视化演示：递归算法中的栈空间变化</h4>
                            <div className="w-full aspect-video bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-md">
                                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400&auto=format&fit=crop" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center relative z-10 border border-white/30">
                                    <Play size={32} className="text-white ml-1" fill="currentColor" />
                                </div>
                                <div className="absolute bottom-3 right-5 text-[11px] font-mono text-white/90 z-20 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">01:45 / 03:20</div>
                            </div>
                            <button className="w-full mt-5 py-4 bg-[#2563EB] rounded-2xl text-white font-black text-base flex items-center justify-center space-x-2 shadow-xl shadow-blue-100 active:scale-95 transition-transform">
                                <span>立即深入学习</span>
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        {/* 核心知识点卡片 */}
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                             <div className="flex items-center space-x-2 mb-5">
                                <div className="bg-slate-800 text-white text-[10px] font-black px-2.5 py-1 rounded uppercase">核心逻辑剖析</div>
                             </div>
                             <div className="space-y-5">
                                {[
                                  { n: 1, c: "blue", t: "确定基准情形 (Base Case)：例如二叉树节点为空时，直接返回 0。" },
                                  { n: 2, c: "indigo", t: "拆解子问题：将整棵树的遍历拆分为根节点处理与左右子树调用。" },
                                  { n: 3, c: "indigo-400", t: "合并结果：将左右子树的处理结果汇总至当前根节点返回。" }
                                ].map((item, i) => (
                                  <div key={i} className="flex items-start space-x-4">
                                      <div className={`w-7 h-7 rounded-lg bg-${item.c}-600 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-md`}>{item.n}</div>
                                      <p className="text-sm text-slate-700 font-bold leading-relaxed">{item.t}</p>
                                  </div>
                                ))}
                             </div>
                        </div>

                        {/* 代码示例展示 */}
                        <div className="bg-[#0F172A] p-5 rounded-3xl border border-slate-700/50 shadow-2xl overflow-hidden relative">
                             <div className="flex items-center justify-between mb-4">
                                <div className="flex space-x-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 uppercase">DFS.py</span>
                             </div>
                             <pre className="text-[11px] font-mono text-blue-300 leading-relaxed overflow-x-auto p-3 bg-black/30 rounded-xl">
                                <code>{`def get_depth(node):
    if not node:
        return 0
    left = get_depth(node.left)
    right = get_depth(node.right)
    return max(left, right) + 1`}</code>
                             </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TimeMachine;
