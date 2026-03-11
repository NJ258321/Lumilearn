
import React, { useState, useEffect } from 'react';
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
import CourseDetailReview from './pages/CourseDetailReview';
import CourseDetailStudy from './pages/CourseDetailStudy';
import Analysis from './pages/Analysis';
import PracticeList from './pages/PracticeList';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import Exam from './pages/Exam';
import Mistakes from './pages/Mistakes';
import ExamCalendar from './pages/ExamCalendar';
import { AppView } from './types';
import { login, setToken, setUser, getToken, clearToken } from './src/api/auth';

// 默认用户账号
const DEFAULT_USER = {
  email: 'demo@lumilearn.com',
  password: 'demo123456'
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>('c1');
  const [viewData, setViewData] = useState<any>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const navigate = (view: AppView, data?: any) => {
    setCurrentView(view);
    setViewData(data);
    if (data && typeof data === 'string') {
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

  // 自动登录 - 检查本地是否有 token，没有则自动登录默认用户
  useEffect(() => {
    const autoLogin = async () => {
      // 清除可能存在的无效 token，强制重新登录
      // 这样可以确保每次启动都使用最新的有效 token
      const existingToken = getToken();
      console.log('[App] 检查 token:', existingToken ? '已存在' : '不存在');

      // 始终清除旧 token，重新登录获取新 token（更可靠）
      // 这样可以避免 token 过期导致的问题
      if (existingToken) {
        clearToken();
        console.log('[App] 已清除旧 token');
      }

      console.log('[App] 开始自动登录默认用户...');
      console.log('[App] 登录信息:', DEFAULT_USER);
      try {
        const response = await login(DEFAULT_USER);
        console.log('[App] 登录响应:', response);

        if (response.success && response.data && response.token) {
          // 保存 token 和用户信息
          // 注意：token 在 response 层级，不在 response.data 层级
          setToken(response.token);
          setUser(response.data);
          console.log('[App] 自动登录成功, token:', response.token.substring(0, 20) + '...');
        } else {
          console.error('[App] 自动登录失败:', response.error);
        }
      } catch (error) {
        console.error('[App] 自动登录异常:', error);
      } finally {
        setIsAuthLoading(false);
      }
    };

    autoLogin();
  }, []);

  // 如果正在验证登录，显示加载界面
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在初始化...</p>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={navigate} />;
      case AppView.COURSES:
        return <Courses onNavigate={navigate} />;
      case AppView.CHAPTER_MANAGER:
        return <ChapterManager onNavigate={navigate} />;
      case AppView.KNOWLEDGE_MANAGER:
        return <KnowledgeManager onNavigate={navigate} />;
      case AppView.COURSE_DETAIL_REVIEW:
        return <CourseDetailReview onNavigate={navigate} courseId={currentCourseId} />;
      case AppView.COURSE_DETAIL_STUDY:
        return <CourseDetailStudy onNavigate={navigate} courseId={currentCourseId} />;
      case AppView.AGENT:
        return <Agent onBack={() => navigate(AppView.ANALYSIS)} />;
      case AppView.DRILL:
        return <Drill onNavigate={navigate} />;
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
        return <TimeMachine onBack={() => navigate(AppView.DASHBOARD)} recordId={recordId} />;
      case AppView.RECORDER:
        return <Recorder onBack={() => navigate(AppView.DASHBOARD)} initialCourseName={viewData?.courseName} />;
      case AppView.AUTH:
        return <Auth onNavigate={navigate} />;
      case AppView.SETTINGS:
        return <Settings onNavigate={navigate} />;
      case AppView.EXAM:
        return <Exam onNavigate={navigate} examData={viewData} />;
      case AppView.MISTAKES:
        return <Mistakes onNavigate={navigate} />;
      case AppView.EXAM_CALENDAR:
        return <ExamCalendar onBack={() => navigate(AppView.DASHBOARD)} courseId={viewData?.courseId} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  const showNav = [
    AppView.DASHBOARD, 
    AppView.COURSES, 
    AppView.ANALYSIS, 
    AppView.PRACTICE_LIST
  ].includes(currentView);

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
