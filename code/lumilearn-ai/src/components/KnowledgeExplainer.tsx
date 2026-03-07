// =====================================================
// KnowledgeExplainer - AI知识点解释展示组件
// 展示AI生成的知识点解释，支持Markdown渲染
// =====================================================

import React, { useState, useEffect } from 'react'
import { Loader2, AlertCircle, RefreshCw, Copy, Check, BookOpen, Lightbulb, Link } from 'lucide-react'
import { explainKnowledgePoint, ExplainKnowledgePointResult, ExplainKnowledgePointBody } from '../api/ai'

interface KnowledgeExplainerProps {
  knowledgePointId: string
  initialStyle?: 'brief' | 'detailed' | 'example'
  className?: string
}

const KnowledgeExplainer: React.FC<KnowledgeExplainerProps> = ({
  knowledgePointId,
  initialStyle = 'detailed',
  className = '',
}) => {
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ExplainKnowledgePointResult | null>(null)
  const [style, setStyle] = useState<'brief' | 'detailed' | 'example'>(initialStyle)
  const [copied, setCopied] = useState(false)
  const [includeRelated, setIncludeRelated] = useState(true)
  const [includeExamples, setIncludeExamples] = useState(true)

  // 加载知识点解释（可指定参数）
  const loadExplanation = async (overrideStyle?: typeof style, overrideRelated?: boolean, overrideExamples?: boolean) => {
    if (!knowledgePointId) return

    setLoading(true)
    setError(null)

    // 使用传入的参数或当前的 state 值
    const currentStyle = overrideStyle ?? style
    const currentRelated = overrideRelated ?? includeRelated
    const currentExamples = overrideExamples ?? includeExamples

    try {
      const body: ExplainKnowledgePointBody = {
        knowledgePointId,
        style: currentStyle,
        includeRelated: currentRelated,
        includeExamples: currentExamples,
      }
      const response = await explainKnowledgePoint(body)

      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || '生成解释失败')
      }
    } catch (err) {
      setError('生成知识点解释失败')
    } finally {
      setLoading(false)
    }
  }

  // 首次加载
  useEffect(() => {
    loadExplanation()
  }, [knowledgePointId])

  // 切换解释风格时重新加载
  const handleStyleChange = async (newStyle: 'brief' | 'detailed' | 'example') => {
    setStyle(newStyle)
    await loadExplanation()
  }

  // 复制内容
  const handleCopy = async () => {
    if (!data) return

    const content = data.explanation
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
        <span className="text-slate-500">生成知识点解释...</span>
      </div>
    )
  }

  // 错误状态
  if (error || !data) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-xl ${className}`}>
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle size={20} />
          <span>{error || '无法生成知识点解释'}</span>
        </div>
        <button
          onClick={loadExplanation}
          className="mt-3 flex items-center space-x-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 text-sm transition-colors"
        >
          <RefreshCw size={14} />
          <span>重试</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
      {/* 标题和控制栏 */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-slate-800 flex items-center space-x-2">
          <BookOpen size={18} className="text-blue-500" />
          <span>知识点解释</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            title="复制"
          >
            {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
          <button
            onClick={loadExplanation}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            title="刷新"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* 解释风格选择 */}
      <div className="mb-4">
        <p className="text-xs text-slate-400 mb-2">解释风格</p>
        <div className="flex space-x-2">
          <button
            onClick={() => handleStyleChange('brief')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              style === 'brief'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            简要
          </button>
          <button
            onClick={() => handleStyleChange('detailed')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              style === 'detailed'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            详细
          </button>
          <button
            onClick={() => handleStyleChange('example')}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              style === 'example'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            示例
          </button>
        </div>
      </div>

      {/* 选项 */}
      <div className="flex space-x-4 mb-4">
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeRelated}
            onChange={(e) => {
              const newValue = e.target.checked
              setIncludeRelated(newValue)
              loadExplanation(style, newValue, includeExamples)
            }}
            className="w-4 h-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">包含关联知识点</span>
        </label>
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeExamples}
            onChange={(e) => {
              const newValue = e.target.checked
              setIncludeExamples(newValue)
              loadExplanation(style, includeRelated, newValue)
            }}
            className="w-4 h-4 text-blue-500 rounded border-slate-300 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-600">包含示例</span>
        </label>
      </div>

      {/* 知识点名称 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <span className="text-sm text-slate-500">当前知识点：</span>
        <span className="ml-2 font-medium text-blue-700">{data.knowledgePoint.name}</span>
      </div>

      {/* 解释内容 */}
      <div className="prose prose-sm max-w-none mb-4">
        <div className="p-4 bg-slate-50 rounded-lg whitespace-pre-wrap text-slate-700 leading-relaxed">
          {data.explanation}
        </div>
      </div>

      {/* 关联知识点 */}
      {includeRelated && data.relatedPoints.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 flex items-center space-x-2 mb-2">
            <Link size={14} className="text-green-500" />
            <span>关联知识点</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.relatedPoints.map((point) => (
              <button
                key={point.id}
                onClick={() => {
                  // 可以触发父组件跳转或更新
                }}
                className="px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
              >
                {point.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 示例 */}
      {includeExamples && data.examples.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 flex items-center space-x-2 mb-2">
            <Lightbulb size={14} className="text-amber-500" />
            <span>示例</span>
          </h4>
          <div className="space-y-3">
            {data.examples.map((example, index) => (
              <div key={index} className="p-3 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-600 mb-1">问题 {index + 1}</p>
                <p className="text-sm text-slate-700 mb-2">{example.question}</p>
                <p className="text-xs text-amber-600 mb-1">答案</p>
                <p className="text-sm text-slate-700">{example.answer}</p>
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

export default KnowledgeExplainer
