// =====================================================
// SmartNoteCard - 智能笔记卡片组件
// 展示笔记内容、类型、时间、关联知识点、AI分析等
// =====================================================

import React, { useState, useMemo } from 'react';
import {
  Flag,
  FileText,
  HelpCircle,
  Video,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Edit3,
  Trash2,
  Sparkles,
  Brain,
  ExternalLink,
  Check,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import type { TimeMark, TimeMarkType } from '../../types';
import { updateTimeMark, deleteTimeMark } from '../../api/timeMarks';

interface SmartNoteCardProps {
  mark: TimeMark;
  currentTime: number;
  isActive: boolean;
  isPast: boolean;
  index: number;
  onSeek: (time: number) => void;
  onUpdate: (mark: TimeMark) => void;
  onDelete: (id: string) => void;
  onAnalyze?: (mark: TimeMark) => void;
}

const MARK_TYPE_CONFIG: Record<TimeMarkType, { icon: React.ReactNode; label: string; color: string; bgColor: string; borderColor: string }> = {
  EMPHASIS: {
    icon: <Flag size={12} />,
    label: '重点',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  NOTE: {
    icon: <FileText size={12} />,
    label: '笔记',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  QUESTION: {
    icon: <HelpCircle size={12} />,
    label: '疑问',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  BOARD_CHANGE: {
    icon: <Video size={12} />,
    label: '板书',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  START: {
    icon: <Clock size={12} />,
    label: '开始',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  END: {
    icon: <Clock size={12} />,
    label: '结束',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  }
};

// 标记类型选项（用于编辑）
const MARK_TYPE_OPTIONS: { value: TimeMarkType; label: string; color: string }[] = [
  { value: 'EMPHASIS', label: '重点', color: 'bg-red-100 text-red-600 border-red-200' },
  { value: 'NOTE', label: '笔记', color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { value: 'QUESTION', label: '疑问', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
  { value: 'BOARD_CHANGE', label: '板书', color: 'bg-purple-100 text-purple-600 border-purple-200' }
];

const SmartNoteCard: React.FC<SmartNoteCardProps> = ({
  mark,
  currentTime,
  isActive,
  isPast,
  index,
  onSeek,
  onUpdate,
  onDelete,
  onAnalyze
}) => {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 编辑状态
  const [editContent, setEditContent] = useState(mark.content || '');
  const [editType, setEditType] = useState<TimeMarkType>(mark.type);

  const config = MARK_TYPE_CONFIG[mark.type as TimeMarkType] || MARK_TYPE_CONFIG.NOTE;

  // 格式化时间
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // 处理编辑保存
  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      setError('内容不能为空');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await updateTimeMark(mark.id, {
        timestamp: mark.timestamp,
        type: editType,
        content: editContent
      });

      if (response.success && response.data) {
        onUpdate(response.data);
        setIsEditing(false);
      } else {
        setError(response.error || '保存失败');
      }
    } catch (err) {
      setError('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 处理删除
  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await deleteTimeMark(mark.id);
      if (response.success) {
        onDelete(mark.id);
      } else {
        setError('删除失败');
      }
    } catch (err) {
      setError('删除失败');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditContent(mark.content || '');
    setEditType(mark.type);
    setIsEditing(false);
    setError(null);
  };

  // 获取内容摘要（用于卡片预览）
  const contentPreview = useMemo(() => {
    const content = mark.content || mark.data?.noteText || '暂无内容';
    return content.length > 80 ? content.substring(0, 80) + '...' : content;
  }, [mark.content, mark.data?.noteText]);

  return (
    <div
      className={`relative rounded-2xl border-2 transition-all duration-300 overflow-hidden ${
        isActive
          ? `${config.borderColor} ${config.bgColor} shadow-md ring-2 ring-offset-1`
          : isPast
          ? 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
          : 'bg-slate-50/50 border-slate-100 opacity-70'
      }`}
    >
      {/* 卡片头部 - 时间戳和类型标签 */}
      <div
        className="flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-3" onClick={() => onSeek(mark.timestamp)}>
          {/* 序号标识 */}
          <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            isActive
              ? 'bg-white shadow-sm'
              : 'bg-slate-200 text-slate-600'
          }`}>
            {index + 1}
          </div>

          {/* 时间戳 */}
          <div className={`flex items-center gap-1 text-sm font-mono ${
            isActive ? config.color : 'text-slate-500'
          }`}>
            <Clock size={14} />
            {formatTime(mark.timestamp)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 类型标签 */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${config.color} ${config.bgColor}`}>
            {config.icon}
            {config.label}
          </div>

          {/* 展开/收起按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center justify-center w-6 h-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            title={isExpanded ? "收起" : "展开"}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* AI分析按钮 - 始终显示在头部右侧 */}
          {onAnalyze && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAnalyze(mark);
              }}
              className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-lg shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all border-2 border-white"
              title="AI智能分析"
            >
              <Sparkles size={14} className="fill-current" />
            </button>
          )}
        </div>
      </div>

      {/* 卡片内容 */}
      <div className="px-4 pb-3">
        {isEditing ? (
          // 编辑模式
          <div className="space-y-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="输入笔记内容..."
            />
            <div className="flex flex-wrap gap-2">
              {MARK_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setEditType(option.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                    editType === option.value
                      ? option.color + ' ring-2 ring-offset-1'
                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {error && (
              <div className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={loading}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                保存
              </button>
            </div>
          </div>
        ) : (
          // 正常显示模式
          <>
            <p className={`text-sm leading-relaxed ${
              isActive ? 'text-slate-800 font-medium' : 'text-slate-600'
            }`}>
              {contentPreview}
            </p>

            {/* 展开/收起按钮 */}
            {(mark.content || mark.data?.noteText || '').length > 80 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="flex items-center gap-1 mt-2 text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={14} />
                    <span>收起</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} />
                    <span>展开全文</span>
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>

      {/* 展开后的AI增强内容 */}
      {!isEditing && isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100/50">
          {/* 关联知识点（预留） */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
              <Brain size={12} />
              <span className="font-medium">关联知识点</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {mark.knowledgePointId ? (
                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-lg">
                  二叉树遍历
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">暂无关联</span>
              )}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Edit3 size={12} />
                <span>编辑</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={12} />
                <span>删除</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">确认删除</h4>
            <p className="text-xs text-slate-500 mb-4">删除后无法恢复</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartNoteCard;
