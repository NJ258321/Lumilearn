// =====================================================
// 知识点列表组件
// =====================================================

import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Filter,
  Target,
  TrendingUp,
  BookOpen,
} from 'lucide-react'
import KnowledgeForm from './KnowledgeForm'
import {
  getKnowledgePointList,
  getWeakPoints,
  deleteKnowledgePoint,
  updateMastery,
  type KnowledgePointListParams,
} from '../api/knowledgePoints'
import type { KnowledgePoint, KnowledgeStatus } from '../types/api'

interface KnowledgeListProps {
  courseId?: string
  chapterId?: string
  showWeakOnly?: boolean
  onSelect?: (knowledgePoint: KnowledgePoint) => void
  selectable?: boolean
}

const STATUS_CONFIG: Record<KnowledgeStatus, { label: string; color: string; bg: string }> = {
  MASTERED: { label: '已掌握', color: 'text-green-600', bg: 'bg-green-100' },
  WEAK: { label: '薄弱点', color: 'text-red-600', bg: 'bg-red-100' },
  NEED_REVIEW: { label: '待复习', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  TODAY_REVIEW: { label: '今日复习', color: 'text-blue-600', bg: 'bg-blue-100' },
}

const KnowledgeList: React.FC<KnowledgeListProps> = ({
  courseId,
  chapterId,
  showWeakOnly = false,
  onSelect,
  selectable = false,
}) => {
  // 状态管理
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 分页状态
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // 表单弹窗状态
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingKnowledge, setEditingKnowledge] = useState<KnowledgePoint | undefined>()

  // 删除/更新状态
  const [processingId, setProcessingId] = useState<string | null>(null)

  // 加载知识点列表
  const loadKnowledgePoints = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: KnowledgePointListParams = {
        page,
        pageSize,
        ...(courseId && { courseId }),
        ...(chapterId && { chapterId }),
        ...(statusFilter && { status: statusFilter }),
        ...(search && { search }),
      }

      const result = showWeakOnly
        ? await getWeakPoints(params)
        : await getKnowledgePointList(params)

      if (result.success && result.data) {
        setKnowledgePoints(result.data.items)
        setTotal(result.data.total)
      } else {
        setError(result.error || '加载失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, courseId, chapterId, statusFilter, search, showWeakOnly])

  // 初始加载 & 依赖变化时重新加载
  useEffect(() => {
    loadKnowledgePoints()
  }, [loadKnowledgePoints])

  // 搜索处理
  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // 创建知识点
  const handleCreate = () => {
    setEditingKnowledge(undefined)
    setIsFormOpen(true)
  }

  // 编辑知识点
  const handleEdit = (knowledgePoint: KnowledgePoint) => {
    setEditingKnowledge(knowledgePoint)
    setIsFormOpen(true)
  }

  // 删除知识点
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个知识点吗？删除后无法恢复。')) {
      return
    }

    setProcessingId(id)

    try {
      const result = await deleteKnowledgePoint(id)

      if (result.success) {
        loadKnowledgePoints()
      } else {
        alert(result.error || '删除失败，请重试')
      }
    } catch (err: any) {
      alert(err.message || '网络错误，请检查网络连接')
    } finally {
      setProcessingId(null)
    }
  }

  // 快速更新掌握度
  const handleUpdateStatus = async (id: string, status: KnowledgeStatus) => {
    setProcessingId(id)

    try {
      const result = await updateMastery(id, { status })

      if (result.success) {
        loadKnowledgePoints()
      } else {
        alert(result.error || '更新失败，请重试')
      }
    } catch (err: any) {
      alert(err.message || '网络错误，请检查网络连接')
    } finally {
      setProcessingId(null)
    }
  }

  // 表单提交成功回调
  const handleFormSuccess = () => {
    loadKnowledgePoints()
  }

  // 选择知识点
  const handleSelect = (knowledgePoint: KnowledgePoint) => {
    if (onSelect) {
      onSelect(knowledgePoint)
    }
  }

  // 计算分页
  const totalPages = Math.ceil(total / pageSize)

  // 状态筛选选项
  const statusOptions = [
    { value: '', label: '全部', icon: BookOpen },
    { value: 'MASTERED', label: '已掌握', icon: TrendingUp },
    { value: 'WEAK', label: '薄弱点', icon: Target },
    { value: 'NEED_REVIEW', label: '待复习', icon: BookOpen },
    { value: 'TODAY_REVIEW', label: '今日复习', icon: Filter },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和筛选栏 */}
      <div className="space-y-3 mb-4">
        {/* 搜索框 */}
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="搜索知识点..."
            className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                setSearch('')
                setPage(1)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* 状态筛选 */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusOptions.map((option) => {
            const Icon = option.icon
            const isActive = statusFilter === option.value
            return (
              <button
                key={option.value}
                onClick={() => {
                  setStatusFilter(option.value)
                  setPage(1)
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon size={14} />
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* 操作栏 */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-500">
          共 {total} 个知识点
        </span>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <Plus size={18} />
          创建知识点
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle size={18} />
          {error}
          <button
            onClick={loadKnowledgePoints}
            className="ml-auto text-blue-600 hover:underline"
          >
            重试
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
          <span className="ml-2 text-slate-500">加载中...</span>
        </div>
      )}

      {/* 知识点列表 */}
      {!loading && (
        <>
          {knowledgePoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <AlertCircle size={48} className="mb-2 opacity-50" />
              <p>暂无知识点数据</p>
              <button
                onClick={handleCreate}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                创建第一个知识点
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {knowledgePoints.map((kp) => {
                  const statusConfig = STATUS_CONFIG[kp.status]
                  return (
                    <div
                      key={kp.id}
                      className={`flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors ${
                        selectable ? 'cursor-pointer' : ''
                      }`}
                      onClick={() => selectable && handleSelect(kp)}
                    >
                      {/* 状态标签 */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>

                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-800 truncate">
                          {kp.name}
                        </h3>
                        {kp.description && (
                          <p className="text-sm text-slate-500 truncate mt-0.5">
                            {kp.description}
                          </p>
                        )}
                      </div>

                      {/* 掌握度进度条 */}
                      {kp.masteryLevel !== undefined && (
                        <div className="w-16">
                          <div className="text-xs text-slate-500 text-center">
                            {kp.masteryLevel}%
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${kp.masteryLevel}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* 操作按钮 */}
                      {!selectable && (
                        <div className="flex items-center gap-1">
                          {/* 快速状态切换 */}
                          <select
                            value={kp.status}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleUpdateStatus(kp.id, e.target.value as KnowledgeStatus)
                            }}
                            disabled={processingId === kp.id}
                            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="MASTERED">已掌握</option>
                            <option value="WEAK">薄弱点</option>
                            <option value="NEED_REVIEW">待复习</option>
                            <option value="TODAY_REVIEW">今日复习</option>
                          </select>

                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(kp)
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="编辑"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(kp.id)
                            }}
                            disabled={processingId === kp.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="删除"
                          >
                            {processingId === kp.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <span className="text-sm text-slate-500">
                共 {total} 条，第 {page}/{totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 知识点表单弹窗 */}
      <KnowledgeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={editingKnowledge}
        courseId={courseId || ''}
        chapterId={chapterId}
        isEdit={!!editingKnowledge}
      />
    </div>
  )
}

export default KnowledgeList
