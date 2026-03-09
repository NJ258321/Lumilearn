// =====================================================
// ErrorBoundary - React 错误边界组件
// 捕获子组件错误并显示友好的错误界面
// =====================================================

import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, ChevronRight } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

// 全局错误边界
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
            {/* 错误图标 */}
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} className="text-red-500" />
            </div>

            {/* 错误标题 */}
            <h1 className="text-xl font-bold text-slate-800 mb-2">
              出现了一些问题
            </h1>

            {/* 错误描述 */}
            <p className="text-slate-500 mb-6">
              应用程序遇到了意外错误，请尝试刷新页面或返回首页。
            </p>

            {/* 错误详情（开发环境） */}
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-6 p-3 bg-slate-100 rounded-lg text-left">
                <p className="text-xs text-slate-500 font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex flex-col gap-3">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 active:scale-95 transition-all"
              >
                <RefreshCw size={18} />
                <span>刷新页面</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-medium hover:bg-slate-200 active:scale-95 transition-all"
              >
                <Home size={18} />
                <span>返回首页</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
