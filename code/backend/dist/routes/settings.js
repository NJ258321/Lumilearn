import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
import { getUserIdFromRequest } from './auth.js';
const router = Router();
// 默认偏好设置
const DEFAULT_PREFERENCES = {
    learning: {
        dailyGoal: 60, // 每日学习目标（分钟）
        weeklyGoal: 300, // 每周学习目标（分钟）
        targetGrade: 'B', // 目标等级: S | A | B | C
        examDate: null // 考试日期
    },
    notifications: {
        studyReminder: true, // 学习提醒
        reviewReminder: true, // 复习提醒
        examReminder: true, // 考试提醒
        reminderTime: '09:00' // 提醒时间
    },
    ai: {
        autoExplain: true, // 自动解释
        autoSuggest: true, // 自动建议
        difficulty: 'medium' // 难度: easy | medium | hard
    },
    display: {
        theme: 'light', // 主题: light | dark | auto
        language: 'zh-CN' // 语言
    }
};
// 解析用户偏好
function parsePreferences(preferencesJson) {
    if (!preferencesJson) {
        return DEFAULT_PREFERENCES;
    }
    try {
        const parsed = JSON.parse(preferencesJson);
        // 合并默认偏好，确保所有字段都存在
        return {
            learning: { ...DEFAULT_PREFERENCES.learning, ...parsed.learning },
            notifications: { ...DEFAULT_PREFERENCES.notifications, ...parsed.notifications },
            ai: { ...DEFAULT_PREFERENCES.ai, ...parsed.ai },
            display: { ...DEFAULT_PREFERENCES.display, ...parsed.display }
        };
    }
    catch {
        return DEFAULT_PREFERENCES;
    }
}
// ==================== GET /api/settings - 获取用户偏好设置 ====================
router.get('/settings', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法获取设置',
                code: 'NOT_AUTHENTICATED'
            });
        }
        // 获取用户偏好
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                preferences: true
            }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }
        const preferences = parsePreferences(user.preferences);
        res.json({
            success: true,
            data: {
                userId: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                ...preferences
            }
        });
    }
    catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({
            success: false,
            error: '获取设置失败',
            code: 'GET_SETTINGS_FAILED'
        });
    }
});
// ==================== PUT /api/settings - 更新用户偏好设置 ====================
router.put('/settings', [
    body('learning').optional().isObject(),
    body('learning.dailyGoal').optional().isInt({ min: 0, max: 720 }),
    body('learning.weeklyGoal').optional().isInt({ min: 0, max: 5040 }),
    body('learning.targetGrade').optional().isIn(['S', 'A', 'B', 'C']),
    body('learning.examDate').optional().isISO8601(),
    body('notifications').optional().isObject(),
    body('notifications.studyReminder').optional().isBoolean(),
    body('notifications.reviewReminder').optional().isBoolean(),
    body('notifications.examReminder').optional().isBoolean(),
    body('notifications.reminderTime').optional().isString(),
    body('ai').optional().isObject(),
    body('ai.autoExplain').optional().isBoolean(),
    body('ai.autoSuggest').optional().isBoolean(),
    body('ai.difficulty').optional().isIn(['easy', 'medium', 'hard']),
    body('display').optional().isObject(),
    body('display.theme').optional().isIn(['light', 'dark', 'auto']),
    body('display.language').optional().isIn(['zh-CN', 'en']),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录，无法更新设置',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { displayName, learning, notifications, ai, display } = req.body;
        // 获取当前用户偏好
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { preferences: true }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }
        // 解析并合并偏好
        const currentPreferences = parsePreferences(user.preferences);
        const updatedPreferences = {
            learning: { ...currentPreferences.learning, ...learning },
            notifications: { ...currentPreferences.notifications, ...notifications },
            ai: { ...currentPreferences.ai, ...ai },
            display: { ...currentPreferences.display, ...display }
        };
        // 更新用户信息
        const updateData = {
            preferences: JSON.stringify(updatedPreferences)
        };
        if (displayName !== undefined) {
            updateData.displayName = displayName;
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                preferences: true
            }
        });
        const preferences = parsePreferences(updatedUser.preferences);
        res.json({
            success: true,
            data: {
                userId: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                displayName: updatedUser.displayName,
                ...preferences
            }
        });
    }
    catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({
            success: false,
            error: '更新设置失败',
            code: 'UPDATE_SETTINGS_FAILED'
        });
    }
});
// ==================== GET /api/settings/default - 获取默认偏好设置 ====================
router.get('/settings/default', async (_req, res) => {
    res.json({
        success: true,
        data: DEFAULT_PREFERENCES
    });
});
export default router;
//# sourceMappingURL=settings.js.map