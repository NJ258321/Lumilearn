import React, { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle2, Zap, Flame, X, AlertTriangle, Moon, Loader2 } from 'lucide-react';
import { MOCK_TASK_GROUPS } from '../constants';
import { AppView, Task, TaskGroup } from '../types';
import { generateDailyPlan } from '../services/geminiService';
import { examTasksApi, coursesApi, type ExamTask, type Course } from '../services/api';

interface DashboardProps {
  onNavigate: (view: AppView, data?: any) => void;
}

// Helper to transform API data to TaskGroup format
const transformApiDataToTaskGroups = (tasks: ExamTask[], courses: Course[]): TaskGroup[] => {
  if (!tasks || tasks.length === 0) {
    return MOCK_TASK_GROUPS;
  }

  // Group tasks by course
  const taskMap = new Map<string, TaskGroup>();

  for (const task of tasks) {
    const course = courses.find(c => c.id === task.courseId);
    const courseName = course?.name || '未知课程';

    if (!taskMap.has(task.courseId)) {
      taskMap.set(task.courseId, {
        courseId: task.courseId,
        courseName,
        tag: task.round === 1 ? '一轮复习' : (task.round === 2 ? '二轮突破' : '三轮冲刺'),
        tagColor: task.round === 1 ? 'orange' : (task.round === 2 ? 'blue' : 'red'),
        progress: '0/0',
        tasks: []
      });
    }

    const group = taskMap.get(task.courseId)!;

    // Add task
    group.tasks.push({
      id: task.id,
      courseName,
      title: task.details ? JSON.parse(task.details).title || getTaskTitle(task) : getTaskTitle(task),
      duration: `${task.estimatedDuration}min`,
      status: task.status === 'COMPLETED' ? 'completed' : (task.status === 'IN_PROGRESS' ? 'in-progress' : 'pending'),
      type: getTaskType(task.type),
      tag: ''
    });
  }

  // Update progress
  for (const group of taskMap.values()) {
    const completed = group.tasks.filter(t => t.status === 'completed').length;
    group.progress = `${completed}/${group.tasks.length}`;
  }

  return Array.from(taskMap.values());
};

const getTaskTitle = (task: ExamTask): string => {
  switch (task.type) {
    case 'CHAPTER_REVIEW':
      return '章节复习';
    case 'MOCK_EXAM':
      return '模拟考试';
    case 'WEAK_POINT':
      return '薄弱点突破';
    default:
      return '学习任务';
  }
};

const getTaskType = (type: string): 'review' | 'quiz' | 'paper' | 'mistake' => {
  switch (type) {
    case 'MOCK_EXAM':
      return 'paper';
    case 'WEAK_POINT':
      return 'mistake';
    default:
      return 'review';
  }
};

