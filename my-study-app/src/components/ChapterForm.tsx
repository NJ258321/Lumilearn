// =====================================================
// 章节表单组件
// =====================================================

import React, { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import type { Chapter, CreateChapterBody, UpdateChapterBody } from '../types/api'

interface ChapterFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (chapter: Chapter) => void
  initialData?: Chapter
  courseId: string
  isEdit?: boolean
}

const ChapterForm: React.FC<ChapterFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  courseId,
  isEdit = false,
}) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateChapterBody>({
    courseId: courseId || initialData?.courseId || '',
    name: initialData?.name || '',
    order: initialData?.order || 0,
    description: initialData?.description || '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // 表单验证
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '章节名称不能为空'
    } else if (formData.name.length > 100) {
      newErrors.name = '章节名称不能超过100个字符'
    }

    if (formData.order !== undefined && formData.order < 0) {
      newErrors.order = '排序号不能为负数'
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
      // 动态导入避免循环依赖
      const { createChapter, updateChapter } = await import('../api/chapters')

      let result

      if (isEdit && initialData?.id) {
        const body: UpdateChapterBody = {
          name: formData.name,
          order: formData.order,
          description: formData.description,
        }
        result = await updateChapter(initialData.id, body)
      } else {
        result = await createChapter(formData as CreateChapterBody)
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
      name: '',
      order: 0,
      description: '',
    })
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
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">
            {isEdit ? '编辑章节' : '创建章节'}
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

          {/* 章节名称 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              章节名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入章节名称"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* 排序号 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              排序号
            </label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) =>
                setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
              }
              min="0"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.order ? 'border-red-500' : 'border-slate-200'
              }`}
            />
            {errors.order && (
              <p className="mt-1 text-sm text-red-500">{errors.order}</p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              章节描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="请输入章节描述（可选）"
              rows={3}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

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
              {isEdit ? '保存修改' : '创建章节'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChapterForm
