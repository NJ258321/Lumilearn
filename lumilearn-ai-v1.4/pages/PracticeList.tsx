
import React from 'react';
import { AppView } from '../types';
import { User, ChevronRight, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PracticeListProps {
  onNavigate: (view: AppView, data?: any) => void;
}

const PracticeList: React.FC<PracticeListProps> = ({ onNavigate }) => {
  // 定义指定的三个课程及其展示数据
  const displayCourses = [
    {
      id: 'c1',
      name: '数据结构',
      status: 'reviewing',
      mastery: 72,
      delta: 16,
      points: 6,
      chartValue: 72,
    },
    {
      id: 'c4',
      name: '近代史纲要',
      status: 'studying',
      mastery: 58,
      delta: 5,
      points: 3,
      chartValue: 58,
    },
    {
      id: 'c5',
      name: '大学英语',
      status: 'reviewing',
      mastery: 85,
      delta: 12,
      points: 4,
      chartValue: 85,
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#F7F9FC] overflow-y-auto pb-24 scrollbar-hide">
      {/* 间距调整，由于移除了 Header，给顶部留一点空白 */}
      <div className="pt-8 px-5 space-y-4">
        {/* 课程列表 */}
        {displayCourses.map((course) => {
          const CHART_DATA = [
            { name: 'progress', value: course.chartValue },
            { name: 'remaining', value: 100 - course.chartValue },
          ];

          return (
            <div key={course.id} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-black text-[#1F2937] mb-1">{course.name}</h3>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-bold text-slate-500">掌握度</span>
                    <span className="text-sm font-black text-[#1F2937]">{course.mastery}%</span>
                    <span className="text-[10px] font-bold text-[#10B981] flex items-center">
                      <span className="mr-0.5">▲</span>+{course.delta}
                    </span>
                  </div>
                </div>

                {/* 状态标签 */}
                <div className={`px-2 py-0.5 rounded-md text-[10px] font-black flex items-center space-x-1 ${
                  course.status === 'reviewing' 
                    ? 'bg-orange-100 text-orange-600' 
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    course.status === 'reviewing' ? 'bg-orange-500' : 'bg-blue-500'
                  }`}></div>
                  <span>{course.status === 'reviewing' ? '复习中' : '学习中'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-5">
                {/* 提示行 */}
                <div className="flex items-center space-x-2 text-[#F59E0B]">
                  <AlertCircle size={14} fill="currentColor" className="text-white" />
                  <span className="text-xs font-bold">有 {course.points} 个重要考点</span>
                </div>

                {/* 环形进度图 (Mock) */}
                <div className="relative w-20 h-20 -mr-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={CHART_DATA}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={25}
                        outerRadius={35}
                        paddingAngle={0}
                        dataKey="value"
                        stroke="none"
                      >
                        {CHART_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? (course.status === 'reviewing' ? '#F97316' : '#3B82F6') : '#F1F5F9'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
                    <span className="text-sm font-black text-slate-800 leading-none">{course.mastery}</span>
                    <span className="text-[8px] font-bold text-emerald-500">+1</span>
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onNavigate(course.status === 'reviewing' ? AppView.COURSE_DETAIL_REVIEW : AppView.COURSE_DETAIL_STUDY, course.id)}
                  className="py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-100 active:scale-95 transition-transform"
                >
                  进入课程
                </button>
                <button 
                  onClick={() => onNavigate(AppView.DRILL)}
                  className="py-2 bg-white text-blue-600 border border-blue-100 rounded-xl text-xs font-bold active:bg-slate-50 transition-colors"
                >
                  巩固练习
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PracticeList;
