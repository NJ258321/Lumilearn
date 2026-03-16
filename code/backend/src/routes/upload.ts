import { Router, type Request, type Response, type NextFunction } from 'express'
import multer from 'multer'
import { validate } from '../middleware/validator.js'
import type { ApiResponse, UploadResponse } from '../types/index.js'
import {
  ensureUploadDir,
  createMulterStorage,
  createFileFilter,
  AUDIO_TYPES,
  IMAGE_TYPES,
  DOCUMENT_TYPES,
  MAX_FILE_SIZE,
  deleteFile,
  fileExists,
  getFilePath,
  getFileUrl,
  formatFileSize
} from '../utils/file.js'

const router = Router()

// 确保上传目录存在
ensureUploadDir().catch(console.error)

// ==================== Multer Configurations ====================

// 硬编码100MB，绕过任何缓存问题
const MAX_AUDIO_SIZE = 100 * 1024 * 1024 // 100MB
console.log('[Upload] MAX_AUDIO_SIZE:', MAX_AUDIO_SIZE, 'bytes')

// 音频上传配置
const audioUpload = multer({
  storage: createMulterStorage(),
  fileFilter: createFileFilter(AUDIO_TYPES),
  limits: { fileSize: MAX_AUDIO_SIZE }
})

// 图片上传配置
const imageUpload = multer({
  storage: createMulterStorage(),
  fileFilter: createFileFilter(IMAGE_TYPES),
  limits: { fileSize: MAX_AUDIO_SIZE }
})

// 文档上传配置
const documentUpload = multer({
  storage: createMulterStorage(),
  fileFilter: createFileFilter(DOCUMENT_TYPES),
  limits: { fileSize: MAX_AUDIO_SIZE * 5 } // 文档允许更大（500MB）
})

// ==================== Error Handling Middleware ====================

const handleMulterError = (err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: `文件大小超过限制（最大 ${formatFileSize(MAX_FILE_SIZE)}）`
      })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: '上传文件数量超过限制'
      })
    }
    return res.status(400).json({
      success: false,
      error: `上传失败: ${err.message}`
    })
  }
  next(err)
}

// ==================== Routes ====================

/**
 * Task-1.3.1: POST /api/upload/audio - 上传音频文件
 */
router.post('/audio', audioUpload.single('audio'), async (req: Request, res: Response) => {
  try {
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        error: '未上传文件'
      } as ApiResponse<undefined>)
    }

    const responseData: UploadResponse = {
      filename: file.filename,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      size: file.size,
      mimetype: file.mimetype,
      url: getFileUrl(file.filename)
    }

    res.status(201).json({
      success: true,
      data: responseData
    } as ApiResponse<UploadResponse>)
  } catch (error: any) {
    console.error('Error uploading audio:', error)
    res.status(500).json({
      success: false,
      error: error.message || '上传音频失败'
    } as ApiResponse<undefined>)
  }
})

/**
 * Task-1.3.2: POST /api/upload/image - 上传图片（PPT、板书照片）
 */
router.post('/image', imageUpload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        error: '未上传文件'
      } as ApiResponse<undefined>)
    }

    const responseData: UploadResponse = {
      filename: file.filename,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      size: file.size,
      mimetype: file.mimetype,
      url: getFileUrl(file.filename)
    }

    res.status(201).json({
      success: true,
      data: responseData
    } as ApiResponse<UploadResponse>)
  } catch (error: any) {
    console.error('Error uploading image:', error)
    res.status(500).json({
      success: false,
      error: error.message || '上传图片失败'
    } as ApiResponse<undefined>)
  }
})

/**
 * Task-1.3.3: POST /api/upload/document - 上传文档（PDF、PPT、Word）
 */
router.post('/document', documentUpload.single('document'), async (req: Request, res: Response) => {
  try {
    const file = req.file

    if (!file) {
      return res.status(400).json({
        success: false,
        error: '未上传文件'
      } as ApiResponse<undefined>)
    }

    const responseData: UploadResponse = {
      filename: file.filename,
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      size: file.size,
      mimetype: file.mimetype,
      url: getFileUrl(file.filename)
    }

    res.status(201).json({
      success: true,
      data: responseData
    } as ApiResponse<UploadResponse>)
  } catch (error: any) {
    console.error('Error uploading document:', error)
    res.status(500).json({
      success: false,
      error: error.message || '上传文档失败'
    } as ApiResponse<undefined>)
  }
})

/**
 * Task-1.3.5: GET /api/upload/info/:filename - 获取文件信息
 * 注意：此路由必须在 /:filename 之前定义，否则会被匹配
 */
