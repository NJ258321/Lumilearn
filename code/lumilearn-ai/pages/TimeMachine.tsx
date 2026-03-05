
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Play, Pause, ChevronLeft, ChevronRight, Share2, Lightbulb, Sparkles, Video, Flag, Camera, HelpCircle, X } from 'lucide-react';
import { MOCK_TRANSCRIPT } from '../constants';
import { AppView } from '../types';
import TimeMarker from '../src/components/TimeMarker';
import { getTimeMarkList } from '../src/api/timeMarks';
import type { TimeMark } from '../types';

interface TimeMachineProps {
  onBack: () => void;
}

const PPT_SLIDES = [
  { id: 1, timeStart: 0, url: 'https://img-blog.csdnimg.cn/51bfbf73e2c24f30bccfcf8d01670815.png', title: '二叉树的基本定义' },
  { id: 2, timeStart: 10, url: 'https://img-blog.csdnimg.cn/0e9c866d507641b7a5ccd5229363ed2d.png', title: '前/中/后序遍历算法' },
  { id: 3, timeStart: 25, url: 'https://img-blog.csdnimg.cn/20191103214403218.JPG?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L3FxXzQwMDYyODg0,size_16,color_FFFFFF,t_70', title: '递归实现与时空复杂度' },
  { id: 4, timeStart: 40, url: 'https://tse1.mm.bing.net/th/id/OIP.tm6Cv9qxKuoxE5ULsIYf3wHaDJ?rs=1&pid=ImgDetMain&o=7&rm=3', title: '实战：二叉树深度计算' },
];

