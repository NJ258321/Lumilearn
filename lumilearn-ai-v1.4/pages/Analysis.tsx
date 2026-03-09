
import React from 'react';
import { HelpCircle, AlertCircle, ChevronRight, PlayCircle, Info, ChevronDown } from 'lucide-react';
import { AppView } from '../types';

interface AnalysisProps {
  onNavigate: (view: AppView) => void;
}

const Analysis: React.FC<AnalysisProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-full bg-[#F7F9FC] font-sans relative overflow-hidden">
      {/* Header */}
      <div className="pt-12 pb-4 px-6 bg-white flex justify-between items-center border-b border-gray-50 flex-none z-10">
        <h1 className="text-xl font-bold text-[#374151]">知识薄弱点分析</h1>
        <HelpCircle size={20} className="text-[#94A3B8]" />
      </div>

      <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide">
        <div className="px-6 py-4">
          {/* Section Title with Course Selector */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-1">
              <h2 className="text-sm font-bold text-[#64748B]">亟待补齐的知识点</h2>
              <ChevronRight size={14} className="text-[#94A3B8]" />
              <HelpCircle size={14} className="text-[#CBD5E1]" />
            </div>
            
            {/* 选择课程入口 - 右对齐 */}
            <button className="flex items-center space-x-1 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm active:bg-slate-50 transition-colors">
              <span className="text-[10px] font-bold text-slate-500">选择课程</span>
              <ChevronDown size={10} className="text-slate-400" />
            </button>
          </div>

          {/* Main Critical Card */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 transition-all active:scale-[0.98]">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#EF4444] flex items-center justify-center">
                <AlertCircle size={14} className="text-white" />
              </div>
              <h3 className="text-base font-bold text-[#1F2937]">函数极限的定义</h3>
            </div>
            <p className="text-xs text-[#94A3B8] mb-4">前提概念理解不足</p>
            <button className="w-full py-2 bg-[#4285F4] text-white text-xs font-bold rounded-xl shadow-md shadow-blue-100">
              强化学习
            </button>
          </div>

          {/* Secondary Cards Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all active:scale-[0.98]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#F97316] flex items-center justify-center">
                  <AlertCircle size={14} className="text-white" />
                </div>
                <h3 className="text-xs font-bold text-[#1F2937]">微分法求导</h3>
              </div>
              <p className="text-[10px] text-[#94A3B8] mb-4">解题思路存在偏差</p>
              <button className="w-full py-2 bg-[#EF4444] text-white text-[10px] font-bold rounded-lg opacity-80">
                强化学习
              </button>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 transition-all active:scale-[0.98]">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#FBBF24] flex items-center justify-center">
                  <Info size={14} className="text-white" />
                </div>
                <h3 className="text-xs font-bold text-[#1F2937]">牛顿第二定律</h3>
              </div>
              <p className="text-[10px] text-[#94A3B8] mb-4">知识点掌握不佳</p>
              <button className="w-full py-2 bg-[#4285F4] text-white text-[10px] font-bold rounded-lg">
                强化学习
              </button>
            </div>
          </div>

          {/* Diagnosis Details Header */}
          <div className="flex items-center space-x-1 mb-4">
            <h2 className="text-sm font-bold text-[#64748B]">诊断详情</h2>
            <ChevronRight size={14} className="text-[#94A3B8]" />
          </div>

          {/* Details Content Container */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex h-[320px]">
            {/* Left: Knowledge Map */}
            <div className="flex-1 border-r border-gray-50 pr-4">
              <h4 className="text-[11px] font-bold text-[#64748B] mb-4">知识图谱</h4>
              <div className="relative h-full flex flex-col items-center justify-center">
                {/* Mock Graph Visualization */}
                <div className="space-y-6 flex flex-col items-center">
                  <div className="px-3 py-1.5 rounded-full border border-gray-200 text-[10px] text-[#64748B] bg-white shadow-sm">极限定义</div>
                  <div className="flex items-center space-x-4">
                    <div className="px-3 py-1.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold shadow-md">连续性定义</div>
                    <div className="px-3 py-1.5 rounded-full border border-gray-200 text-[10px] text-[#64748B] bg-white shadow-sm">连读性</div>
                  </div>
                  <div className="px-3 py-1.5 rounded-full border border-gray-200 text-[10px] text-[#64748B] bg-white shadow-sm">导数</div>
                </div>
                {/* SVG Arrows */}
                <svg className="absolute inset-0 pointer-events-none w-full h-full opacity-30">
                  <path d="M 90,60 Q 110,100 90,140" fill="none" stroke="#64748B" strokeWidth="1" strokeDasharray="2,2" />
                  <path d="M 90,160 Q 70,200 90,240" fill="none" stroke="#64748B" strokeWidth="1" strokeDasharray="2,2" />
                </svg>
              </div>
            </div>

            {/* Right: Behavior & Strategy */}
            <div className="flex-1 pl-4 flex flex-col">
              <div className="mb-6">
                <h4 className="text-[11px] font-bold text-[#64748B] mb-2">行为分析</h4>
                <ul className="space-y-2">
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4] mt-1.5 shrink-0"></div>
                    <span className="text-[10px] text-[#374151] leading-relaxed">反复回听同一讲课片段</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4285F4] mt-1.5 shrink-0"></div>
                    <span className="text-[10px] text-[#374151] leading-relaxed">错题错误频率较高</span>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-[#64748B] mb-2">推荐策略</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-1.5 rounded-lg bg-[#F8FAFC]">
                    <PlayCircle size={14} className="text-[#4285F4]" />
                    <span className="text-[10px] text-[#374151] truncate">极限的原本概念讲解</span>
                  </div>
                  <div className="flex items-center space-x-2 p-1.5 rounded-lg bg-[#F8FAFC]">
                    <PlayCircle size={14} className="text-[#4285F4]" />
                    <span className="text-[10px] text-[#374151] truncate">函数极限题目解析</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Robot Element - 将 bottom-6 修改为 bottom-[80px] 以避开底部导航栏 */}
      <div 
        onClick={() => onNavigate(AppView.AGENT)}
        className="absolute bottom-[80px] right-4 z-40 animate-bounce transition-transform active:scale-90"
      >
        <div className="relative cursor-pointer">
          <div className="w-16 h-16 bg-transparent relative flex items-center justify-center">
             <img 
               src="https://img.icons8.com/plasticine/200/robot-3.png" 
               alt="AI Robot" 
               className="w-full h-full object-contain drop-shadow-lg"
             />
             <div className="absolute -right-1 top-1/2 -translate-y-1/2 bg-[#34D399] p-1 rounded-full shadow-lg border border-white">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M12,2L14.85,9.21L22,12L14.85,14.79L12,22L9.15,14.79L2,12L9.15,9.21L12,2Z" /></svg>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
