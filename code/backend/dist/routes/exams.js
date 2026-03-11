import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
import { getUserIdFromRequest } from './auth.js';
const router = Router();
// ==================== Helper Functions ====================
/**
 * 根据策略抽取题目
 */
async function selectQuestionsByStrategy(courseId, config, strategy, excludeIds = []) {
    const { totalQuestions, difficulty, typeDistribution } = config;
    // 获取所有可用题目
    const availableQuestions = await prisma.question.findMany({
        where: {
            courseId,
            status: 'ACTIVE',
            id: { notIn: excludeIds }
        },
        orderBy: { createdAt: 'desc' }
    });
    if (availableQuestions.length === 0)
        return [];
    // 根据难度分组
    const easyQuestions = availableQuestions.filter(q => q.difficulty <= 3);
    const mediumQuestions = availableQuestions.filter(q => q.difficulty > 3 && q.difficulty <= 7);
    const hardQuestions = availableQuestions.filter(q => q.difficulty > 7);
    // 根据题型分组
    const questionsByType = new Map();
    for (const q of availableQuestions) {
        const type = q.type;
        if (!questionsByType.has(type)) {
            questionsByType.set(type, []);
        }
        questionsByType.get(type).push(q);
    }
    // 计算各类题目数量
    const easyCount = Math.round(totalQuestions * difficulty.easy);
    const mediumCount = Math.round(totalQuestions * difficulty.medium);
    const hardCount = totalQuestions - easyCount - mediumCount;
    const selected = [];
    // 按难度比例抽取
    const shuffleArray = (arr) => {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };
    // 抽取简单题
    const selectedEasy = shuffleArray(easyQuestions).slice(0, easyCount);
    selected.push(...selectedEasy);
    // 抽取中等题
    const selectedMedium = shuffleArray(mediumQuestions).slice(0, mediumCount);
    selected.push(...selectedMedium);
    // 抽取困难题
    const selectedHard = shuffleArray(hardQuestions).slice(0, hardCount);
    selected.push(...selectedHard);
    // 如果还不够，按题型补充
    if (selected.length < totalQuestions) {
        const remaining = availableQuestions.filter(q => !selected.some(s => s.id === q.id));
        const shuffledRemaining = shuffleArray(remaining);
        for (const q of shuffledRemaining) {
            if (selected.length >= totalQuestions)
                break;
            selected.push(q);
        }
    }
    // 如果超过目标数量，随机截断
    return shuffleArray(selected).slice(0, totalQuestions);
}
/**
 * 计算试卷总分
 */
function calculateTotalScore(questions) {
    return questions.reduce((sum, q) => sum + (q.score || 10), 0);
}
// ==================== Routes ====================
// 注意：所有 /exams 路由必须放在 /:id 路由之前
/**
 * POST /api/exams/generate
 * AI智能组卷
 */
router.post('/generate', [
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('title').notEmpty().withMessage('试卷标题不能为空'),
    body('config.totalQuestions').isInt({ min: 1, max: 200 }).withMessage('题目数量必须在1-200之间'),
    body('config.difficulty').isObject().withMessage('难度配置必须是对象'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法创建试卷',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { courseId, title, description, config } = req.body;
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
        // 默认配置
        const defaultConfig = {
            totalQuestions: config.totalQuestions || 20,
            totalScore: config.totalScore || 100,
            difficulty: config.difficulty || { easy: 0.3, medium: 0.5, hard: 0.2 },
            typeDistribution: config.typeDistribution || {},
            knowledgePointCoverage: config.knowledgePointCoverage || 0.8,
            includeOldMistakes: config.includeOldMistakes || false,
            timeLimit: config.timeLimit || 90
        };
        // 根据策略抽取题目
        const strategy = config.strategy || 'difficulty_based';
        const questions = await selectQuestionsByStrategy(courseId, defaultConfig, strategy);
        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                error: '该课程下没有足够的题目，请先添加题目',
                code: 'INSUFFICIENT_QUESTIONS'
            });
        }
        // 计算总分
        const totalScore = calculateTotalScore(questions);
        const questionIds = questions.map(q => q.id);
        // 创建考试会话
        const examSession = await prisma.examSession.create({
            data: {
                userId,
                courseId,
                type: 'AI_GENERATED',
                title,
                description: description || '',
                questionIds: JSON.stringify(questionIds),
                totalQuestions: questions.length,
                totalScore,
                status: 'IN_PROGRESS'
            }
        });
        // 格式化返回题目（不包含正确答案）
        const formattedQuestions = questions.map(q => ({
            id: q.id,
            type: q.type,
            content: q.content,
            options: q.options ? JSON.parse(q.options) : null,
            difficulty: q.difficulty,
            score: q.score,
            knowledgePointId: q.knowledgePointId,
            tags: q.tags ? JSON.parse(q.tags) : null
        }));
        res.status(201).json({
            success: true,
            data: {
                examSessionId: examSession.id,
                title,
                questions: formattedQuestions,
                totalQuestions: questions.length,
                totalScore,
                timeLimit: defaultConfig.timeLimit,
                generatedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error generating exam:', error);
        res.status(500).json({
            success: false,
            error: '生成试卷失败',
            code: 'GENERATE_EXAM_FAILED'
        });
    }
});
/**
 * POST /api/exams/generate-by-filters
 * 按条件组卷
 */
