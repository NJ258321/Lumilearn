import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, Play, CheckCircle2, Zap, Flame, X, AlertTriangle, Moon, Loader2, RefreshCw, ChevronRight, Trash2, BookOpen, Target, TrendingUp, Brain, User, Settings, LogOut, Bell, Calendar, Plus, Video } from 'lucide-react';
import { MOCK_TASK_GROUPS } from '../constants';
import { AppView, Task, TaskGroup } from '../types';
import { generateDailyPlan } from '../services/geminiService';
import { getStudyRecordList, deleteStudyRecord, searchStudyRecords } from '../src/api/studyRecords';
import { getRecentlyReviewed } from '../src/api/knowledgePoints';
import { getDashboard } from '../src/api/statistics';
import { getTodayReview } from '../src/api/review';
import { getDailyRecommendation } from '../src/api/recommendations';
import { getTodayReminders } from '../src/api/reminders';
import { getUser, isLoggedIn, clearToken, setUser as setUserInfo } from '../src/api/auth';
import { clearAuthCache, onNetworkStatusChange } from '../src/utils/storage';
import type { StudyRecord, KnowledgePoint, Dashboard, TodayReview, UserType, DailyRecommendation, TodayRemindersResponse } from '../types';

interface DashboardProps {
  onNavigate: (view: AppView, data?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>(MOCK_TASK_GROUPS);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  // Study Records State
  const [studyRecords, setStudyRecords] = useState<StudyRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [showRecords, setShowRecords] = useState(false);
  const [filterCourseId, setFilterCourseId] = useState<string>('');
  const [searchKeyword, setSearchKeyword] = useState('');

  // Recently Reviewed Knowledge Points State - Task 2.3.3
  const [recentKps, setRecentKps] = useState<KnowledgePoint[]>([]);
  const [recentKpsLoading, setRecentKpsLoading] = useState(false);

  // P4 Dashboard Statistics State
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [todayReview, setTodayReview] = useState<TodayReview | null>(null);
  const [todayReviewLoading, setTodayReviewLoading] = useState(false);

  // P5 - User Auth State
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLogged, setIsLogged] = useState(false);

  // P5 - Recommendations & Reminders State
  const [dailyRecommendation, setDailyRecommendation] = useState<DailyRecommendation | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [todayReminders, setTodayReminders] = useState<TodayRemindersResponse | null>(null);
  const [remindersLoading, setRemindersLoading] = useState(false);

  // Fetch Study Records
  const fetchStudyRecords = useCallback(async () => {
    setRecordsLoading(true);
    setRecordsError(null);
    try {
      const params: Record<string, string> = { pageSize: '10' };
      if (filterCourseId) params.courseId = filterCourseId;
      if (searchKeyword) params.keyword = searchKeyword;

      const response = await getStudyRecordList(params);
      if (response.success && response.data) {
        setStudyRecords(response.data || []);
      } else {
        setRecordsError(response.error || '加载学习记录失败');
      }
    } catch (err) {
      setRecordsError('网络错误，请检查连接');
    } finally {
      setRecordsLoading(false);
    }
  }, [filterCourseId, searchKeyword]);

  // Fetch Recently Reviewed Knowledge Points - Task 2.3.3
  const fetchRecentKps = useCallback(async () => {
    setRecentKpsLoading(true);
    try {
      const response = await getRecentlyReviewed({ pageSize: 5 });
      if (response.success && response.data) {
        setRecentKps(response.data);
      }
    } catch (err) {
      console.error('获取最近复习知识点失败', err);
    } finally {
      setRecentKpsLoading(false);
    }
  }, []);

  // Fetch Dashboard Statistics - P4
  const fetchDashboardStats = useCallback(async () => {
    setDashboardLoading(true);
    try {
      const response = await getDashboard();
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      console.error('获取仪表盘数据失败', err);
    } finally {
      setDashboardLoading(false);
    }
  }, []);

  // Fetch Today's Review - P4
  const fetchTodayReview = useCallback(async () => {
    setTodayReviewLoading(true);
    try {
      const response = await getTodayReview();
      if (response.success && response.data) {
        setTodayReview(response.data);
      }
    } catch (err) {
      console.error('获取今日复习任务失败', err);
    } finally {
      setTodayReviewLoading(false);
    }
  }, []);

  // P5 - Initialize user state
  useEffect(() => {
    const user = getUser();
    const loggedIn = isLoggedIn();
    setCurrentUser(user);
    setIsLogged(loggedIn);
  }, []);

  // P5 - Fetch Daily Recommendations
  const fetchDailyRecommendations = useCallback(async () => {
    if (!isLogged) return;
    setRecommendationsLoading(true);
    try {
      const response = await getDailyRecommendation();
      if (response.success && response.data) {
        setDailyRecommendation(response.data);
      }
    } catch (err) {
      console.error('获取每日推荐失败', err);
    } finally {
      setRecommendationsLoading(false);
    }
  }, [isLogged]);

  // P5 - Fetch Today's Reminders
  const fetchTodayReminders = useCallback(async () => {
    if (!isLogged) return;
    setRemindersLoading(true);
    try {
      const response = await getTodayReminders();
      if (response.success && response.data) {
        setTodayReminders(response.data);
      }
    } catch (err) {
      console.error('获取今日提醒失败', err);
    } finally {
      setRemindersLoading(false);
    }
  }, [isLogged]);

  // Handle logout - 增强清除缓存
  const handleLogout = () => {
    clearToken();
    clearAuthCache(); // 清除所有认证相关缓存
    setCurrentUser(null);
    setIsLogged(false);
    setDailyRecommendation(null);
    setTodayReminders(null);
    // 刷新页面确保状态完全重置
    window.location.reload();
  };

  // 网络状态监听
  useEffect(() => {
    const cleanup = onNetworkStatusChange((online) => {
      if (!online) {
        console.warn('[Network] Connection lost')
      } else {
        console.log('[Network] Connection restored')
      }
    })
    return cleanup
  }, [])

  // Initial fetch
  useEffect(() => {
    if (showRecords) {
      fetchStudyRecords();
    }
    // Fetch recently reviewed knowledge points on mount - Task 2.3.3
    fetchRecentKps();
    // Fetch dashboard statistics - P4
    fetchDashboardStats();
    // Fetch today's review - P4
    fetchTodayReview();
    // Fetch P5 data if logged in
    if (isLogged) {
      fetchDailyRecommendations();
      fetchTodayReminders();
    }
  }, [showRecords, fetchStudyRecords, fetchRecentKps, fetchDashboardStats, fetchTodayReview, isLogged, fetchDailyRecommendations, fetchTodayReminders]);