router.get('/info/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params

    // 验证文件名
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: '无效的文件名',
        code: 'INVALID_FILENAME'
      } as ApiResponse<undefined>)
    }

    const filePath = getFilePath(filename)

    // 检查文件是否存在
    const fileInfo = await fileExists(filename)
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        error: '文件不存在',
        code: 'FILE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 获取文件信息
    const fs = await import('fs/promises')
    const stats = await fs.stat(filePath)

    res.json({
      success: true,
      data: {
        filename,
        url: getFileUrl(filename),
        size: stats.size,
        sizeFormatted: formatFileSize(stats.size),
        created: stats.birthtime,
        modified: stats.mtime
      }
    })
  } catch (error: any) {
    console.error('Error getting file info:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取文件信息失败',
      code: 'FILE_READ_FAILED'
    } as ApiResponse<undefined>)
  }
})

/**
 * P1.2: GET /api/upload/:filename - 获取/预览文件
 * 支持图片直接显示、音频/视频流式播放、文档下载
 * 注意：此路由必须在 DELETE /:filename 之后定义
 */
router.get('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params

    // 验证文件名，防止路径遍历攻击
    if (filename.includes('..') || filename.startsWith('/') || filename.startsWith('\\')) {
      return res.status(400).json({
        success: false,
        error: '无效的文件名',
        code: 'INVALID_FILENAME'
      } as ApiResponse<undefined>)
    }

    const filePath = getFilePath(filename)

    // 检查文件是否存在
    const exists = await fileExists(filename)
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: '文件不存在',
        code: 'FILE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 根据文件扩展名确定 Content-Type
    const ext = filename.toLowerCase().split('.').pop() || ''
    const mimeTypes: Record<string, string> = {
      // 图片
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      // 音频
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      'm4a': 'audio/mp4',
      // 视频
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      // 文档
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      // 文本
      'txt': 'text/plain',
      'html': 'text/html',
      'css': 'text/css',
      'js': 'application/javascript',
      'json': 'application/json',
      'xml': 'application/xml'
    }

    const contentType = mimeTypes[ext] || 'application/octet-stream'

    // 检查是否是流式媒体（支持 Range 请求）
    const streamingTypes = ['audio/', 'video/']
    const isStreaming = streamingTypes.some(type => contentType.startsWith(type))

    if (isStreaming) {
      // 流式媒体：支持 Range 请求
      const fs = await import('fs')
      const stats = fs.statSync(filePath)
      const fileSize = stats.size
      const range = req.headers.range

      if (range) {
        // 解析 Range 头
        const parts = range.replace(/bytes=/, '').split('-')
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
        const chunkSize = end - start + 1

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType
        })

        const stream = fs.createReadStream(filePath, { start, end })
        stream.pipe(res)
      } else {
        // 无 Range 请求，返回整个文件
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes'
        })

        const stream = fs.createReadStream(filePath)
        stream.pipe(res)
      }
    } else {
      // 非流式媒体：直接读取文件
      const fs = await import('fs')
      const fileBuffer = fs.readFileSync(filePath)

      // 对于图片和直接显示的文件，设置合适的缓存头
      const cacheControl = contentType.startsWith('image/') || contentType.startsWith('audio/')
        ? 'public, max-age=86400'  // 缓存 1 天
        : 'no-cache'

      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Length', fileBuffer.length)
      res.setHeader('Cache-Control', cacheControl)
      res.setHeader('Content-Disposition', contentType.startsWith('image/') ? 'inline' : 'attachment')

      res.send(fileBuffer)
    }
  } catch (error: any) {
    console.error('Error serving file:', error)
    res.status(500).json({
      success: false,
      error: '读取文件失败',
      code: 'FILE_READ_FAILED'
    } as ApiResponse<undefined>)
  }
})

/**
 * Task-1.3.4: DELETE /api/upload/:filename - 删除文件
 * 注意：此路由必须在 GET /:filename 之后定义
 */
router.delete('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params

    // 验证文件名，防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: '无效的文件名',
        code: 'INVALID_FILENAME'
      } as ApiResponse<undefined>)
    }

    // 检查文件是否存在
    const exists = await fileExists(filename)
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: '文件不存在',
        code: 'FILE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 删除文件
    const deleted = await deleteFile(filename)
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: '删除文件失败',
        code: 'FILE_DELETE_FAILED'
      } as ApiResponse<undefined>)
    }

    res.json({
      success: true,
      message: '文件删除成功'
    } as ApiResponse<undefined>)
  } catch (error: any) {
    console.error('Error deleting file:', error)
    res.status(500).json({
      success: false,
      error: error.message || '删除文件失败',
      code: 'FILE_DELETE_FAILED'
    } as ApiResponse<undefined>)
  }
})

// 应用 Multer 错误处理中间件
router.use(handleMulterError)

export default router
