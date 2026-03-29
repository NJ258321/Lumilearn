/**
 * OSS 上传工具
 * 实际实现：保存到本地 uploads 目录
 */

import { writeFile } from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_DIR, getFileUrl } from './file.js';

/**
 * 上传文件到 OSS（本地实现）
 * @param buffer 文件内容
 * @param filename 文件名（包含路径）
 * @param mimeType MIME 类型
 * @returns 文件访问 URL
 */
export async function uploadToOSS(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  // 生成唯一文件名
  const uniqueId = uuidv4();
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  const finalFilename = `${basename}-${uniqueId}${ext}`;
  
  // 保存到 uploads 目录
  const filePath = path.join(UPLOAD_DIR, finalFilename);
  await writeFile(filePath, buffer);
  
  // 返回访问 URL
  return getFileUrl(finalFilename);
}
