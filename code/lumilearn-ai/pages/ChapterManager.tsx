import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, AlertCircle, X, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { AppView, Course, Chapter } from '../types';
import { getCourseList } from '../src/api/courses';
import { getChapterList, createChapter, updateChapter, deleteChapter } from '../src/api/chapters';

interface ChapterManagerProps {
  onNavigate: (view: AppView, data?: any) => void;
}

// 展开/折叠状态
interface ExpandedState {
  [courseId: string]: boolean;
}

// 编辑状态
interface EditingChapter {
  id: string;
  name: string;
  order: number;
  description?: string;
}

const ChapterManager: React.FC<ChapterManagerProps> = ({ onNavigate }) => {
  // 课程列表
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState<string | null>(null);

  // 章节数据 - 按课程ID索引
  const [chaptersMap, setChaptersMap] = useState<{ [courseId: string]: Chapter[] }>({});
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chaptersError, setChaptersError] = useState<string | null>(null);

  // UI状态
  const [expandedCourses, setExpandedCourses] = useState<ExpandedState>({});
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  // 创建章节表单状态
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    order: 1,
    description: ''
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 编辑章节状态
  const [editingChapter, setEditingChapter] = useState<EditingChapter | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // 删除章节状态
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast提示
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 显示Toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 获取课程列表
  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    setCoursesError(null);
    try {
      const response = await getCourseList();
      if (response.success && response.data) {
        setCourses(response.data);
        // 默认展开第一个课程
        if (response.data.length > 0 && !selectedCourseId) {
          setSelectedCourseId(response.data[0].id);
          setExpandedCourses({ [response.data[0].id]: true });
        }
      } else {
        setCoursesError(response.error || '加载课程失败');
      }
    } catch (err) {
      setCoursesError('网络错误，请检查连接');
    } finally {
      setCoursesLoading(false);
    }
  }, [selectedCourseId]);

  // 获取章节列表
  const fetchChapters = useCallback(async (courseId: string) => {
    setChaptersLoading(true);
    setChaptersError(null);
    try {
      const response = await getChapterList({ courseId });
      if (response.success && response.data) {
        setChaptersMap(prev => ({
          ...prev,
          [courseId]: response.data!
        }));
      } else {
        setChaptersError(response.error || '加载章节失败');
      }
    } catch (err) {
      setChaptersError('网络错误，请检查连接');
    } finally {
      setChaptersLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // 课程展开时加载章节
  useEffect(() => {
    const expandedIds = Object.keys(expandedCourses).filter(id => expandedCourses[id]);
    expandedIds.forEach(courseId => {
      if (!chaptersMap[courseId]) {
        fetchChapters(courseId);
      }
    });
  }, [expandedCourses, chaptersMap, fetchChapters]);

  // 切换课程展开状态
  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  // 创建章节
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setCreateError('请先选择课程');
      return;
    }
    if (!createFormData.name.trim()) {
      setCreateError('请输入章节名称');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await createChapter({
        courseId: selectedCourseId,
        name: createFormData.name.trim(),
        order: createFormData.order,
        description: createFormData.description.trim() || undefined
      });

      if (response.success && response.data) {
        showToast('章节创建成功', 'success');
        setCreateFormData({ name: '', order: createFormData.order + 1, description: '' });
        setShowCreateForm(false);
        // 刷新章节列表
        fetchChapters(selectedCourseId);
      } else {
        setCreateError(response.error || '创建失败');
      }
    } catch (err) {
      setCreateError('网络错误，请重试');
    } finally {
      setCreateLoading(false);
    }
  };

  // 开始编辑章节
  const startEdit = (chapter: Chapter) => {
    setEditingChapter({
      id: chapter.id,
      name: chapter.name,
      order: chapter.order,
      description: chapter.description
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingChapter(null);
    setEditError(null);
  };

  // 保存编辑
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter) return;
    if (!editingChapter.name.trim()) {
      setEditError('请输入章节名称');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const response = await updateChapter(editingChapter.id, {
        name: editingChapter.name.trim(),
        order: editingChapter.order,
        description: editingChapter.description?.trim() || undefined
      });

      if (response.success && response.data) {
        showToast('章节更新成功', 'success');
        setEditingChapter(null);
        // 刷新章节列表
        if (selectedCourseId) {
          fetchChapters(selectedCourseId);
        }
      } else {
        setEditError(response.error || '更新失败');
      }
    } catch (err) {
      setEditError('网络错误，请重试');
    } finally {
      setEditLoading(false);
    }
  };

  // 删除章节
  const handleDelete = async (chapterId: string) => {
    if (!confirm('确定要删除这个章节吗？删除后该章节下的知识点也会被删除。')) {
      return;
    }

    setDeletingId(chapterId);
    try {
      const response = await deleteChapter(chapterId);
      if (response.success) {
        showToast('章节删除成功', 'success');
        // 刷新章节列表
        if (selectedCourseId) {
          fetchChapters(selectedCourseId);
        }
      } else {
        showToast(response.error || '删除失败', 'error');
      }
    } catch (err) {
      showToast('网络错误，请重试', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // 渲染加载状态
  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-slate-500 text-sm">加载中...</span>
        </div>
      </div>
    );
  }

  // 渲染错误状态
  if (coursesError) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 gap-4">
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle size={20} />
          <span>{coursesError}</span>
        </div>
        <button
          onClick={fetchCourses}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button
          onClick={() => onNavigate(AppView.COURSES)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h1 className="text-lg font-bold text-slate-800">章节管理</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 课程选择器 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            选择课程
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">请选择课程</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-slate-700">
            章节列表 {selectedCourseId && `(${chaptersMap[selectedCourseId]?.length || 0}个)`}
          </h2>
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={!selectedCourseId}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCourseId
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Plus size={16} />
            新建章节
          </button>
        </div>

        {/* 创建章节表单 */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">新建章节</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                  setCreateFormData({ name: '', order: 1, description: '' });
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">章节名称 *</label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="如：第一章：函数基础"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">排序序号</label>
                    <input
                      type="number"
                      min="1"
                      value={createFormData.order}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">描述（可选）</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="章节描述..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                {createError && (
                  <div className="flex items-center gap-1 text-red-500 text-sm">
                    <AlertCircle size={14} />
                    {createError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setCreateError(null);
                    }}
                    className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    {createLoading && <Loader2 size={14} className="animate-spin" />}
                    创建
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 章节列表 */}
        {!selectedCourseId ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            请先选择课程
          </div>
        ) : chaptersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : chaptersMap[selectedCourseId]?.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            暂无章节，点击"新建章节"添加
          </div>
        ) : (
          <div className="space-y-2">
            {chaptersMap[selectedCourseId]
              ?.sort((a, b) => a.order - b.order)
              .map((chapter) => (
                <div
                  key={chapter.id}
                  className="bg-white rounded-lg shadow-sm border border-slate-200 p-3"
                >
                  {/* 章节内容 - 查看模式 */}
                  {editingChapter?.id !== chapter.id ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <BookOpen size={16} className="text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">#{chapter.order}</span>
                            <span className="font-medium text-slate-800 truncate">
                              {chapter.name}
                            </span>
                          </div>
                          {chapter.description && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {chapter.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(chapter)}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={14} className="text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(chapter.id)}
                          disabled={deletingId === chapter.id}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          {deletingId === chapter.id ? (
                            <Loader2 size={14} className="text-red-500 animate-spin" />
                          ) : (
                            <Trash2 size={14} className="text-red-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 章节内容 - 编辑模式
                    <form onSubmit={handleEdit}>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">章节名称 *</label>
                          <input
                            type="text"
                            value={editingChapter.name}
                            onChange={(e) => setEditingChapter(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="block text-xs text-slate-500 mb-1">排序序号</label>
                            <input
                              type="number"
                              min="1"
                              value={editingChapter.order}
                              onChange={(e) => setEditingChapter(prev => prev ? ({ ...prev, order: parseInt(e.target.value) || 1 }) : null)}
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-slate-500 mb-1">描述（可选）</label>
                          <textarea
                            value={editingChapter.description || ''}
                            onChange={(e) => setEditingChapter(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>

                        {editError && (
                          <div className="flex items-center gap-1 text-red-500 text-sm">
                            <AlertCircle size={14} />
                            {editError}
                          </div>
                        )}

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            取消
                          </button>
                          <button
                            type="submit"
                            disabled={editLoading}
                            className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {editLoading && <Loader2 size={14} className="animate-spin" />}
                            保存
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Toast 提示 */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium animate-fade-in ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ChapterManager;
