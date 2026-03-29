import { Router, type Request, type Response } from 'express'
import { body, param, query } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type {
  ApiResponse,
  StudyRecord,
  TimeMark,
  CreateStudyRecordRequest,
  UpdateStudyRecordRequest,
  CreateTimeMarkRequest,
  UpdateTimeMarkRequest,
  CreateEmphasisRequest
} from '../types/index.js'
import prisma from '../lib/prisma.js'

const router = Router()

// ==================== GET /api/study-records - 获取学习记录列表 (Task-1.2.2) ====================

router.get('/', [
  query('courseId').optional().isUUID(),
  query('chapterId').optional().isUUID(),
  query('status').optional().isIn(['RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId, status, startDate, endDate } = req.query

    // 构建查询条件
    const where: any = {}
    if (courseId) where.courseId = courseId
    if (chapterId) where.chapterId = chapterId
    if (status) where.status = status

    // 日期范围筛选
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate as string)
      if (endDate) where.date.lte = new Date(endDate as string)
    }

    // 查询学习记录，按日期降序
    const studyRecords = await prisma.studyRecord.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        course: {
          select: { id: true, name: true }
        },
        chapter: {
          select: { id: true, name: true }
        }
      }
    })

    // 解析每个记录的 imageUrls，不返回 pptContent（详情接口才返回）
    const formattedRecords = studyRecords.map(record => {
      let imageUrls: string[] = []
      try {
        imageUrls = JSON.parse(record.imageUrls || '[]')
      } catch (e) {
        imageUrls = []
      }
      // 移除 pptContent，避免列表显示乱码
      const { pptContent, ...rest } = record as any
      return {
        ...rest,
        imageUrls
      }
    })

    res.json({
      success: true,
      data: formattedRecords
    } as ApiResponse<StudyRecord[]>)
  } catch (error: any) {
    console.error('Error fetching study records:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch study records'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/study-records/search - 按时间范围搜索学习记录 (Task-2.3.1) ====================

router.get('/search', [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('courseId').optional().isUUID(),
  query('status').optional().isIn(['RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  query('keyword').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('pageSize').optional().isInt({ min: 1, max: 100 }),
  validate
], async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, courseId, status, keyword, page = '1', pageSize = '20' } = req.query

    // 构建查询条件
    const where: any = {}

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate as string)
      }
      if (endDate) {
        where.date.lte = new Date(endDate as string)
      }
    }

    if (courseId) {
      where.courseId = courseId
    }

    if (status) {
      where.status = status
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword as string } },
        { notes: { contains: keyword as string } }
      ]
    }

    // 计算分页
    const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string)
    const take = parseInt(pageSize as string)

    // 查询学习记录
    const [records, total] = await Promise.all([
      prisma.studyRecord.findMany({
        where,
        skip,
        take,
        orderBy: { date: 'desc' },
        include: {
          course: {
            select: { id: true, name: true }
          },
          chapter: {
            select: { id: true, name: true }
          },
          _count: {
            select: { timeMarks: true }
          }
        }
      }),
      prisma.studyRecord.count({ where })
    ])

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          total,
          page: parseInt(page as string),
          pageSize: parseInt(pageSize as string),
          totalPages: Math.ceil(total / parseInt(pageSize as string))
        }
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error searching study records:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to search study records'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/study-records/:id - 获取学习记录详情 (Task-1.2.3) ====================

