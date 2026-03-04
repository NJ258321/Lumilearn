import { Router, Request, Response } from 'express'
import { body, param, query, validationResult } from 'express-validator'
import prisma from '../lib/prisma.js'

const router = Router()

// ============ Helper: Validation Middleware ============
const validate = (req: Request, res: Response, next: Function) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.type === 'field' ? err.path : 'unknown',
        message: err.msg
      }))
    })
  }
  next()
}

// ============ GET /api/courses - 获取课程列表 ============
router.get('/',
  query('status').optional().isIn(['STUDYING', 'REVIEWING', 'ARCHIVED']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { status } = req.query

      // 构建查询条件
      const where: any = {}
      if (status) {
        where.status = status
      }

      // 查询课程，按创建时间倒序
      const courses = await prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          chapters: {
            orderBy: { order: 'asc' }
          },
          _count: {
            select: {
              chapters: true,
              mistakes: true
            }
          }
        }
      })

      res.json({
        success: true,
        data: courses
      })
    } catch (error) {
      console.error('Error fetching courses:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch courses'
      })
    }
  }
)

// ============ GET /api/courses/:id - 获取单个课程详情 ============
router.get('/:id',
  param('id').isUUID(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const course = await prisma.course.findUnique({
        where: { id },
        include: {
          chapters: {
            orderBy: { order: 'asc' },
            include: {
              knowledgePoints: true
            }
          },
          examTasks: {
            orderBy: { scheduledDate: 'asc' }
          },
          mistakes: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        })
      }

      res.json({
        success: true,
        data: course
      })
    } catch (error) {
      console.error('Error fetching course:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to fetch course'
      })
    }
  }
)

// ============ POST /api/courses - 创建新课程 ============
router.post('/',
  body('name').trim().notEmpty().withMessage('Course name is required'),
  body('status').optional().isIn(['STUDYING', 'REVIEWING', 'ARCHIVED']),
  body('type').optional().isIn(['PROFESSIONAL', 'CROSS_MAJOR', 'ELECTIVE']),
  body('examDate').optional().isISO8601(),
  body('reviewStartDate').optional().isISO8601(),
  body('targetGrade').optional().isIn(['S', 'A', 'B', 'C']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const {
        name,
        status = 'STUDYING',
        type = 'PROFESSIONAL',
        examDate,
        reviewStartDate,
        targetGrade
      } = req.body

      const course = await prisma.course.create({
        data: {
          name,
          status,
          type,
          examDate: examDate ? new Date(examDate) : null,
          reviewStartDate: reviewStartDate ? new Date(reviewStartDate) : null,
          targetGrade: targetGrade as any
        }
      })

      res.status(201).json({
        success: true,
        data: course
      })
    } catch (error) {
      console.error('Error creating course:', error)
      res.status(500).json({
        success: false,
        error: 'Failed to create course'
      })
    }
  }
)

// ============ PUT /api/courses/:id - 更新课程 ============
router.put('/:id',
  param('id').isUUID(),
  body('name').optional().trim().notEmpty(),
  body('status').optional().isIn(['STUDYING', 'REVIEWING', 'ARCHIVED']),
  body('type').optional().isIn(['PROFESSIONAL', 'CROSS_MAJOR', 'ELECTIVE']),
  body('examDate').optional().isISO8601(),
  body('reviewStartDate').optional().isISO8601(),
  body('targetGrade').optional().isIn(['S', 'A', 'B', 'C']),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const updateData: any = {}

      if (req.body.name !== undefined) updateData.name = req.body.name
      if (req.body.status !== undefined) updateData.status = req.body.status
      if (req.body.type !== undefined) updateData.type = req.body.type
      if (req.body.examDate !== undefined) updateData.examDate = req.body.examDate ? new Date(req.body.examDate) : null
      if (req.body.reviewStartDate !== undefined) updateData.reviewStartDate = req.body.reviewStartDate ? new Date(req.body.reviewStartDate) : null
      if (req.body.targetGrade !== undefined) updateData.targetGrade = req.body.targetGrade

      const course = await prisma.course.update({
        where: { id },
        data: updateData
      })

      res.json({
        success: true,
        data: course
      })
    } catch (error: any) {
      console.error('Error updating course:', error)
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        })
      }
      res.status(500).json({
        success: false,
        error: 'Failed to update course'
      })
    }
  }
)

// ============ DELETE /api/courses/:id - 删除课程 ============
router.delete('/:id',
  param('id').isUUID(),
  validate,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      await prisma.course.delete({
        where: { id }
      })

      res.json({
        success: true,
        message: 'Course deleted successfully'
      })
    } catch (error: any) {
      console.error('Error deleting course:', error)
      if (error.code === 'P2025') {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        })
      }
      res.status(500).json({
        success: false,
        error: 'Failed to delete course'
      })
    }
  }
)

export default router
