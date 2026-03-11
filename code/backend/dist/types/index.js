// ==================== Enums ====================
/** 支持的文件类型 */
export const SUPPORTED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/wav',
    'audio/m4a',
    'audio/mp3'
];
export const SUPPORTED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
];
export const SUPPORTED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];
// ==================== Constants ====================
/** 掌握度阈值 */
export const MASTERY_THRESHOLDS = {
    MASTERED: 80,
    NEED_REVIEW: 60,
    WEAK: 0
};
/** 掌握度对应的默认状态 */
export const getMasteryStatus = (score) => {
    if (score >= MASTERY_THRESHOLDS.MASTERED)
        return 'MASTERED';
    if (score >= MASTERY_THRESHOLDS.NEED_REVIEW)
        return 'NEED_REVIEW';
    return 'WEAK';
};
/** 复习轮次配置 */
export const ROUND_CONFIG = {
    1: { name: '一轮复习', weight: 0.4 },
    2: { name: '二轮复习', weight: 0.35 },
    3: { name: '三轮复习', weight: 0.25 }
};
//# sourceMappingURL=index.js.map