router.get('/:id', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, name: true }
        },
        chapter: {
          select: { id: true, name: true }
        },
        timeMarks: {
          orderBy: { timestamp: 'asc' },
          include: {
            knowledgePoint: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 解析 JSON 字符串为对象/数组
    let imageUrls: string[] = []
    let pptContent: any = null
    try {
      imageUrls = JSON.parse(studyRecord.imageUrls || '[]')
    } catch (e) {
      imageUrls = []
    }
    try {
      pptContent = JSON.parse(studyRecord.pptContent || '{}')
      if (Object.keys(pptContent).length === 0) pptContent = null
    } catch (e) {
      pptContent = null
    }

    res.json({
      success: true,
      data: {
        ...studyRecord,
        imageUrls,
        pptContent
      }
    } as ApiResponse<StudyRecord>)
  } catch (error: any) {
    console.error('Error fetching study record:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch study record'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/study-records - 创建学习记录 (Task-1.2.1) ====================

router.post('/', [
  body('courseId').isUUID().withMessage('Valid courseId is required'),
  body('chapterId').isUUID().withMessage('Valid chapterId is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('audioUrl').optional().trim(),
  body('duration').isInt({ min: 0 }).withMessage('Duration must be a non-negative integer'),
  body('status').optional().isIn(['RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  body('notes').optional().isString(),
  body('imageUrls').optional().isArray().withMessage('imageUrls must be an array'),
  body('documentUrl').optional().isString(),
  body('pptContent').optional().isObject().withMessage('pptContent must be an object'),
  validate
], async (req: Request, res: Response) => {
  try {
    const { courseId, chapterId, title, date, audioUrl, duration, status = 'RECORDING', notes = '', imageUrls, documentUrl, pptContent } = req.body

    console.log('[CreateStudyRecord] Received notes length:', (notes || '').length);
    console.log('[CreateStudyRecord] Notes preview:', (notes || '').substring(0, 200));

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

    // 验证章节是否存在
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId }
    })

    if (!chapter) {
      return res.status(404).json({
        success: false,
        error: 'Chapter not found'
      } as ApiResponse<undefined>)
    }

    // 将数组转为 JSON 字符串存储
    const imageUrlsJson = imageUrls ? JSON.stringify(imageUrls) : '[]'
    const pptContentJson = pptContent ? JSON.stringify(pptContent) : '{}'

    // 创建学习记录
    const studyRecord = await prisma.studyRecord.create({
      data: {
        courseId,
        chapterId,
        title,
        date: new Date(date),
        audioUrl: audioUrl || null,
        documentUrl: documentUrl || null,
        pptContent: pptContentJson,
        duration,
        status,
        notes,
        imageUrls: imageUrlsJson
      },
      include: {
        course: {
          select: { id: true, name: true }
        },
        chapter: {
          select: { id: true, name: true }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: studyRecord
    } as ApiResponse<StudyRecord>)
  } catch (error: any) {
    console.error('Error creating study record:', error)

    // 处理外键约束
    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        error: 'Course or Chapter not found'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create study record'
    } as ApiResponse<undefined>)
  }
})

// ==================== PUT /api/study-records/:id - 更新学习记录 (Task-1.2.4) ====================

router.put('/:id', [
  param('id').isUUID(),
  body('title').optional().trim().notEmpty(),
  body('duration').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  body('notes').optional().isString(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData: UpdateStudyRecordRequest = req.body

    // 查找现有学习记录
    const existingRecord = await prisma.studyRecord.findUnique({
      where: { id }
    })

    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 如果提供 date 字符串，转换为 Date 对象
    const data: any = { ...updateData }
    if ((updateData as any).date) {
      data.date = new Date((updateData as any).date)
    }

    // 更新学习记录
    const studyRecord = await prisma.studyRecord.update({
      where: { id },
      data,
      include: {
        course: {
          select: { id: true, name: true }
        },
        chapter: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      success: true,
      data: studyRecord
    } as ApiResponse<StudyRecord>)
  } catch (error: any) {
    console.error('Error updating study record:', error)

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update study record'
    } as ApiResponse<undefined>)
  }
})

// ==================== DELETE /api/study-records/:id - 删除学习记录 (Task-1.2.5) ====================

router.delete('/:id', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 检查学习记录是否存在
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            timeMarks: true
          }
        }
      }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 警告：删除学习记录会级联删除所有关联的时间标记
    if (studyRecord._count.timeMarks > 0) {
      console.warn(`Deleting study record ${id} with ${studyRecord._count.timeMarks} time marks`)
    }

    // 删除学习记录（会级联删除关联的时间标记）
    await prisma.studyRecord.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Study record deleted successfully'
    } as ApiResponse<undefined>)
  } catch (error: any) {
    console.error('Error deleting study record:', error)

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete study record'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/study-records/:id/time-marks - 添加时间标记 (Task-1.2.6) ====================

router.post('/:id/time-marks', [
  param('id').isUUID(),
  body('type').isIn(['START', 'END', 'EMPHASIS', 'BOARD_CHANGE', 'NOTE', 'QUESTION']).withMessage('Valid type is required'),
  body('timestamp').isInt({ min: 0 }).withMessage('Valid timestamp is required'),
  body('knowledgePointId').optional().isUUID(),
  body('pptPage').optional().isInt({ min: 0 }),
  body('content').optional().isString(),
  body('imageUrl').optional().isString(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { type, timestamp, knowledgePointId, pptPage, content, imageUrl }: CreateTimeMarkRequest = req.body

    // 验证学习记录是否存在
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id: id }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 如果提供了 knowledgePointId，验证知识点是否存在
    if (knowledgePointId) {
      const knowledgePoint = await prisma.knowledgePoint.findUnique({
        where: { id: knowledgePointId }
      })

      if (!knowledgePoint) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge point not found'
        } as ApiResponse<undefined>)
      }
    }

    // 创建时间标记
    const timeMark = await prisma.timeMark.create({
      data: {
        studyRecordId: id,
        knowledgePointId,
        type,
        timestamp,
        pptPage,
        content,
        imageUrl
      },
      include: {
        studyRecord: {
          select: { id: true, title: true }
        },
        knowledgePoint: {
          select: { id: true, name: true }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: timeMark
    } as ApiResponse<TimeMark>)
  } catch (error: any) {
    console.error('Error creating time mark:', error)

    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        error: 'Study record or Knowledge point not found'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create time mark'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/study-records/:id/time-marks - 获取所有时间标记 (Task-1.2.7) ====================

router.get('/:id/time-marks', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 验证学习记录是否存在
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 获取所有时间标记，按时间戳升序
    const timeMarks = await prisma.timeMark.findMany({
      where: { studyRecordId: id },
      orderBy: { timestamp: 'asc' },
      include: {
        knowledgePoint: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      success: true,
      data: timeMarks
    } as ApiResponse<TimeMark[]>)
  } catch (error: any) {
    console.error('Error fetching time marks:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time marks'
    } as ApiResponse<undefined>)
  }
})

