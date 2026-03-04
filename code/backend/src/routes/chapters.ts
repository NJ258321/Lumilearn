import { Router, type Request, type Response } from 'express'
import { body, param, query } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type {
  ApiResponse,
  Chapter,
  CreateChapterRequest,
  UpdateChapterRequest
} from '../types/index.js'
import prisma from '../lib/prisma.js'

const router = Router()

// ==================== GET /api/chapters - 获取所有章节（可按课程筛选） ====================

router.get('/', [
  query('courseId').optional().isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId } = req.query

    // 构建查询条件
    const where: any = {}
    if (courseId) {
      where.courseId = courseId
    }

    // 查询章节，按排序序号升序
    const chapters = await prisma.chapter.findMany({
      where,
      orderBy: { order: 'asc' },
      include: {
        course: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      success: true,
      data: chapters
    } as ApiResponse<Chapter[]>)
  } catch (error: any) {
    console.error('Error fetching chapters:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chapters'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/chapters/:id - 获取单个章节详情 ====================

router.get('/:id', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, name: true }
        },
        knowledgePoints: {
          orderBy: { id: 'asc' }
        }
      }
    })

    if (!chapter) {
      return res.status(404).json({
        success: false,
        error: 'Chapter not found'
      } as ApiResponse<undefined>)
    }

    res.json({
      success: true,
      data: chapter
    } as ApiResponse<Chapter>)
  } catch (error: any) {
    console.error('Error fetching chapter:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chapter'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/chapters - 创建新章节 (Task-1.1.1) ====================

router.post('/', [
  body('courseId').isUUID().withMessage('Valid courseId is required'),
  body('name').trim().notEmpty().withMessage('Chapter name is required'),
  body('order').isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId, name, order }: CreateChapterRequest = req.body

    // 验证课程是否存在
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      } as ApiResponse<undefined>)
    }

    // 检查同一课程下是否已存在相同 order 的章节
    const existingChapter = await prisma.chapter.findUnique({
      where: {
        courseId_order: {
          courseId,
          order
        }
      }
    })

    if (existingChapter) {
      return res.status(400).json({
        success: false,
        error: `Chapter with order ${order} already exists in this course`
      } as ApiResponse<undefined>)
    }

    // 创建章节
    const chapter = await prisma.chapter.create({
      data: {
        courseId,
        name,
        order
      },
      include: {
        course: {
          select: { id: true, name: true }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: chapter
    } as ApiResponse<Chapter>)
  } catch (error: any) {
    console.error('Error creating chapter:', error)

    // 处理唯一约束冲突
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Chapter with this order already exists in this course'
      } as ApiResponse<undefined>)
    }

    // 处理外键约束
    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        error: 'Course not found'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create chapter'
    } as ApiResponse<undefined>)
  }
})

// ==================== PUT /api/chapters/:id - 更新章节 ====================

router.put('/:id', [
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('order').optional().isInt({ min: 1 }),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData: UpdateChapterRequest = req.body

    // 查找现有章节
    const existingChapter = await prisma.chapter.findUnique({
      where: { id }
    })

    if (!existingChapter) {
      return res.status(404).json({
        success: false,
        error: 'Chapter not found'
      } as ApiResponse<undefined>)
    }

    // 如果更新 order，检查新 order 是否已被占用
    if (updateData.order !== undefined && updateData.order !== existingChapter.order) {
      const conflictChapter = await prisma.chapter.findUnique({
        where: {
          courseId_order: {
            courseId: existingChapter.courseId,
            order: updateData.order
          }
        }
      })

      if (conflictChapter && conflictChapter.id !== id) {
        return res.status(400).json({
          success: false,
          error: `Chapter with order ${updateData.order} already exists`
        } as ApiResponse<undefined>)
      }
    }

    // 更新章节
    const chapter = await prisma.chapter.update({
      where: { id },
      data: updateData,
      include: {
        course: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      success: true,
      data: chapter
    } as ApiResponse<Chapter>)
  } catch (error: any) {
    console.error('Error updating chapter:', error)

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Chapter not found'
      } as ApiResponse<undefined>)
    }

    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Chapter with this order already exists'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update chapter'
    } as ApiResponse<undefined>)
  }
})

// ==================== DELETE /api/chapters/:id - 删除章节 ====================

router.delete('/:id', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 检查章节是否存在
    const chapter = await prisma.chapter.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            knowledgePoints: true
          }
        }
      }
    })

    if (!chapter) {
      return res.status(404).json({
        success: false,
        error: 'Chapter not found'
      } as ApiResponse<undefined>)
    }

    // 警告：删除章节会级联删除所有关联的知识点
    if (chapter._count.knowledgePoints > 0) {
      console.warn(`Deleting chapter ${id} with ${chapter._count.knowledgePoints} knowledge points`)
    }

    // 删除章节（会级联删除关联的知识点）
    await prisma.chapter.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Chapter deleted successfully'
    } as ApiResponse<undefined>)
  } catch (error: any) {
    console.error('Error deleting chapter:', error)

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Chapter not found'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete chapter'
    } as ApiResponse<undefined>)
  }
})

export default router
