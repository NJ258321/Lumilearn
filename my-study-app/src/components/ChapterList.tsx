// =====================================================
// 章节列表组件
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
} from 'lucide-react'
import ChapterForm from './ChapterForm'
import {
  getChapterList,
  deleteChapter,
  type ChapterListParams,
} from '../api/chapters'
import type { Chapter } from '../types/api'

interface ChapterListProps {
  courseId?: string
  onSelect?: (chapter: Chapter) => void
  selectable?: boolean
}

const ChapterList: React.FC<ChapterListProps> = ({
  courseId,
  onSelect,
  selectable = false,
}) => {
  // 状态管理
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 分页状态
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)

  // 搜索状态
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // 表单弹窗状态
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingChapter, setEditingChapter] = useState<Chapter | undefined>()

  // 删除确认状态
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 加载章节列表
  const loadChapters = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params: ChapterListParams = {
        page,
        pageSize,
        ...(courseId && { courseId }),
        ...(search && { search }),
      }

      const result = await getChapterList(params)

      if (result.success && result.data) {
        setChapters(result.data.items)
        setTotal(result.data.total)
      } else {
        setError(result.error || '加载失败，请重试')
      }
    } catch (err: any) {
      setError(err.message || '网络错误，请检查网络连接')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, courseId, search])

  // 初始加载 & 依赖变化时重新加载
  useEffect(() => {
    loadChapters()
  }, [loadChapters])

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

  // 创建章节
  const handleCreate = () => {
    setEditingChapter(undefined)
    setIsFormOpen(true)
  }

  // 编辑章节
  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter)
    setIsFormOpen(true)
  }

  // 删除章节
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个章节吗？删除后无法恢复。')) {
      return
    }

    setDeletingId(id)

    try {
      const result = await deleteChapter(id)

      if (result.success) {
        // 重新加载列表
        loadChapters()
      } else {
        alert(result.error || '删除失败，请重试')
      }
    } catch (err: any) {
      alert(err.message || '网络错误，请检查网络连接')
    } finally {
      setDeletingId(null)
    }
  }

  // 表单提交成功回调
  const handleFormSuccess = (chapter: Chapter) => {
    loadChapters()
  }

  // 选择章节
  const handleSelect = (chapter: Chapter) => {
    if (onSelect) {
      onSelect(chapter)
    }
  }

  // 计算分页
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="flex flex-col h-full">
      {/* 搜索和操作栏 */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="搜索章节名称..."
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

        {/* 创建按钮 */}
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
        >
          <Plus size={18} />
          创建章节
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          <AlertCircle size={18} />
          {error}
          <button
            onClick={loadChapters}
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

      {/* 章节列表 */}
      {!loading && (
        <>
          {chapters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <AlertCircle size={48} className="mb-2 opacity-50" />
              <p>暂无章节数据</p>
              <button
                onClick={handleCreate}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                创建第一个章节
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className={`flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors ${
                      selectable ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => selectable && handleSelect(chapter)}
                  >
                    {/* 排序号 */}
                    <div className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg text-sm font-bold text-slate-600">
                      {chapter.order}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-800 truncate">
                        {chapter.name}
                      </h3>
                      {chapter.description && (
                        <p className="text-sm text-slate-500 truncate mt-0.5">
                          {chapter.description}
                        </p>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    {!selectable && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(chapter)
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(chapter.id)
                          }}
                          disabled={deletingId === chapter.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="删除"
                        >
                          {deletingId === chapter.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
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

      {/* 章节表单弹窗 */}
      <ChapterForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        initialData={editingChapter}
        courseId={courseId || ''}
        isEdit={!!editingChapter}
      />
    </div>
  )
}

export default ChapterList