  // Delete Record
  const handleDeleteRecord = async (id: string) => {
    setRecordsLoading(true);
    try {
      const response = await deleteStudyRecord(id);
      if (response.success) {
        fetchStudyRecords();
      } else {
        setRecordsError(response.error || '删除失败');
      }
    } catch (err) {
      setRecordsError('删除失败');
    } finally {
      setRecordsLoading(false);
    }
  };

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Format study time to hours and minutes - P4
  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
  };

  // Get progress percentage
  const getProgressPercentage = () => {
    if (!dashboardData?.knowledgePoints) return 0;
    const { total, mastered } = dashboardData.knowledgePoints;
    if (total === 0) return 0;
    return Math.round((mastered / total) * 100);
  };

  // Format date
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

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
            {/* 备考日历入口 - FE-09 */}
            <button
              onClick={() => onNavigate(AppView.EXAM_CALENDAR)}
              className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl px-4 py-2 shadow-lg flex items-center space-x-2 active:scale-95 transition-transform"
              title="备考日历"
            >
              <Calendar size={14} className="text-white" />
              <span className="text-xs font-bold text-white">备考日历</span>
            </button>

            {/* P4 Statistics Cards */}
            {!dashboardLoading && dashboardData && (
              <div className="flex space-x-2">
                {/* Courses Count */}
                <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl px-3 py-2 shadow-lg flex items-center space-x-1.5">
                  <BookOpen size={14} className="text-blue-500" />
                  <span className="text-xs font-bold text-slate-600">{dashboardData.coursesCount}</span>
                  <span className="text-[10px] text-slate-400">课程</span>
                </div>
                {/* Knowledge Points Progress */}
                <div className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-2xl px-3 py-2 shadow-lg flex items-center space-x-1.5">
                  <Brain size={14} className="text-purple-500" />
                  <span className="text-xs font-bold text-slate-600">
                    {dashboardData.knowledgePoints.mastered}/{dashboardData.knowledgePoints.total}
                  </span>
                  <span className="text-[10px] text-slate-400">掌握</span>
                </div>
              </div>
            )}

            {/* Today's Review Count - P4 */}
            {!todayReviewLoading && todayReview && todayReview.totalItems > 0 && (
              <div className="bg-white/90 backdrop-blur-md border border-amber-200 rounded-2xl px-3 py-2 shadow-lg flex items-center space-x-1.5">
                <Target size={14} className="text-amber-500" />
                <span className="text-xs font-bold text-slate-600">{todayReview.totalItems}</span>
                <span className="text-[10px] text-slate-400">今日复习</span>
              </div>
            )}

            {/* P5 - Today's Reminders - Show when logged in */}
            {!remindersLoading && todayReminders && todayReminders.reminders && todayReminders.reminders.length > 0 && (
              <div className="bg-white/90 backdrop-blur-md border border-red-200 rounded-2xl px-3 py-2 shadow-lg flex items-center space-x-1.5">
                <Bell size={14} className="text-red-500" />
                <span className="text-xs font-bold text-slate-600">{todayReminders.statistics.total}</span>
                <span className="text-[10px] text-slate-400">提醒</span>
              </div>
            )}

            {/* P5 - User Auth Button */}
            {isLogged && currentUser ? (
              <div className="flex items-center space-x-1">
                {/* Settings Button */}
                <button
                  onClick={() => onNavigate(AppView.SETTINGS)}
                  className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-full p-2 shadow-lg active:scale-95 transition-transform"
                  title="设置"
                >
                  <Settings size={14} className="text-slate-500" />
                </button>
                {/* User Avatar */}
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs font-bold">
                    {currentUser.displayName?.charAt(0) || currentUser.username?.charAt(0) || 'U'}
                  </span>
                </div>
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="bg-white/90 backdrop-blur-md border border-slate-100 rounded-full p-2 shadow-lg active:scale-95 transition-transform"
                  title="退出登录"
                >
                  <LogOut size={14} className="text-slate-500" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate(AppView.AUTH)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl px-4 py-2 shadow-lg flex items-center space-x-1.5 active:scale-95 transition-transform"
              >
                <User size={14} className="text-white" />
                <span className="text-xs font-bold text-white">登录</span>
              </button>
            )}

            {/* Recent Study Records Button */}
            <button
                onClick={() => setShowRecords(!showRecords)}
                className={`bg-white/90 backdrop-blur-md border rounded-2xl px-4 py-2 shadow-lg flex items-center space-x-2 active:scale-95 transition-transform ${
                    showRecords ? 'border-blue-300' : 'border-slate-100'
                }`}
            >
                <Clock size={14} className={showRecords ? 'text-blue-600' : 'text-slate-500'} />
                <span className="text-xs font-bold text-slate-600">学习记录</span>
                {studyRecords.length > 0 && (
                    <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        {studyRecords.length}
                    </span>
                )}
            </button>

            {/* Enlarged Countdown Panel */}
            <div className="bg-white/90 backdrop-blur-md border border-red-100 rounded-2xl px-4 py-3 shadow-lg flex items-center space-x-4 w-[170px] relative overflow-hidden active:scale-95 transition-transform cursor-pointer">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
              <div className="flex-1">
                <div className="text-xs text-slate-500 font-bold mb-0.5">数据结构期末</div>
                <div className="text-2xl font-black text-slate-800 flex items-baseline leading-none">
                  3 <span className="text-xs font-bold text-red-500 ml-1">天!</span>
                </div>
              </div>
              <Flame size={24} className="text-red-500 animate-pulse" fill="#EF4444" fillOpacity={0.2} />
            </div>
            
            <div className="bg-white/60 backdrop-blur-sm border border-slate-100 rounded-xl px-3 py-2 flex items-center justify-between w-[140px] shadow-sm">
               <div className="text-[10px] font-bold text-slate-500">摄影测量</div>
               <div className="text-sm font-black text-purple-600">6 <span className="text-[9px] font-normal text-slate-400">天</span></div>
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

          {/* --- P4 统计概览卡片 --- */}
          {!dashboardLoading && dashboardData && (
            <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <TrendingUp size={14} className="text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">本周学习概览</h3>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {/* Study Time */}
                <div className="bg-white/80 rounded-xl p-3 border border-blue-100/50 text-center">
                  <p className="text-lg font-bold text-blue-600">
                    {formatStudyTime(dashboardData.weeklyStats?.studyTime || 0)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">学习时长</p>
                </div>
                {/* Study Days */}
                <div className="bg-white/80 rounded-xl p-3 border border-blue-100/50 text-center">
                  <p className="text-lg font-bold text-green-600">
                    {dashboardData.weeklyStats?.studyDays || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">学习天数</p>
                </div>
                {/* Mistakes */}
                <div className="bg-white/80 rounded-xl p-3 border border-blue-100/50 text-center">
                  <p className="text-lg font-bold text-red-500">
                    {dashboardData.weeklyStats?.mistakes || 0}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">本周错题</p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                  <span>知识点掌握进度</span>
                  <span>{getProgressPercentage()}%</span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                    style={{ width: `${getProgressPercentage()}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* --- 复习建议卡片 - Task 2.3.3 --- */}
          {recentKps.length > 0 && (
            <div className="mb-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 p-1.5 rounded-lg">
                    <Zap size={14} className="text-amber-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">复习建议</h3>
                </div>
                <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-medium">
                  最近复习
                </span>
              </div>
              <div className="space-y-2">
                {recentKps.slice(0, 3).map((kp) => (
                  <div
                    key={kp.id}
                    className="flex items-center justify-between bg-white/80 rounded-xl p-2.5 border border-amber-100/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{kp.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        掌握度: {kp.masteryScore || 0}%
                      </p>
                    </div>
                    <div className={`text-[10px] px-2 py-1 rounded-lg font-medium ${
                      kp.status === 'WEAK' ? 'bg-red-100 text-red-600' :
                      kp.status === 'NEED_REVIEW' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {kp.status === 'WEAK' ? '薄弱' :
                       kp.status === 'NEED_REVIEW' ? '待复习' :
                       kp.status === 'MASTERED' ? '已掌握' : '学习中'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

      {/* Study Records Bottom Sheet */}
      {showRecords && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowRecords(false)}></div>
            <div className="bg-white w-full max-w-md rounded-t-[32px] p-5 z-[100] shadow-2xl animate-in slide-in-from-bottom h-[70vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-black text-slate-800">学习记录</h3>
                    <button onClick={() => setShowRecords(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                        <X size={20} />
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="flex space-x-2 mb-4">
                    <input
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        placeholder="搜索记录..."
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={fetchStudyRecords}
                        disabled={recordsLoading}
                        className="p-2 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 disabled:opacity-50"
                    >
                        {recordsLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                    </button>
                </div>

                {/* Error Message */}
                {recordsError && (
                    <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm mb-3">
                        {recordsError}
                    </div>
                )}

                {/* Records List */}
                <div className="flex-1 overflow-y-auto space-y-3">
                    {recordsLoading && studyRecords.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="animate-spin text-blue-600" size={24} />
                        </div>
                    ) : studyRecords.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Clock size={28} className="opacity-50" />
                            </div>
                            <p className="text-sm font-medium text-slate-600 mb-1">还没有学习记录</p>
                            <p className="text-xs text-slate-400 mb-4">开始录制你的第一节课吧</p>
                            <div className="flex flex-col gap-2 items-center">
                                <button
                                    onClick={() => onNavigate(AppView.RECORDER)}
                                    className="flex items-center space-x-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 active:scale-95 transition-all"
                                >
                                    <Video size={16} />
                                    <span>开始采集</span>
                                </button>
                                <button
                                    onClick={() => onNavigate(AppView.COURSES)}
                                    className="flex items-center space-x-1 text-blue-500 text-sm hover:text-blue-600"
                                >
                                    <span>或添加课程</span>
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        studyRecords.map((record) => (
                            <div
                                key={record.id}
                                className="bg-slate-50 rounded-xl p-4 border border-slate-100 hover:border-blue-200 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-700 truncate">{record.title}</h4>
                                        <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
                                            <Clock size={12} />
                                            <span>{formatDate(record.recordedAt)}</span>
                                            <span>·</span>
                                            <span>{formatDuration(record.duration)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteRecord(record.id)}
                                        className="p-1.5 text-slate-300 hover:text-red-500"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                                {record.notes && (
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-2">{record.notes}</p>
                                )}
                                <button
                                    onClick={() => {
                                        setShowRecords(false);
                                        onNavigate(AppView.TIME_MACHINE, record);
                                    }}
                                    className="mt-3 w-full py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center justify-center"
                                >
                                    <Play size={12} className="mr-1" />
                                    进入时光机
                                    <ChevronRight size={14} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;