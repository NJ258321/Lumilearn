// =====================================================
// 知识点表单组件
// =====================================================

import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { KnowledgePoint, CreateKnowledgePointBody, UpdateKnowledgePointBody, KnowledgeStatus } from '../types/api'

interface KnowledgeFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (knowledgePoint: KnowledgePoint) => void
  initialData?: KnowledgePoint
  courseId: string
  chapterId?: string
  isEdit?: boolean
}

const KNOWLEDGE_STATUS_OPTIONS: { value: KnowledgeStatus; label: string; color: string }[] = [
  { value: 'MASTERED', label: '已掌握', color: 'text-green-600 bg-green-50 border-green-200' },
  { value: 'WEAK', label: '薄弱点', color: 'text-red-600 bg-red-50 border-red-200' },
  { value: 'NEED_REVIEW', label: '待复习', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { value: 'TODAY_REVIEW', label: '今日复习', color: 'text-blue-600 bg-blue-50 border-blue-200' },
]

const KnowledgeForm: React.FC<KnowledgeFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  courseId,
  chapterId,
  isEdit = false,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateKnowledgePointBody>({
    courseId: courseId || initialData?.courseId || '',
    chapterId: chapterId || initialData?.chapterId || '',
    name: initialData?.name || '',
    description: initialData?.description || '',
    status: initialData?.status || 'NEED_REVIEW',
  })

  const [masteryLevel, setMasteryLevel] = useState(initialData?.masteryLevel || 0)

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 表单验证
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '知识点名称不能为空'
    } else if (formData.name.length > 200) {
      newErrors.name = '知识点名称不能超过200个字符'
    }

    if (!formData.courseId) {
      newErrors.courseId = '请选择所属课程'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validate()) return

    setLoading(true)

    try {
      const { createKnowledgePoint, updateKnowledgePoint } = await import('../api/knowledgePoints')

      let result

      if (isEdit && initialData?.id) {
        const body: UpdateKnowledgePointBody = {
          name: formData.name,
          description: formData.description,
          status: formData.status,
          masteryLevel,
        }
        result = await updateKnowledgePoint(initialData.id, body)
      } else {
        result = await createKnowledgePoint(formData)
      }

      if (result.success && result.data) {
        onSuccess(result.data)
        handleClose()
      } else {
        setError(result.error || '操作失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }

  // 重置表单
  const handleClose = () => {
    setFormData({
      courseId: courseId,
      chapterId: chapterId || '',
      name: '',
      description: '',
      status: 'NEED_REVIEW',
    })
    setMasteryLevel(0)
    setErrors({})
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* 表单弹窗 */}
      <div className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? '编辑知识点' : '创建知识点'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 错误提示 */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          {/* 知识点名称 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              知识点名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入知识点名称"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 知识点描述 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              知识点描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入知识点描述（可选）"
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 状态选择 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              掌握状态
            </label>
            <div className="grid grid-cols-2 gap-2">
              {KNOWLEDGE_STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, status: option.value })}
                  className={`px-4 py-2.5 border rounded-lg text-sm font-medium transition-all ${
                    formData.status === option.value
                      ? option.color + ' border-2'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* 掌握程度滑块 */}
          {isEdit && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                掌握程度: {masteryLevel}%
              </label>
              <input
                type="range"
                value={masteryLevel}
                onChange={(e) => setMasteryLevel(parseInt(e.target.value))}
                min="0"
                max="100"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>未掌握</span>
                <span>完全掌握</span>
              </div>
            </div>
          )}

          {/* 提交按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {isEdit ? '保存修改' : '创建知识点'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default KnowledgeForm