router.post('/generate-by-filters', [
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('questionCount').isInt({ min: 1, max: 200 }).withMessage('题目数量必须在1-200之间'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法创建试卷',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { courseId, chapterIds, knowledgePointIds, types, difficultyRange, questionCount, randomOrder = true, title } = req.body;
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
        // 构建查询条件
        const whereClause = {
            courseId,
            status: 'ACTIVE'
        };
        if (chapterIds && chapterIds.length > 0) {
            whereClause.chapterId = { in: chapterIds };
        }
        if (knowledgePointIds && knowledgePointIds.length > 0) {
            whereClause.knowledgePointId = { in: knowledgePointIds };
        }
        if (types && types.length > 0) {
            whereClause.type = { in: types };
        }
        if (difficultyRange && difficultyRange.length === 2) {
            whereClause.difficulty = {
                gte: difficultyRange[0],
                lte: difficultyRange[1]
            };
        }
        // 获取符合条件的题目
        const questions = await prisma.question.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有符合条件的题目',
                code: 'NO_MATCHING_QUESTIONS'
            });
        }
        // 随机打乱顺序
        let selectedQuestions = [...questions];
        if (randomOrder) {
            for (let i = selectedQuestions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
            }
        }
        // 截取目标数量
        selectedQuestions = selectedQuestions.slice(0, questionCount);
        // 计算总分
        const totalScore = calculateTotalScore(selectedQuestions);
        const questionIds = selectedQuestions.map(q => q.id);
        // 创建考试会话
        const examSession = await prisma.examSession.create({
            data: {
                userId,
                courseId,
                type: 'PRACTICE',
                title: title || `${course.name} - 专项练习`,
                questionIds: JSON.stringify(questionIds),
                totalQuestions: selectedQuestions.length,
                totalScore,
                status: 'IN_PROGRESS'
            }
        });
        // 格式化返回题目
        const formattedQuestions = selectedQuestions.map(q => ({
            id: q.id,
            type: q.type,
            content: q.content,
            options: q.options ? JSON.parse(q.options) : null,
            difficulty: q.difficulty,
            score: q.score,
            knowledgePointId: q.knowledgePointId,
            chapterId: q.chapterId
        }));
        res.status(201).json({
            success: true,
            data: {
                examSessionId: examSession.id,
                title: examSession.title,
                questions: formattedQuestions,
                totalQuestions: selectedQuestions.length,
                totalScore,
                filters: {
                    chapterIds,
                    knowledgePointIds,
                    types,
                    difficultyRange
                }
            }
        });
    }
    catch (error) {
        console.error('Error generating exam by filters:', error);
        res.status(500).json({
            success: false,
            error: '生成试卷失败',
            code: 'GENERATE_EXAM_FAILED'
        });
    }
});
/**
 * GET /api/exams
 * 获取考试会话列表
 */
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('status').optional().isIn(['IN_PROGRESS', 'COMPLETED', 'ABANDONED']).withMessage('无效的考试状态'),
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
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const status = req.query.status;
        const courseId = req.query.courseId;
        const whereClause = { userId };
        if (status) {
            whereClause.status = status;
        }
        if (courseId) {
            whereClause.courseId = courseId;
        }
        const [sessions, total] = await Promise.all([
            prisma.examSession.findMany({
                where: whereClause,
                orderBy: { startedAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    course: {
                        select: { id: true, name: true }
                    }
                }
            }),
            prisma.examSession.count({ where: whereClause })
        ]);
        res.json({
            success: true,
            data: {
                sessions: sessions.map(s => ({
                    id: s.id,
                    type: s.type,
                    title: s.title,
                    totalQuestions: s.totalQuestions,
                    answeredCount: s.answeredCount,
                    correctCount: s.correctCount,
                    score: s.score,
                    status: s.status,
                    startedAt: s.startedAt,
                    completedAt: s.completedAt,
                    course: s.course
                })),
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
        console.error('Error listing exam sessions:', error);
        res.status(500).json({
            success: false,
            error: '获取考试记录失败',
            code: 'LIST_EXAM_SESSIONS_FAILED'
        });
    }
});
/**
 * POST /api/exams/:sessionId/answers
 * 提交答案
 */
router.post('/:sessionId/answers', [
    param('sessionId').isUUID().withMessage('考试ID必须是有效的UUID'),
    body('questionId').isUUID().withMessage('题目ID必须是有效的UUID'),
    body('userAnswer').notEmpty().withMessage('答案不能为空'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { sessionId } = req.params;
        const { questionId, userAnswer, timeSpent } = req.body;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录',
                code: 'NOT_AUTHENTICATED'
            });
        }
        // 查找考试会话
        const session = await prisma.examSession.findFirst({
            where: { id: sessionId, userId }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                error: '考试会话不存在',
                code: 'EXAM_SESSION_NOT_FOUND'
            });
        }
        if (session.status !== 'IN_PROGRESS') {
            return res.status(400).json({
                success: false,
                error: '考试已完成或已放弃',
                code: 'EXAM_NOT_IN_PROGRESS'
            });
        }
        // 查找题目
        const question = await prisma.question.findUnique({
            where: { id: questionId }
        });
        if (!question) {
            return res.status(404).json({
                success: false,
                error: '题目不存在',
                code: 'QUESTION_NOT_FOUND'
            });
        }
        // 验证答案
        let isCorrect = false;
        try {
            const correctAnswer = JSON.parse(question.answer);
            if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
                isCorrect = userAnswer === correctAnswer.correct;
            }
            else if (question.type === 'MULTIPLE_CHOICE') {
                const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                const correctAnswers = correctAnswer.correct || [];
                isCorrect = userAnswers.length === correctAnswers.length &&
                    userAnswers.every((a) => correctAnswers.includes(a));
            }
            else {
                // 简答题和论述题默认不自动评分
                isCorrect = false;
            }
        }
        catch (e) {
            console.error('Error parsing answer:', e);
        }
        // 创建答题记录
        const answerRecord = await prisma.answerRecord.create({
            data: {
                userId,
                questionId,
                examSessionId: sessionId,
                userAnswer: typeof userAnswer === 'string' ? userAnswer : JSON.stringify(userAnswer),
                isCorrect,
                timeSpent: timeSpent || null
            }
        });
        // 更新题目的使用次数和正确率
        const [totalCount, correctCountResult] = await Promise.all([
            prisma.answerRecord.count({ where: { questionId } }),
            prisma.answerRecord.count({ where: { questionId, isCorrect: true } })
        ]);
        const usedCount = totalCount;
        const correctCount = correctCountResult;
        const correctRate = usedCount > 0 ? correctCount / usedCount : 0;
        await prisma.question.update({
            where: { id: questionId },
            data: {
                usedCount,
                correctRate
            }
        });
        // 更新考试会话统计
        const [answeredCount, correctCount2] = await Promise.all([
            prisma.answerRecord.count({ where: { examSessionId: sessionId } }),
            prisma.answerRecord.count({ where: { examSessionId: sessionId, isCorrect: true } })
        ]);
        await prisma.examSession.update({
            where: { id: sessionId },
            data: {
                answeredCount,
                correctCount: correctCount2
            }
        });
        res.status(201).json({
            success: true,
            data: {
                isCorrect,
                correctAnswer: question.answer ? JSON.parse(question.answer) : null,
                explanation: question.explanation,
                score: isCorrect ? question.score : 0,
                aiAnalysis: null,
                answerRecordId: answerRecord.id
            }
        });
    }
    catch (error) {
        console.error('Error submitting answer:', error);
        res.status(500).json({
            success: false,
            error: '提交答案失败',
            code: 'SUBMIT_ANSWER_FAILED'
        });
    }
});
/**
 * POST /api/exams/:sessionId/submit
 * 交卷
 */
router.post('/:sessionId/submit', [
    param('sessionId').isUUID().withMessage('考试ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { sessionId } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录',
                code: 'NOT_AUTHENTICATED'
            });
        }
        // 查找考试会话
        const session = await prisma.examSession.findFirst({
            where: { id: sessionId, userId },
            include: {
                answerRecords: true
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                error: '考试会话不存在',
                code: 'EXAM_SESSION_NOT_FOUND'
            });
        }
        if (session.status !== 'IN_PROGRESS') {
            return res.status(400).json({
                success: false,
                error: '考试已完成或已放弃',
                code: 'EXAM_NOT_IN_PROGRESS'
            });
        }
        // 计算得分
        const totalScore = session.totalQuestions * 10; // 默认每题10分
        const correctCount = session.answerRecords.filter(ar => ar.isCorrect).length;
        const score = totalScore > 0 ? (correctCount / session.totalQuestions) * 100 : 0;
        // 更新考试状态
        await prisma.examSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                score,
                answeredCount: session.answerRecords.length,
                correctCount
            }
        });
        res.json({
            success: true,
            data: {
                examSessionId: sessionId,
                totalQuestions: session.totalQuestions,
                answeredCount: session.answerRecords.length,
                correctCount,
                score: Math.round(score * 100) / 100,
                completedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error submitting exam:', error);
        res.status(500).json({
            success: false,
            error: '交卷失败',
            code: 'SUBMIT_EXAM_FAILED'
        });
    }
});
// ==================== P6.4 随机抽题服务 ====================
/**
 * POST /api/exams/random
 * 随机抽题
 */
router.post('/random', [
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('count').isInt({ min: 1, max: 50 }).withMessage('题目数量必须在1-50之间'),
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
        const { courseId, count = 5, excludeIds = [], filters = {} } = req.body;
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
        // 构建查询条件
        const whereClause = {
            courseId,
            status: 'ACTIVE',
            id: { notIn: excludeIds }
        };
        if (filters.type) {
            whereClause.type = filters.type;
        }
        if (filters.difficulty && Array.isArray(filters.difficulty) && filters.difficulty.length === 2) {
            whereClause.difficulty = {
                gte: filters.difficulty[0],
                lte: filters.difficulty[1]
            };
        }
        if (filters.knowledgePointId) {
            whereClause.knowledgePointId = filters.knowledgePointId;
        }
        if (filters.chapterId) {
            whereClause.chapterId = filters.chapterId;
        }
        // 获取所有符合条件的题目
        const questions = await prisma.question.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' }
        });
        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有符合条件的题目',
                code: 'NO_MATCHING_QUESTIONS'
            });
        }
        // 随机打乱并抽取指定数量
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selectedQuestions = shuffled.slice(0, count);
        // 格式化返回（不包含正确答案）
        const formattedQuestions = selectedQuestions.map(q => ({
            id: q.id,
            type: q.type,
            content: q.content,
            options: q.options ? JSON.parse(q.options) : null,
            difficulty: q.difficulty,
            score: q.score,
            knowledgePointId: q.knowledgePointId,
            chapterId: q.chapterId,
            tags: q.tags ? JSON.parse(q.tags) : null
        }));
        res.json({
            success: true,
            data: {
                questions: formattedQuestions,
                totalAvailable: questions.length,
                selectedCount: selectedQuestions.length
            }
        });
    }
    catch (error) {
        console.error('Error getting random questions:', error);
        res.status(500).json({
            success: false,
            error: '获取随机题目失败',
            code: 'GET_RANDOM_QUESTIONS_FAILED'
        });
    }
});
/**
 * GET /api/exams/daily-practice
 * 每日一练
 */
router.get('/daily-practice', [
    query('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
    query('difficulty').optional().isInt({ min: 1, max: 10 }).withMessage('难度必须是1-10之间的数字'),
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
        const { courseId, difficulty = 5 } = req.query;
        // 构建查询条件
        const whereClause = {
            status: 'ACTIVE'
        };
        if (courseId) {
            whereClause.courseId = courseId;
            // 如果指定了课程，获取该课程的题目
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
        }
        // 根据难度偏好筛选
        whereClause.difficulty = {
            gte: Math.max(1, difficulty - 2),
            lte: Math.min(10, difficulty + 2)
        };
        // 获取所有符合条件的题目
        const questions = await prisma.question.findMany({
            where: whereClause,
            orderBy: [{ correctRate: 'asc' }, { usedCount: 'asc' }, { createdAt: 'desc' }],
            take: 20
        });
        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有可用的题目',
                code: 'NO_AVAILABLE_QUESTIONS'
            });
        }
        // 根据日期随机选择一道题
        const today = new Date();
        const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const index = dateSeed % questions.length;
        const dailyQuestion = questions[index];
        // 计算连续答题天数
        const userAnswerRecords = await prisma.answerRecord.findMany({
            where: { userId },
            orderBy: { answeredAt: 'desc' },
            take: 100
        });
        let streak = 0;
        let checkDate = new Date();
        checkDate.setHours(0, 0, 0, 0);
        for (const record of userAnswerRecords) {
            const recordDate = new Date(record.answeredAt);
            recordDate.setHours(0, 0, 0, 0);
            if (recordDate.getTime() === checkDate.getTime()) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            else if (recordDate.getTime() < checkDate.getTime()) {
                break;
            }
        }
        // 统计总答题数和正确率
        const [totalAnswered, totalCorrect] = await Promise.all([
            prisma.answerRecord.count({ where: { userId } }),
            prisma.answerRecord.count({ where: { userId, isCorrect: true } })
        ]);
        const correctRate = totalAnswered > 0 ? totalCorrect / totalAnswered : 0;
        res.json({
            success: true,
            data: {
                date: today.toISOString().split('T')[0],
                question: {
                    id: dailyQuestion.id,
                    type: dailyQuestion.type,
                    content: dailyQuestion.content,
                    options: dailyQuestion.options ? JSON.parse(dailyQuestion.options) : null,
                    difficulty: dailyQuestion.difficulty,
                    score: dailyQuestion.score,
                    knowledgePointId: dailyQuestion.knowledgePointId
                },
                streak,
                totalAnswered,
                correctRate: Math.round(correctRate * 100) / 100
            }
        });
    }
    catch (error) {
        console.error('Error getting daily practice:', error);
        res.status(500).json({
            success: false,
            error: '获取每日一练失败',
            code: 'GET_DAILY_PRACTICE_FAILED'
        });
    }
});
/**
 * POST /api/exams/challenge
 * 挑战模式
 */
router.post('/challenge', [
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('mode').isIn(['speed', 'accuracy', 'endurance']).withMessage('挑战模式必须是 speed/accuracy/endurance'),
    body('count').isInt({ min: 5, max: 50 }).withMessage('题目数量必须在5-50之间'),
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
        const { courseId, mode = 'accuracy', count = 10 } = req.body;
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
        // 根据模式设置难度分布
        let difficultyRange;
        switch (mode) {
            case 'speed':
                // 速度模式：简单题为主
                difficultyRange = [1, 5];
                break;
            case 'accuracy':
                // 准确率模式：中等难度
                difficultyRange = [3, 7];
                break;
            case 'endurance':
                // 耐力模式：混合难度
                difficultyRange = [1, 10];
                break;
            default:
                difficultyRange = [1, 10];
        }
        // 获取符合条件的题目
        const questions = await prisma.question.findMany({
            where: {
                courseId,
                status: 'ACTIVE',
                difficulty: {
                    gte: difficultyRange[0],
                    lte: difficultyRange[1]
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有符合条件的题目',
                code: 'NO_MATCHING_QUESTIONS'
            });
        }
        // 随机打乱并抽取
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selectedQuestions = shuffled.slice(0, count);
        // 计算总分
        const totalScore = selectedQuestions.reduce((sum, q) => sum + (q.score || 10), 0);
        // 创建挑战会话
        const challengeSession = await prisma.examSession.create({
            data: {
                userId,
                courseId,
                type: 'RANDOM_TEST',
                title: `${course.name} - ${getModeTitle(mode)}挑战`,
                description: `挑战模式：${getModeDescription(mode)}`,
                questionIds: JSON.stringify(selectedQuestions.map(q => q.id)),
                totalQuestions: selectedQuestions.length,
                totalScore,
                status: 'IN_PROGRESS'
            }
        });
        // 格式化返回
        const formattedQuestions = selectedQuestions.map(q => ({
            id: q.id,
            type: q.type,
            content: q.content,
            options: q.options ? JSON.parse(q.options) : null,
            difficulty: q.difficulty,
            score: q.score,
            knowledgePointId: q.knowledgePointId
        }));
        // 根据模式返回不同的时间限制
        let timeLimit;
        switch (mode) {
            case 'speed':
                timeLimit = count * 15; // 每题15秒
                break;
            case 'accuracy':
                timeLimit = count * 60; // 每题60秒
                break;
            case 'endurance':
                timeLimit = count * 90; // 每题90秒
                break;
            default:
                timeLimit = count * 60;
        }
        res.status(201).json({
            success: true,
            data: {
                sessionId: challengeSession.id,
                mode,
                title: challengeSession.title,
                questions: formattedQuestions,
                totalQuestions: selectedQuestions.length,
                totalScore,
                timeLimit,
                description: getModeDescription(mode)
            }
        });
    }
    catch (error) {
        console.error('Error starting challenge:', error);
        res.status(500).json({
            success: false,
            error: '创建挑战失败',
            code: 'START_CHALLENGE_FAILED'
        });
    }
});
/**
 * 获取挑战模式标题
 */
function getModeTitle(mode) {
    switch (mode) {
        case 'speed':
            return '速度';
        case 'accuracy':
            return '准确率';
        case 'endurance':
            return '耐力';
        default:
            return '挑战';
    }
}
/**
 * 获取挑战模式描述
 */
function getModeDescription(mode) {
    switch (mode) {
        case 'speed':
            return '在最短时间内完成答题，题目较简单';
        case 'accuracy':
            return '在限定时间内准确答题，题目难度适中';
        case 'endurance':
            return '大量题目综合挑战，考验耐力';
        default:
            return '挑战模式';
    }
}
// ==================== P6.5 答题记录与分析 ====================
/**
 * POST /api/exams/sessions
 * 创建答题会话
 */
router.post('/sessions', [
    body('type').isIn(['MOCK_EXAM', 'PRACTICE', 'RANDOM_TEST', 'AI_GENERATED']).withMessage('考试类型无效'),
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('title').notEmpty().withMessage('标题不能为空'),
    body('questionIds').isArray({ min: 1 }).withMessage('题目ID列表不能为空'),
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
        const { type, courseId, title, description, questionIds } = req.body;
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
        // 验证题目存在
        const questions = await prisma.question.findMany({
            where: {
                id: { in: questionIds },
                status: 'ACTIVE'
            }
        });
        if (questions.length !== questionIds.length) {
            return res.status(400).json({
                success: false,
                error: '部分题目不存在或已禁用',
                code: 'INVALID_QUESTIONS'
            });
        }
        // 计算总分
        const totalScore = questions.reduce((sum, q) => sum + (q.score || 10), 0);
        // 创建考试会话
        const session = await prisma.examSession.create({
            data: {
                userId,
                courseId,
                type,
                title,
                description: description || '',
                questionIds: JSON.stringify(questionIds),
                totalQuestions: questions.length,
                totalScore,
                status: 'IN_PROGRESS'
            }
        });
        // 格式化返回题目（不包含正确答案）
        const formattedQuestions = questions.map(q => ({
            id: q.id,
            type: q.type,
            content: q.content,
            options: q.options ? JSON.parse(q.options) : null,
            difficulty: q.difficulty,
            score: q.score,
            knowledgePointId: q.knowledgePointId
        }));
        res.status(201).json({
            success: true,
            data: {
                sessionId: session.id,
                title: session.title,
                description: session.description,
                type: session.type,
                questions: formattedQuestions,
                totalQuestions: questions.length,
                totalScore,
                status: session.status,
                startedAt: session.startedAt
            }
        });
    }
    catch (error) {
        console.error('Error creating exam session:', error);
        res.status(500).json({
            success: false,
            error: '创建考试会话失败',
            code: 'CREATE_SESSION_FAILED'
        });
    }
});
/**
 * GET /api/exams/records
 * 获取答题记录列表
 */
