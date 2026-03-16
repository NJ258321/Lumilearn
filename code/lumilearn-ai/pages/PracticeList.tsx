
import React, { useState, useEffect, useCallback } from 'react';
import { AppView } from '../types';
import { AlertCircle, ChevronDown, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { getCourseList } from '../src/api/courses';
import { getKnowledgeMastery } from '../src/api/statistics';
import type { Course, KnowledgeMastery } from '../src/types/api';

interface PracticeListProps {
  onNavigate: (view: AppView, data?: any) => void;
}

const PracticeList: React.FC<PracticeListProps> = ({ onNavigate }) => {
  const [filter, setFilter] = useState<'all' | 'reviewing' | 'studying'>('all');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Courses and mastery data
  const [courses, setCourses] = useState<Course[]>([]);
  const [masteryData, setMasteryData] = useState<Map<string, KnowledgeMastery>>(new Map());

  // Fetch courses and mastery data
  const fetchCoursesData = useCallback(async () => {
    try {
      // Fetch courses
      const coursesRes = await getCourseList();
      if (coursesRes.success && coursesRes.data) {
        setCourses(coursesRes.data);
        // Fetch mastery for each course
        const masteryPromises = coursesRes.data.map(async (course) => {
          const masteryRes = await getKnowledgeMastery(course.id);
          return { courseId: course.id, mastery: masteryRes.data };
        });
        const masteryResults = await Promise.all(masteryPromises);
        const masteryMap = new Map<string, KnowledgeMastery>();
        masteryResults.forEach(result => {
          if (result.mastery) {
            masteryMap.set(result.courseId, result.mastery);
          }
        });
        setMasteryData(masteryMap);
      }
    } catch (err) {
      console.error('Fetch courses data error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCoursesData();
  }, [fetchCoursesData]);

  // 从API数据构建展示课程列表
  const displayCourses = courses.map(course => {
    const mastery = masteryData.get(course.id);
    const status = course.status === 'REVIEWING' ? 'reviewing' : (course.status === 'STUDYING' ? 'studying' : 'archived');
    return {
      id: course.id,
      name: course.name,
      status,
      mastery: mastery ? Math.round(mastery.masteryRate * 100) : 0,
      delta: 0,
      points: mastery ? mastery.weakPoints : 0,
      chartValue: mastery ? Math.round(mastery.masteryRate * 100) : 0,
    };
  }).filter(course => course.status !== 'archived');

  const filteredCourses = displayCourses.filter(course => {
    if (filter === 'all') return true;
    return course.status === filter;
  });

  const getFilterLabel = () => {
    switch (filter) {
      case 'reviewing': return '复习中';
      case 'studying': return '学习中';
      default: return '全部课程';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F7F9FC] overflow-y-auto pb-24 scrollbar-hide">
      {/* 页面标题区 */}
      <div className="pt-14 px-6 pb-4 flex items-end justify-between relative z-20">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">练习</h1>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest opacity-70">Practice & Mastery</p>
        </div>

        {/* 筛选下拉菜单 */}
        <div className="relative">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center space-x-2 bg-white border border-slate-200 shadow-sm px-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            <span className="text-xs font-bold text-slate-600">{getFilterLabel()}</span>
            <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <button 
                  onClick={() => { setFilter('all'); setIsMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors ${filter === 'all' ? 'bg-slate-50 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span>全部课程</span>
                  {filter === 'all' && <Check size={12} className="text-slate-800" />}
                </button>
                <button 
                  onClick={() => { setFilter('reviewing'); setIsMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors ${filter === 'reviewing' ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span>复习中</span>
                  {filter === 'reviewing' && <Check size={12} className="text-orange-600" />}
                </button>
                <button 
                  onClick={() => { setFilter('studying'); setIsMenuOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold flex items-center justify-between transition-colors ${filter === 'studying' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <span>学习中</span>
                  {filter === 'studying' && <Check size={12} className="text-blue-600" />}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="px-5 space-y-3 mt-4">
        {/* 课程列表 */}
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => {
            const CHART_DATA = [
              { name: 'progress', value: course.chartValue },
              { name: 'remaining', value: 100 - course.chartValue },
            ];

            return (
              <div key={course.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* 顶部信息：名称与状态 */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-base font-black text-slate-800 mb-0.5">{course.name}</h3>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-bold text-slate-400">掌握度</span>
                      <span className="text-xs font-black text-slate-700">{course.mastery}%</span>
                      <span className="text-[9px] font-bold text-emerald-500 flex items-center">
                        <span className="mr-0.5 text-[7px]">▲</span>+{course.delta}
                      </span>
                    </div>
                  </div>

                  {/* 状态标签 */}
                  <div className={`px-2 py-0.5 rounded-md text-[9px] font-black flex items-center space-x-1 ${
                    course.status === 'reviewing' 
                      ? 'bg-orange-50 text-orange-600' 
                      : 'bg-blue-50 text-blue-600'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      course.status === 'reviewing' ? 'bg-orange-500' : 'bg-blue-500'
                    }`}></div>
                    <span>{course.status === 'reviewing' ? '复习中' : '学习中'}</span>
                  </div>
                </div>

                {/* 中间区域：考点提示与图表 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5 text-orange-500/90">
                    <AlertCircle size={12} fill="currentColor" className="text-white" />
                    <span className="text-[11px] font-bold tracking-tight">有 {course.points} 个重要考点</span>
                  </div>

                  {/* 缩小的环形进度图 */}
                  <div className="relative w-16 h-12 -mr-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={CHART_DATA}
                          cx="50%"
                          cy="100%"
                          startAngle={180}
                          endAngle={0}
                          innerRadius={20}
                          outerRadius={28}
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
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
                      <span className="text-[11px] font-black text-slate-700 leading-none">{course.mastery}</span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮：高度稍微收紧 */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => onNavigate(course.status === 'reviewing' ? AppView.COURSE_DETAIL_REVIEW : AppView.COURSE_DETAIL_STUDY, course.id)}
                    className="py-1.5 bg-blue-600 text-white rounded-xl text-[11px] font-bold shadow-md shadow-blue-100 active:scale-95 transition-transform"
                  >
                    进入课程
                  </button>
                  <button
                    onClick={() => onNavigate(AppView.DRILL, { courseId: course.id })}
                    className="py-1.5 bg-white text-blue-600 border border-blue-100 rounded-xl text-[11px] font-bold active:bg-slate-50 transition-colors"
                  >
                    巩固练习
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                <AlertCircle size={20} />
             </div>
             <p className="text-xs font-bold">没有找到相关课程</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticeList;
