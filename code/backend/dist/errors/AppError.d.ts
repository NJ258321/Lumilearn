/**
 * 自定义错误类
 * 统一的错误类型定义
 */
import { ErrorCodeType } from '../types/errors.js';
export type { ErrorCodeType };
/**
 * 应用错误基类
 */
export declare class AppError extends Error {
    readonly code: ErrorCodeType;
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly details?: unknown;
    constructor(code: ErrorCodeType, message?: string, details?: unknown);
    /**
     * 转换为JSON响应
     */
    toJSON(): {
        success: boolean;
        error: {
            stack: string;
            details: unknown;
            code: ErrorCodeType;
            message: string;
        };
    };
}
/**
 * 验证错误
 */
export declare class ValidationError extends AppError {
    readonly field?: string;
    constructor(message: string, field?: string, details?: unknown);
}
/**
 * 认证错误
 */
export declare class AuthError extends AppError {
    constructor(code?: ErrorCodeType, message?: string);
}
/**
 * 权限错误
 */
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
/**
 * 资源不存在错误
 */
export declare class NotFoundError extends AppError {
    readonly resourceType: string;
    constructor(resourceType: string, message?: string);
}
/**
 * 资源冲突错误
 */
export declare class ConflictError extends AppError {
    readonly resourceType: string;
    constructor(resourceType: string, message?: string);
}
/**
 * 数据库错误
 */
export declare class DatabaseError extends AppError {
    readonly operation: string;
    constructor(operation: string, originalError?: unknown);
}
/**
 * AI服务错误
 */
export declare class AIServiceError extends AppError {
    constructor(message: string, code?: ErrorCodeType);
}
/**
 * 文件错误
 */
export declare class FileError extends AppError {
    constructor(message: string, code?: ErrorCodeType);
}
/**
 * 外部服务错误
 */
export declare class ExternalServiceError extends AppError {
    readonly serviceName: string;
    constructor(serviceName: string, message: string);
}
//# sourceMappingURL=AppError.d.ts.map