router.get('/records', [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('questionId').optional().isUUID().withMessage('题目ID必须是有效的UUID'),
    query('isCorrect').optional().isBoolean().withMessage('isCorrect必须是布尔值'),
    query('examSessionId').optional().isUUID().withMessage('考试ID必须是有效的UUID'),
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
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const { questionId, isCorrect, examSessionId } = req.query;
        const whereClause = { userId };
        if (questionId) {
            whereClause.questionId = questionId;
        }
        if (isCorrect !== undefined) {
            whereClause.isCorrect = isCorrect === 'true';
        }
        if (examSessionId) {
            whereClause.examSessionId = examSessionId;
        }
        const [records, total] = await Promise.all([
            prisma.answerRecord.findMany({
                where: whereClause,
                orderBy: { answeredAt: 'desc' },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    question: {
                        select: {
                            id: true,
                            type: true,
                            content: true,
                            difficulty: true,
                            score: true,
                            courseId: true,
                            knowledgePointId: true
                        }
                    },
                    examSession: {
                        select: {
                            id: true,
                            title: true,
                            type: true
                        }
                    }
                }
            }),
            prisma.answerRecord.count({ where: whereClause })
        ]);
        res.json({
            success: true,
            data: {
                records: records.map(r => ({
                    id: r.id,
                    questionId: r.questionId,
                    userAnswer: r.userAnswer,
                    isCorrect: r.isCorrect,
                    timeSpent: r.timeSpent,
                    answeredAt: r.answeredAt,
                    question: r.question ? {
                        id: r.question.id,
                        type: r.question.type,
                        content: r.question.content,
                        difficulty: r.question.difficulty,
                        score: r.question.score,
                        courseId: r.question.courseId,
                        knowledgePointId: r.question.knowledgePointId
                    } : null,
                    examSession: r.examSession
                })),
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
        console.error('Error listing answer records:', error);
        res.status(500).json({
            success: false,
            error: '获取答题记录失败',
            code: 'LIST_RECORDS_FAILED'
        });
    }
});
/**
 * GET /api/exams/statistics
 * 获取答题统计
 */
router.get('/statistics', [
    query('courseId').optional().isUUID().withMessage('课程ID必须是有效的UUID'),
    query('timeRange').optional().isIn(['week', 'month', 'all']).withMessage('时间范围无效'),
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
        const { courseId, timeRange = 'all' } = req.query;
        // 计算时间范围
        let startDate;
        const now = new Date();
        if (timeRange === 'week') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }
        else if (timeRange === 'month') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        // 构建查询条件
        const whereClause = { userId };
        if (courseId) {
            whereClause.question = { courseId };
        }
        if (startDate) {
            whereClause.answeredAt = { gte: startDate };
        }
        // 获取基本统计
        const [totalAnswered, correctCount, records] = await Promise.all([
            prisma.answerRecord.count({ where: whereClause }),
            prisma.answerRecord.count({ where: { ...whereClause, isCorrect: true } }),
            prisma.answerRecord.findMany({
                where: whereClause,
                include: {
                    question: {
                        select: {
                            type: true,
                            difficulty: true,
                            knowledgePointId: true
                        }
                    }
                },
                orderBy: { answeredAt: 'asc' }
            })
        ]);
        const correctRate = totalAnswered > 0 ? correctCount / totalAnswered : 0;
        // 计算平均答题时间
        const timeSpentRecords = records.filter(r => r.timeSpent !== null);
        const averageTime = timeSpentRecords.length > 0
            ? timeSpentRecords.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / timeSpentRecords.length
            : 0;
        // 按题型统计
        const byType = {};
        const typeMap = new Map();
        for (const record of records) {
            const type = record.question?.type || 'UNKNOWN';
            if (!typeMap.has(type)) {
                typeMap.set(type, { total: 0, correct: 0 });
            }
            const stats = typeMap.get(type);
            stats.total++;
            if (record.isCorrect)
                stats.correct++;
        }
        for (const [type, stats] of typeMap) {
            byType[type] = {
                total: stats.total,
                correct: stats.correct,
                rate: stats.total > 0 ? Math.round(stats.correct / stats.total * 100) / 100 : 0
            };
        }
        // 按难度统计
        const byDifficulty = {};
        const difficultyMap = new Map();
        for (const record of records) {
            const difficulty = record.question?.difficulty || 5;
            const level = difficulty <= 3 ? 'easy' : difficulty <= 7 ? 'medium' : 'hard';
            if (!difficultyMap.has(level)) {
                difficultyMap.set(level, { total: 0, correct: 0 });
            }
            const stats = difficultyMap.get(level);
            stats.total++;
            if (record.isCorrect)
                stats.correct++;
        }
        for (const [level, stats] of difficultyMap) {
            byDifficulty[level] = {
                total: stats.total,
                correct: stats.correct,
                rate: stats.total > 0 ? Math.round(stats.correct / stats.total * 100) / 100 : 0
            };
        }
        // 薄弱知识点
        const knowledgePointStats = new Map();
        for (const record of records) {
            if (!record.question?.knowledgePointId)
                continue;
            const kpId = record.question.knowledgePointId;
            if (!knowledgePointStats.has(kpId)) {
                knowledgePointStats.set(kpId, { total: 0, correct: 0 });
            }
            const stats = knowledgePointStats.get(kpId);
            stats.total++;
            if (record.isCorrect)
                stats.correct++;
        }
        // 获取知识点名称
        const kpIds = Array.from(knowledgePointStats.keys());
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: { id: { in: kpIds } }
        });
        const kpNameMap = new Map(knowledgePoints.map(kp => [kp.id, kp.name]));
        const weakAreas = Array.from(knowledgePointStats.entries())
            .map(([id, stats]) => ({
            knowledgePointId: id,
            name: kpNameMap.get(id) || '未知知识点',
            total: stats.total,
            correct: stats.correct,
            correctRate: stats.total > 0 ? Math.round(stats.correct / stats.total * 100) / 100 : 0
        }))
            .filter(item => item.total >= 3 && item.correctRate < 0.7)
            .sort((a, b) => a.correctRate - b.correctRate)
            .slice(0, 10);
        // 趋势数据（按天）
        const trendMap = new Map();
        for (const record of records) {
            const date = record.answeredAt.toISOString().split('T')[0];
            if (!trendMap.has(date)) {
                trendMap.set(date, { total: 0, correct: 0 });
            }
            const stats = trendMap.get(date);
            stats.total++;
            if (record.isCorrect)
                stats.correct++;
        }
        const trend = Array.from(trendMap.entries())
            .map(([date, stats]) => ({
            date,
            total: stats.total,
            correct: stats.correct,
            correctRate: stats.total > 0 ? Math.round(stats.correct / stats.total * 100) / 100 : 0
        }))
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(-30);
        res.json({
            success: true,
            data: {
                totalAnswered,
                correctCount,
                correctRate: Math.round(correctRate * 100) / 100,
                averageTime: Math.round(averageTime),
                byType,
                byDifficulty,
                weakAreas,
                trend
            }
        });
    }
    catch (error) {
        console.error('Error getting statistics:', error);
        res.status(500).json({
            success: false,
            error: '获取答题统计失败',
            code: 'GET_STATISTICS_FAILED'
        });
    }
});
/**
 * GET /api/exams/mistakes
 * 获取错题本
 */
