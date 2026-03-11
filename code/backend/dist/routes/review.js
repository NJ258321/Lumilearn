import { Router } from 'express';
import { param, body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
import { getUserIdFromRequest } from './auth.js';
import { optimizeReviewPlan, getEfficiencyAnalysis } from '../services/planning.js';
const router = Router();
// 艾宾浩斯遗忘曲线复习间隔（天）
const EBINGHAUS_INTERVALS = [1, 3, 7, 14, 30];
// 辅助函数：将日期转换为本地 YYYY-MM-DD 格式
function formatDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
// ==================== POST /api/review/generate-plan - 生成复习计划 ====================
router.post('/review/generate-plan', [
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('days').optional().isInt({ min: 7, max: 90 }).withMessage('计划天数必须是7-90的整数'),
    body('dailyReviewTime').optional().isInt({ min: 15, max: 240 }).withMessage('每日复习时间必须是15-240的整数'),
    body('focusAreas').optional().isArray(),
    body('includeNewKnowledge').optional().isBoolean(),
    validate
], async (req, res) => {
    try {
        const { courseId, days = 30, dailyReviewTime = 60, focusAreas = ['weak_points'], includeNewKnowledge = true } = req.body;
        // 获取课程信息
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                chapters: {
                    include: {
                        knowledgePoints: true
                    }
                }
            }
        });
        if (!course) {
            return res.status(404).json({
                success: false,
                error: '课程不存在',
                code: 'COURSE_NOT_FOUND'
            });
        }
        // 获取该课程所有知识点及其复习历史
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapter: { courseId }
            },
            select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true,
                updatedAt: true,
                importance: true
            }
        });
        if (knowledgePoints.length === 0) {
            return res.status(400).json({
                success: false,
                error: '该课程没有知识点',
                code: 'NO_KNOWLEDGE_POINTS'
            });
        }
        // 根据 focusAreas 筛选需要复习的知识点
        let reviewCandidates = [];
        if (focusAreas.includes('weak_points')) {
            const weakPoints = knowledgePoints.filter(kp => kp.status === 'WEAK' || kp.masteryScore < 50);
            reviewCandidates = [...reviewCandidates, ...weakPoints];
        }
        if (focusAreas.includes('high_frequency')) {
            const highFreqPoints = knowledgePoints.filter(kp => kp.importance >= 8);
            reviewCandidates = [...reviewCandidates, ...highFreqPoints];
        }
        if (focusAreas.includes('not_mastered')) {
            const notMastered = knowledgePoints.filter(kp => kp.status !== 'MASTERED');
            reviewCandidates = [...reviewCandidates, ...notMastered];
        }
        // 去重
        const uniqueCandidates = reviewCandidates.filter((kp, index, self) => index === self.findIndex(t => t.id === kp.id));
        // 生成每日复习计划
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const dailyPlan = [];
        // 为每个知识点生成复习日期
        const reviewSchedule = new Map();
        for (const kp of uniqueCandidates) {
            const intervals = [];
            const lastStudied = kp.updatedAt ? new Date(kp.updatedAt) : new Date();
            for (const interval of EBINGHAUS_INTERVALS) {
                const reviewDate = new Date(lastStudied);
                reviewDate.setDate(reviewDate.getDate() + interval);
                // 只包含在计划天数内的复习日期
                const maxDate = new Date(startDate);
                maxDate.setDate(maxDate.getDate() + days);
                if (reviewDate <= maxDate) {
                    intervals.push(reviewDate);
                }
            }
            if (intervals.length > 0) {
                reviewSchedule.set(kp.id, intervals);
            }
        }
        // 添加新知识学习（如果启用）
        if (includeNewKnowledge) {
            const newPoints = knowledgePoints.filter(kp => kp.status === 'NEED_REVIEW' || kp.status === 'NOT_STARTED');
            // 均匀分配新知识到每天
            let dayIndex = 0;
            for (const kp of newPoints) {
                const studyDate = new Date(startDate);
                studyDate.setDate(studyDate.getDate() + (dayIndex % days));
                const existing = reviewSchedule.get(kp.id) || [];
                existing.push(studyDate);
                reviewSchedule.set(kp.id, existing);
                dayIndex++;
            }
        }
        // 生成每日计划
        for (let i = 0; i < days; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayItems = [];
            let totalTime = 0;
            for (const kp of uniqueCandidates) {
                const intervals = reviewSchedule.get(kp.id) || [];
                const reviewDate = intervals.find(d => d.toISOString().split('T')[0] === dateStr);
                if (reviewDate) {
                    // 计算优先级
                    let priority;
                    if (kp.masteryScore < 30 || kp.status === 'WEAK') {
                        priority = 'high';
                    }
                    else if (kp.masteryScore < 60) {
                        priority = 'medium';
                    }
                    else {
                        priority = 'low';
                    }
                    // 计算复习原因
                    const daysSinceLastStudy = Math.floor((currentDate.getTime() - new Date(kp.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                    const reviewIndex = EBINGHAUS_INTERVALS.findIndex(interval => Math.abs(interval - daysSinceLastStudy) <= 1);
                    let reason;
                    if (reviewIndex === 0) {
                        reason = '首次复习';
                    }
                    else if (reviewIndex > 0) {
                        reason = `第${reviewIndex + 1}次复习（艾宾浩斯曲线）`;
                    }
                    else {
                        reason = `上次学习已过${daysSinceLastStudy}天`;
                    }
                    // 估算时间（新知识30分钟，复习15分钟）
                    const estimatedTime = kp.status === 'NEED_REVIEW' ? 30 : 15;
                    dayItems.push({
                        type: kp.status === 'NEED_REVIEW' ? 'new' : 'review',
                        knowledgePointId: kp.id,
                        knowledgePointName: kp.name,
                        reason,
                        priority,
                        estimatedTime,
                        masteryScore: kp.masteryScore
                    });
                    totalTime += estimatedTime;
                }
            }
            // 按优先级排序
            dayItems.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] -
                    priorityOrder[b.priority];
            });
            dailyPlan.push({
                date: dateStr,
                items: dayItems,
                totalTime
            });
        }
        // 计算统计
        const totalReviewItems = Array.from(reviewSchedule.values()).flat().length;
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                planStartDate: startDate.toISOString().split('T')[0],
                planEndDate: new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                totalReviewItems,
                estimatedDailyTime: Math.round(totalReviewItems / days),
                dailyPlan,
                reviewStrategy: {
                    method: '艾宾浩斯遗忘曲线',
                    intervals: EBINGHAUS_INTERVALS,
                    description: '根据遗忘曲线，在学习后的第1、3、7、14、30天进行复习'
                }
            }
        });
    }
    catch (error) {
        console.error('Error generating review plan:', error);
        res.status(500).json({
            success: false,
            error: '生成复习计划失败',
            code: 'GENERATE_PLAN_FAILED'
        });
    }
});
// ==================== GET /api/review/today - 获取今日复习任务 ====================
// 每日复习任务最大数量限制
const MAX_DAILY_REVIEW_ITEMS = 6;
// 每日最大课程数量
const MAX_COURSES_PER_DAY = 5;
router.get('/review/today', async (_req, res) => {
    try {
        // 使用本地时区获取今天的日期
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        // ==================== 1. 获取所有课程及其知识点 ====================
        const courses = await prisma.course.findMany({
            where: {
                status: { in: ['STUDYING', 'REVIEWING'] }
            },
            include: {
                chapters: {
                    include: {
                        knowledgePoints: {
                            select: {
                                id: true,
                                name: true,
                                status: true,
                                masteryScore: true,
                                updatedAt: true,
                                importance: true
                            }
                        }
                    }
                }
            }
        });
        // 计算每门课程的紧迫度和任务类型
        const courseInfos = [];
        for (const course of courses) {
            // 计算距离考试天数
            let daysUntilExam = 999;
            if (course.examDate) {
                const examDate = new Date(course.examDate);
                daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            }
            // 分类知识点
            const allKps = course.chapters.flatMap(ch => ch.knowledgePoints);
            // 薄弱点：WEAK 状态或 masteryScore < 40
            const weakPoints = allKps.filter(kp => kp.status === 'WEAK' || (kp.masteryScore !== null && kp.masteryScore < 40));
            // 艾宾浩斯复习点：距离上次学习 1,3,7,14,30 天
            const reviewPoints = allKps.filter(kp => {
                const daysSince = Math.floor((today.getTime() - new Date(kp.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                return EBINGHAUS_INTERVALS.some(interval => Math.abs(interval - daysSince) <= 1);
            });
            // 新知识点：NEED_REVIEW 状态
            const newPoints = allKps.filter(kp => kp.status === 'NEED_REVIEW');
            // 近期巩固点：3天内学习过的
            const consolidationPoints = allKps.filter(kp => {
                const daysSince = Math.floor((today.getTime() - new Date(kp.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
                return daysSince >= 0 && daysSince <= 3 && kp.status !== 'NEED_REVIEW';
            });
            // 计算紧迫度分数
            const examWeight = daysUntilExam < 30 ? (30 - daysUntilExam) * 2 : 0;
            const weakWeight = weakPoints.length * 3;
            const reviewWeight = reviewPoints.length * 2;
            const statusWeight = course.status === 'REVIEWING' ? 15 : 0;
            const urgencyScore = examWeight + weakWeight + reviewWeight + statusWeight;
            courseInfos.push({
                courseId: course.id,
                courseName: course.name,
                status: course.status,
                daysUntilExam,
                urgencyScore,
                weakPoints,
                reviewPoints,
                newPoints,
                consolidationPoints
            });
        }
        // 按紧迫度排序
        courseInfos.sort((a, b) => b.urgencyScore - a.urgencyScore);
        // ==================== 2. 任务分配算法 ====================
        const finalItems = [];
        // 分配策略：均衡覆盖所有课程
        // 每门课程至少1个任务，总任务数不超过6个
        // 复习中课程侧重薄弱点，学习中课程侧重新知识
        const usedKpIds = new Set();
        // 合并所有课程，优先选取紧迫度高的课程
        const sortedCourses = [...courseInfos].sort((a, b) => b.urgencyScore - a.urgencyScore);
        // 轮询分配：每门课程依次选取1个任务，确保均衡覆盖
        let round = 0;
        while (finalItems.length < MAX_DAILY_REVIEW_ITEMS && round < 5) {
            round++;
            for (const course of sortedCourses) {
                if (finalItems.length >= MAX_DAILY_REVIEW_ITEMS)
                    break;
                // 复习中课程：优先薄弱点，然后艾宾浩斯
                // 学习中课程：优先新知识，然后薄弱点
                let kp = null;
                let taskType = 'new';
                let reason = '';
                let estimatedTime = 20;
                if (course.status === 'REVIEWING') {
                    // 复习中课程：优先薄弱点
                    const availableWeak = course.weakPoints.filter(k => !usedKpIds.has(k.id));
                    if (availableWeak.length > 0) {
                        kp = availableWeak[0];
                        taskType = 'weak_point';
                        reason = '薄弱知识点，需要加强复习';
                        estimatedTime = 15;
                    }
                    else {
                        // 其次艾宾浩斯复习
                        const availableReview = course.reviewPoints.filter(k => !usedKpIds.has(k.id));
                        if (availableReview.length > 0) {
                            kp = availableReview[0];
                            taskType = 'review';
                            reason = '艾宾浩斯复习周期到了';
                            estimatedTime = 10;
                        }
                        else {
                            // 没有可用的复习点，学习新知识
                            const availableNew = course.newPoints.filter(k => !usedKpIds.has(k.id));
                            if (availableNew.length > 0) {
                                kp = availableNew[0];
                                taskType = 'new';
                                reason = '学习新知识';
                                estimatedTime = 25;
                            }
                        }
                    }
                }
                else {
                    // 学习中课程：优先新知识
                    const availableNew = course.newPoints.filter(k => !usedKpIds.has(k.id));
                    if (availableNew.length > 0) {
                        kp = availableNew[0];
                        taskType = 'new';
                        reason = '学习新知识';
                        estimatedTime = 25;
                    }
                    else {
                        // 其次薄弱点
                        const availableWeak = course.weakPoints.filter(k => !usedKpIds.has(k.id));
                        if (availableWeak.length > 0) {
                            kp = availableWeak[0];
                            taskType = 'weak_point';
                            reason = '薄弱知识点，需要加强复习';
                            estimatedTime = 15;
                        }
                    }
                }
                if (kp) {
                    usedKpIds.add(kp.id);
                    finalItems.push({
                        id: `review-${kp.id}-${formatDate(today)}`,
                        knowledgePointId: kp.id,
                        knowledgePointName: kp.name,
                        courseName: course.courseName,
                        courseId: course.courseId,
                        courseStatus: course.status,
                        type: taskType,
                        reason,
                        estimatedTime,
                        masteryScore: kp.masteryScore || 0
                    });
                }
            }
            // 如果所有课程都没有更多任务，退出循环
            let hasMore = false;
            for (const course of sortedCourses) {
                const hasMoreKps = course.weakPoints.some(k => !usedKpIds.has(k.id)) ||
                    course.reviewPoints.some(k => !usedKpIds.has(k.id)) ||
                    course.newPoints.some(k => !usedKpIds.has(k.id));
                if (hasMoreKps) {
                    hasMore = true;
                    break;
                }
            }
            if (!hasMore)
                break;
        }
        // 按课程分组统计
        knowledgePointId: kp.id,
            knowledgePointName;
        kp.name,
            courseName;
        course.courseName,
            courseId;
        course.courseId,
            courseStatus;
        course.status,
            type;
        'weak_point',
            reason;
        '薄弱知识点，需要加强复习',
            estimatedTime;
        15,
            masteryScore;
        kp.masteryScore || 0;
    }
    finally { }
});
// 继续添加艾宾浩斯复习
for (const kp of course.reviewPoints) {
    if (usedKpIds.has(kp.id))
        continue;
    if (finalItems.length >= MAX_DAILY_REVIEW_ITEMS)
        break;
    usedKpIds.add(kp.id);
    finalItems.push({
        id: `review-${kp.id}-${formatDate(today)}`,
        knowledgePointId: kp.id,
        knowledgePointName: kp.name,
        courseName: course.courseName,
        courseId: course.courseId,
        courseStatus: course.status,
        type: 'review',
        reason: '艾宾浩斯复习周期到了',
        estimatedTime: 10,
        masteryScore: kp.masteryScore || 0
    });
}
// 继续添加新知识
for (const kp of course.newPoints) {
    if (usedKpIds.has(kp.id))
        continue;
    if (finalItems.length >= MAX_DAILY_REVIEW_ITEMS)
        break;
    usedKpIds.add(kp.id);
    finalItems.push({
        id: `review-${kp.id}-${formatDate(today)}`,
        knowledgePointId: kp.id,
        knowledgePointName: kp.name,
        courseName: course.courseName,
        courseId: course.courseId,
        courseStatus: course.status,
        type: 'new',
        reason: '学习新知识',
        estimatedTime: 25,
        masteryScore: kp.masteryScore || 0
    });
}
// 按课程分组统计
const courseTaskTypes = new Map();
for (const item of finalItems) {
    if (!courseTaskTypes.has(item.courseId)) {
        courseTaskTypes.set(item.courseId, []);
    }
    courseTaskTypes.get(item.courseId).push(item.type);
}
// ==================== 3. 返回结果 ====================
const totalTime = finalItems.reduce((sum, item) => sum + item.estimatedTime, 0);
const coveredCourses = new Set(finalItems.map(item => item.courseName)).size;
// 选取的课程信息
const selectedCourseIds = new Set(finalItems.map(item => item.courseId));
const selectedCourses = courseInfos
    .filter(c => selectedCourseIds.has(c.courseId))
    .map(c => ({
    courseId: c.courseId,
    courseName: c.courseName,
    courseStatus: c.status,
    daysUntilExam: c.daysUntilExam,
    taskCount: finalItems.filter(i => i.courseId === c.courseId).length,
    taskTypes: courseTaskTypes.get(c.courseId) || []
}));
res.json({
    success: true,
    data: {
        date: formatDate(today),
        totalItems: finalItems.length,
        totalTime,
        coveredCourses,
        courses: selectedCourses,
        items: finalItems.map(item => ({
            id: item.id,
            knowledgePointId: item.knowledgePointId,
            knowledgePointName: item.knowledgePointName,
            courseName: item.courseName,
            courseId: item.courseId,
            courseStatus: item.courseStatus,
            type: item.type,
            reason: item.reason,
            estimatedTime: item.estimatedTime,
            masteryScore: item.masteryScore
        }))
    }
});
try { }
catch (error) {
    console.error('Error getting today review:', error);
    res.status(500).json({
        success: false,
        error: '获取今日复习任务失败',
        code: 'GET_TODAY_FAILED'
    });
}
// ==================== POST /api/review/:knowledgePointId/complete - 记录复习完成 ====================
router.post('/review/:knowledgePointId/complete', [
    param('knowledgePointId').isUUID().withMessage('知识点ID必须是有效的UUID'),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('难度必须是 easy/medium/hard'),
    body('timeSpent').optional().isInt({ min: 1 }).withMessage('学习时间必须是正整数'),
    body('notes').optional().isString(),
    validate
], async (req, res) => {
    try {
        const { knowledgePointId } = req.params;
        const { difficulty = 'medium', timeSpent, notes } = req.body;
        // 检查知识点是否存在
        const knowledgePoint = await prisma.knowledgePoint.findUnique({
            where: { id: knowledgePointId }
        });
        if (!knowledgePoint) {
            return res.status(404).json({
                success: false,
                error: '知识点不存在',
                code: 'KNOWLEDGE_POINT_NOT_FOUND'
            });
        }
        // 根据复习效果更新掌握度
        let masteryDelta = 0;
        switch (difficulty) {
            case 'easy':
                masteryDelta = 15;
                break;
            case 'medium':
                masteryDelta = 10;
                break;
            case 'hard':
                masteryDelta = 5;
                break;
        }
        const newMasteryScore = Math.min(100, knowledgePoint.masteryScore + masteryDelta);
        // 确定新状态
        let newStatus;
        if (newMasteryScore >= 80) {
            newStatus = 'MASTERED';
        }
        else if (newMasteryScore >= 50) {
            newStatus = 'LEARNING';
        }
        else if (newMasteryScore > 0) {
            newStatus = 'WEAK';
        }
        else {
            newStatus = 'NOT_STARTED';
        }
        // 更新知识点
        const updatedPoint = await prisma.knowledgePoint.update({
            where: { id: knowledgePointId },
            data: {
                masteryScore: newMasteryScore,
                status: newStatus,
                updatedAt: new Date()
            }
        });
        // 计算下次复习日期
        const nextReviewDate = new Date();
        let nextInterval = 1; // 默认1天后
        if (difficulty === 'easy') {
            nextInterval = EBINGHAUS_INTERVALS[Math.min(4, Math.floor(newMasteryScore / 20))];
        }
        else if (difficulty === 'medium') {
            nextInterval = EBINGHAUS_INTERVALS[Math.min(3, Math.floor(newMasteryScore / 25))];
        }
        else {
            nextInterval = 1; // 困难则1天后继续
        }
        nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);
        res.json({
            success: true,
            data: {
                knowledgePointId: knowledgePoint.id,
                knowledgePointName: knowledgePoint.name,
                previousMasteryScore: knowledgePoint.masteryScore,
                currentMasteryScore: newMasteryScore,
                status: newStatus,
                masteryDelta,
                difficulty,
                timeSpent,
                nextReviewDate: nextReviewDate.toISOString().split('T')[0],
                nextReviewReason: `根据${difficulty}难度，下一次复习安排在${nextInterval}天后`,
                updatedAt: updatedPoint.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Error recording review completion:', error);
        res.status(500).json({
            success: false,
            error: '记录复习完成失败',
            code: 'RECORD_COMPLETE_FAILED'
        });
    }
});
// ==================== GET /api/review/statistics - 获取复习统计 ====================
router.get('/review/statistics', async (_req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        // 获取本周复习的知识点
        const weeklyReviews = await prisma.knowledgePoint.findMany({
            where: {
                updatedAt: {
                    gte: weekAgo
                }
            },
            select: {
                id: true,
                name: true,
                masteryScore: true,
                status: true,
                updatedAt: true
            }
        });
        // 计算统计数据
        const totalReviewed = weeklyReviews.length;
        const masteredThisWeek = weeklyReviews.filter(kp => kp.status === 'MASTERED').length;
        const weakPoints = weeklyReviews.filter(kp => kp.status === 'WEAK' || kp.masteryScore < 50).length;
        // 计算平均掌握度提升
        const totalImprovement = weeklyReviews.reduce((sum, kp) => {
            // 这里简化处理，实际应该存储历史记录
            return sum + (kp.masteryScore > 0 ? 5 : 0);
        }, 0);
        // 获取今日复习任务完成情况
        const todayReviews = weeklyReviews.filter(kp => formatDate(new Date(kp.updatedAt)) === formatDate(today));
        res.json({
            success: true,
            data: {
                period: {
                    start: formatDate(weekAgo),
                    end: formatDate(today)
                },
                statistics: {
                    totalReviewedThisWeek: totalReviewed,
                    masteredThisWeek,
                    weakPointsRemaining: weakPoints,
                    averageImprovement: totalReviewed > 0 ? Math.round(totalImprovement / totalReviewed) : 0
                },
                todayProgress: {
                    targetItems: 0, // 需要从today接口获取
                    completedItems: todayReviews.length,
                    completionRate: 0
                },
                upcomingReviews: EBINGHAUS_INTERVALS.map(interval => {
                    const reviewDate = new Date(today);
                    reviewDate.setDate(reviewDate.getDate() + interval);
                    return {
                        date: reviewDate.toISOString().split('T')[0],
                        interval: `${interval}天后`,
                        estimatedItems: Math.ceil(totalReviewed / EBINGHAUS_INTERVALS.length)
                    };
                })
            }
        });
    }
    catch (error) {
        console.error('Error getting review statistics:', error);
        res.status(500).json({
            success: false,
            error: '获取复习统计失败',
            code: 'GET_STATISTICS_FAILED'
        });
    }
});
// ==================== GET /api/review/course/:courseId - 获取课程复习计划 ====================
router.get('/review/course/:courseId', [
    param('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const { courseId } = req.params;
        // 检查课程是否存在
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });
        if (!course) {
            return res.status(404).json({
                success: false,
                error: '课程不存在',
                code: 'COURSE_NOT_FOUND'
            });
        }
        // 获取该课程所有知识点
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapter: { courseId }
            },
            select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true,
                updatedAt: true,
                importance: true
            }
        });
        // 按状态分组
        const byStatus = {
            mastered: knowledgePoints.filter(kp => kp.status === 'MASTERED'),
            learning: knowledgePoints.filter(kp => kp.status === 'LEARNING'),
            weak: knowledgePoints.filter(kp => kp.status === 'WEAK'),
            needReview: knowledgePoints.filter(kp => kp.status === 'NEED_REVIEW'),
            notStarted: knowledgePoints.filter(kp => kp.status === 'NOT_STARTED')
        };
        // 计算下次复习
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const upcomingReviews = knowledgePoints
            .filter(kp => kp.updatedAt)
            .map(kp => {
            const daysSince = Math.floor((today.getTime() - new Date(kp.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
            const nextInterval = EBINGHAUS_INTERVALS.find(interval => interval > daysSince) || 30;
            const nextDate = new Date(today);
            nextDate.setDate(nextDate.getDate() + (nextInterval - daysSince));
            return {
                knowledgePointId: kp.id,
                name: kp.name,
                masteryScore: kp.masteryScore,
                lastReviewed: new Date(kp.updatedAt).toISOString().split('T')[0],
                nextReviewDate: nextDate.toISOString().split('T')[0],
                daysUntilNextReview: nextInterval - daysSince,
                priority: kp.status === 'WEAK' || kp.masteryScore < 30 ? 'high' : 'medium'
            };
        })
            .filter(kp => kp.daysUntilNextReview <= 7)
            .sort((a, b) => a.daysUntilNextReview - b.daysUntilNextReview);
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                totalKnowledgePoints: knowledgePoints.length,
                statusSummary: {
                    mastered: byStatus.mastered.length,
                    learning: byStatus.learning.length,
                    weak: byStatus.weak.length,
                    needReview: byStatus.needReview.length,
                    notStarted: byStatus.notStarted.length
                },
                upcomingReviewsThisWeek: upcomingReviews,
                reviewPriority: {
                    high: upcomingReviews.filter(r => r.priority === 'high').length,
                    medium: upcomingReviews.filter(r => r.priority === 'medium').length
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting course review:', error);
        res.status(500).json({
            success: false,
            error: '获取课程复习计划失败',
            code: 'GET_COURSE_REVIEW_FAILED'
        });
    }
});
// ==================== PUT /api/review/replan - 任务重排 ====================
/**
 * 任务重排 API
 * 动态调整复习计划，当用户未完成某日任务时，自动将任务重新分配到后续日期
 */
router.put('/review/replan', [
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('completedTaskIds').optional().isArray().withMessage('已完成任务ID列表必须是数组'),
    body('skipTaskIds').optional().isArray().withMessage('跳过的任务ID列表必须是数组'),
    body('remainingDays').optional().isInt({ min: 1, max: 90 }).withMessage('剩余天数必须是1-90的整数'),
    body('currentDay').optional().isInt({ min: 1 }).withMessage('当前天数必须是正整数'),
    validate
], async (req, res) => {
    try {
        // 此接口不需要登录验证，所有用户均可使用
        // const userId = getUserIdFromRequest(req)
        const { courseId, completedTaskIds = [], skipTaskIds = [], remainingDays = 7, currentDay = 1 } = req.body;
        // 验证课程存在
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                chapters: {
                    include: {
                        knowledgePoints: true
                    }
                }
            }
        });
        if (!course) {
            return res.status(404).json({
                success: false,
                error: '课程不存在',
                code: 'COURSE_NOT_FOUND'
            });
        }
        // 获取该课程所有知识点
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapter: { courseId }
            },
            select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true,
                importance: true,
                updatedAt: true
            }
        });
        // 合并已完成和跳过的任务ID
        const processedTaskIds = [...completedTaskIds, ...skipTaskIds];
        // 筛选出未完成的任务
        const pendingKnowledgePoints = knowledgePoints.filter(kp => {
            const taskId = `review-${kp.id}`;
            return !processedTaskIds.includes(taskId) && !processedTaskIds.includes(kp.id);
        });
        // 生成重新分配的计划
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const replannedPlan = [];
        // 将未完成任务均匀分配到剩余天数
        const itemsPerDay = Math.ceil(pendingKnowledgePoints.length / remainingDays);
        let itemIndex = 0;
        for (let day = 0; day < remainingDays; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + day);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayItems = [];
            let totalTime = 0;
            for (let i = 0; i < itemsPerDay && itemIndex < pendingKnowledgePoints.length; i++) {
                const kp = pendingKnowledgePoints[itemIndex];
                itemIndex++;
                // 计算优先级
                let priority;
                if (kp.masteryScore < 30 || kp.status === 'WEAK') {
                    priority = 'high';
                }
                else if (kp.masteryScore < 60) {
                    priority = 'medium';
                }
                else {
                    priority = 'low';
                }
                // 生成重排原因
                let reason;
                if (skipTaskIds.includes(kp.id)) {
                    reason = '之前跳过，现重新安排';
                }
                else if (day > 0) {
                    reason = '从之前的日期顺延';
                }
                else {
                    reason = '未完成，继续学习';
                }
                const estimatedTime = kp.status === 'NEED_REVIEW' || kp.status === 'NOT_STARTED' ? 30 : 15;
                dayItems.push({
                    knowledgePointId: kp.id,
                    knowledgePointName: kp.name,
                    reason,
                    priority,
                    estimatedTime
                });
                totalTime += estimatedTime;
            }
            // 按优先级排序
            dayItems.sort((a, b) => {
                const priorityOrder = { high: 0, medium: 1, low: 2 };
                return priorityOrder[a.priority] -
                    priorityOrder[b.priority];
            });
            if (dayItems.length > 0 || day < 7) {
                replannedPlan.push({
                    date: dateStr,
                    items: dayItems,
                    totalTime
                });
            }
        }
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                originalTotalTasks: knowledgePoints.length,
                completedTasks: completedTaskIds.length,
                skippedTasks: skipTaskIds.length,
                pendingTasks: pendingKnowledgePoints.length,
                replannedDays: remainingDays,
                replannedPlan,
                summary: {
                    movedTasks: pendingKnowledgePoints.length,
                    removedTasks: skipTaskIds.length,
                    message: `已将${pendingKnowledgePoints.length}个未完成任务重新分配到${remainingDays}天`
                }
            }
        });
    }
    catch (error) {
        console.error('Error replanning review:', error);
        res.status(500).json({
            success: false,
            error: '任务重排失败',
            code: 'REPLAN_FAILED'
        });
    }
});
// ==================== POST /api/review/optimize - 多学科统筹优化 ====================
/**
 * 多学科统筹优化 API
 * 多课程同时备考时，智能分配每日学习时间
 * 注意：此接口不需要登录，所有用户均可使用
 */
