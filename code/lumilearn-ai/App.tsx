
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './src/components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import ChapterManager from './pages/ChapterManager';
import KnowledgeManager from './pages/KnowledgeManager';
import Agent from './pages/Agent';
import Drill from './pages/Drill';
import TimeMachine from './pages/TimeMachine';
import Recorder from './pages/Recorder';
import CourseDetailStudy from './pages/CourseDetailStudy';
import CourseManager from './pages/CourseManager';
import Analysis from './pages/Analysis';
import PracticeList from './pages/PracticeList';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import Exam from './pages/Exam';
import Mistakes from './pages/Mistakes';
import MistakeDetail from './pages/MistakeDetail';
import ExamCalendar from './pages/ExamCalendar';
import WeakPoints from './pages/WeakPoints';
import { AppView } from './types';
import { isLoggedIn, debugLogin, setToken, setUser, getToken } from './src/api/auth';

// 学习模式类型
type CourseStudyMode = 'study' | 'review';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);
  const [courseStudyMode, setCourseStudyMode] = useState<CourseStudyMode>('study');
  const [viewData, setViewData] = useState<any>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const authChecked = useRef(false);
  
  // 导航历史栈
  const [navHistory, setNavHistory] = useState<Array<{view: AppView; data?: any}>>([]);

  // 自动登录检查 - 强制使用调试登录，确保 token 有效
  useEffect(() => {
    if (authChecked.current) return;
    authChecked.current = true;

    const initAuth = async () => {
      // 强制清除旧 token，使用调试登录
      console.log('[App] 强制使用调试登录...')
      try {
        const response = await debugLogin()
        if (response.success && response.data) {
          console.log('[App] 调试登录成功:', response.data.user?.username)
          setToken(response.data.token)
          setUser(response.data.user)
          // 强制延迟确保 localStorage 已保存
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          console.warn('[App] 调试登录失败:', response.error)
        }
      } catch (error) {
        console.error('[App] 调试登录错误:', error)
      }
      setAuthReady(true)
    }

    initAuth()
  }, [])

  const navigate = async (view: AppView, data?: any, options?: { skipHistory?: boolean }) => {
    // 检查 token 是否存在，如果不存在则重新登录
    const currentToken = localStorage.getItem('lumilearn_token')
    if (!currentToken) {
      console.log('[navigate] Token 不存在，重新登录...')
      try {
        const response = await debugLogin()
        if (response.success && response.data) {
          setToken(response.data.token)
          setUser(response.data.user)
        }
      } catch (error) {
        console.error('[navigate] 重新登录失败:', error)
      }
    }

    // 保存当前页面到历史栈（如果不跳过）
    if (!options?.skipHistory) {
      setNavHistory(prev => [...prev, { view: currentView, data: viewData }]);
    }

    setCurrentView(view);
    setViewData(data);
    if (data && typeof data === 'object') {
      // 带有课程ID和模式的数据
      if (data.courseId) {
        setCurrentCourseId(data.courseId);
      }
      if (data.mode) {
        setCourseStudyMode(data.mode);
      }
      // 处理 recordId
      if (data.recordId) {
        setRecordId(data.recordId);
      }
    } else if (data && typeof data === 'string') {
      // 根据view类型判断是courseId还是recordId
      if (view === AppView.TIME_MACHINE) {
        setRecordId(data);
      } else {
        setCurrentCourseId(data);
      }
    }
  };

  const handleCourseChange = (id: string) => {
    setCurrentCourseId(id);
  };

  // 返回上一页
  const goBack = () => {
    if (navHistory.length > 0) {
      const prev = navHistory[navHistory.length - 1];
      setNavHistory(prev => prev.slice(0, -1));
      setCurrentView(prev.view);
      setViewData(prev.data);
      // 恢复 recordId 和 courseId
      if (prev.data?.recordId) {
        setRecordId(prev.data.recordId);
      }
      if (prev.data?.courseId) {
        setCurrentCourseId(prev.data.courseId);
      }
    } else {
      // 没有历史时返回首页
      setCurrentView(AppView.DASHBOARD);
      setViewData(null);
    }
  };

  // 处理点击课程（学习或复习）
  const handleCourseSelect = (courseId: string, mode: CourseStudyMode) => {
    setCurrentCourseId(courseId);
    setCourseStudyMode(mode);
    setCurrentView(AppView.COURSE_DETAIL_STUDY);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={navigate} />;
      case AppView.COURSES:
        return <Courses onNavigate={navigate} onCourseSelect={handleCourseSelect} />;
      case AppView.COURSE_MANAGER:
        return <CourseManager onNavigate={navigate} />;
      case AppView.CHAPTER_MANAGER:
        return <ChapterManager onNavigate={navigate} />;
      case AppView.KNOWLEDGE_MANAGER:
        return <KnowledgeManager onNavigate={navigate} />;
      case AppView.COURSE_DETAIL_STUDY:
      case AppView.COURSE_DETAIL_REVIEW:
        return <CourseDetailStudy onNavigate={navigate} courseId={currentCourseId} studyMode={courseStudyMode} />;
      case AppView.AGENT:
        return <Agent onBack={() => navigate(AppView.ANALYSIS)} />;
      case AppView.DRILL:
        return <Drill onNavigate={navigate} courseId={viewData?.courseId || currentCourseId} />;
      case AppView.PRACTICE_LIST:
        return <PracticeList onNavigate={navigate} />;
      case AppView.ANALYSIS:
        return (
          <Analysis 
            onNavigate={navigate} 
            currentCourseId={currentCourseId} 
            onCourseChange={handleCourseChange}
          />
        );
      case AppView.TIME_MACHINE:
        return <TimeMachine onBack={goBack} recordId={viewData?.recordId || recordId} />;
      case AppView.RECORDER:
        return <Recorder 
          onBack={goBack}
          onSaveSuccess={(id) => {
            setRecordId(id);
            navigate(AppView.TIME_MACHINE, { recordId: id });
          }}
          initialCourseName={viewData?.courseName} 
        />;
      case AppView.AUTH:
        return <Auth onNavigate={navigate} />;
      case AppView.SETTINGS:
        return <Settings onNavigate={navigate} />;
      case AppView.EXAM:
        return <Exam onNavigate={navigate} examData={viewData} />;
      case AppView.MISTAKES:
        return <Mistakes onNavigate={navigate} courseId={currentCourseId} />;
      case AppView.MISTAKE_DETAIL:
        return <MistakeDetail onNavigate={navigate} courseId={currentCourseId} viewData={viewData} />;
      case AppView.EXAM_CALENDAR:
        return <ExamCalendar onBack={goBack} courseId={viewData?.courseId} />;
      case AppView.WEAK_POINTS:
        return <WeakPoints onNavigate={navigate} currentCourseId={currentCourseId} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  const showNav = [
    AppView.DASHBOARD,
    AppView.COURSES,
    AppView.ANALYSIS,
    AppView.PRACTICE_LIST,
    AppView.COURSE_DETAIL_STUDY,
    AppView.COURSE_DETAIL_REVIEW,
  ].includes(currentView);

  // 等待认证就绪
  if (!authReady) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl shadow-lg shadow-blue-500/30 mb-4 animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-white/60 text-sm">正在初始化...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Layout>
        {renderView()}
        {showNav && <BottomNav currentView={currentView} onNavigate={navigate} />}
      </Layout>
    </ErrorBoundary>
  );
};

export default App;
