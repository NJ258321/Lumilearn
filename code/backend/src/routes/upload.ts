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

// 音频上传配置
const audioUpload = multer({
  storage: createMulterStorage(),
  fileFilter: createFileFilter(AUDIO_TYPES),
  limits: { fileSize: MAX_FILE_SIZE }
})

// 图片上传配置
const imageUpload = multer({
  storage: createMulterStorage(),
  fileFilter: createFileFilter(IMAGE_TYPES),
  limits: { fileSize: MAX_FILE_SIZE }
})

// 文档上传配置
const documentUpload = multer({
  storage: createMulterStorage(),
  fileFilter: createFileFilter(DOCUMENT_TYPES),
  limits: { fileSize: MAX_FILE_SIZE * 5 } // 文档允许更大（50MB）
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
      originalName: file.originalname,
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
      originalName: file.originalname,
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
      originalName: file.originalname,
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
 * Task-1.3.4: DELETE /api/upload/:filename - 删除文件
 */
router.delete('/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params

    // 验证文件名，防止路径遍历攻击
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: '无效的文件名'
      } as ApiResponse<undefined>)
    }

    // 检查文件是否存在
    const exists = await fileExists(filename)
    if (!exists) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
      } as ApiResponse<undefined>)
    }

    // 删除文件
    const deleted = await deleteFile(filename)
    if (!deleted) {
      return res.status(500).json({
        success: false,
        error: '删除文件失败'
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
      error: error.message || '删除文件失败'
    } as ApiResponse<undefined>)
  }
})

/**
 * Task-1.3.5: GET /api/upload/info/:filename - 获取文件信息
 */
router.get('/info/:filename', async (req: Request, res: Response) => {
  try {
    const { filename } = req.params

    // 验证文件名
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({
        success: false,
        error: '无效的文件名'
      } as ApiResponse<undefined>)
    }

    const filePath = getFilePath(filename)

    // 检查文件是否存在
    const fileInfo = await fileExists(filename)
    if (!fileInfo) {
      return res.status(404).json({
        success: false,
        error: '文件不存在'
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
      error: error.message || '获取文件信息失败'
    } as ApiResponse<undefined>)
  }
})

// 应用 Multer 错误处理中间件
router.use(handleMulterError)

export default router
