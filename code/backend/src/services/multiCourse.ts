/**
 * 多学科统筹与任务平摊服务
 * 实现 PLAN-03: 多学科统筹
 * 实现 PLAN-04: 任务智能平摊
 */

import prisma from '../lib/prisma.js'

// ==================== PLAN-03: 多学科统筹类型 ====================

export interface MultiCourseRequest {
  courseIds: string[]
  dailyStudyHours: number
  examDates?: Record<string, string>
  preferences?: {
    prioritizeWeaker?: boolean
    prioritizeExamDate?: boolean
    morningCourse?: string
    eveningCourse?: string
  }
}

export interface MultiCourseResult {
  allocation: CourseAllocation[]
  dailySchedule: DailyMultiCourseSchedule[]
  statistics: MultiCourseStatistics
  recommendations: string[]
}

export interface CourseAllocation {
  courseId: string
  courseName: string
  dailyHours: number
  priority: 'high' | 'medium' | 'low'
  urgencyScore: number
  knowledgePoints: {
    total: number
    weak: number
    medium: number
    mastered: number
  }
  examDate?: string
  daysUntilExam: number
}

export interface DailyMultiCourseSchedule {
  date: string
  dayOfWeek: string
  sessions: MultiCourseSession[]
  totalHours: number
}

export interface MultiCourseSession {
  timeSlot: string
  courseId: string
  courseName: string
  activity: string
  duration: number
}

export interface MultiCourseStatistics {
  totalCourses: number
  totalKnowledgePoints: number
  totalDailyHours: number
  averageCourseHours: number
  highPriorityCourses: number
}

// ==================== PLAN-04: 任务智能平摊类型 ====================

export interface TaskBalanceRequest {
  courseId?: string
  daysAhead?: number
  maxDailyTasks?: number
}

export interface TaskBalanceResult {
  unbalanced: UnbalancedTask[]
  rescheduled: RescheduledTask[]
  priorities: TaskPriority[]
  statistics: TaskBalanceStatistics
  recommendations: string[]
}

export interface UnbalancedTask {
  taskId: string
  taskName: string
  courseId: string
  courseName: string
  originalDate: string
  currentStatus: 'overdue' | 'due_today' | 'at_risk' | 'on_track'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  reason: string
}

export interface RescheduledTask {
  taskId: string
  taskName: string
  originalDate: string
  newDate: string
  reason: string
}

export interface TaskPriority {
  taskId: string
  taskName: string
  priority: number
  score: number
  factors: {
    difficulty: number
    importance: number
    overdueDays: number
    examProximity: number
  }
}

export interface TaskBalanceStatistics {
  totalTasks: number
  overdueTasks: number
  atRiskTasks: number
  rescheduledTasks: number
  completionRate: number
}

// ==================== PLAN-03: 多学科统筹算法 ====================

