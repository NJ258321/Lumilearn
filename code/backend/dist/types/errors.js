/**
 * 错误码定义
 * 统一的项目错误码体系
 */
// ==================== 错误码分类 ====================
/** 错误码前缀分类 */
export const ErrorPrefix = {
    // 通用错误 (1xxx)
    COMMON: '1',
    // 认证授权 (2xxx)
    AUTH: '2',
    // 课程相关 (3xxx)
    COURSE: '3',
    // 章节相关 (4xxx)
    CHAPTER: '4',
    // 知识点相关 (5xxx)
    KNOWLEDGE: '5',
    // 学习记录相关 (6xxx)
    STUDY_RECORD: '6',
    // 文件相关 (7xxx)
    FILE: '7',
    // AI服务相关 (8xxx)
    AI: '8',
    // 题库相关 (9xxx)
    QUESTION: '9',
    // 考试相关 (10xxx)
    EXAM: '10',
    // 知识图谱相关 (11xxx)
    KNOWLEDGE_GRAPH: '11',
};
// ==================== 错误码定义 ====================
/** 错误码枚举 */
export const ErrorCode = {
    // ========== 通用错误 (1xxx) ==========
    /** 未知错误 */
    UNKNOWN_ERROR: '1000',
    /** 请求参数无效 */
    INVALID_PARAMS: '1001',
    /** 缺少必填参数 */
    MISSING_REQUIRED_PARAMS: '1002',
    /** 资源不存在 */
    NOT_FOUND: '1003',
    /** 方法不允许 */
    METHOD_NOT_ALLOWED: '1004',
    /** 请求超时 */
    TIMEOUT: '1005',
    /** 服务器内部错误 */
    INTERNAL_SERVER_ERROR: '1006',
    /** 服务不可用 */
    SERVICE_UNAVAILABLE: '1007',
    /** 数据库错误 */
    DATABASE_ERROR: '1008',
    /** 缓存错误 */
    CACHE_ERROR: '1009',
    // ========== 认证授权 (2xxx) ==========
    /** 未认证 */
    NOT_AUTHENTICATED: '2000',
    /** Token无效 */
    INVALID_TOKEN: '2001',
    /** Token过期 */
    TOKEN_EXPIRED: '2002',
    /** 权限不足 */
    FORBIDDEN: '2003',
    /** 用户不存在 */
    USER_NOT_FOUND: '2004',
    /** 用户名已存在 */
    USERNAME_EXISTS: '2005',
    /** 邮箱已存在 */
    EMAIL_EXISTS: '2006',
    /** 密码错误 */
    INVALID_PASSWORD: '2007',
    /** 账户已被禁用 */
    ACCOUNT_DISABLED: '2008',
    /** 登录失败次数过多 */
    LOGIN_TOO_MANY_ATTEMPTS: '2009',
    // ========== 课程相关 (3xxx) ==========
    /** 课程不存在 */
    COURSE_NOT_FOUND: '3000',
    /** 课程名称重复 */
    COURSE_NAME_EXISTS: '3001',
    /** 课程状态无效 */
    COURSE_STATUS_INVALID: '3002',
    /** 课程类型无效 */
    COURSE_TYPE_INVALID: '3003',
    /** 无法删除课程（下有关联数据） */
    COURSE_CANNOT_DELETE: '3004',
    // ========== 章节相关 (4xxx) ==========
    /** 章节不存在 */
    CHAPTER_NOT_FOUND: '4000',
    /** 章节名称重复 */
    CHAPTER_NAME_EXISTS: '4001',
    /** 章节顺序无效 */
    CHAPTER_ORDER_INVALID: '4002',
    /** 章节不属于该课程 */
    CHAPTER_NOT_IN_COURSE: '4003',
    // ========== 知识点相关 (5xxx) ==========
    /** 知识点不存在 */
    KNOWLEDGE_POINT_NOT_FOUND: '5000',
    /** 知识点名称重复 */
    KNOWLEDGE_POINT_EXISTS: '5001',
    /** 知识点状态无效 */
    KNOWLEDGE_STATUS_INVALID: '5002',
    /** 知识点掌握度无效 */
    MASTERY_SCORE_INVALID: '5003',
    // ========== 学习记录相关 (6xxx) ==========
    /** 学习记录不存在 */
    STUDY_RECORD_NOT_FOUND: '6000',
    /** 学习记录状态无效 */
    STUDY_RECORD_STATUS_INVALID: '6001',
    /** 录音处理失败 */
    AUDIO_PROCESSING_FAILED: '6002',
    // ========== 文件相关 (7xxx) ==========
    /** 文件不存在 */
    FILE_NOT_FOUND: '7000',
    /** 文件删除失败 */
    FILE_DELETE_FAILED: '7001',
    /** 文件上传失败 */
    FILE_UPLOAD_FAILED: '7002',
    /** 无效的文件名 */
    INVALID_FILENAME: '7003',
    /** 文件大小超限 */
    FILE_SIZE_EXCEEDED: '7004',
    /** 不支持的文件类型 */
    FILE_TYPE_NOT_SUPPORTED: '7005',
    /** 文件数量超限 */
    FILE_COUNT_EXCEEDED: '7006',
    // ========== AI服务相关 (8xxx) ==========
    /** AI服务不可用 */
    AI_SERVICE_UNAVAILABLE: '8000',
    /** AI服务超时 */
    AI_SERVICE_TIMEOUT: '8001',
    /** AI服务返回格式错误 */
    AI_RESPONSE_INVALID: '8002',
    /** AI服务配额不足 */
    AI_QUOTA_EXCEEDED: '8003',
    /** API密钥无效 */
    API_KEY_INVALID: '8004',
    // ========== 题库相关 (9xxx) ==========
    /** 题目不存在 */
    QUESTION_NOT_FOUND: '9000',
    /** 题目类型无效 */
    QUESTION_TYPE_INVALID: '9001',
    /** 题目答案格式错误 */
    QUESTION_ANSWER_INVALID: '9002',
    /** 题目难度无效 */
    QUESTION_DIFFICULTY_INVALID: '9003',
    /** 题目导入失败 */
    QUESTION_IMPORT_FAILED: '9004',
    // ========== 考试相关 (10xxx) ==========
    /** 考试会话不存在 */
    EXAM_SESSION_NOT_FOUND: '10000',
    /** 考试已结束 */
    EXAM_ALREADY_ENDED: '10001',
    /** 考试时间已过期 */
    EXAM_TIME_EXPIRED: '10002',
    /** 答题超时 */
    ANSWER_TIMEOUT: '10003',
    /** 答案无效 */
    ANSWER_INVALID: '10004',
    // ========== 知识图谱相关 (11xxx) ==========
    /** 知识关系不存在 */
    KNOWLEDGE_RELATION_NOT_FOUND: '11000',
    /** 知识关系重复 */
    KNOWLEDGE_RELATION_EXISTS: '11001',
    /** 知识关系类型无效 */
    KNOWLEDGE_RELATION_TYPE_INVALID: '11002',
    /** 图谱结构无效 */
    GRAPH_STRUCTURE_INVALID: '11003',
};
// ==================== 错误码映射 ====================
/** 错误码到HTTP状态码的映射 */
export const ErrorCodeToStatus = {
    // 通用错误
    [ErrorCode.UNKNOWN_ERROR]: 500,
    [ErrorCode.INVALID_PARAMS]: 400,
    [ErrorCode.MISSING_REQUIRED_PARAMS]: 400,
    [ErrorCode.NOT_FOUND]: 404,
    [ErrorCode.METHOD_NOT_ALLOWED]: 405,
    [ErrorCode.TIMEOUT]: 408,
    [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
    [ErrorCode.SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.DATABASE_ERROR]: 500,
    [ErrorCode.CACHE_ERROR]: 500,
    // 认证授权
    [ErrorCode.NOT_AUTHENTICATED]: 401,
    [ErrorCode.INVALID_TOKEN]: 401,
    [ErrorCode.TOKEN_EXPIRED]: 401,
    [ErrorCode.FORBIDDEN]: 403,
    [ErrorCode.USER_NOT_FOUND]: 404,
    [ErrorCode.USERNAME_EXISTS]: 409,
    [ErrorCode.EMAIL_EXISTS]: 409,
    [ErrorCode.INVALID_PASSWORD]: 401,
    [ErrorCode.ACCOUNT_DISABLED]: 403,
    [ErrorCode.LOGIN_TOO_MANY_ATTEMPTS]: 429,
    // 课程相关
    [ErrorCode.COURSE_NOT_FOUND]: 404,
    [ErrorCode.COURSE_NAME_EXISTS]: 409,
    [ErrorCode.COURSE_STATUS_INVALID]: 400,
    [ErrorCode.COURSE_TYPE_INVALID]: 400,
    [ErrorCode.COURSE_CANNOT_DELETE]: 409,
    // 章节相关
    [ErrorCode.CHAPTER_NOT_FOUND]: 404,
    [ErrorCode.CHAPTER_NAME_EXISTS]: 409,
    [ErrorCode.CHAPTER_ORDER_INVALID]: 400,
    [ErrorCode.CHAPTER_NOT_IN_COURSE]: 400,
    // 知识点相关
    [ErrorCode.KNOWLEDGE_POINT_NOT_FOUND]: 404,
    [ErrorCode.KNOWLEDGE_POINT_EXISTS]: 409,
    [ErrorCode.KNOWLEDGE_STATUS_INVALID]: 400,
    [ErrorCode.MASTERY_SCORE_INVALID]: 400,
    // 学习记录相关
    [ErrorCode.STUDY_RECORD_NOT_FOUND]: 404,
    [ErrorCode.STUDY_RECORD_STATUS_INVALID]: 400,
    [ErrorCode.AUDIO_PROCESSING_FAILED]: 500,
    // 文件相关
    [ErrorCode.FILE_NOT_FOUND]: 404,
    [ErrorCode.FILE_DELETE_FAILED]: 500,
    [ErrorCode.FILE_UPLOAD_FAILED]: 500,
    [ErrorCode.INVALID_FILENAME]: 400,
    [ErrorCode.FILE_SIZE_EXCEEDED]: 400,
    [ErrorCode.FILE_TYPE_NOT_SUPPORTED]: 400,
    [ErrorCode.FILE_COUNT_EXCEEDED]: 400,
    // AI服务相关
    [ErrorCode.AI_SERVICE_UNAVAILABLE]: 503,
    [ErrorCode.AI_SERVICE_TIMEOUT]: 504,
    [ErrorCode.AI_RESPONSE_INVALID]: 502,
    [ErrorCode.AI_QUOTA_EXCEEDED]: 429,
    [ErrorCode.API_KEY_INVALID]: 401,
    // 题库相关
    [ErrorCode.QUESTION_NOT_FOUND]: 404,
    [ErrorCode.QUESTION_TYPE_INVALID]: 400,
    [ErrorCode.QUESTION_ANSWER_INVALID]: 400,
    [ErrorCode.QUESTION_DIFFICULTY_INVALID]: 400,
    [ErrorCode.QUESTION_IMPORT_FAILED]: 500,
    // 考试相关
    [ErrorCode.EXAM_SESSION_NOT_FOUND]: 404,
    [ErrorCode.EXAM_ALREADY_ENDED]: 400,
    [ErrorCode.EXAM_TIME_EXPIRED]: 400,
    [ErrorCode.ANSWER_TIMEOUT]: 408,
    [ErrorCode.ANSWER_INVALID]: 400,
    // 知识图谱相关
    [ErrorCode.KNOWLEDGE_RELATION_NOT_FOUND]: 404,
    [ErrorCode.KNOWLEDGE_RELATION_EXISTS]: 409,
    [ErrorCode.KNOWLEDGE_RELATION_TYPE_INVALID]: 400,
    [ErrorCode.GRAPH_STRUCTURE_INVALID]: 400,
};
// ==================== 错误码到消息的映射 ====================
/** 错误码对应的默认消息 */
export const ErrorCodeToMessage = {
    // 通用错误
    [ErrorCode.UNKNOWN_ERROR]: '发生了一个未知错误',
    [ErrorCode.INVALID_PARAMS]: '请求参数无效',
    [ErrorCode.MISSING_REQUIRED_PARAMS]: '缺少必填参数',
    [ErrorCode.NOT_FOUND]: '请求的资源不存在',
    [ErrorCode.METHOD_NOT_ALLOWED]: '不允许的请求方法',
    [ErrorCode.TIMEOUT]: '请求超时',
    [ErrorCode.INTERNAL_SERVER_ERROR]: '服务器内部错误',
    [ErrorCode.SERVICE_UNAVAILABLE]: '服务暂时不可用',
    [ErrorCode.DATABASE_ERROR]: '数据库操作失败',
    [ErrorCode.CACHE_ERROR]: '缓存操作失败',
    // 认证授权
    [ErrorCode.NOT_AUTHENTICATED]: '请先登录',
    [ErrorCode.INVALID_TOKEN]: '登录凭证无效',
    [ErrorCode.TOKEN_EXPIRED]: '登录已过期，请重新登录',
    [ErrorCode.FORBIDDEN]: '权限不足',
    [ErrorCode.USER_NOT_FOUND]: '用户不存在',
    [ErrorCode.USERNAME_EXISTS]: '用户名已存在',
    [ErrorCode.EMAIL_EXISTS]: '邮箱已被注册',
    [ErrorCode.INVALID_PASSWORD]: '密码错误',
    [ErrorCode.ACCOUNT_DISABLED]: '账户已被禁用',
    [ErrorCode.LOGIN_TOO_MANY_ATTEMPTS]: '登录尝试次数过多，请稍后再试',
    // 课程相关
    [ErrorCode.COURSE_NOT_FOUND]: '课程不存在',
    [ErrorCode.COURSE_NAME_EXISTS]: '课程名称已存在',
    [ErrorCode.COURSE_STATUS_INVALID]: '课程状态无效',
    [ErrorCode.COURSE_TYPE_INVALID]: '课程类型无效',
    [ErrorCode.COURSE_CANNOT_DELETE]: '该课程有关联数据，无法删除',
    // 章节相关
    [ErrorCode.CHAPTER_NOT_FOUND]: '章节不存在',
    [ErrorCode.CHAPTER_NAME_EXISTS]: '章节名称已存在',
    [ErrorCode.CHAPTER_ORDER_INVALID]: '章节顺序无效',
    [ErrorCode.CHAPTER_NOT_IN_COURSE]: '章节不属于该课程',
    // 知识点相关
    [ErrorCode.KNOWLEDGE_POINT_NOT_FOUND]: '知识点不存在',
    [ErrorCode.KNOWLEDGE_POINT_EXISTS]: '知识点已存在',
    [ErrorCode.KNOWLEDGE_STATUS_INVALID]: '知识点状态无效',
    [ErrorCode.MASTERY_SCORE_INVALID]: '掌握度分数无效',
    // 学习记录相关
    [ErrorCode.STUDY_RECORD_NOT_FOUND]: '学习记录不存在',
    [ErrorCode.STUDY_RECORD_STATUS_INVALID]: '学习记录状态无效',
    [ErrorCode.AUDIO_PROCESSING_FAILED]: '音频处理失败',
    // 文件相关
    [ErrorCode.FILE_NOT_FOUND]: '文件不存在',
    [ErrorCode.FILE_DELETE_FAILED]: '文件删除失败',
    [ErrorCode.FILE_UPLOAD_FAILED]: '文件上传失败',
    [ErrorCode.INVALID_FILENAME]: '无效的文件名',
    [ErrorCode.FILE_SIZE_EXCEEDED]: '文件大小超过限制',
    [ErrorCode.FILE_TYPE_NOT_SUPPORTED]: '不支持的文件类型',
    [ErrorCode.FILE_COUNT_EXCEEDED]: '文件数量超过限制',
    // AI服务相关
    [ErrorCode.AI_SERVICE_UNAVAILABLE]: 'AI服务暂时不可用',
    [ErrorCode.AI_SERVICE_TIMEOUT]: 'AI服务响应超时',
    [ErrorCode.AI_RESPONSE_INVALID]: 'AI服务响应格式错误',
    [ErrorCode.AI_QUOTA_EXCEEDED]: 'AI服务配额已用尽',
    [ErrorCode.API_KEY_INVALID]: 'API密钥无效',
    // 题库相关
    [ErrorCode.QUESTION_NOT_FOUND]: '题目不存在',
    [ErrorCode.QUESTION_TYPE_INVALID]: '题目类型无效',
    [ErrorCode.QUESTION_ANSWER_INVALID]: '题目答案格式错误',
    [ErrorCode.QUESTION_DIFFICULTY_INVALID]: '题目难度无效',
    [ErrorCode.QUESTION_IMPORT_FAILED]: '题目导入失败',
    // 考试相关
    [ErrorCode.EXAM_SESSION_NOT_FOUND]: '考试会话不存在',
    [ErrorCode.EXAM_ALREADY_ENDED]: '考试已结束',
    [ErrorCode.EXAM_TIME_EXPIRED]: '考试时间已过期',
    [ErrorCode.ANSWER_TIMEOUT]: '答题超时',
    [ErrorCode.ANSWER_INVALID]: '答案无效',
    // 知识图谱相关
    [ErrorCode.KNOWLEDGE_RELATION_NOT_FOUND]: '知识关系不存在',
    [ErrorCode.KNOWLEDGE_RELATION_EXISTS]: '知识关系已存在',
    [ErrorCode.KNOWLEDGE_RELATION_TYPE_INVALID]: '知识关系类型无效',
    [ErrorCode.GRAPH_STRUCTURE_INVALID]: '图谱结构无效',
};
// ==================== 工具函数 ====================
/**
 * 根据错误码获取HTTP状态码
 * @param code 错误码
 * @returns HTTP状态码
 */
export function getHttpStatus(code) {
    return ErrorCodeToStatus[code] || 500;
}
/**
 * 根据错误码获取默认消息
 * @param code 错误码
 * @returns 默认错误消息
 */
export function getErrorMessage(code) {
    return ErrorCodeToMessage[code] || '发生了一个未知错误';
}
/**
 * 检查是否为已知错误码
 * @param code 错误码字符串
 * @returns 是否为已知错误码
 */
export function isKnownErrorCode(code) {
    return Object.values(ErrorCode).includes(code);
}
//# sourceMappingURL=errors.js.map