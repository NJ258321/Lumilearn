
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
    { icon: Plus, label: '', view: AppView.RECORDER, isSpecial: true },
    { icon: Sparkles, label: '助学', view: AppView.ANALYSIS },
    { icon: Target, label: '练习', view: AppView.PRACTICE_LIST },
  ];

  return (
    <div className="fixed bottom-0 w-full max-w-md h-[70px] z-50 pointer-events-none">
        {/* Background Container */}
        <div className="absolute bottom-0 w-full h-[56px] bg-white border-t border-gray-100 flex items-center justify-around shadow-sm pointer-events-auto">
            {tabs.map((item, index) => {
                const isActive = activeTab === index;
                const isSpecial = item.isSpecial;

                return (
                <button
                    key={index}
                    onClick={() => onNavigate(item.view)}
                    className={`flex flex-col items-center justify-center h-full active:scale-95 transition-transform duration-100 ${isSpecial ? 'w-16' : 'flex-1'}`}
                >
                    {isSpecial ? (
                        <div className="w-12 h-12 rounded-full bg-[#3498DB] shadow-lg flex items-center justify-center -mt-4 border-4 border-white">
                            <Plus size={28} color="white" strokeWidth={3} />
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </button>
                );
            })}
        </div>
    </div>
  );
};

export default BottomNav;