// ==================== PUT /api/time-marks/:id - 更新时间标记 (Task-1.2.8) ====================

router.put('/time-marks/:id', [
  param('id').isUUID(),
  body('type').optional().isIn(['START', 'END', 'EMPHASIS', 'BOARD_CHANGE', 'NOTE', 'QUESTION']),
  body('timestamp').optional().isInt({ min: 0 }),
  body('knowledgePointId').optional().isUUID(),
  body('pptPage').optional().isInt({ min: 0 }),
  body('content').optional().isString(),
  body('imageUrl').optional().isString(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData: UpdateTimeMarkRequest = req.body

    // 如果提供了 knowledgePointId，验证知识点是否存在
    if (updateData.knowledgePointId) {
      const knowledgePoint = await prisma.knowledgePoint.findUnique({
        where: { id: updateData.knowledgePointId }
      })

      if (!knowledgePoint) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge point not found'
        } as ApiResponse<undefined>)
      }
    }

    // 更新时间标记
    const timeMark = await prisma.timeMark.update({
      where: { id },
      data: updateData,
      include: {
        studyRecord: {
          select: { id: true, title: true }
        },
        knowledgePoint: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      success: true,
      data: timeMark
    } as ApiResponse<TimeMark>)
  } catch (error: any) {
    console.error('Error updating time mark:', error)

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Time mark not found'
      } as ApiResponse<undefined>)
    }

    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        error: 'Knowledge point not found'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update time mark'
    } as ApiResponse<undefined>)
  }
})

// ==================== DELETE /api/time-marks/:id - 删除时间标记 (Task-1.2.9) ====================

