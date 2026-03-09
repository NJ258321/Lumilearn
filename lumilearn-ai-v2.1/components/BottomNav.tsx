
import React from 'react';
import { Calendar, BookOpen, Sparkles, Target, Plus } from 'lucide-react';
import { AppView } from '../types';
import { COLORS } from '../constants';

interface BottomNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, onNavigate }) => {
  const getActiveTab = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return 0;
      case AppView.COURSES: 
      case AppView.COURSE_DETAIL_REVIEW:
      case AppView.COURSE_DETAIL_STUDY:
        return 1;
      case AppView.RECORDER: return 2;
      case AppView.ANALYSIS: return 3;
      case AppView.PRACTICE_LIST: 
      case AppView.DRILL:
        return 4;
      default: return 0;
    }
  };

  const activeTab = getActiveTab();

  // Tab configuration
  const tabs = [
    { icon: Calendar, label: '今日', view: AppView.DASHBOARD },
    { icon: BookOpen, label: '课程', view: AppView.COURSES },
    { icon: Plus, label: '', view: AppView.RECORDER, isFloating: true },
    { icon: Sparkles, label: '助学', view: AppView.ANALYSIS },
    { icon: Target, label: '练习', view: AppView.PRACTICE_LIST },
  ];

  return (
    <div className="fixed bottom-0 w-full max-w-md h-[70px] z-50 pointer-events-none">
        {/* Background Container - clipped to allow floating button */}
        <div className="absolute bottom-0 w-full h-[56px] bg-white border-t border-gray-100 flex items-center justify-around shadow-sm pointer-events-auto">
            {tabs.map((item, index) => {
                if (item.isFloating) return <div key={index} className="w-12"></div>; // Spacer for center button

                const isActive = activeTab === index;
                return (
                <button
                    key={index}
                    onClick={() => onNavigate(item.view)}
                    className="flex flex-col items-center justify-center w-full h-full active:scale-95 transition-transform duration-100"
                >
                    <item.icon 
                    size={24} 
                    color={isActive ? COLORS.primary : COLORS.textLight} 
                    fill={isActive ? COLORS.primary : 'none'}
                    className="transition-colors duration-300"
                    />
                    <span 
                    className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${isActive ? 'text-blue-500' : 'text-gray-400'}`}
                    >
                    {item.label}
                    </span>
                </button>
                );
            })}
        </div>

        {/* Floating Center Button */}
        <div className="absolute bottom-[20px] left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <button
                onClick={() => onNavigate(AppView.RECORDER)}
                className="w-14 h-14 rounded-full bg-[#3498DB] shadow-lg flex items-center justify-center active:scale-90 transition-all duration-200 border-4 border-[#F7F9FC]"
            >
                <Plus size={32} color="white" strokeWidth={3} />
            </button>
        </div>
    </div>
  );
};

export default BottomNav;
