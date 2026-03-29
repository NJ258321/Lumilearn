// =====================================================
// AIAnalysisPanel - AI分析面板组件
// 展示时间标记的AI分析结果：摘要、知识点、复习建议等
// =====================================================

import React, { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  Sparkles,
  Brain,
  Clock,
  Lightbulb,
  ChevronRight,
  BookOpen,
  Calendar,
  AlertCircle,
  RefreshCw,
  Check,
  ExternalLink,
  Flag,
  FileText,
  HelpCircle,
  Video
} from 'lucide-react';
import { analyzeTimeMark, type TimeMarkAnalysisResponse } from '../../api/timeMarks';
import type { TimeMark, TimeMarkType } from '../../types';

interface AIAnalysisPanelProps {
  mark: TimeMark;
  isOpen: boolean;
  onClose: () => void;
  onSeek: (time: number) => void;
}

const MARK_TYPE_CONFIG: Record<TimeMarkType, { icon: React.ReactNode; label: string; color: string }> = {
  EMPHASIS: { icon: <Flag size={14} />, label: '重点', color: 'text-red-600' },
  NOTE: { icon: <FileText size={14} />, label: '笔记', color: 'text-blue-600' },
  QUESTION: { icon: <HelpCircle size={14} />, label: '疑问', color: 'text-yellow-600' },
  BOARD_CHANGE: { icon: <Video size={14} />, label: '板书', color: 'text-purple-600' },
  START: { icon: <Clock size={14} />, label: '开始', color: 'text-green-600' },
  END: { icon: <Clock size={14} />, label: '结束', color: 'text-slate-600' }
};

const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({
  mark,
  isOpen,
  onClose,
  onSeek
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<TimeMarkAnalysisResponse | null>(null);

  // 当面板打开时自动获取分析
  useEffect(() => {
    if (isOpen && mark?.id) {
      // 首先尝试从标记的 aiAnalysis 字段读取
      if ((mark as any).aiAnalysis) {
        try {
          const parsed = JSON.parse((mark as any).aiAnalysis);
          setAnalysis({
            timeMarkId: mark.id,
            type: mark.type,
            content: mark.content || '',
            analysis: parsed,
            relatedKnowledgePoints: [],
            currentKnowledgePoint: null
          });
          setLoading(false);
        } catch (e) {
          // 解析失败，调用API
          fetchAnalysis();
        }
      } else {
        // 没有预存的AI分析，调用API
        fetchAnalysis();
      }
    }
  }, [isOpen, mark?.id]);

  // 获取AI分析（从API）
  const fetchAnalysis = async () => {
    if (!mark?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await analyzeTimeMark(mark.id);

      if (response.success && response.data) {
        setAnalysis(response.data);
      } else {
        setError(response.error || '分析失败');
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays > 1 && diffDays <= 7) return `${diffDays}天后`;
    if (diffDays < 0) return `${Math.abs(diffDays)}天前`;

    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  if (!isOpen) return null;

  const config = MARK_TYPE_CONFIG[mark.type as TimeMarkType] || MARK_TYPE_CONFIG.NOTE;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
      <div
        className="bg-white w-full max-w-md rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">AI分析</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"
              title="重新分析"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            /* 加载状态 */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 size={24} className="text-blue-600 animate-spin" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">AI正在分析中...</p>
              <p className="text-xs text-slate-400">请稍候</p>
            </div>
          ) : error ? (
            /* 错误状态 */
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <p className="text-sm font-medium text-slate-600 mb-1">{error}</p>
              <button
                onClick={fetchAnalysis}
                className="mt-3 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
              >
                重试
              </button>
            </div>
          ) : analysis ? (
            /* 分析结果 */
            <div className="space-y-4">
              {/* 板书图片显示（如果是板书类型且有图片） */}
              {(mark as any).imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                  <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center gap-2">
                    <Video size={14} className="text-purple-600" />
                    <span className="text-xs font-bold text-slate-700">板书图片</span>
                  </div>
                  <div className="p-3">
                    <img 
                      src={(mark as any).imageUrl.startsWith('http') 
                        ? (mark as any).imageUrl 
                        : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}${(mark as any).imageUrl}`
                      }
                      alt="板书图片"
                      className="w-full rounded-xl object-contain max-h-64"
                      onError={(e) => {
                        console.error('板书图片加载失败:', (mark as any).imageUrl);
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
              
              {/* 标记信息 */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${config.color} bg-white`}>
                  {config.icon}
                  {config.label}
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {(() => {
                    const seconds = Math.floor(mark.timestamp / 1000);
                    return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
                  })()}
                </span>
                <span className="text-sm text-slate-700 truncate flex-1">
                  {mark.content || '暂无内容'}
                </span>
              </div>

              {/* 内容摘要 */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-blue-600" />
                  <span className="text-sm font-bold text-blue-800">内容摘要</span>
                </div>
                <p className="text-sm text-blue-900 leading-relaxed">
                  {analysis.analysis.summary}
                </p>
              </div>

              {/* 关键要点 */}
              {analysis.analysis.keyPoints && analysis.analysis.keyPoints.length > 0 && (
                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb size={14} className="text-yellow-500" />
                    <span className="text-sm font-bold text-slate-800">关键要点</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.analysis.keyPoints.map((point, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="w-5 h-5 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-sm text-slate-700">{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 知识点关联 */}
              <div className="bg-white rounded-2xl p-4 border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={14} className="text-purple-600" />
                  <span className="text-sm font-bold text-slate-800">知识图谱关联</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.analysis.knowledgePoints.map((point, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg border border-purple-200"
                    >
                      {point}
                    </span>
                  ))}
                  {analysis.currentKnowledgePoint && (
                    <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg border border-blue-200 flex items-center gap-1">
                      <BookOpen size={12} />
                      {analysis.currentKnowledgePoint.name}
                    </span>
                  )}
                </div>

                {/* 关联知识点列表 */}
                {analysis.relatedKnowledgePoints && analysis.relatedKnowledgePoints.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500 mb-2">相关知识点</p>
                    <div className="space-y-2">
                      {analysis.relatedKnowledgePoints.slice(0, 3).map((kp) => (
                        <div
                          key={kp.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                        >
                          <span className="text-sm text-slate-700">{kp.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${kp.masteryScore || 70}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{kp.masteryScore || 70}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 复习建议 - 艾宾浩斯曲线 */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-green-600" />
                  <span className="text-sm font-bold text-green-800">复习计划</span>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">艾宾浩斯</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-green-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">1</span>
                      </div>
                      <span className="text-sm text-slate-700">首次复习</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {formatDate(analysis.analysis.reviewSuggestions.firstReview)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-green-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">2</span>
                      </div>
                      <span className="text-sm text-slate-700">二次复习</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {formatDate(analysis.analysis.reviewSuggestions.secondReview)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-green-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-green-600">3</span>
                      </div>
                      <span className="text-sm text-slate-700">巩固复习</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      {formatDate(analysis.analysis.reviewSuggestions.consolidation)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 记忆技巧 */}
              {analysis.analysis.memoryTips && (
                <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={14} className="text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">记忆技巧</span>
                  </div>
                  <p className="text-sm text-amber-900 leading-relaxed">
                    {analysis.analysis.memoryTips}
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* 底部操作栏 */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white rounded-b-3xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSeek(mark.timestamp / 1000)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Clock size={16} />
              跳转播放
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAnalysisPanel;
