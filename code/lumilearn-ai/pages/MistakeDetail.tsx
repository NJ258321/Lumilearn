// =====================================================
// P6 - 错题详情页面
// =====================================================

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, BookOpen, Check, X, Lightbulb } from 'lucide-react';
import { AppView } from '../types';
import { getMistakes } from '../src/api/exams';
import type { MistakesResponse } from '../src/types/api';

interface MistakeDetailProps {
  onNavigate: (view: AppView, data?: any) => void;
  courseId?: string | null;
  viewData?: any;
}

const MistakeDetail: React.FC<MistakeDetailProps> = ({ onNavigate, courseId, viewData }) => {
  const [loading, setLoading] = useState(true);
  const [mistakesData, setMistakesData] = useState<MistakesResponse | null>(null);
  const [currentIndex, setCurrentIndex] = useState(viewData?.mistakeIndex ?? 0);

  useEffect(() => {
    const fetchMistakes = async () => {
      setLoading(true);
      try {
        const response = await getMistakes(undefined, courseId || undefined);
        if (response.success && response.data) {
          setMistakesData(response.data);
        }
      } catch (err) {
        console.error('Fetch mistakes error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMistakes();
  }, [courseId]);

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!mistakesData || mistakesData.mistakes.length === 0) {
    return (
      <div className="h-screen w-full bg-slate-50 flex flex-col">
        <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center">
          <button
            onClick={() => onNavigate(AppView.MISTAKES)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3 active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-lg font-black text-slate-800">错题解析</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen size={36} className="text-slate-400" />
          </div>
          <p className="text-base font-bold text-slate-600 mb-1">暂无错题</p>
          <p className="text-sm text-slate-400">去练习中心开始学习吧</p>
        </div>
      </div>
    );
  }

  const currentMistake = mistakesData.mistakes[currentIndex];

  // 解析 userAnswer 和 correctAnswer
  const parseAnswer = (answer: string) => {
    try {
      const parsed = JSON.parse(answer);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch {
      return [answer];
    }
  };

  const userAnswers = parseAnswer(currentMistake.userAnswer);
  const correctAnswers = parseAnswer(currentMistake.correctAnswer);

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < mistakesData.mistakes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => onNavigate(AppView.MISTAKES)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3 active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800">错题解析</h1>
            <p className="text-[10px] text-slate-400">
              {currentIndex + 1} / {mistakesData.mistakes.length}
            </p>
          </div>
        </div>
        {currentMistake.knowledgePointName && (
          <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            {currentMistake.knowledgePointName}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Question */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
          <div className="flex items-center mb-3">
            <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded mr-2">
              错误{currentMistake.wrongCount || 1}次
            </span>
          </div>
          <p className="text-base font-bold text-slate-800 whitespace-pre-wrap">
            {currentMistake.content}
          </p>
        </div>

        {/* Options - 如果有选项 */}
        {currentMistake.options && currentMistake.options.length > 0 ? (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
            <p className="text-sm font-bold text-slate-600 mb-3">选项</p>
            <div className="space-y-2">
              {currentMistake.options.map((option, idx) => {
                // 处理多种选项格式: {key: value}, {optionKey: key, optionValue: value}, 或 string
                let key = '';
                let value = '';
                
                if (typeof option === 'string') {
                  // 格式: "A. 选项内容" 或 "A: 选项内容"
                  const match = option.match(/^([A-Da-d])[:.、\s]\s*(.+)$/);
                  if (match) {
                    key = match[1].toUpperCase();
                    value = match[2];
                  } else {
                    key = String.fromCharCode(65 + idx); // A, B, C...
                    value = option;
                  }
                } else if (option && typeof option === 'object') {
                  // 检查是否是 {optionKey, optionValue} 格式
                  if ('optionKey' in option && 'optionValue' in option) {
                    key = option.optionKey;
                    value = option.optionValue;
                  } else {
                    // 格式: {A: "选项内容"}
                    const keys = Object.keys(option);
                    if (keys.length > 0) {
                      key = keys[0];
                      value = option[key];
                    }
                  }
                }
                
                if (!key) {
                  key = String.fromCharCode(65 + idx);
                }
                
                const isUserAnswer = currentMistake.userAnswer?.toString().includes(key);
                const isCorrect = currentMistake.correctAnswer?.toString().includes(key);

                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm flex items-center ${
                      isCorrect
                        ? 'bg-green-50 border border-green-200'
                        : isUserAnswer
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-slate-50'
                    }`}
                  >
                    <span className="font-bold mr-3">{key}</span>
                    <span className="text-slate-700 flex-1">{value}</span>
                    {isCorrect && <Check size={16} className="text-green-500" />}
                    {isUserAnswer && !isCorrect && (
                      <span className="ml-auto text-red-500 text-xs font-bold">你的答案</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 如果没有选项，显示答案对比 */
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
            <p className="text-sm font-bold text-slate-600 mb-3">答案</p>
            <div className="space-y-2">
              {/* 你的答案 */}
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center mb-1">
                  <X size={14} className="text-red-500 mr-1" />
                  <span className="text-xs font-bold text-red-600">你的答案</span>
                </div>
                <p className="text-sm text-slate-700">{currentMistake.userAnswer}</p>
              </div>

              {/* 正确答案 */}
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center mb-1">
                  <Check size={14} className="text-green-500 mr-1" />
                  <span className="text-xs font-bold text-green-600">正确答案</span>
                </div>
                <p className="text-sm text-slate-700">{currentMistake.correctAnswer}</p>
              </div>
            </div>
          </div>
        )}

        {/* Explanation */}
        {currentMistake.reason && (
          <div className="bg-yellow-50 rounded-2xl p-4 shadow-sm border border-yellow-100 mb-4">
            <div className="flex items-center mb-2">
              <Lightbulb size={16} className="text-yellow-600 mr-2" />
              <span className="text-sm font-bold text-yellow-800">解析</span>
            </div>
            <p className="text-sm text-yellow-800 whitespace-pre-wrap">
              {currentMistake.reason}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${
            currentIndex === 0
              ? 'bg-slate-100 text-slate-300'
              : 'bg-slate-100 text-slate-600 active:scale-95'
          }`}
        >
          上一题
        </button>
        <div className="flex items-center space-x-1">
          {mistakesData.mistakes.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${
                idx === currentIndex ? 'bg-blue-500' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
        <button
          onClick={goToNext}
          disabled={currentIndex === mistakesData.mistakes.length - 1}
          className={`px-4 py-2 rounded-xl text-sm font-bold ${
            currentIndex === mistakesData.mistakes.length - 1
              ? 'bg-slate-100 text-slate-300'
              : 'bg-blue-500 text-white active:scale-95'
          }`}
        >
          下一题
        </button>
      </div>
    </div>
  );
};

export default MistakeDetail;
