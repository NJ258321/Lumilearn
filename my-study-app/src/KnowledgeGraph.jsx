import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Search, Filter, AlertCircle, CheckCircle2 } from 'lucide-react';

const KnowledgeGraph = ({ onBack }) => {
  // 模拟知识点数据 (对应 1.1.4.1 考点建模)
  const nodes = [
    { id: 1, name: '指令周期', size: 100, status: 'mastered', x: 50, y: 150 },
    { id: 2, name: '立即寻址', size: 80, status: 'warning', x: 180, y: 80 },
    { id: 3, name: '寄存器寻址', size: 120, status: 'danger', x: 220, y: 220 }, // 考点权重高且未掌握
    { id: 4, name: '堆栈寻址', size: 60, status: 'normal', x: 300, y: 130 },
    { id: 5, name: '程序计数器', size: 90, status: 'mastered', x: 80, y: 280 },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'mastered': return 'bg-emerald-500 shadow-emerald-500/40';
      case 'warning': return 'bg-amber-400 shadow-amber-400/40';
      case 'danger': return 'bg-rose-500 shadow-rose-500/40 animate-pulse'; // 高风险节点动效
      default: return 'bg-slate-400 shadow-slate-400/40';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      {/* 顶部搜索与筛选 */}
      <div className="p-6 bg-white shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <button onClick={() => onBack && onBack()} className="p-2 bg-slate-100 rounded-full"><ChevronLeft size={20} /></button>
          <h1 className="text-lg font-bold italic tracking-tight text-slate-800 underline decoration-blue-500 decoration-4 underline-offset-4">知识图谱全景</h1>
          <button className="p-2 bg-slate-100 rounded-full"><Filter size={20} /></button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <input type="text" placeholder="搜索考点..." className="w-full bg-slate-100 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 ring-blue-500/20" />
        </div>
      </div>

      {/* 图谱画布区 (1.1.2.1) */}
      <div className="flex-1 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px]">
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1, x: node.x, y: node.y }}
            drag
            whileDrag={{ scale: 1.1 }}
            className={`absolute flex flex-col items-center justify-center rounded-full text-white font-bold p-2 text-center shadow-lg cursor-pointer ${getStatusColor(node.status)}`}
            style={{ width: node.size, height: node.size }}
          >
            <span className="text-[10px] leading-tight">{node.name}</span>
            {node.status === 'danger' && <AlertCircle size={14} className="mt-1" />}
            {node.status === 'mastered' && <CheckCircle2 size={14} className="mt-1" />}
          </motion.div>
        ))}

        {/* 底部浮动说明栏 (1.1.4.1) */}
        <div className="absolute bottom-6 left-6 right-6 bg-white/80 backdrop-blur-md rounded-2xl p-4 border border-white shadow-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">考点热力说明</span>
            <span className="text-[10px] text-blue-600 font-bold">查看详细报告 &gt;</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 text-[8px] font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> 高频且薄弱
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> 已稳固
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-400 italic">
              * 拖拽球体查看关联逻辑
            </div>
          </div>
        </div>
      </div>

      {/* 模块四：闭环总结快捷入口 */}
      <div className="px-6 py-4 bg-white border-t border-slate-100 flex gap-3">
        <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-slate-200 active:scale-95 transition-transform">
          生成考点文档
        </button>
        <button className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 active:scale-95 transition-transform text-center">
          开启针对性演练
        </button>
      </div>
    </div>
  );
};

export default KnowledgeGraph;