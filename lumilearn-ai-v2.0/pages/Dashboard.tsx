import React, { useState, useRef } from 'react';
import { Clock, Play, CheckCircle2, Zap, Flame, X, AlertTriangle, Moon } from 'lucide-react';
import { MOCK_TASK_GROUPS } from '../constants';
import { AppView, Task, TaskGroup } from '../types';
import { generateDailyPlan } from '../services/geminiService';

interface DashboardProps {
  onNavigate: (view: AppView, data?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>(MOCK_TASK_GROUPS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await generateDailyPlan([]); 
    // Simulate reorder: move the last item to first
    const newGroups = [...taskGroups];
    const last = newGroups.pop();
    if (last) newGroups.unshift(last);
    setTaskGroups(newGroups);
    setIsOptimizing(false);
  };

  const handleTaskClick = (task: Task) => {
      if (task.type === 'review' || task.type === 'paper') {
          onNavigate(AppView.TIME_MACHINE);
      } else if (task.type === 'quiz' || task.type === 'mistake') {
          onNavigate(AppView.DRILL);
      }
  };

  const getTheme = (courseName: string) => {
      if (courseName.includes('数据结构')) return {
          color: 'red',
          bg: 'bg-red-50',
          border: 'border-red-500', 
          text: 'text-red-600',
          gradient: 'from-red-500 to-orange-500',
          shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]'
      };
      if (courseName.includes('高等数学')) return {
          color: 'blue',
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-600',
          gradient: 'from-blue-500 to-blue-600',
          shadow: 'shadow-none'
      };
      if (courseName.includes('计算机网络')) return {
          color: 'emerald',
          bg: 'bg-emerald-50',
          border: 'border-emerald-500',
          text: 'text-emerald-600',
          gradient: 'from-emerald-400 to-teal-500',
          shadow: 'shadow-none'
      };
      return {
          color: 'slate',
          bg: 'bg-slate-50',
          border: 'border-slate-300',
          text: 'text-slate-600',
          gradient: 'from-slate-400 to-slate-500',
          shadow: 'shadow-none'
      };
  };