router.post('/review/optimize', [
    body('courseIds').isArray({ min: 1 }).withMessage('课程ID列表不能为空'),
    body('dailyStudyHours').optional().isFloat({ min: 0.5, max: 12 }).withMessage('每日学习时长必须是0.5-12的小时数'),
    body('preferences').optional().isObject(),
    validate
], async (req, res) => {
    try {
        // 此接口不需要登录验证，所有用户均可使用
        // const userId = getUserIdFromRequest(req)
        const { courseIds, dailyStudyHours = 3, preferences = {} } = req.body;
        // 验证所有课程存在
        const courses = await prisma.course.findMany({
            where: {
                id: { in: courseIds }
            },
            include: {
                chapters: {
                    include: {
                        knowledgePoints: true
                    }
                }
            }
        });
        if (courses.length !== courseIds.length) {
            return res.status(404).json({
                success: false,
                error: '部分课程不存在',
                code: 'COURSE_NOT_FOUND'
            });
        }
        // 计算每个课程的参数
        const courseAnalysis = courses.map(course => {
            const totalKnowledgePoints = course.chapters.reduce((sum, ch) => sum + ch.knowledgePoints.length, 0);
            // 计算薄弱知识点数量
            const weakPoints = course.chapters
                .flatMap(ch => ch.knowledgePoints)
                .filter(kp => kp.status === 'WEAK' || kp.masteryScore < 50).length;
            // 计算未掌握知识点
            const notMastered = course.chapters
                .flatMap(ch => ch.knowledgePoints)
                .filter(kp => kp.status !== 'MASTERED').length;
            // 获取考试日期（如果有）
            const examDate = course.examDate ? new Date(course.examDate) : null;
            const daysUntilExam = examDate
                ? Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                : 30; // 默认30天
            return {
                courseId: course.id,
                courseName: course.name,
                totalKnowledgePoints,
                weakPoints,
                notMastered,
                examDate: course.examDate,
                daysUntilExam,
                priority: daysUntilExam <= 14 ? 'high' : daysUntilExam <= 30 ? 'medium' : 'low'
            };
        });
        // 计算紧迫度分数
        const urgencyScores = courseAnalysis.map(c => {
            const weakRatio = c.weakPoints / Math.max(c.totalKnowledgePoints, 1);
            const notMasteredRatio = c.notMastered / Math.max(c.totalKnowledgePoints, 1);
            const timePressure = 30 / Math.max(c.daysUntilExam, 1);
            return {
                courseId: c.courseId,
                urgencyScore: weakRatio * 30 + notMasteredRatio * 20 + timePressure * 25,
                weakRatio,
                timePressure
            };
        });
        // 计算总紧迫度
        const totalUrgency = urgencyScores.reduce((sum, c) => sum + c.urgencyScore, 0);
        // 分配每日学习时间
        const dailyAllocation = courseAnalysis.map(c => {
            const urgency = urgencyScores.find(u => u.courseId === c.courseId);
            const ratio = totalUrgency > 0 ? urgency.urgencyScore / totalUrgency : 1 / courseAnalysis.length;
            const allocatedHours = Math.round(dailyStudyHours * ratio * 10) / 10;
            // 计算预估完成时间
            const pointsPerHour = 2; // 假设每小时学习2个知识点
            const estimatedDays = Math.ceil(c.notMastered / Math.max(allocatedHours * pointsPerHour, 1));
            return {
                courseId: c.courseId,
                courseName: c.courseName,
                allocatedHours,
                estimatedDays,
                priority: c.priority,
                weakPoints: c.weakPoints,
                notMastered: c.notMastered,
                daysUntilExam: c.daysUntilExam,
                examDate: c.examDate
            };
        });
        // 生成每日统筹计划（示例：未来7天）
        const optimizedSchedule = {};
        const daysToShow = 7;
        const dailyMinutesTotal = dailyStudyHours * 60;
        for (let day = 0; day < daysToShow; day++) {
            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + day);
            const dateStr = currentDate.toISOString().split('T')[0];
            const dayCourses = [];
            let remainingMinutes = dailyMinutesTotal;
            for (const allocation of dailyAllocation) {
                // 根据日期调整每天的重点
                const dayMod = day % dailyAllocation.length;
                const isTodayFocus = dailyAllocation.findIndex(a => a.courseId === allocation.courseId) === dayMod;
                // 分配时间
                let hours = allocation.allocatedHours;
                if (!isTodayFocus) {
                    hours = Math.max(hours * 0.5, 0.5); // 非重点课程减少时间
                }
                const minutes = Math.round(hours * 60);
                remainingMinutes -= minutes;
                // 确定当天重点
                let focus = '复习';
                const tasks = [];
                if (allocation.weakPoints > 0 && day < 3) {
                    focus = '薄弱点突破';
                    tasks.push('错题复习', '重点知识点');
                }
                else if (day % 3 === 0) {
                    focus = '新知识学习';
                    tasks.push('新章节', '章节练习');
                }
                else {
                    focus = '综合复习';
                    tasks.push('综合练习', '知识点回顾');
                }
                // 检查是否能在考试前完成
                const canComplete = allocation.daysUntilExam >= allocation.estimatedDays;
                if (!canComplete) {
                    tasks.push('⚠️ 建议增加学习时间');
                }
                dayCourses.push({
                    courseId: allocation.courseId,
                    courseName: allocation.courseName,
                    hours: Math.round(minutes / 60 * 10) / 10,
                    focus,
                    tasks
                });
            }
            optimizedSchedule[dateStr] = {
                courses: dayCourses,
                totalHours: Math.round((dailyMinutesTotal - remainingMinutes) / 60 * 10) / 10
            };
        }
        // 生成警告
        const warnings = [];
        for (const allocation of dailyAllocation) {
            if (allocation.daysUntilExam <= 14 && allocation.allocatedHours < 1) {
                warnings.push(`${allocation.courseName}距离考试仅${allocation.daysUntilExam}天，建议增加学习时间`);
            }
            if (allocation.notMastered > allocation.estimatedDays * 2) {
                warnings.push(`${allocation.courseName}知识点较多，建议优先处理薄弱环节`);
            }
        }
        res.json({
            success: true,
            data: {
                courseAnalysis,
                dailyAllocation,
                optimizedSchedule,
                warnings: warnings.length > 0 ? warnings : ['学习计划安排合理'],
                summary: {
                    totalCourses: courses.length,
                    totalDailyHours: dailyStudyHours,
                    totalKnowledgePoints: courseAnalysis.reduce((sum, c) => sum + c.totalKnowledgePoints, 0),
                    totalWeakPoints: courseAnalysis.reduce((sum, c) => sum + c.weakPoints, 0),
                    averageDaysUntilExam: Math.round(courseAnalysis.reduce((sum, c) => sum + c.daysUntilExam, 0) / courseAnalysis.length)
                }
            }
        });
    }
    catch (error) {
        console.error('Error optimizing review:', error);
        res.status(500).json({
            success: false,
            error: '多学科统筹优化失败',
            code: 'OPTIMIZE_FAILED'
        });
    }
});
// ==================== POST /api/review/smart-optimize - 智能复习计划优化 (PLAN-01) ====================
/**
 * 智能复习计划优化
 * 基于强化学习算法的个性化复习路径规划
 */
