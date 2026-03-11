import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
const router = Router();
// ==================== GET /api/knowledge-points - 获取所有知识点（可按章节筛选） (Task-1.1.7) ====================
router.get('/', [
    query('chapterId').optional().isUUID(),
    query('status').optional().isIn(['MASTERED', 'WEAK', 'NEED_REVIEW', 'TODAY_REVIEW']),
    validate
], async (req, res) => {
    try {
        const { chapterId, status } = req.query;
        // 构建查询条件
        const where = {};
        if (chapterId) {
            where.chapterId = chapterId;
        }
        if (status) {
            where.status = status;
        }
        // 查询知识点
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where,
            orderBy: { importance: 'desc' },
            include: {
                chapter: {
                    select: { id: true, name: true }
                }
            }
        });
        res.json({
            success: true,
            data: knowledgePoints
        });
    }
    catch (error) {
        console.error('Error fetching knowledge points:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch knowledge points'
        });
    }
});
// ==================== GET /api/knowledge-points/recently-reviewed - 获取最近复习的知识点 (Task-2.3.3) ====================
router.get('/recently-reviewed', [
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('courseId').optional().isUUID(),
    validate
], async (req, res) => {
    try {
        const { limit = '20', courseId } = req.query;
        // 查询最近有复习记录（有时间标记关联）的知识点
        const recentlyReviewed = await prisma.knowledgePoint.findMany({
            where: courseId ? {
                chapter: { courseId: courseId }
            } : undefined,
            include: {
                chapter: {
                    select: { id: true, name: true, courseId: true }
                },
                timeMarks: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                updatedAt: 'desc'
            },
            take: parseInt(limit)
        });
        // 格式化返回数据
        const formattedData = recentlyReviewed.map(kp => ({
            id: kp.id,
            name: kp.name,
            status: kp.status,
            masteryScore: kp.masteryScore,
            importance: kp.importance,
            chapter: {
                id: kp.chapter.id,
                name: kp.chapter.name,
                courseId: kp.chapter.courseId
            },
            lastReviewed: kp.timeMarks[0]?.createdAt || kp.updatedAt
        }));
        res.json({
            success: true,
            data: formattedData
        });
    }
    catch (error) {
        console.error('Error fetching recently reviewed knowledge points:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch recently reviewed knowledge points'
        });
    }
});
// ==================== GET /api/knowledge-points/:id - 获取单个知识点详情 (Task-1.1.8) ====================
router.get('/:id', [
    param('id').isUUID(),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const knowledgePoint = await prisma.knowledgePoint.findUnique({
            where: { id },
            include: {
                chapter: {
                    select: { id: true, name: true, courseId: true }
                },
                mistakes: {
                    orderBy: { createdAt: 'desc' }
                },
                timeMarks: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });
        if (!knowledgePoint) {
            return res.status(404).json({
                success: false,
                error: 'Knowledge point not found'
            });
        }
        res.json({
            success: true,
            data: knowledgePoint
        });
    }
    catch (error) {
        console.error('Error fetching knowledge point:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch knowledge point'
        });
    }
});
// ==================== POST /api/knowledge-points - 创建新知识点 (Task-1.1.6) ====================
router.post('/', [
    body('chapterId').isUUID().withMessage('Valid chapterId is required'),
    body('name').trim().notEmpty().withMessage('Knowledge point name is required'),
    body('status').optional().isIn(['MASTERED', 'WEAK', 'NEED_REVIEW', 'TODAY_REVIEW']),
    body('importance').optional().isInt({ min: 1, max: 10 }),
    validate
], async (req, res) => {
    try {
        const { chapterId, name, status = 'NEED_REVIEW', importance = 5 } = req.body;
        // 验证章节是否存在
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId }
        });
        if (!chapter) {
            return res.status(404).json({
                success: false,
                error: 'Chapter not found'
            });
        }
        // 创建知识点
        const knowledgePoint = await prisma.knowledgePoint.create({
            data: {
                chapterId,
                name,
                status,
                importance
            },
            include: {
                chapter: {
                    select: { id: true, name: true }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: knowledgePoint
        });
    }
    catch (error) {
        console.error('Error creating knowledge point:', error);
        // 处理外键约束
        if (error.code === 'P2003') {
            return res.status(404).json({
                success: false,
                error: 'Chapter not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create knowledge point'
        });
    }
});
// ==================== PUT /api/knowledge-points/:id - 更新知识点 (Task-1.1.9) ====================
router.put('/:id', [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('status').optional().isIn(['MASTERED', 'WEAK', 'NEED_REVIEW', 'TODAY_REVIEW']),
    body('importance').optional().isInt({ min: 1, max: 10 }),
    body('masteryScore').optional().isInt({ min: 0, max: 100 }),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // 查找现有知识点
        const existing = await prisma.knowledgePoint.findUnique({
            where: { id }
        });
        if (!existing) {
            return res.status(404).json({
                success: false,
                error: 'Knowledge point not found'
            });
        }
        // 更新知识点
        const knowledgePoint = await prisma.knowledgePoint.update({
            where: { id },
            data: updateData,
            include: {
                chapter: {
                    select: { id: true, name: true }
                }
            }
        });
        res.json({
            success: true,
            data: knowledgePoint
        });
    }
    catch (error) {
        console.error('Error updating knowledge point:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Knowledge point not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update knowledge point'
        });
    }
});
// ==================== PATCH /api/knowledge-points/:id/mastery - 更新知识点掌握度 (Task-1.1.11) ====================
router.patch('/:id/mastery', [
    param('id').isUUID(),
    body('masteryScore').isInt({ min: 0, max: 100 }),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const { masteryScore } = req.body;
        // 根据掌握度自动更新状态
        let status;
        if (masteryScore >= 80) {
            status = 'MASTERED';
        }
        else if (masteryScore >= 60) {
            status = 'NEED_REVIEW';
        }
        else {
            status = 'WEAK';
        }
        // 更新知识点
        const knowledgePoint = await prisma.knowledgePoint.update({
            where: { id },
            data: {
                masteryScore,
                status
            },
            include: {
                chapter: {
                    select: { id: true, name: true }
                }
            }
        });
        res.json({
            success: true,
            data: knowledgePoint
        });
    }
    catch (error) {
        console.error('Error updating mastery score:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Knowledge point not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update mastery score'
        });
    }
});
// ==================== DELETE /api/knowledge-points/:id - 删除知识点 (Task-1.1.10) ====================
router.delete('/:id', [
    param('id').isUUID(),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        // 检查知识点是否存在
        const knowledgePoint = await prisma.knowledgePoint.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        mistakes: true,
                        timeMarks: true
                    }
                }
            }
        });
        if (!knowledgePoint) {
            return res.status(404).json({
                success: false,
                error: 'Knowledge point not found'
            });
        }
        // 警告：删除知识点会级联删除所有关联的错题和时间标记
        if (knowledgePoint._count.mistakes > 0 || knowledgePoint._count.timeMarks > 0) {
            console.warn(`Deleting knowledge point ${id} with ${knowledgePoint._count.mistakes} mistakes and ${knowledgePoint._count.timeMarks} time marks`);
        }
        // 删除知识点
        await prisma.knowledgePoint.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Knowledge point deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting knowledge point:', error);
        if (error.code === 'P2025') {
            return res.status(404).json({
                success: false,
                error: 'Knowledge point not found'
            });
        }
        res.status(500).json({
            success: false,
            error: 'Failed to delete knowledge point'
        });
    }
});
// ==================== GET /api/knowledge-points/weak - 获取薄弱点列表 (Task-1.1.12) ====================
router.get('/weak', [], async (req, res) => {
    try {
        // 获取 masteryScore < 60 的知识点
        const weakPoints = await prisma.knowledgePoint.findMany({
            where: {
                masteryScore: {
                    lt: 60
                }
            },
            orderBy: [
                { masteryScore: 'asc' },
                { importance: 'desc' }
            ],
            include: {
                chapter: {
                    select: { id: true, name: true, courseId: true }
                }
            }
        });
        res.json({
            success: true,
            data: weakPoints
        });
    }
    catch (error) {
        console.error('Error fetching weak points:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch weak points'
        });
    }
});
// ==================== GET /api/knowledge-points/:id/timeline - 获取知识点的时间分布 (Task-2.2.2) ====================
router.get('/:id/timeline', [
    param('id').isUUID(),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        // 验证知识点是否存在
        const knowledgePoint = await prisma.knowledgePoint.findUnique({
            where: { id },
            include: {
                chapter: {
                    select: { id: true, name: true, courseId: true }
                }
            }
        });
        if (!knowledgePoint) {
            return res.status(404).json({
                success: false,
                error: 'Knowledge point not found'
            });
        }
        // 获取与该知识点关联的所有时间标记
        const timeMarks = await prisma.timeMark.findMany({
            where: { knowledgePointId: id },
            orderBy: { timestamp: 'asc' },
            include: {
                studyRecord: {
                    select: { id: true, title: true, date: true, courseId: true }
                }
            }
        });
        // 按学习记录分组，构建时间分布数据
        const timelineByRecord = {};
        for (const tm of timeMarks) {
            const recordId = tm.studyRecordId;
            if (!timelineByRecord[recordId]) {
                timelineByRecord[recordId] = {
                    recordId,
                    recordTitle: tm.studyRecord.title,
                    recordDate: tm.studyRecord.date,
                    marks: []
                };
            }
            timelineByRecord[recordId].marks.push({
                id: tm.id,
                type: tm.type,
                timestamp: tm.timestamp,
                content: tm.content,
                pptPage: tm.pptPage
            });
        }
        // 构建响应数据
        const timelineData = {
            knowledgePoint: {
                id: knowledgePoint.id,
                name: knowledgePoint.name,
                status: knowledgePoint.status,
                masteryScore: knowledgePoint.masteryScore,
                chapter: {
                    id: knowledgePoint.chapter.id,
                    name: knowledgePoint.chapter.name,
                    courseId: knowledgePoint.chapter.courseId
                }
            },
            totalMarks: timeMarks.length,
            recordsCount: Object.keys(timelineByRecord).length,
            records: Object.values(timelineByRecord)
        };
        res.json({
            success: true,
            data: timelineData
        });
    }
    catch (error) {
        console.error('Error fetching knowledge point timeline:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch knowledge point timeline'
        });
    }
});
router.post('/batch', [
    body('chapterId').isUUID(),
    body('points').isArray({ min: 1, max: 100 }),
    body('points.*.name').isString().notEmpty(),
    body('points.*.importance').optional().isInt({ min: 1, max: 10 }),
    body('points.*.masteryScore').optional().isInt({ min: 0, max: 100 }),
    body('points.*.status').optional().isIn(['MASTERED', 'WEAK', 'NEED_REVIEW', 'TODAY_REVIEW']),
    validate
], async (req, res) => {
    try {
        const { chapterId, points } = req.body;
        // 验证章节是否存在
        const chapter = await prisma.chapter.findUnique({
            where: { id: chapterId }
        });
        if (!chapter) {
            return res.status(404).json({
                success: false,
                error: 'Chapter not found'
            });
        }
        // 构建批量创建数据
        const knowledgePointsData = points.map((point, index) => ({
            chapterId,
            name: point.name,
            importance: point.importance || 5,
            masteryScore: point.masteryScore || 0,
            status: point.status || 'NEED_REVIEW'
        }));
        // 批量创建知识点
        const createdPoints = await prisma.knowledgePoint.createMany({
            data: knowledgePointsData
        });
        res.status(201).json({
            success: true,
            data: {
                count: createdPoints.count,
                chapterId
            }
        });
    }
    catch (error) {
        console.error('Error batch creating knowledge points:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to batch create knowledge points'
        });
    }
});
// ==================== PUT /api/knowledge-points/batch/status - 批量更新知识点状态 (Task-1.4.3) ====================
router.put('/batch/status', [
    body('ids').isArray({ min: 1 }),
    body('ids.*').isUUID(),
    body('status').isIn(['MASTERED', 'WEAK', 'NEED_REVIEW', 'TODAY_REVIEW']),
    validate
], async (req, res) => {
    try {
        const { ids, status } = req.body;
        // 验证所有知识点是否存在
        const existingPoints = await prisma.knowledgePoint.findMany({
            where: { id: { in: ids } },
            select: { id: true }
        });
        if (existingPoints.length !== ids.length) {
            const foundIds = existingPoints.map(p => p.id);
            const notFoundIds = ids.filter(id => !foundIds.includes(id));
            return res.status(404).json({
                success: false,
                error: 'Some knowledge points not found',
                details: notFoundIds.map(id => ({ field: 'id', message: id }))
            });
        }
        // 批量更新知识点状态
        const updateResult = await prisma.knowledgePoint.updateMany({
            where: { id: { in: ids } },
            data: { status }
        });
        res.json({
            success: true,
            data: {
                count: updateResult.count,
                status
            }
        });
    }
    catch (error) {
        console.error('Error batch updating knowledge points status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to batch update knowledge points status'
        });
    }
});
export default router;
//# sourceMappingURL=knowledge-points.js.map