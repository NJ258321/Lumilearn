import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
const router = Router();
// GET /api/exam-tasks - 获取考试任务列表
router.get('/', [
    query('courseId').optional().isUUID(),
    query('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
    query('round').optional().isInt({ min: 1, max: 3 }),
    query('date').optional().isISO8601(),
    validate
], async (req, res) => {
    try {
        const { courseId, status, round, date } = req.query;
        const where = {};
        if (courseId) {
            where.courseId = courseId;
        }
        if (status) {
            where.status = status;
        }
        if (round) {
            where.round = parseInt(round, 10);
        }
        if (date) {
            const targetDate = new Date(date);
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            where.scheduledDate = {
                gte: startOfDay,
                lte: endOfDay
            };
        }
        const examTasks = await prisma.examTask.findMany({
            where,
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });
        res.json({
            success: true,
            data: examTasks
        });
    }
    catch (error) {
        console.error('Error fetching exam tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch exam tasks'
        });
    }
});
// GET /api/exam-tasks/today - 获取今日任务
router.get('/today', [], async (_req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const todayTasks = await prisma.examTask.findMany({
            where: {
                scheduledDate: {
                    gte: today,
                    lt: tomorrow
                }
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        });
        res.json({
            success: true,
            data: todayTasks
        });
    }
    catch (error) {
        console.error('Error fetching today tasks:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch today tasks'
        });
    }
});
// GET /api/exam-tasks/:id - 获取单个任务详情
router.get('/:id', [
    param('id').isUUID(),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const examTask = await prisma.examTask.findUnique({
            where: { id },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        examDate: true
                    }
                }
            }
        });
        if (!examTask) {
            res.status(404).json({
                success: false,
                error: 'Exam task not found'
            });
            return;
        }
        res.json({
            success: true,
            data: examTask
        });
    }
    catch (error) {
        console.error('Error fetching exam task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch exam task'
        });
    }
});
// POST /api/exam-tasks - 创建考试任务
router.post('/', [
    body('courseId').isUUID().withMessage('Valid courseId is required'),
    body('type').isIn(['CHAPTER_REVIEW', 'MOCK_EXAM', 'WEAK_POINT']).withMessage('Valid type is required'),
    body('scheduledDate').isISO8601().withMessage('Valid scheduledDate is required'),
    body('estimatedDuration').isInt({ min: 1 }).withMessage('Duration must be positive'),
    body('round').optional().isInt({ min: 1, max: 3 }),
    validate
], async (req, res) => {
    try {
        const { courseId, type, scheduledDate, estimatedDuration, round = 1, details } = req.body;
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
        const examTask = await prisma.examTask.create({
            data: {
                courseId,
                type,
                scheduledDate: new Date(scheduledDate),
                estimatedDuration,
                round,
                details: details ? JSON.stringify(details) : null,
                status: 'PENDING'
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: examTask
        });
    }
    catch (error) {
        console.error('Error creating exam task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create exam task'
        });
    }
});
// PUT /api/exam-tasks/:id - 更新任务
router.put('/:id', [
    param('id').isUUID(),
    body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']),
    body('type').optional().isIn(['CHAPTER_REVIEW', 'MOCK_EXAM', 'WEAK_POINT']),
    body('scheduledDate').optional().isISO8601(),
    body('estimatedDuration').optional().isInt({ min: 1 }),
    body('round').optional().isInt({ min: 1, max: 3 }),
    body('details').optional(),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const { status, type, scheduledDate, estimatedDuration, round, details } = req.body;
        // Check if task exists
        const existingTask = await prisma.examTask.findUnique({
            where: { id }
        });
        if (!existingTask) {
            res.status(404).json({
                success: false,
                error: 'Exam task not found'
            });
            return;
        }
        const updateData = {};
        if (status)
            updateData.status = status;
        if (type)
            updateData.type = type;
        if (scheduledDate)
            updateData.scheduledDate = new Date(scheduledDate);
        if (estimatedDuration)
            updateData.estimatedDuration = estimatedDuration;
        if (round)
            updateData.round = round;
        if (details !== undefined)
            updateData.details = typeof details === 'string' ? details : JSON.stringify(details);
        const examTask = await prisma.examTask.update({
            where: { id },
            data: updateData,
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: examTask
        });
    }
    catch (error) {
        console.error('Error updating exam task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update exam task'
        });
    }
});
// PATCH /api/exam-tasks/:id/complete - 标记任务完成
router.patch('/:id/complete', [
    param('id').isUUID(),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const existingTask = await prisma.examTask.findUnique({
            where: { id }
        });
        if (!existingTask) {
            res.status(404).json({
                success: false,
                error: 'Exam task not found'
            });
            return;
        }
        const examTask = await prisma.examTask.update({
            where: { id },
            data: {
                status: 'COMPLETED'
            },
            include: {
                course: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });
        res.json({
            success: true,
            data: examTask
        });
    }
    catch (error) {
        console.error('Error completing exam task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to complete exam task'
        });
    }
});
// DELETE /api/exam-tasks/:id - 删除任务
router.delete('/:id', [
    param('id').isUUID(),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const existingTask = await prisma.examTask.findUnique({
            where: { id }
        });
        if (!existingTask) {
            res.status(404).json({
                success: false,
                error: 'Exam task not found'
            });
            return;
        }
        await prisma.examTask.delete({
            where: { id }
        });
        res.json({
            success: true,
            message: 'Exam task deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting exam task:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete exam task'
        });
    }
});
export default router;
//# sourceMappingURL=exam-tasks.js.map