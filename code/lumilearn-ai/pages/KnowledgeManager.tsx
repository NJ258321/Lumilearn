import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Loader2, AlertCircle, X, BookOpen, ChevronDown, Filter, CheckCircle, Circle, AlertTriangle, Upload, CheckSquare, Square, Layers } from 'lucide-react';
import { AppView, Course, Chapter, KnowledgePoint, KnowledgeStatus } from '../types';
import { getCourseList } from '../src/api/courses';
import { getChapterList } from '../src/api/chapters';
import { getKnowledgePointList, createKnowledgePoint, updateKnowledgePoint, deleteKnowledgePoint, updateMastery, batchCreateKnowledgePoints, batchUpdateStatus } from '../src/api/knowledgePoints';

interface KnowledgeManagerProps {
  onNavigate: (view: AppView, data?: any) => void;
}

// 状态选项
const STATUS_OPTIONS: { value: KnowledgeStatus; label: string; color: string; bgColor: string }[] = [
  { value: 'MASTERED', label: '已掌握', color: 'text-green-600', bgColor: 'bg-green-50' },
  { value: 'WEAK', label: '薄弱', color: 'text-red-600', bgColor: 'bg-red-50' },
  { value: 'NEED_REVIEW', label: '待复习', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { value: 'TODAY_REVIEW', label: '今日复习', color: 'text-blue-600', bgColor: 'bg-blue-50' },
];

// 编辑状态
interface EditingKnowledge {
  id: string;
  name: string;
  description?: string;
  status: KnowledgeStatus;
}

const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({ onNavigate }) => {
  // 课程列表
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // 章节数据
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  // 知识点数据
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [loading, setLoading] = useState(true);

  // 筛选条件
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<KnowledgeStatus | ''>('');
  const [showWeakOnly, setShowWeakOnly] = useState(false);

  // 创建表单状态
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    description: '',
    status: 'NEED_REVIEW' as KnowledgeStatus,
    importance: 5
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 编辑状态
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingKnowledge | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // 删除状态
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // 批量选择状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  // 批量导入模态框
  const [showBatchImportModal, setShowBatchImportModal] = useState(false);
  const [batchImportText, setBatchImportText] = useState('');
  const [batchImportChapterId, setBatchImportChapterId] = useState<string>('');
  const [batchImportLoading, setBatchImportLoading] = useState(false);

  // 批量更新状态模态框
  const [showBatchStatusModal, setShowBatchStatusModal] = useState(false);
  const [batchNewStatus, setBatchNewStatus] = useState<KnowledgeStatus>('MASTERED');
  const [batchStatusLoading, setBatchStatusLoading] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 获取课程列表
  const fetchCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const response = await getCourseList();
      if (response.success && response.data) {
        setCourses(response.data);
        if (response.data.length > 0) {
          setSelectedCourseId(response.data[0].id);
        }
      }
    } catch (err) {
      showToast('加载课程失败', 'error');
    } finally {
      setCoursesLoading(false);
    }
  }, []);

  // 获取章节列表
  const fetchChapters = useCallback(async (courseId: string) => {
    setChaptersLoading(true);
    try {
      const response = await getChapterList({ courseId });
      if (response.success && response.data) {
        setChapters(response.data);
      }
    } catch (err) {
      showToast('加载章节失败', 'error');
    } finally {
      setChaptersLoading(false);
    }
  }, []);

  // 获取知识点列表
  const fetchKnowledgePoints = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedCourseId) params.courseId = selectedCourseId;
      if (selectedChapterId) params.chapterId = selectedChapterId;
      if (statusFilter) params.status = statusFilter;

      const response = await getKnowledgePointList(params);
      if (response.success && response.data) {
        // 如果需要显示薄弱点，过滤
        let data = response.data;
        if (showWeakOnly) {
          data = data.filter(kp => kp.status === 'WEAK');
        }
        setKnowledgePoints(data);
      } else {
        showToast(response.error || '加载知识点失败', 'error');
      }
    } catch (err) {
      showToast('网络错误', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId, selectedChapterId, statusFilter, showWeakOnly]);

  // 初始加载
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // 课程变化时加载章节
  useEffect(() => {
    if (selectedCourseId) {
      fetchChapters(selectedCourseId);
      setSelectedChapterId('');
    }
  }, [selectedCourseId, fetchChapters]);

  // 筛选条件变化时加载知识点
  useEffect(() => {
    fetchKnowledgePoints();
  }, [fetchKnowledgePoints]);

  // 创建知识点
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChapterId) {
      setCreateError('请先选择章节');
      return;
    }
    if (!createFormData.name.trim()) {
      setCreateError('请输入知识点名称');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await createKnowledgePoint({
        chapterId: selectedChapterId,
        name: createFormData.name.trim(),
        description: createFormData.description.trim() || undefined,
        status: createFormData.status,
        importance: createFormData.importance
      });

      if (response.success && response.data) {
        showToast('知识点创建成功', 'success');
        setCreateFormData({ name: '', description: '', status: 'NEED_REVIEW', importance: 5 });
        setShowCreateForm(false);
        fetchKnowledgePoints();
      } else {
        setCreateError(response.error || '创建失败');
      }
    } catch (err) {
      setCreateError('网络错误，请重试');
    } finally {
      setCreateLoading(false);
    }
  };

  // 开始编辑
  const startEdit = (kp: KnowledgePoint) => {
    setEditingId(kp.id);
    setEditingData({
      id: kp.id,
      name: kp.name,
      description: kp.description,
      status: kp.status
    });
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingId(null);
    setEditingData(null);
    setEditError(null);
  };

  // 保存编辑
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingData) return;
    if (!editingData.name.trim()) {
      setEditError('请输入知识点名称');
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const response = await updateKnowledgePoint(editingData.id, {
        name: editingData.name.trim(),
        description: editingData.description?.trim() || undefined,
        status: editingData.status
      });

      if (response.success && response.data) {
        showToast('知识点更新成功', 'success');
        setEditingId(null);
        setEditingData(null);
        fetchKnowledgePoints();
      } else {
        setEditError(response.error || '更新失败');
      }
    } catch (err) {
      setEditError('网络错误，请重试');
    } finally {
      setEditLoading(false);
    }
  };

  // 删除知识点
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个知识点吗？')) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await deleteKnowledgePoint(id);
      if (response.success) {
        showToast('知识点删除成功', 'success');
        fetchKnowledgePoints();
      } else {
        showToast(response.error || '删除失败', 'error');
      }
    } catch (err) {
      showToast('网络错误', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // 更新掌握度
  const handleStatusChange = async (id: string, status: KnowledgeStatus) => {
    try {
      const response = await updateMastery(id, { status });
      if (response.success && response.data) {
        showToast('状态更新成功', 'success');
        fetchKnowledgePoints();
      } else {
        showToast(response.error || '更新失败', 'error');
      }
    } catch (err) {
      showToast('网络错误', 'error');
    }
  };

  // 批量选择/取消选择
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedIds.size === knowledgePoints.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(knowledgePoints.map(kp => kp.id)));
    }
  };

  // 批量导入知识点
  const handleBatchImport = async () => {
    if (!batchImportChapterId) {
      showToast('请选择章节', 'error');
      return;
    }
    const lines = batchImportText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      showToast('请输入知识点', 'error');
      return;
    }

    setBatchImportLoading(true);
    try {
      const items = lines.map(name => ({
        chapterId: batchImportChapterId,
        name: name.trim(),
        status: 'NEED_REVIEW' as KnowledgeStatus,
        importance: 5
      }));

      const response = await batchCreateKnowledgePoints(items);
      if (response.success) {
        showToast(`成功导入 ${lines.length} 个知识点`, 'success');
        setShowBatchImportModal(false);
        setBatchImportText('');
        fetchKnowledgePoints();
      } else {
        showToast(response.error || '批量导入失败', 'error');
      }
    } catch (err) {
      showToast('网络错误', 'error');
    } finally {
      setBatchImportLoading(false);
    }
  };

  // 批量更新状态
  const handleBatchUpdateStatus = async () => {
    if (selectedIds.size === 0) {
      showToast('请选择要更新的知识点', 'error');
      return;
    }

    setBatchStatusLoading(true);
    try {
      const response = await batchUpdateStatus(Array.from(selectedIds), batchNewStatus);
      if (response.success) {
        showToast(`成功更新 ${selectedIds.size} 个知识点状态`, 'success');
        setShowBatchStatusModal(false);
        setSelectedIds(new Set());
        setIsBatchMode(false);
        fetchKnowledgePoints();
      } else {
        showToast(response.error || '批量更新失败', 'error');
      }
    } catch (err) {
      showToast('网络错误', 'error');
    } finally {
      setBatchStatusLoading(false);
    }
  };

  // 获取状态样式
  const getStatusStyle = (status: KnowledgeStatus) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[2];
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
        <h1 className="text-lg font-bold text-slate-800">知识点管理</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-3 mb-4">
          <div className="flex flex-wrap gap-2">
            {/* 课程选择 */}
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部课程</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>

            {/* 章节选择 */}
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              disabled={!selectedCourseId || chaptersLoading}
              className="flex-1 min-w-[120px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
            >
              <option value="">全部章节</option>
              {chapters.map(chapter => (
                <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
              ))}
            </select>

            {/* 状态筛选 */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as KnowledgeStatus | '')}
              className="flex-1 min-w-[100px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部状态</option>
              {STATUS_OPTIONS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>

          {/* 薄弱点筛选 */}
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => setShowWeakOnly(!showWeakOnly)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                showWeakOnly
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-slate-50 text-slate-600 border border-slate-200'
              }`}
            >
              <AlertTriangle size={14} />
              仅看薄弱点
            </button>
            <span className="text-xs text-slate-400">
              共 {knowledgePoints.length} 个知识点
            </span>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-slate-700">知识点列表</h2>
            {isBatchMode && (
              <span className="text-xs text-slate-400">
                已选 {selectedIds.size} 项
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isBatchMode ? (
              <>
                <button
                  onClick={() => setShowBatchStatusModal(true)}
                  disabled={selectedIds.size === 0}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedIds.size > 0
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Layers size={14} />
                  批量更新状态
                </button>
                <button
                  onClick={() => {
                    setIsBatchMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowBatchImportModal(true)}
                  disabled={!selectedCourseId}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedCourseId
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Upload size={14} />
                  批量导入
                </button>
                <button
                  onClick={() => setIsBatchMode(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  <CheckSquare size={14} />
                  批量选择
                </button>
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
                  新建知识点
                </button>
              </>
            )}
          </div>
        </div>

        {/* 创建表单 */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800">新建知识点</h3>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={16} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreate}>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">所属章节 *</label>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setCreateFormData(prev => prev)}
                    disabled={!selectedCourseId}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择章节</option>
                    {chapters.map(chapter => (
                      <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">知识点名称 *</label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="如：函数定义"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-500 mb-1">描述（可选）</label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="知识点描述..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">初始状态</label>
                    <select
                      value={createFormData.status}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, status: e.target.value as KnowledgeStatus }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUS_OPTIONS.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 mb-1">重要性 (1-10)</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={createFormData.importance}
                      onChange={(e) => setCreateFormData(prev => ({ ...prev, importance: parseInt(e.target.value) || 5 }))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
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
                    onClick={() => setShowCreateForm(false)}
                    className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading || !selectedChapterId}
                    className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {createLoading && <Loader2 size={14} className="animate-spin" />}
                    创建
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 知识点列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : knowledgePoints.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            暂无知识点
          </div>
        ) : (
          <div className="space-y-2">
            {/* 全选按钮（批量模式时显示） */}
            {isBatchMode && knowledgePoints.length > 0 && (
              <div className="flex items-center gap-2 py-2 px-1">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600"
                >
                  {selectedIds.size === knowledgePoints.length ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                  {selectedIds.size === knowledgePoints.length ? '取消全选' : '全选'}
                </button>
              </div>
            )}
            {knowledgePoints.map(kp => {
              const statusStyle = getStatusStyle(kp.status);
              const isEditing = editingId === kp.id;
              const isSelected = selectedIds.has(kp.id);

              return (
                <div
                  key={kp.id}
                  className={`bg-white rounded-lg shadow-sm border p-3 transition-colors ${
                    isBatchMode && isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
                  {/* 查看模式 */}
                  {!isEditing ? (
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* 批量选择框 */}
                        {isBatchMode ? (
                          <button
                            onClick={() => toggleSelect(kp.id)}
                            className="mt-0.5"
                          >
                            {isSelected ? (
                              <CheckSquare size={18} className="text-blue-500" />
                            ) : (
                              <Square size={18} className="text-slate-300" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(kp.id, kp.status === 'MASTERED' ? 'NEED_REVIEW' : 'MASTERED')}
                            className="mt-0.5"
                            title="切换掌握状态"
                          >
                            {kp.status === 'MASTERED' ? (
                              <CheckCircle size={18} className="text-green-500" />
                            ) : (
                              <Circle size={18} className="text-slate-300" />
                            )}
                          </button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-slate-800">{kp.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${statusStyle.bgColor} ${statusStyle.color}`}>
                              {statusStyle.label}
                            </span>
                          </div>
                          {kp.description && (
                            <p className="text-xs text-slate-400 mt-0.5 truncate">{kp.description}</p>
                          )}
                          {kp.chapterId && (
                            <p className="text-[10px] text-slate-300 mt-1">
                              {chapters.find(c => c.id === kp.chapterId)?.name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => startEdit(kp)}
                          className="p-2 hover:bg-slate-100 rounded-lg"
                          title="编辑"
                        >
                          <Edit2 size={14} className="text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(kp.id)}
                          disabled={deletingId === kp.id}
                          className="p-2 hover:bg-red-50 rounded-lg"
                          title="删除"
                        >
                          {deletingId === kp.id ? (
                            <Loader2 size={14} className="text-red-500 animate-spin" />
                          ) : (
                            <Trash2 size={14} className="text-red-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 编辑模式
                    <form onSubmit={handleEdit}>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-slate-500 mb-1">知识点名称 *</label>
                          <input
                            type="text"
                            value={editingData?.name || ''}
                            onChange={(e) => setEditingData(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-500 mb-1">描述</label>
                          <textarea
                            value={editingData?.description || ''}
                            onChange={(e) => setEditingData(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                            rows={2}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-500 mb-1">状态</label>
                          <select
                            value={editingData?.status || 'NEED_REVIEW'}
                            onChange={(e) => setEditingData(prev => prev ? ({ ...prev, status: e.target.value as KnowledgeStatus }) : null)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {STATUS_OPTIONS.map(status => (
                              <option key={status.value} value={status.value}>{status.label}</option>
                            ))}
                          </select>
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
                            className="px-3 py-1.5 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
                          >
                            取消
                          </button>
                          <button
                            type="submit"
                            disabled={editLoading}
                            className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                          >
                            {editLoading && <Loader2 size={14} className="animate-spin" />}
                            保存
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 批量导入模态框 */}
      {showBatchImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-800">批量导入知识点</h3>
              <button
                onClick={() => {
                  setShowBatchImportModal(false);
                  setBatchImportText('');
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">导入到章节 *</label>
                <select
                  value={batchImportChapterId}
                  onChange={(e) => setBatchImportChapterId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">请选择章节</option>
                  {chapters.map(chapter => (
                    <option key={chapter.id} value={chapter.id}>{chapter.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">
                  知识点名称（每行一个）
                </label>
                <textarea
                  value={batchImportText}
                  onChange={(e) => setBatchImportText(e.target.value)}
                  placeholder="函数定义&#10;极限概念&#10;连续性&#10;导数计算"
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  每行一个知识点名称，支持批量添加
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowBatchImportModal(false);
                    setBatchImportText('');
                  }}
                  className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchImport}
                  disabled={batchImportLoading || !batchImportChapterId || !batchImportText.trim()}
                  className="px-4 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {batchImportLoading && <Loader2 size={14} className="animate-spin" />}
                  导入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 批量更新状态模态框 */}
      {showBatchStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-semibold text-slate-800">批量更新状态</h3>
              <button
                onClick={() => setShowBatchStatusModal(false)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                将 <span className="font-medium text-slate-800">{selectedIds.size}</span> 个知识点更新为：
              </p>

              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map(status => (
                  <button
                    key={status.value}
                    onClick={() => setBatchNewStatus(status.value)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                      batchNewStatus === status.value
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowBatchStatusModal(false)}
                  className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={handleBatchUpdateStatus}
                  disabled={batchStatusLoading}
                  className="px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-1"
                >
                  {batchStatusLoading && <Loader2 size={14} className="animate-spin" />}
                  确认更新
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default KnowledgeManager;
