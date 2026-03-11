// =====================================================
// ExamCalendar - 备考日历页面
// 三轮复习时间轴、月历视图、进度图表
// =====================================================

import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar, Clock, BookOpen, Target, CheckCircle, Circle, AlertCircle, Flag, RefreshCw } from 'lucide-react'
import { getReviewStatistics, getCourseReview, getTodayReview, generateReviewPlan } from '../src/api/review'
import type { ReviewPlan, DailyReviewPlan, TodayReview, ReviewStatistics, CourseReview } from '../src/types/api'

interface ExamCalendarProps {
  onBack: () => void
  courseId?: string
}

// 三轮复习阶段
type ReviewRound = 'round1' | 'round2' | 'round3'

// 复习轮次配置
const REVIEW_ROUNDS = {
  round1: { name: '第一轮', desc: '全面复习', color: 'bg-blue-500', textColor: 'text-blue-600', borderColor: 'border-blue-200' },
  round2: { name: '第二轮', desc: '重点强化', color: 'bg-orange-500', textColor: 'text-orange-600', borderColor: 'border-orange-200' },
  round3: { name: '第三轮', desc: '冲刺模拟', color: 'bg-red-500', textColor: 'text-red-600', borderColor: 'border-red-200' },
}

const ExamCalendar: React.FC<ExamCalendarProps> = ({ onBack, courseId }) => {
  // 当前月份
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  // 数据状态
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null)
  const [todayReview, setTodayReview] = useState<TodayReview | null>(null)
  const [reviewPlans, setReviewPlans] = useState<ReviewPlan[]>([])
  const [expandedRound, setExpandedRound] = useState<ReviewRound | null>('round1')

  // 选中的复习轮次
  const [selectedRound, setSelectedRound] = useState<ReviewRound>('round1')

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // 获取复习统计
      const statsRes = await getReviewStatistics()
      if (statsRes.success && statsRes.data) {
        setStatistics(statsRes.data)
      }

      // 获取今日复习
      const todayRes = await getTodayReview()
      if (todayRes.success && todayRes.data) {
        setTodayReview(todayRes.data)
      }

      // 生成复习计划（如果需要）
      if (courseId) {
        const planRes = await generateReviewPlan(courseId, 3) // 生成3轮复习计划
        if (planRes.success && planRes.data) {
          setReviewPlans(planRes.data.plans || [])
        }
      }
    } catch (err) {
      setError('加载复习数据失败')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 获取日历数据
  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPadding = firstDay.getDay()
    const daysInMonth = lastDay.getDate()

    const days: Array<{ date: string; day: number; isCurrentMonth: boolean; hasTask: boolean }> = []

    // 上月填充
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startPadding - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i
      const date = new Date(year, month - 1, day).toISOString().split('T')[0]
      days.push({ date, day, isCurrentMonth: false, hasTask: false })
    }

    // 当月天数
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toISOString().split('T')[0]
      // 检查是否有任务
      const hasTask = todayReview?.items.length ? true : false
      days.push({ date, day, isCurrentMonth: true, hasTask })
    }

    // 下月填充
    const remaining = 42 - days.length
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day).toISOString().split('T')[0]
      days.push({ date, day, isCurrentMonth: false, hasTask: false })
    }

    return days
  }

  // 格式化日期
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  // 切换月份
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // 计算进度
  const calculateProgress = (round: ReviewRound): number => {
    if (!statistics) return 0
    switch (round) {
      case 'round1': return statistics.round1Progress || 0
      case 'round2': return statistics.round2Progress || 0
      case 'round3': return statistics.round3Progress || 0
      default: return 0
    }
  }

  // 复习计划数据（优先使用 API 返回的数据）
  const displayPlans = reviewPlans.length > 0 ? reviewPlans : []

  // 渲染进度环形图
  const renderProgressRing = (progress: number, color: string, size: number = 80) => {
    const strokeWidth = 8
    const radius = (size - strokeWidth) / 2
    const circumference = radius * 2 * Math.PI
    const offset = circumference - (progress / 100) * circumference

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
        {/* 中心文字 */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          className="text-sm font-bold fill-slate-700"
        >
          {Math.round(progress)}%
        </text>
      </svg>
    )
  }

  // 获取周几
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  // 加载状态
  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-slate-50">
        <div className="flex items-center justify-center flex-1">
          <div className="flex flex-col items-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
            <span className="text-slate-500">加载中...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg">
            <ArrowLeft size={20} className="text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">备考日历</h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 错误提示 */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-600">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
            <button onClick={fetchData} className="ml-auto text-xs">重试</button>
          </div>
        )}

        {/* 三轮复习进度卡片 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
            <Target size={18} className="text-blue-500" />
            <span>三轮复习进度</span>
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {(Object.keys(REVIEW_ROUNDS) as ReviewRound[]).map((round) => {
              const config = REVIEW_ROUNDS[round]
              const progress = calculateProgress(round)

              return (
                <button
                  key={round}
                  onClick={() => setExpandedRound(expandedRound === round ? null : round)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    expandedRound === round ? config.borderColor : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    {renderProgressRing(progress, round === 'round1' ? '#3b82f6' : round === 'round2' ? '#f97316' : '#ef4444', 70)}
                  </div>
                  <div className={`text-center font-medium ${config.textColor}`}>
                    {config.name}
                  </div>
                  <div className="text-center text-xs text-slate-400 mt-1">
                    {config.desc}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 展开的复习轮次详情 */}
        {expandedRound && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 flex items-center space-x-2">
                <Flag size={16} className={REVIEW_ROUNDS[expandedRound].textColor.replace('text-', 'text-')} />
                <span>{REVIEW_ROUNDS[expandedRound].name} - 复习计划</span>
              </h3>
              <button
                onClick={() => setExpandedRound(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* 复习计划列表 */}
            <div className="space-y-3">
              {displayPlans.map((plan, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                  onClick={() => setSelectedDate(plan.date)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-slate-400" />
                      <span className="text-sm font-medium text-slate-700">{plan.date}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-500">
                      <Clock size={12} />
                      <span>{plan.totalTime}分钟</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {plan.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Circle size={12} className={item.type === 'new' ? 'text-blue-500' : 'text-orange-500'} />
                          <span className="text-slate-600">{item.knowledgePointName}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.priority === 'high' ? 'bg-red-100 text-red-600' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {item.priority === 'high' ? '高优' : item.priority === 'medium' ? '中优' : '低优'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 迷你日历 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <h3 className="font-bold text-slate-800">
              {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
            </h3>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>

          {/* 周几 */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* 日历格子 */}
          <div className="grid grid-cols-7 gap-1">
            {getCalendarDays().map((day, index) => (
              <button
                key={index}
                onClick={() => day.isCurrentMonth && setSelectedDate(day.date)}
                className={`
                  aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                  ${!day.isCurrentMonth ? 'text-slate-300' : 'hover:bg-slate-100'}
                  ${selectedDate === day.date ? 'bg-blue-500 text-white hover:bg-blue-600' : ''}
                  ${day.hasTask && selectedDate !== day.date ? 'bg-blue-50' : ''}
                `}
                disabled={!day.isCurrentMonth}
              >
                <span className={day.hasTask && day.isCurrentMonth ? 'font-bold' : ''}>
                  {day.day}
                </span>
                {day.hasTask && day.isCurrentMonth && (
                  <span className={`w-1 h-1 rounded-full mt-0.5 ${selectedDate === day.date ? 'bg-white' : 'bg-blue-500'}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 今日复习任务 */}
        {todayReview && todayReview.items.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <BookOpen size={18} className="text-green-500" />
              <span>今日复习任务</span>
              <span className="text-xs font-normal text-slate-400 ml-2">
                {todayReview.totalItems}项 / 约{todayReview.totalTime}分钟
              </span>
            </h2>

            <div className="space-y-3">
              {todayReview.items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      item.type === 'new' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {item.type === 'new' ? '新' : '复'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-700">{item.knowledgePointName}</div>
                      <div className="text-xs text-slate-400">{item.reason}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">{item.estimatedTime}分钟</div>
                    <div className="text-xs text-slate-400">掌握度 {item.masteryScore}%</div>
                  </div>
                </div>
              ))}

              {todayReview.items.length > 5 && (
                <button className="w-full text-center text-sm text-blue-500 hover:text-blue-600 py-2">
                  查看更多 ({todayReview.items.length - 5}项)
                </button>
              )}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {!todayReview && !statistics && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Calendar size={32} className="text-slate-400" />
            </div>
            <h3 className="font-medium text-slate-700 mb-2">暂无复习计划</h3>
            <p className="text-sm text-slate-500 mb-4">添加课程后可生成复习计划</p>
            <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600">
              创建复习计划
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExamCalendar
