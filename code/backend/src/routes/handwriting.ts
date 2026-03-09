/**
 * 手写笔迹回放API
 * 提供笔迹数据查询、笔画解析、时间轴同步等功能
 */

import { Router, type Request, type Response } from 'express'
import { body, param, query } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type { ApiResponse } from '../types/index.js'
import prisma from '../lib/prisma.js'

const router = Router()

// ==================== 类型定义 ====================

/** 笔迹笔画数据 */
interface StrokePoint {
  x: number
  y: number
  pressure?: number
  timestamp: number
}

/** 笔迹数据 */
interface HandwritingData {
  id: string
  timestamp: number
  imageUrl: string
  strokes?: StrokePoint[]
  color?: string
  thickness?: number
}

// ==================== GET /api/handwriting/:recordId - 获取学习记录的所有笔迹 ====================

/**
 * 获取学习记录的所有笔迹数据（用于时光机回放）
 * 返回按时间排序的笔迹数组，支持与音频同步播放
 */
router.get('/:recordId', [
  param('recordId').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params
    const { includeStrokes, startTime, endTime } = req.query

    // 构建查询条件
    const whereClause: any = {
      studyRecordId: recordId,
      imageUrl: {
        not: null
      }
    }

    // 时间范围筛选
    if (startTime || endTime) {
      whereClause.timestamp = {}
      if (startTime) {
        whereClause.timestamp.gte = parseInt(startTime as string)
      }
      if (endTime) {
        whereClause.timestamp.lte = parseInt(endTime as string)
      }
    }

    // 获取所有带图片的TimeMark
    const timeMarks = await prisma.timeMark.findMany({
      where: whereClause,
      orderBy: { timestamp: 'asc' },
      include: {
        knowledgePoint: {
          select: { id: true, name: true, status: true }
        }
      }
    })

    // 转换为笔迹数据格式
    const handwritingData = timeMarks.map(tm => ({
      id: tm.id,
      timestamp: tm.timestamp,
      type: tm.type,
      imageUrl: tm.imageUrl,
      pptPage: tm.pptPage,
      content: tm.content,
      knowledgePoint: tm.knowledgePoint ? {
        id: tm.knowledgePoint.id,
        name: tm.knowledgePoint.name,
        status: tm.knowledgePoint.status
      } : null,
      // 如果需要笔画数据，可以在这里扩展
      // 目前先返回基础数据
      meta: {
        createdAt: tm.createdAt,
        hasImage: !!tm.imageUrl
      }
    }))

    // 统计信息
    const statistics = {
      totalCount: handwritingData.length,
      byType: {
        EMPHASIS: timeMarks.filter(tm => tm.type === 'EMPHASIS').length,
        BOARD_CHANGE: timeMarks.filter(tm => tm.type === 'BOARD_CHANGE').length,
        NOTE: timeMarks.filter(tm => tm.type === 'NOTE').length,
        QUESTION: timeMarks.filter(tm => tm.type === 'QUESTION').length
      },
      timeRange: {
        start: handwritingData.length > 0 ? handwritingData[0].timestamp : 0,
        end: handwritingData.length > 0 ? handwritingData[handwritingData.length - 1].timestamp : 0
      }
    }

    res.json({
      success: true,
      data: {
        items: handwritingData,
        statistics
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error fetching handwriting data:', error)
    res.status(500).json({
      success: false,
      error: '获取笔迹数据失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/handwriting/:recordId/strokes/:markId - 获取特定笔迹的详细数据 ====================

/**
 * 获取特定时间标记的详细笔迹数据
 * 可以包含笔画路径、颜色、厚度等信息
 */
router.get('/:recordId/strokes/:markId', [
  param('recordId').isUUID(),
  param('markId').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { recordId, markId } = req.params

    // 获取特定的时间标记
    const timeMark = await prisma.timeMark.findFirst({
      where: {
        id: markId,
        studyRecordId: recordId
      },
      include: {
        knowledgePoint: true,
        studyRecord: {
          select: {
            id: true,
            title: true,
            duration: true
          }
        }
      }
    })

    if (!timeMark) {
      return res.status(404).json({
        success: false,
        error: '未找到笔迹记录'
      } as ApiResponse<undefined>)
    }

    // 构建详细的笔迹数据
    const strokeData = {
      id: timeMark.id,
      timestamp: timeMark.timestamp,
      type: timeMark.type,
      imageUrl: timeMark.imageUrl,
      pptPage: timeMark.pptPage,
      content: timeMark.content,
      knowledgePoint: timeMark.knowledgePoint ? {
        id: timeMark.knowledgePoint.id,
        name: timeMark.knowledgePoint.name,
        status: timeMark.knowledgePoint.status
      } : null,
      // 扩展字段 - 可以存储笔画路径数据
      // 前端Canvas绘制时可以使用这些数据
      strokeData: {
        // 颜色 - 可以根据知识点状态动态变化
        color: getStrokeColor(timeMark.type),
        // 线条厚度
        thickness: getStrokeThickness(timeMark.type),
        // 动画持续时间（毫秒）
        animationDuration: 500,
        // 是否显示高亮
        highlight: timeMark.type === 'EMPHASIS'
      },
      // 关联的学习记录信息
      studyRecord: timeMark.studyRecord,
      // 相邻笔迹（用于连续播放）
      context: {
        prevTimestamp: null,
        nextTimestamp: null
      }
    }

    // 获取前后相邻的笔迹时间戳
    const adjacentMarks = await prisma.timeMark.findMany({
      where: {
        studyRecordId: recordId,
        imageUrl: { not: null },
        id: { not: markId }
      },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true }
    })

    const currentIndex = adjacentMarks.findIndex(m => m.timestamp === timeMark.timestamp)
    if (currentIndex > 0) {
      strokeData.context.prevTimestamp = adjacentMarks[currentIndex - 1].timestamp
    }
    if (currentIndex < adjacentMarks.length - 1) {
      strokeData.context.nextTimestamp = adjacentMarks[currentIndex + 1].timestamp
    }

    res.json({
      success: true,
      data: strokeData
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error fetching stroke detail:', error)
    res.status(500).json({
      success: false,
      error: '获取笔迹详情失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/handwriting/:recordId/sync - 获取同步数据（用于时光机） ====================

/**
 * 获取完整的同步数据 - 用于时光机播放器
 * 包含：音频时间轴、PPT切换点、笔迹出现点、知识点讲解点
 */
router.get('/:recordId/sync', [
  param('recordId').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params

    // 获取学习记录
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id: recordId },
      include: {
        course: { select: { id: true, name: true } },
        chapter: { select: { id: true, name: true } }
      }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: '学习记录不存在'
      } as ApiResponse<undefined>)
    }

    // 获取所有时间标记
    const timeMarks = await prisma.timeMark.findMany({
      where: { studyRecordId: recordId },
      orderBy: { timestamp: 'asc' },
      include: {
        knowledgePoint: {
          select: { id: true, name: true, status: true, masteryScore: true }
        }
      }
    })

    // 构建同步数据
    const syncData = {
      // 基本信息
      studyRecord: {
        id: studyRecord.id,
        title: studyRecord.title,
        duration: studyRecord.duration,
        audioUrl: studyRecord.audioUrl,
        course: studyRecord.course,
        chapter: studyRecord.chapter
      },
      // 时间轴事件
      timeline: {
        // 笔迹出现点（按时间排序）
        handwritingPoints: timeMarks
          .filter(tm => tm.imageUrl)
          .map(tm => ({
            timestamp: tm.timestamp,
            type: tm.type,
            imageUrl: tm.imageUrl,
            pptPage: tm.pptPage,
            knowledgePoint: tm.knowledgePoint
          })),
        // PPT切换点
        pptChanges: timeMarks
          .filter(tm => tm.pptPage !== null)
          .map(tm => ({
            timestamp: tm.timestamp,
            pptPage: tm.pptPage
          })),
        // 知识点讲解点
        knowledgePoints: timeMarks
          .filter(tm => tm.knowledgePointId !== null)
          .map(tm => ({
            timestamp: tm.timestamp,
            knowledgePoint: tm.knowledgePoint
          })),
        // 重点标记点
        emphasisPoints: timeMarks
          .filter(tm => tm.type === 'EMPHASIS')
          .map(tm => ({
            timestamp: tm.timestamp,
            content: tm.content,
            imageUrl: tm.imageUrl
          })),
        // 笔记点
        notePoints: timeMarks
          .filter(tm => tm.type === 'NOTE' && tm.content)
          .map(tm => ({
            timestamp: tm.timestamp,
            content: tm.content
          }))
      },
      // 统计信息
      statistics: {
        totalHandwriting: timeMarks.filter(tm => tm.imageUrl).length,
        totalPptChanges: new Set(timeMarks.filter(tm => tm.pptPage).map(tm => tm.pptPage)).size,
        totalKnowledgePoints: new Set(timeMarks.filter(tm => tm.knowledgePointId).map(tm => tm.knowledgePointId)).size,
        totalEmphasis: timeMarks.filter(tm => tm.type === 'EMPHASIS').length
      }
    }

    res.json({
      success: true,
      data: syncData
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error fetching sync data:', error)
    res.status(500).json({
      success: false,
      error: '获取同步数据失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== GET /api/handwriting/:recordId/playback - 获取回放数据 ====================

/**
 * 获取完整的回放数据
 * 用于时光机播放器的完整数据源
 */
router.get('/:recordId/playback', [
  param('recordId').isUUID(),
  query('format').optional().isIn(['full', 'compact']),
  validate
], async (req: Request, res: Response) => {
  try {
    const { recordId } = req.params
    const format = (req.query.format as string) || 'full'

    // 获取学习记录
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id: recordId }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: '学习记录不存在'
      } as ApiResponse<undefined>)
    }

    // 获取所有时间标记（按时间排序）
    const timeMarks = await prisma.timeMark.findMany({
      where: { studyRecordId: recordId },
      orderBy: { timestamp: 'asc' }
    })

    // 构建播放数据
    const playbackData = {
      // 音频信息
      audio: {
        url: studyRecord.audioUrl,
        duration: studyRecord.duration
      },
      // 事件列表（用于进度条标记）
      events: timeMarks.map(tm => ({
        time: tm.timestamp,
        type: tm.type,
        hasImage: !!tm.imageUrl,
        hasContent: !!tm.content,
        knowledgePointId: tm.knowledgePointId,
        pptPage: tm.pptPage
      })),
      // 笔迹事件
      handwritingEvents: timeMarks
        .filter(tm => tm.imageUrl)
        .map(tm => ({
          time: tm.timestamp,
          imageUrl: tm.imageUrl,
          type: tm.type,
          pptPage: tm.pptPage
        })),
      // PPT切换事件
      pptEvents: timeMarks
        .filter(tm => tm.pptPage !== null)
        .map(tm => ({
          time: tm.timestamp,
          page: tm.pptPage
        }))
    }

    // 根据格式返回不同详细程度的数据
    if (format === 'compact') {
      // 精简模式 - 只返回事件列表，用于进度条渲染
      return res.json({
        success: true,
        data: {
          audio: playbackData.audio,
          events: playbackData.events
        }
      } as ApiResponse<any>)
    }

    // 完整模式
    res.json({
      success: true,
      data: playbackData
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error fetching playback data:', error)
    res.status(500).json({
      success: false,
      error: '获取回放数据失败'
    } as ApiResponse<undefined>)
  }
})

// ==================== 辅助函数 ====================

/**
 * 根据类型获取笔迹颜色
 */
function getStrokeColor(type: string): string {
  const colors: Record<string, string> = {
    EMPHASIS: '#FF6B6B',    // 红色 - 重点
    BOARD_CHANGE: '#4ECDC4', // 青色 - 板书切换
    NOTE: '#45B7D1',         // 蓝色 - 笔记
    QUESTION: '#FFD93D',     // 黄色 - 提问
    START: '#6BCB77',        // 绿色 - 开始
    END: '#C4C4C4'          // 灰色 - 结束
  }
  return colors[type] || '#000000'
}

/**
 * 根据类型获取笔迹厚度
 */
function getStrokeThickness(type: string): number {
  const thicknesses: Record<string, number> = {
    EMPHASIS: 3,
    BOARD_CHANGE: 2,
    NOTE: 1,
    QUESTION: 2,
    START: 1,
    END: 1
  }
  return thicknesses[type] || 1
}

export default router