const TimeMachine: React.FC<TimeMachineProps> = ({ onBack }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // AI 面板状态
  const [showAiPanel, setShowAiPanel] = useState(false);
  const INITIAL_PANEL_HEIGHT = 450;
  const [panelHeight, setPanelHeight] = useState(INITIAL_PANEL_HEIGHT);
  const [isDraggingPanel, setIsDraggingPanel] = useState(false);

  // 时间标记状态
  const [timeMarks, setTimeMarks] = useState<TimeMark[]>([]);
  const [marksLoading, setMarksLoading] = useState(false);
  const [studyRecordId] = useState('550e8400-e29b-41d4-a716-446655440003'); // 测试用学习记录 ID

  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);
  const duration = 50;

  const activeSlideIndex = PPT_SLIDES.reduce((acc, slide, idx) => {
    return currentTime >= slide.timeStart ? idx : acc;
  }, 0);

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

  // 初始获取时间标记
  useEffect(() => {
    fetchTimeMarks();
  }, [fetchTimeMarks]);

  // 时间标记变化处理
  const handleMarksChange = (marks: TimeMark[]) => {
    setTimeMarks(marks);
  };

  // 跳转到指定时间
  const handleSeekTo = (time: number) => {
    setCurrentTime(time);
    setIsPlaying(false);
  };

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
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
  }, [isPlaying, playbackRate]);

  useEffect(() => {
    if (scrollRef.current) {
        const index = MOCK_TRANSCRIPT.findIndex(s => s.time > currentTime);
        const activeIndex = index === -1 ? MOCK_TRANSCRIPT.length - 1 : index - 1;
        if (activeIndex >= 0) {
            const el = scrollRef.current.children[activeIndex] as HTMLElement;
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [currentTime]);

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

  return (
    <div className="flex flex-col h-screen bg-[#0F172A] text-white relative font-sans overflow-hidden">
        
        {/* --- A. 顶部视觉区 --- */}
        <div className="h-[38%] relative px-4 pt-14 pb-4 flex flex-col">
            <div className="absolute top-4 left-0 right-0 z-30 px-6 flex justify-between items-center">
                <button onClick={onBack} className="bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/20">
                    <ArrowLeft size={18} />
                </button>
                <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 px-3 py-1 rounded-full flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase">Classroom Sync</span>
                </div>
                <button className="bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20">
                    <Share2 size={16} />
                </button>
            </div>

            <div className="flex-1 w-full bg-[#1a2e26] rounded-xl border-[6px] border-[#4a3225] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col">
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/5 z-10"></div>
                <div className="flex-1 w-full relative overflow-hidden">
                    <div className="flex w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                         style={{ transform: `translateX(-${activeSlideIndex * 100}%)` }}>
                        {PPT_SLIDES.map((slide) => (
                            <div key={slide.id} className="min-w-full h-full relative flex items-center justify-center p-2">
                                <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] pointer-events-none z-10"></div>
                                <img src={slide.url} alt={slide.title} className="max-w-full max-h-full object-contain relative z-0" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="h-2 bg-[#3d291e] border-t border-black/20 relative">
                  <div className="absolute left-1/4 top-0.5 w-4 h-1 bg-white/40 rounded-full blur-[1px]"></div>
                  <div className="absolute right-1/3 top-0.5 w-3 h-1 bg-yellow-200/40 rounded-full blur-[1px]"></div>
                </div>
                <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
                    <div className="bg-emerald-600/90 text-[8px] font-black px-1.5 py-0.5 rounded-sm mb-1 inline-block text-white uppercase tracking-tighter">Current Board</div>
                    <h2 className="text-base font-black tracking-tight text-white drop-shadow-md line-clamp-1">{PPT_SLIDES[activeSlideIndex].title}</h2>
                </div>
                <div className="absolute bottom-4 right-4 z-20 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md text-[9px] font-mono border border-white/10 text-white/80">
                    P{activeSlideIndex + 1}
                </div>
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
                            <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${isPlayed ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-700'}`}
                                 style={{ height: `${height}%` }}></div>
                        );
                    })}
                </div>
                <div className="absolute inset-0 z-10">
                    <div className="absolute left-[2%] top-[-10px] flex flex-col items-center group cursor-pointer" onClick={() => setCurrentTime(0)}>
                        <div className="bg-purple-500 shadow-lg p-1.5 rounded-full mb-1"><Video size={12} className="text-white" /></div>
                        <div className="w-[1px] h-12 bg-purple-400/50"></div>
                    </div>
                    <div className="absolute left-[20%] top-[-10px] flex flex-col items-center group cursor-pointer" onClick={() => setCurrentTime(10)}>
                        <div className="bg-blue-500 shadow-lg p-1.5 rounded-full mb-1"><Camera size={12} className="text-white" /></div>
                        <div className="w-[1px] h-12 bg-blue-400/50"></div>
                    </div>
                    <div className="absolute left-[50%] top-[-10px] flex flex-col items-center group cursor-pointer" onClick={() => setCurrentTime(25)}>
                        <div className="bg-red-500 shadow-lg p-1.5 rounded-full mb-1"><Flag size={12} className="text-white" fill="currentColor" /></div>
                        <div className="w-[1px] h-12 bg-red-500/50 animate-pulse"></div>
                    </div>
                    <div className="absolute left-[80%] top-[-10px] flex flex-col items-center group cursor-pointer" onClick={() => setCurrentTime(40)}>
                        <div className="bg-yellow-500 shadow-lg p-1.5 rounded-full mb-1"><HelpCircle size={12} className="text-white" /></div>
                        <div className="w-[1px] h-12 bg-yellow-500/50"></div>
                    </div>
                </div>
             </div>

             <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-6">
                    <button className="text-gray-400 active:text-white active:scale-90 transition-all p-1" onClick={() => setCurrentTime(Math.max(0, currentTime - 5))}>
                        <ChevronLeft size={28}/>
                    </button>
                    <button onClick={togglePlay} className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(37,99,235,0.4)] active:scale-90 transition-all">
                        {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1"/>}
                    </button>
                    <button className="text-gray-400 active:text-white active:scale-90 transition-all p-1" onClick={() => setCurrentTime(Math.min(duration, currentTime + 5))}>
                        <ChevronRight size={28}/>
                    </button>
                    <button onClick={() => setPlaybackRate(r => r >= 2.0 ? 0.5 : r + 0.5)} className="text-xs font-black text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-lg px-3 py-1.5 ml-2">
                        {playbackRate.toFixed(1)}x
                    </button>
                </div>
                <div className="flex flex-col items-end font-mono">
                    <span className="text-lg font-bold text-white/90">00:{Math.floor(currentTime).toString().padStart(2, '0')}</span>
                    <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">/ 00:{duration}</span>
                </div>
             </div>
        </div>

        {/* --- C. 底部内容区 (活页本风格) --- */}
        <div className="flex-1 bg-[#FCFBF4] text-gray-900 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.3)] relative z-20 flex flex-col overflow-hidden border-t-2 border-slate-200">
            <div className="absolute left-10 top-0 bottom-0 w-[1.5px] bg-red-400 opacity-20 z-0"></div>
            <div className="absolute left-3 top-0 bottom-0 w-4 flex flex-col items-center justify-around py-8 opacity-20 pointer-events-none z-10">
                {[...Array(10)].map((_, i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-400 shadow-[inset_1px_1px_2px_rgba(0,0,0,0.2)]"></div>)}
            </div>
            <div className="flex px-14 pt-10 pb-4 items-center justify-between relative z-10">
                <div className="flex flex-col">
                   <h3 className="text-xl font-black text-slate-900 font-serif italic">课堂笔记回溯</h3>
                   <div className="w-24 h-1 bg-blue-500/20 mt-1 rounded-full"></div>
                </div>
                <div className="flex items-center space-x-3">
                    {/* 时间标记组件 */}
                    <TimeMarker
                        studyRecordId={studyRecordId}
                        currentTime={currentTime}
                        timeMarks={timeMarks}
                        onMarksChange={handleMarksChange}
                        onSeekTo={handleSeekTo}
                    />
                    <div className="bg-slate-200/50 px-3 py-1 rounded-full flex items-center space-x-2 border border-slate-300/30">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Smart-Sync</span>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pl-14 pr-8 pt-2 scrollbar-hide pb-24 relative z-10" ref={scrollRef}>
                <div className={`mb-8 transition-all duration-500 origin-left cursor-pointer ${currentTime < 2 ? 'opacity-100 scale-105' : 'opacity-20 grayscale'}`} onClick={() => setCurrentTime(0)}>
                    <div className="flex items-start">
                        <div className="bg-purple-100 p-2.5 rounded-xl mr-3 shadow-sm border border-purple-200/50"><Video size={18} className="text-purple-600" /></div>
                        <div className="flex-1">
                            <h4 className="text-[9px] font-black text-purple-600 uppercase mb-1 tracking-widest bg-purple-50 px-1.5 py-0.5 rounded-sm inline-block">Chapter Opening Video</h4>
                            <p className="text-lg leading-relaxed font-black text-slate-800 underline decoration-slate-200 decoration-2 underline-offset-4">[视频演示]：二叉树在实际开发中的树状可视化展示。</p>
                        </div>
                    </div>
                </div>
                {MOCK_TRANSCRIPT.map((seg, idx) => {
                    const isActive = currentTime >= seg.time && (idx === MOCK_TRANSCRIPT.length - 1 || currentTime < MOCK_TRANSCRIPT[idx+1].time);
                    return (
                        <div key={idx} onClick={() => setCurrentTime(seg.time)} className={`mb-8 transition-all duration-500 cursor-pointer origin-left ${isActive ? 'opacity-100 scale-105' : 'opacity-20 grayscale'}`}>
                            <div className="flex items-start">
                                <div className={`mt-2.5 w-1.5 h-1.5 rounded-full mr-5 shrink-0 transition-all ${isActive ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-gray-300 opacity-50'}`}></div>
                                <p className={`text-lg leading-relaxed ${seg.isKeypoint ? 'font-black text-blue-900 bg-yellow-200/40 rounded px-1 -mx-1 border-b-2 border-blue-500/20 shadow-sm' : 'font-medium text-gray-800'}`}>{seg.text}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* AI 难点悬浮灯泡 */}
            {(currentTime >= 25 && currentTime < 35 && !showAiPanel) && (
                <button onClick={() => setShowAiPanel(true)}
                        className="absolute right-6 bottom-10 w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-full shadow-[0_15px_40px_rgba(37,99,235,0.5)] flex items-center justify-center animate-bounce z-40 border-4 border-[#FCFBF4] active:scale-90 transition-transform">
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
                  transition: isDraggingPanel ? 'none' : 'height 0.4s cubic-bezier(0.32, 0.72, 0, 1), transform 0.5s cubic-bezier(0.32, 0.72, 0, 1)' 
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
                                检测到正在讲解 <span className="underline decoration-blue-500/50 decoration-4">“递归实现原理”</span>，已为您关联了可视化演示及深度剖析。
                            </p>
                        </div>

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
