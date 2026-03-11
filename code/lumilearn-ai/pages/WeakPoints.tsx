
import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, AlertCircle, Target, BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { AppView } from '../types';
import { getMistakeWeakPoints, MistakeWeakPoint } from '../src/api/knowledgePoints';
import { getCourseList } from '../src/api/courses';
import type { Course } from '../types';

interface WeakPointsProps {
  onNavigate: (view: AppView, data?: any) => void;
  currentCourseId?: string | null;
}

const WeakPoints: React.FC<WeakPointsProps> = ({ onNavigate, currentCourseId }) => {
  const [weakPoints, setWeakPoints] = useState<MistakeWeakPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(currentCourseId || '');
  const [selectedCourseName, setSelectedCourseName] = useState<string>('');

  // 获取课程列表
  const fetchCourses = useCallback(async () => {
    try {
      const response = await getCourseList();
      if (response.success && response.data) {
        setCourses(response.data);
        // 如果有当前课程ID，找到对应的课程名称
        if (currentCourseId) {
          const course = response.data.find(c => c.id === currentCourseId);
          if (course) {
            setSelectedCourseName(course.name);
          }
        }
      }
    } catch (err) {
      console.error('获取课程列表失败', err);
    }
  }, [currentCourseId]);

  // 获取薄弱点列表
  const fetchWeakPoints = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMistakeWeakPoints(selectedCourseId || undefined);
      if (response.success && response.data) {
        setWeakPoints(response.data);
      }
    } catch (err) {
      console.error('获取薄弱点失败', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(() => {
    fetchWeakPoints();
  }, [fetchWeakPoints]);

  // 处理课程筛选变化
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const course = courses.find(c => c.id === courseId);
    setSelectedCourseName(course?.name || '');
  };

  // 获取卡片样式
  const getCardStyles = (masteryScore: number, mistakeCount: number) => {
    if (mistakeCount >= 5 || masteryScore < 20) {
      return {
        iconBg: 'bg-red-500',
        shadow: 'shadow-red-500/30',
        tag: 'text-red-600 bg-red-50',
        btn: 'bg-red-500 hover:bg-red-600',
        border: 'border-red-200'
      };
    }
    if (mistakeCount >= 3 || masteryScore < 40) {
      return {
        iconBg: 'bg-orange-500',
        shadow: 'shadow-orange-500/30',
        tag: 'text-orange-600 bg-orange-50',
        btn: 'bg-orange-500 hover:bg-orange-600',
        border: 'border-orange-200'
      };
    }
    return {
      iconBg: 'bg-blue-500',
      shadow: 'shadow-blue-500/30',
      tag: 'text-blue-600 bg-blue-50',
      btn: 'bg-blue-500 hover:bg-blue-600',
      border: 'border-blue-200'
    };
  };

  // 获取掌握度颜色
  const getMasteryColor = (score: number) => {
    if (score < 20) return 'text-red-500';
    if (score < 40) return 'text-orange-500';
    if (score < 60) return 'text-yellow-500';
    return 'text-green-500';
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'WEAK':
        return { text: '薄弱', className: 'bg-red-100 text-red-600' };
      case 'NEED_REVIEW':
        return { text: '待复习', className: 'bg-yellow-100 text-yellow-600' };
      case 'MASTERED':
        return { text: '已掌握', className: 'bg-green-100 text-green-600' };
      default:
        return { text: '学习中', className: 'bg-blue-100 text-blue-600' };
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* 固定头部区域 */}
      <div className="flex-none z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="pt-[40px] pb-3 px-6 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => onNavigate(AppView.ANALYSIS)}
              className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-black text-[#1F2937] tracking-tight">薄弱点详情</h1>
          </div>
          <button
            onClick={fetchWeakPoints}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90"
          >
            {loading ? (
              <Loader2 size={20} className="text-blue-500 animate-spin" />
            ) : (
              <RefreshCw size={20} className="text-gray-400" />
            )}
          </button>
        </div>

        {/* 课程筛选 */}
        <div className="px-6 pb-3">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => handleCourseChange('')}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                selectedCourseId === ''
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              全部课程
            </button>
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => handleCourseChange(course.id)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  selectedCourseId === course.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {course.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {loading && weakPoints.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : weakPoints.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Target size={48} className="mb-4 opacity-30" />
            <p className="text-sm font-medium">暂无薄弱点数据</p>
            <p className="text-xs mt-1">完成更多练习来获取薄弱点分析</p>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-4">
            {/* 统计卡片 */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-red-100 p-1.5 rounded-lg">
                    <AlertCircle size={16} className="text-red-600" />
                  </div>
                  <span className="text-sm font-bold text-gray-800">当前薄弱点</span>
                </div>
                <span className="text-2xl font-black text-red-500">{weakPoints.length}</span>
              </div>
              {selectedCourseName && (
                <p className="text-xs text-gray-500 mt-2">
                  课程：{selectedCourseName}
                </p>
              )}
            </div>

            {/* 薄弱点列表 */}
            {weakPoints.map((wp, index) => {
              const styles = getCardStyles(wp.masteryScore, wp.mistakeCount);
              const statusTag = getStatusTag(wp.status);

              return (
                <div
                  key={wp.id}
                  className={`bg-white rounded-2xl p-4 border ${styles.border} shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${styles.iconBg} flex items-center justify-center shadow-lg ${styles.shadow}`}>
                        <AlertCircle size={20} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-800">{wp.name}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {wp.chapter.name}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-lg font-medium ${statusTag.className}`}>
                      {statusTag.text}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <BookOpen size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">错题: </span>
                        <span className="text-sm font-bold text-red-500">{wp.mistakeCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target size={12} className="text-gray-400" />
                        <span className="text-xs text-gray-500">掌握度: </span>
                        <span className={`text-sm font-bold ${getMasteryColor(wp.masteryScore)}`}>
                          {wp.masteryScore}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 掌握度进度条 */}
                  <div className="mb-3">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          wp.masteryScore < 20 ? 'bg-red-500' :
                          wp.masteryScore < 40 ? 'bg-orange-500' :
                          wp.masteryScore < 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${wp.masteryScore}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate(AppView.DRILL, { knowledgePointId: wp.id })}
                    className={`w-full py-2.5 ${styles.btn} text-white text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-1`}
                  >
                    立即强化
                    <ChevronRight size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeakPoints;
