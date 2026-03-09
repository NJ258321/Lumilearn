import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { PlayCircle, AlertCircle } from 'lucide-react';
import { AppView } from '../types';

interface DrillProps {
  onNavigate: (view: AppView) => void;
}

const data = [
  { subject: '高数', A: 80, fullMark: 150 },
  { subject: '英语', A: 98, fullMark: 150 },
  { subject: '政治', A: 86, fullMark: 150 },
  { subject: '专业一', A: 65, fullMark: 150 },
  { subject: '专业二', A: 85, fullMark: 150 },
];

const Drill: React.FC<DrillProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 overflow-y-auto pb-32 scrollbar-hide bg-white">
      {/* Top Radar */}
      <div className="bg-[#F7F9FC] pt-10 pb-6 rounded-b-[40px]">
        <h2 className="text-center font-bold text-gray-800 mb-2">能力全景图</h2>
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6B7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar
                    name="My Score"
                    dataKey="A"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fill="#3B82F6"
                    fillOpacity={0.3}
                />
                </RadarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-2 gap-4 px-6 -mt-6">
        <div className="bg-white p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center border border-gray-100">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mb-2 text-yellow-600 text-xl font-bold">⚡</div>
            <div className="font-bold text-gray-800">智能组卷</div>
            <div className="text-xs text-gray-400 mt-1">专项突击</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center border border-gray-100">
             <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2 text-purple-600 text-xl font-bold">🏆</div>
            <div className="font-bold text-gray-800">模考大赛</div>
            <div className="text-xs text-gray-400 mt-1">全真模拟</div>
        </div>
      </div>

      {/* Mistake List */}
      <div className="px-6 mt-8">
        <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
            错题本 
            <span className="ml-2 text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">12 待解决</span>
        </h3>
        
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-start space-x-3 mb-3">
                    <AlertCircle className="text-red-500 mt-1 flex-shrink-0" size={16} />
                    <p className="text-sm text-gray-700 font-medium">若函数 f(x) 在 x0 处可导，则 |f(x)| 在 x0 处一定可导吗？</p>
                </div>
                <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                    <span className="text-xs text-gray-500">来源: 2021 真题</span>
                    <button 
                        onClick={() => onNavigate(AppView.TIME_MACHINE)}
                        className="flex items-center space-x-1 bg-blue-100 px-3 py-1.5 rounded-full text-blue-600 text-xs font-bold active:scale-95 transition-transform"
                    >
                        <PlayCircle size={14} />
                        <span>回溯听讲</span>
                    </button>
                </div>
            </div>
            
            {/* Transparent placeholder footer to ensure last item clears the nav bar fully if scrolled quickly */}
            <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
};

export default Drill;