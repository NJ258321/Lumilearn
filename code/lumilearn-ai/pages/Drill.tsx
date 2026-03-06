
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronRight, PlayCircle, Zap, Trophy, FileText, ChevronLeft } from 'lucide-react';
import { AppView } from '../types';

interface DrillProps {
  onNavigate: (view: AppView) => void;
}

// 模拟数据：考点掌握分布 (修改为三部分)
const MASTERY_DATA = [
  { name: '薄弱', value: 30, color: '#EF4444' },    // Red
  { name: '待巩固', value: 35, color: '#F59E0B' },  // Orange
  { name: '已掌握', value: 35, color: '#3B82F6' },  // Blue
];

const Drill: React.FC<DrillProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-full bg-[#F4F6F9] font-sans relative overflow-hidden">
      
      {/* 1. 顶部 Header 区 */}
      <div className="pt-12 pb-4 px-6 flex justify-between items-end bg-gradient-to-b from-white to-[#F4F6F9]">
        <div className="flex items-start space-x-3">
          <button 
            onClick={() => onNavigate(AppView.PRACTICE_LIST)}
            className="mt-1 p-1 bg-slate-100 rounded-full text-slate-500 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-1">阶段总结与演练</h1>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
               <span>查漏补缺</span>
               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
               <span>强化巩固</span>
               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
               <span>见证成效</span>
            </div>
          </div>
        </div>
        <button className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors active:scale-95">
          <span className="text-xs font-bold">查看报告</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-12 scrollbar-hide space-y-6">
        
        {/* 2. 考点掌握情况卡片 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-slate-800">考点掌握情况</h2>
                <ChevronRight size={16} className="text-slate-300" />
            </div>

            <div className="flex items-center">
                {/* 左侧：环形图 */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={MASTERY_DATA}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {MASTERY_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* 中心文字 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-2xl font-black text-slate-800 leading-none">72<span className="text-xs font-bold text-emerald-500 ml-0.5">+1</span></div>
                        <div className="text-[9px] text-slate-400 transform scale-90 mt-1">弱项掌握度</div>
                    </div>
                </div>

                {/* 右侧：列表详情 */}
                <div className="flex-1 pl-6 space-y-3">
                    <div className="flex justify-between items-center text-slate-800">
                        <span className="text-sm font-bold">整体掌握度 <span className="text-xl">72</span> <span className="text-emerald-500 text-xs">+16</span></span>
                    </div>
                    <div className="space-y-2">
                        {/* 列表项 1 */}
                        <div className="flex items-center justify-between group cursor-pointer active:opacity-70">
                            <div className="flex items-center">
                                <span className="w-4 h-4 rounded flex items-center justify-center bg-red-500 text-white text-[9px] font-bold mr-2">A</span>
                                <span className="text-xs text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">薄弱</span>
                                <span className="text-xs text-red-400 ml-1">重难点</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400 font-bold">30%</span>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                         {/* 列表项 2 */}
                        <div className="flex items-center justify-between group cursor-pointer active:opacity-70">
                            <div className="flex items-center">
                                <span className="w-4 h-4 rounded flex items-center justify-center bg-orange-400 text-white text-[9px] font-bold mr-2">C</span>
                                <span className="text-xs text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded">待巩固</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400 font-bold">35%</span>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                         {/* 列表项 3 */}
                        <div className="flex items-center justify-between group cursor-pointer active:opacity-70">
                            <div className="flex items-center">
                                <span className="w-4 h-4 rounded flex items-center justify-center bg-blue-500 text-white text-[9px] font-bold mr-2">B</span>
                                <span className="text-xs text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">已掌握</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400 font-bold">35%</span>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. 智能组卷与练习 */}
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-base font-bold text-slate-800">智能组卷与练习</h2>
                <ChevronRight size={16} className="text-slate-300" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {/* 智能生成卡片 */}
                <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28 relative overflow-hidden group active:scale-98 transition-transform">
                    <div className="absolute right-[-10px] top-[-10px] w-16 h-16 bg-blue-50 rounded-full z-0 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-3 shadow-sm">
                            <Zap size={18} fill="currentColor" />
                        </div>
                        <div className="text-left">
                            <div className="font-black text-slate-800 text-sm mb-0.5">智能生成试卷</div>
                            <div className="text-[10px] text-slate-400">基于薄弱点 · 15分钟</div>
                        </div>
                    </div>
                </button>

                {/* 往年真题演练卡片 */}
                <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28 relative overflow-hidden group active:scale-98 transition-transform">
                    <div className="absolute right-[-10px] top-[-10px] w-16 h-16 bg-purple-50 rounded-full z-0 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-3 shadow-sm">
                            <Trophy size={18} fill="currentColor" />
                        </div>
                        <div className="text-left">
                            <div className="font-black text-slate-800 text-sm mb-0.5">往年真题演练</div>
                            <div className="text-[10px] text-slate-400">2024 真题 · 限时训练</div>
                        </div>
                    </div>
                </button>
            </div>
        </div>

        {/* 4. 错题回顾列表 */}
        <div className="bg-white rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.02)] border border-slate-100 -mx-4 px-6 pt-6 pb-4">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <h2 className="text-base font-bold text-slate-800">错题回顾</h2>
                </div>
                <div className="flex items-center space-x-4 text-xs font-bold text-slate-400">
                    <span className="text-blue-500">错因分析</span>
                    <span>专题练</span>
                    <ChevronRight size={14} />
                </div>
            </div>

            <div className="space-y-6">
                {/* 错题 1 */}
                <div className="relative pl-4 border-l-2 border-slate-100">
                    <div className="flex items-start mb-2">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm mr-2 flex-shrink-0 mt-0.5">错题</span>
                        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-center">
                            第3章 导数的基本概念
                        </div>
                    </div>
                    
                    <div className="mb-3">
                        <h3 className="text-sm font-bold text-slate-800 mb-2 leading-relaxed">
                            <span className="text-red-500 mr-1">A.</span> 导数的变化率定义
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2">
                            设函数 f(x) 在点 x=a 处可导，则极限 lim (h→0) [f(a+2h) - f(a)] / h 的值等于？
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                            标准作答：2f'(a)
                        </p>
                    </div>

                    <button 
                        onClick={() => onNavigate(AppView.TIME_MACHINE)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#4285F4] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md shadow-blue-100 active:scale-95 transition-transform"
                    >
                        一键回顾
                    </button>
                </div>

                {/* 错题 2 */}
                <div className="relative pl-4 border-l-2 border-slate-100">
                    <div className="flex items-start mb-2">
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm mr-2 flex-shrink-0 mt-0.5">错题</span>
                        <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-center">
                            第5章 极限与连续性
                        </div>
                    </div>
                    
                    <div className="mb-3">
                        <h3 className="text-sm font-bold text-slate-800 mb-2 leading-relaxed">
                            <span className="text-red-500 mr-1">B.</span> 极限的定义
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-2">
                            当 lim x→∞ f(x)=1 时，下列结论正确的是？
                        </p>
                        <p className="text-xs text-slate-400 font-mono">
                            标准作答：A. f(a) = 1
                        </p>
                    </div>

                    <button 
                        onClick={() => onNavigate(AppView.TIME_MACHINE)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 bg-[#4285F4] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-md shadow-blue-100 active:scale-95 transition-transform"
                    >
                        一键回顾
                    </button>
                </div>
            </div>

            <button className="w-full mt-6 py-3 text-xs font-bold text-blue-500 flex items-center justify-center space-x-1 active:bg-blue-50 rounded-xl transition-colors">
                <span>查看全部错题</span>
                <ChevronRight size={14} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default Drill;
