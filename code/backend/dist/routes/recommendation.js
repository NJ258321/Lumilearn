import { Router } from 'express';
import { param, body, query } from 'express-validator';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
import { getUserIdFromRequest } from './auth.js';
const router = Router();
// ==================== Helper Functions ====================
/**
 * 计算知识点的推荐分数
 * 基于：掌握度、重要性、遗忘曲线、错题率
 */
async function calculateRecommendationScore(knowledgePointId) {
    const kp = await prisma.knowledgePoint.findUnique({
        where: { id: knowledgePointId },
        include: {
            chapter: {
                include: {
                    course: true
                }
            },
            _count: {
                select: {
                    mistakes: true,
                    timeMarks: true
                }
            }
        }
    });
    if (!kp) {
        return { score: 0, reasons: [] };
    }
    let score = 0;
    const reasons = [];
    // 1. 掌握度因素 (0-30分)
    if (kp.masteryScore < 30) {
        score += 30 - kp.masteryScore;
        reasons.push('掌握度较低');
    }
    else if (kp.masteryScore < 60) {
        score += 15;
        reasons.push('需要巩固');
    }
    // 2. 重要性因素 (0-20分)
    score += kp.importance * 2;
    if (kp.importance >= 8) {
        reasons.push('重要知识点');
    }
    // 3. 遗忘曲线因素 (0-25分)
    const daysSinceLastStudy = Math.floor((Date.now() - new Date(kp.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceLastStudy <= 1) {
        score += 25;
        reasons.push('今天需要复习');
    }
    else if (daysSinceLastStudy <= 3) {
        score += 20;
        reasons.push('即将遗忘');
    }
    else if (daysSinceLastStudy <= 7) {
        score += 10;
        reasons.push('需要复习');
    }
    // 4. 错题因素 (0-15分)
    if (kp._count.mistakes > 0) {
        score += Math.min(kp._count.mistakes * 5, 15);
        reasons.push(`有${kp._count.mistakes}道错题`);
    }
    // 5. 学习次数因素 (0-10分)
    if (kp._count.timeMarks < 2) {
        score += 10;
        reasons.push('学习次数较少');
    }
    // 状态权重调整
    if (kp.status === 'WEAK') {
        score *= 1.3;
        reasons.push('薄弱知识点');
    }
    else if (kp.status === 'NEED_REVIEW') {
        score *= 1.2;
    }
    return {
        score: Math.min(Math.round(score), 100),
        reasons
    };
}
/**
 * 获取用户的学习统计
 */
async function getUserLearningStats(userId) {
    // 如果没有用户ID，返回空统计
    if (!userId) {
        return {
            totalStudyTime: 0,
            studyDays: 0,
            masteredPoints: 0,
            weakPoints: 0
        };
    }
    const studyRecords = await prisma.studyRecord.findMany();
    const knowledgePoints = await prisma.knowledgePoint.findMany();
    const totalStudyTime = studyRecords.reduce((sum, r) => sum + r.duration, 0);
    const studyDays = new Set(studyRecords.map(r => r.date.toISOString().split('T')[0])).size;
    const masteredPoints = knowledgePoints.filter(kp => kp.status === 'MASTERED').length;
    const weakPoints = knowledgePoints.filter(kp => kp.status === 'WEAK').length;
    return { totalStudyTime, studyDays, masteredPoints, weakPoints };
}
// ==================== P5.2.1: 获取每日推荐 ====================
router.get('/recommendations/daily', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // 获取所有知识点
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            include: {
                chapter: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (knowledgePoints.length === 0) {
            return res.json({
                success: true,
                data: {
                    date: today.toISOString().split('T')[0],
                    recommendedItems: [],
                    focusAreas: [],
                    message: '暂无知识点数据'
                }
            });
        }
        // 计算每个知识点的推荐分数
        const scoredPoints = await Promise.all(knowledgePoints.map(async (kp) => {
            const { score, reasons } = await calculateRecommendationScore(kp.id);
            return {
                id: kp.id,
                name: kp.name,
                status: kp.status,
                masteryScore: kp.masteryScore,
                importance: kp.importance,
                courseId: kp.chapter.course.id,
                courseName: kp.chapter.course.name,
                chapterName: kp.chapter.name,
                score,
                reasons
            };
        }));
        // 按分数排序
        scoredPoints.sort((a, b) => b.score - a.score);
        // 取前10个推荐
        const topRecommendations = scoredPoints.slice(0, 10);
        // 转换为推荐格式
        const recommendedItems = topRecommendations.map(item => ({
            type: 'knowledge_point',
            id: item.id,
            name: item.name,
            courseName: item.courseName,
            chapterName: item.chapterName,
            status: item.status,
            masteryScore: item.masteryScore,
            reason: item.reasons.join('，') || '根据学习算法推荐',
            priority: item.score >= 70 ? 'high' : item.score >= 40 ? 'medium' : 'low',
            estimatedTime: item.status === 'WEAK' ? 30 : 15
        }));
        // 分析重点区域
        const focusAreas = [];
        const weakCount = scoredPoints.filter(p => p.status === 'WEAK' || p.masteryScore < 50).length;
        const notMasteredCount = scoredPoints.filter(p => p.status !== 'MASTERED').length;
        if (weakCount > 0) {
            focusAreas.push(`${weakCount}个薄弱知识点`);
        }
        if (notMasteredCount > scoredPoints.length * 0.5) {
            focusAreas.push('超过50%知识点未掌握');
        }
        // 获取学习统计
        const stats = await getUserLearningStats(userId);
        res.json({
            success: true,
            data: {
                date: today.toISOString().split('T')[0],
                recommendedItems,
                focusAreas: focusAreas.length > 0 ? focusAreas : ['按计划学习'],
                statistics: stats,
                generatedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error getting daily recommendations:', error);
        res.status(500).json({
            success: false,
            error: '获取每日推荐失败',
            code: 'GET_DAILY_RECOMMENDATIONS_FAILED'
        });
    }
});
// ==================== P5.2.2: 获取推荐学习路径 ====================
router.get('/recommendations/learning-path/:courseId', [
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
        // 获取课程的所有知识点
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapter: { courseId }
            },
            include: {
                chapter: {
                    select: {
                        id: true,
                        name: true,
                        order: true
                    }
                }
            }
        });
        if (knowledgePoints.length === 0) {
            return res.status(400).json({
                success: false,
                error: '该课程没有知识点',
                code: 'NO_KNOWLEDGE_POINTS'
            });
        }
        // 获取所有前置关系
        const prerequisites = await prisma.knowledgeRelation.findMany({
            where: {
                relationType: 'PREREQUISITE',
                targetId: { in: knowledgePoints.map(kp => kp.id) }
            }
        });
        // 构建前置依赖图
        const prereqMap = new Map();
        for (const prereq of prerequisites) {
            if (!prereqMap.has(prereq.targetId)) {
                prereqMap.set(prereq.targetId, []);
            }
            prereqMap.get(prereq.targetId).push(prereq.sourceId);
        }
        // 计算每个知识点的学习优先级
        const scoredPoints = await Promise.all(knowledgePoints.map(async (kp) => {
            const { score, reasons } = await calculateRecommendationScore(kp.id);
            const prereqs = prereqMap.get(kp.id) || [];
            // 检查前置知识是否已掌握
            let prereqsMastered = true;
            for (const prereqId of prereqs) {
                const prereqKp = knowledgePoints.find(k => k.id === prereqId);
                if (prereqKp && prereqKp.status !== 'MASTERED') {
                    prereqsMastered = false;
                    break;
                }
            }
            return {
                id: kp.id,
                name: kp.name,
                chapterName: kp.chapter.name,
                chapterOrder: kp.chapter.order,
                status: kp.status,
                masteryScore: kp.masteryScore,
                importance: kp.importance,
                prerequisites: prereqs,
                score,
                reasons,
                prereqsMastered,
                canLearn: prereqsMastered || prereqs.length === 0
            };
        }));
        // 排序：可学习的优先，然后按分数
        scoredPoints.sort((a, b) => {
            if (a.canLearn && !b.canLearn)
                return -1;
            if (!a.canLearn && b.canLearn)
                return 1;
            if (a.status === 'MASTERED' && b.status !== 'MASTERED')
                return 1;
            if (a.status !== 'MASTERED' && b.status === 'MASTERED')
                return -1;
            return b.score - a.score;
        });
        // 生成学习路径
        const recommendedPath = scoredPoints.map((item, index) => ({
            order: index + 1,
            type: item.status === 'MASTERED' ? 'review' : 'new',
            knowledgePointId: item.id,
            name: item.name,
            chapterName: item.chapterName,
            status: item.status,
            masteryScore: item.masteryScore,
            priority: item.canLearn ? 'high' : 'medium',
            reason: item.canLearn
                ? (item.reasons.join('，') || '可以开始学习')
                : `需要先学习前置知识`
        }));
        // 计算预估时间
        const estimatedTime = scoredPoints
            .filter(p => p.status !== 'MASTERED')
            .reduce((sum, p) => sum + (p.status === 'WEAK' ? 30 : 20), 0);
        // 获取已掌握数量
        const masteredCount = scoredPoints.filter(p => p.status === 'MASTERED').length;
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                totalPoints: knowledgePoints.length,
                masteredPoints: masteredCount,
                recommendedPath,
                estimatedTotalTime: estimatedTime,
                learningStrategy: {
                    method: '基于前置依赖和掌握度的智能排序',
                    description: '优先推荐可学习且掌握度较低的知识点'
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting learning path:', error);
        res.status(500).json({
            success: false,
            error: '获取学习路径失败',
            code: 'GET_LEARNING_PATH_FAILED'
        });
    }
});
// ==================== P5.2.3: 获取推荐资源 ====================
router.get('/recommendations/resources/:knowledgePointId', [
    param('knowledgePointId').isUUID().withMessage('知识点ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const { knowledgePointId } = req.params;
        // 检查知识点是否存在
        const knowledgePoint = await prisma.knowledgePoint.findUnique({
            where: { id: knowledgePointId },
            include: {
                chapter: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!knowledgePoint) {
            return res.status(404).json({
                success: false,
                error: '知识点不存在',
                code: 'KNOWLEDGE_POINT_NOT_FOUND'
            });
        }
        // 获取相关的学习记录
        const relatedRecords = await prisma.studyRecord.findMany({
            where: {
                chapterId: knowledgePoint.chapterId
            },
            orderBy: { date: 'desc' },
            take: 5
        });
        // 获取相关的错题
        const relatedMistakes = await prisma.mistake.findMany({
            where: {
                knowledgePointId
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });
        // 获取相关知识点
        const relatedRelations = await prisma.knowledgeRelation.findMany({
            where: {
                OR: [
                    { sourceId: knowledgePointId },
                    { targetId: knowledgePointId }
                ]
            }
        });
        const relatedPointIds = [
            ...relatedRelations.map(r => r.sourceId),
            ...relatedRelations.map(r => r.targetId)
        ].filter(id => id !== knowledgePointId);
        const relatedPoints = await prisma.knowledgePoint.findMany({
            where: {
                id: { in: relatedPointIds }
            },
            select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true
            }
        });
        // 生成推荐资源
        const resources = [];
        // 添加相关知识点
        for (const point of relatedPoints.slice(0, 5)) {
            resources.push({
                type: 'knowledge_point',
                id: point.id,
                name: point.name,
                description: `相关知识点 - 掌握度${point.masteryScore}%`,
                relevance: 80
            });
        }
        // 添加相关学习记录
        for (const record of relatedRecords) {
            resources.push({
                type: 'study_record',
                id: record.id,
                name: record.title,
                description: `学习时长${Math.round(record.duration / 60)}分钟`,
                relevance: 60
            });
        }
        // 添加相似错题知识点（如果有）
        const mistakePointIds = [...new Set(relatedMistakes.map(m => m.knowledgePointId))];
        if (mistakePointIds.length > 0 && mistakePointIds[0] !== knowledgePointId) {
            const mistakePoints = await prisma.knowledgePoint.findMany({
                where: {
                    id: { in: mistakePointIds.filter(id => id !== knowledgePointId).slice(0, 3) }
                },
                select: {
                    id: true,
                    name: true,
                    masteryScore: true
                }
            });
            for (const point of mistakePoints) {
                resources.push({
                    type: 'weak_point',
                    id: point.id,
                    name: point.name,
                    description: '易错相关知识点',
                    relevance: 70
                });
            }
        }
        // 按相关性排序
        resources.sort((a, b) => b.relevance - a.relevance);
        res.json({
            success: true,
            data: {
                knowledgePointId: knowledgePoint.id,
                knowledgePointName: knowledgePoint.name,
                courseName: knowledgePoint.chapter.course.name,
                currentStatus: {
                    status: knowledgePoint.status,
                    masteryScore: knowledgePoint.masteryScore,
                    importance: knowledgePoint.importance
                },
                resources: resources.slice(0, 10),
                summary: {
                    totalResources: resources.length,
                    relatedPoints: relatedPoints.length,
                    studyRecords: relatedRecords.length,
                    mistakeRelated: relatedMistakes.length
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting recommended resources:', error);
        res.status(500).json({
            success: false,
            error: '获取推荐资源失败',
            code: 'GET_RESOURCES_FAILED'
        });
    }
});
// ==================== P5.2.4: 记录推荐反馈 ====================
router.post('/recommendations/feedback', [
    body('itemId').isUUID().withMessage('项目ID必须是有效的UUID'),
    body('itemType')
        .isIn(['knowledge_point', 'resource', 'learning_path'])
        .withMessage('项目类型必须是 knowledge_point, resource 或 learning_path'),
    body('action')
        .isIn(['view', 'complete', 'skip', 'helpful', 'not_helpful'])
        .withMessage('操作类型无效'),
    body('feedback').optional().isString(),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法记录反馈',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { itemId, itemType, action, feedback } = req.body;
        // 记录反馈到控制台（实际应该存储到数据库）
        console.log(`Recommendation Feedback: User=${userId}, Item=${itemId}, Type=${itemType}, Action=${action}, Feedback=${feedback}`);
        // 更新相关数据
        if (itemType === 'knowledge_point' && action === 'complete') {
            // 如果是完成操作，更新知识点
            const kp = await prisma.knowledgePoint.findUnique({
                where: { id: itemId }
            });
            if (kp) {
                const newScore = Math.min(kp.masteryScore + 10, 100);
                let newStatus = kp.status;
                if (newScore >= 80)
                    newStatus = 'MASTERED';
                else if (newScore >= 50)
                    newStatus = 'LEARNING';
                else if (newScore > 0)
                    newStatus = 'WEAK';
                await prisma.knowledgePoint.update({
                    where: { id: itemId },
                    data: {
                        masteryScore: newScore,
                        status: newStatus,
                        updatedAt: new Date()
                    }
                });
            }
        }
        // 生成响应消息
        let message = '';
        switch (action) {
            case 'view':
                message = '已记录查看反馈';
                break;
            case 'complete':
                message = '已完成学习，知识点掌握度已更新';
                break;
            case 'skip':
                message = '已跳过，将降低此类推荐权重';
                break;
            case 'helpful':
                message = '感谢反馈，这将帮助我们优化推荐';
                break;
            case 'not_helpful':
                message = '感谢反馈，我们将改进推荐算法';
                break;
        }
        res.json({
            success: true,
            data: {
                itemId,
                itemType,
                action,
                message,
                recordedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error recording feedback:', error);
        res.status(500).json({
            success: false,
            error: '记录反馈失败',
            code: 'RECORD_FEEDBACK_FAILED'
        });
    }
});
// ==================== P5.2.5: 获取热门推荐 ====================
router.get('/recommendations/popular', [
    query('limit').optional().isInt({ min: 1, max: 20 }).toInt(),
    validate
], async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        // 获取高频知识点（基于时间标记数量）
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            include: {
                _count: {
                    select: {
                        timeMarks: true,
                        mistakes: true
                    }
                },
                chapter: {
                    include: {
                        course: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        // 计算热门分数
        const popularPoints = knowledgePoints
            .map(kp => ({
            id: kp.id,
            name: kp.name,
            courseName: kp.chapter.course.name,
            chapterName: kp.chapter.name,
            studyCount: kp._count.timeMarks,
            mistakeCount: kp._count.mistakes,
            masteryScore: kp.masteryScore,
            importance: kp.importance,
            hotScore: kp._count.timeMarks * 2 + kp._count.mistakes * 5 + kp.importance * 3
        }))
            .sort((a, b) => b.hotScore - a.hotScore)
            .slice(0, limit);
        res.json({
            success: true,
            data: {
                period: 'all_time',
                popularItems: popularPoints.map(item => ({
                    type: 'knowledge_point',
                    id: item.id,
                    name: item.name,
                    courseName: item.courseName,
                    chapterName: item.chapterName,
                    studyCount: item.studyCount,
                    mistakeCount: item.mistakeCount,
                    masteryScore: item.masteryScore,
                    hotScore: item.hotScore
                })),
                generatedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error getting popular recommendations:', error);
        res.status(500).json({
            success: false,
            error: '获取热门推荐失败',
            code: 'GET_POPULAR_FAILED'
        });
    }
});
export default router;
//# sourceMappingURL=recommendation.js.map