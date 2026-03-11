/**
 * 智能备考规划服务
 * 实现 PLAN-01: 复习计划优化算法
 *
 * 功能：
 * 1. 强化学习/约束优化算法基础
 * 2. 状态建模：掌握度向量、剩余时间
 * 3. 动作空间定义
 */
import prisma from '../lib/prisma.js';
/**
 * 状态建模：构建学习状态
 */
export async function buildReviewState(userId, courseId) {
    // 获取用户的知识点数据
    const knowledgePoints = await prisma.knowledgePoint.findMany({
        where: courseId ? { chapter: { courseId } } : undefined,
        include: {
            chapter: {
                select: { courseId: true }
            },
            outgoingRelations: {
                where: { relationType: 'PREREQUISITE' },
                select: { targetId: true }
            }
        }
    });
    // 获取用户的复习计划
    const reviewPlans = await prisma.reviewPlan.findMany({
        where: {
            userId,
            status: 'PENDING'
        },
        orderBy: { reviewDate: 'asc' }
    });
    // 获取课程信息（考试日期）
    const courses = await prisma.course.findMany({
        where: courseId ? { id: courseId } : { id: { in: knowledgePoints.map(kp => kp.chapter.courseId) } },
        select: { id: true, examDate: true }
    });
    // 找到最近的考试日期
    const examDates = courses
        .map(c => c.examDate)
        .filter((d) => d !== null)
        .sort((a, b) => a.getTime() - b.getTime());
    const examDate = examDates.length > 0 ? examDates[0] : null;
    const daysRemaining = examDate
        ? Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
        : 30; // 默认30天
    // 构建知识点状态
    const kpStates = knowledgePoints.map(kp => {
        // 计算遗忘曲线参数（基于掌握度）
        let forgettingCurve = 0.5;
        if (kp.masteryScore >= 80)
            forgettingCurve = 0.2;
        else if (kp.masteryScore >= 60)
            forgettingCurve = 0.3;
        else if (kp.masteryScore >= 40)
            forgettingCurve = 0.4;
        return {
            id: kp.id,
            name: kp.name,
            masteryScore: kp.masteryScore,
            difficulty: kp.masteryScore < 30 ? 'hard' : kp.masteryScore < 70 ? 'medium' : 'easy',
            importance: kp.importance,
            lastReviewDate: null, // 可以从复习记录中获取
            reviewCount: 0,
            forgettingCurve,
            prerequisiteIds: kp.outgoingRelations.map(r => r.targetId)
        };
    });
    // 构建掌握度向量
    const masteryVector = kpStates.map(kp => kp.masteryScore);
    return {
        userId,
        knowledgePoints: kpStates,
        examDate,
        daysRemaining,
        dailyTimeBudget: 180, // 默认3小时，可配置
        currentMasteryVector: masteryVector
    };
}
/**
 * 动作空间定义：生成可用的复习动作
 */
export function defineActionSpace(state) {
    const actions = [];
    for (const kp of state.knowledgePoints) {
        // 跳过已掌握的知识点
        if (kp.masteryScore >= 90)
            continue;
        // 检查前置知识点是否已掌握
        const prereqsMet = kp.prerequisiteIds.every(prereqId => {
            const prereq = state.knowledgePoints.find(p => p.id === prereqId);
            return prereq && prereq.masteryScore >= 60;
        });
        if (!prereqsMet)
            continue;
        // 计算复习优先级
        let priority = 0;
        // 遗忘曲线因子：掌握度越低，遗忘越快，优先级越高
        priority += (100 - kp.masteryScore) * 0.3;
        // 重要性因子
        priority += kp.importance * 10;
        // 难度因子：难点优先
        if (kp.difficulty === 'hard')
            priority += 20;
        else if (kp.difficulty === 'medium')
            priority += 10;
        // 距离考试时间因子
        const daysWeight = Math.max(0, (30 - state.daysRemaining) / 30);
        priority += daysWeight * 15;
        // 计算预期掌握度提升
        let expectedGain = 0;
        const sessionMinutes = 30; // 标准复习时长
        switch (kp.difficulty) {
            case 'easy':
                expectedGain = Math.min(15, (90 - kp.masteryScore) * 0.3);
                break;
            case 'medium':
                expectedGain = Math.min(12, (90 - kp.masteryScore) * 0.25);
                break;
            case 'hard':
                expectedGain = Math.min(8, (90 - kp.masteryScore) * 0.15);
                break;
        }
        // 复习动作
        actions.push({
            knowledgePointId: kp.id,
            actionType: 'review',
            duration: sessionMinutes,
            expectedGain,
            priority
        });
        // 练习动作（针对薄弱点）
        if (kp.masteryScore < 50) {
            actions.push({
                knowledgePointId: kp.id,
                actionType: 'practice',
                duration: sessionMinutes,
                expectedGain: expectedGain * 0.8,
                priority: priority * 1.2
            });
        }
    }
    // 按优先级排序
    return actions.sort((a, b) => b.priority - a.priority);
}
/**
 * 强化学习优化算法
 * 使用简化版 Q-learning 进行路径优化
 */