router.post('/review/smart-optimize', [
    body('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
    body('dailyStudyHours').optional().isFloat({ min: 0.5, max: 8 }).withMessage('每日学习时长必须是0.5-8的小时数'),
    body('constraints').optional().isObject(),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { courseId, dailyStudyHours = 3, constraints } = req.body;
        const result = await optimizeReviewPlan(userId, {
            courseId,
            dailyStudyHours,
            constraints
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in smart optimization:', error);
        res.status(500).json({
            success: false,
            error: '智能复习计划优化失败',
            code: 'SMART_OPTIMIZE_FAILED'
        });
    }
});
// ==================== GET /api/review/efficiency - 学习效率分析 ====================
/**
 * 获取学习效率分析
 */
router.get('/review/efficiency', [
    param('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const courseId = req.query.courseId;
        const result = await getEfficiencyAnalysis(userId, courseId);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in efficiency analysis:', error);
        res.status(500).json({
            success: false,
            error: '获取学习效率分析失败',
            code: 'EFFICIENCY_ANALYSIS_FAILED'
        });
    }
});
// ==================== GET /api/daily-review/overview - 今日复习安排概览 ====================
router.get('/daily-review/overview', async (_req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 获取所有课程（排除已归档的）
        const courses = await prisma.course.findMany({
            where: {
                status: { not: 'ARCHIVED' }
            },
            include: {
                chapters: {
                    include: {
                        knowledgePoints: true
                    }
                }
            }
        });
        // 计算每门课程的复习信息
        const courseReviewInfos = await Promise.all(courses.map(async (course) => {
            // 统计章节
            const totalChapters = course.chapters.length;
            // 根据知识点掌握度计算已复习章节数（章节中50%以上知识点已掌握视为章节已复习）
            let reviewedChapters = 0;
            for (const chapter of course.chapters) {
                const kps = chapter.knowledgePoints;
                if (kps.length === 0)
                    continue;
                const masteredKps = kps.filter(kp => kp.status === 'MASTERED' || (kp.masteryScore !== null && kp.masteryScore >= 60)).length;
                if (masteredKps / kps.length >= 0.5) {
                    reviewedChapters++;
                }
            }
            const reviewProgress = totalChapters > 0 ? Math.round((reviewedChapters / totalChapters) * 100) : 0;
            // 统计知识点
            const allKnowledgePoints = course.chapters.flatMap(ch => ch.knowledgePoints);
            const totalKnowledgePoints = allKnowledgePoints.length;
            const masteredPoints = allKnowledgePoints.filter(kp => kp.status === 'MASTERED' || (kp.masteryScore !== null && kp.masteryScore >= 60)).length;
            const weakPoints = allKnowledgePoints.filter(kp => kp.status === 'WEAK' || (kp.masteryScore !== null && kp.masteryScore < 40)).length;
            const masteryRate = totalKnowledgePoints > 0 ? Math.round((masteredPoints / totalKnowledgePoints) * 100) : 0;
            // 计算距考试天数（只计算未过期的考试）
            let daysUntilExam = null;
            if (course.examDate) {
                const examDate = new Date(course.examDate);
                const days = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                // 只保留未过期的考试（> 0）或者未设置考试的课程
                daysUntilExam = days > 0 ? days : null;
            }
            // 计算紧迫程度
            let urgencyLevel = 'LOW';
            let urgencyReason = '';
            // 有考试日期的情况
            if (daysUntilExam !== null) {
                if (daysUntilExam <= 7) {
                    urgencyLevel = 'HIGH';
                    urgencyReason = '考试临近';
                }
                else if (reviewProgress < 30 && daysUntilExam <= 14) {
                    urgencyLevel = 'HIGH';
                    urgencyReason = '复习进度过慢';
                }
                else if (weakPoints > 5) {
                    urgencyLevel = 'HIGH';
                    urgencyReason = '薄弱点过多';
                }
                else if (daysUntilExam <= 14) {
                    urgencyLevel = 'NORMAL';
                    urgencyReason = '需要关注';
                }
                else if (reviewProgress < 60) {
                    urgencyLevel = 'NORMAL';
                    urgencyReason = '复习进度待提升';
                }
                else if (weakPoints > 2) {
                    urgencyLevel = 'NORMAL';
                    urgencyReason = '存在薄弱点';
                }
                else {
                    urgencyReason = '进度良好';
                }
            }
            else {
                // 没有考试日期的情况，根据学习进度判断
                if (reviewProgress === 0 && totalKnowledgePoints > 0) {
                    urgencyLevel = 'NORMAL';
                    urgencyReason = '尚未开始复习';
                }
                else if (reviewProgress < 30) {
                    urgencyLevel = 'NORMAL';
                    urgencyReason = '复习进度待提升';
                }
                else if (weakPoints > 5) {
                    urgencyLevel = 'NORMAL';
                    urgencyReason = '存在薄弱点';
                }
                else if (reviewProgress >= 80 && weakPoints === 0) {
                    urgencyReason = '进度良好';
                }
                else {
                    urgencyReason = '按计划推进';
                }
            }
            // 计算今日任务（根据紧迫程度和薄弱点）
            const todayKnowledgePoints = Math.min(weakPoints > 0 ? Math.ceil(weakPoints * 0.3) + 2 : 3, 10);
            const estimatedMinutes = todayKnowledgePoints * 15; // 假设每个知识点15分钟
            return {
                courseId: course.id,
                courseName: course.name,
                courseStatus: course.status,
                examDate: course.examDate ? course.examDate.toISOString().split('T')[0] : null,
                daysUntilExam,
                totalChapters,
                reviewedChapters,
                reviewProgress,
                totalKnowledgePoints,
                masteredPoints,
                weakPoints,
                masteryRate,
                todayTasks: {
                    knowledgePoints: todayKnowledgePoints,
                    estimatedMinutes
                },
                urgencyLevel,
                urgencyReason
            };
        }));
        // 按紧迫程度排序：HIGH > NORMAL > LOW，同级别按距考试天数排序
        const urgencyOrder = { HIGH: 0, NORMAL: 1, LOW: 2 };
        courseReviewInfos.sort((a, b) => {
            const urgencyDiff = urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
            if (urgencyDiff !== 0)
                return urgencyDiff;
            // 同紧迫程度，按距考试天数升序（天数少的排前面）
            if (a.daysUntilExam !== null && b.daysUntilExam !== null) {
                return a.daysUntilExam - b.daysUntilExam;
            }
            if (a.daysUntilExam !== null)
                return -1;
            if (b.daysUntilExam !== null)
                return 1;
            return 0;
        });
        res.json({
            success: true,
            data: {
                courses: courseReviewInfos,
                summary: {
                    totalCourses: courseReviewInfos.length,
                    urgentCourses: courseReviewInfos.filter(c => c.urgencyLevel === 'HIGH').length,
                    normalCourses: courseReviewInfos.filter(c => c.urgencyLevel === 'NORMAL').length,
                    relaxedCourses: courseReviewInfos.filter(c => c.urgencyLevel === 'LOW').length
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting daily review overview:', error);
        res.status(500).json({
            success: false,
            error: '获取今日复习概览失败',
            code: 'DAILY_REVIEW_OVERVIEW_FAILED'
        });
    }
});
export default router;
//# sourceMappingURL=review.js.map