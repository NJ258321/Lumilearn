
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
  const [currentCourseId, setCurrentCourseId] = useState<string | null>('c1');
  const [viewData, setViewData] = useState<any>(null);

  const navigate = (view: AppView, data?: any) => {
    setCurrentView(view);
    setViewData(data);
    if (data && typeof data === 'string') setCurrentCourseId(data);
  };

  const handleCourseChange = (id: string) => {
    setCurrentCourseId(id);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard onNavigate={navigate} />;
      case AppView.COURSES:
        return <Courses onNavigate={navigate} />;
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
        return <TimeMachine onBack={() => navigate(AppView.DASHBOARD)} />;
      case AppView.RECORDER:
        return <Recorder onBack={() => navigate(AppView.DASHBOARD)} initialCourseName={viewData?.courseName} />;
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
    <Layout>
      {renderView()}
      {showNav && <BottomNav currentView={currentView} onNavigate={navigate} />}
    </Layout>
  );
};

export default App;