router.delete('/time-marks/:id', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 删除时间标记
    await prisma.timeMark.delete({
      where: { id }
    })

    res.json({
      success: true,
      message: 'Time mark deleted successfully'
    } as ApiResponse<undefined>)
  } catch (error: any) {
    console.error('Error deleting time mark:', error)

    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'Time mark not found'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to delete time mark'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/study-records/:id/emphasis - 快速标记重点 (Task-1.2.10) ====================

router.post('/:id/emphasis', [
  param('id').isUUID(),
  body('timestamp').isInt({ min: 0 }).withMessage('Valid timestamp is required'),
  body('content').optional().isString(),
  body('pptPage').optional().isInt({ min: 0 }),
  body('imageUrl').optional().isString(),
  body('knowledgePointId').optional().isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { timestamp, content, pptPage, imageUrl, knowledgePointId }: CreateEmphasisRequest = req.body

    // 验证学习记录是否存在
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 如果提供了 knowledgePointId，验证知识点是否存在
    if (knowledgePointId) {
      const knowledgePoint = await prisma.knowledgePoint.findUnique({
        where: { id: knowledgePointId }
      })

      if (!knowledgePoint) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge point not found'
        } as ApiResponse<undefined>)
      }
    }

    // 创建重点标记
    const timeMark = await prisma.timeMark.create({
      data: {
        studyRecordId: id,
        knowledgePointId,
        type: 'EMPHASIS',
        timestamp,
        pptPage,
        content,
        imageUrl
      },
      include: {
        studyRecord: {
          select: { id: true, title: true }
        },
        knowledgePoint: {
          select: { id: true, name: true }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: timeMark
    } as ApiResponse<TimeMark>)
  } catch (error: any) {
    console.error('Error creating emphasis mark:', error)

    if (error.code === 'P2003') {
      return res.status(404).json({
        success: false,
        error: 'Study record or Knowledge point not found'
      } as ApiResponse<undefined>)
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create emphasis mark'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/study-records/:id/playback - 获取回溯详情 (Task-2.1.1) ====================

router.get('/:id/playback', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 获取学习记录详情，包含所有相关信息
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, name: true }
        },
        chapter: {
          select: { id: true, name: true }
        },
        timeMarks: {
          orderBy: { timestamp: 'asc' },
          include: {
            knowledgePoint: {
              select: { id: true, name: true }
            }
          }
        }
      }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 构建回溯响应数据
    const playbackData = {
      id: studyRecord.id,
      courseId: studyRecord.courseId,
      chapterId: studyRecord.chapterId,
      title: studyRecord.title,
      audioUrl: studyRecord.audioUrl,
      duration: studyRecord.duration,
      notes: studyRecord.notes,
      timeMarks: studyRecord.timeMarks,
      course: {
        id: studyRecord.course.id,
        name: studyRecord.course.name
      },
      chapter: {
        id: studyRecord.chapter.id,
        name: studyRecord.chapter.name
      }
    }

    res.json({
      success: true,
      data: playbackData
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error fetching playback data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch playback data'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/study-records/:id/timeline - 获取时间轴数据 (Task-2.1.2) ====================

router.get('/:id/timeline', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 获取所有时间标记
    const timeMarks = await prisma.timeMark.findMany({
      where: { studyRecordId: id },
      orderBy: { timestamp: 'asc' },
      include: {
        knowledgePoint: {
          select: { id: true, name: true }
        }
      }
    })

    // 分类时间标记
    const timelineData = {
      timeMarks: timeMarks,
      emphasisPoints: timeMarks.filter(tm => tm.type === 'EMPHASIS'),
      boardChanges: timeMarks.filter(tm => tm.type === 'BOARD_CHANGE'),
      notes: timeMarks.filter(tm => tm.type === 'NOTE' || tm.type === 'START' || tm.type === 'END' || tm.type === 'QUESTION')
    }

    res.json({
      success: true,
      data: timelineData
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error fetching timeline data:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch timeline data'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/study-records/:id/notes - 获取笔记时间索引 (Task-2.1.3) ====================

router.get('/:id/notes', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 获取包含笔记内容的时间标记
    const noteTimeMarks = await prisma.timeMark.findMany({
      where: {
        studyRecordId: id,
        content: {
          not: null
        }
      },
      orderBy: { timestamp: 'asc' },
      include: {
        knowledgePoint: {
          select: { id: true, name: true }
        }
      }
    })

    // 构建笔记时间索引
    const noteTimeline = noteTimeMarks.map(tm => ({
      timestamp: tm.timestamp,
      content: tm.content || '',
      knowledgePoint: tm.knowledgePoint ? {
        id: tm.knowledgePoint.id,
        name: tm.knowledgePoint.name
      } : undefined
    }))

    res.json({
      success: true,
      data: noteTimeline
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error fetching note timeline:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch note timeline'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/study-records/:id/emphasis-points - 获取重点标记点 (Task-2.1.4) ====================

router.get('/:id/emphasis-points', [
  param('id').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 获取所有重点标记
    const emphasisPoints = await prisma.timeMark.findMany({
      where: {
        studyRecordId: id,
        type: 'EMPHASIS'
      },
      orderBy: { timestamp: 'asc' },
      include: {
        knowledgePoint: {
          select: { id: true, name: true }
        }
      }
    })

    res.json({
      success: true,
      data: emphasisPoints
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error fetching emphasis points:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch emphasis points'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/study-records/:id/notes-with-timestamp - 添加带时间戳的笔记 (Task-2.2.1) ====================

interface CreateNoteWithTimestampRequest {
  timestamp: number    // 毫秒时间戳
  content: string      // 笔记内容
  knowledgePointId?: string  // 可选，关联的知识点ID
}

router.post('/:id/notes-with-timestamp', [
  param('id').isUUID(),
  body('timestamp').isInt({ min: 0 }),
  body('content').isString().notEmpty(),
  body('knowledgePointId').optional().isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { timestamp, content, knowledgePointId } = req.body as CreateNoteWithTimestampRequest

    // 验证学习记录是否存在
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 如果提供了知识点ID，验证知识点是否存在
    if (knowledgePointId) {
      const knowledgePoint = await prisma.knowledgePoint.findUnique({
        where: { id: knowledgePointId }
      })

      if (!knowledgePoint) {
        return res.status(404).json({
          success: false,
          error: 'Knowledge point not found'
        } as ApiResponse<undefined>)
      }
    }

    // 创建带时间戳的笔记（创建 NOTE 类型的 TimeMark）
    const noteTimeMark = await prisma.timeMark.create({
      data: {
        studyRecordId: id,
        knowledgePointId: knowledgePointId || null,
        type: 'NOTE',
        timestamp,
        content
      },
      include: {
        knowledgePoint: {
          select: { id: true, name: true }
        }
      }
    })

    res.status(201).json({
      success: true,
      data: noteTimeMark
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error creating note with timestamp:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create note with timestamp'
    } as ApiResponse<undefined>)
  }
})

// ==================== POST /api/study-records/:id/time-marks/batch - 批量添加时间标记 (Task-1.4.2) ====================

interface BatchTimeMark {
  type: string  // START | END | EMPHASIS | BOARD_CHANGE | NOTE | QUESTION
  timestamp: number  // 毫秒时间戳
  knowledgePointId?: string
  pptPage?: number
  content?: string
  imageUrl?: string
}

router.post('/:id/time-marks/batch', [
  param('id').isUUID(),
  body('timeMarks').isArray({ min: 1, max: 100 }),
  body('timeMarks.*.type').isIn(['START', 'END', 'EMPHASIS', 'BOARD_CHANGE', 'NOTE', 'QUESTION']),
  body('timeMarks.*.timestamp').isInt({ min: 0 }),
  body('timeMarks.*.knowledgePointId').optional().isUUID(),
  body('timeMarks.*.pptPage').optional().isInt({ min: 1 }),
  body('timeMarks.*.content').optional().isString(),
  body('timeMarks.*.imageUrl').optional().isString(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { timeMarks } = req.body as { timeMarks: BatchTimeMark[] }

    // 验证学习记录是否存在
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 验证所有关联的知识点是否存在（如果提供了）
    const knowledgePointIds = timeMarks
      .filter(tm => tm.knowledgePointId)
      .map(tm => tm.knowledgePointId as string)

    if (knowledgePointIds.length > 0) {
      const existingKnowledgePoints = await prisma.knowledgePoint.findMany({
        where: { id: { in: knowledgePointIds } },
        select: { id: true }
      })

      if (existingKnowledgePoints.length !== knowledgePointIds.length) {
        return res.status(404).json({
          success: false,
          error: 'Some knowledge points not found'
        } as ApiResponse<undefined>)
      }
    }

    // 构建批量创建数据
    const timeMarksData = timeMarks.map(tm => ({
      studyRecordId: id,
      knowledgePointId: tm.knowledgePointId || null,
      type: tm.type,
      timestamp: tm.timestamp,
      pptPage: tm.pptPage || null,
      content: tm.content || null,
      imageUrl: tm.imageUrl || null
    }))

    // 批量创建时间标记
    const createdMarks = await prisma.timeMark.createMany({
      data: timeMarksData
    })

    res.status(201).json({
      success: true,
      data: {
        count: createdMarks.count,
        studyRecordId: id
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error batch creating time marks:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to batch create time marks'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/study-records/:id/related-marks - 获取相关时间标记 (Task-2.3.2) ====================

router.get('/:id/related-marks', [
  param('id').isUUID(),
  query('range').optional().isInt({ min: 1, max: 600 }),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const range = parseInt(req.query.range as string) || 30 // 默认30秒范围

    // 验证学习记录是否存在
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id },
      include: {
        timeMarks: {
          orderBy: { timestamp: 'asc' }
        }
      }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: 'Study record not found'
      } as ApiResponse<undefined>)
    }

    // 为每个时间标记查找相关标记
    const relatedMarks = studyRecord.timeMarks.map(mark => {
      const related = studyRecord.timeMarks.filter(tm => {
        if (tm.id === mark.id) return false
        const timeDiff = Math.abs(tm.timestamp - mark.timestamp)
        return timeDiff <= range * 1000 // 转换为毫秒
      })
      return {
        mark,
        relatedMarks: related.map(tm => ({
          id: tm.id,
          type: tm.type,
          timestamp: tm.timestamp,
          content: tm.content,
          distance: Math.abs(tm.timestamp - mark.timestamp)
        }))
      }
    })

    res.json({
      success: true,
      data: {
        range: range,
        results: relatedMarks
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error fetching related marks:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch related marks'
    } as ApiResponse<undefined>)
  }
})

export default router
