
import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChevronRight, PlayCircle, Zap, Trophy, FileText, ChevronLeft, Loader2, AlertCircle, Check, Sparkles } from 'lucide-react';
import { AppView } from '../types';
import { getKnowledgeMastery } from '../src/api/statistics';
import { getMistakes, generateAIQuestions } from '../src/api/exams';
import type { KnowledgeMastery, MistakesResponse } from '../src/types/api';

interface DrillProps {
  onNavigate: (view: AppView, data?: any) => void;
  courseId?: string | null;
}

const Drill: React.FC<DrillProps> = ({ onNavigate, courseId }) => {
  const [mastery, setMastery] = useState<KnowledgeMastery | null>(null);
  const [mistakes, setMistakes] = useState<MistakesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取考点掌握数据和错题数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 获取考点掌握统计
      if (courseId) {
        const masteryRes = await getKnowledgeMastery(courseId);
        if (masteryRes.success && masteryRes.data) {
          setMastery(masteryRes.data);
        }

        // 获取错题数据 - 只获取当前课程的错题
        const mistakesRes = await getMistakes(undefined, courseId);
        if (mistakesRes.success && mistakesRes.data) {
          setMistakes(mistakesRes.data);
        }
      }
    } catch (err) {
      console.error('Fetch drill data error:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 从真实数据构建图表数据
  const masteryData = mastery ? [
    { name: '薄弱', value: mastery.weakPoints, color: '#EF4444' },
    { name: '待巩固', value: mastery.learningPoints, color: '#F59E0B' },
    { name: '已掌握', value: mastery.masteredPoints, color: '#3B82F6' },
  ] : [
    { name: '薄弱', value: 30, color: '#EF4444' },
    { name: '待巩固', value: 35, color: '#F59E0B' },
    { name: '已掌握', value: 35, color: '#3B82F6' },
  ];

  // 计算整体掌握度：使用 masteryRate (0-1) 转换为百分比
  const overallMastery = mastery && mastery.masteryRate !== undefined
    ? Math.round(mastery.masteryRate * 100)
    : (mastery ? Math.round(mastery.masteredPoints / (mastery.totalPoints || 1) * 100) : 72);
  const weakPointsCount = mastery?.weakPoints || 0;

  // AI 生成试卷
  const [generating, setGenerating] = useState(false);

  const handleAIGenerate = async () => {
    if (!courseId) return;

    setGenerating(true);
    try {
      const response = await generateAIQuestions({
        courseId,
        questionCount: 10,
        questionType: 'SINGLE_CHOICE',
        difficulty: 3,
      });

      if (response.success && response.data && response.data.questions.length > 0) {
        onNavigate(AppView.EXAM, {
          type: 'ai-generated',
          questions: response.data.questions,
          courseId,
          title: '智能生成练习',
        });
      } else {
        alert(response.error || '生成题目失败，请稍后重试');
      }
    } catch (err) {
      console.error('AI generate error:', err);
      alert('生成题目失败，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#F4F6F9] font-sans relative overflow-hidden items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-slate-400 mt-2">加载中...</p>
      </div>
    );
  }

  if (!courseId) {
    return (
      <div className="flex flex-col h-full bg-[#F4F6F9] font-sans relative overflow-hidden items-center justify-center">
        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
          <AlertCircle size={20} className="text-slate-400" />
        </div>
        <p className="text-xs font-bold text-slate-400">请先选择课程</p>
        <button
          onClick={() => onNavigate(AppView.PRACTICE_LIST)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg"
        >
          返回练习列表
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F4F6F9] font-sans relative overflow-hidden">
      
      {/* 1. 顶部 Header 区 */}
      <div className="pt-12 pb-4 px-6 flex justify-between items-end bg-gradient-to-b from-white to-[#F4F6F9]">
        <div className="flex items-start space-x-3">
          <button 
            onClick={() => onNavigate(AppView.PRACTICE_LIST)}
            className="mt-1 p-1 bg-slate-100 rounded-full text-slate-500 active:scale-90 transition-transform"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-1">
              {mastery?.courseName || '阶段总结'}
            </h1>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
               <span>查漏补缺</span>
               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
               <span>强化巩固</span>
               <div className="w-1 h-1 rounded-full bg-slate-300"></div>
               <span>见证成效</span>
            </div>
          </div>
        </div>
        <button className="flex items-center space-x-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition-colors active:scale-95">
          <span className="text-xs font-bold">查看报告</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-12 scrollbar-hide space-y-6">
        
        {/* 2. 考点掌握情况卡片 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold text-slate-800">考点掌握情况</h2>
                <ChevronRight size={16} className="text-slate-300" />
            </div>

            <div className="flex items-center">
                {/* 左侧：环形图 */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={masteryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                            >
                                {masteryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* 中心文字 */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <div className="text-2xl font-black text-slate-800 leading-none">{overallMastery}</div>
                        <div className="text-[9px] text-slate-400 transform scale-90 mt-1">整体掌握度</div>
                    </div>
                </div>

                {/* 右侧：列表详情 */}
                <div className="flex-1 pl-6 space-y-3">
                    <div className="flex justify-between items-center text-slate-800">
                        <span className="text-sm font-bold">整体掌握度 <span className="text-xl">{overallMastery}</span><span className="text-emerald-500 text-xs">%</span></span>
                    </div>
                    <div className="space-y-2">
                        {/* 列表项 1 */}
                        <div className="flex items-center justify-between group cursor-pointer active:opacity-70">
                            <div className="flex items-center">
                                <span className="w-4 h-4 rounded flex items-center justify-center bg-red-500 text-white text-[9px] font-bold mr-2">A</span>
                                <span className="text-xs text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">薄弱</span>
                                <span className="text-xs text-red-400 ml-1">重难点</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400 font-bold">{mastery?.weakPoints || 0}个</span>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                         {/* 列表项 2 */}
                        <div className="flex items-center justify-between group cursor-pointer active:opacity-70">
                            <div className="flex items-center">
                                <span className="w-4 h-4 rounded flex items-center justify-center bg-orange-400 text-white text-[9px] font-bold mr-2">C</span>
                                <span className="text-xs text-orange-500 font-bold bg-orange-50 px-1.5 py-0.5 rounded">待巩固</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400 font-bold">{mastery?.learningPoints || 0}个</span>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                         {/* 列表项 3 */}
                        <div className="flex items-center justify-between group cursor-pointer active:opacity-70">
                            <div className="flex items-center">
                                <span className="w-4 h-4 rounded flex items-center justify-center bg-blue-500 text-white text-[9px] font-bold mr-2">B</span>
                                <span className="text-xs text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">已掌握</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-slate-400 font-bold">{mastery?.masteredPoints || 0}个</span>
                                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. 智能组卷与练习 */}
        <div>
            <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-base font-bold text-slate-800">智能组卷与练习</h2>
                <ChevronRight size={16} className="text-slate-300" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {/* 智能生成卡片 */}
                <button
                    onClick={handleAIGenerate}
                    disabled={generating || !courseId}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28 relative overflow-hidden group active:scale-98 transition-transform disabled:opacity-50"
                >
                    <div className="absolute right-[-10px] top-[-10px] w-16 h-16 bg-blue-50 rounded-full z-0 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-3 shadow-sm">
                            {generating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                        </div>
                        <div className="text-left">
                            <div className="font-black text-slate-800 text-sm mb-0.5">
                                {generating ? '生成中...' : '智能生成试卷'}
                            </div>
                            <div className="text-[10px] text-slate-400">基于薄弱点 · 15分钟</div>
                        </div>
                    </div>
                </button>

                {/* 往年真题演练卡片 */}
                <button className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28 relative overflow-hidden group active:scale-98 transition-transform">
                    <div className="absolute right-[-10px] top-[-10px] w-16 h-16 bg-purple-50 rounded-full z-0 group-hover:scale-110 transition-transform"></div>
                    <div className="relative z-10">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-3 shadow-sm">
                            <Trophy size={18} fill="currentColor" />
                        </div>
                        <div className="text-left">
                            <div className="font-black text-slate-800 text-sm mb-0.5">往年真题演练</div>
                            <div className="text-[10px] text-slate-400">2024 真题 · 限时训练</div>
                        </div>
                    </div>
                </button>
            </div>
        </div>

        {/* 4. 错题回顾列表 */}
        <div className="bg-white rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.02)] border border-slate-100 -mx-4 px-6 pt-6 pb-4">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <h2 className="text-base font-bold text-slate-800">错题回顾</h2>
                    {mistakes && mistakes.statistics.total > 0 && (
                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">
                        {mistakes.statistics.total}题
                      </span>
                    )}
                </div>
                <div className="flex items-center space-x-4 text-xs font-bold text-slate-400">
                    <span className="text-blue-500">错因分析</span>
                    <span>专题练</span>
                    <ChevronRight size={14} />
                </div>
            </div>

            <div className="space-y-6">
                {mistakes && mistakes.mistakes.length > 0 ? (
                    mistakes.mistakes.slice(0, 5).map((mistake, index) => (
                        <div
                            key={mistake.questionId || index}
                            onClick={() => onNavigate(AppView.MISTAKE_DETAIL)}
                            className="relative pl-4 border-l-2 border-slate-100 cursor-pointer active:scale-[0.98] transition-transform"
                        >
                            <div className="flex items-start mb-2">
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm mr-2 flex-shrink-0 mt-0.5">错题</span>
                                {mistake.knowledgePointName && (
                                    <div className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded text-center">
                                        {mistake.knowledgePointName}
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <h3 className="text-sm font-bold text-slate-800 mb-2 leading-relaxed">
                                    {mistake.content.substring(0, 50)}...
                                </h3>
                                <p className="text-xs text-slate-500 leading-relaxed mb-2">
                                    您的答案：{mistake.userAnswer}
                                </p>
                                <p className="text-xs text-slate-400 font-mono">
                                    正确答案：{mistake.correctAnswer}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Check size={20} className="text-emerald-500" />
                        </div>
                        <p className="text-xs font-bold text-slate-400">太棒了！暂无错题</p>
                    </div>
                )}
            </div>

            {mistakes && mistakes.mistakes.length > 5 && (
                <button
                    onClick={() => onNavigate(AppView.MISTAKES)}
                    className="w-full mt-6 py-3 text-xs font-bold text-blue-500 flex items-center justify-center space-x-1 active:bg-blue-50 rounded-xl transition-colors"
                >
                    <span>查看全部错题</span>
                    <ChevronRight size={14} />
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Drill;