export async function optimizeMultiCourse(userId: string, request: MultiCourseRequest): Promise<MultiCourseResult> {
  const { courseIds, dailyStudyHours, examDates = {}, preferences = {} } = request

  // 获取所有课程及其知识点数据
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    include: {
      chapters: {
        include: {
          knowledgePoints: true
        }
      }
    }
  })

  if (courses.length === 0) {
    throw new Error('未找到指定的课程')
  }

  // 计算每门课程的参数
  const courseAllocations: CourseAllocation[] = courses.map(course => {
    const knowledgePoints = course.chapters.flatMap(ch => ch.knowledgePoints)
    const weak = knowledgePoints.filter(kp => kp.masteryScore < 40).length
    const medium = knowledgePoints.filter(kp => kp.masteryScore >= 40 && kp.masteryScore < 70).length
    const mastered = knowledgePoints.filter(kp => kp.masteryScore >= 70).length

    const examDate = examDates[course.id] || course.examDate
    const daysUntilExam = examDate
      ? Math.max(0, Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 999

    // 计算紧迫度分数
    const weakRatio = weak / Math.max(knowledgePoints.length, 1)
    const examUrgency = daysUntilExam < 30 ? (30 - daysUntilExam) / 30 : 0
    const urgencyScore = weakRatio * 50 + examUrgency * 50

    // 确定优先级
    let priority: 'high' | 'medium' | 'low' = 'medium'
    if (urgencyScore >= 60 || daysUntilExam <= 14) priority = 'high'
    else if (urgencyScore < 30 && daysUntilExam > 60) priority = 'low'

    return {
      courseId: course.id,
      courseName: course.name,
      dailyHours: 0, // 待计算
      priority,
      urgencyScore,
      knowledgePoints: { total: knowledgePoints.length, weak, medium, mastered },
      examDate: examDate ? new Date(examDate).toISOString().split('T')[0] : undefined,
      daysUntilExam
    }
  })

  // 基于偏好和时间分配每日学习时间
  const totalUrgency = courseAllocations.reduce((sum, c) => sum + c.urgencyScore, 0)

  courseAllocations.forEach(course => {
    const ratio = totalUrgency > 0 ? course.urgencyScore / totalUrgency : 1 / courseAllocations.length
    course.dailyHours = Math.round(dailyStudyHours * ratio * 10) / 10
  })

  // 调整确保总时间等于每日学习时间
  const allocatedTotal = courseAllocations.reduce((sum, c) => sum + c.dailyHours, 0)
  const diff = dailyStudyHours - allocatedTotal
  if (Math.abs(diff) > 0.1 && courseAllocations.length > 0) {
    courseAllocations[0].dailyHours = Math.round((courseAllocations[0].dailyHours + diff) * 10) / 10
  }

  // 生成每日多课程安排
  const dailySchedule = generateDailyMultiCourseSchedule(courseAllocations, preferences)

  // 生成建议
  const recommendations: string[] = []
  const highPriorityCourses = courseAllocations.filter(c => c.priority === 'high')
  if (highPriorityCourses.length > 0) {
    recommendations.push(`建议优先学习 ${highPriorityCourses.map(c => c.courseName).join('、')}，这些课程紧迫度较高`)
  }

  const soonExams = courseAllocations.filter(c => c.daysUntilExam <= 14 && c.daysUntilExam > 0)
  if (soonExams.length > 0) {
    recommendations.push(`${soonExams.map(c => c.courseName).join('、')} 即将考试，请合理安排时间`)
  }

  const statistics: MultiCourseStatistics = {
    totalCourses: courses.length,
    totalKnowledgePoints: courseAllocations.reduce((sum, c) => sum + c.knowledgePoints.total, 0),
    totalDailyHours: dailyStudyHours,
    averageCourseHours: Math.round(dailyStudyHours / courses.length * 10) / 10,
    highPriorityCourses: highPriorityCourses.length
  }

  return {
    allocation: courseAllocations,
    dailySchedule,
    statistics,
    recommendations
  }
}

function generateDailyMultiCourseSchedule(
  allocations: CourseAllocation[],
  preferences: any
): DailyMultiCourseSchedule[] {
  const schedule: DailyMultiCourseSchedule[] = []
  const daysToShow = 7

  const timeSlots = [
    { time: '08:00-09:30', type: 'morning' },
    { time: '10:00-11:30', type: 'morning' },
    { time: '14:00-15:30', type: 'afternoon' },
    { time: '16:00-17:30', type: 'afternoon' },
    { time: '19:00-20:30', type: 'evening' },
    { time: '21:00-22:00', type: 'evening' }
  ]

  for (let d = 0; d < daysToShow; d++) {
    const date = new Date()
    date.setDate(date.getDate() + d)

    const sessions: MultiCourseSession[] = []
    let totalHours = 0

    // 按优先级排序课程
    const sortedAllocations = [...allocations].sort((a, b) => b.urgencyScore - a.urgencyScore)

    let timeSlotIndex = 0
    for (const allocation of sortedAllocations) {
      if (timeSlotIndex >= timeSlots.length) break
      if (totalHours >= allocations.reduce((s, a) => s + a.dailyHours, 0)) break

      const slot = timeSlots[timeSlotIndex]
      const duration = Math.min(allocation.dailyHours, 1.5)
      const hoursRemaining = allocation.dailyHours - totalHours

      if (hoursRemaining <= 0) continue

      // 检查偏好
      if (preferences.morningCourse && slot.type !== 'morning') continue
      if (preferences.eveningCourse && slot.type !== 'evening') continue

      sessions.push({
        timeSlot: slot.time,
        courseId: allocation.courseId,
        courseName: allocation.courseName,
        activity: allocation.priority === 'high' ? '薄弱点突破' : '复习巩固',
        duration: duration * 60
      })

      totalHours += duration
      timeSlotIndex++
    }

    const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]

    schedule.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek,
      sessions,
      totalHours: Math.round(totalHours * 10) / 10
    })
  }

  return schedule
}

