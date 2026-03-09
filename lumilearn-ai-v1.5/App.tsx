
import React, { useState } from 'react';
import Layout from './components/Layout';
import BottomNav from './components/BottomNav';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Agent from './pages/Agent';
import Drill from './pages/Drill';
import TimeMachine from './pages/TimeMachine';
import Recorder from './pages/Recorder';
import CourseDetailReview from './pages/CourseDetailReview';
import CourseDetailStudy from './pages/CourseDetailStudy';
import Analysis from './pages/Analysis';
import PracticeList from './pages/PracticeList';
import { AppView } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentCourseId, setCurrentCourseId] = useState<string | null>(null);

  const navigate = (view: AppView, data?: any) => {
    setCurrentView(view);
    if (data) setCurrentCourseId(data);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={navigate} />;
      case AppView.COURSES:
        return <Courses onNavigate={navigate} />;
      case AppView.COURSE_DETAIL_REVIEW:
        return <CourseDetailReview onNavigate={navigate} />;
      case AppView.COURSE_DETAIL_STUDY:
        return <CourseDetailStudy onNavigate={navigate} />;
      case AppView.AGENT:
        return <Agent onBack={() => navigate(AppView.ANALYSIS)} />;
      case AppView.DRILL:
        return <Drill onNavigate={navigate} />;
      case AppView.PRACTICE_LIST:
        return <PracticeList onNavigate={navigate} />;
      case AppView.ANALYSIS:
        return <Analysis onNavigate={navigate} />;
      case AppView.TIME_MACHINE:
        return <TimeMachine onBack={() => navigate(AppView.DASHBOARD)} />;
      case AppView.RECORDER:
        return <Recorder onBack={() => navigate(AppView.DASHBOARD)} />;
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  };

  // 底部导航栏在主 Tab 页面显示 (移除了 AppView.DRILL)
  const showNav = [
    AppView.DASHBOARD, 
    AppView.COURSES, 
    AppView.ANALYSIS, 
    AppView.PRACTICE_LIST
  ].includes(currentView);

  return (
    <Layout>
      {renderView()}
      {showNav && <BottomNav currentView={currentView} onNavigate={navigate} />}
    </Layout>
  );
};

export default App;