router.get('/mistakes', [
    query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
    query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
    query('knowledgePointId').optional().isUUID().withMessage('知识点ID必须是有效的UUID'),
    query('reviewed').optional().isBoolean().withMessage('reviewed必须是布尔值'),
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
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const { knowledgePointId, reviewed } = req.query;
        // 获取所有错题记录
        const wrongRecords = await prisma.answerRecord.findMany({
            where: {
                userId,
                isCorrect: false,
                question: {
                    status: 'ACTIVE'
                }
            },
            include: {
                question: {
                    select: {
                        id: true,
                        type: true,
                        content: true,
                        difficulty: true,
                        score: true,
                        knowledgePointId: true,
                        chapterId: true
                    }
                }
            },
            orderBy: { answeredAt: 'desc' }
        });
        // 按题目分组，统计错题次数
        const mistakeMap = new Map();
        for (const record of wrongRecords) {
            if (!mistakeMap.has(record.questionId)) {
                mistakeMap.set(record.questionId, {
                    questionId: record.questionId,
                    wrongCount: 0,
                    lastAnsweredAt: record.answeredAt,
                    question: record.question
                });
            }
            const stats = mistakeMap.get(record.questionId);
            stats.wrongCount++;
            if (record.answeredAt > stats.lastAnsweredAt) {
                stats.lastAnsweredAt = record.answeredAt;
            }
        }
        // 转换为数组
        let mistakes = Array.from(mistakeMap.values());
        // 过滤
        if (knowledgePointId) {
            mistakes = mistakes.filter(m => m.question?.knowledgePointId === knowledgePointId);
        }
        // 获取每个题目的正确答案
        const questions = await prisma.question.findMany({
            where: { id: { in: mistakes.map(m => m.questionId) } }
        });
        const questionMap = new Map(questions.map(q => [q.id, q]));
        // 获取最近一次答题记录（包含用户答案）
        const latestRecords = await prisma.answerRecord.findMany({
            where: {
                userId,
                questionId: { in: mistakes.map(m => m.questionId) },
                isCorrect: false
            },
            orderBy: { answeredAt: 'desc' }
        });
        const latestRecordMap = new Map();
        for (const record of latestRecords) {
            if (!latestRecordMap.has(record.questionId)) {
                latestRecordMap.set(record.questionId, record);
            }
        }
        // 计算统计
        const total = mistakes.length;
        const reviewedCount = 0; // 可以通过添加标记字段来实现
        // 格式化返回
        const formattedMistakes = mistakes
            .slice((page - 1) * pageSize, page * pageSize)
            .map(m => {
            const question = questionMap.get(m.questionId);
            const latestRecord = latestRecordMap.get(m.questionId);
            return {
                questionId: m.questionId,
                content: question?.content || m.question?.content,
                type: question?.type || m.question?.type,
                difficulty: question?.difficulty || m.question?.difficulty,
                score: question?.score || m.question?.score,
                userAnswer: latestRecord?.userAnswer || '',
                correctAnswer: question?.answer ? JSON.parse(question.answer) : null,
                wrongCount: m.wrongCount,
                lastAnsweredAt: m.lastAnsweredAt,
                knowledgePointId: question?.knowledgePointId || m.question?.knowledgePointId,
                chapterId: question?.chapterId || m.question?.chapterId
            };
        });
        res.json({
            success: true,
            data: {
                mistakes: formattedMistakes,
                statistics: {
                    total,
                    reviewed: reviewedCount,
                    notReviewed: total - reviewedCount
                },
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
        console.error('Error getting mistakes:', error);
        res.status(500).json({
            success: false,
            error: '获取错题本失败',
            code: 'GET_MISTAKES_FAILED'
        });
    }
});
/**
 * POST /api/exams/mistakes/retry
 * 错题重做
 */
router.post('/mistakes/retry', [
    body('knowledgePointId').optional().isUUID().withMessage('知识点ID必须是有效的UUID'),
    body('count').optional().isInt({ min: 1, max: 50 }).withMessage('题目数量必须在1-50之间'),
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
        const { knowledgePointId, count = 10, courseId } = req.body;
        // 获取用户的错题
        const wrongRecords = await prisma.answerRecord.findMany({
            where: {
                userId,
                isCorrect: false,
                question: {
                    status: 'ACTIVE',
                    ...(knowledgePointId && { knowledgePointId }),
                    ...(courseId && { courseId })
                }
            },
            select: { questionId: true }
        });
        if (wrongRecords.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有错题记录',
                code: 'NO_MISTAKES'
            });
        }
        // 获取错题详情
        const questionIds = [...new Set(wrongRecords.map(r => r.questionId))];
        const questions = await prisma.question.findMany({
            where: {
                id: { in: questionIds },
                status: 'ACTIVE'
            }
        });
        if (questions.length === 0) {
            return res.status(400).json({
                success: false,
                error: '没有可用的错题',
                code: 'NO_AVAILABLE_MISTAKES'
            });
        }
        // 随机打乱
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selectedQuestions = shuffled.slice(0, count);
        // 计算总分
        const totalScore = selectedQuestions.reduce((sum, q) => sum + (q.score || 10), 0);
        // 创建练习会话
        const session = await prisma.examSession.create({
            data: {
                userId,
                courseId: courseId || questions[0].courseId,
                type: 'PRACTICE',
                title: '错题重做练习',
                description: '针对错题的专项练习',
                questionIds: JSON.stringify(selectedQuestions.map(q => q.id)),
                totalQuestions: selectedQuestions.length,
                totalScore,
                status: 'IN_PROGRESS'
            }
        });
        // 格式化返回
        const formattedQuestions = selectedQuestions.map(q => ({
            id: q.id,
            type: q.type,
            content: q.content,
            options: q.options ? JSON.parse(q.options) : null,
            difficulty: q.difficulty,
            score: q.score,
            knowledgePointId: q.knowledgePointId
        }));
        res.status(201).json({
            success: true,
            data: {
                sessionId: session.id,
                title: session.title,
                questions: formattedQuestions,
                totalQuestions: selectedQuestions.length,
                totalScore,
                mistakeCount: questions.length,
                selectedCount: selectedQuestions.length
            }
        });
    }
    catch (error) {
        console.error('Error retrying mistakes:', error);
        res.status(500).json({
            success: false,
            error: '错题重做失败',
            code: 'RETRY_MISTAKES_FAILED'
        });
    }
});
/**
 * POST /api/exams/personalized-practice
 * 生成个性化练习
 */
