/**
 * 智能路径优化 API
 * 实现 PLAN-02: 智能路径优化 API
 */
import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import { getUserIdFromRequest } from './auth.js';
import { optimizeLearningPath, optimizeSinglePointPath } from '../services/pathOptimizer.js';
import { optimizeMultiCourse, balanceTasks } from '../services/multiCourse.js';
const router = Router();
// ==================== POST /api/planning/optimize - 智能路径优化 (PLAN-02) ====================
/**
 * 智能学习路径优化
 * 基于目标函数最大化提分概率
 */
router.post('/planning/optimize', [
    body('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
    body('targetMastery').optional().isInt({ min: 50, max: 100 }).withMessage('目标掌握度必须是50-100的整数'),
    body('dailyHours').optional().isFloat({ min: 0.5, max: 8 }).withMessage('每日学习时长必须是0.5-8的小时数'),
    body('examDate').optional().isISO8601().withMessage('考试日期必须是有效的日期格式'),
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
        const { courseId, targetMastery = 90, dailyHours = 3, examDate, constraints } = req.body;
        const result = await optimizeLearningPath(userId, {
            courseId,
            targetMastery,
            dailyHours,
            examDate,
            constraints
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in path optimization:', error);
        res.status(500).json({
            success: false,
            error: '路径优化失败',
            code: 'PATH_OPTIMIZATION_FAILED'
        });
    }
});
// ==================== GET /api/planning/point/:id - 单知识点优化路径 ====================
/**
 * 获取单个知识点的最优复习路径
 */
router.get('/planning/point/:id', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { id } = req.params;
        const targetMastery = parseInt(req.query.target) || 90;
        const result = await optimizeSinglePointPath(id, targetMastery);
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in single point optimization:', error);
        res.status(500).json({
            success: false,
            error: error.message || '单知识点优化失败',
            code: 'POINT_OPTIMIZATION_FAILED'
        });
    }
});
// ==================== POST /api/planning/multi-course - 多学科统筹 (PLAN-03) ====================
/**
 * 多学科统筹优化
 * 跨课程时间分配算法
 */
router.post('/planning/multi-course', [
    body('courseIds').isArray({ min: 1 }).withMessage('课程ID列表不能为空'),
    body('courseIds.*').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('dailyStudyHours').optional().isFloat({ min: 1, max: 12 }).withMessage('每日学习时长必须是1-12的小时数'),
    body('examDates').optional().isObject(),
    body('preferences').optional().isObject(),
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
        const { courseIds, dailyStudyHours = 3, examDates, preferences } = req.body;
        const result = await optimizeMultiCourse(userId, {
            courseIds,
            dailyStudyHours,
            examDates,
            preferences
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in multi-course optimization:', error);
        res.status(500).json({
            success: false,
            error: '多学科统筹优化失败',
            code: 'MULTI_COURSE_FAILED'
        });
    }
});
// ==================== POST /api/planning/balance - 任务智能平摊 (PLAN-04) ====================
/**
 * 任务智能平摊
 * 未完成任务检测、延期重规划、优先级动态调整
 */
router.post('/planning/balance', [
    body('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
    body('daysAhead').optional().isInt({ min: 1, max: 30 }).withMessage('前瞻天数必须是1-30的整数'),
    body('maxDailyTasks').optional().isInt({ min: 1, max: 20 }).withMessage('每日最大学习任务数必须是1-20的整数'),
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
        const { courseId, daysAhead = 7, maxDailyTasks = 5 } = req.body;
        const result = await balanceTasks(userId, {
            courseId,
            daysAhead,
            maxDailyTasks
        });
        res.json({
            success: true,
            data: result
        });
    }
    catch (error) {
        console.error('Error in task balancing:', error);
        res.status(500).json({
            success: false,
            error: '任务平摊优化失败',
            code: 'TASK_BALANCE_FAILED'
        });
    }
});
export default router;
//# sourceMappingURL=planning.js.map