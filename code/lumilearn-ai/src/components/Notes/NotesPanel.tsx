// =====================================================
// NotesPanel - 课堂笔记面板容器组件
// 整合筛选、搜索、智能卡片、快速标记等功能
// =====================================================

import React, { useState, useMemo, useRef } from 'react';
import { Search, Plus, BookOpen, Filter, X, ChevronDown } from 'lucide-react';
import type { TimeMark, TimeMarkType } from '../../types';
import SmartNoteCard from './SmartNoteCard';
import QuickMarkBar from './QuickMarkBar';
import AIAnalysisPanel from './AIAnalysisPanel';

interface NotesPanelProps {
  studyRecordId: string;
  currentTime: number;
  timeMarks: TimeMark[];
  onMarksChange: (marks: TimeMark[]) => void;
  onSeek: (time: number) => void;
  onOpenAiPanel?: () => void;
}

type FilterType = '全部' | '重点' | '笔记' | '疑问' | '板书';

const FILTER_MAP: Record<FilterType, TimeMarkType[]> = {
  '全部': [],
  '重点': ['EMPHASIS'],
  '笔记': ['NOTE'],
  '疑问': ['QUESTION'],
  '板书': ['BOARD_CHANGE']
};

const NotesPanel: React.FC<NotesPanelProps> = ({
  studyRecordId,
  currentTime,
  timeMarks,
  onMarksChange,
  onSeek,
  onOpenAiPanel
}) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>('全部');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showQuickMark, setShowQuickMark] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedMarkForAnalysis, setSelectedMarkForAnalysis] = useState<TimeMark | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 筛选后的笔记列表
  const filteredMarks = useMemo(() => {
    let marks = [...timeMarks];

    // 按类型筛选
    if (activeFilter !== '全部') {
      const types = FILTER_MAP[activeFilter];
      marks = marks.filter(mark => types.includes(mark.type as TimeMarkType));
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase();
      marks = marks.filter(mark =>
        (mark.content?.toLowerCase().includes(keyword)) ||
        (mark.data?.noteText?.toLowerCase().includes(keyword))
      );
    }

    // 按时间排序
    return marks.sort((a, b) => a.timestamp - b.timestamp);
  }, [timeMarks, activeFilter, searchKeyword]);

  // 获取当前激活的笔记索引
  const getActiveIndex = useMemo(() => {
    if (filteredMarks.length === 0) return -1;
    for (let i = filteredMarks.length - 1; i >= 0; i--) {
      if (currentTime >= filteredMarks[i].timestamp) {
        return i;
      }
    }
    return -1;
  }, [filteredMarks, currentTime]);

  // 统计各类型数量
  const counts = useMemo(() => {
    return {
      total: timeMarks.length,
      emphasis: timeMarks.filter(m => m.type === 'EMPHASIS').length,
      note: timeMarks.filter(m => m.type === 'NOTE').length,
      question: timeMarks.filter(m => m.type === 'QUESTION').length,
      board: timeMarks.filter(m => m.type === 'BOARD_CHANGE').length
    };
  }, [timeMarks]);

  // 处理标记更新
  const handleMarkUpdate = (updatedMark: TimeMark) => {
    onMarksChange(timeMarks.map(m => m.id === updatedMark.id ? updatedMark : m));
  };

  // 处理标记删除
  const handleMarkDelete = (id: string) => {
    onMarksChange(timeMarks.filter(m => m.id !== id));
  };

  // 筛选选项
  const filterOptions: FilterType[] = ['全部', '重点', '笔记', '疑问', '板书'];

  return (
    <div className="flex flex-col h-full">
      {/* ==================== 头部区域 ==================== */}
      <div className="px-5 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          {/* 标题 */}
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-blue-600" />
            <h3 className="text-base font-bold text-slate-800">课堂笔记</h3>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {counts.total}个标记
            </span>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-2">
            {/* 搜索按钮 */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2 rounded-xl transition-colors ${
                showSearch
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title="搜索笔记"
            >
              <Search size={18} />
            </button>
            {/* 快速标记按钮 */}
            <button
              onClick={() => setShowQuickMark(!showQuickMark)}
              className={`p-2 rounded-xl transition-colors ${
                showQuickMark
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title="快速标记"
            >
              <Plus size={18} />
            </button>
            {onOpenAiPanel && (
              <button
                onClick={onOpenAiPanel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-full hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <span className="text-xs">AI摘要</span>
              </button>
            )}
          </div>
        </div>

        {/* 搜索框 - 默认隐藏，点击搜索按钮展开 */}
        {showSearch && (
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索笔记内容..."
              className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* 筛选标签 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilter === filter
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter}
              <span className="ml-1 text-xs opacity-70">
                {filter === '全部' ? counts.total :
                 filter === '重点' ? counts.emphasis :
                 filter === '笔记' ? counts.note :
                 filter === '疑问' ? counts.question :
                 counts.board}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================== 快速标记工具栏 ==================== */}
      {showQuickMark && (
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
          <QuickMarkBar
            studyRecordId={studyRecordId}
            currentTime={currentTime}
            onMarksChange={onMarksChange}
            existingMarks={timeMarks}
          />
        </div>
      )}

      {/* ==================== 笔记列表区域 ==================== */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
      >
        {filteredMarks.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={28} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              {searchKeyword ? '没有找到匹配的笔记' : '暂无笔记'}
            </p>
            <p className="text-xs text-slate-400">
              {searchKeyword ? '试试其他关键词' : '点击上方"快速标记"添加笔记'}
            </p>
          </div>
        ) : (
          /* 笔记卡片列表 */
          filteredMarks.map((mark, index) => (
            <SmartNoteCard
              key={mark.id || `mark-${index}`}
              mark={mark}
              currentTime={currentTime}
              isActive={index === getActiveIndex}
              isPast={currentTime > mark.timestamp}
              index={index}
              onSeek={onSeek}
              onUpdate={handleMarkUpdate}
              onDelete={handleMarkDelete}
              onAnalyze={(m) => setSelectedMarkForAnalysis(m)}
            />
          ))
        )}
      </div>

      {/* AI分析面板 */}
      {selectedMarkForAnalysis && (
        <AIAnalysisPanel
          mark={selectedMarkForAnalysis}
          isOpen={!!selectedMarkForAnalysis}
          onClose={() => setSelectedMarkForAnalysis(null)}
          onSeek={onSeek}
        />
      )}
    </div>
  );
};

export default NotesPanel;
