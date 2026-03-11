/**
 * 全局错误处理中间件
 * ERR-01: 全局错误边界
 */
import { Prisma } from '@prisma/client';
import { AppError, ValidationError, AuthError, NotFoundError, DatabaseError, FileError } from './AppError.js';
import { ErrorCode } from '../types/errors.js';
// ==================== 错误日志 ====================
/**
 * 错误日志记录
 */
function logError(error, req) {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';
    // 区分不同级别的日志
    if (error instanceof AppError) {
        if (error.statusCode >= 500) {
            console.error(`[${timestamp}] [ERROR] [${error.name}] ${error.code} - ${error.message}`);
            console.error(`  Method: ${method}, URL: ${url}, IP: ${ip}`);
            console.error(`  User-Agent: ${userAgent}`);
            if (error.details) {
                console.error(`  Details:`, error.details);
            }
            if (error.stack) {
                console.error(`  Stack: ${error.stack}`);
            }
        }
        else {
            // 客户端错误只记录简要信息
            console.warn(`[${timestamp}] [WARN] [${error.name}] ${error.code} - ${error.message}`);
        }
    }
    else {
        // 未知错误记录详细信息
        console.error(`[${timestamp}] [ERROR] [Unknown] ${error.message}`);
        console.error(`  Method: ${method}, URL: ${url}, IP: ${ip}`);
        console.error(`  User-Agent: ${userAgent}`);
        console.error(`  Stack: ${error.stack}`);
    }
}
// ==================== 错误转换 ====================
/**
 * 将未知错误转换为AppError
 */
function convertToAppError(error) {
    // 如果已经是AppError，直接返回
    if (error instanceof AppError) {
        return error;
    }
    // Prisma 错误处理
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(error);
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
        return new ValidationError('数据验证失败', undefined, error.message);
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return handlePrismaError(error);
    }
    // JWT 错误处理
    if (error.name === 'JsonWebTokenError') {
        return new AuthError(ErrorCode.INVALID_TOKEN, '无效的令牌');
    }
    if (error.name === 'TokenExpiredError') {
        return new AuthError(ErrorCode.TOKEN_EXPIRED, '令牌已过期');
    }
    // Multer 文件上传错误
    if (error.name === 'MulterError') {
        return handleMulterError(error);
    }
    // 默认返回服务器错误
    return new AppError(ErrorCode.INTERNAL_SERVER_ERROR, error.message, {
        originalError: error.name,
        originalMessage: error.message
    });
}
/**
 * 处理 Prisma 错误
 */
function handlePrismaError(error) {
    // P2025: 记录未找到
    if (error.code === 'P2025') {
        const modelName = error.meta?.modelName || '记录';
        return new NotFoundError(modelName);
    }
    // P2002: 唯一约束冲突
    if (error.code === 'P2002') {
        const field = error.meta?.target || [];
        return new AppError(ErrorCode.NOT_FOUND, // 使用通用错误码，实际应该是冲突
        `字段 ${field.join(', ')} 已存在`);
    }
    // P2003: 外键约束失败
    if (error.code === 'P2003') {
        return new AppError(ErrorCode.DATABASE_ERROR, '关联数据不存在', error.meta);
    }
    // P2000: 字段值超出范围
    if (error.code === 'P2000') {
        return new ValidationError(error.message);
    }
    // 其他 Prisma 错误
    return new DatabaseError(error.code, error);
}
/**
 * 处理 Multer 错误
 */
function handleMulterError(error) {
    switch (error.code) {
        case 'LIMIT_FILE_SIZE':
            return new FileError('文件大小超过限制', ErrorCode.FILE_SIZE_EXCEEDED);
        case 'LIMIT_FILE_COUNT':
            return new FileError('文件数量超过限制', ErrorCode.FILE_COUNT_EXCEEDED);
        case 'LIMIT_UNEXPECTED_FILE':
            return new FileError('不支持的文件类型', ErrorCode.FILE_TYPE_NOT_SUPPORTED);
        default:
            return new FileError(error.message || '文件上传失败', ErrorCode.FILE_UPLOAD_FAILED);
    }
}
// ==================== 错误处理中间件 ====================
/**
 * 异步处理包装器
 * 用于捕获异步函数中的错误并传递给错误处理中间件
 */
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
/**
 * 404 未找到中间件
 */
export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: {
            code: ErrorCode.NOT_FOUND,
            message: `路由 ${req.method} ${req.path} 不存在`
        }
    });
}
/**
 * 全局错误处理中间件
 */
export function errorHandler(err, req, res, _next) {
    // 记录错误日志
    logError(err, req);
    // 转换错误为AppError
    const appError = convertToAppError(err);
    // 获取响应状态码
    const statusCode = appError.statusCode;
    // 构建响应
    const response = {
        success: false,
        error: {
            code: appError.code,
            message: appError.message
        }
    };
    // 开发环境添加额外信息
    if (process.env.NODE_ENV === 'development') {
        response.error.details = appError.details;
        response.error.stack = appError.stack;
    }
    // 生产环境隐藏内部错误细节
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        response.error.message = '服务器内部错误，请稍后重试';
        delete response.error.code;
    }
    // 发送响应
    res.status(statusCode).json(response);
}
// ==================== 未捕获异常处理 ====================
/**
 * 未捕获的异步异常处理
 */
export function setupUncaughtExceptionHandler() {
    process.on('uncaughtException', (error) => {
        console.error('[FATAL] Uncaught Exception:', error.message);
        console.error('Stack:', error.stack);
        // 不立即退出，等待优雅关闭
    });
    process.on('unhandledRejection', (reason) => {
        console.error('[FATAL] Unhandled Rejection:', reason);
        if (reason instanceof Error) {
            console.error('Stack:', reason.stack);
        }
    });
}
export default {
    asyncHandler,
    notFoundHandler,
    errorHandler,
    setupUncaughtExceptionHandler
};
//# sourceMappingURL=errorHandler.js.map