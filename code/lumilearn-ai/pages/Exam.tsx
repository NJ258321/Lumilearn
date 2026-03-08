// =====================================================
// P6 - 答题页面
// =====================================================

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Clock, Check, X, ChevronLeft, ChevronRight, Loader2, Sparkles, Zap, Target, Trophy } from 'lucide-react';
import { AppView } from '../types';
import { submitAnswer, submitExam, createSession } from '../src/api/exams';
import type { Question, SubmitAnswerResponse, ChallengeMode } from '../src/types/api';

interface ExamProps {
  onNavigate: (view: AppView, data?: any) => void;
  examData?: {
    type: 'daily' | 'challenge' | 'random' | 'session' | 'personalized';
    question?: Question;
    questions?: Question[];
    sessionId?: string;
    courseId?: string;
    mode?: ChallengeMode;
  };
}

const Exam: React.FC<ExamProps> = ({ onNavigate, examData }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<SubmitAnswerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [sessionId, setSessionId] = useState<string | undefined>(examData?.sessionId);

  const questions = examData?.questions || (examData?.question ? [examData.question] : []);
  const currentQuestion = questions[currentIndex];

  // Timer
  useEffect(() => {
    if (!submitted) {
      const timer = setInterval(() => {
        setTimeSpent((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [submitted]);

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get question type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      SINGLE_CHOICE: '单选题',
      MULTIPLE_CHOICE: '多选题',
      TRUE_FALSE: '判断题',
      SHORT_ANSWER: '简答题',
      ESSAY: '论述题',
    };
    return labels[type] || type;
  };

  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    if (submitted) return;

    const questionType = currentQuestion?.type;
    if (questionType === 'MULTIPLE_CHOICE') {
      const current = (selectedAnswer as string[]) || [];
      if (current.includes(answer)) {
        setSelectedAnswer(current.filter((a) => a !== answer));
      } else {
        setSelectedAnswer([...current, answer]);
      }
    } else {
      setSelectedAnswer(answer);
    }
  };

  // Handle submit answer
  const handleSubmitAnswer = async () => {
    if (!currentQuestion || !selectedAnswer) return;

    setLoading(true);
    try {
      // Create session if not exists
      let sid = sessionId;
      if (!sid) {
        const sessionRes = await createSession({
          type: examData?.type === 'daily' ? 'PRACTICE' : 'RANDOM_TEST',
          title: '练习',
          questionIds: questions.map((q) => q.id),
        });
        if (sessionRes.success && sessionRes.data) {
          sid = sessionRes.data.id;
          setSessionId(sid);
        }
      }

      if (!sid) {
        console.error('Failed to create session');
        setLoading(false);
        return;
      }

      const answerStr = Array.isArray(selectedAnswer)
        ? JSON.stringify(selectedAnswer)
        : selectedAnswer;

      const response = await submitAnswer(sid, {
        questionId: currentQuestion.id,
        userAnswer: answerStr,
        timeSpent,
      });

      if (response.success && response.data) {
        setResult(response.data);
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Submit answer error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle next question
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setResult(null);
      setTimeSpent(0);
    }
  };

  // Handle previous question
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedAnswer(null);
      setSubmitted(false);
      setResult(null);
      setTimeSpent(0);
    }
  };

  // Handle finish exam
  const handleFinish = async () => {
    if (sessionId) {
      setLoading(true);
      try {
        await submitExam(sessionId);
      } catch (err) {
        console.error('Submit exam error:', err);
      } finally {
        setLoading(false);
      }
    }
    onNavigate(AppView.PRACTICE_LIST);
  };

  // Get icon for practice type
  const getTypeIcon = () => {
    switch (examData?.type) {
      case 'daily':
        return <Zap size={16} className="text-amber-500" />;
      case 'challenge':
        return <Trophy size={16} className="text-purple-500" />;
      case 'random':
        return <Target size={16} className="text-blue-500" />;
      default:
        return <Sparkles size={16} className="text-blue-500" />;
    }
  };

  // Get title for practice type
  const getTypeTitle = () => {
    switch (examData?.type) {
      case 'daily':
        return '每日一练';
      case 'challenge':
        return '挑战模式';
      case 'random':
        return '随机练习';
      case 'session':
        return '答题练习';
      case 'personalized':
        return '个性化练习';
      default:
        return '练习';
    }
  };

  if (!currentQuestion) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 text-sm">加载题目中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center">
          <button
            onClick={() => onNavigate(AppView.PRACTICE_LIST)}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3 active:scale-95 transition-transform"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <div>
            <div className="flex items-center">
              {getTypeIcon()}
              <span className="text-sm font-bold text-slate-800 ml-1">{getTypeTitle()}</span>
            </div>
            <p className="text-[10px] text-slate-400">
              {currentIndex + 1} / {questions.length}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-slate-500">
            <Clock size={14} className="mr-1" />
            <span className="text-xs font-medium">{formatTime(timeSpent)}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Question Type & Difficulty */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
            {getTypeLabel(currentQuestion.type)}
          </span>
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => (
              <div
                key={level}
                className={`w-2 h-2 rounded-full ${
                  level <= currentQuestion.difficulty
                    ? level <= 3
                      ? 'bg-green-400'
                      : level <= 6
                      ? 'bg-yellow-400'
                      : 'bg-red-400'
                    : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question Content */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
          <h2 className="text-base font-bold text-slate-800 leading-relaxed">
            {currentQuestion.content}
          </h2>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {currentQuestion.options?.map((option, index) => {
            const optionKey = Object.keys(option)[0];
            const optionValue = Object.values(option)[0];
            const isSelected = Array.isArray(selectedAnswer)
              ? selectedAnswer.includes(optionKey)
              : selectedAnswer === optionKey;
            const isCorrect = submitted && result?.correctAnswer === optionKey;
            const isWrong = submitted && isSelected && result?.isCorrect === false;

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(optionKey)}
                disabled={submitted}
                className={`w-full p-3 rounded-xl text-left flex items-center transition-all ${
                  submitted
                    ? isCorrect
                      ? 'bg-green-50 border-2 border-green-500'
                      : isWrong
                      ? 'bg-red-50 border-2 border-red-500'
                      : 'bg-slate-50 border border-slate-200'
                    : isSelected
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-white border border-slate-200 hover:border-blue-300'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mr-3 ${
                    submitted
                      ? isCorrect
                        ? 'bg-green-500 text-white'
                        : isWrong
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-200 text-slate-600'
                      : isSelected
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {submitted ? (
                    isCorrect ? (
                      <Check size={14} />
                    ) : isWrong ? (
                      <X size={14} />
                    ) : (
                      optionKey
                    )
                  ) : (
                    optionKey
                  )}
                </span>
                <span className="text-sm font-medium text-slate-700">{optionValue}</span>
              </button>
            );
          })}
        </div>

        {/* Result & Explanation */}
        {submitted && result && (
          <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <div className={`flex items-center mb-3 ${
              result.isCorrect ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.isCorrect ? (
                <>
                  <Check size={18} className="mr-2" />
                  <span className="text-sm font-bold">回答正确</span>
                </>
              ) : (
                <>
                  <X size={18} className="mr-2" />
                  <span className="text-sm font-bold">回答错误</span>
                </>
              )}
              {result.score && (
                <span className="ml-2 text-xs bg-slate-100 px-2 py-0.5 rounded">
                  +{result.score}分
                </span>
              )}
            </div>
            {currentQuestion.explanation && (
              <div className="text-xs text-slate-600">
                <span className="font-bold">解析：</span>
                {currentQuestion.explanation}
              </div>
            )}
            {result.aiAnalysis && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                <span className="font-bold">AI 分析：</span>
                {result.aiAnalysis}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="bg-white border-t border-slate-200 p-4">
        {!submitted ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={!selectedAnswer || loading}
            className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/30 active:scale-98 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              '提交答案'
            )}
          </button>
        ) : (
          <div className="flex space-x-3">
            {currentIndex > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-bold rounded-xl"
              >
                上一题
              </button>
            )}
            {currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex-1 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl"
              >
                下一题
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 py-3 bg-green-600 text-white text-sm font-bold rounded-xl flex items-center justify-center"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : '完成练习'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Exam;