// Helper to get countdown data from courses
const getCountdownData = (courses: Course[]) => {
  const now = new Date();
  const upcomingExams = courses
    .filter(c => c.examDate && new Date(c.examDate) > now)
    .map(c => ({
      name: c.name,
      days: Math.ceil((new Date(c.examDate!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  return upcomingExams;
};

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>(MOCK_TASK_GROUPS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdownData, setCountdownData] = useState<{ name: string; days: number }[]>([
    { name: '数据结构期末', days: 3 },
    { name: '摄影测量', days: 6 }
  ]);

  // Fetch data from API on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch today's tasks and courses in parallel
        const [tasksResponse, coursesResponse] = await Promise.all([
          examTasksApi.getToday(),
          coursesApi.getAll()
        ]);

        if (tasksResponse.success && tasksResponse.data) {
          const groups = transformApiDataToTaskGroups(
            tasksResponse.data,
            coursesResponse.success ? coursesResponse.data! : []
          );
          setTaskGroups(groups);
        }

        if (coursesResponse.success && coursesResponse.data) {
          const countdown = getCountdownData(coursesResponse.data);
          if (countdown.length > 0) {
            setCountdownData(countdown);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('加载数据失败，使用演示数据');
        // Keep using mock data on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      // Call AI to optimize plan
      await generateDailyPlan([]);
      // Fetch fresh data after optimization
      const response = await examTasksApi.getToday();
      if (response.success && response.data) {
        const coursesResponse = await coursesApi.getAll();
        const groups = transformApiDataToTaskGroups(
          response.data,
          coursesResponse.success ? coursesResponse.data! : []
        );
        setTaskGroups(groups);
      }
    } catch (err) {
      console.error('Failed to optimize:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleTaskClick = (task: Task) => {
      if (task.type === 'review' || task.type === 'paper') {
          if (task.courseName.includes('摄影测量')) {
             onNavigate(AppView.COURSE_DETAIL_REVIEW);
          } else {
             onNavigate(AppView.TIME_MACHINE);
          }
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
      if (courseName.includes('摄影测量')) return {
          color: 'purple',
          bg: 'bg-purple-50',
          border: 'border-purple-500',
          text: 'text-purple-600',
          gradient: 'from-purple-500 to-indigo-500',
          shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]'
      };
      if (courseName.includes('高等数学')) return {
          color: 'blue',
          bg: 'bg-blue-50',
          border: 'border-blue-500',
          text: 'text-blue-600',
          gradient: 'from-blue-500 to-blue-600',
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

  // Get today's date
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayName = dayNames[today.getDay()];

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
              {dateStr} <span className="text-sm font-normal text-slate-400 ml-2">{dayName}</span>
            </div>
            <div className="flex space-x-1.5 mt-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === today.getDay() ? 'w-6 bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'w-1.5 bg-slate-200'}`}></div>
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-2 items-end pt-1">
            {/* Countdown Panel - Dynamic from API */}
            {countdownData[0] && (
              <div className="bg-white/90 backdrop-blur-md border border-red-100 rounded-2xl px-4 py-3 shadow-lg flex items-center space-x-4 w-[170px] relative overflow-hidden active:scale-95 transition-transform cursor-pointer">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 font-bold mb-0.5">{countdownData[0].name}</div>
                  <div className="text-2xl font-black text-slate-800 flex items-baseline leading-none">
                    {countdownData[0].days} <span className="text-xs font-bold text-red-500 ml-1">天!</span>
                  </div>
                </div>
                <Flame size={24} className="text-red-500 animate-pulse" fill="#EF4444" fillOpacity={0.2} />
              </div>
            )}

            {countdownData[1] && (
              <div className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between w-[140px] shadow-sm">
                 <div className="text-[10px] font-bold text-slate-500">{countdownData[1].name}</div>
                 <div className="text-sm font-black text-purple-600">{countdownData[1].days} <span className="text-[9px] font-normal text-slate-400">天</span></div>
              </div>
            )}
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
            {isOptimizing ? (
              <Loader2 size={14} className="text-slate-400 animate-spin" />
            ) : (
              <Zap size={14} className="text-yellow-500" fill="#F59E0B" />
            )}
            <span className="text-xs font-bold text-slate-600">{isOptimizing ? '计算中...' : '智能重排'}</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="text-blue-500 animate-spin mr-2" />
            <span className="text-sm text-slate-500">加载中...</span>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mx-4 mb-4 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            {error}
          </div>
        )}

        <div className="relative px-4 min-h-[600px]">

          {/* --- The Visual Spine (Left) --- */}
          {/* Main vertical line */}
          <div className="absolute left-[64px] top-4 bottom-0 w-[2px] bg-slate-200"></div>

          {/* Gradient Overlay for Past (Simulated) */}
          <div className="absolute left-[64px] top-4 h-[250px] w-[2px] bg-gradient-to-b from-blue-400 via-blue-200 to-slate-200 z-10"></div>


          {/* --- Render Timeline Groups --- */}
          {!isLoading && timelineGroups.map((group, index) => {
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
