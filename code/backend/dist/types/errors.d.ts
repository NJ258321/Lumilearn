/**
 * 错误码定义
 * 统一的项目错误码体系
 */
/** 错误码前缀分类 */
export declare const ErrorPrefix: {
    readonly COMMON: "1";
    readonly AUTH: "2";
    readonly COURSE: "3";
    readonly CHAPTER: "4";
    readonly KNOWLEDGE: "5";
    readonly STUDY_RECORD: "6";
    readonly FILE: "7";
    readonly AI: "8";
    readonly QUESTION: "9";
    readonly EXAM: "10";
    readonly KNOWLEDGE_GRAPH: "11";
};
/** 错误码枚举 */
export declare const ErrorCode: {
    /** 未知错误 */
    readonly UNKNOWN_ERROR: "1000";
    /** 请求参数无效 */
    readonly INVALID_PARAMS: "1001";
    /** 缺少必填参数 */
    readonly MISSING_REQUIRED_PARAMS: "1002";
    /** 资源不存在 */
    readonly NOT_FOUND: "1003";
    /** 方法不允许 */
    readonly METHOD_NOT_ALLOWED: "1004";
    /** 请求超时 */
    readonly TIMEOUT: "1005";
    /** 服务器内部错误 */
    readonly INTERNAL_SERVER_ERROR: "1006";
    /** 服务不可用 */
    readonly SERVICE_UNAVAILABLE: "1007";
    /** 数据库错误 */
    readonly DATABASE_ERROR: "1008";
    /** 缓存错误 */
    readonly CACHE_ERROR: "1009";
    /** 未认证 */
    readonly NOT_AUTHENTICATED: "2000";
    /** Token无效 */
    readonly INVALID_TOKEN: "2001";
    /** Token过期 */
    readonly TOKEN_EXPIRED: "2002";
    /** 权限不足 */
    readonly FORBIDDEN: "2003";
    /** 用户不存在 */
    readonly USER_NOT_FOUND: "2004";
    /** 用户名已存在 */
    readonly USERNAME_EXISTS: "2005";
    /** 邮箱已存在 */
    readonly EMAIL_EXISTS: "2006";
    /** 密码错误 */
    readonly INVALID_PASSWORD: "2007";
    /** 账户已被禁用 */
    readonly ACCOUNT_DISABLED: "2008";
    /** 登录失败次数过多 */
    readonly LOGIN_TOO_MANY_ATTEMPTS: "2009";
    /** 课程不存在 */
    readonly COURSE_NOT_FOUND: "3000";
    /** 课程名称重复 */
    readonly COURSE_NAME_EXISTS: "3001";
    /** 课程状态无效 */
    readonly COURSE_STATUS_INVALID: "3002";
    /** 课程类型无效 */
    readonly COURSE_TYPE_INVALID: "3003";
    /** 无法删除课程（下有关联数据） */
    readonly COURSE_CANNOT_DELETE: "3004";
    /** 章节不存在 */
    readonly CHAPTER_NOT_FOUND: "4000";
    /** 章节名称重复 */
    readonly CHAPTER_NAME_EXISTS: "4001";
    /** 章节顺序无效 */
    readonly CHAPTER_ORDER_INVALID: "4002";
    /** 章节不属于该课程 */
    readonly CHAPTER_NOT_IN_COURSE: "4003";
    /** 知识点不存在 */
    readonly KNOWLEDGE_POINT_NOT_FOUND: "5000";
    /** 知识点名称重复 */
    readonly KNOWLEDGE_POINT_EXISTS: "5001";
    /** 知识点状态无效 */
    readonly KNOWLEDGE_STATUS_INVALID: "5002";
    /** 知识点掌握度无效 */
    readonly MASTERY_SCORE_INVALID: "5003";
    /** 学习记录不存在 */
    readonly STUDY_RECORD_NOT_FOUND: "6000";
    /** 学习记录状态无效 */
    readonly STUDY_RECORD_STATUS_INVALID: "6001";
    /** 录音处理失败 */
    readonly AUDIO_PROCESSING_FAILED: "6002";
    /** 文件不存在 */
    readonly FILE_NOT_FOUND: "7000";
    /** 文件删除失败 */
    readonly FILE_DELETE_FAILED: "7001";
    /** 文件上传失败 */
    readonly FILE_UPLOAD_FAILED: "7002";
    /** 无效的文件名 */
    readonly INVALID_FILENAME: "7003";
    /** 文件大小超限 */
    readonly FILE_SIZE_EXCEEDED: "7004";
    /** 不支持的文件类型 */
    readonly FILE_TYPE_NOT_SUPPORTED: "7005";
    /** 文件数量超限 */
    readonly FILE_COUNT_EXCEEDED: "7006";
    /** AI服务不可用 */
    readonly AI_SERVICE_UNAVAILABLE: "8000";
    /** AI服务超时 */
    readonly AI_SERVICE_TIMEOUT: "8001";
    /** AI服务返回格式错误 */
    readonly AI_RESPONSE_INVALID: "8002";
    /** AI服务配额不足 */
    readonly AI_QUOTA_EXCEEDED: "8003";
    /** API密钥无效 */
    readonly API_KEY_INVALID: "8004";
    /** 题目不存在 */
    readonly QUESTION_NOT_FOUND: "9000";
    /** 题目类型无效 */
    readonly QUESTION_TYPE_INVALID: "9001";
    /** 题目答案格式错误 */
    readonly QUESTION_ANSWER_INVALID: "9002";
    /** 题目难度无效 */
    readonly QUESTION_DIFFICULTY_INVALID: "9003";
    /** 题目导入失败 */
    readonly QUESTION_IMPORT_FAILED: "9004";
    /** 考试会话不存在 */
    readonly EXAM_SESSION_NOT_FOUND: "10000";
    /** 考试已结束 */
    readonly EXAM_ALREADY_ENDED: "10001";
    /** 考试时间已过期 */
    readonly EXAM_TIME_EXPIRED: "10002";
    /** 答题超时 */
    readonly ANSWER_TIMEOUT: "10003";
    /** 答案无效 */
    readonly ANSWER_INVALID: "10004";
    /** 知识关系不存在 */
    readonly KNOWLEDGE_RELATION_NOT_FOUND: "11000";
    /** 知识关系重复 */
    readonly KNOWLEDGE_RELATION_EXISTS: "11001";
    /** 知识关系类型无效 */
    readonly KNOWLEDGE_RELATION_TYPE_INVALID: "11002";
    /** 图谱结构无效 */
    readonly GRAPH_STRUCTURE_INVALID: "11003";
};
/** 错误码类型 */
export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
/** 错误码到HTTP状态码的映射 */
export declare const ErrorCodeToStatus: Record<ErrorCodeType, number>;
/** 错误码对应的默认消息 */
export declare const ErrorCodeToMessage: Record<ErrorCodeType, string>;
/**
 * 根据错误码获取HTTP状态码
 * @param code 错误码
 * @returns HTTP状态码
 */
export declare function getHttpStatus(code: ErrorCodeType): number;
/**
 * 根据错误码获取默认消息
 * @param code 错误码
 * @returns 默认错误消息
 */
export declare function getErrorMessage(code: ErrorCodeType): string;
/**
 * 检查是否为已知错误码
 * @param code 错误码字符串
 * @returns 是否为已知错误码
 */
export declare function isKnownErrorCode(code: string): code is ErrorCodeType;
//# sourceMappingURL=errors.d.ts.map