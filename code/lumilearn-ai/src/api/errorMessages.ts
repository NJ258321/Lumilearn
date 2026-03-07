// =====================================================
// 错误码映射表
// =====================================================

// 错误码类型
export type ErrorCode =
  // 通用错误
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR'
  // 文件相关错误
  | 'INVALID_FILENAME'
  | 'FILE_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'FILE_DELETE_FAILED'
  | 'FILE_READ_FAILED'
  | 'UPLOAD_FAILED'
  // 业务错误
  | 'COURSE_NOT_FOUND'
  | 'CHAPTER_NOT_FOUND'
  | 'KNOWLEDGE_POINT_NOT_FOUND'
  | 'STUDY_RECORD_NOT_FOUND'
  | 'TIME_MARK_NOT_FOUND'

// 错误码到中文提示的映射
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // 通用错误
  INVALID_REQUEST: '请求无效，请检查输入内容',
  UNAUTHORIZED: '未授权，请先登录',
  FORBIDDEN: '无权限访问此资源',
  NOT_FOUND: '请求的资源不存在',
  INTERNAL_ERROR: '服务器内部错误，请稍后重试',
  VALIDATION_ERROR: '数据验证失败，请检查输入',
  // 文件相关错误
  INVALID_FILENAME: '文件名无效，请检查文件名',
  FILE_NOT_FOUND: '文件不存在，可能已被删除',
  FILE_TOO_LARGE: '文件过大，请选择更小的文件',
  INVALID_FILE_TYPE: '文件类型不支持，请上传允许的文件类型',
  FILE_DELETE_FAILED: '删除文件失败，请重试',
  FILE_READ_FAILED: '读取文件失败，请重试',
  UPLOAD_FAILED: '文件上传失败，请重试',
  // 业务错误
  COURSE_NOT_FOUND: '课程不存在',
  CHAPTER_NOT_FOUND: '章节不存在',
  KNOWLEDGE_POINT_NOT_FOUND: '知识点不存在',
  STUDY_RECORD_NOT_FOUND: '学习记录不存在',
  TIME_MARK_NOT_FOUND: '时间标记不存在',
}

/**
 * 根据错误码获取友好的中文提示
 */
export function getErrorMessage(code: string, fallback?: string): string {
  // 如果没有错误码，返回原始错误信息或默认提示
  if (!code && fallback) {
    return fallback
  }

  if (!code && !fallback) {
    return '操作失败，请稍后重试'
  }

  // 尝试匹配错误码（支持多种格式）
  const normalizedCode = code
    .replace(/^ERROR_/, '')
    .replace(/^E_/, '')
    .toUpperCase() as ErrorCode

  if (ERROR_MESSAGES[normalizedCode]) {
    return ERROR_MESSAGES[normalizedCode]
  }

  // 返回原始错误信息或默认提示
  return fallback || '操作失败，请稍后重试'
}

/**
 * 判断是否为网络错误
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  return false
}
