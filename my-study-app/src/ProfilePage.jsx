import React from 'react';
import { motion } from 'framer-motion';
import { 
  User, Settings, ChevronRight, FileText, AlertOctagon, 
  Play, Crown, Clock, LogOut, Shield,
  Calendar, RefreshCw, CheckCircle2, AlertCircle // 底部导航图标
} from 'lucide-react';

const ProfilePage = () => {
  // 模拟用户数据
  const userData = {
    name: "陆小野",
    level: "Lv.4 核心极客",
    studyHours: 128,
    streak: 15
  };

  const menuItems = [
    { icon: <Shield size={20} />, label: '账号与安全', color: 'text-slate-500' },
    { icon: <Settings size={20} />, label: '通用设置', color: 'text-slate-500' },
    { icon: <LogOut size={20} />, label: '退出登录', color: 'text-rose-500' },
  ];

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] font-sans text-slate-900">
      
      {/* 1. 个人中心头部 (保持 PlannerPage 风格) */}
      <div className="bg-slate-900 text-white p-8 pb-10 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 p-0.5 shadow-lg">
            <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-900">
              <User size={28} className="text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">{userData.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Crown size={14} className="text-amber-400" fill="currentColor" />
              <span className="text-xs font-bold text-slate-300">{userData.level}</span>
            </div>
          </div>
          <button className="ml-auto bg-white/10 p-2 rounded-full backdrop-blur-md active:scale-95 transition-transform">
            <Settings size={20} className="text-slate-300" />
          </button>
        </div>

        {/* 数据概览 */}
        <div className="flex gap-4 relative z-10">
          <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Clock size={10} /> 累计专注
            </p>
            <p className="text-2xl font-black mt-1">{userData.studyHours}<span className="text-xs ml-1 font-normal text-slate-500">h</span></p>
          </div>
          <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
            <p className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Crown size={10} /> 连续打卡
            </p>
            <p className="text-2xl font-black mt-1 text-blue-400">{userData.streak}<span className="text-xs ml-1 font-normal text-slate-500">Days</span></p>
          </div>
        </div>
      </div>

      {/* 2. 核心功能入口区 */}
      <div className="flex-1 px-6 -mt-6 overflow-y-auto pb-24 z-10">
        
        {/* 沉浸式复习入口 (高亮卡片) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-3xl p-6 shadow-lg shadow-blue-500/30 text-white mb-4 relative overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
        >
          <div className="absolute right-[-20px] bottom-[-20px] opacity-20 rotate-12">
            <Play size={100} fill="currentColor" />
          </div>
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-black italic">沉浸式复习</h3>
                <p className="text-xs text-blue-100 mt-1 opacity-90">回到 14:00 的课堂现场</p>
              </div>
              <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                <ChevronRight size={20} />
              </div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-[10px] font-bold bg-black/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
              <span>上次进度: 指令寻址</span>
              <div className="w-1 h-1 bg-white rounded-full"></div>
              <span className="text-green-300">Continue</span>
            </div>
          </div>
        </motion.div>

        {/* 资源双排卡片 (错题 & 文档) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 active:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-3">
              <AlertOctagon size={20} />
            </div>
            <h4 className="font-bold text-slate-800">错题回溯</h4>
            <p className="text-[10px] text-slate-400 mt-1">待消灭 <span className="text-rose-500 font-bold">12</span> 个盲点</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 active:bg-slate-50 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
              <FileText size={20} />
            </div>
            <h4 className="font-bold text-slate-800">考点文档</h4>
            <p className="text-[10px] text-slate-400 mt-1">已生成 <span className="text-blue-600 font-bold">8</span> 份笔记</p>
          </motion.div>
        </div>

        {/* 常规设置列表 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden"
        >
          {menuItems.map((item, index) => (
            <div key={index} className="flex items-center p-5 border-b border-slate-50 last:border-0 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer">
              <div className={`mr-4 ${item.color}`}>
                {item.icon}
              </div>
              <span className="text-sm font-bold text-slate-700 flex-1">{item.label}</span>
              <ChevronRight size={16} className="text-slate-300" />
            </div>
          ))}
        </motion.div>
      </div>

      {/* 底部 Tab (完全复用 PlannerPage 的代码以保持一致) */}
      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 px-8 flex justify-between items-center text-slate-300 z-50">
        <div className="flex flex-col items-center gap-1"><Calendar size={22} /><span className="text-[10px] font-medium">计划</span></div>
        <div className="flex flex-col items-center gap-1"><RefreshCw size={22} /><span className="text-[10px] font-medium">知识谱</span></div>
        <div className="w-12 h-12 bg-slate-900 rounded-2xl -mt-10 shadow-xl shadow-slate-200 flex items-center justify-center text-white"><span className="text-2xl">+</span></div>
        <div className="flex flex-col items-center gap-1"><CheckCircle2 size={22} /><span className="text-[10px] font-medium">演练</span></div>
        {/* 当前页面高亮 */}
        <div className="text-blue-600 flex flex-col items-center gap-1"><AlertCircle size={22} /><span className="text-[10px] font-bold">我</span></div>
      </div>
    </div>
  );
};

export default ProfilePage;