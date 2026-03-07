// =====================================================
// WeakPointAnalysis - AI薄弱点分析展示组件
// 展示AI分析的薄弱点，显示优先级和分析详情
// =====================================================

import React, { useState, useEffect } from 'react'
import { Loader2, AlertCircle, RefreshCw, AlertTriangle, TrendingDown, Clock, BarChart3, ChevronRight, Lightbulb } from 'lucide-react'
import { analyzeWeakPoints, AnalyzeWeakPointsResult, AnalyzeWeakPointsBody, getPriorityLabel, getPriorityColor } from '../api/ai'

interface WeakPointAnalysisProps {
  courseId: string
  className?: string
}

const WeakPointAnalysis: React.FC<WeakPointAnalysisProps> = ({
  courseId,
  className = '',
}) => {
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyzeWeakPointsResult | null>(null)
  const [analyzeDepth, setAnalyzeDepth] = useState<'quick' | 'comprehensive'>('comprehensive')

  // 加载薄弱点分析
  const loadAnalysis = async () => {
    if (!courseId) return

    setLoading(true)
    setError(null)

    try {
      const body: AnalyzeWeakPointsBody = {
        courseId,
        analyzeDepth,
      }
      const response = await analyzeWeakPoints(body)

      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || '分析失败')
      }
    } catch (err) {
      setError('分析薄弱点失败')
    } finally {
      setLoading(false)
    }
  }

  // 首次加载
  useEffect(() => {
    loadAnalysis()
  }, [courseId])

  // 获取掌握度颜色
  const getMasteryColor = (score: number): string => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-amber-600'
    return 'text-red-600'
  }

  // 获取掌握度进度条颜色
  const getMasteryBarColor = (score: number): string => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }

  // 加载中
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 size={24} className="animate-spin text-red-500 mr-2" />
        <span className="text-slate-500">分析薄弱点...</span>
      </div>
    )
  }

  // 错误状态
  if (error || !data) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle size={20} />
          <span>{error || '无法分析薄弱点'}</span>
        </div>

        {/* 参数设置 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-2">分析深度</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setAnalyzeDepth('quick')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  analyzeDepth === 'quick'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                快速分析
              </button>
              <button
                onClick={() => setAnalyzeDepth('comprehensive')}
                className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                  analyzeDepth === 'comprehensive'
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                全面分析
              </button>
            </div>
          </div>

          <button
            onClick={loadAnalysis}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            开始分析
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-800 flex items-center space-x-2">
          <AlertTriangle size={18} className="text-red-500" />
          <span>薄弱点分析</span>
        </h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">
            共 {data.totalKnowledgePoints} 个知识点
          </span>
          <button
            onClick={loadAnalysis}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            title="重新分析"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 薄弱点列表 */}
      {data.weakPoints.length > 0 ? (
        <div className="space-y-4">
          {data.weakPoints.map((weakPoint, index) => (
            <div
              key={index}
              className="p-4 bg-slate-50 rounded-lg border border-slate-100"
            >
              {/* 知识点信息和优先级 */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-slate-700 mb-1">
                    {weakPoint.knowledgePoint.name}
                  </h4>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className={`font-medium ${getMasteryColor(weakPoint.knowledgePoint.masteryScore)}`}>
                      掌握度: {weakPoint.knowledgePoint.masteryScore}%
                    </span>
                    <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(weakPoint.priority)}`}>
                      {getPriorityLabel(weakPoint.priority)}
                    </span>
                  </div>
                </div>
                <button
                  className="p-1.5 hover:bg-slate-200 rounded-lg text-blue-500 transition-colors"
                  title="查看详情"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* 掌握度进度条 */}
              <div className="mb-3">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getMasteryBarColor(weakPoint.knowledgePoint.masteryScore)}`}
                    style={{ width: `${weakPoint.knowledgePoint.masteryScore}%` }}
                  />
                </div>
              </div>

              {/* 分析详情 */}
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div className="flex items-center space-x-1 text-slate-500">
                  <BarChart3 size={12} />
                  <span>错误率: {(weakPoint.analysis.mistakeRate * 100).toFixed(0)}%</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500">
                  <TrendingDown size={12} />
                  <span>漏复习: {weakPoint.analysis.reviewMissCount} 次</span>
                </div>
                <div className="flex items-center space-x-1 text-slate-500">
                  <Clock size={12} />
                  <span>平均用时: {weakPoint.analysis.avgTimeSpent.toFixed(0)} 分钟</span>
                </div>
              </div>

              {/* 错误模式 */}
              {weakPoint.analysis.errorPatterns.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-500 mb-1">错误模式:</p>
                  <div className="flex flex-wrap gap-1">
                    {weakPoint.analysis.errorPatterns.map((pattern, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded"
                      >
                        {pattern}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 建议行动 */}
              <div className="p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600 font-medium mb-1">建议行动</p>
                <p className="text-xs text-slate-600">{weakPoint.suggestedAction}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-slate-500">恭喜！没有发现薄弱点</p>
        </div>
      )}

      {/* 学习洞察 */}
      {data.learningInsights.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 flex items-center space-x-2 mb-3">
            <Lightbulb size={14} className="text-amber-500" />
            <span>学习洞察</span>
          </h4>
          <div className="space-y-2">
            {data.learningInsights.map((insight, index) => (
              <div key={index} className="flex items-start space-x-2 text-xs text-slate-600">
                <span className="text-amber-500 mt-0.5">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 生成时间 */}
      <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400">
        生成时间：{new Date(data.generatedAt).toLocaleString('zh-CN')}
      </div>
    </div>
  )
}

export default WeakPointAnalysis