  // Enhance mock data with specific times for the timeline view
  const timelineGroups = taskGroups.map((group, idx) => {
      let time = '09:00';
      let period = 'Morning Sprint';
      if (idx === 1) { time = '14:00'; period = 'Deep Work'; }
      if (idx === 2) { time = '19:30'; period = 'Evening Review'; }
      
      return { ...group, time, period };
  });

  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9] font-sans overflow-hidden">
      
      {/* =======================
          1. Glass Header
          ======================= */}
      <div className="relative pt-10 pb-4 px-6 bg-gradient-to-br from-blue-50 via-white to-blue-50 z-20 border-b border-white/50">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="text-xs font-bold text-blue-500 tracking-widest mb-1 uppercase">Dashboard</div>
            <div className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-baseline leading-none">
              Jan 25 <span className="text-sm font-normal text-slate-400 ml-2">Sunday</span>
            </div>
            <div className="flex space-x-1.5 mt-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === 6 ? 'w-6 bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'w-1.5 bg-slate-200'}`}></div>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-2 items-end pt-1">
            <div className="bg-white/80 backdrop-blur-md border border-red-100 rounded-xl px-3 py-2 shadow-sm flex items-center space-x-3 w-[140px] relative overflow-hidden active:scale-95 transition-transform cursor-pointer">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
              <div className="flex-1">
                <div className="text-[10px] text-slate-500 font-medium">数据结构期末</div>
                <div className="text-lg font-black text-slate-800 flex items-baseline leading-none mt-0.5">
                  3 <span className="text-[10px] font-normal text-red-500 ml-1">天!</span>
                </div>
              </div>
              <Flame size={16} className="text-red-500 animate-pulse" />
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-lg px-3 py-1.5 flex items-center justify-between w-[120px]">
               <div className="text-[10px] text-slate-500">高数期末</div>
               <div className="text-sm font-bold text-blue-600">9 <span className="text-[9px] font-normal text-slate-400">天</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================
          2. Timeline Stream
          ======================= */}
      <div className="flex-1 overflow-y-auto relative z-10 pb-32 scrollbar-hide">
        
        {/* Sticky Action Bar */}
        <div className="flex justify-between items-center px-6 mb-4 sticky top-0 bg-[#F4F6F9]/95 backdrop-blur z-30 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
          <h2 className="text-lg font-bold text-slate-700">今日安排</h2>
          <button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex items-center space-x-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm active:scale-95 transition-transform"
          >
            <Zap size={14} className={isOptimizing ? "text-slate-400" : "text-yellow-500"} fill={isOptimizing ? "none" : "#F59E0B"} />
            <span className="text-xs font-bold text-slate-600">{isOptimizing ? '计算中...' : '智能重排'}</span>
          </button>
        </div>

        <div className="relative px-4 min-h-[600px]">
          
          {/* --- The Visual Spine (Left) --- */}
          {/* Main vertical line */}
          <div className="absolute left-[64px] top-4 bottom-0 w-[2px] bg-slate-200"></div>
          
          {/* Gradient Overlay for Past (Simulated) */}
          <div className="absolute left-[64px] top-4 h-[250px] w-[2px] bg-gradient-to-b from-blue-400 via-blue-200 to-slate-200 z-10"></div>


          {/* --- Render Timeline Groups --- */}
          {timelineGroups.map((group, index) => {
              const theme = getTheme(group.courseName);
              const isActiveGroup = index === 0;

              return (
                <div key={group.courseId} className={`relative mb-12 transition-all duration-500 animate-in slide-in-from-bottom-8 fade-in`} style={{ animationDelay: `${index * 100}ms` }}>
                    
                    {/* 1. Time Column (Left) */}
                    <div className="absolute left-0 top-0 w-[50px] text-right pr-2">
                        <span className={`block text-sm font-bold font-mono leading-none ${isActiveGroup ? 'text-slate-800' : 'text-slate-400'}`}>{group.time}</span>
                        <span className="block text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter opacity-80">{group.period}</span>
                    </div>

                    {/* 2. Axis Node (Center) */}
                    <div className="absolute left-[55px] top-0 z-20 flex items-center justify-center w-5 h-5">
                         {/* Connector line from node to right content */}
                         {/* Outer Ring */}
                        <div className={`w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${isActiveGroup ? theme.border : 'border-slate-300'}`}>
                             {/* Inner Dot */}
                             <div className={`w-1.5 h-1.5 rounded-full ${isActiveGroup ? theme.bg.replace('bg-', 'bg-').replace('-50', '-500') : 'bg-slate-300'}`}></div>
                        </div>
                        {/* Ping Effect for Active */}
                        {isActiveGroup && (
                            <span className={`absolute w-full h-full rounded-full animate-ping opacity-75 ${theme.bg.replace('bg-', 'bg-').replace('-50', '-400')}`}></span>
                        )}
                    </div>

                    {/* 3. Content Area (Right) */}
                    <div className="pl-[80px]">
                        {/* Course Header */}
                        <div className="flex items-center mb-3">
                            <h3 className={`text-base font-extrabold ${isActiveGroup ? 'text-slate-800' : 'text-slate-500'}`}>{group.courseName}</h3>
                            <span className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-md shadow-sm bg-gradient-to-r ${theme.gradient} text-white`}>
                                {group.tag}
                            </span>
                        </div>

                        {/* Task Cards */}
                        <div className="space-y-3">
                            {group.tasks.map((task) => {
                                const isCompleted = task.status === 'completed';
                                const isInProgress = task.status === 'in-progress';
                                
                                let cardStyle = "bg-white border-slate-100";
                                if (isInProgress) cardStyle = `bg-white border-l-4 ${theme.border} shadow-[0_8px_30px_rgba(0,0,0,0.06)] scale-[1.02]`;
                                else if (isCompleted) cardStyle = "bg-slate-50 border-slate-100 opacity-60 grayscale";
                                else cardStyle = "bg-white border-slate-100 shadow-sm opacity-90";

                                return (
                                    <div 
                                        key={task.id}
                                        onClick={() => handleTaskClick(task)}
                                        className={`relative rounded-xl p-3.5 border transition-all active:scale-[0.98] ${cardStyle}`}
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex items-center space-x-2">
                                                <span className={`${isCompleted ? 'bg-slate-200 text-slate-500' : theme.bg + ' ' + theme.text} text-[10px] font-bold px-1.5 py-0.5 rounded`}>
                                                    {task.type === 'paper' ? '全真模拟' : (task.type === 'mistake' ? '错题重刷' : '知识回顾')}
                                                </span>
                                            </div>
                                            {isInProgress && <Play size={12} className="text-blue-600" fill="#2563EB" />}
                                            {isCompleted && <CheckCircle2 size={16} className="text-emerald-500" />}
                                        </div>

                                        <h4 className={`text-sm font-bold leading-snug mb-2 ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                            {task.title}
                                        </h4>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-[10px] text-slate-400">
                                                <Clock size={10} className="mr-1" /> {task.duration}
                                            </div>
                                            {isInProgress && (
                                                <div className={`text-[10px] font-bold ${theme.text} animate-pulse`}>进行中...</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
              );
          })}

          {/* End Node */}
          <div className="relative h-16 opacity-50">
                <div className="absolute left-0 top-0 w-[50px] text-right pr-2">
                    <span className="block text-sm font-bold text-slate-400 font-mono">22:30</span>
                </div>
                <div className="absolute left-[64px] top-2 -translate-x-1/2 w-3 h-3 rounded-full bg-slate-300 border-2 border-slate-100 z-20"></div>
                <div className="pl-[80px] pt-0.5 flex items-center text-slate-400">
                    <Moon size={14} className="mr-2" />
                    <span className="text-xs font-bold">Bedtime</span>
                </div>
          </div>
          
        </div>
      </div>

      {/* =======================
          3. Float Warning
          ======================= */}
      {showWarning && (
        <div className="absolute bottom-[70px] left-4 right-4 bg-red-50 border border-red-100 rounded-full px-4 py-2.5 flex items-center justify-between shadow-[0_8px_20px_-5px_rgba(239,68,68,0.2)] z-30 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-2.5">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                    <AlertTriangle size={10} className="text-white" fill="white" />
                </div>
                <span className="text-xs text-slate-700 font-bold">进度滞后 15%，建议调整</span>
            </div>
            <button 
                onClick={() => setShowWarning(false)}
                className="text-slate-400 hover:text-slate-600 active:scale-90 p-1"
            >
                <X size={16} />
            </button>
        </div>
      )}

    </div>
  );
};

export default Dashboard;