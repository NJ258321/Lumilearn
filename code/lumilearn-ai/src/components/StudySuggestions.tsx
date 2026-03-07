// =====================================================
// StudySuggestions - AI学习建议展示组件
// 展示AI生成的学习建议，显示优先级和具体行动项
// =====================================================

import React, { useState, useEffect } from 'react'
import { Loader2, AlertCircle, RefreshCw, Target, Clock, ChevronRight, Calendar, TrendingUp } from 'lucide-react'
import { generateStudySuggestion, GenerateSuggestionResult, GenerateSuggestionBody, getSuggestionTypeLabel } from '../api/ai'

interface StudySuggestionsProps {
  courseId: string
  className?: string
}

const StudySuggestions: React.FC<StudySuggestionsProps> = ({
  courseId,
  className = '',
}) => {
  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<GenerateSuggestionResult | null>(null)
  // 表单参数
  const [targetGrade, setTargetGrade] = useState<'S' | 'A' | 'B' | 'C'>('A')
  const [daysUntilExam, setDaysUntilExam] = useState(30)
  const [dailyStudyTime, setDailyStudyTime] = useState(120)
  const [focusAreas, setFocusAreas] = useState<Array<'weak_points' | 'high_frequency' | 'important_chapters'>>(['weak_points'])

  // 加载学习建议
  const loadSuggestions = async () => {
    if (!courseId) return

    setLoading(true)
    setError(null)

    try {
      const body: GenerateSuggestionBody = {
        courseId,
        targetGrade,
        daysUntilExam,
        dailyStudyTime,
        focusAreas,
      }
      const response = await generateStudySuggestion(body)

      if (response.success && response.data) {
        setData(response.data)
      } else {
        setError(response.error || '生成建议失败')
      }
    } catch (err) {
      setError('生成学习建议失败')
    } finally {
      setLoading(false)
    }
  }

  // 首次加载
  useEffect(() => {
    loadSuggestions()
  }, [courseId])

  // 切换焦点领域
  const toggleFocusArea = (area: 'weak_points' | 'high_frequency' | 'important_chapters') => {
    setFocusAreas(prev =>
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    )
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: number): string => {
    if (priority === 1) return 'bg-red-100 text-red-600 border-red-200'
    if (priority === 2) return 'bg-amber-100 text-amber-600 border-amber-200'
    return 'bg-green-100 text-green-600 border-green-200'
  }

  // 获取建议类型图标
  const getTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      review: '📖',
      practice: '✏️',
      preview: '🔭',
      rest: '☕',
    }
    return icons[type] || '📌'
  }

  // 加载中
  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <Loader2 size={24} className="animate-spin text-blue-500 mr-2" />
        <span className="text-slate-500">生成学习建议...</span>
      </div>
    )
  }

  // 错误状态
  if (error || !data) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200 p-4 ${className}`}>
        <div className="flex items-center space-x-2 text-red-600 mb-4">
          <AlertCircle size={20} />
          <span>{error || '无法生成学习建议'}</span>
        </div>

        {/* 参数设置 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-600 mb-1">目标成绩</label>
            <select
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value as 'S' | 'A' | 'B' | 'C')}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="S">S - 优秀</option>
              <option value="A">A - 良好</option>
              <option value="B">B - 中等</option>
              <option value="C">C - 及格</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">距离考试天数</label>
            <input
              type="number"
              value={daysUntilExam}
              onChange={(e) => setDaysUntilExam(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              min={1}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-1">每日学习时间（分钟）</label>
            <input
              type="number"
              value={dailyStudyTime}
              onChange={(e) => setDailyStudyTime(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              min={30}
              max={480}
            />
          </div>

          <div>
            <label className="block text-sm text-slate-600 mb-2">重点关注</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={focusAreas.includes('weak_points')}
                  onChange={() => toggleFocusArea('weak_points')}
                  className="w-4 h-4 text-blue-500 rounded"
                />
                <span className="text-sm text-slate-600">薄弱点</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={focusAreas.includes('high_frequency')}
                  onChange={() => toggleFocusArea('high_frequency')}
                  className="w-4 h-4 text-blue-500 rounded"
                />
                <span className="text-sm text-slate-600">高频考点</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={focusAreas.includes('important_chapters')}
                  onChange={() => toggleFocusArea('important_chapters')}
                  className="w-4 h-4 text-blue-500 rounded"
                />
                <span className="text-sm text-slate-600">重点章节</span>
              </label>
            </div>
          </div>

          <button
            onClick={loadSuggestions}
            className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            生成建议
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
          <Target size={18} className="text-blue-500" />
          <span>学习建议</span>
        </h3>
        <button
          onClick={loadSuggestions}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          title="重新生成"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* 课程信息 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <span className="text-sm text-slate-500">课程：</span>
        <span className="ml-2 font-medium text-blue-700">{data.courseName}</span>
      </div>

      {/* 总体评估 */}
      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <h4 className="text-sm font-medium text-slate-700 flex items-center space-x-2 mb-2">
          <TrendingUp size={14} className="text-blue-500" />
          <span>总体评估</span>
        </h4>
        <p className="text-sm text-slate-700">{data.overallAssessment}</p>
      </div>

      {/* 建议列表 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-700 flex items-center space-x-2 mb-3">
          <Target size={14} className="text-red-500" />
          <span>建议行动</span>
        </h4>
        <div className="space-y-3">
          {data.suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                  <span className="font-medium text-sm">{suggestion.title}</span>
                </div>
                <span className="text-xs px-2 py-0.5 bg-white rounded-full">
                  优先级 {suggestion.priority}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-2">{suggestion.reason}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 flex items-center space-x-1">
                  <Clock size={12} />
                  <span>预计 {suggestion.estimatedTime} 分钟</span>
                </span>
                <span className="text-xs text-blue-600 flex items-center space-x-1">
                  <span>{suggestion.action}</span>
                  <ChevronRight size={12} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 学习计划 */}
      {data && Object.keys(data.studyPlan).length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 flex items-center space-x-2 mb-3">
            <Calendar size={14} className="text-green-500" />
            <span>学习计划</span>
          </h4>
          <div className="space-y-3">
            {Object.entries(data.studyPlan).map(([period, tasks]) => (
              <div key={period} className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-600 mb-2">{period}</p>
                <div className="space-y-1">
                  {(tasks as string[]).map((task, index) => (
                    <p key={index} className="text-xs text-slate-500 flex items-start space-x-2">
                      <ChevronRight size={12} className="text-slate-400 mt-0.5 flex-shrink-0" />
                      <span>{task}</span>
                    </p>
                  ))}
                </div>
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

export default StudySuggestions
