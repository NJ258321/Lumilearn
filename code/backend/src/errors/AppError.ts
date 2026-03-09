/**
 * 自定义错误类
 * 统一的错误类型定义
 */

import { ErrorCode, ErrorCodeType } from '../types/errors.js'

// 导出ErrorCodeType供外部使用
export type { ErrorCodeType }

/**
 * 应用错误基类
 */
export class AppError extends Error {
  public readonly code: ErrorCodeType
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly details?: unknown

  constructor(
    code: ErrorCodeType,
    message?: string,
    details?: unknown
  ) {
    // 动态获取状态码和消息，避免循环依赖
    const statusMap: Record<string, number> = {
      '1000': 500, '1001': 400, '1002': 400, '1003': 404, '1004': 405, '1005': 408,
      '1006': 500, '1007': 503, '1008': 500, '1009': 500,
      '2000': 401, '2001': 401, '2002': 401, '2003': 403, '2004': 404, '2005': 409,
      '2006': 409, '2007': 401, '2008': 403, '2009': 429,
      '3000': 404, '3001': 409, '3002': 400, '3003': 400, '3004': 409,
      '4000': 404, '4001': 409, '4002': 400, '4003': 400,
      '5000': 404, '5001': 409, '5002': 400, '5003': 400,
      '6000': 404, '6001': 400, '6002': 500,
      '7000': 404, '7001': 500, '7002': 500, '7003': 400, '7004': 400, '7005': 400, '7006': 400,
      '8000': 503, '8001': 504, '8002': 502, '8003': 429, '8004': 401,
      '9000': 404, '9001': 400, '9002': 400, '9003': 400, '9004': 500,
      '10000': 404, '10001': 400, '10002': 400, '10003': 408, '10004': 400,
      '11000': 404, '11001': 409, '11002': 400, '11003': 400,
    }
    const messageMap: Record<string, string> = {
      '1000': '发生了一个未知错误', '1001': '请求参数无效', '1002': '缺少必填参数',
      '1003': '请求的资源不存在', '1006': '服务器内部错误', '1007': '服务暂时不可用',
      '1008': '数据库操作失败', '1009': '缓存操作失败',
      '2000': '请先登录', '2001': '登录凭证无效', '2002': '登录已过期，请重新登录',
      '2003': '权限不足', '2004': '用户不存在', '2005': '用户名已存在',
      '2006': '邮箱已被注册', '2007': '密码错误', '2008': '账户已被禁用',
      '3000': '课程不存在', '3001': '课程名称已存在', '3004': '该课程有关联数据，无法删除',
      '4000': '章节不存在', '4001': '章节名称已存在', '4003': '章节不属于该课程',
      '5000': '知识点不存在', '5001': '知识点已存在',
      '6000': '学习记录不存在', '6002': '音频处理失败',
      '7000': '文件不存在', '7001': '文件删除失败', '7002': '文件上传失败',
      '7003': '无效的文件名', '7004': '文件大小超过限制', '7005': '不支持的文件类型',
      '8000': 'AI服务暂时不可用', '8001': 'AI服务响应超时', '8003': 'AI服务配额已用尽',
      '9000': '题目不存在', '9004': '题目导入失败',
      '10000': '考试会话不存在', '10001': '考试已结束',
      '11000': '知识关系不存在', '11001': '知识关系已存在',
    }

    super(message || messageMap[code] || '发生了一个未知错误')
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusMap[code] || 500
    this.isOperational = true
    this.details = details

    // 保持错误堆栈
    Error.captureStackTrace(this, this.constructor)
  }

  /**
   * 转换为JSON响应
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(process.env.NODE_ENV === 'development' && { details: this.details }),
        ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
      }
    }
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  public readonly field?: string

  constructor(message: string, field?: string, details?: unknown) {
    super(ErrorCode.INVALID_PARAMS, message, details)
    this.field = field
    this.name = 'ValidationError'
  }
}

/**
 * 认证错误
 */
export class AuthError extends AppError {
  constructor(code: ErrorCodeType = ErrorCode.NOT_AUTHENTICATED, message?: string) {
    super(code, message)
    this.name = 'AuthError'
  }
}

/**
 * 权限错误
 */
export class ForbiddenError extends AppError {
  constructor(message: string = '权限不足') {
    super(ErrorCode.FORBIDDEN, message)
    this.name = 'ForbiddenError'
  }
}

/**
 * 资源不存在错误
 */
export class NotFoundError extends AppError {
  public readonly resourceType: string

  constructor(resourceType: string, message?: string) {
    super(ErrorCode.NOT_FOUND, message || `${resourceType}不存在`)
    this.resourceType = resourceType
    this.name = 'NotFoundError'
  }
}

/**
 * 资源冲突错误
 */
export class ConflictError extends AppError {
  public readonly resourceType: string

  constructor(resourceType: string, message?: string) {
    super(ErrorCode.NOT_FOUND, message || `${resourceType}已存在`)
    this.resourceType = resourceType
    this.name = 'ConflictError'
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends AppError {
  public readonly operation: string

  constructor(operation: string, originalError?: unknown) {
    super(
      ErrorCode.DATABASE_ERROR,
      `数据库操作失败: ${operation}`,
      originalError
    )
    this.operation = operation
    this.name = 'DatabaseError'
  }
}

/**
 * AI服务错误
 */
export class AIServiceError extends AppError {
  constructor(message: string, code: ErrorCodeType = ErrorCode.AI_SERVICE_UNAVAILABLE) {
    super(code, message)
    this.name = 'AIServiceError'
  }
}

/**
 * 文件错误
 */
export class FileError extends AppError {
  constructor(message: string, code: ErrorCodeType = ErrorCode.FILE_UPLOAD_FAILED) {
    super(code, message)
    this.name = 'FileError'
  }
}

/**
 * 外部服务错误
 */
export class ExternalServiceError extends AppError {
  public readonly serviceName: string

  constructor(serviceName: string, message: string) {
    super(ErrorCode.SERVICE_UNAVAILABLE, `${serviceName}: ${message}`)
    this.serviceName = serviceName
    this.name = 'ExternalServiceError'
  }
}