router.post('/personalized-practice', [
    body('courseId').isUUID().withMessage('课程ID必须是有效的UUID'),
    body('questionCount').optional().isInt({ min: 5, max: 50 }).withMessage('题目数量必须在5-50之间'),
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
        const { courseId, questionCount = 10 } = req.body;
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
        // 获取用户的错题知识点
        const wrongRecords = await prisma.answerRecord.findMany({
            where: {
                userId,
                isCorrect: false,
                question: {
                    courseId,
                    status: 'ACTIVE'
                }
            },
            include: {
                question: {
                    select: {
                        knowledgePointId: true,
                        difficulty: true,
                        type: true
                    }
                }
            }
        });
        // 统计薄弱知识点
        const weakKnowledgePoints = new Map();
        for (const record of wrongRecords) {
            if (!record.question?.knowledgePointId)
                continue;
            const kpId = record.question.knowledgePointId;
            if (!weakKnowledgePoints.has(kpId)) {
                weakKnowledgePoints.set(kpId, { wrongCount: 0, totalCount: 0 });
            }
            const stats = weakKnowledgePoints.get(kpId);
            stats.wrongCount++;
        }
        // 获取所有答题记录来计算每个知识点的答题总数
        const allRecords = await prisma.answerRecord.findMany({
            where: {
                userId,
                question: {
                    courseId,
                    status: 'ACTIVE'
                }
            },
            include: {
                question: {
                    select: { knowledgePointId: true, type: true }
                }
            }
        });
        for (const record of allRecords) {
            if (!record.question?.knowledgePointId)
                continue;
            const kpId = record.question.knowledgePointId;
            if (!weakKnowledgePoints.has(kpId)) {
                weakKnowledgePoints.set(kpId, { wrongCount: 0, totalCount: 0 });
            }
            weakKnowledgePoints.get(kpId).totalCount++;
        }
        // 找出正确率低的知识点
        const weakKpIds = Array.from(weakKnowledgePoints.entries())
            .filter(([_, stats]) => stats.totalCount >= 2 && stats.wrongCount / stats.totalCount > 0.4)
            .map(([id]) => id);
        // 获取用户擅长和不擅长的题型
        const typeStats = new Map();
        for (const record of allRecords) {
            const type = record.question?.type || 'UNKNOWN';
            if (!typeStats.has(type)) {
                typeStats.set(type, { correct: 0, total: 0 });
            }
            const stats = typeStats.get(type);
            stats.total++;
            if (record.isCorrect)
                stats.correct++;
        }
        // 找出薄弱题型
        const weakTypes = Array.from(typeStats.entries())
            .filter(([_, stats]) => stats.total >= 3 && stats.correct / stats.total < 0.6)
            .map(([type]) => type);
        // 构建查询条件：从薄弱知识点和薄弱题型中抽题
        const questions = await prisma.question.findMany({
            where: {
                courseId,
                status: 'ACTIVE',
                OR: [
                    { knowledgePointId: { in: weakKpIds } },
                    { type: { in: weakTypes } }
                ]
            },
            orderBy: [{ correctRate: 'asc' }, { difficulty: 'desc' }]
        });
        if (questions.length === 0) {
            // 如果没有找到薄弱知识点相关题目，使用随机题目
            const fallbackQuestions = await prisma.question.findMany({
                where: {
                    courseId,
                    status: 'ACTIVE'
                },
                orderBy: { usedCount: 'asc' }
            });
            if (fallbackQuestions.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: '该课程下没有可用题目',
                    code: 'NO_AVAILABLE_QUESTIONS'
                });
            }
            // 随机抽取
            const shuffled = [...fallbackQuestions];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            const selected = shuffled.slice(0, questionCount);
            // 创建会话
            const session = await prisma.examSession.create({
                data: {
                    userId,
                    courseId,
                    type: 'PRACTICE',
                    title: `${course.name} - 个性化练习`,
                    description: '个性化智能推荐练习',
                    questionIds: JSON.stringify(selected.map(q => q.id)),
                    totalQuestions: selected.length,
                    totalScore: selected.reduce((sum, q) => sum + (q.score || 10), 0),
                    status: 'IN_PROGRESS'
                }
            });
            return res.status(201).json({
                success: true,
                data: {
                    sessionId: session.id,
                    title: session.title,
                    questions: selected.map(q => ({
                        id: q.id,
                        type: q.type,
                        content: q.content,
                        options: q.options ? JSON.parse(q.options) : null,
                        difficulty: q.difficulty,
                        score: q.score,
                        knowledgePointId: q.knowledgePointId
                    })),
                    totalQuestions: selected.length,
                    strategy: 'fallback_random'
                }
            });
        }
        // 随机打乱并抽取
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const selectedQuestions = shuffled.slice(0, questionCount);
        const totalScore = selectedQuestions.reduce((sum, q) => sum + (q.score || 10), 0);
        // 创建练习会话
        const session = await prisma.examSession.create({
            data: {
                userId,
                courseId,
                type: 'PRACTICE',
                title: `${course.name} - 个性化练习`,
                description: `针对${weakKpIds.length}个薄弱知识点的专项练习`,
                questionIds: JSON.stringify(selectedQuestions.map(q => q.id)),
                totalQuestions: selectedQuestions.length,
                totalScore,
                status: 'IN_PROGRESS'
            }
        });
        // 获取知识点名称
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            where: { id: { in: weakKpIds } }
        });
        res.status(201).json({
            success: true,
            data: {
                sessionId: session.id,
                title: session.title,
                description: session.description,
                questions: selectedQuestions.map(q => ({
                    id: q.id,
                    type: q.type,
                    content: q.content,
                    options: q.options ? JSON.parse(q.options) : null,
                    difficulty: q.difficulty,
                    score: q.score,
                    knowledgePointId: q.knowledgePointId
                })),
                totalQuestions: selectedQuestions.length,
                totalScore,
                weakKnowledgePoints: knowledgePoints.map(kp => ({
                    id: kp.id,
                    name: kp.name,
                    wrongRate: weakKnowledgePoints.get(kp.id)?.wrongCount || 0,
                    totalCount: weakKnowledgePoints.get(kp.id)?.totalCount || 0
                })),
                weakTypes,
                strategy: 'personalized'
            }
        });
    }
    catch (error) {
        console.error('Error generating personalized practice:', error);
        res.status(500).json({
            success: false,
            error: '生成个性化练习失败',
            code: 'GENERATE_PERSONALIZED_FAILED'
        });
    }
});
// ==================== 参数路由（放在具体路由之后）================
/**
 * GET /api/exams/:id
 * 获取考试会话详情
 */
