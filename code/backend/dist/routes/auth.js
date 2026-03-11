import { Router } from 'express';
import { body, param } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { validate } from '../middleware/validator.js';
import prisma from '../lib/prisma.js';
const router = Router();
// JWT 密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'lumitrace-dev-secret-key-2026';
const JWT_EXPIRES_IN = '7d';
// ==================== Helper Functions ====================
/**
 * 生成 JWT Token
 */
function generateToken(user) {
    const payload = {
        userId: user.id,
        username: user.username,
        role: user.role
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
/**
 * 验证 JWT Token
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
/**
 * 从请求头获取用户 ID（中间件）
 */
export function getUserIdFromRequest(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    return decoded?.userId || null;
}
/**
 * 验证用户是否为管理员（中间件）
 */
export function isAdmin(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    return decoded?.role === 'ADMIN';
}
// ==================== P5.1.1: 用户注册 ====================
router.post('/auth/register', [
    body('username')
        .isLength({ min: 3, max: 20 })
        .withMessage('用户名长度必须在3-20个字符之间')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('用户名只能包含字母、数字和下划线'),
    body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址'),
    body('password')
        .isLength({ min: 6, max: 50 })
        .withMessage('密码长度必须在6-50个字符之间'),
    body('displayName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('显示名称最长50个字符'),
    validate
], async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;
        // 检查用户名是否已存在
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });
        if (existingUsername) {
            return res.status(409).json({
                success: false,
                error: '用户名已存在',
                code: 'USERNAME_EXISTS'
            });
        }
        // 检查邮箱是否已存在
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        });
        if (existingEmail) {
            return res.status(409).json({
                success: false,
                error: '邮箱已被注册',
                code: 'EMAIL_EXISTS'
            });
        }
        // 加密密码
        const passwordHash = await bcrypt.hash(password, 10);
        // 创建用户
        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                displayName: displayName || username,
                role: 'USER'
            }
        });
        // 生成 Token
        const token = generateToken(user);
        res.status(201).json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                createdAt: user.createdAt
            },
            token
        });
    }
    catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({
            success: false,
            error: '注册失败，请稍后重试',
            code: 'REGISTER_FAILED'
        });
    }
});
// ==================== P5.1.2: 用户登录 ====================
router.post('/auth/login', [
    body('email')
        .isEmail()
        .withMessage('请输入有效的邮箱地址'),
    body('password')
        .notEmpty()
        .withMessage('请输入密码'),
    validate
], async (req, res) => {
    try {
        const { email, password } = req.body;
        // 查找用户
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: '邮箱或密码错误',
                code: 'INVALID_CREDENTIALS'
            });
        }
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: '邮箱或密码错误',
                code: 'INVALID_CREDENTIALS'
            });
        }
        // 生成 Token
        const token = generateToken(user);
        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                preferences: user.preferences ? JSON.parse(user.preferences) : null,
                createdAt: user.createdAt
            },
            token
        });
    }
    catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({
            success: false,
            error: '登录失败，请稍后重试',
            code: 'LOGIN_FAILED'
        });
    }
});
// ==================== P5.1.3: 获取当前用户 ====================
router.get('/auth/me', async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录或登录已过期',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }
        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                preferences: user.preferences ? JSON.parse(user.preferences) : null,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Error getting current user:', error);
        res.status(500).json({
            success: false,
            error: '获取用户信息失败',
            code: 'GET_USER_FAILED'
        });
    }
});
// ==================== P5.1.4: 更新用户信息 ====================
router.put('/auth/profile', [
    body('displayName')
        .optional()
        .isLength({ max: 50 })
        .withMessage('显示名称最长50个字符'),
    body('preferences')
        .optional()
        .isObject()
        .withMessage('偏好设置必须是对象'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录或登录已过期',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { displayName, preferences } = req.body;
        // 检查用户是否存在
        const existingUser = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }
        // 更新用户信息
        const updateData = {};
        if (displayName !== undefined) {
            updateData.displayName = displayName;
        }
        if (preferences !== undefined) {
            updateData.preferences = JSON.stringify(preferences);
        }
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData
        });
        res.json({
            success: true,
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                email: updatedUser.email,
                displayName: updatedUser.displayName,
                role: updatedUser.role,
                preferences: updatedUser.preferences ? JSON.parse(updatedUser.preferences) : null,
                updatedAt: updatedUser.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            error: '更新用户信息失败',
            code: 'UPDATE_PROFILE_FAILED'
        });
    }
});
// ==================== P5.1.5: 修改密码 ====================
router.put('/auth/password', [
    body('currentPassword')
        .notEmpty()
        .withMessage('请输入当前密码'),
    body('newPassword')
        .isLength({ min: 6, max: 50 })
        .withMessage('新密码长度必须在6-50个字符之间'),
    validate
], async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        if (!userId) {
            return res.status(401).json({
                success: false,
                error: '未登录或登录已过期',
                code: 'NOT_AUTHENTICATED'
            });
        }
        const { currentPassword, newPassword } = req.body;
        // 获取用户
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }
        // 验证当前密码
        const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                error: '当前密码错误',
                code: 'INCORRECT_PASSWORD'
            });
        }
        // 加密新密码
        const newPasswordHash = await bcrypt.hash(newPassword, 10);
        // 更新密码
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newPasswordHash }
        });
        res.json({
            success: true,
            data: {
                message: '密码修改成功，请重新登录'
            }
        });
    }
    catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            error: '修改密码失败',
            code: 'CHANGE_PASSWORD_FAILED'
        });
    }
});
// ==================== 管理员接口 ====================
// P5.1.6: 获取所有用户（仅管理员）
router.get('/auth/users', async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                error: '权限不足，仅管理员可访问',
                code: 'FORBIDDEN'
            });
        }
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 20;
        const skip = (page - 1) * pageSize;
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    displayName: true,
                    role: true,
                    createdAt: true,
                    updatedAt: true
                }
            }),
            prisma.user.count()
        ]);
        res.json({
            success: true,
            data: {
                users,
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
        console.error('Error getting users:', error);
        res.status(500).json({
            success: false,
            error: '获取用户列表失败',
            code: 'GET_USERS_FAILED'
        });
    }
});
// P5.1.7: 删除用户（仅管理员）
router.delete('/auth/users/:id', [
    param('id').isUUID().withMessage('用户ID必须是有效的UUID'),
    validate
], async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                error: '权限不足，仅管理员可访问',
                code: 'FORBIDDEN'
            });
        }
        const { id } = req.params;
        // 不能删除自己
        const currentUserId = getUserIdFromRequest(req);
        if (currentUserId === id) {
            return res.status(400).json({
                success: false,
                error: '不能删除自己的账户',
                code: 'CANNOT_DELETE_SELF'
            });
        }
        // 检查用户是否存在
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }
        // 删除用户
        await prisma.user.delete({
            where: { id }
        });
        res.json({
            success: true,
            data: {
                message: '用户已删除'
            }
        });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: '删除用户失败',
            code: 'DELETE_USER_FAILED'
        });
    }
});
// P5.1.8: 更新用户角色（仅管理员）
router.put('/auth/users/:id/role', [
    param('id').isUUID().withMessage('用户ID必须是有效的UUID'),
    body('role')
        .isIn(['USER', 'ADMIN'])
        .withMessage('角色必须是 USER 或 ADMIN'),
    validate
], async (req, res) => {
    try {
        if (!isAdmin(req)) {
            return res.status(403).json({
                success: false,
                error: '权限不足，仅管理员可访问',
                code: 'FORBIDDEN'
            });
        }
        const { id } = req.params;
        const { role } = req.body;
        // 不能修改自己的角色
        const currentUserId = getUserIdFromRequest(req);
        if (currentUserId === id) {
            return res.status(400).json({
                success: false,
                error: '不能修改自己的角色',
                code: 'CANNOT_CHANGE_SELF_ROLE'
            });
        }
        // 检查用户是否存在
        const existingUser = await prisma.user.findUnique({
            where: { id }
        });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                error: '用户不存在',
                code: 'USER_NOT_FOUND'
            });
        }
        // 更新角色
        const updatedUser = await prisma.user.update({
            where: { id },
            data: { role }
        });
        res.json({
            success: true,
            data: {
                id: updatedUser.id,
                username: updatedUser.username,
                role: updatedUser.role
            }
        });
    }
    catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({
            success: false,
            error: '更新用户角色失败',
            code: 'UPDATE_ROLE_FAILED'
        });
    }
});
export default router;
//# sourceMappingURL=auth.js.map