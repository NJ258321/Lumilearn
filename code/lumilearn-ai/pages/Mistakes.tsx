// =====================================================
// P6 - 错题本页面
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Loader2, BookOpen, RefreshCw, ChevronRight, Check, Plus, FileQuestion } from 'lucide-react';
import { AppView } from '../types';
import { getMistakes, retryMistakes } from '../src/api/exams';
import type { Mistake, MistakesResponse } from '../src/types/api';

interface MistakesProps {
  onNavigate: (view: AppView, data?: any) => void;
}

const Mistakes: React.FC<MistakesProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [mistakesData, setMistakesData] = useState<MistakesResponse | null>(null);
  const [selectedMistake, setSelectedMistake] = useState<Mistake | null>(null);

  // Fetch mistakes
  const fetchMistakes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getMistakes();
      if (response.success && response.data) {
        setMistakesData(response.data);
      }
    } catch (err) {
      console.error('Fetch mistakes error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMistakes();
  }, [fetchMistakes]);

  // Handle retry mistakes
  const handleRetry = async (knowledgePointId?: string) => {
    try {
      const response = await retryMistakes({ knowledgePointId, count: 10 });
      if (response.success && response.data) {
        // Navigate to exam with these questions
        onNavigate(AppView.EXAM, {
          type: 'session',
          questions: response.data.questions,
          sessionId: response.data.sessionId,
        });
      }
    } catch (err) {
      console.error('Retry mistakes error:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => onNavigate(AppView.PRACTICE_LIST)}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mr-3 active:scale-95 transition-transform"
          >
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-black text-slate-800">错题本</h1>
            <p className="text-[10px] text-slate-400">查漏补缺</p>
          </div>
        </div>
        {mistakesData && mistakesData.statistics.total > 0 && (
          <button
            onClick={() => handleRetry()}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center"
          >
            <RefreshCw size={14} className="mr-1" />
            错题重做
          </button>
        )}
      </div>

      {/* Stats */}
      {mistakesData && (
        <div className="bg-white px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-xl font-black text-red-500">{mistakesData.statistics.total}</p>
              <p className="text-[10px] text-slate-400">总错题数</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-green-500">{mistakesData.statistics.reviewed}</p>
              <p className="text-[10px] text-slate-400">已复习</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-yellow-500">{mistakesData.statistics.notReviewed}</p>
              <p className="text-[10px] text-slate-400">待复习</p>
            </div>
          </div>
        </div>
      )}

      {/* Mistake List */}
      <div className="flex-1 overflow-y-auto p-4">
        {!mistakesData || mistakesData.mistakes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={36} className="text-slate-400" />
            </div>
            <p className="text-base font-bold text-slate-600 mb-1">暂无错题记录</p>
            <p className="text-sm text-slate-400 mb-6">继续保持！说明你掌握得不错</p>
            <button
              onClick={() => onNavigate(AppView.DRILL)}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 active:scale-95 transition-all"
            >
              <Plus size={18} />
              <span>开始练习</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {mistakesData.mistakes.map((mistake, index) => (
              <div
                key={mistake.questionId}
                onClick={() => setSelectedMistake(selectedMistake?.questionId === mistake.questionId ? null : mistake)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded mr-2">
                        错误{mistake.wrongCount}次
                      </span>
                      {mistake.knowledgePointName && (
                        <span className="text-[10px] text-slate-400">
                          {mistake.knowledgePointName}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-slate-800 line-clamp-2">
                      {mistake.content}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-slate-300 transition-transform ${
                      selectedMistake?.questionId === mistake.questionId ? 'rotate-90' : ''
                    }`}
                  />
                </div>

                {/* Expanded Content */}
                {selectedMistake?.questionId === mistake.questionId && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {/* Options */}
                    {mistake.options && (
                      <div className="space-y-2 mb-3">
                        {mistake.options.map((option, idx) => {
                          const key = Object.keys(option)[0];
                          const value = Object.values(option)[0];
                          const isUserAnswer = mistake.userAnswer.includes(key);
                          const isCorrect = mistake.correctAnswer.includes(key);

                          return (
                            <div
                              key={idx}
                              className={`p-2 rounded-lg text-xs flex items-center ${
                                isCorrect
                                  ? 'bg-green-50 border border-green-200'
                                  : isUserAnswer
                                  ? 'bg-red-50 border border-red-200'
                                  : 'bg-slate-50'
                              }`}
                            >
                              <span className="font-bold mr-2">{key}</span>
                              <span className="text-slate-600">{value}</span>
                              {isCorrect && <Check size={12} className="ml-auto text-green-500" />}
                              {isUserAnswer && !isCorrect && (
                                <span className="ml-auto text-red-500 text-[10px]">你的答案</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Action */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRetry(mistake.knowledgePointId);
                      }}
                      className="w-full py-2 bg-blue-50 text-blue-600 text-xs font-bold rounded-xl flex items-center justify-center"
                    >
                      <RefreshCw size={12} className="mr-1" />
                      重新练习
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Mistakes;
