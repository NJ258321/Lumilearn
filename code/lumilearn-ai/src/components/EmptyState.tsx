// =====================================================
// EmptyState - 空状态组件
// 用于各页面的空数据引导
// =====================================================

import React from 'react'
import { ArrowRight, Plus } from 'lucide-react'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      {/* 图标 */}
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <div className="text-slate-400">
          {icon}
        </div>
      </div>

      {/* 标题 */}
      <h3 className="font-bold text-slate-700 mb-2 text-lg">
        {title}
      </h3>

      {/* 描述 */}
      {description && (
        <p className="text-sm text-slate-500 mb-6 max-w-xs">
          {description}
        </p>
      )}

      {/* 操作按钮 */}
      <div className="flex flex-col gap-2">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-100"
          >
            <Plus size={18} />
            <span>{actionLabel}</span>
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="flex items-center justify-center space-x-2 px-6 py-2 text-blue-500 font-medium hover:bg-blue-50 rounded-xl transition-colors"
          >
            <span>{secondaryActionLabel}</span>
            <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

export default EmptyState
