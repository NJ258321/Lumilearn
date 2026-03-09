
import React, { useMemo, useState } from 'react';
import { HelpCircle, AlertCircle, ChevronRight, PlayCircle, Info, BookOpen, ChevronDown, Check, X, Target, Zap, Clock, MessageSquare, Bot } from 'lucide-react';
import { AppView } from '../types';

interface AnalysisProps {
  onNavigate: (view: AppView) => void;
  currentCourseId?: string | null;
  onCourseChange?: (id: string) => void;
}

const Analysis: React.FC<AnalysisProps> = ({ onNavigate, currentCourseId, onCourseChange }) => {
  const [showPicker, setShowPicker] = useState(false);

  // 课程名称锁定为高等数学
  const currentCourseName = "高等数学";

  const weakPoints = [
    {
      id: 1,
      title: "函数极限的定义",
      desc: `该考点是${currentCourseName}的基础。近期错误率 85%， ε-δ 定义逻辑转化存在障碍。`,
      tag: "Top Weak Point",
      color: "red",
      icon: AlertCircle
    },
    {
      id: 2,
      title: "泰勒公式展开",
      desc: "余项形式记忆混淆，在求极限时的阶数控制不准确。近期错误率 72%。",
      tag: "High Frequency",
      color: "orange",
      icon: Zap
    },
    {
      id: 3,
      title: "不定积分计算",
      desc: "凑微分法运用不熟练，三角代换易出错。近三次作业平均得分率 60%。",
      tag: "Needs Practice",
      color: "blue",
      icon: Target
    }
  ];

  const getCardStyles = (color: string) => {
      if (color === 'red') return { iconBg: 'bg-red-500', shadow: 'shadow-red-100', tag: 'text-slate-400', btn: 'bg-[#4285F4]' };
      if (color === 'orange') return { iconBg: 'bg-orange-500', shadow: 'shadow-orange-100', tag: 'text-slate-400', btn: 'bg-orange-500' };
      return { iconBg: 'bg-blue-500', shadow: 'shadow-blue-100', tag: 'text-slate-400', btn: 'bg-blue-500' };
  };

  return (
    <div className="flex flex-col h-screen bg-[#F7F9FC] font-sans relative overflow-hidden">
      
      {/* 1. 固定头部区域 */}
      <div className="flex-none z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="pt-12 pb-3 px-6 flex justify-between items-center">
          <h1 className="text-xl font-black text-[#1F2937] tracking-tight">知识薄弱点分析</h1>
          <HelpCircle size={20} className="text-slate-400" />
        </div>
        
        <div className="px-6 pb-4 flex items-center">
          <div 
            onClick={() => setShowPicker(true)}
            className="flex items-center space-x-2 bg-blue-600 px-4 py-2 rounded-full border border-blue-500 shadow-lg shadow-blue-100 active:scale-95 transition-transform cursor-pointer"
          >
            <BookOpen size={14} className="text-white" />
            <span className="text-xs font-black text-white tracking-tight">分析中：{currentCourseName}</span>
            <ChevronDown size={14} className="text-blue-100" />
          </div>
        </div>
      </div>

      {/* 2. 可滚动的页面主体内容 */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide z-0">
        <div className="px-6 py-4">
          
          {/* 薄弱点列表 Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-black text-slate-800 flex items-center">
              <span className="w-1.5 h-4 bg-red-500 rounded-full mr-2"></span>
              待攻克薄弱点 ({weakPoints.length})
            </h2>
            <div className="flex items-center space-x-1 text-slate-400 active:text-slate-600 transition-colors cursor-pointer group">
              <span className="text-[10px] font-bold group-hover:text-blue-500 transition-colors">查看全部</span>
              <ChevronRight size={12} className="group-hover:text-blue-500 transition-colors" />
            </div>
          </div>

          {/* 横向滚动薄弱点卡片 */}
          <div className="flex space-x-3 overflow-x-auto pb-6 -mx-6 px-6 scrollbar-hide snap-x">
             {weakPoints.map(wp => {
                 const styles = getCardStyles(wp.color);
                 return (
                     <div key={wp.id} className="snap-center flex-shrink-0 w-[85%] bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className={`w-8 h-8 rounded-xl ${styles.iconBg} flex items-center justify-center shadow-lg ${styles.shadow}`}>
                            <wp.icon size={18} className="text-white" />
                          </div>
                          <div>
                            <h3 className="text-base font-black text-slate-800">{wp.title}</h3>
                            <p className={`text-[10px] ${styles.tag} font-bold uppercase tracking-wider`}>{wp.tag}</p>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50 mb-4 font-medium flex-1">
                          {wp.desc}
                        </p>
                        <button className={`w-full py-2.5 ${styles.btn} text-white text-[11px] font-bold rounded-xl shadow-lg active:scale-95 transition-transform`}>
                          立即强化学习
                        </button>
                     </div>
                 )
             })}
          </div>

          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">深度诊断分析</h2>
            <ChevronRight size={14} className="text-slate-300" />
          </div>

          {/* 核心诊断组件 - 高度大幅压缩至 320px */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden mb-10 flex flex-row h-[320px]">
            
            {/* 左侧分栏：知识图谱 */}
            <div className="w-[55%] border-r border-slate-50 relative p-3 bg-slate-50/20 flex flex-col">
              <h4 className="text-[9px] font-black text-slate-400 mb-1 uppercase tracking-tighter">知识联络图谱</h4>
              <div className="flex-1 relative">
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 160 220" preserveAspectRatio="xMidYMid meet">
                  <line x1="80" y1="110" x2="40" y2="60" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="80" y1="110" x2="120" y2="60" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
                  <line x1="80" y1="110" x2="80" y2="30" stroke="#EF4444" strokeWidth="1.5" />
                  <line x1="80" y1="110" x2="30" y2="170" stroke="#3B82F6" strokeWidth="1.2" />
                  <line x1="80" y1="110" x2="130" y2="170" stroke="#3B82F6" strokeWidth="1.2" />
                </svg>
                <div className="absolute inset-0">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-red-500 text-white rounded-full text-[9px] font-black shadow-lg ring-2 ring-red-100 z-10 whitespace-nowrap">
                    函数极限
                  </div>
                  <div className="absolute left-[2%] top-[20%] px-1.5 py-0.5 bg-white border border-red-200 text-red-500 rounded-md text-[8px] font-bold shadow-sm">左极限</div>
                  <div className="absolute right-[2%] top-[20%] px-1.5 py-0.5 bg-white border border-red-200 text-red-500 rounded-md text-[8px] font-bold shadow-sm">右极限</div>
                  <div className="absolute left-[25%] top-[5%] px-1.5 py-0.5 bg-white border border-red-300 text-red-600 rounded-md text-[8px] font-black shadow-md">无穷小量</div>
                  <div className="absolute left-[0%] bottom-[15%] px-1.5 py-0.5 bg-white border border-blue-200 text-blue-500 rounded-md text-[8px] font-bold shadow-sm">连续性</div>
                  <div className="absolute right-[0%] bottom-[15%] px-1.5 py-0.5 bg-white border border-blue-200 text-blue-500 rounded-md text-[8px] font-bold shadow-sm">间断点</div>
                </div>
              </div>
              {/* 图例改为水平排列以节省垂直空间 */}
              <div className="mt-0 flex flex-row space-x-3 items-center">
                 <div className="flex items-center space-x-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div><span className="text-[8px] font-bold text-slate-400">待强化</span></div>
                 <div className="flex items-center space-x-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div><span className="text-[8px] font-bold text-slate-400">已掌握</span></div>
              </div>
            </div>

            {/* 右侧分栏：特征与策略 - 压缩间距 */}
            <div className="w-[45%] p-3 flex flex-col overflow-y-auto scrollbar-hide bg-white">
              <div className="mb-4">
                <div className="flex items-center space-x-1.5 mb-2">
                   <Target size={12} className="text-blue-500" />
                   <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">学习特征</h4>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: "深夜专注", icon: Clock, color: "text-purple-500", bg: "bg-purple-50" },
                    { label: "概念死磕", icon: Info, color: "text-blue-500", bg: "bg-blue-50" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center space-x-2 p-1.5 rounded-lg bg-slate-50/50 border border-slate-100">
                      <div className={`p-1 rounded-md ${item.bg} ${item.color}`}><item.icon size={12} /></div>
                      <span className="text-[10px] font-black text-slate-700 truncate">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5 mb-2">
                   <Zap size={12} className="text-orange-500" />
                   <h4 className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">推荐策略</h4>
                </div>
                <div className="space-y-1.5">
                  {[
                    { title: "补丁课", icon: PlayCircle, color: "text-blue-500" },
                    { title: "降难练", icon: Zap, color: "text-orange-500" }
                  ].map((action, i) => (
                    <div key={i} className="flex items-center space-x-2 p-2 rounded-lg bg-white border border-slate-100 shadow-sm active:scale-95 transition-transform cursor-pointer">
                      <action.icon size={14} className={action.color} />
                      <span className="text-[10px] font-black text-slate-700">{action.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 
          3. 助学机器人 - 使用 absolute 定位
          改为 absolute 并配合父容器 h-screen，使其在手机模拟器容器内“相对固定”，
          而不会飞到屏幕最右侧（解决 desktop 预览时的位置问题）。
      */}
      <div 
        onClick={() => onNavigate(AppView.AGENT)}
        className="absolute bottom-[20%] right-5 z-[100] transition-all active:scale-90"
      >
        <div className="relative cursor-pointer group">
          {/* AI 引导气泡 */}
          <div className="absolute -top-14 right-0 bg-white shadow-2xl border border-blue-100 px-4 py-2.5 rounded-2xl rounded-br-none whitespace-nowrap animate-bounce">
             <span className="text-[10px] font-black text-blue-600">点击进入助学空间</span>
             <div className="absolute -bottom-1.5 right-0 w-3 h-3 bg-white border-r border-b border-blue-100 rotate-45"></div>
          </div>

          {/* 机器人核心视觉 */}
          <div className="w-16 h-16 relative flex items-center justify-center">
             <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-2xl animate-pulse"></div>
             <img 
               src="https://img.icons8.com/plasticine/200/robot-3.png" 
               alt="Lumi AI" 
               className="w-full h-full object-contain drop-shadow-2xl group-hover:scale-110 transition-transform"
             />
             {/* 在线状态呼吸灯 */}
             <div className="absolute -right-1 top-0 bg-[#34D399] p-1.5 rounded-full shadow-lg border-2 border-white ring-4 ring-emerald-50 animate-pulse">
                <Bot size={10} className="text-white" />
             </div>
          </div>
        </div>
      </div>

      {/* 课程选择抽屉逻辑 */}
      {showPicker && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowPicker(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-[120] shadow-2xl animate-in slide-in-from-bottom duration-400">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800">课程选择</h3>
              <button onClick={() => setShowPicker(false)} className="p-2 bg-slate-100 rounded-full text-slate-400"><X size={18} /></button>
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between px-5 py-4 rounded-2xl border-2 border-blue-500 bg-blue-50 text-blue-700">
                  <span className="text-sm font-bold">高等数学</span>
                  <Check size={18} />
                </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Analysis;
