import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Edit3, Trash2, Save, ChevronRight, ChevronDown, Layers, Loader2, FileText } from 'lucide-react';
import { AppView } from '../types';
import { getCourseList, createCourse, updateCourse, deleteCourse } from '../src/api/courses';
import { getChapterList, createChapter, updateChapter, deleteChapter } from '../src/api/chapters';
import { getKnowledgePointList, createKnowledgePoint, updateKnowledgePoint, deleteKnowledgePoint } from '../src/api/knowledgePoints';
import type { Course } from '../types';

interface CourseManagerProps {
  onNavigate: (view: AppView, data?: any) => void;
}

const COURSE_TYPES = [
  { value: 'PROFESSIONAL', label: '专业课' },
  { value: 'ELECTIVE', label: '选修课' },
  { value: 'PUBLIC', label: '公共课' },
];

const COURSE_STATUS = [
  { value: 'STUDYING', label: '学习中', color: 'blue' },
  { value: 'REVIEWING', label: '复习中', color: 'orange' },
];

const CourseManager: React.FC<CourseManagerProps> = ({ onNavigate }) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingChapter, setEditingChapter] = useState<any>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [chapterKnowledgePoints, setChapterKnowledgePoints] = useState<Record<string, any[]>>({});
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [editingKnowledgePoint, setEditingKnowledgePoint] = useState<any>(null);
  const [tempChapterId, setTempChapterId] = useState<string>('');

  const [courseForm, setCourseForm] = useState({ name: '', description: '', semester: '', type: 'PROFESSIONAL' as any, status: 'STUDYING' as any });
  const [chapterForm, setChapterForm] = useState({ name: '', description: '' });
  const [knowledgeForm, setKnowledgeForm] = useState({ name: '', description: '' });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getCourseList();
      if (response.success && response.data) {
        setCourses(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChapters = useCallback(async (courseId: string) => {
    try {
      const response = await getChapterList({ courseId });
      if (response.success && response.data) {
        setChapters(response.data);
        // 获取每个章节的知识点
        const kpPromises = response.data.map(async (ch: any) => {
          const kpRes = await getKnowledgePointList({ chapterId: ch.id });
          return { chapterId: ch.id, points: kpRes.success && kpRes.data ? kpRes.data : [] };
        });
        const kpResults = await Promise.all(kpPromises);
        const kpMap: Record<string, any[]> = {};
        kpResults.forEach(r => { kpMap[r.chapterId] = r.points; });
        setChapterKnowledgePoints(kpMap);
      }
    } catch (err) {
      console.error('Failed to fetch chapters:', err);
    }
  }, []);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  useEffect(() => {
    if (selectedCourseId) { fetchChapters(selectedCourseId); }
    else { setChapters([]); setChapterKnowledgePoints({}); }
  }, [selectedCourseId, fetchChapters]);

  const openCourseModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setCourseForm({ name: course.name, description: course.description || '', semester: course.semester || '', type: course.type as any, status: course.status as any || 'STUDYING' });
    } else {
      setEditingCourse(null);
      setCourseForm({ name: '', description: '', semester: '', type: 'PROFESSIONAL', status: 'STUDYING' });
    }
    setShowCourseModal(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.name.trim()) return;
    setLoading(true);
    try {
      if (editingCourse) { await updateCourse(editingCourse.id, courseForm); }
      else { await createCourse(courseForm); }
      setShowCourseModal(false);
      fetchCourses();
    } catch (err) { console.error('Failed to save course:', err); }
    finally { setLoading(false); }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('确定要删除这个课程吗？')) return;
    setLoading(true);
    try {
      await deleteCourse(courseId);
      if (selectedCourseId === courseId) setSelectedCourseId(null);
      fetchCourses();
    } catch (err) { console.error('Failed to delete course:', err); }
    finally { setLoading(false); }
  };

  const openChapterModal = (chapter?: any) => {
    if (chapter) {
      setChapterForm({ name: chapter.name, description: chapter.description || '' });
      setChapterForm({ name: chapter.name, description: chapter.description || '' });
    } else {
      setChapterForm({ name: '', description: '' });
      setChapterForm({ name: '', description: '' });
    }
    setShowChapterModal(true);
  };

  const handleSaveChapter = async () => {
    if (!chapterForm.name.trim() || !selectedCourseId) return;
    setLoading(true);
    try {
      if (editingChapter) { await updateChapter(editingChapter.id, chapterForm); }
      else {
        // 计算新章节的order：取当前最大order + 1
        const maxOrder = chapters.reduce((max, ch) => Math.max(max, ch.order || 0), 0);
        await createChapter({ ...chapterForm, courseId: selectedCourseId, order: maxOrder + 1 });
      }
      setShowChapterModal(false);
      fetchChapters(selectedCourseId);
    } catch (err) { console.error('Failed to save chapter:', err); }
    finally { setLoading(false); }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('确定要删除这个章节吗？')) return;
    setLoading(true);
    try {
      await deleteChapter(chapterId);
      if (selectedCourseId) fetchChapters(selectedCourseId);
    } catch (err) { console.error('Failed to delete chapter:', err); }
    finally { setLoading(false); }
  };

  const toggleChapterExpand = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) newExpanded.delete(chapterId);
    else newExpanded.add(chapterId);
    setExpandedChapters(newExpanded);
  };

  const openKnowledgeModal = (chapterId: string, point?: any) => {
    setTempChapterId(chapterId);
    if (point) {
      setEditingKnowledgePoint(point);
      setKnowledgeForm({ name: point.name, description: point.description || '' });
    } else {
      setEditingKnowledgePoint(null);
      setKnowledgeForm({ name: '', description: '' });
    }
    setShowKnowledgeModal(true);
  };

  const handleSaveKnowledgePoint = async () => {
    if (!knowledgeForm.name.trim() || !tempChapterId) return;
    setLoading(true);
    try {
      if (editingKnowledgePoint) { await updateKnowledgePoint(editingKnowledgePoint.id, knowledgeForm); }
      else { await createKnowledgePoint({ ...knowledgeForm, chapterId: tempChapterId }); }
      setShowKnowledgeModal(false);
      if (selectedCourseId) fetchChapters(selectedCourseId);
    } catch (err) { console.error('Failed to save knowledge point:', err); }
    finally { setLoading(false); }
  };

  const handleDeleteKnowledgePoint = async (pointId: string) => {
    if (!confirm('确定要删除这个知识点吗？')) return;
    setLoading(true);
    try {
      await deleteKnowledgePoint(pointId);
      if (selectedCourseId) fetchChapters(selectedCourseId);
    } catch (err) { console.error('Failed to delete knowledge point:', err); }
    finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex-none z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="pt-[40px] pb-3 px-6 flex justify-between items-center">
          <div className="flex items-center">
            <button onClick={() => onNavigate(AppView.COURSES)} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors active:scale-90">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-xl font-black text-[#1F2937] tracking-tight">课程管理</h1>
          </div>
          <button onClick={() => openCourseModal()} className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-bold shadow-lg active:scale-95 transition-transform">
            <Plus size={16} /><span>新增课程</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {loading && courses.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-500" size={32} />
          </div>
        ) : (
          <div className="px-6 py-4">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">课程列表</h2>
              <div className="space-y-2">
                {courses.map((course) => (
                  <div key={course.id} onClick={() => setSelectedCourseId(course.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedCourseId === course.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-800">{course.name}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-400">{course.semester}</span>
                          <span className="text-xs text-gray-300">|</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${course.type === 'PROFESSIONAL' ? 'bg-purple-100 text-purple-600' : course.type === 'ELECTIVE' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            {course.type === 'PROFESSIONAL' ? '专业课' : course.type === 'ELECTIVE' ? '选修课' : '公共课'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${course.status === 'REVIEWING' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {course.status === 'REVIEWING' ? '复习中' : '学习中'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={(e) => { e.stopPropagation(); openCourseModal(course); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteCourse(course.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        <ChevronRight size={20} className="text-gray-300" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedCourseId && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">章节管理 - {courses.find(c => c.id === selectedCourseId)?.name}</h2>
                  <button onClick={() => openChapterModal()} className="flex items-center space-x-1 px-3 py-1.5 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg active:scale-95 transition-transform">
                    <Plus size={14} /><span>新增章节</span>
                  </button>
                </div>
                {chapters.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Layers size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">暂无章节</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chapters.map((chapter) => (
                      <div key={chapter.id} className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => toggleChapterExpand(chapter.id)}>
                          <div className="flex items-center space-x-3">
                            {expandedChapters.has(chapter.id) ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                            <div>
                              <h4 className="text-sm font-bold text-gray-800">第{chapter.order}章 {chapter.name}</h4>
                              {chapter.description && <p className="text-xs text-gray-400 mt-0.5">{chapter.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button onClick={(e) => { e.stopPropagation(); openChapterModal(chapter); }} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"><Edit3 size={14} /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteChapter(chapter.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        {expandedChapters.has(chapter.id) && (
                          <div className="bg-white border-t border-gray-100 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-gray-400 uppercase">知识点</span>
                              <button onClick={() => openKnowledgeModal(chapter.id)} className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                                <Plus size={12} /><span>添加</span>
                              </button>
                            </div>
                            <div className="space-y-2">
                              {(chapterKnowledgePoints[chapter.id] || []).length > 0 ? (chapterKnowledgePoints[chapter.id] || []).map((point: any) => (
                                <div key={point.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-2">
                                    <FileText size={12} className="text-gray-400" />
                                    <span className="text-sm text-gray-700">{point.name}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <button onClick={() => openKnowledgeModal(chapter.id, point)} className="p-1 text-gray-400 hover:text-blue-500 transition-colors"><Edit3 size={12} /></button>
                                    <button onClick={() => handleDeleteKnowledgePoint(point.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={12} /></button>
                                  </div>
                                </div>
                              )) : <p className="text-xs text-gray-400 text-center py-2">暂无知识点</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCourseModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-50 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingCourse ? '编辑课程' : '新增课程'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">课程名称</label>
                <input type="text" value={courseForm.name} onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })} placeholder="请输入课程名称"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">学期</label>
                <input type="text" value={courseForm.semester} onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })} placeholder="如：2024学年第一学期"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">课程类型</label>
                <div className="flex space-x-2">
                  {COURSE_TYPES.map((type) => (
                    <button key={type.value} onClick={() => setCourseForm({ ...courseForm, type: type.value })} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${courseForm.type === type.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">课程状态</label>
                <div className="flex space-x-2">
                  {COURSE_STATUS.map((s) => (
                    <button key={s.value} onClick={() => setCourseForm({ ...courseForm, status: s.value })} className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${courseForm.status === s.value ? (s.color === 'blue' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white') : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">描述</label>
                <textarea value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} placeholder="请输入课程描述（可选）" rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowCourseModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">取消</button>
              <button onClick={handleSaveCourse} disabled={!courseForm.name.trim() || loading} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold disabled:opacity-50">保存</button>
            </div>
          </div>
        </div>
      )}

      {showChapterModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowChapterModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-50 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingChapter ? '编辑章节' : '新增章节'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">章节名称</label>
                <input type="text" value={chapterForm.name} onChange={(e) => setChapterForm({ ...chapterForm, name: e.target.value })} placeholder="请输入章节名称"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">描述</label>
                <textarea value={chapterForm.description} onChange={(e) => setChapterForm({ ...chapterForm, description: e.target.value })} placeholder="请输入章节描述（可选）" rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowChapterModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">取消</button>
              <button onClick={handleSaveChapter} disabled={!chapterForm.name.trim() || loading} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-bold disabled:opacity-50">保存</button>
            </div>
          </div>
        </div>
      )}

      {showKnowledgeModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowKnowledgeModal(false)}></div>
          <div className="bg-white w-full max-w-md rounded-t-[32px] p-6 z-50 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">{editingKnowledgePoint ? '编辑知识点' : '新增知识点'}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">知识点名称</label>
                <input type="text" value={knowledgeForm.name} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, name: e.target.value })} placeholder="请输入知识点名称"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-1">描述</label>
                <textarea value={knowledgeForm.description} onChange={(e) => setKnowledgeForm({ ...knowledgeForm, description: e.target.value })} placeholder="请输入知识点描述（可选）" rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button onClick={() => setShowKnowledgeModal(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">取消</button>
              <button onClick={handleSaveKnowledgePoint} disabled={!knowledgeForm.name.trim() || loading} className="flex-1 py-3 bg-purple-500 text-white rounded-xl font-bold disabled:opacity-50">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManager;
