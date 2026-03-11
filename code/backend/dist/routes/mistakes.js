import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
const router = Router();
// GET /api/mistakes - 获取错题列表
router.get('/', [
    query('courseId').optional().isUUID(),
    query('knowledgePointId').optional().isUUID(),
    query('startDate').optional().isISO8601(),
    query('endDate').optional().isISO8601(),
    validate
], async (req, res) => {
    try {
        const { courseId, startDate, knowledgePointId, endDate } = req.query;
        const where = {};
        if (courseId) {
            where.courseId = courseId;
        }
        if (knowledgePointId) {
            where.knowledgePointId = knowledgePointId;
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) {
                where.createdAt.gte = new Date(startDate);
            }
            if (endDate) {
                where.createdAt.lte = new Date(endDate);
            }
        }
        const mistakes = await prisma.mistake.findMany({
            where,
            include: {
                course: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                knowledgePoint: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        masteryScore: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.json({
            success: true,
            data: mistakes
        });
    }
    catch (error) {
        console.error('Error fetching mistakes:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mistakes'
        });
    }
});
// GET /api/mistakes/:id - 获取单个错题详情
router.get('/:id', [
    param('id').isUUID(),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const mistake = await prisma.mistake.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                knowledgePoint: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        masteryScore: true,
                        chapter: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!mistake) {
            res.status(404).json({
                success: false,
                error: 'Mistake not found'
            });
            return;
        }
        res.json({
            success: true,
            data: mistake
        });
    }
    catch (error) {
        console.error('Error fetching mistake:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch mistake'
        });
    }
});
// POST /api/mistakes - 创建错题记录
router.post('/', [
    body('courseId').isUUID().withMessage('Valid courseId is required'),
    body('knowledgePointId').isUUID().withMessage('Valid knowledgePointId is required'),
    body('question').trim().notEmpty().withMessage('Question is required'),
    body('userAnswer').trim().notEmpty().withMessage('User answer is required'),
    body('correctAnswer').trim().notEmpty().withMessage('Correct answer is required'),
    body('reason').optional().isString(),
    validate
], async (req, res) => {
    try {
        const { courseId, knowledgePointId, question, userAnswer, correctAnswer, reason } = req.body;
        // Verify course exists
        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });
        if (!course) {
            res.status(404).json({
                success: false,
                error: 'Course not found'
            });
            return;
        }
        // Verify knowledge point exists
        const knowledgePoint = await prisma.knowledgePoint.findUnique({
            where: { id: knowledgePointId }
        });
        if (!knowledgePoint) {
            res.status(404).json({
                success: false,
                error: 'Knowledge point not found'
            });
            return;
        }
        const mistake = await prisma.mistake.create({
            data: {
                courseId,
                knowledgePointId,
                question,
                userAnswer,
                correctAnswer,
                reason: reason || null
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                knowledgePoint: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });
        // Update knowledge point mastery score (decrease by 10 for each mistake)
        await prisma.knowledgePoint.update({
            where: { id: knowledgePointId },
            data: {
                masteryScore: Math.max(0, knowledgePoint.masteryScore - 10),
                status: 'WEAK'
            }
        });
        res.status(201).json({
            success: true,
            data: mistake
        });
    }
    catch (error) {
        console.error('Error creating mistake:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create mistake'
        });
    }
});
// DELETE /api/mistakes/:id - 删除错题
router.delete('/:id', [
    param('id').isUUID(),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const existingMistake = await prisma.mistake.findUnique({
            where: { id }
        });
        if (!existingMistake) {
            res.status(404).json({
                success: false,
                error: 'Mistake not found'
            });
            return;
        }
        await prisma.mistake.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Mistake deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting mistake:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete mistake'
        });
    }
});
// GET /api/mistakes/weak-points - 获取薄弱知识点（基于错题统计）
router.get('/weak-points', [], async (req, res) => {
    try {
        const { courseId } = req.query;
        // Group mistakes by knowledge point and count
        const whereClause = {};
        if (courseId) {
            whereClause.courseId = courseId;
        }
        const weakPointsData = await prisma.mistake.groupBy({
            by: ['knowledgePointId'],
            where: whereClause,
            _count: {
                id: true
            },
            orderBy: {
                _count: {
                    id: 'desc'
                }
            },
            take: 20
        });
        // Get knowledge point details for each weak point
        const knowledgePointIds = weakPointsData.map(wp => wp.knowledgePointId);
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: {
                id: { in: knowledgePointIds }
            },
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
                },
                _count: {
                    select: {
                        mistakes: true
                    }
                }
            }
        });
        // Create a map for quick lookup
        const mistakeCountMap = new Map(weakPointsData.map(wp => [wp.knowledgePointId, wp._count.id]));
        // Also get knowledge points with low mastery score
        const lowMasteryPoints = await prisma.knowledgePoint.findMany({
            where: {
                masteryScore: { lt: 50 }
            },
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
                },
                _count: {
                    select: {
                        mistakes: true
                    }
                }
            },
            orderBy: {
                masteryScore: 'asc'
            },
            take: 20
        });
        // Combine and deduplicate
        const combinedWeakPoints = [...knowledgePoints];
        const existingIds = new Set(combinedWeakPoints.map(kp => kp.id));
        for (const kp of lowMasteryPoints) {
            if (!existingIds.has(kp.id)) {
                combinedWeakPoints.push(kp);
            }
        }
        // Sort by mistake count (desc) then mastery score (asc)
        combinedWeakPoints.sort((a, b) => {
            const aMistakes = a._count.mistakes;
            const bMistakes = b._count.mistakes;
            if (aMistakes !== bMistakes)
                return bMistakes - aMistakes;
            return a.masteryScore - b.masteryScore;
        });
        // Limit to top 20 and format result
        const result = combinedWeakPoints.slice(0, 20).map(kp => ({
            id: kp.id,
            name: kp.name,
            status: kp.status,
            masteryScore: kp.masteryScore,
            mistakeCount: mistakeCountMap.get(kp.id) ?? kp._count.mistakes,
            chapter: {
                id: kp.chapter.id,
                name: kp.chapter.name
            },
            course: {
                id: kp.chapter.course.id,
                name: kp.chapter.course.name
            }
        }));
        res.json({
            success: true,
            data: result
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
export default router;
//# sourceMappingURL=mistakes.js.map