router.get('/session/:id', [
    param('id').isUUID().withMessage('考试ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const session = await prisma.examSession.findFirst({
            where: { id, userId },
            include: {
                course: {
                    select: { id: true, name: true }
                },
                answerRecords: {
                    include: {
                        question: {
                            select: {
                                id: true,
                                type: true,
                                content: true,
                                options: true,
                                answer: true,
                                explanation: true,
                                score: true
                            }
                        }
                    }
                }
            }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                error: '考试会话不存在',
                code: 'EXAM_SESSION_NOT_FOUND'
            });
        }
        const questionIds = session.questionIds ? JSON.parse(session.questionIds) : [];
        res.json({
            success: true,
            data: {
                id: session.id,
                type: session.type,
                title: session.title,
                description: session.description,
                questionIds,
                totalQuestions: session.totalQuestions,
                answeredCount: session.answeredCount,
                correctCount: session.correctCount,
                score: session.score,
                status: session.status,
                startedAt: session.startedAt,
                completedAt: session.completedAt,
                course: session.course,
                answers: session.answerRecords.map(ar => ({
                    questionId: ar.questionId,
                    userAnswer: ar.userAnswer,
                    isCorrect: ar.isCorrect,
                    timeSpent: ar.timeSpent,
                    question: ar.question ? {
                        content: ar.question.content,
                        options: ar.question.options ? JSON.parse(ar.question.options) : null,
                        answer: ar.question.answer ? JSON.parse(ar.question.answer) : null,
                        explanation: ar.question.explanation,
                        score: ar.question.score
                    } : null
                }))
            }
        });
    }
    catch (error) {
        console.error('Error getting exam session:', error);
        res.status(500).json({
            success: false,
            error: '获取考试详情失败',
            code: 'GET_EXAM_SESSION_FAILED'
        });
    }
});
/**
 * DELETE /api/exams/:id
 * 放弃考试
 */
router.delete('/session/:id', [
    param('id').isUUID().withMessage('考试ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const session = await prisma.examSession.findFirst({
            where: { id, userId }
        });
        if (!session) {
            return res.status(404).json({
                success: false,
                error: '考试会话不存在',
                code: 'EXAM_SESSION_NOT_FOUND'
            });
        }
        await prisma.examSession.update({
            where: { id },
            data: { status: 'ABANDONED' }
        });
        res.json({
            success: true,
            data: { message: '考试已放弃' }
        });
    }
    catch (error) {
        console.error('Error abandoning exam:', error);
        res.status(500).json({
            success: false,
            error: '操作失败',
            code: 'ABANDON_EXAM_FAILED'
        });
    }
});
/**
 * GET /api/exams/records/:id
 * 获取答题详情
 */
router.get('/records/detail/:id', [
    param('id').isUUID().withMessage('记录ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const record = await prisma.answerRecord.findFirst({
            where: { id, userId },
            include: {
                question: true,
                examSession: {
                    select: {
                        id: true,
                        title: true,
                        type: true,
                        courseId: true
                    }
                }
            }
        });
        if (!record) {
            return res.status(404).json({
                success: false,
                error: '答题记录不存在',
                code: 'RECORD_NOT_FOUND'
            });
        }
        res.json({
            success: true,
            data: {
                id: record.id,
                questionId: record.questionId,
                userAnswer: record.userAnswer,
                isCorrect: record.isCorrect,
                timeSpent: record.timeSpent,
                answeredAt: record.answeredAt,
                aiAnalysis: record.aiAnalysis,
                suggestedReview: record.suggestedReview,
                question: record.question ? {
                    id: record.question.id,
                    type: record.question.type,
                    content: record.question.content,
                    options: record.question.options ? JSON.parse(record.question.options) : null,
                    answer: record.question.answer ? JSON.parse(record.question.answer) : null,
                    explanation: record.question.explanation,
                    difficulty: record.question.difficulty,
                    score: record.question.score,
                    tags: record.question.tags ? JSON.parse(record.question.tags) : null
                } : null,
                examSession: record.examSession
            }
        });
    }
    catch (error) {
        console.error('Error getting answer record:', error);
        res.status(500).json({
            success: false,
            error: '获取答题详情失败',
            code: 'GET_RECORD_FAILED'
        });
    }
});
export default router;
//# sourceMappingURL=exams.js.map