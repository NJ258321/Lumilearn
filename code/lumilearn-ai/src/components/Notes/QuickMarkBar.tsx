// =====================================================
// QuickMarkBar - 快速标记工具栏组件
// 一键快速标记当前时间点为指定类型
// =====================================================

import React, { useState } from 'react';
import { Flag, FileText, HelpCircle, Video, Sparkles, Loader2, Check } from 'lucide-react';
import type { TimeMarkType, TimeMark } from '../../types';
import { createTimeMark } from '../../api/timeMarks';

interface QuickMarkBarProps {
  studyRecordId: string;
  currentTime: number;
  onMarksChange: (marks: TimeMark[]) => void;
  existingMarks: TimeMark[];
}

interface MarkOption {
  type: TimeMarkType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  hoverBg: string;
  borderColor: string;
}

const MARK_OPTIONS: MarkOption[] = [
  {
    type: 'EMPHASIS',
    label: '重点',
    icon: <Flag size={16} />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    hoverBg: 'hover:bg-red-100',
    borderColor: 'border-red-200'
  },
  {
    type: 'NOTE',
    label: '笔记',
    icon: <FileText size={16} />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBg: 'hover:bg-blue-100',
    borderColor: 'border-blue-200'
  },
  {
    type: 'QUESTION',
    label: '疑问',
    icon: <HelpCircle size={16} />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    hoverBg: 'hover:bg-yellow-100',
    borderColor: 'border-yellow-200'
  },
  {
    type: 'BOARD_CHANGE',
    label: '板书',
    icon: <Video size={16} />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    hoverBg: 'hover:bg-purple-100',
    borderColor: 'border-purple-200'
  }
];

const QuickMarkBar: React.FC<QuickMarkBarProps> = ({
  studyRecordId,
  currentTime,
  onMarksChange,
  existingMarks
}) => {
  const [loading, setLoading] = useState<TimeMarkType | null>(null);
  const [success, setSuccess] = useState<TimeMarkType | null>(null);
  const [showAiOption, setShowAiOption] = useState(false);

  // 格式化时间
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 快速标记
  const handleQuickMark = async (type: TimeMarkType) => {
    if (loading) return;

    // 快速标记类型的中文名称
    const typeLabel = {
      'EMPHASIS': '重点',
      'NOTE': '笔记',
      'QUESTION': '疑问',
      'BOARD_CHANGE': '板书'
    }[type] || '标记'

    setLoading(type);
    try {
      // 使用 createTimeMark 创建对应类型的标记，带默认内容
      const defaultContent = `${typeLabel} - ${formatTime(currentTime)}`
      const response = await createTimeMark(studyRecordId, {
        timestamp: Math.floor(currentTime),
        type: type,
        content: defaultContent
      });

      if (response.success && response.data) {
        // 如果返回的是标记对象，添加到列表
        if (response.data.id) {
          onMarksChange([...existingMarks, response.data]);
        }

        setSuccess(type);
        setTimeout(() => setSuccess(null), 1500);
      } else {
        console.error('标记失败:', response.error);
      }
    } catch (err) {
      console.error('标记失败:', err);
    } finally {
      setLoading(null);
    }
  };

  // AI智能标记（预留功能）
  const handleAiMark = async () => {
    if (loading || showAiOption === false) return;
    setLoading('EMPHASIS' as TimeMarkType);

    // TODO: 实现AI智能分析功能
    // 1. 调用AI分析当前时间点的内容
    // 2. 自动判断标记类型
    // 3. 生成摘要

    setTimeout(() => {
      setLoading(null);
      setShowAiOption(false);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      {/* 标题和当前时间 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800">快速标记</span>
        </div>
        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-mono">
          当前: {formatTime(currentTime)}
        </div>
      </div>

      {/* 标记按钮组 */}
      <div className="grid grid-cols-4 gap-3 mb-3">
        {MARK_OPTIONS.map((option) => {
          const isLoading = loading === option.type;
          const isSuccess = success === option.type;

          return (
            <button
              key={option.type}
              onClick={() => handleQuickMark(option.type)}
              disabled={!!loading}
              className={`
                flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 transition-all duration-200
                ${isLoading ? 'opacity-50 cursor-wait' : ''}
                ${isSuccess
                  ? `${option.borderColor} ${option.bgColor}`
                  : `border-transparent ${option.bgColor} ${option.hoverBg} hover:border-slate-200`
                }
              `}
            >
              {isLoading ? (
                <Loader2 size={20} className={`animate-spin ${option.color}`} />
              ) : isSuccess ? (
                <div className={`w-5 h-5 ${option.color} flex items-center justify-center`}>
                  <Check size={16} />
                </div>
              ) : (
                <div className={option.color}>
                  {option.icon}
                </div>
              )}
              <span className={`text-xs font-bold ${option.color}`}>
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* AI智能标记（预留） */}
      <div className="relative">
        <button
          onClick={() => setShowAiOption(!showAiOption)}
          disabled={!!loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:from-blue-600 hover:to-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Sparkles size={16} />
          <span>AI智能分析</span>
        </button>

        {/* AI选项下拉（预留） */}
        {showAiOption && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-lg p-3 z-10">
            <p className="text-xs text-slate-500 text-center mb-3">
              AI智能分析功能正在开发中，敬请期待...
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">自动识别类型</span>
              <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-lg">生成内容摘要</span>
              <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-lg">关联知识点</span>
            </div>
          </div>
        )}
      </div>

      {/* 提示文字 */}
      <p className="text-xs text-slate-400 text-center mt-3">
        点击即可标记当前时刻为对应类型
      </p>
    </div>
  );
};

export default QuickMarkBar;
