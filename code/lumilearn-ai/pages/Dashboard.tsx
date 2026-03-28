import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Clock, Play, CheckCircle2, Zap, Flame, X, AlertTriangle, Moon, Loader2, RefreshCw, ChevronRight, Trash2, BookOpen, Target, TrendingUp, Brain, User, Settings, LogOut, Bell, Calendar, Plus, Video, ChevronDown } from 'lucide-react';
import { AppView, Task, TaskGroup } from '../types';
import { generateDailyPlan } from '../services/geminiService';
import { getStudyRecordList, deleteStudyRecord, searchStudyRecords } from '../src/api/studyRecords';
import { getRecentlyReviewed } from '../src/api/knowledgePoints';
import { getDashboard } from '../src/api/statistics';
import { getTodayReview, getDailyReviewOverview } from '../src/api/review';
import { getDailyRecommendation } from '../src/api/recommendations';
import { getTodayReminders } from '../src/api/reminders';
import { getCourseList } from '../src/api/courses';
import { optimizeReview } from '../src/api/reviewEnhance';
import { getUser, isLoggedIn, clearToken, setUser as setUserInfo } from '../src/api/auth';
import { clearAuthCache, onNetworkStatusChange } from '../src/utils/storage';
import type { StudyRecord, KnowledgePoint, Dashboard, TodayReview, UserType, DailyRecommendation, TodayRemindersResponse, Course } from '../types';
import { api } from '../src/api/request';

