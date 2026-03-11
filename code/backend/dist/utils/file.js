import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
// ==================== Constants ====================
/** 上传目录 */
export const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
/** 文件大小限制（字节） */
export const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 默认10MB
/** 支持的音频类型 */
export const AUDIO_TYPES = [
    'audio/mpeg',
    'audio/wav',
    'audio/m4a',
    'audio/mp3',
    'audio/x-m4a',
    'audio/webm',
    'audio/ogg'
];
/** 支持的图片类型 */
export const IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
];
/** 支持的文档类型 */
export const DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];
// ==================== Utility Functions ====================
/**
 * 确保上传目录存在
 */
export async function ensureUploadDir() {
    if (!existsSync(UPLOAD_DIR)) {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
}
/**
 * 生成唯一文件名
 * @param originalName 原始文件名
 * @param prefix 文件名前缀（可选）
 * @returns 唯一文件名
 */
export function generateUniqueFilename(originalName, prefix) {
    const ext = path.extname(originalName);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = prefix ? `${prefix}-${uniqueSuffix}${ext}` : `${uniqueSuffix}${ext}`;
    return filename;
}
/**
 * 使用UUID生成文件名
 * @param originalName 原始文件名
 * @returns UUID文件名
 */
export function generateUUIDFilename(originalName) {
    const ext = path.extname(originalName);
    const uuid = uuidv4();
    return `${uuid}${ext}`;
}
/**
 * 获取文件类型分类
 * @param mimetype MIME类型
 * @returns 文件类型分类
 */
export function getFileCategory(mimetype) {
    if (AUDIO_TYPES.includes(mimetype))
        return 'audio';
    if (IMAGE_TYPES.includes(mimetype))
        return 'image';
    if (DOCUMENT_TYPES.includes(mimetype))
        return 'document';
    return 'unknown';
}
/**
 * 验证文件类型
 * @param mimetype MIME类型
 * @param category 允许的文件类型分类
 * @returns 是否允许
 */
export function isValidFileType(mimetype, category) {
    const fileCategory = getFileCategory(mimetype);
    if (!category)
        return fileCategory !== 'unknown';
    return fileCategory === category;
}
/**
 * 获取文件的完整路径
 * @param filename 文件名
 * @returns 完整路径
 */
export function getFilePath(filename) {
    return path.resolve(UPLOAD_DIR, filename);
}
/**
 * 获取文件的URL
 * @param filename 文件名
 * @returns 文件URL
 */
export function getFileUrl(filename) {
    return `/uploads/${filename}`;
}
/**
 * 检查文件是否存在
 * @param filename 文件名
 * @returns 是否存在
 */
export async function fileExists(filename) {
    try {
        const filePath = getFilePath(filename);
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * 删除文件
 * @param filename 文件名
 * @returns 是否成功
 */
export async function deleteFile(filename) {
    try {
        const filePath = getFilePath(filename);
        await fs.unlink(filePath);
        return true;
    }
    catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
}
/**
 * 获取文件信息
 * @param filename 文件名
 * @returns 文件信息
 */
export async function getFileInfo(filename) {
    try {
        const filePath = getFilePath(filename);
        const stats = await fs.stat(filePath);
        return {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            isFile: stats.isFile()
        };
    }
    catch {
        return null;
    }
}
/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export function formatFileSize(bytes) {
    if (bytes === 0)
        return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
/**
 * 验证文件大小
 * @param bytes 字节数
 * @param maxSize 最大字节数（默认使用配置）
 * @returns 是否在限制内
 */
export function isValidFileSize(bytes, maxSize = MAX_FILE_SIZE) {
    return bytes > 0 && bytes <= maxSize;
}
// ==================== Multer Storage Configuration ====================
/**
 * 创建 Multer 存储配置
 */
export function createMulterStorage() {
    return {
        _handleFile: function (_req, file, cb) {
            const uniqueName = generateUniqueFilename(file.originalname, file.fieldname);
            const dest = UPLOAD_DIR;
            const finalPath = `${dest}/${uniqueName}`;
            // 确保目录存在
            import('fs').then(fs => {
                if (!fs.existsSync(dest)) {
                    fs.mkdirSync(dest, { recursive: true });
                }
                const outStream = fs.createWriteStream(finalPath);
                file.stream.pipe(outStream);
                outStream.on('error', cb);
                outStream.on('finish', function () {
                    cb(null, {
                        destination: dest,
                        filename: uniqueName,
                        path: finalPath,
                        size: file.size,
                        mimetype: file.mimetype,
                        originalname: file.originalname,
                        fieldname: file.fieldname
                    });
                });
            });
        },
        _removeFile: function (_req, file, cb) {
            import('fs').then(fs => {
                fs.unlink(file.path, cb);
            });
        }
    };
}
/**
 * 创建文件过滤器
 * @param allowedTypes 允许的MIME类型列表
 */
export function createFileFilter(allowedTypes) {
    return (_req, file, cb) => {
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`不支持的文件类型: ${file.mimetype}`), false);
        }
    };
}
//# sourceMappingURL=file.js.map