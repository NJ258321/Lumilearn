import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, RefreshCw, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Routes, Route } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";


const PlannerPage = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: '回顾：指令周期逻辑', time: '30min', stage: '重点突破', priority: 'High', done: false },
    { id: 2, title: '专项演练：寄存器寻址', time: '45min', stage: '重点突破', priority: 'High', done: false },
    { id: 3, title: '补充看视频：堆栈寻址', time: '15min', stage: '基础夯实', priority: 'Med', done: false },
  ]);

  const [isRescheduling, setIsRescheduling] = useState(false);

  const handleReschedule = () => {
    setIsRescheduling(true);
    setTimeout(() => {
      // 模拟重排逻辑：将未完成的任务重新分配
      setIsRescheduling(false);
      alert("AI 已根据剩余时间重排任务：合并了低权重内容，确保核心考点时间。");
    }, 1500);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {/* 备考头部看板 (1.1.5.1) */}
      <div className="bg-slate-900 text-white p-8 rounded-b-[40px] shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight">计算机组成原理</h2>
            <p className="text-slate-400 text-xs mt-1">目标考试：2026-06-20 期末统考</p>
          </div>
          <div className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-bold">第二轮·强化</div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] text-slate-400 uppercase font-bold">距离考试</p>
            <p className="text-2xl font-black">146<span className="text-xs ml-1 font-normal text-slate-500">Days</span></p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <p className="text-[10px] text-slate-400 uppercase font-bold">今日完成度</p>
            <p className="text-2xl font-black text-blue-400">33<span className="text-xs ml-1 font-normal text-slate-500">%</span></p>
          </div>
        </div>
      </div>

      {/* 动态任务列表 (1.1.5.2) */}
      <div className="flex-1 px-6 mt-4 overflow-y-auto pb-28">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="font-bold text-slate-800">今日任务清单</h2>
          <button 
            onClick={handleReschedule}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
          >
            <RefreshCw size={14} className={isRescheduling ? "animate-spin" : ""} />
            智能重排
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white p-5 rounded-3xl shadow-sm border ${task.priority === 'High' ? 'border-l-4 border-l-rose-500' : 'border-slate-100'} flex items-center gap-4`}
              >
                <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                  {task.done ? <CheckCircle2 className="text-emerald-500" /> : <Clock size={20} />}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-800">{task.title}</h3>
                  <div className="flex gap-3 mt-1 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {task.stage}</span>
                    <span className="text-blue-500">{task.time}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300" />
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* 进度落后预警 (1.1.5.2) */}
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-3xl mt-4 flex items-start gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={18} />
            <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
              检测到本周“指令系统”章节进度滞后 15%，建议点击上方“智能重排”合并非重点任务。
            </p>
          </div>
        </div>
      </div>

      {/* 底部 Tab 模拟 */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 px-8 flex justify-between items-center text-slate-300">
        <div className="text-blue-600 flex flex-col items-center gap-1"><Calendar size={22} /><span className="text-[10px] font-bold">计划</span></div>
        <div className="flex flex-col items-center gap-1"><RefreshCw size={22} /><span className="text-[10px] font-medium">助学</span></div>
        <div className="w-12 h-12 bg-slate-900 rounded-2xl -mt-10 shadow-xl shadow-slate-200 flex items-center justify-center text-white"><span className="text-2xl">+</span></div>
        <div className="flex flex-col items-center gap-1"><CheckCircle2 size={22} /><span className="text-[10px] font-medium">演练</span></div>
        <div className="flex flex-col items-center gap-1"><AlertCircle size={22} /><span className="text-[10px] font-medium">我</span></div>
      </div>
    </div>
    
  );
};

export default PlannerPage;