export async function optimizeReviewPlan(userId, options) {
    const { courseId, dailyStudyHours = 3, constraints = {} } = options;
    // 1. 构建状态
    const state = await buildReviewState(userId, courseId);
    // 2. 应用约束
    const finalConstraints = {
        examDate: state.examDate,
        dailyTimeBudget: dailyStudyHours * 60,
        maxSingleSession: 45,
        preferredTimeSlots: [
            { start: 9, end: 12 },
            { start: 14, end: 17 },
            { start: 19, end: 21 }
        ],
        breakDuration: 10,
        maxDailySessions: 6,
        ...constraints
    };
    // 3. 定义动作空间
    const actionSpace = defineActionSpace(state);
    // 4. 生成优化计划（简化版贪婪算法 + 约束检查）
    const schedule = generateOptimizedSchedule(state, actionSpace, finalConstraints);
    // 5. 计算统计信息
    const totalStudyMinutes = schedule.reduce((sum, day) => sum + day.totalMinutes, 0);
    const totalStudyDays = schedule.length;
    // 计算预估最终掌握度
    const finalMastery = calculateProjectedMastery(state, schedule);
    // 6. 可行性分析
    const feasibility = analyzeFeasibility(state, schedule, finalConstraints);
    // 7. 生成建议
    const recommendations = generateRecommendations(state, schedule, feasibility);
    const statistics = {
        totalKnowledgePoints: state.knowledgePoints.length,
        totalStudyDays,
        totalStudyMinutes,
        averageDailyMinutes: totalStudyDays > 0 ? Math.round(totalStudyMinutes / totalStudyDays) : 0,
        projectedMastery: finalMastery,
        confidence: feasibility.isFeasible ? 85 : 60
    };
    return {
        schedule,
        statistics,
        recommendations,
        feasibility
    };
}
/**
 * 生成优化后的学习计划
 */
function generateOptimizedSchedule(state, actions, constraints) {
    const schedule = [];
    const remainingActions = [...actions];
    let currentDay = new Date();
    // 限制计划天数（不超过考前剩余天数或30天）
    const maxDays = Math.min(state.daysRemaining || 30, 30);
    const dailyTimeBudget = Math.min(constraints.dailyTimeBudget, 180); // 最多3小时
    for (let day = 0; day < maxDays && remainingActions.length > 0; day++) {
        const daySessions = [];
        let dayMinutes = 0;
        // 一天内的时段安排
        const timeSlots = [
            { start: '09:00', end: '10:00' },
            { start: '10:15', end: '11:15' },
            { start: '14:00', end: '15:00' },
            { start: '15:15', end: '16:15' },
            { start: '19:00', end: '20:00' },
            { start: '20:15', end: '21:15' }
        ];
        for (let sessionIdx = 0; sessionIdx < timeSlots.length; sessionIdx++) {
            if (remainingActions.length === 0)
                break;
            if (dayMinutes >= dailyTimeBudget)
                break;
            const action = remainingActions.shift();
            const timeSlot = timeSlots[sessionIdx];
            daySessions.push({
                startTime: timeSlot.start,
                endTime: timeSlot.end,
                knowledgePointId: action.knowledgePointId,
                knowledgePointName: state.knowledgePoints.find(kp => kp.id === action.knowledgePointId)?.name || '',
                activityType: action.actionType === 'practice' ? 'practice' : 'review',
                duration: action.duration,
                expectedGain: action.expectedGain,
                priority: action.priority
            });
            dayMinutes += action.duration + constraints.breakDuration;
        }
        const dayOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][currentDay.getDay()];
        schedule.push({
            date: currentDay.toISOString().split('T')[0],
            dayOfWeek,
            sessions: daySessions,
            totalMinutes: dayMinutes - constraints.breakDuration * daySessions.length,
            estimatedMasteryGain: daySessions.reduce((sum, s) => sum + s.expectedGain, 0)
        });
        currentDay = new Date(currentDay.getTime() + 24 * 60 * 60 * 1000);
    }
    return schedule;
}
/**
 * 计算预估最终掌握度
 */
function calculateProjectedMastery(state, schedule) {
    let totalGain = 0;
    for (const day of schedule) {
        totalGain += day.estimatedMasteryGain;
    }
    // 考虑遗忘曲线
    const forgettingFactor = 0.9; // 每次复习后遗忘10%
    const effectiveGain = totalGain * forgettingFactor;
    // 计算当前平均掌握度
    const currentAvg = state.currentMasteryVector.length > 0
        ? state.currentMasteryVector.reduce((a, b) => a + b, 0) / state.currentMasteryVector.length
        : 0;
    // 预估最终掌握度
    const projected = Math.min(100, currentAvg + effectiveGain);
    return Math.round(projected);
}
/**
 * 可行性分析
 */