interface DashboardProps {
  onNavigate: (view: AppView, data?: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Backend Time State
  const [backendTime, setBackendTime] = useState<{ date: string; time: string; dayOfWeek: string } | null>(null);
  const [timeLoading, setTimeLoading] = useState(false);

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

  // 今日安排状态 - 复习建议板块重构
  const [dailyReviewCourses, setDailyReviewCourses] = useState<any[]>([]);
  const [dailyReviewLoading, setDailyReviewLoading] = useState(false);

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

  // 考试倒计时状态
  const [courses, setCourses] = useState<Course[]>([]);
  const [upcomingExam, setUpcomingExam] = useState<{ name: string; daysLeft: number; examDate: string } | null>(null);

  // 当前时间状态 - 用于Timeline动态显示
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // 学习任务汇总展开/折叠状态
  const [taskSummaryExpanded, setTaskSummaryExpanded] = useState(false);

  // 本周学习概览展开/折叠状态
  const [weeklyOverviewExpanded, setWeeklyOverviewExpanded] = useState(true);

  // 定时更新当前时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 每分钟更新一次
    return () => clearInterval(timer);
  }, []);

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

  // Fetch Daily Review Overview - 今日安排
  const fetchDailyReviewCourses = useCallback(async () => {
    setDailyReviewLoading(true);
    try {
      const response = await getDailyReviewOverview();
      if (response.success && response.data) {
        setDailyReviewCourses(response.data.courses || []);
      }
    } catch (err) {
      console.error('获取今日安排失败', err);
    } finally {
      setDailyReviewLoading(false);
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

  // 课程类型映射表
  const courseTypeMap: Record<string, 'PROFESSIONAL' | 'CROSS_MAJOR' | 'ELECTIVE'> = {
    '高等数学': 'PROFESSIONAL',
    '线性代数': 'PROFESSIONAL',
    '程序设计': 'PROFESSIONAL',
    '普通测量学': 'PROFESSIONAL',
    '思想道德与法治': 'ELECTIVE',
    '中国近现代史纲要': 'ELECTIVE',
  };

  const getCourseTypeInfo = (courseName: string) => {
    const courseType = courseTypeMap[courseName] || 'ELECTIVE';
    const typeLabels = {
      'PROFESSIONAL': '专业必修',
      'CROSS_MAJOR': '跨专业选修',
      'ELECTIVE': '公共课'
    };
    const typeColors = {
      'PROFESSIONAL': 'blue' as const,
      'CROSS_MAJOR': 'purple' as const,
      'ELECTIVE': 'green' as const
    };
    return {
      typeLabel: typeLabels[courseType],
      typeColor: typeColors[courseType],
      courseType
    };
  };

  // 将今日复习数据转换为任务组格式
  useEffect(() => {
    console.log('[todayReview] 变化检测:', todayReview);
    console.log('[todayReview] items 长度:', todayReview?.items?.length);
    if (todayReview && todayReview.items.length > 0) {
      // 课程名称到ID的映射
      const courseNameToId: Record<string, string> = {
        '高等数学': 'course-001',
        '程序设计': 'course-002',
        '思想道德与法治': 'course-003',
        '线性代数': 'course-004',
        '普通测量学': 'course-005',
        '中国近现代史纲要': 'course-006',
      };

      // 按课程分组
      const courseMap = new Map<string, TaskGroup>();
      todayReview.items.forEach(item => {
        const courseName = item.courseName || '未分类';
        const courseId = courseNameToId[courseName] || courseName;
        const { typeLabel, typeColor, courseType } = getCourseTypeInfo(courseName);

        if (!courseMap.has(courseName)) {
          // 判断学习状态
          const hasNewKnowledge = todayReview.items.some(i => (i.courseName || '未分类') === courseName && i.type === 'new');
          courseMap.set(courseName, {
            courseId: courseId,
            courseName,
            tag: typeLabel,  // 显示课程类型
            tagColor: typeColor,
            courseType,
            studyStatus: hasNewKnowledge ? 'learning' : 'reviewing',
            progress: `${todayReview.items.filter(i => (i.courseName || '未分类') === courseName).length}项`,
            tasks: []
          });
        }
        const group = courseMap.get(courseName)!;
        group.tasks.push({
          id: item.id,
          courseName,
          title: item.knowledgePointName,
          duration: `${item.estimatedTime}min`,
          status: 'pending',
          type: item.type === 'new' ? 'review' : 'review',
          tag: ''
        });
      });
      console.log('[todayReview] 转换后的taskGroups:', Array.from(courseMap.values()));
      setTaskGroups(Array.from(courseMap.values()));
    }
  }, [todayReview]);

  // P5 - Initialize user state - 确保 token 有效
  useEffect(() => {
    // 立即检查登录状态
    const timer = setTimeout(() => {
      const user = getUser();
      const token = localStorage.getItem('lumilearn_token');
      const loggedIn = !!token;
      console.log('[Dashboard] 初始化用户状态:', { user: !!user, loggedIn, hasToken: !!token });
      setCurrentUser(user);
      setIsLogged(loggedIn);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Scroll listener for header shrink effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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

  // 获取课程列表并计算最近考试倒计时
  const fetchCoursesAndExamCountdown = useCallback(async () => {
    console.log('[Debug] fetchCoursesAndExamCountdown called');
    try {
      const response = await getCourseList();
      console.log('[Debug] getCourseList response:', response);

      if (response.success && response.data && response.data.length > 0) {
        setCourses(response.data);

        // 计算最近考试
        const now = new Date();
        console.log('[Debug] Current time:', now);

        const coursesWithExam = response.data
          .filter((c: Course) => c.examDate)
          .map((c: Course) => ({
            ...c,
            examDateObj: new Date(c.examDate!)
          }))
          .filter((c: any) => c.examDateObj > now)
          .sort((a: any, b: any) => a.examDateObj.getTime() - b.examDateObj.getTime());

        console.log('[Debug] coursesWithExam:', coursesWithExam);

        if (coursesWithExam.length > 0) {
          const nearest = coursesWithExam[0];
          const daysLeft = Math.ceil((nearest.examDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          console.log('[Debug] Setting upcomingExam:', { name: nearest.name, daysLeft });
          setUpcomingExam({
            name: nearest.name,
            daysLeft,
            examDate: nearest.examDate!
          });
        } else {
          console.log('[Debug] No upcoming exams found');
        }
      }
    } catch (err) {
      console.error('[Debug] 获取课程倒计时失败', err);
    }
  }, []);

  // Fetch time from backend
  const fetchBackendTime = useCallback(async () => {
    setTimeLoading(true);
    try {
      const response = await api.get<{ date: string; time: string; dayOfWeek: string }>('/api/time');
      if (response.success && response.data) {
        setBackendTime(response.data);
      }
    } catch (err) {
      console.error('获取时间失败', err);
    } finally {
      setTimeLoading(false);
    }
  }, []);

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
    // Fetch daily review overview - 今日安排
    fetchDailyReviewCourses();
    // Fetch dashboard statistics - P4
    fetchDashboardStats();
    // Fetch today's review - P4
    fetchTodayReview();
    // Fetch backend time
    fetchBackendTime();
    // Fetch courses for exam countdown
    fetchCoursesAndExamCountdown();
    // Fetch P5 data if logged in
    if (isLogged) {
      fetchDailyRecommendations();
      fetchTodayReminders();
    }
  }, [showRecords, fetchStudyRecords, fetchRecentKps, fetchDailyReviewCourses, fetchDashboardStats, fetchTodayReview, isLogged, fetchDailyRecommendations, fetchTodayReminders, fetchBackendTime, fetchCoursesAndExamCountdown]);

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

  // Format study time to hours and minutes - 后端返回分钟单位
  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}小时${mins}分钟`;
    }
    return `${mins}分钟`;
  };

  // 格式化分钟为时间字符串 HH:mm
  const formatMinutesToTime = (totalMinutes: number): string => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // 计算当前时间在一天中的分钟数
  const getCurrentMinutes = (): number => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  };

  // 判断任务是否为当前进行中
  const isTaskActive = (startTime: string, duration: number): boolean => {
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = startMinutes + duration;
    const currentMinutes = getCurrentMinutes();
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  };

  // 判断任务是否为已过期
  const isTaskPast = (startTime: string, duration: number): boolean => {
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = startMinutes + duration;
    const currentMinutes = getCurrentMinutes();
    return currentMinutes >= endMinutes;
  };

  // 判断任务是否为下一个即将开始
  const isTaskNext = (startTime: string, duration: number): boolean => {
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const currentMinutes = getCurrentMinutes();
    // 下一个任务：在当前时间之后，最近的开始任务
    return startMinutes > currentMinutes;
  };

  // 获取任务类型标签
  const getTaskTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'CHAPTER_REVIEW': '课堂回顾',
      'MOCK_EXAM': '全真模拟',
      'WEAK_POINT': '题目练习',
      'weak_point': '薄弱点复习',
      'review': '艾宾浩斯复习',
      'new': '新知识学习',
      'consolidation': '巩固复习'
    };
    return typeMap[type] || '学习任务';
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
    console.log('[handleOptimize] 开始智能重排');
    console.log('[handleOptimize] 当前taskGroups:', taskGroups);
    console.log('[handleOptimize] 当前courses状态:', courses);
    try {
      let courseIds: string[] = [];

      // 优先从courses状态获取课程ID（这是真实的UUID）
      if (courses && courses.length > 0) {
        courseIds = courses.map(c => c.id);
        console.log('[handleOptimize] 从courses状态获取courseIds:', courseIds);
      }

      // 如果courses状态为空，尝试调用API获取课程列表
      if (courseIds.length === 0) {
        console.log('[handleOptimize] 尝试获取课程列表...');
        const coursesResponse = await getCourseList();
        console.log('[handleOptimize] 课程列表响应:', coursesResponse);
        if (coursesResponse.success && coursesResponse.data && coursesResponse.data.length > 0) {
          courseIds = coursesResponse.data.map(c => c.id);
          console.log('[handleOptimize] 从API获取courseIds:', courseIds);
        }
      }

      // 如果仍然没有课程ID，显示错误
      if (courseIds.length === 0) {
        alert('没有找到可优化的课程，请先添加课程');
        setIsOptimizing(false);
        return;
      }

      const requestData = {
        courseIds,
        dailyStudyHours: 2,
      };
      console.log('[handleOptimize] 发送数据:', requestData);
      console.log('[handleOptimize] taskGroups:', taskGroups);
      const response = await optimizeReview(requestData);

      console.log('[handleOptimize] 响应:', response);

      if (response.success && response.data) {
        // 将优化后的结果转换为 TaskGroup 格式
        const optimizedData = response.data;
        console.log('[handleOptimize] 优化数据:', optimizedData);

        // 从todayReview中获取具体知识点，按课程分组
        const courseTasks = new Map<string, typeof todayReview.items>();

        if (todayReview && todayReview.items.length > 0) {
          todayReview.items.forEach(item => {
            const courseName = item.courseName || '未分类';
            if (!courseTasks.has(courseName)) {
              courseTasks.set(courseName, []);
            }
            courseTasks.get(courseName)!.push(item);
          });
        }

        if (!optimizedData.dailyAllocation || optimizedData.dailyAllocation.length === 0) {
          console.log('[handleOptimize] 没有返回分配数据');
          return;
        }

        // 按priority排序：high > medium > low，确保时间顺序正确
        const sortedAllocation = [...optimizedData.dailyAllocation].sort((a, b) => {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        console.log('[handleOptimize] 排序后的分配:', sortedAllocation.map(a => ({ course: a.courseName, priority: a.priority })));

        // 时间段分配：每个时间段可安排多个课程
        // 上午: 09:00-12:00, 下午: 14:00-18:00, 晚上: 19:00-21:00
        // 同一时间段内的课程用不同时间点区分
        const getTimeAndPeriod = (idx: number) => {
          if (idx < 2) {
            // 上午：9:00, 10:30
            return { time: idx === 0 ? '09:00' : '10:30', period: '上午学习' };
          } else if (idx < 4) {
            // 下午：14:00, 16:00
            const afternoonIdx = idx - 2;
            return { time: afternoonIdx === 0 ? '14:00' : '16:00', period: '下午学习' };
          } else {
            // 晚上：19:00, 20:00
            const eveningIdx = idx - 4;
            return { time: eveningIdx === 0 ? '19:00' : '20:00', period: '晚上学习' };
          }
        };

        // 课程类型映射表
        const courseTypeMap: Record<string, 'PROFESSIONAL' | 'CROSS_MAJOR' | 'ELECTIVE'> = {
          '高等数学': 'PROFESSIONAL',      // 专业必修
          '线性代数': 'PROFESSIONAL',      // 专业必修
          '程序设计': 'PROFESSIONAL',      // 专业必修
          '普通测量学': 'PROFESSIONAL',    // 专业必修
          '思想道德与法治': 'ELECTIVE',     // 公共课
          '中国近现代史纲要': 'ELECTIVE',   // 公共课
        };

        // 课程类型标签和颜色
        const getCourseTypeInfo = (courseName: string) => {
          const courseType = courseTypeMap[courseName] || 'ELECTIVE';
          const typeLabels = {
            'PROFESSIONAL': '专业必修',
            'CROSS_MAJOR': '跨专业选修',
            'ELECTIVE': '公共课'
          };
          const typeColors = {
            'PROFESSIONAL': 'blue' as const,
            'CROSS_MAJOR': 'purple' as const,
            'ELECTIVE': 'green' as const
          };
          return {
            typeLabel: typeLabels[courseType],
            typeColor: typeColors[courseType],
            courseType
          };
        };

        const newGroups = sortedAllocation.map((allocation, idx) => {
          const courseName = allocation.courseName;
          const tasks = courseTasks.get(courseName) || [];

          // 获取课程类型信息
          const { typeLabel, typeColor, courseType } = getCourseTypeInfo(courseName);

          // 判断学习状态：是否有新知识
          const hasNewKnowledge = tasks.some(t => t.type === 'new');
          const studyStatus = hasNewKnowledge ? 'learning' : 'reviewing';

          // 将知识点任务转换为TaskGroup格式
          const taskItems = tasks.slice(0, 10).map((item, i) => ({
            id: item.id || `${courseName}-${i}`,
            courseName: courseName,
            title: item.knowledgePointName,
            duration: `${item.estimatedTime}min`,
            status: 'pending' as const,
            type: 'review' as const,
            tag: item.type === 'new' ? '新知识' : '复习'
          }));

          const { time, period } = getTimeAndPeriod(idx);

          return {
            courseId: allocation.courseId,
            courseName: courseName,
            time,
            period,
            tag: typeLabel,  // 显示课程类型
            tagColor: typeColor,
            courseType,
            studyStatus,
            progress: `${allocation.allocatedHours}h/天 (${taskItems.length}项)`,
            tasks: taskItems
          };
        });
        // 调试：打印新任务组的时间安排
        console.log('[handleOptimize] 新任务组时间安排:', newGroups.map(g => ({
          course: g.courseName,
          time: g.time,
          period: g.period,
          priority: g.tag
        })));

        setTaskGroups(newGroups);

        // 优化成功后，清空todayReview使Timeline使用更新后的taskGroups显示
        // 因为Timeline优先使用todayReview.items，只有当todayReview为空时才使用taskGroups
        setTodayReview(null);

        // 同时也更新dashboard数据以显示新的统计信息
        fetchDashboardStats();
      } else {
        console.log('[handleOptimize] 响应失败或无数据:', response);
        // 显示后端返回的错误信息
        if (response.error) {
          alert('智能重排失败: ' + response.error);
        }
      }
    } catch (err) {
      console.error('智能优化失败', err);
      alert('智能重排请求失败，请检查网络连接');
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
      } else if (task.type === 'quiz' || task.type === 'mistake' || task.type === 'practice') {
          // 练习类型(practice/quiz/mistake)跳转到练习页面
          onNavigate(AppView.DRILL);
      }
  };

  const getTheme = (courseName: string) => {
      if (courseName.includes('数据结构') || courseName.includes('程序设计')) return {
          color: '#ef4444',
          bg: 'bg-red-50',
          bgClass: 'bg-red-500',
          border: 'border-red-500',
          text: 'text-red-600',
          gradient: 'from-red-500 to-orange-500',
          shadow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]'
      };
      if (courseName.includes('摄影测量') || courseName.includes('普通测量')) return {
          color: '#a855f7',
          bg: 'bg-purple-50',
          bgClass: 'bg-purple-500',
          border: 'border-purple-500',
          text: 'text-purple-600',
          gradient: 'from-purple-500 to-indigo-500',
          shadow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]'
      };
      if (courseName.includes('高等数学')) return {
          color: '#3b82f6',
          bg: 'bg-blue-50',
          bgClass: 'bg-blue-500',
          border: 'border-blue-500',
          text: 'text-blue-600',
          gradient: 'from-blue-500 to-blue-600',
          shadow: 'shadow-none'
      };
      if (courseName.includes('线性代数')) return {
          color: '#8b5cf6',
          bg: 'bg-violet-50',
          bgClass: 'bg-violet-500',
          border: 'border-violet-500',
          text: 'text-violet-600',
          gradient: 'from-violet-500 to-purple-500',
          shadow: 'shadow-none'
      };
      if (courseName.includes('思政') || courseName.includes('道德') || courseName.includes('近代史')) return {
          color: '#f59e0b',
          bg: 'bg-amber-50',
          bgClass: 'bg-amber-500',
          border: 'border-amber-500',
          text: 'text-amber-600',
          gradient: 'from-amber-500 to-orange-500',
          shadow: 'shadow-none'
      };
      return {
          color: '#6366f1',
          bg: 'bg-indigo-50',
          bgClass: 'bg-indigo-500',
          border: 'border-indigo-500',
          text: 'text-indigo-600',
          gradient: 'from-indigo-500 to-purple-500',
          shadow: 'shadow-none'
      };
  };

  // 基于API数据动态生成Timeline - 使用todayReview数据
  // 根据用户设置的时间段计算任务时间安排
  const timelineGroups = React.useMemo(() => {
    console.log('[timelineGroups] todayReview:', todayReview ? '有数据' : 'null');
    console.log('[timelineGroups] taskGroups:', taskGroups);

    // 当todayReview为空时，直接使用taskGroups（智能重排后的数据）
    if (!todayReview || (todayReview.items && todayReview.items.length === 0)) {
      // 智能重排后的taskGroups已经有正确的time和period字段，直接返回
      console.log('[timelineGroups] 使用taskGroups - time字段:', taskGroups.map(g => ({ course: g.courseName, time: g.time, period: g.period })));
      return taskGroups;
    }

    // 时间段定义
    const schedule = todayReview.schedule;
    const morningStart = schedule?.morning?.start ? parseInt(schedule.morning.start.split(':')[0]) * 60 : 9 * 60;
    const afternoonStart = schedule?.afternoon?.start ? parseInt(schedule.afternoon.start.split(':')[0]) * 60 : 14 * 60;
    const eveningStart = schedule?.evening?.start ? parseInt(schedule.evening.start.split(':')[0]) * 60 : 19 * 60;

    // 时段分界线
    const MORNING_END = 12 * 60;   // 12:00 上午结束
    const AFTERNOON_END = 18 * 60; // 18:00 下午结束

    let currentTimeSlot = morningStart;
    let currentPeriod = '上午学习';

    // 按课程分组
    const courseMap = new Map<string, typeof taskGroups[0]>();

    // 先按课程分组，确定每个课程的类型和学习状态
    const courseInfoMap = new Map<string, { hasNew: boolean; types: Set<string> }>();
    todayReview.items.forEach((item) => {
      const courseName = item.courseName || '未分类';
      if (!courseInfoMap.has(courseName)) {
        courseInfoMap.set(courseName, { hasNew: false, types: new Set() });
      }
      const info = courseInfoMap.get(courseName)!;
      if (item.type === 'new') {
        info.hasNew = true;
      }
      info.types.add(item.type);
    });

    todayReview.items.forEach((item) => {
      const courseName = item.courseName || '未分类';
      const courseId = item.courseId || courseName;
      const { typeLabel, typeColor, courseType } = getCourseTypeInfo(courseName);
      const courseInfo = courseInfoMap.get(courseName);

      if (!courseMap.has(courseName)) {
        courseMap.set(courseName, {
          courseId,
          courseName,
          tag: typeLabel,  // 使用课程类型
          tagColor: typeColor,
          courseType,
          studyStatus: courseInfo?.hasNew ? 'learning' : 'reviewing',
          progress: '',
          tasks: []
        });
      }
      const group = courseMap.get(courseName)!;

      const duration = item.estimatedTime;
      const restTime = item.restTime || 5;

      // 添加任务
      group.tasks.push({
        id: item.id,
        courseName,
        title: item.knowledgePointName || item.reason || getTaskTypeLabel(item.type),
        duration: `${duration}min`,
        status: 'pending' as const,
        type: item.type === 'CHAPTER_REVIEW' ? 'review' :
              item.type === 'MOCK_EXAM' ? 'paper' :
              item.type === 'WEAK_POINT' ? 'practice' :
              item.type === 'weak_point' ? 'mistake' :
              item.type === 'new' ? 'new' :
              item.type === 'consolidation' ? 'review' : 'review' as any,
        tag: ''
      });

      // 更新时间槽
      currentTimeSlot += duration + restTime;

      // 时段切换：如果任务结束时间超过上午时段(12:00)，跳到下午
      if (currentTimeSlot > MORNING_END && currentPeriod === '上午学习') {
        currentTimeSlot = afternoonStart + (currentTimeSlot - MORNING_END);
        currentPeriod = '下午学习';
      }
      // 如果任务结束时间超过下午时段(18:00)，跳到晚上
      else if (currentTimeSlot > AFTERNOON_END && currentPeriod === '下午学习') {
        currentTimeSlot = eveningStart + (currentTimeSlot - AFTERNOON_END);
        currentPeriod = '晚上学习';
      }
    });

    // 重新计算每个课程组的时间点和时段
    let timeSlot = morningStart;
    let period = '上午学习';

    return Array.from(courseMap.values()).map((group) => {
      const time = formatMinutesToTime(timeSlot);

      // 计算组内任务总时长和休息时间
      let totalDuration = 0;
      let totalRest = 0;
      group.tasks.forEach((task, idx) => {
        const duration = parseInt(task.duration);
        const originalItem = todayReview.items.find(item => item.id === task.id);
        const rest = originalItem?.restTime || 5;
        totalDuration += duration;
        if (idx < group.tasks.length - 1) {
          totalRest += rest;
        }
      });

      // 判断时段：基于任务开始时间
      // 早上：< 12:00，下午：12:00-18:00，晚上：>= 18:00
      let taskPeriod = '上午学习';
      if (timeSlot >= AFTERNOON_END) {
        taskPeriod = '晚上学习';
      } else if (timeSlot >= MORNING_END) {
        taskPeriod = '下午学习';
      }

      timeSlot += totalDuration + totalRest;

      // 时段切换
      if (timeSlot > MORNING_END && period === '上午学习') {
        timeSlot = afternoonStart + (timeSlot - MORNING_END);
        period = '下午学习';
      } else if (timeSlot > AFTERNOON_END && period === '下午学习') {
        timeSlot = eveningStart + (timeSlot - AFTERNOON_END);
        period = '晚上学习';
      }

      return { ...group, time, period: taskPeriod };
    });
  }, [todayReview, taskGroups]);

  return (
    <div className="flex flex-col h-screen bg-[#F4F6F9] font-sans overflow-hidden">

      {/* =======================
          1. Glass Header - 优雅的渐变头部
          ======================= */}
      <div className={`relative px-4 sm:px-6 z-20 transition-all duration-300 ${
        isScrolled
          ? 'pt-2 pb-2 bg-white border-b border-slate-100 shadow-sm'
          : 'pt-5 pb-4 bg-gradient-to-r from-blue-50 via-white to-indigo-50'
      }`}>
        {/* 主容器 */}
        <div className="flex justify-between items-start">

          {/* 左侧：日期时间区域 */}
          <div className="flex-1">
            {/* 星期进度条 - 根据真实星期高亮 */}
            <div className={`flex items-center gap-1 mb-2 ${isScrolled ? 'hidden' : 'flex'}`}>
              {(() => {
                // 将星期几转换为索引 (周日=0, 周一=1, ..., 周六=6)
                const dayMap: Record<string, number> = {
                  '周日': 0, '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5, '周六': 6,
                  '星期日': 0, '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4, '星期五': 5, '星期六': 6
                }
                const todayIndex = backendTime ? (dayMap[backendTime.dayOfWeek] ?? 6) : 6
                return [...Array(7)].map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === todayIndex ? 'w-5 bg-orange-400 shadow-sm' : 'w-1.5 bg-slate-300'}`}></div>
                ))
              })()}
            </div>

            {/* 日期时间显示 - 大字体有设计感 */}
            <div>
              {timeLoading ? (
                <Loader2 className="animate-spin text-blue-500" size={24} />
              ) : backendTime ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-slate-800 tracking-tight">
                    {(() => {
                      const match = backendTime.date.match(/(\d+)月(\d+)日/)
                      if (match) return `${match[1]}.${match[2]}`
                      return '--.--'
                    })()}
                  </span>
                  <span className="text-base font-medium text-slate-500">{backendTime.dayOfWeek}</span>
                </div>
              ) : (
                <div className="text-3xl font-bold text-slate-800">--.--</div>
              )}
            </div>
          </div>

          {/* 右侧：快捷操作 */}
          <div className="flex flex-col items-end gap-2">
            {/* 第一行：日历 + 用户 */}
            <div className="flex items-center gap-2">
              {/* 备考日历入口 */}
              <button
                onClick={() => onNavigate(AppView.EXAM_CALENDAR)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-lg cursor-pointer active:scale-95 transition-all shadow-sm"
                title="备考日历"
              >
                <Calendar size={12} className="text-white" />
                <span className="text-xs font-bold text-white">日历</span>
              </button>

              {/* 用户区域 */}
              {isLogged && currentUser ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onNavigate(AppView.SETTINGS)}
                    className="bg-white border border-slate-200 rounded-lg p-1.5 active:scale-95 transition-transform shadow-sm"
                    title="设置"
                  >
                    <Settings size={11} className="text-slate-500" />
                  </button>
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg w-6 h-6 flex items-center justify-center shadow-sm">
                    <span className="text-white text-[9px] font-bold">
                      {currentUser.displayName?.charAt(0) || currentUser.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => onNavigate(AppView.AUTH)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg active:scale-95 transition-all shadow-sm"
                >
                  <User size={11} className="text-slate-600" />
                  <span className="text-xs font-bold text-slate-700">登录</span>
                </button>
              )}
            </div>

            {/* 第二行：考试倒计时 + 统计 */}
            <div className="flex items-center gap-2">
              {/* 考试倒计时 - 更醒目的橙色样式 */}
              {upcomingExam && upcomingExam.daysLeft > 0 ? (
                <div
                  onClick={() => onNavigate(AppView.EXAM_CALENDAR)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg cursor-pointer active:scale-95 transition-all shadow-md border-2 border-orange-400"
                >
                  <Flame size={14} className="text-yellow-200" />
                  <span className="text-xs font-black text-white whitespace-nowrap">
                    {upcomingExam.name.slice(0, 4)} {upcomingExam.daysLeft}天
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-200 rounded-lg">
                  <Flame size={12} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-500">暂无考试</span>
                </div>
              )}

              {/* 统计信息 */}
              {!dashboardLoading && dashboardData && (
                <div className="flex items-center gap-1.5">
                  <div className="bg-white border border-slate-100 rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm">
                    <BookOpen size={10} className="text-blue-500" />
                    <span className="text-xs font-bold text-slate-600">{dashboardData.coursesCount}</span>
                  </div>
                  <div className="bg-white border border-slate-100 rounded-lg px-2 py-1 flex items-center gap-1 shadow-sm">
                    <Brain size={10} className="text-purple-500" />
                    <span className="text-xs font-bold text-slate-600">{dashboardData.knowledgePoints.mastered}/{dashboardData.knowledgePoints.total}</span>
                  </div>
                </div>
              )}
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

          {/* --- P4 统计概览卡片 - 扩展版本 --- */}
          {!dashboardLoading && dashboardData && (
            <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 shadow-sm">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-100 p-1.5 rounded-lg">
                    <TrendingUp size={14} className="text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">本周学习概览</h3>
                </div>
                <button
                  onClick={() => setWeeklyOverviewExpanded(!weeklyOverviewExpanded)}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
                >
                  {weeklyOverviewExpanded ? '收起' : '展开'}
                  <ChevronDown size={12} className={`transition-transform ${weeklyOverviewExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* 展开模式显示完整内容 */}
              {weeklyOverviewExpanded && (
                <>
                  {/* 今日目标行 */}
                  <div className="flex items-center justify-between mb-3 bg-white/60 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Target size={12} className="text-orange-500" />
                      <span className="text-xs font-medium text-slate-600">今日目标:</span>
                      <span className="text-xs font-bold text-orange-600">{dashboardData.todayStats?.dailyGoal || 120}分钟</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">今日进度:</span>
                      <span className="text-xs font-bold text-blue-600">{dashboardData.todayStats?.progress || 0}%</span>
                    </div>
                  </div>

                  {/* 进度条 - 今日任务完成进度 */}
                  <div className="mb-3">
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
                        style={{ width: `${dashboardData.todayStats?.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                      <span>已学 {formatStudyTime(dashboardData.todayStats?.studyTime || 0)} / 目标 {formatStudyTime(dashboardData.todayStats?.dailyGoal || 120)}</span>
                      <span>任务 {dashboardData.todayStats?.taskCompleted || 0}/{dashboardData.todayStats?.taskTotal || 0} 完成</span>
                    </div>
                  </div>

                  {/* 本周数据 */}
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
                </>
              )}

              {/* 折叠模式显示简要数据行 */}
              {!weeklyOverviewExpanded && (
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-white/60 rounded-lg px-2 py-1.5">
                    <p className="text-xs font-bold text-orange-600">{formatStudyTime(dashboardData.todayStats?.dailyGoal || 120)}</p>
                    <p className="text-[10px] text-slate-400">今日目标</p>
                  </div>
                  <div className="bg-white/60 rounded-lg px-2 py-1.5">
                    <p className="text-xs font-bold text-blue-600">{dashboardData.todayStats?.progress || 0}%</p>
                    <p className="text-[10px] text-slate-400">完成进度</p>
                  </div>
                  <div className="bg-white/60 rounded-lg px-2 py-1.5">
                    <p className="text-xs font-bold text-blue-600">{formatStudyTime(dashboardData.weeklyStats?.studyTime || 0)}</p>
                    <p className="text-[10px] text-slate-400">本周时长</p>
                  </div>
                  <div className="bg-white/60 rounded-lg px-2 py-1.5">
                    <p className="text-xs font-bold text-green-600">{dashboardData.weeklyStats?.studyDays || 0}</p>
                    <p className="text-[10px] text-slate-400">学习天数</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* --- 学习任务汇总卡片 - 与本周学习概览格式匹配 --- */}
          {dailyReviewCourses.length > 0 && (
            <div className="mb-4 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              {/* 头部 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-amber-100 p-1.5 rounded-lg">
                    <Calendar size={14} className="text-amber-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">学习任务汇总</h3>
                </div>
                <button
                  onClick={() => setTaskSummaryExpanded(!taskSummaryExpanded)}
                  className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
                >
                  {taskSummaryExpanded ? '收起' : '展开'}
                  <ChevronDown size={12} className={`transition-transform ${taskSummaryExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* 课程列表 */}
              {taskSummaryExpanded ? (
                // 展开模式：与本周学习概览一致的卡片样式
                <div className="space-y-2">
                  {dailyReviewCourses.map((course) => {
                    const isHigh = course.urgencyLevel === 'HIGH';
                    const isNormal = course.urgencyLevel === 'NORMAL';
                    const progress = course.reviewProgress || course.masteryRate || 0;
                    const daysUntil = course.daysUntilExam;
                    const weakCount = course.weakPoints || 0;

                    // 主题颜色 - 直接使用具体颜色类
                    const statusLabel = course.courseStatus === 'STUDYING' ? '学习中' : isHigh ? '紧迫' : isNormal ? '一般' : '良好';
                    const progressBarColor = isHigh ? 'bg-red-500' : isNormal ? 'bg-yellow-500' : 'bg-green-500';
                    const statusColor = isHigh ? 'text-red-500' : isNormal ? 'text-yellow-600' : 'text-green-500';
                    const statusBg = isHigh ? 'bg-red-100 text-red-600' : isNormal ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600';

                    return (
                      <div
                        key={course.courseId}
                        className="bg-slate-50 rounded-lg p-2 border border-slate-100 hover:border-slate-200 transition-all cursor-pointer"
                        onClick={() => {}}
                      >
                        {/* 顶部：课程名 + 状态 + 进度 */}
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-slate-700">{course.courseName}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${statusBg}`}>
                              {statusLabel}
                            </span>
                          </div>
                          <span className={`text-xs font-bold ${statusColor}`}>{progress}%</span>
                        </div>

                        {/* 进度条 */}
                        <div className="h-1 bg-slate-200 rounded-full overflow-hidden mb-1">
                          <div
                            className={`h-full ${progressBarColor} rounded-full`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>

                        {/* 底部：距考 + 薄弱点 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {daysUntil !== null && (
                              <span className={`text-[9px] ${
                                daysUntil <= 7 ? 'text-red-500 font-medium' :
                                daysUntil <= 14 ? 'text-yellow-600' : 'text-slate-400'
                              }`}>
                                距考 {daysUntil} 天
                              </span>
                            )}
                            {weakCount > 0 && (
                              <span className="text-[9px] text-orange-500">
                                {weakCount} 个薄弱
                              </span>
                            )}
                          </div>
                          <ChevronRight size={10} className="text-slate-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                // 折叠模式：与本周学习概览数据行一致的样式
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-center">
                    <p className="text-sm font-bold text-slate-700">{dailyReviewCourses.filter(c => c.courseStatus === 'REVIEWING').length}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">复习中</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-center">
                    <p className="text-sm font-bold text-red-500">{dailyReviewCourses.filter(c => c.daysUntilExam !== null && c.daysUntilExam <= 7).length}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">紧迫</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-center">
                    <p className="text-sm font-bold text-orange-500">{dailyReviewCourses.reduce((sum, c) => sum + (c.weakPoints || 0), 0)}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">薄弱点</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 移除绝对定位的垂直线，改用 Flex 布局 */}

          {/* --- Render Timeline Groups - 动态时间轴 --- */}
          {timelineGroups.map((group, index) => {
              const theme = getTheme(group.courseName);

              // 动态判断是否为当前进行中的任务组
              const taskDuration = group.tasks.reduce((sum, t) => sum + parseInt(t.duration), 0);
              // 无论todayReview是否为空，都使用实际时间判断
              const isActiveGroup = isTaskActive(group.time || '09:00', taskDuration);
              const isNextGroup = isTaskNext(group.time || '09:00', taskDuration) && !isActiveGroup;
              const isPastGroup = isTaskPast(group.time || '09:00', taskDuration);

              return (
                <div key={group.courseId} className="flex items-stretch min-h-[100px] mb-8 transition-all duration-500 animate-in slide-in-from-bottom-8 fade-in" style={{ animationDelay: `${index * 100}ms` }}>

                    {/* 1. Time Column (Left) - w-[70px] */}
                    <div className="w-[70px] flex flex-col justify-center pt-2">
                        <span className={`block text-sm font-bold font-mono leading-none text-right ${isActiveGroup ? 'text-orange-600' : isNextGroup ? 'text-indigo-600' : 'text-slate-600'}`}>{group.time}</span>
                        <span className={`block text-[9px] font-bold mt-1 uppercase tracking-tighter text-right ${isActiveGroup ? 'text-orange-500' : isNextGroup ? 'text-indigo-500' : 'text-slate-400'}`}>{group.period}</span>
                    </div>

                    {/* 2. Axis Node (Center) - w-12 (48px) */}
                    <div className="w-12 flex flex-col items-center pt-1">
                        {/* Top Line */}
                        <div className="w-0.5 h-4 bg-indigo-200" />
                        {/* Dot */}
                        <div className={`relative w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center ${
                          isActiveGroup ? 'border-orange-500 ring-2 ring-orange-200' :
                          isNextGroup ? 'border-indigo-400 ring-2 ring-indigo-200' :
                          'border-indigo-300'
                        }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              isActiveGroup ? 'bg-orange-500' :
                              isNextGroup ? 'bg-indigo-500' :
                              'bg-indigo-400'
                            }`}></div>
                            {/* Ping Effect for Active */}
                            {isActiveGroup && (
                                <span className="absolute w-full h-full rounded-full animate-ping opacity-75 bg-orange-500"></span>
                            )}
                        </div>
                        {/* Bottom Line */}
                        <div className="flex-1 w-0.5 bg-indigo-200" />
                    </div>

                    {/* 3. Content Area (Right) */}
                    <div className="flex-1 pt-0.5">
                        {/* Course Header */}
                        <div className="flex items-center mb-3 flex-wrap gap-1">
                            <h3 className={`text-base font-extrabold ${isActiveGroup ? 'text-orange-700' : isNextGroup ? 'text-indigo-700' : 'text-slate-700'}`}>
                              {group.courseName}
                              {isActiveGroup && <span className="ml-2 text-[10px] text-orange-600 font-normal">(进行中)</span>}
                              {isNextGroup && <span className="ml-2 text-[10px] text-indigo-600 font-normal">(即将开始)</span>}
                            </h3>
                            {/* 课程类型标签 - 使用柔和渐变色 */}
                            <span className={`ml-1 px-2 py-0.5 text-[10px] font-bold rounded-md shadow-sm ${
                              group.tagColor === 'blue' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' :
                              group.tagColor === 'purple' ? 'bg-violet-100 text-violet-700 border border-violet-200' :
                              group.tagColor === 'green' ? 'bg-teal-100 text-teal-700 border border-teal-200' :
                              group.tagColor === 'red' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                              group.tagColor === 'orange' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                                {group.tag}
                            </span>
                            {/* 学习状态标签 - 使用更柔和的颜色 */}
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md shadow-sm ${
                              group.studyStatus === 'learning' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                              group.studyStatus === 'reviewing' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                              'bg-slate-50 text-slate-500 border border-slate-200'
                            }`}>
                                {group.studyStatus === 'learning' ? '学习中' : group.studyStatus === 'reviewing' ? '复习中' : '已完成'}
                            </span>
                        </div>

                        {/* Task Cards */}
                        <div className="space-y-3">
                            {group.tasks.map((task) => {
                                const isCompleted = task.status === 'completed';
                                const isInProgress = task.status === 'in-progress';

                                let cardStyle = "bg-white border-slate-200 shadow-sm";
                                if (isInProgress) cardStyle = `bg-white border-l-4 ${theme.border} shadow-[0_8px_30px_rgba(0,0,0,0.12)] scale-[1.02]`;
                                else if (isCompleted) cardStyle = "bg-slate-50 border-slate-200 opacity-60";
                                else cardStyle = "bg-white border-slate-200 shadow-sm";

                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => handleTaskClick(task)}
                                        className={`relative rounded-xl p-3.5 border transition-all active:scale-[0.98] ${cardStyle}`}
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex items-center space-x-2">
                                                <span className={`${isCompleted ? 'bg-slate-300 text-slate-600' : theme.bg + ' ' + theme.text} text-[10px] font-bold px-1.5 py-0.5 rounded`}>
                                                    {task.type === 'paper' ? '全真模拟' : (task.type === 'practice' ? '题目练习' : (task.type === 'mistake' ? '薄弱点复习' : (task.type === 'new' ? '新知识学习' : '知识回顾')))}
                                                </span>
                                            </div>
                                            {isInProgress && <Play size={12} className="text-blue-600" fill="#2563EB" />}
                                            {isCompleted && <CheckCircle2 size={16} className="text-emerald-500" />}
                                        </div>

                                        <h4 className={`text-sm font-bold leading-snug mb-2 ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                                            {task.title}
                                        </h4>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-[10px] text-slate-500">
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

          {/* End Node - 使用 Flex 布局 */}
          <div className="flex items-stretch h-16">
                {/* 左侧时间 */}
                <div className="w-[70px] flex flex-col justify-center">
                    <span className="block text-sm font-bold text-slate-400 font-mono text-right">22:30</span>
                </div>
                {/* 中间轴线 */}
                <div className="w-12 flex flex-col items-center">
                    <div className="w-0.5 h-4 bg-indigo-200" />
                    <div className="w-3 h-3 rounded-full bg-indigo-400 border-2 border-indigo-200" />
                    <div className="flex-1 w-0.5 bg-indigo-200" />
                </div>
                {/* 右侧内容 */}
                <div className="flex-1 flex items-center text-slate-400">
                    <Moon size={14} className="mr-2 text-indigo-400" />
                    <span className="text-xs font-bold">结束学习</span>
                </div>
          </div>
          
        </div>
      </div>

      {/* =======================
          3. Float Warning - 进度警告（根据API数据动态显示）
          ======================= */}
      {dashboardData?.progressWarning && !warningDismissed && (
        <div className={`absolute bottom-[70px] left-4 right-4 rounded-full px-4 py-2.5 flex items-center justify-between shadow-[0_8px_20px_-5px_rgba(0,0,0,0.1)] z-30 animate-in slide-in-from-bottom-4 duration-500 ${
          dashboardData.progressWarning.level === 'HIGH'
            ? 'bg-red-50 border border-red-200'
            : 'bg-amber-50 border border-amber-200'
        }`}>
            <div className="flex items-center space-x-2.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${
                  dashboardData.progressWarning.level === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'
                }`}>
                    <AlertTriangle size={10} className="text-white" fill="white" />
                </div>
                <span className={`text-xs font-bold ${
                  dashboardData.progressWarning.level === 'HIGH' ? 'text-red-700' : 'text-amber-700'
                }`}>
                  {dashboardData.progressWarning.message}
                </span>
            </div>
            <button
                onClick={() => setWarningDismissed(true)}
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
                                {/* 只显示用户笔记，不显示PPT内容 */}
                                {record.notes && !record.notes.startsWith('{') && (
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