// ==================== PLAN-04: 任务智能平摊算法 ====================

export async function balanceTasks(userId: string, request: TaskBalanceRequest): Promise<TaskBalanceResult> {
  const { courseId, daysAhead = 7, maxDailyTasks = 5 } = request

  // 获取待完成的复习计划
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endDate = new Date()
  endDate.setDate(endDate.getDate() + daysAhead)

  const reviewPlans = await prisma.reviewPlan.findMany({
    where: {
      userId,
      status: 'PENDING',
      reviewDate: {
        gte: today,
        lte: endDate
      },
      ...(courseId ? { courseId } : {})
    },
    orderBy: { reviewDate: 'asc' }
  })

  // 获取关联数据
  const courseIds = [...new Set(reviewPlans.map(p => p.courseId))]
  const kpIds = [...new Set(reviewPlans.map(p => p.knowledgePointId))]

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, name: true, examDate: true }
  })

  const knowledgePoints = await prisma.knowledgePoint.findMany({
    where: { id: { in: kpIds } },
    select: { id: true, name: true }
  })

  // 创建映射
  const courseMap = new Map(courses.map(c => [c.id, c]))
  const kpMap = new Map(knowledgePoints.map(kp => [kp.id, kp]))

  // 分析未完成/有风险的任务
  const unbalanced: UnbalancedTask[] = []
  const now = new Date()

  for (const plan of reviewPlans) {
    const originalDate = new Date(plan.reviewDate)
    const daysDiff = Math.ceil((originalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const course = courseMap.get(plan.courseId)
    const kp = kpMap.get(plan.knowledgePointId)

    let currentStatus: UnbalancedTask['currentStatus'] = 'on_track'
    let riskLevel: UnbalancedTask['riskLevel'] = 'low'
    let reason = ''

    if (daysDiff < 0) {
      currentStatus = 'overdue'
      riskLevel = 'critical'
      reason = `已逾期 ${Math.abs(daysDiff)} 天`
    } else if (daysDiff === 0) {
      currentStatus = 'due_today'
      riskLevel = 'high'
      reason = '今日应完成'
    } else if (daysDiff <= 2) {
      currentStatus = 'at_risk'
      riskLevel = 'medium'
      reason = `距离截止还有 ${daysDiff} 天`
    }

    if (currentStatus !== 'on_track') {
      unbalanced.push({
        taskId: plan.id,
        taskName: kp?.name || '未知知识点',
        courseId: plan.courseId,
        courseName: course?.name || '未知课程',
        originalDate: originalDate.toISOString().split('T')[0],
        currentStatus,
        riskLevel,
        reason
      })
    }
  }

  // 计算任务优先级
  const priorities: TaskPriority[] = reviewPlans.map(plan => {
    const course = courseMap.get(plan.courseId)
    const kp = kpMap.get(plan.knowledgePointId)
    const examDate = course?.examDate ? new Date(course.examDate) : null
    const daysUntilExam = examDate ? Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 999
    const daysUntilReview = Math.ceil((new Date(plan.reviewDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // 难度因子（基于复习次数）
    const difficulty = Math.min(plan.reviewCount * 0.2, 1)

    // 重要性因子（基于艾宾浩斯遗忘曲线）
    const importance = plan.reviewCount === 1 ? 1.0 : plan.reviewCount === 2 ? 0.7 : 0.5

    // 逾期天数因子
    const overdueDays = daysUntilReview < 0 ? Math.abs(daysUntilReview) : 0

    // 考试临近因子
    const examProximity = daysUntilExam < 7 ? 1.0 : daysUntilExam < 14 ? 0.7 : 0.3

    // 综合优先级分数
    const score = difficulty * 20 + importance * 30 + overdueDays * 15 + examProximity * 35

    return {
      taskId: plan.id,
      taskName: kp?.name || '未知知识点',
      priority: Math.round(score),
      score,
      factors: { difficulty, importance, overdueDays, examProximity }
    }
  })

  // 排序优先级
  priorities.sort((a, b) => b.priority - a.priority)

  // 重新安排任务（智能平摊）
  const rescheduled: RescheduledTask[] = []

  // 按日期分组统计每日任务数
  const dailyTaskCount = new Map<string, number>()
  for (const plan of reviewPlans) {
    const dateKey = new Date(plan.reviewDate).toISOString().split('T')[0]
    dailyTaskCount.set(dateKey, (dailyTaskCount.get(dateKey) || 0) + 1)
  }

  // 对超负荷的天进行重新安排
  for (const [dateStr, count] of dailyTaskCount) {
    if (count > maxDailyTasks) {
      const dateTasks = reviewPlans.filter(p =>
        new Date(p.reviewDate).toISOString().split('T')[0] === dateStr
      )

      // 将低优先级任务移到后续日期
      const lowPriorityTasks = dateTasks
        .filter(t => {
          const p = priorities.find(pr => pr.taskId === t.id)
          return p && p.priority < 50
        })

      for (const task of lowPriorityTasks) {
        // 找到下一个负荷较轻的日期
        let newDate = new Date(task.reviewDate)
        let found = false

        for (let i = 1; i <= daysAhead; i++) {
          newDate.setDate(newDate.getDate() + 1)
          const newDateKey = newDate.toISOString().split('T')[0]

          if ((dailyTaskCount.get(newDateKey) || 0) < maxDailyTasks) {
            const kp = kpMap.get(task.knowledgePointId)
            rescheduled.push({
              taskId: task.id,
              taskName: kp?.name || '未知',
              originalDate: dateStr,
              newDate: newDateKey,
              reason: '任务量超负荷，自动调整'
            })

            dailyTaskCount.set(dateStr, dailyTaskCount.get(dateStr)! - 1)
            dailyTaskCount.set(newDateKey, (dailyTaskCount.get(newDateKey) || 0) + 1)
            found = true
            break
          }
        }
      }
    }
  }

  // 统计信息
  const statistics: TaskBalanceStatistics = {
    totalTasks: reviewPlans.length,
    overdueTasks: unbalanced.filter(u => u.currentStatus === 'overdue').length,
    atRiskTasks: unbalanced.filter(u => u.currentStatus === 'at_risk' || u.currentStatus === 'due_today').length,
    rescheduledTasks: rescheduled.length,
    completionRate: Math.round((reviewPlans.length - unbalanced.length) / Math.max(reviewPlans.length, 1) * 100)
  }

  // 生成建议
  const recommendations: string[] = []

  if (statistics.overdueTasks > 0) {
    recommendations.push(`您有 ${statistics.overdueTasks} 项任务已逾期，请尽快完成`)
  }

  if (statistics.atRiskTasks > 0) {
    recommendations.push(`${statistics.atRiskTasks} 项任务即将到期，请合理安排时间`)
  }

  if (statistics.rescheduledTasks > 0) {
    recommendations.push(`已自动调整 ${statistics.rescheduledTasks} 项任务的安排，避免过度集中`)
  }

  if (statistics.completionRate >= 80) {
    recommendations.push('保持良好的复习节奏！')
  }

  return {
    unbalanced,
    rescheduled,
    priorities,
    statistics,
    recommendations
  }
}
