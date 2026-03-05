// =====================================================
// TimeMarker - 时间标记组件
// 支持添加标记、编辑标记、快速标记重点、Toast 提示
// =====================================================

import React, { useState, useCallback } from 'react'
import { Flag, Edit3, Trash2, X, Check, AlertCircle, Loader2, Plus, Sparkles } from 'lucide-react'
import type { TimeMark, TimeMarkType } from '../../types'
import { createTimeMark, updateTimeMark, deleteTimeMark, quickMarkEmphasis } from '../api/timeMarks'

interface TimeMarkerProps {
  studyRecordId: string
  currentTime: number
  timeMarks: TimeMark[]
  onMarksChange: (marks: TimeMark[]) => void
  onSeekTo: (time: number) => void
}

const MARK_TYPE_OPTIONS: { value: TimeMarkType; label: string; color: string }[] = [
  { value: 'EMPHASIS', label: '重点', color: 'bg-red-100 text-red-600 border-red-200' },
  { value: 'NOTE', label: '笔记', color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { value: 'QUESTION', label: '疑问', color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
  { value: 'BOARD_CHANGE', label: '板书', color: 'bg-purple-100 text-purple-600 border-purple-200' },
]

const TimeMarker: React.FC<TimeMarkerProps> = ({
  studyRecordId,
  currentTime,
  timeMarks,
  onMarksChange,
  onSeekTo,
}) => {
  // State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [editingMark, setEditingMark] = useState<TimeMark | null>(null)

  // Form State
  const [formData, setFormData] = useState({
    timestamp: 0,
    type: 'EMPHASIS' as TimeMarkType,
    noteText: '',
  })

  // Show Toast
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      setError(message)
      setTimeout(() => setError(null), 3000)
    } else {
      setSuccess(message)
      setTimeout(() => setSuccess(null), 2000)
    }
  }

  // Open Add Modal
  const openAddModal = () => {
    setFormData({
      timestamp: Math.floor(currentTime),
      type: 'EMPHASIS',
      noteText: '',
    })
    setShowAddModal(true)
  }

  // Open Edit Modal
  const openEditModal = (mark: TimeMark) => {
    setEditingMark(mark)
    setFormData({
      timestamp: mark.timestamp,
      type: mark.type,
      noteText: mark.data?.noteText || '',
    })
    setShowEditModal(true)
  }

  // Add Time Mark
  const handleAddMark = async () => {
    if (!formData.noteText.trim()) {
      showToast('请输入标记内容', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await createTimeMark(studyRecordId, {
        timestamp: formData.timestamp,
        type: formData.type,
        content: formData.noteText,
      })

      if (response.success && response.data) {
        showToast('标记添加成功')
        setShowAddModal(false)
        onMarksChange([...timeMarks, response.data])
      } else {
        showToast(response.error || '添加失败', 'error')
      }
    } catch (err) {
      showToast('添加失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Update Time Mark
  const handleUpdateMark = async () => {
    if (!editingMark || !formData.noteText.trim()) {
      showToast('请输入标记内容', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await updateTimeMark(editingMark.id, {
        timestamp: formData.timestamp,
        type: formData.type,
        content: formData.noteText,
      })

      if (response.success && response.data) {
        showToast('标记更新成功')
        setShowEditModal(false)
        setEditingMark(null)
        onMarksChange(
          timeMarks.map((m) => (m.id === editingMark.id ? response.data! : m))
        )
      } else {
        showToast(response.error || '更新失败', 'error')
      }
    } catch (err) {
      showToast('更新失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Delete Time Mark
  const handleDeleteMark = async (id: string) => {
    setLoading(true)
    try {
      const response = await deleteTimeMark(id)

      if (response.success) {
        showToast('标记已删除')
        setShowDeleteConfirm(null)
        onMarksChange(timeMarks.filter((m) => m.id !== id))
      } else {
        showToast(response.error || '删除失败', 'error')
      }
    } catch (err) {
      showToast('删除失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Quick Mark Emphasis
  const handleQuickMark = async () => {
    setLoading(true)
    try {
      const response = await quickMarkEmphasis(studyRecordId, Math.floor(currentTime))

      if (response.success && response.data) {
        showToast('已快速标记为重点')
        onMarksChange([...timeMarks, response.data])
      } else {
        showToast(response.error || '标记失败', 'error')
      }
    } catch (err) {
      showToast('标记失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Get type label
  const getTypeLabel = (type: string) => {
    const option = MARK_TYPE_OPTIONS.find((o) => o.value === type)
    return option?.label || type
  }

  // Get type color
  const getTypeColor = (type: string) => {
    const option = MARK_TYPE_OPTIONS.find((o) => o.value === type)
    return option?.color || 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="relative">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-top">
          <AlertCircle size={16} />
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-1 hover:bg-red-600 rounded">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Success Toast */}
      {success && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-in slide-in-from-top">
          <Check size={16} />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Quick Mark Button */}
      <button
        onClick={handleQuickMark}
        disabled={loading}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-full text-red-600 text-xs font-bold hover:bg-red-100 active:scale-95 transition-all disabled:opacity-50"
        title="快速标记当前时刻为重点"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
        <span>快速标记</span>
      </button>

      {/* Add Button */}
      <button
        onClick={openAddModal}
        className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full text-blue-600 text-xs font-bold hover:bg-blue-100 active:scale-95 transition-all"
        title="添加时间标记"
      >
        <Plus size={14} />
        <span>添加标记</span>
      </button>

      {/* Time Marks List */}
      {timeMarks.length > 0 && (
        <div className="mt-3 space-y-2 max-h-[200px] overflow-y-auto">
          {timeMarks
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((mark) => (
              <div
                key={mark.id}
                className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-100 shadow-sm hover:border-blue-200 transition-colors cursor-pointer"
                onClick={() => onSeekTo(mark.timestamp)}
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {formatTime(mark.timestamp)}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${getTypeColor(mark.type)}`}>
                    {getTypeLabel(mark.type)}
                  </span>
                  <span className="text-xs text-slate-600 truncate">
                    {mark.data?.noteText || '-'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 ml-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEditModal(mark)}
                    className="p-1 text-slate-400 hover:text-blue-500"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(mark.id)}
                    className="p-1 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">添加时间标记</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">时间点</label>
                <input
                  type="number"
                  value={formData.timestamp}
                  onChange={(e) => setFormData({ ...formData, timestamp: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">标记类型</label>
                <div className="flex flex-wrap gap-2">
                  {MARK_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, type: option.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        formData.type === option.value
                          ? option.color + ' ring-2 ring-offset-1'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">备注</label>
                <textarea
                  value={formData.noteText}
                  onChange={(e) => setFormData({ ...formData, noteText: e.target.value })}
                  placeholder="请输入标记内容..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleAddMark}
                disabled={loading || !formData.noteText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingMark && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">编辑时间标记</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">时间点</label>
                <input
                  type="number"
                  value={formData.timestamp}
                  onChange={(e) => setFormData({ ...formData, timestamp: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">标记类型</label>
                <div className="flex flex-wrap gap-2">
                  {MARK_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({ ...formData, type: option.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        formData.type === option.value
                          ? option.color + ' ring-2 ring-offset-1'
                          : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">备注</label>
                <textarea
                  value={formData.noteText}
                  onChange={(e) => setFormData({ ...formData, noteText: e.target.value })}
                  placeholder="请输入标记内容..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-5">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={handleUpdateMark}
                disabled={loading || !formData.noteText.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 text-center mb-2">确认删除</h3>
            <p className="text-sm text-slate-500 text-center mb-5">删除后无法恢复，请谨慎操作</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteMark(showDeleteConfirm)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeMarker
