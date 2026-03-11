import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
import { getUserIdFromRequest } from './auth.js';
const router = Router();
// ==================== Helper Functions ====================
/**
 * 格式化题目返回数据
 */
function formatQuestion(question) {
    return {
        id: question.id,
        courseId: question.courseId,
        chapterId: question.chapterId,
        knowledgePointId: question.knowledgePointId,
        type: question.type,
        content: question.content,
        options: question.options ? JSON.parse(question.options) : null,
        answer: question.answer ? JSON.parse(question.answer) : null,
        explanation: question.explanation,
        difficulty: question.difficulty,
        score: question.score,
        timeLimit: question.timeLimit,
        tags: question.tags ? JSON.parse(question.tags) : null,
        source: question.source,
        usedCount: question.usedCount,
        correctRate: question.correctRate,
        status: question.status,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        // 关联信息
        course: question.course ? {
            id: question.course.id,
            name: question.course.name
        } : null,
        chapter: question.chapter ? {
            id: question.chapter.id,
            name: question.chapter.name
        } : null,
        knowledgePoint: question.knowledgePoint ? {
            id: question.knowledgePoint.id,
            name: question.knowledgePoint.name
        } : null
    };
}
// ==================== P6.2.7: 导出题目 (放在最前面避免被 /:id 匹配) ====================
router.get('/questions/export', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法导出题目',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const courseId = req.query.courseId;
        const format = req.query.format || 'json';
        const where = { status: 'ACTIVE' };
        if (courseId)
            where.courseId = courseId;
        const questions = await prisma.question.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                course: { select: { id: true, name: true } },
                chapter: { select: { id: true, name: true } },
                knowledgePoint: { select: { id: true, name: true } }
            }
        });
        if (format === 'json') {
            const exportData = questions.map(q => ({
                type: q.type,
                content: q.content,
                options: q.options ? JSON.parse(q.options) : null,
                answer: JSON.parse(q.answer),
                explanation: q.explanation,
                difficulty: q.difficulty,
                score: q.score,
                timeLimit: q.timeLimit,
                tags: q.tags ? JSON.parse(q.tags) : null,
                source: q.source,
                courseName: q.course?.name,
                chapterName: q.chapter?.name,
                knowledgePointName: q.knowledgePoint?.name
            }));
            res.json({
                success: true,
                data: {
                    exportInfo: { format: 'json', courseId, totalQuestions: questions.length, exportedAt: new Date().toISOString() },
                    questions: exportData
                }
            });
        }
        else {
            const headers = ['type', 'content', 'difficulty', 'score', 'source', 'courseName', 'chapterName'];
            const rows = questions.map(q => [
                q.type,
                `"${q.content.replace(/"/g, '""')}"`,
                q.difficulty,
                q.score,
                q.source || '',
                q.course?.name || '',
                q.chapter?.name || ''
            ]);
            const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="questions_${Date.now()}.csv"`);
            res.send(csv);
        }
    }
    catch (error) {
        console.error('Error exporting questions:', error);
        res.status(500).json({ success: false, error: '导出题目失败', code: 'EXPORT_QUESTIONS_FAILED' });
    }
});
// ==================== P6.2.1: 获取题目列表 ====================
router.get('/questions', [
    query('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
    query('chapterId').optional().isUUID().withMessage('章节ID必须是有效的UUID'),
    query('type').optional().isIn(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY']).withMessage('题目类型无效'),
    query('difficulty').optional().isInt({ min: 1, max: 10 }).toInt().withMessage('难度必须是1-10'),
    query('status').optional().isIn(['ACTIVE', 'INACTIVE', 'REVIEW']).withMessage('状态无效'),
    query('search').optional().isString().withMessage('搜索关键词必须是字符串'),
    query('page').optional().isInt({ min: 1 }).toInt().withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt().withMessage('每页数量最大100'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        // 查询参数
        const courseId = req.query.courseId;
        const chapterId = req.query.chapterId;
        const type = req.query.type;
        const difficulty = req.query.difficulty ? parseInt(req.query.difficulty) : undefined;
        const status = req.query.status;
        const search = req.query.search;
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        // 构建查询条件
        const where = {};
        if (courseId)
            where.courseId = courseId;
        if (chapterId)
            where.chapterId = chapterId;
        if (type)
            where.type = type;
        if (difficulty)
            where.difficulty = difficulty;
        if (status)
            where.status = status;
        if (search) {
            where.OR = [
                { content: { contains: search } },
                { explanation: { contains: search } },
                { tags: { contains: search } }
            ];
        }
        // 查询数据
        const [questions, total] = await Promise.all([
            prisma.question.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                include: {
                    course: {
                        select: { id: true, name: true }
                    },
                    chapter: {
                        select: { id: true, name: true }
                    },
                    knowledgePoint: {
                        select: { id: true, name: true }
                    }
                }
            }),
            prisma.question.count({ where })
        ]);
        res.json({
            success: true,
            data: {
                questions: questions.map(formatQuestion),
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            }
        });
    }
    catch (error) {
        console.error('Error getting questions:', error);
        res.status(500).json({
            success: false,
            error: '获取题目列表失败',
            code: 'GET_QUESTIONS_FAILED'
        });
    }
});
// ==================== P6.2.2: 获取题目详情 ====================
router.get('/questions/:id', [
    param('id').isUUID().withMessage('题目ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const { id } = req.params;
        const question = await prisma.question.findUnique({
            where: { id },
            include: {
                course: {
                    select: { id: true, name: true }
                },
                chapter: {
                    select: { id: true, name: true }
                },
                knowledgePoint: {
                    select: { id: true, name: true }
                }
            }
        });
        if (!question) {
            return res.status(404).json({
                success: false,
                error: '题目不存在',
                code: 'QUESTION_NOT_FOUND'
            });
        }
        res.json({
            success: true,
            data: formatQuestion(question)
        });
    }
    catch (error) {
        console.error('Error getting question:', error);
        res.status(500).json({
            success: false,
            error: '获取题目详情失败',
            code: 'GET_QUESTION_FAILED'
        });
    }
});
// ==================== P6.2.3: 创建题目 ====================
router.post('/questions', [
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('chapterId').optional().isUUID().withMessage('章节ID必须是有效的UUID'),
    body('knowledgePointId').optional().isUUID().withMessage('知识点ID必须是有效的UUID'),
    body('type').isIn(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'])
        .withMessage('题目类型必须是 SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER 或 ESSAY'),
    body('content').isString().notEmpty().withMessage('题目内容不能为空'),
    body('answer').isObject().withMessage('答案必须是对象'),
    body('options').optional().isArray().withMessage('选项必须是数组'),
    body('explanation').optional().isString().withMessage('解析必须是字符串'),
    body('difficulty').optional().isInt({ min: 1, max: 10 }).toInt().withMessage('难度必须是1-10'),
    body('score').optional().isInt({ min: 1 }).toInt().withMessage('分值必须是正整数'),
    body('timeLimit').optional().isInt({ min: 1 }).toInt().withMessage('时间限制必须是正整数'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
    body('source').optional().isString().withMessage('来源必须是字符串'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法创建题目',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { courseId, chapterId, knowledgePointId, type, content, options, answer, explanation, difficulty = 5, score = 10, timeLimit, tags, source } = req.body;
        // 验证课程存在
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
        // 验证章节存在（如果提供）
        if (chapterId) {
            const chapter = await prisma.chapter.findUnique({
                where: { id: chapterId }
            });
            if (!chapter) {
                return res.status(404).json({
                    success: false,
                    error: '章节不存在',
                    code: 'CHAPTER_NOT_FOUND'
                });
            }
            // 验证章节属于该课程
            if (chapter.courseId !== courseId) {
                return res.status(400).json({
                    success: false,
                    error: '章节不属于该课程',
                    code: 'CHAPTER_NOT_IN_COURSE'
                });
            }
        }
        // 验证知识点存在（如果提供）
        if (knowledgePointId) {
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
        }
        // 创建题目
        const question = await prisma.question.create({
            data: {
                courseId,
                chapterId: chapterId || null,
                knowledgePointId: knowledgePointId || null,
                type,
                content,
                options: options ? JSON.stringify(options) : null,
                answer: JSON.stringify(answer),
                explanation: explanation || null,
                difficulty,
                score,
                timeLimit: timeLimit || null,
                tags: tags ? JSON.stringify(tags) : null,
                source: source || null,
                status: 'ACTIVE'
            },
            include: {
                course: {
                    select: { id: true, name: true }
                },
                chapter: {
                    select: { id: true, name: true }
                },
                knowledgePoint: {
                    select: { id: true, name: true }
                }
            }
        });
        res.status(201).json({
            success: true,
            data: formatQuestion(question)
        });
    }
    catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({
            success: false,
            error: '创建题目失败',
            code: 'CREATE_QUESTION_FAILED'
        });
    }
});
// ==================== P6.2.4: 更新题目 ====================
router.put('/questions/:id', [
    param('id').isUUID().withMessage('题目ID必须是有效的UUID'),
    body('content').optional().isString().notEmpty().withMessage('题目内容不能为空'),
    body('options').optional().isArray().withMessage('选项必须是数组'),
    body('answer').optional().isObject().withMessage('答案必须是对象'),
    body('explanation').optional().isString().withMessage('解析必须是字符串'),
    body('difficulty').optional().isInt({ min: 1, max: 10 }).toInt().withMessage('难度必须是1-10'),
    body('score').optional().isInt({ min: 1 }).toInt().withMessage('分值必须是正整数'),
    body('timeLimit').optional().isInt({ min: 1 }).toInt().withMessage('时间限制必须是正整数'),
    body('tags').optional().isArray().withMessage('标签必须是数组'),
    body('status').optional().isIn(['ACTIVE', 'INACTIVE', 'REVIEW']).withMessage('状态无效'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法更新题目',
                code: 'NOT_AUTHENTICATED'
            });
        }
        // 检查题目是否存在
        const existingQuestion = await prisma.question.findUnique({
            where: { id }
        });
        if (!existingQuestion) {
            return res.status(404).json({
                success: false,
                error: '题目不存在',
                code: 'QUESTION_NOT_FOUND'
            });
        }
        const { content, options, answer, explanation, difficulty, score, timeLimit, tags, status } = req.body;
        // 构建更新数据
        const updateData = {};
        if (content !== undefined)
            updateData.content = content;
        if (options !== undefined)
            updateData.options = JSON.stringify(options);
        if (answer !== undefined)
            updateData.answer = JSON.stringify(answer);
        if (explanation !== undefined)
            updateData.explanation = explanation;
        if (difficulty !== undefined)
            updateData.difficulty = difficulty;
        if (score !== undefined)
            updateData.score = score;
        if (timeLimit !== undefined)
            updateData.timeLimit = timeLimit;
        if (tags !== undefined)
            updateData.tags = JSON.stringify(tags);
        if (status !== undefined)
            updateData.status = status;
        // 更新题目
        const question = await prisma.question.update({
            where: { id },
            data: updateData,
            include: {
                course: {
                    select: { id: true, name: true }
                },
                chapter: {
                    select: { id: true, name: true }
                },
                knowledgePoint: {
                    select: { id: true, name: true }
                }
            }
        });
        res.json({
            success: true,
            data: formatQuestion(question)
        });
    }
    catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({
            success: false,
            error: '更新题目失败',
            code: 'UPDATE_QUESTION_FAILED'
        });
    }
});
// ==================== P6.2.5: 删除题目 ====================
router.delete('/questions/:id', [
    param('id').isUUID().withMessage('题目ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法删除题目',
                code: 'NOT_AUTHENTICATED'
            });
        }
        // 检查题目是否存在
        const existingQuestion = await prisma.question.findUnique({
            where: { id }
        });
        if (!existingQuestion) {
            return res.status(404).json({
                success: false,
                error: '题目不存在',
                code: 'QUESTION_NOT_FOUND'
            });
        }
        // 检查是否有答题记录
        const answerRecordsCount = await prisma.answerRecord.count({
            where: { questionId: id }
        });
        if (answerRecordsCount > 0) {
            // 有答题记录，软删除（改为 INACTIVE）
            await prisma.question.update({
                where: { id },
                data: { status: 'INACTIVE' }
            });
            return res.json({
                success: true,
                data: {
                    message: '题目已禁用（该题目有答题记录）',
                    softDeleted: true
                }
            });
        }
        // 无答题记录，硬删除
        await prisma.question.delete({
            where: { id }
        });
        res.json({
            success: true,
            data: {
                message: '题目已删除',
                hardDeleted: true
            }
        });
    }
    catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({
            success: false,
            error: '删除题目失败',
            code: 'DELETE_QUESTION_FAILED'
        });
    }
});
// ==================== P6.2.6: 批量导入题目 ====================
router.post('/questions/import', [
    body('questions').isArray({ min: 1 }).withMessage('题目数组不能为空'),
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法导入题目',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { questions, courseId } = req.body;
        // 验证课程存在
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
        const imported = [];
        const skipped = [];
        const errors = [];
        // 逐个导入题目
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            try {
                // 验证必填字段
                if (!q.type || !q.content || !q.answer) {
                    skipped.push(`第${i + 1}题：缺少必填字段`);
                    continue;
                }
                // 验证题目类型
                const validTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'];
                if (!validTypes.includes(q.type)) {
                    skipped.push(`第${i + 1}题：无效的题目类型`);
                    continue;
                }
                // 创建题目
                await prisma.question.create({
                    data: {
                        courseId,
                        chapterId: q.chapterId || null,
                        knowledgePointId: q.knowledgePointId || null,
                        type: q.type,
                        content: q.content,
                        options: q.options ? JSON.stringify(q.options) : null,
                        answer: JSON.stringify(q.answer),
                        explanation: q.explanation || null,
                        difficulty: q.difficulty || 5,
                        score: q.score || 10,
                        timeLimit: q.timeLimit || null,
                        tags: q.tags ? JSON.stringify(q.tags) : null,
                        source: q.source || null,
                        status: 'ACTIVE'
                    }
                });
                imported.push(q.content.substring(0, 20));
            }
            catch (err) {
                errors.push(`第${i + 1}题：${err.message}`);
            }
        }
        res.status(201).json({
            success: true,
            data: {
                imported: imported.length,
                skipped: skipped.length,
                errors: errors.length,
                details: {
                    imported,
                    skipped,
                    errors
                }
            }
        });
    }
    catch (error) {
        console.error('Error importing questions:', error);
        res.status(500).json({
            success: false,
            error: '导入题目失败',
            code: 'IMPORT_QUESTIONS_FAILED'
        });
    }
});
export default router;
//# sourceMappingURL=questions.js.map