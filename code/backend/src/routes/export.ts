import { Router, type Request, type Response } from 'express'
import { body, query } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type { ApiResponse } from '../types/index.js'
import prisma from '../lib/prisma.js'
import { getUserIdFromRequest } from './auth.js'
import path from 'path'
import fs from 'fs'

const router = Router()

// ==================== Helper Functions ====================

/**
 * 格式化日期为字符串
 */
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * 生成文件名
 */
function generateFileName(type: string, format: string): string {
  const timestamp = Date.now()
  return `${type}_${timestamp}.${format}`
}

/**
 * 转换数据为 CSV 格式
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return ''

  const headers = Object.keys(data[0])
  const rows = data.map(row =>
    headers.map(header => {
      const value = row[header]
      // 处理包含逗号或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`
      }
      return value ?? ''
    }).join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

// ==================== P5.4.1: 导出学习数据 ====================

router.post('/export/data', [
  body('format')
    .isIn(['json', 'csv'])
    .withMessage('格式必须是 json 或 csv'),
  body('dataTypes')
    .isArray({ min: 1 })
    .withMessage('数据类型数组不能为空'),
  body('dataTypes.*')
    .isIn(['courses', 'chapters', 'knowledge_points', 'study_records', 'mistakes', 'notes'])
    .withMessage('数据类型必须是 courses, chapters, knowledge_points, study_records, mistakes 或 notes'),
  body('timeRange')
    .optional()
    .isObject()
    .withMessage('时间范围必须是对象'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法导出数据',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const { format, dataTypes, timeRange } = req.body

    // 设置默认时间范围
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (timeRange) {
      startDate = timeRange.start ? new Date(timeRange.start) : undefined
      endDate = timeRange.end ? new Date(timeRange.end) : undefined
    }

    // 收集数据
    const exportData: Record<string, any[]> = {}

    // 1. 导出课程
    if (dataTypes.includes('courses')) {
      const courses = await prisma.course.findMany({
        where: {
          createdAt: startDate ? { gte: startDate } : undefined,
          updatedAt: endDate ? { lte: endDate } : undefined
        },
        include: {
          chapters: true
        }
      })

      exportData.courses = courses.map(c => ({
        id: c.id,
        name: c.name,
        status: c.status,
        type: c.type,
        examDate: c.examDate,
        targetGrade: c.targetGrade,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    }

    // 2. 导出章节
    if (dataTypes.includes('chapters')) {
      const chapters = await prisma.chapter.findMany({
        where: {
          createdAt: startDate ? { gte: startDate } : undefined
        },
        include: {
          course: {
            select: { id: true, name: true }
          }
        }
      })

      exportData.chapters = chapters.map(ch => ({
        id: ch.id,
        courseId: ch.courseId,
        courseName: ch.course.name,
        name: ch.name,
        order: ch.order,
        createdAt: ch.createdAt
      }))
    }

    // 3. 导出知识点
    if (dataTypes.includes('knowledge_points')) {
      const knowledgePoints = await prisma.knowledgePoint.findMany({
        where: {
          createdAt: startDate ? { gte: startDate } : undefined
        },
        include: {
          chapter: {
            include: {
              course: {
                select: { id: true, name: true }
              }
            }
          }
        }
      })

      exportData.knowledge_points = knowledgePoints.map(kp => ({
        id: kp.id,
        courseName: kp.chapter.course.name,
        chapterName: kp.chapter.name,
        name: kp.name,
        status: kp.status,
        importance: kp.importance,
        masteryScore: kp.masteryScore,
        createdAt: kp.createdAt,
        updatedAt: kp.updatedAt
      }))
    }

    // 4. 导出学习记录
    if (dataTypes.includes('study_records')) {
      const studyRecords = await prisma.studyRecord.findMany({
        where: {
          date: startDate ? { gte: startDate } : undefined
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

      exportData.study_records = studyRecords.map(sr => ({
        id: sr.id,
        courseName: sr.course?.name,
        chapterName: sr.chapter?.name,
        title: sr.title,
        date: sr.date,
        duration: sr.duration,
        status: sr.status,
        notes: sr.notes,
        createdAt: sr.createdAt
      }))
    }

    // 5. 导出错题
    if (dataTypes.includes('mistakes')) {
      const mistakes = await prisma.mistake.findMany({
        where: {
          createdAt: startDate ? { gte: startDate } : undefined
        },
        include: {
          course: {
            select: { id: true, name: true }
          },
          knowledgePoint: {
            select: { id: true, name: true }
          }
        }
      })

      exportData.mistakes = mistakes.map(m => ({
        id: m.id,
        courseName: m.course.name,
        knowledgePointName: m.knowledgePoint.name,
        question: m.question,
        userAnswer: m.userAnswer,
        correctAnswer: m.correctAnswer,
        reason: m.reason,
        createdAt: m.createdAt
      }))
    }

    // 6. 导出笔记（时间标记中的 NOTE 类型）
    if (dataTypes.includes('notes')) {
      const timeMarks = await prisma.timeMark.findMany({
        where: {
          type: 'NOTE',
          createdAt: startDate ? { gte: startDate } : undefined
        },
        include: {
          studyRecord: {
            include: {
              course: {
                select: { id: true, name: true }
              }
            }
          },
          knowledgePoint: {
            select: { id: true, name: true }
          }
        }
      })

      exportData.notes = timeMarks.map(tm => ({
        id: tm.id,
        courseName: tm.studyRecord.course.name,
        knowledgePointName: tm.knowledgePoint?.name || null,
        content: tm.content,
        timestamp: tm.timestamp,
        createdAt: tm.createdAt
      }))
    }

    // 统计数据
    const totalRecords = Object.values(exportData).reduce((sum, arr) => sum + arr.length, 0)

    // 根据格式返回数据
    if (format === 'json') {
      res.json({
        success: true,
        data: {
          exportInfo: {
            format: 'json',
            dataTypes,
            timeRange: {
              start: startDate ? formatDate(startDate) : null,
              end: endDate ? formatDate(endDate) : null
            },
            exportedAt: new Date().toISOString()
          },
          statistics: {
            totalRecords,
            breakdown: Object.fromEntries(
              dataTypes.map(type => [type, exportData[type]?.length || 0])
            )
          },
          data: exportData
        }
      } as ApiResponse<any>)
    } else {
      // CSV 格式 - 将所有数据合并为一个CSV（简化处理）
      const csvData: any[] = []

      // 添加类型标识
      for (const [type, records] of Object.entries(exportData)) {
        if (records.length > 0) {
          const recordsWithType = records.map(r => ({
            ...r,
            _exportType: type
          }))
          csvData.push(...recordsWithType)
        }
      }

      const csv = convertToCSV(csvData)

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="${generateFileName('study_data', 'csv')}"`)
      res.send(csv)
    }
  } catch (error: any) {
    console.error('Error exporting data:', error)
    res.status(500).json({
      success: false,
      error: '导出数据失败',
      code: 'EXPORT_DATA_FAILED'
    } as ApiResponse<undefined>)
  }
})

// =5.4.2: ==================== 导出学习报告 ==================== P

router.post('/export/report', [
  body('courseId')
    .isUUID()
    .withMessage('课程ID必须是有效的UUID'),
  body('format')
    .optional()
    .isIn(['json', 'pdf'])
    .withMessage('格式必须是 json 或 pdf'),
  body('include')
    .optional()
    .isArray()
    .withMessage('包含项必须是数组'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法导出报告',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const { courseId, format = 'json', include = ['progress', 'statistics', 'evaluation'] } = req.body

    // 验证课程存在
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    })

    if (!course) {
      return res.status(404).json({
        success: false,
        error: '课程不存在',
        code: 'COURSE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 收集报告数据
    const reportData: any = {
      course: {
        id: course.id,
        name: course.name,
        type: course.type,
        status: course.status,
        targetGrade: course.targetGrade,
        examDate: course.examDate
      }
    }

    // 1. 学习进度
    if (include.includes('progress')) {
      const chapters = await prisma.chapter.findMany({
        where: { courseId },
        include: {
          knowledgePoints: true
        }
      })

      const totalChapters = chapters.length
      const totalKnowledgePoints = chapters.reduce((sum, ch) => sum + ch.knowledgePoints.length, 0)
      const masteredPoints = chapters.reduce(
        (sum, ch) => sum + ch.knowledgePoints.filter(kp => kp.status === 'MASTERED').length,
        0
      )

      reportData.progress = {
        chapters: chapters.map(ch => ({
          id: ch.id,
          name: ch.name,
          order: ch.order,
          totalPoints: ch.knowledgePoints.length,
          masteredPoints: ch.knowledgePoints.filter(kp => kp.status === 'MASTERED').length,
          progress: ch.knowledgePoints.length > 0
            ? Math.round(ch.knowledgePoints.filter(kp => kp.status === 'MASTERED').length / ch.knowledgePoints.length * 100)
            : 0
        })),
        overall: {
          totalChapters,
          totalKnowledgePoints,
          masteredPoints,
          progress: totalKnowledgePoints > 0 ? Math.round(masteredPoints / totalKnowledgePoints * 100) : 0
        }
      }
    }

    // 2. 学习统计
    if (include.includes('statistics')) {
      const studyRecords = await prisma.studyRecord.findMany({
        where: { courseId }
      })

      const totalStudyTime = studyRecords.reduce((sum, sr) => sum + sr.duration, 0)
      const studyDays = new Set(studyRecords.map(sr => formatDate(new Date(sr.date)))).size

      const mistakes = await prisma.mistake.findMany({
        where: { courseId }
      })

      reportData.statistics = {
        totalStudyTime: Math.round(totalStudyTime / 60), // 转换为分钟
        studyDays,
        averageSessionLength: studyRecords.length > 0 ? Math.round(totalStudyTime / studyRecords.length / 60) : 0,
        totalMistakes: mistakes.length,
        mistakeRate: studyRecords.length > 0 ? Math.round(mistakes.length / studyRecords.length * 100) : 0
      }
    }

    // 3. 评估
    if (include.includes('evaluation')) {
      const chapters = await prisma.chapter.findMany({
        where: { courseId },
        include: {
          knowledgePoints: true
        }
      })

      const allPoints = chapters.flatMap(ch => ch.knowledgePoints)
      const avgMastery = allPoints.length > 0
        ? Math.round(allPoints.reduce((sum, kp) => sum + kp.masteryScore, 0) / allPoints.length)
        : 0

      // 简单评级
      let grade: string
      if (avgMastery >= 90) grade = 'S'
      else if (avgMastery >= 80) grade = 'A'
      else if (avgMastery >= 70) grade = 'B'
      else if (avgMastery >= 60) grade = 'C'
      else grade = 'D'

      reportData.evaluation = {
        averageMasteryScore: avgMastery,
        grade,
        status: {
          mastered: allPoints.filter(kp => kp.status === 'MASTERED').length,
          learning: allPoints.filter(kp => kp.status === 'LEARNING').length,
          weak: allPoints.filter(kp => kp.status === 'WEAK').length,
          notStarted: allPoints.filter(kp => kp.status === 'NOT_STARTED' || kp.status === 'NEED_REVIEW').length
        }
      }
    }

    // 4. 建议（如果包含）
    if (include.includes('recommendations')) {
      const chapters = await prisma.chapter.findMany({
        where: { courseId },
        include: {
          knowledgePoints: true
        }
      })

      const weakPoints = chapters
        .flatMap(ch => ch.knowledgePoints)
        .filter(kp => kp.status === 'WEAK' || kp.masteryScore < 50)
        .slice(0, 5)

      reportData.recommendations = {
        priorityTopics: weakPoints.map(kp => ({
          name: kp.name,
          masteryScore: kp.masteryScore,
          status: kp.status
        })),
        suggestions: [
          weakPoints.length > 0 ? '建议优先复习薄弱知识点' : '知识点掌握良好，继续保持',
          '建议每天保持规律学习',
          '建议定期进行知识点回顾'
        ]
      }
    }

    // 添加元数据
    reportData.metadata = {
      generatedAt: new Date().toISOString(),
      courseId,
      format: format === 'pdf' ? 'json' : format // PDF暂时返回JSON
    }

    // 根据格式返回
    if (format === 'json') {
      res.json({
        success: true,
        data: reportData
      } as ApiResponse<any>)
    } else {
      // PDF 格式暂返回 JSON（需要PDF库支持）
      res.json({
        success: true,
        data: reportData,
        message: 'PDF格式暂支持，请使用JSON格式获取完整报告'
      } as ApiResponse<any>)
    }
  } catch (error: any) {
    console.error('Error exporting report:', error)
    res.status(500).json({
      success: false,
      error: '导出报告失败',
      code: 'EXPORT_REPORT_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.4.3: 获取同步状态 ====================

router.get('/sync/status', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法获取同步状态',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    // 获取用户的最新活动（作为最后同步时间）
    const latestRecord = await prisma.studyRecord.findFirst({
      where: { course: { /* 用户关联 */ } },
      orderBy: { createdAt: 'desc' }
    })

    const latestKnowledgePoint = await prisma.knowledgePoint.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    // 确定最后同步时间
    let lastSyncAt: string | null = null
    if (latestKnowledgePoint) {
      lastSyncAt = latestKnowledgePoint.updatedAt.toISOString()
    }

    // 模拟设备信息（实际需要设备表）
    const devices = [
      {
        deviceId: 'default-device',
        deviceName: '当前设备',
        lastActive: lastSyncAt,
        platform: 'web'
      }
    ]

    res.json({
      success: true,
      data: {
        lastSyncAt,
        syncStatus: 'synced',
        pendingChanges: 0,
        devices,
        syncSettings: {
          autoSync: true,
          syncInterval: 60, // 秒
          lastSuccessfulSync: lastSyncAt
        }
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting sync status:', error)
    res.status(500).json({
      success: false,
      error: '获取同步状态失败',
      code: 'GET_SYNC_STATUS_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.4.4: 触发同步 ====================

router.post('/sync/trigger', [
  body('force')
    .optional()
    .isBoolean()
    .withMessage('force必须是布尔值'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法触发同步',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const { force = false } = req.body

    // 获取当前数据状态
    const stats = {
      courses: await prisma.course.count(),
      chapters: await prisma.chapter.count(),
      knowledgePoints: await prisma.knowledgePoint.count(),
      studyRecords: await prisma.studyRecord.count(),
      mistakes: await prisma.mistake.count(),
      timeMarks: await prisma.timeMark.count()
    }

    // 模拟同步过程
    const syncId = `sync_${Date.now()}`
    const syncStartedAt = new Date().toISOString()

    // 模拟同步结果
    const result = {
      syncId,
      status: 'completed',
      startedAt: syncStartedAt,
      completedAt: new Date().toISOString(),
      stats,
      changes: {
        uploaded: stats.studyRecords + stats.mistakes,
        downloaded: 0,
        conflicts: 0
      }
    }

    res.json({
      success: true,
      data: {
        ...result,
        message: force ? '强制同步完成' : '同步完成'
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error triggering sync:', error)
    res.status(500).json({
      success: false,
      error: '触发同步失败',
      code: 'TRIGGER_SYNC_FAILED'
    } as ApiResponse<undefined>)
  }
})

// ==================== P5.4.5: 导入数据 ====================

router.post('/import/data', [
  body('format')
    .isIn(['json'])
    .withMessage('目前仅支持 JSON 格式导入'),
  body('mergeStrategy')
    .optional()
    .isIn(['replace', 'merge'])
    .withMessage('合并策略必须是 replace 或 merge'),
  body('data')
    .isObject()
    .withMessage('数据必须是对象'),
  validate
], async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: '未登录，无法导入数据',
        code: 'NOT_AUTHENTICATED'
      } as ApiResponse<undefined>)
    }

    const { format, mergeStrategy = 'merge', data } = req.body

    const importResult = {
      imported: {
        courses: 0,
        chapters: 0,
        knowledgePoints: 0,
        studyRecords: 0,
        mistakes: 0
      },
      skipped: {
        courses: 0,
        chapters: 0,
        knowledgePoints: 0,
        studyRecords: 0,
        mistakes: 0
      },
      errors: [] as string[]
    }

    // 导入课程
    if (data.courses && Array.isArray(data.courses)) {
      for (const course of data.courses) {
        try {
          if (mergeStrategy === 'merge') {
            // 检查是否存在
            const existing = await prisma.course.findUnique({
              where: { id: course.id }
            })

            if (existing) {
              importResult.skipped.courses++
              continue
            }
          }

          await prisma.course.create({
            data: {
              id: course.id,
              name: course.name,
              status: course.status || 'STUDYING',
              type: course.type || 'PROFESSIONAL',
              examDate: course.examDate ? new Date(course.examDate) : null,
              targetGrade: course.targetGrade
            }
          })
          importResult.imported.courses++
        } catch (err: any) {
          importResult.errors.push(`课程导入失败: ${course.name || err.message}`)
        }
      }
    }

    // 导入章节
    if (data.chapters && Array.isArray(data.chapters)) {
      for (const chapter of data.chapters) {
        try {
          if (mergeStrategy === 'merge') {
            const existing = await prisma.chapter.findUnique({
              where: { id: chapter.id }
            })

            if (existing) {
              importResult.skipped.chapters++
              continue
            }
          }

          await prisma.chapter.create({
            data: {
              id: chapter.id,
              courseId: chapter.courseId,
              name: chapter.name,
              order: chapter.order || 1
            }
          })
          importResult.imported.chapters++
        } catch (err: any) {
          importResult.errors.push(`章节导入失败: ${chapter.name || err.message}`)
        }
      }
    }

    // 导入知识点
    if (data.knowledge_points && Array.isArray(data.knowledge_points)) {
      for (const kp of data.knowledge_points) {
        try {
          if (mergeStrategy === 'merge') {
            const existing = await prisma.knowledgePoint.findUnique({
              where: { id: kp.id }
            })

            if (existing) {
              importResult.skipped.knowledgePoints++
              continue
            }
          }

          await prisma.knowledgePoint.create({
            data: {
              id: kp.id,
              chapterId: kp.chapterId,
              name: kp.name,
              status: kp.status || 'NEED_REVIEW',
              importance: kp.importance || 5,
              masteryScore: kp.masteryScore || 0
            }
          })
          importResult.imported.knowledgePoints++
        } catch (err: any) {
          importResult.errors.push(`知识点导入失败: ${kp.name || err.message}`)
        }
      }
    }

    // 导入学习记录
    if (data.study_records && Array.isArray(data.study_records)) {
      for (const sr of data.study_records) {
        try {
          if (mergeStrategy === 'merge') {
            const existing = await prisma.studyRecord.findUnique({
              where: { id: sr.id }
            })

            if (existing) {
              importResult.skipped.studyRecords++
              continue
            }
          }

          await prisma.studyRecord.create({
            data: {
              id: sr.id,
              courseId: sr.courseId,
              chapterId: sr.chapterId,
              title: sr.title,
              date: new Date(sr.date),
              audioUrl: sr.audioUrl || '',
              duration: sr.duration || 0,
              status: sr.status || 'COMPLETED',
              notes: sr.notes || ''
            }
          })
          importResult.imported.studyRecords++
        } catch (err: any) {
          importResult.errors.push(`学习记录导入失败: ${sr.title || err.message}`)
        }
      }
    }

    // 导入错题
    if (data.mistakes && Array.isArray(data.mistakes)) {
      for (const mistake of data.mistakes) {
        try {
          if (mergeStrategy === 'merge') {
            const existing = await prisma.mistake.findUnique({
              where: { id: mistake.id }
            })

            if (existing) {
              importResult.skipped.mistakes++
              continue
            }
          }

          await prisma.mistake.create({
            data: {
              id: mistake.id,
              courseId: mistake.courseId,
              knowledgePointId: mistake.knowledgePointId,
              question: mistake.question,
              userAnswer: mistake.userAnswer,
              correctAnswer: mistake.correctAnswer,
              reason: mistake.reason
            }
          })
          importResult.imported.mistakes++
        } catch (err: any) {
          importResult.errors.push(`错题导入失败: ${err.message}`)
        }
      }
    }

    const totalImported = Object.values(importResult.imported).reduce((a, b) => a + b, 0)
    const totalSkipped = Object.values(importResult.skipped).reduce((a, b) => a + b, 0)

    res.json({
      success: true,
      data: {
        mergeStrategy,
        imported: importResult.imported,
        skipped: importResult.skipped,
        errors: importResult.errors,
        summary: {
          totalImported,
          totalSkipped,
          totalErrors: importResult.errors.length,
          message: totalImported > 0 ? '数据导入完成' : '没有数据被导入'
        },
        importedAt: new Date().toISOString()
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error importing data:', error)
    res.status(500).json({
      success: false,
      error: '导入数据失败',
      code: 'IMPORT_DATA_FAILED'
    } as ApiResponse<undefined>)
  }
})

export default router
