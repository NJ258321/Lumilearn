/** 上传目录 */
export declare const UPLOAD_DIR: string;
/** 文件大小限制（字节） */
export declare const MAX_FILE_SIZE: number;
/** 支持的音频类型 */
export declare const AUDIO_TYPES: string[];
/** 支持的图片类型 */
export declare const IMAGE_TYPES: string[];
/** 支持的文档类型 */
export declare const DOCUMENT_TYPES: string[];
/**
 * 确保上传目录存在
 */
export declare function ensureUploadDir(): Promise<void>;
/**
 * 生成唯一文件名
 * @param originalName 原始文件名
 * @param prefix 文件名前缀（可选）
 * @returns 唯一文件名
 */
export declare function generateUniqueFilename(originalName: string, prefix?: string): string;
/**
 * 使用UUID生成文件名
 * @param originalName 原始文件名
 * @returns UUID文件名
 */
export declare function generateUUIDFilename(originalName: string): string;
/**
 * 获取文件类型分类
 * @param mimetype MIME类型
 * @returns 文件类型分类
 */
export declare function getFileCategory(mimetype: string): 'audio' | 'image' | 'document' | 'unknown';
/**
 * 验证文件类型
 * @param mimetype MIME类型
 * @param category 允许的文件类型分类
 * @returns 是否允许
 */
export declare function isValidFileType(mimetype: string, category?: 'audio' | 'image' | 'document'): boolean;
/**
 * 获取文件的完整路径
 * @param filename 文件名
 * @returns 完整路径
 */
export declare function getFilePath(filename: string): string;
/**
 * 获取文件的URL
 * @param filename 文件名
 * @returns 文件URL
 */
export declare function getFileUrl(filename: string): string;
/**
 * 检查文件是否存在
 * @param filename 文件名
 * @returns 是否存在
 */
export declare function fileExists(filename: string): Promise<boolean>;
/**
 * 删除文件
 * @param filename 文件名
 * @returns 是否成功
 */
export declare function deleteFile(filename: string): Promise<boolean>;
/**
 * 获取文件信息
 * @param filename 文件名
 * @returns 文件信息
 */
export declare function getFileInfo(filename: string): Promise<Stats | null>;
/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export declare function formatFileSize(bytes: number): string;
/**
 * 验证文件大小
 * @param bytes 字节数
 * @param maxSize 最大字节数（默认使用配置）
 * @returns 是否在限制内
 */
export declare function isValidFileSize(bytes: number, maxSize?: number): boolean;
/** 文件统计信息 */
export interface Stats {
    size: number;
    created: Date;
    modified: Date;
    isFile: boolean;
}
/** Multer 文件信息 */
export interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    filename: string;
    path: string;
    destination: string;
}
/**
 * 创建 Multer 存储配置
 */
export declare function createMulterStorage(): any;
/**
 * 创建文件过滤器
 * @param allowedTypes 允许的MIME类型列表
 */
export declare function createFileFilter(allowedTypes: string[]): (_req: unknown, file: MulterFile, cb: (error: Error | null, acceptFile: boolean) => void) => void;
//# sourceMappingURL=file.d.ts.map