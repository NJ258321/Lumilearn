import { Router } from 'express';
import { param, query, body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
const router = Router();
// ==================== Helper Functions ====================
/**
 * 计算两个知识点之间的关联度
 * 基于：共同学习频率、前置关系、相似错题
 */
async function calculateCorrelation(sourceId, targetId) {
    let correlation = 0;
    const reasons = [];
    // 1. 检查是否有预设的关系
    const directRelation = await prisma.knowledgeRelation.findFirst({
        where: {
            OR: [
                { sourceId, targetId, relationType: 'PREREQUISITE' },
                { sourceId, targetId, relationType: 'RELATED' },
                { sourceId, targetId, relationType: 'EXTENDS' }
            ]
        }
    });
    if (directRelation) {
        correlation += directRelation.weight * 10; // 权重1-10，转换为0-100
        reasons.push(`存在${directRelation.relationType}关系`);
    }
    // 2. 检查是否经常一起被标记（共同出现在时间标记中）
    const sourceTimeMarks = await prisma.timeMark.findMany({
        where: { knowledgePointId: sourceId },
        select: { studyRecordId: true }
    });
    const targetTimeMarks = await prisma.timeMark.findMany({
        where: { knowledgePointId: targetId },
        select: { studyRecordId: true }
    });
    const sourceRecordIds = new Set(sourceTimeMarks.map(tm => tm.studyRecordId));
    const commonRecords = targetTimeMarks.filter(tm => sourceRecordIds.has(tm.studyRecordId));
    if (commonRecords.length > 0) {
        const coLearnRate = Math.min(commonRecords.length / 5, 1) * 30; // 最多加30分
        correlation += coLearnRate;
        reasons.push(`在${commonRecords.length}个学习记录中同时出现`);
    }
    // 3. 检查是否有共同的错题
    const sourceMistakes = await prisma.mistake.findMany({
        where: { knowledgePointId: sourceId },
        select: { question: true }
    });
    const targetMistakes = await prisma.mistake.findMany({
        where: { knowledgePointId: targetId },
        select: { question: true }
    });
    // 简单文本相似度检查
    const sourceKeywords = new Set(sourceMistakes.map(m => m.question.substring(0, 20)));
    const similarQuestions = targetMistakes.filter(m => Array.from(sourceKeywords).some(k => m.question.includes(k)));
    if (similarQuestions.length > 0) {
        correlation += 20;
        reasons.push(`存在相似错题`);
    }
    // 4. 如果没有找到任何关联，但都属于同一章节，给一个基础分
    const sourcePoint = await prisma.knowledgePoint.findUnique({
        where: { id: sourceId }
    });
    const targetPoint = await prisma.knowledgePoint.findUnique({
        where: { id: targetId }
    });
    if (sourcePoint && targetPoint && sourcePoint.chapterId === targetPoint.chapterId) {
        correlation += 15;
        reasons.push('属于同一章节');
    }
    // 归一化到0-100
    correlation = Math.min(Math.round(correlation), 100);
    return {
        correlation,
        reason: reasons.length > 0 ? reasons.join('，') : '无明显关联'
    };
}
// ==================== P4.4.1: 获取知识点关联度矩阵 ====================
router.get('/analysis/knowledge-points/:courseId/correlation', [
    param('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    validate
], async (req, res) => {
    try {
        const { courseId } = req.params;
        const limit = parseInt(req.query.limit) || 20;
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
        // 先获取课程的所有章节ID
        const chapters = await prisma.chapter.findMany({
            where: { courseId },
            select: { id: true }
        });
        const chapterIds = chapters.map(c => c.id);
        // 获取该课程所有知识点
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapterId: { in: chapterIds }
            },
            select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true,
                chapterId: true
            }
        });
        if (knowledgePoints.length === 0) {
            return res.status(400).json({
                success: false,
                error: '该课程没有知识点',
                code: 'NO_KNOWLEDGE_POINTS'
            });
        }
        // 获取知识点ID到名称的映射
        const pointMap = new Map(knowledgePoints.map(kp => [kp.id, kp.name]));
        const pointChapterMap = new Map(knowledgePoints.map(kp => [kp.id, kp.chapterId]));
        // 获取所有预设的知识关系
        const relations = await prisma.knowledgeRelation.findMany({
            where: {
                sourceId: { in: knowledgePoints.map(kp => kp.id) },
                targetId: { in: knowledgePoints.map(kp => kp.id) }
            }
        });
        // 构建关联矩阵数据
        const correlationMatrix = [];
        // 添加预设关系
        for (const rel of relations) {
            let reason = '';
            switch (rel.relationType) {
                case 'PREREQUISITE':
                    reason = '前置知识点关系';
                    break;
                case 'RELATED':
                    reason = '相关知识点';
                    break;
                case 'EXTENDS':
                    reason = '扩展知识点';
                    break;
                case 'EXAMPLE':
                    reason = '示例关系';
                    break;
                default:
                    reason = '知识关联';
            }
            correlationMatrix.push({
                sourceId: rel.sourceId,
                sourceName: pointMap.get(rel.sourceId) || '未知',
                targetId: rel.targetId,
                targetName: pointMap.get(rel.targetId) || '未知',
                correlation: rel.weight * 10,
                relationType: rel.relationType,
                reason
            });
        }
        // 计算没有预设关系但可能有关联的知识点对
        const existingPairs = new Set(relations.map(r => `${r.sourceId}-${r.targetId}`));
        let additionalCount = 0;
        for (let i = 0; i < knowledgePoints.length && additionalCount < limit; i++) {
            for (let j = i + 1; j < knowledgePoints.length && additionalCount < limit; j++) {
                const pairKey = `${knowledgePoints[i].id}-${knowledgePoints[j].id}`;
                const reversePairKey = `${knowledgePoints[j].id}-${knowledgePoints[i].id}`;
                if (!existingPairs.has(pairKey) && !existingPairs.has(reversePairKey)) {
                    // 计算潜在关联度
                    const { correlation, reason } = await calculateCorrelation(knowledgePoints[i].id, knowledgePoints[j].id);
                    // 只返回有关联的（correlation > 0）
                    if (correlation > 15) {
                        correlationMatrix.push({
                            sourceId: knowledgePoints[i].id,
                            sourceName: knowledgePoints[i].name,
                            targetId: knowledgePoints[j].id,
                            targetName: knowledgePoints[j].name,
                            correlation,
                            relationType: null,
                            reason
                        });
                        additionalCount++;
                    }
                }
            }
        }
        // 按关联度排序
        correlationMatrix.sort((a, b) => b.correlation - a.correlation);
        // 限制返回数量
        const limitedMatrix = correlationMatrix.slice(0, limit);
        // 获取章节信息用于聚类
        const chapterNames = await prisma.chapter.findMany({
            where: { id: { in: chapterIds } },
            select: { id: true, name: true }
        });
        const chapterNameMap = new Map(chapterNames.map(c => [c.id, c.name]));
        // 分析知识聚类（基于章节和关联度）
        const clusters = [];
        // 按章节分组
        const chapterGroups = new Map();
        for (const kp of knowledgePoints) {
            const chapterName = chapterNameMap.get(kp.chapterId) || '未知章节';
            if (!chapterGroups.has(chapterName)) {
                chapterGroups.set(chapterName, []);
            }
            chapterGroups.get(chapterName).push(kp);
        }
        // 为每个章节创建聚类
        for (const [chapterName, points] of chapterGroups) {
            if (points.length > 1) {
                // 找到该章节中最重要的知识点（按importance排序）
                const chapterPointsWithImportance = await prisma.knowledgePoint.findMany({
                    where: {
                        id: { in: points.map(p => p.id) }
                    },
                    orderBy: { importance: 'desc' },
                    take: 1
                });
                clusters.push({
                    name: chapterName,
                    knowledgePoints: points.map(p => p.name),
                    centralPoint: chapterPointsWithImportance[0]?.name || points[0].name,
                    pointCount: points.length
                });
            }
        }
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                totalKnowledgePoints: knowledgePoints.length,
                totalCorrelations: correlationMatrix.length,
                correlationMatrix: limitedMatrix,
                clusters
            }
        });
    }
    catch (error) {
        console.error('Error getting correlation matrix:', error);
        res.status(500).json({
            success: false,
            error: '获取知识点关联度矩阵失败',
            code: 'GET_CORRELATION_FAILED'
        });
    }
});
// ==================== P4.4.2: 获取知识点学习顺序建议 ====================
router.get('/analysis/learning-sequence/:courseId', [
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
        // 先获取课程的所有章节ID
        const chapters = await prisma.chapter.findMany({
            where: { courseId },
            select: { id: true, name: true, order: true }
        });
        const chapterIds = chapters.map(c => c.id);
        const chapterInfoMap = new Map(chapters.map(c => [c.id, { name: c.name, order: c.order }]));
        // 获取该课程所有知识点
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapterId: { in: chapterIds }
            },
            select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true,
                importance: true,
                chapterId: true
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
                sourceId: { in: knowledgePoints.map(kp => kp.id) },
                targetId: { in: knowledgePoints.map(kp => kp.id) }
            }
        });
        // 构建前置关系图
        const prereqMap = new Map();
        for (const prereq of prerequisites) {
            if (!prereqMap.has(prereq.targetId)) {
                prereqMap.set(prereq.targetId, []);
            }
            prereqMap.get(prereq.targetId).push(prereq.sourceId);
        }
        // 计算每个知识点需要的预估时间
        const estimatedTimeMap = new Map();
        for (const kp of knowledgePoints) {
            // 基础时间：30分钟
            // 根据重要性调整：重要知识点多花时间
            // 根据掌握程度调整：未掌握的知识点需要更多时间
            let estimatedTime = 30;
            estimatedTime += (kp.importance - 5) * 5; // -20 到 +25
            if (kp.masteryScore < 50) {
                estimatedTime += 20; // 薄弱点额外增加时间
            }
            estimatedTimeMap.set(kp.id, estimatedTime);
        }
        // 排序知识点
        const sortedPoints = [...knowledgePoints].sort((a, b) => {
            // 同一章节内，按前置关系排序
            if (a.chapterId === b.chapterId) {
                const aPrereqs = prereqMap.get(a.id) || [];
                const bPrereqs = prereqMap.get(b.id) || [];
                // 有更多前置的排前面
                if (aPrereqs.length !== bPrereqs.length) {
                    return bPrereqs.length - aPrereqs.length;
                }
                // 未掌握的排前面
                if (a.status === 'MASTERED' && b.status !== 'MASTERED')
                    return 1;
                if (a.status !== 'MASTERED' && b.status === 'MASTERED')
                    return -1;
                // 掌握程度低的排前面
                return a.masteryScore - b.masteryScore;
            }
            // 不同章节，按章节顺序
            const aChapter = chapterInfoMap.get(a.chapterId);
            const bChapter = chapterInfoMap.get(b.chapterId);
            return (aChapter?.order || 0) - (bChapter?.order || 0);
        });
        // 获取知识点名称映射
        const pointNameMap = new Map(knowledgePoints.map(kp => [kp.id, kp.name]));
        // 生成建议列表
        const suggestedSequence = sortedPoints.map((kp, index) => {
            const prereqs = prereqMap.get(kp.id) || [];
            const prereqNames = prereqs
                .map(id => pointNameMap.get(id))
                .filter((name) => !!name)
                .slice(0, 2);
            const chapterInfo = chapterInfoMap.get(kp.chapterId);
            let reason = '';
            if (index === 0 || (chapterInfo?.order || 0) === 1) {
                reason = '作为课程起始点';
            }
            else if (prereqs.length > 0) {
                reason = `前置知识: ${prereqNames.join(', ')}${prereqNames.length > 2 ? '...' : ''}`;
            }
            else if (kp.status !== 'MASTERED') {
                reason = kp.masteryScore < 50 ? '需要加强复习' : '建议继续学习';
            }
            else {
                reason = '按章节顺序学习';
            }
            return {
                order: index + 1,
                knowledgePointId: kp.id,
                name: kp.name,
                chapterName: chapterInfo?.name || '未知章节',
                status: kp.status,
                masteryScore: kp.masteryScore,
                importance: kp.importance,
                prerequisites: prereqNames,
                reason,
                estimatedTime: estimatedTimeMap.get(kp.id) || 30
            };
        });
        // 计算总预估时间
        const totalEstimatedTime = Array.from(estimatedTimeMap.values()).reduce((a, b) => a + b, 0);
        // 已掌握知识点（可以跳过）
        const masteredPoints = knowledgePoints.filter(kp => kp.status === 'MASTERED');
        const skipableTime = masteredPoints.reduce((sum, kp) => sum + (estimatedTimeMap.get(kp.id) || 0), 0);
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                totalKnowledgePoints: knowledgePoints.length,
                masteredPoints: masteredPoints.length,
                suggestedSequence,
                totalEstimatedTime,
                skipableTime,
                effectiveTime: totalEstimatedTime - skipableTime,
                learningStrategy: {
                    method: '基于章节顺序和前置依赖的拓扑排序',
                    description: '优先学习章节靠前、前置知识已掌握、掌握程度较低的知识点'
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting learning sequence:', error);
        res.status(500).json({
            success: false,
            error: '获取知识点学习顺序建议失败',
            code: 'GET_LEARNING_SEQUENCE_FAILED'
        });
    }
});
// ==================== P4.4.3: 获取知识点掌握瓶颈 ====================
router.get('/analysis/bottlenecks/:courseId', [
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
        // 先获取课程的所有章节ID
        const chapters = await prisma.chapter.findMany({
            where: { courseId },
            select: { id: true, name: true, order: true }
        });
        const chapterIds = chapters.map(c => c.id);
        const chapterInfoMap = new Map(chapters.map(c => [c.id, { name: c.name, order: c.order }]));
        // 获取该课程所有知识点及其统计
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapterId: { in: chapterIds }
            },
            select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true,
                importance: true,
                chapterId: true,
                _count: {
                    select: {
                        mistakes: true,
                        timeMarks: true
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
        // 获取前置关系
        const prerequisites = await prisma.knowledgeRelation.findMany({
            where: {
                relationType: 'PREREQUISITE',
                targetId: { in: knowledgePoints.map(kp => kp.id) }
            }
        });
        // 获取前置知识点的信息
        const prereqSourceIds = [...new Set(prerequisites.map(p => p.sourceId))];
        const prereqPoints = await prisma.knowledgePoint.findMany({
            where: { id: { in: prereqSourceIds } },
            select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true
            }
        });
        const prereqPointMap = new Map(prereqPoints.map(p => [p.id, p]));
        // 构建前置依赖图
        const prereqMap = new Map();
        for (const prereq of prerequisites) {
            if (!prereqMap.has(prereq.targetId)) {
                prereqMap.set(prereq.targetId, []);
            }
            prereqMap.get(prereq.targetId).push(prereq);
        }
        // 分析瓶颈
        const bottlenecks = [];
        for (const kp of knowledgePoints) {
            const prereqs = prereqMap.get(kp.id) || [];
            // 计算瓶颈分数
            let bottleneckScore = 0;
            const blockers = [];
            const reasons = [];
            // 1. 自身掌握程度低
            if (kp.masteryScore < 50) {
                bottleneckScore += (50 - kp.masteryScore) * 0.8;
                reasons.push(`掌握度较低(${kp.masteryScore}分)`);
            }
            // 2. 错题多
            if (kp._count.mistakes > 3) {
                bottleneckScore += kp._count.mistakes * 10;
                reasons.push(`错题较多(${kp._count.mistakes}道)`);
            }
            // 3. 前置知识未掌握
            for (const prereq of prereqs) {
                const sourcePoint = prereqPointMap.get(prereq.sourceId);
                if (sourcePoint && sourcePoint.status !== 'MASTERED') {
                    const impact = (100 - sourcePoint.masteryScore) / 100;
                    bottleneckScore += impact * 30;
                    blockers.push({
                        blockerPoint: sourcePoint.name,
                        blockerStatus: sourcePoint.status,
                        blockerScore: sourcePoint.masteryScore,
                        impact: Math.round(impact * 100) / 100,
                        suggestion: sourcePoint.masteryScore < 50
                            ? `建议优先复习"${sourcePoint.name}"`
                            : `建议巩固"${sourcePoint.name}"`
                    });
                    reasons.push(`前置知识"${sourcePoint.name}"未掌握`);
                }
            }
            // 4. 学习次数少但掌握度低
            if (kp._count.timeMarks < 2 && kp.masteryScore < 70) {
                bottleneckScore += 20;
                reasons.push('学习次数较少');
            }
            // 只返回有瓶颈的知识点
            if (bottleneckScore > 15) {
                // 确定难度
                let difficulty;
                if (bottleneckScore > 60) {
                    difficulty = 'hard';
                }
                else if (bottleneckScore > 30) {
                    difficulty = 'medium';
                }
                else {
                    difficulty = 'easy';
                }
                const chapterInfo = chapterInfoMap.get(kp.chapterId);
                bottlenecks.push({
                    knowledgePointId: kp.id,
                    name: kp.name,
                    chapterName: chapterInfo?.name || '未知章节',
                    difficulty,
                    bottleneckScore: Math.round(bottleneckScore),
                    blockers,
                    recommendedPrerequisites: prereqs
                        .map(p => prereqPointMap.get(p.sourceId)?.name)
                        .filter((name) => !!name),
                    reasons
                });
            }
        }
        // 按瓶颈分数排序
        bottlenecks.sort((a, b) => b.bottleneckScore - a.bottleneckScore);
        // 统计
        const difficultyStats = {
            hard: bottlenecks.filter(b => b.difficulty === 'hard').length,
            medium: bottlenecks.filter(b => b.difficulty === 'medium').length,
            easy: bottlenecks.filter(b => b.difficulty === 'easy').length
        };
        // 统计主要问题
        const weakPrereqs = prerequisites.filter(p => {
            const source = prereqPointMap.get(p.sourceId);
            return source && source.status !== 'MASTERED';
        }).length;
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                totalKnowledgePoints: knowledgePoints.length,
                bottleneckCount: bottlenecks.length,
                difficultyStats,
                bottlenecks: bottlenecks.slice(0, 20), // 最多返回20个
                analysisSummary: {
                    totalBottlenecks: bottlenecks.length,
                    mainReasons: {
                        weakPrerequisites: weakPrereqs,
                        lowMastery: knowledgePoints.filter(kp => kp.masteryScore < 50).length,
                        manyMistakes: knowledgePoints.filter(kp => kp._count.mistakes > 3).length
                    }
                }
            }
        });
    }
    catch (error) {
        console.error('Error analyzing bottlenecks:', error);
        res.status(500).json({
            success: false,
            error: '获取知识点掌握瓶颈失败',
            code: 'GET_BOTTLENECKS_FAILED'
        });
    }
});
// ==================== P4.5: 学习效果评估 ====================
// P5.1: 生成学习评估报告
router.post('/analysis/evaluate', [
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('timeRange').optional().isIn(['week', 'month', 'semester']).withMessage('时间范围必须是week/month/semester'),
    body('includeDetails').optional().isBoolean(),
    validate
], async (req, res) => {
    try {
        const { courseId, timeRange = 'month', includeDetails = true } = req.body;
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
        // 计算时间范围
        const now = new Date();
        let startDate;
        switch (timeRange) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case 'semester':
                startDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        // 先获取章节ID
        const chapters = await prisma.chapter.findMany({
            where: { courseId },
            select: { id: true }
        });
        const chapterIds = chapters.map(c => c.id);
        // 获取知识点统计
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapterId: { in: chapterIds }
            },
            select: {
                id: true,
                name: true,
                status: true,
                masteryScore: true,
                importance: true
            }
        });
        // 获取学习记录统计
        const studyRecords = await prisma.studyRecord.findMany({
            where: {
                courseId,
                date: { gte: startDate }
            },
            select: {
                duration: true,
                date: true,
                status: true
            }
        });
        // 获取错题统计
        const mistakes = await prisma.mistake.findMany({
            where: {
                courseId,
                createdAt: { gte: startDate }
            }
        });
        // 计算各项评分
        const totalPoints = knowledgePoints.length;
        const masteredPoints = knowledgePoints.filter(kp => kp.status === 'MASTERED').length;
        // 学习时长评分 (满分100)
        const totalStudyTime = studyRecords.reduce((sum, r) => sum + r.duration, 0);
        const studyTimeHours = totalStudyTime / 3600;
        const studyTimeScore = Math.min(Math.round(studyTimeHours * 10), 100);
        // 知识点掌握评分
        const knowledgeMasteryScore = totalPoints > 0
            ? Math.round(knowledgePoints.reduce((sum, kp) => sum + kp.masteryScore, 0) / totalPoints)
            : 0;
        // 练习评分（基于错题）
        const mistakeCount = mistakes.length;
        const accuracyRate = mistakeCount > 0
            ? Math.max(0, 100 - mistakeCount * 5)
            : 100;
        const practiceScore = Math.min(accuracyRate, 100);
        // 复习评分（基于掌握的知识点）
        const reviewScore = totalPoints > 0
            ? Math.round((masteredPoints / totalPoints) * 100)
            : 0;
        // 综合评分
        const overallScore = Math.round(studyTimeScore * 0.25 +
            knowledgeMasteryScore * 0.3 +
            practiceScore * 0.2 +
            reviewScore * 0.25);
        // 评级
        let grade;
        if (overallScore >= 90)
            grade = 'S';
        else if (overallScore >= 80)
            grade = 'A';
        else if (overallScore >= 70)
            grade = 'B';
        else if (overallScore >= 60)
            grade = 'C';
        else
            grade = 'D';
        // 趋势分析（简单对比）
        const prevStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
        const prevStudyRecords = await prisma.studyRecord.findMany({
            where: {
                courseId,
                date: { gte: prevStartDate, lt: startDate }
            }
        });
        const prevTotalTime = prevStudyRecords.reduce((sum, r) => sum + r.duration, 0);
        const trend = totalStudyTime > prevTotalTime ? 'improving' : totalStudyTime < prevTotalTime * 0.8 ? 'declining' : 'stable';
        // 优劣势分析
        const strengths = [];
        const weaknesses = [];
        const suggestions = [];
        if (studyTimeScore >= 80) {
            strengths.push('学习时长充足');
        }
        else if (studyTimeScore < 50) {
            weaknesses.push('学习时间不足');
            suggestions.push('建议每天增加学习时间至少30分钟');
        }
        if (knowledgeMasteryScore >= 75) {
            strengths.push('知识点掌握良好');
        }
        else if (knowledgeMasteryScore < 60) {
            weaknesses.push('知识点理解不够深入');
            suggestions.push('建议加强基础知识的学习');
        }
        if (practiceScore >= 80) {
            strengths.push('练习正确率高');
        }
        else if (practiceScore < 60) {
            weaknesses.push('错题率较高');
            suggestions.push('建议增加练习量，针对错题进行复习');
        }
        if (reviewScore >= 80) {
            strengths.push('复习计划执行良好');
        }
        else if (reviewScore < 50) {
            weaknesses.push('复习不够系统');
            suggestions.push('建议使用艾宾浩斯遗忘曲线进行复习');
        }
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                reportPeriod: {
                    start: startDate.toISOString().split('T')[0],
                    end: now.toISOString().split('T')[0],
                    timeRange
                },
                overallScore,
                grade,
                dimensions: {
                    studyTime: {
                        score: studyTimeScore,
                        rating: studyTimeScore >= 80 ? '优秀' : studyTimeScore >= 60 ? '良好' : '需改进',
                        details: `共学习${Math.round(studyTimeHours)}小时`
                    },
                    knowledgeMastery: {
                        score: knowledgeMasteryScore,
                        rating: knowledgeMasteryScore >= 75 ? '优秀' : knowledgeMasteryScore >= 60 ? '良好' : '需改进',
                        details: `${totalPoints}个知识点中掌握${masteredPoints}个`
                    },
                    practice: {
                        score: practiceScore,
                        rating: practiceScore >= 80 ? '优秀' : practiceScore >= 60 ? '良好' : '需改进',
                        details: `错题${mistakeCount}道，正确率${accuracyRate}%`
                    },
                    review: {
                        score: reviewScore,
                        rating: reviewScore >= 80 ? '优秀' : reviewScore >= 60 ? '良好' : '需改进',
                        details: `${totalPoints > 0 ? Math.round((masteredPoints / totalPoints) * 100) : 0}%知识点已掌握`
                    }
                },
                strengths,
                weaknesses,
                suggestions,
                trend,
                generatedAt: now.toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error generating evaluation report:', error);
        res.status(500).json({
            success: false,
            error: '生成学习评估报告失败',
            code: 'GENERATE_REPORT_FAILED'
        });
    }
});
// P5.2: 获取学习效率分析
router.get('/analysis/efficiency/:courseId', [
    param('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const { courseId } = req.params;
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
        // 先获取章节ID
        const chapters = await prisma.chapter.findMany({
            where: { courseId },
            select: { id: true }
        });
        const chapterIds = chapters.map(c => c.id);
        // 获取知识点
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapterId: { in: chapterIds }
            },
            select: {
                id: true,
                masteryScore: true,
                _count: {
                    select: {
                        timeMarks: true
                    }
                }
            }
        });
        // 获取学习记录
        const studyRecords = await prisma.studyRecord.findMany({
            where: { courseId },
            select: {
                duration: true,
                date: true,
                createdAt: true
            },
            orderBy: { date: 'asc' }
        });
        // 计算效率指标
        const totalTimeMarks = knowledgePoints.reduce((sum, kp) => sum + kp._count.timeMarks, 0);
        const totalTimeSpent = studyRecords.reduce((sum, r) => sum + r.duration, 0);
        // 每知识点平均学习时间
        const timePerPoint = knowledgePoints.length > 0
            ? Math.round(totalTimeSpent / knowledgePoints.length / 60)
            : 0;
        // 知识保持率（基于掌握度）
        const retentionRate = knowledgePoints.length > 0
            ? Math.round(knowledgePoints.reduce((sum, kp) => sum + kp.masteryScore, 0) / knowledgePoints.length) / 100
            : 0;
        // 学习时段分析
        const hourDistribution = new Map();
        for (const record of studyRecords) {
            const hour = new Date(record.createdAt).getHours();
            hourDistribution.set(hour, (hourDistribution.get(hour) || 0) + record.duration);
        }
        // 找出最偏好时段
        let preferredTime = 'unknown';
        let maxTime = 0;
        for (const [hour, duration] of hourDistribution) {
            if (duration > maxTime) {
                maxTime = duration;
                if (hour >= 6 && hour < 12)
                    preferredTime = 'morning';
                else if (hour >= 12 && hour < 14)
                    preferredTime = 'afternoon';
                else if (hour >= 14 && hour < 18)
                    preferredTime = 'late_afternoon';
                else if (hour >= 18 && hour < 22)
                    preferredTime = 'evening';
                else
                    preferredTime = 'night';
            }
        }
        // 平均学习时长
        const uniqueDays = new Set(studyRecords.map(r => r.date.toISOString().split('T')[0]));
        const averageSessionLength = uniqueDays.size > 0
            ? Math.round(totalTimeSpent / uniqueDays.size / 60)
            : 0;
        // 每日学习次数
        const sessionsPerDay = uniqueDays.size > 0
            ? Math.round((studyRecords.length / uniqueDays.size) * 10) / 10
            : 0;
        // 效率评分
        const efficiencyScore = Math.round((timePerPoint > 0 ? Math.max(0, 100 - timePerPoint * 2) : 50) * 0.3 +
            retentionRate * 100 * 0.4 +
            (sessionsPerDay > 0 ? Math.min(sessionsPerDay * 20, 100) : 50) * 0.3);
        // 建议
        const recommendations = [];
        if (preferredTime === 'night') {
            recommendations.push('建议将学习时间调整到早晨或下午，效率更高');
        }
        if (averageSessionLength < 30) {
            recommendations.push('单次学习时长建议延长至45-60分钟');
        }
        if (timePerPoint > 60) {
            recommendations.push('每知识点学习时间偏长，建议提高专注度');
        }
        if (retentionRate < 0.6) {
            recommendations.push('知识保持率偏低，建议加强复习');
        }
        if (recommendations.length === 0) {
            recommendations.push('学习效率良好，继续保持');
        }
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                efficiencyScore,
                metrics: {
                    timePerPoint, // 每知识点平均学习时间(分钟)
                    retentionRate: Math.round(retentionRate * 100) / 100,
                    sessionsPerDay,
                    averageSessionLength
                },
                studyPatterns: {
                    preferredTime,
                    averageSessionLength,
                    sessionsPerDay,
                    totalStudyDays: uniqueDays.size,
                    totalSessions: studyRecords.length
                },
                recommendations
            }
        });
    }
    catch (error) {
        console.error('Error getting efficiency analysis:', error);
        res.status(500).json({
            success: false,
            error: '获取学习效率分析失败',
            code: 'GET_EFFICIENCY_FAILED'
        });
    }
});
// P5.3: 对比分析（与班级平均对比 - 模拟数据）
router.get('/analysis/compare/:courseId', [
    param('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const { courseId } = req.params;
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
        // 先获取章节ID
        const chapters = await prisma.chapter.findMany({
            where: { courseId },
            select: { id: true }
        });
        const chapterIds = chapters.map(c => c.id);
        // 获取用户的知识点统计
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                chapterId: { in: chapterIds }
            },
            select: {
                masteryScore: true,
                importance: true
            }
        });
        const yourScore = knowledgePoints.length > 0
            ? Math.round(knowledgePoints.reduce((sum, kp) => sum + kp.masteryScore, 0) / knowledgePoints.length)
            : 0;
        // 获取学习时长
        const studyRecords = await prisma.studyRecord.findMany({
            where: { courseId }
        });
        const yourStudyTime = Math.round(studyRecords.reduce((sum, r) => sum + r.duration, 0) / 3600);
        // 模拟班级平均（实际应用中应该从数据库获取）
        const classAverage = 68; // 模拟值
        const percentile = yourScore >= classAverage
            ? Math.min(99, 50 + Math.round((yourScore - classAverage) * 0.5))
            : Math.max(1, 50 - Math.round((classAverage - yourScore) * 0.5));
        const rank = Math.max(1, Math.round(50 - (percentile - 50) * 0.3));
        const totalStudents = 50;
        // 维度对比
        const dimensionComparison = [
            {
                dimension: '知识点掌握',
                classAverage: 65,
                yourScore: yourScore,
                difference: yourScore >= 65 ? `+${yourScore - 65}` : `${yourScore - 65}`
            },
            {
                dimension: '学习时长',
                classAverage: 30,
                yourScore: yourStudyTime,
                difference: yourStudyTime >= 30 ? `+${yourStudyTime - 30}` : `${yourStudyTime - 30}`
            },
            {
                dimension: '综合评分',
                classAverage,
                yourScore,
                difference: yourScore >= classAverage ? `+${yourScore - classAverage}` : `${yourScore - classAverage}`
            }
        ];
        res.json({
            success: true,
            data: {
                courseId: course.id,
                courseName: course.name,
                comparison: {
                    classAverage,
                    yourScore,
                    percentile,
                    rank,
                    totalStudents,
                    level: percentile >= 75 ? '优秀' : percentile >= 50 ? '良好' : '需努力'
                },
                dimensionComparison,
                note: '班级数据为模拟数据，实际应用需根据真实用户数据计算'
            }
        });
    }
    catch (error) {
        console.error('Error getting comparison:', error);
        res.status(500).json({
            success: false,
            error: '获取对比分析失败',
            code: 'GET_COMPARISON_FAILED'
        });
    }
});
export default router;
//# sourceMappingURL=analysis.js.map