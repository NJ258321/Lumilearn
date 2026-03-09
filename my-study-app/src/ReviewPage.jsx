import React, { useState } from 'react';
import { Play, SkipBack, SkipForward, Layers, Map, ExternalLink, ChevronLeft } from 'lucide-react';

const ReviewPage = ({ onBack, navigate }) => {
  const [progress, setProgress] = useState(35); // 模拟进度 35%

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      {/* 顶部导航 */}
      <div className="p-4 flex items-center justify-between bg-slate-800/50 backdrop-blur-md">
        <button onClick={() => onBack && onBack()} className="p-2"><ChevronLeft size={24} /></button>
        <div className="text-center">
          <h2 className="text-sm font-bold">复习：指令系统</h2>
          <p className="text-[10px] text-slate-400">录制于 2026-01-24 · 计算机组成原理</p>
        </div>
        <button onClick={() => navigate && navigate('knowledge')} className="p-2 text-blue-400"><Map size={20} /></button>
      </div>

      {/* 主视图区：音-画-笔同步 (1.1.2.2) */}
      <div className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        {/* 课件/板书展示层 */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-slate-700">
          <img 
            src="https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=1000" 
            className="w-full h-full object-cover opacity-80"
            alt="PPT Slide"
          />
          {/* 手写笔迹层模拟：随进度条出现的动态感 */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <path 
              d="M 50 50 Q 100 80 150 50 T 250 70" 
              fill="none" 
              stroke="#60a5fa" 
              strokeWidth="3" 
              strokeLinecap="round"
              className="animate-[draw_2s_ease-in-out_infinite]"
              style={{ strokeDasharray: 500, strokeDashoffset: progress > 30 ? 0 : 500 }}
            />
          </svg>
          <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-slate-300">
            P.12 / 寻址方式讲解
          </div>
        </div>

        {/* 知识点导航卡片 (1.1.2.1 可视化地图入口) */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-blue-400">关联知识点</span>
            <ExternalLink size={14} className="text-slate-500" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 bg-blue-500/10 rounded-lg border border-blue-500/30">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-xs flex-1">立即寻址与寄存器寻址</span>
              <span className="text-[10px] text-blue-400">重点讲解</span>
            </div>
            <div className="flex items-center gap-3 p-2 bg-slate-700/50 rounded-lg opacity-60">
              <div className="w-2 h-2 rounded-full bg-slate-500"></div>
              <span className="text-xs">间接寻址的优缺点</span>
            </div>
          </div>
        </div>

        {/* 助教干预预留区 (1.1.3 AI补位) */}
        <div className="mt-auto bg-gradient-to-r from-indigo-900/40 to-slate-800 p-4 rounded-2xl border border-indigo-500/20">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs shadow-lg shadow-indigo-500/20">AI</div>
            <div className="flex-1">
              <p className="text-[11px] leading-relaxed text-slate-200">
                “老师在 12:45 提到的‘堆栈寻址’似乎让你感到困惑。需要查看 3 分钟的外部强化讲解吗？”
              </p>
              <button className="mt-2 text-[10px] font-bold text-indigo-400 hover:text-indigo-300">查看补强资源 →</button>
            </div>
          </div>
        </div>
      </div>

      {/* 底部多维控制器 */}
      <div className="bg-slate-800 p-6 pb-10 rounded-t-[32px] shadow-2xl">
        {/* 时间轴导航 */}
        <div className="relative h-1 w-full bg-slate-700 rounded-full mb-6 cursor-pointer">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full flex items-center justify-end"
            style={{ width: `${progress}%` }}
          >
            <div className="w-3 h-3 bg-white rounded-full shadow-lg"></div>
          </div>
          {/* 语义标记条 (1.1.2.2) */}
          <div className="absolute top-0 left-[20%] w-1 h-full bg-red-400"></div>
          <div className="absolute top-0 left-[45%] w-1 h-full bg-red-400"></div>
        </div>

        <div className="flex justify-between items-center px-4">
          <button className="text-slate-400"><Layers size={20} /></button>
          <div className="flex items-center gap-8">
            <SkipBack size={24} className="text-slate-300" />
            <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-900/40 active:scale-90 transition-transform">
              <Play size={28} fill="currentColor" />
            </div>
            <SkipForward size={24} className="text-slate-300" />
          </div>
          <button className="text-slate-400"><SkipForward size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;