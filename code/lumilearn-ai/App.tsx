
import React, { useState } from 'react';
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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [currentCourseId, setCurrentCourseId] = useState<string | null>('c1');
  const [viewData, setViewData] = useState<any>(null);
  const [recordId, setRecordId] = useState<string | null>(null);

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