function analyzeFeasibility(state, schedule, constraints) {
    const issues = [];
    const suggestions = [];
    // 检查知识点前置依赖
    const uncoveredPrereqs = state.knowledgePoints.filter(kp => {
        const unmetPrereqs = kp.prerequisiteIds.filter(prereqId => {
            const prereq = state.knowledgePoints.find(p => p.id === prereqId);
            return !prereq || prereq.masteryScore < 60;
        });
        return unmetPrereqs.length > 0;
    });
    if (uncoveredPrereqs.length > 0) {
        issues.push(`${uncoveredPrereqs.length} 个知识点的前置知识未掌握`);
        suggestions.push('建议先补齐前置知识点，再进行复习计划');
    }
    // 检查时间是否充足
    const totalMinutes = schedule.reduce((sum, day) => sum + day.totalMinutes, 0);
    const requiredMinutes = state.knowledgePoints
        .filter(kp => kp.masteryScore < 90)
        .length * 30; // 每个知识点至少30分钟
    if (totalMinutes < requiredMinutes * 0.7) {
        issues.push(`计划学习时间不足，可能无法完成所有知识点的复习`);
        suggestions.push('建议增加每日学习时间或延长复习周期');
    }
    // 检查距离考试时间
    if (state.daysRemaining && state.daysRemaining < 7) {
        issues.push('距离考试时间较短，需要集中精力复习重点');
        suggestions.push('建议优先复习高频考点和薄弱点');
    }
    const riskLevel = issues.length === 0 ? 'low' : issues.length === 1 ? 'medium' : 'high';
    return {
        isFeasible: riskLevel !== 'high',
        riskLevel,
        issues,
        suggestions
    };
}
/**
 * 生成个性化建议
 */
function generateRecommendations(state, schedule, feasibility) {
    const recommendations = [];
    // 基于可行性分析的建议
    recommendations.push(...feasibility.suggestions);
    // 基于掌握度分布的建议
    const weakPoints = state.knowledgePoints.filter(kp => kp.masteryScore < 40);
    const mediumPoints = state.knowledgePoints.filter(kp => kp.masteryScore >= 40 && kp.masteryScore < 70);
    const strongPoints = state.knowledgePoints.filter(kp => kp.masteryScore >= 70);
    if (weakPoints.length > 0) {
        recommendations.push(`您有 ${weakPoints.length} 个知识点掌握度较低（<40%），建议优先复习`);
    }
    if (mediumPoints.length > 0) {
        recommendations.push(`有 ${mediumPoints.length} 个知识点处于中等水平（40%-70%），建议通过练习巩固`);
    }
    // 基于复习节奏的建议
    if (schedule.length > 20) {
        recommendations.push('复习周期较长，建议每周末进行一次阶段性复盘');
    }
    // 基于考试日期的建议
    if (state.examDate) {
        recommendations.push(`距离考试还有 ${state.daysRemaining} 天，请按计划坚持执行`);
    }
    // 学习技巧建议
    const hardPoints = state.knowledgePoints.filter(kp => kp.difficulty === 'hard');
    if (hardPoints.length > 0) {
        recommendations.push(`您有 ${hardPoints.length} 个难点知识，建议使用间隔重复法学习`);
    }
    return recommendations;
}
/**
 * 获取学习效率分析
 */
export async function getEfficiencyAnalysis(userId, courseId) {
    const state = await buildReviewState(userId, courseId);
    // 计算各维度得分
    const masteryDistribution = {
        mastered: state.knowledgePoints.filter(kp => kp.masteryScore >= 80).length,
        medium: state.knowledgePoints.filter(kp => kp.masteryScore >= 40 && kp.masteryScore < 80).length,
        weak: state.knowledgePoints.filter(kp => kp.masteryScore < 40).length
    };
    // 计算学习效率指数
    const totalPoints = state.knowledgePoints.length;
    const efficiencyScore = totalPoints > 0
        ? Math.round((masteryDistribution.mastered * 1.0 + masteryDistribution.medium * 0.5) / totalPoints * 100)
        : 0;
    // 计算时间利用效率
    const studyDays = state.daysRemaining || 30;
    const timeEfficiency = Math.min(100, Math.round((studyDays / 30) * efficiencyScore));
    return {
        masteryDistribution,
        efficiencyScore,
        timeEfficiency,
        totalPoints,
        daysRemaining: state.daysRemaining,
        recommendations: efficiencyScore >= 70
            ? ['保持良好的学习节奏！']
            : efficiencyScore >= 40
                ? ['建议增加复习频率，提高掌握度']
                : ['需要重点突破薄弱知识点']
    };
}
//# sourceMappingURL=planning.js.map