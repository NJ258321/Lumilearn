import { Router, type Request, type Response } from 'express'
import { body, param } from 'express-validator'
import { validate } from '../middleware/validator.js'
import type { ApiResponse } from '../types/index.js'
import prisma from '../lib/prisma.js'

const router = Router()

// ==================== POST /api/time-marks/:id/link-knowledge-point - 关联时间标记与知识点 (Task-2.2.3) ====================

router.post('/:id/link-knowledge-point', [
  param('id').isUUID(),
  body('knowledgePointId').isUUID(),
  validate
], async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { knowledgePointId } = req.body

    // 验证时间标记是否存在
    const timeMark = await prisma.timeMark.findUnique({
      where: { id }
    })

    if (!timeMark) {
      return res.status(404).json({
        success: false,
        error: 'Time mark not found'
      } as ApiResponse<undefined>)
    }

    // 验证知识点是否存在
    const knowledgePoint = await prisma.knowledgePoint.findUnique({
      where: { id: knowledgePointId }
    })

    if (!knowledgePoint) {
      return res.status(404).json({
        success: false,
        error: 'Knowledge point not found'
      } as ApiResponse<undefined>)
    }

    // 关联时间标记与知识点
    const updatedTimeMark = await prisma.timeMark.update({
      where: { id },
      data: { knowledgePointId },
      include: {
        knowledgePoint: {
          select: { id: true, name: true }
        },
        studyRecord: {
          select: { id: true, title: true }
        }
      }
    })

    res.json({
      success: true,
      data: updatedTimeMark
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error linking knowledge point:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to link knowledge point'
    } as ApiResponse<undefined>)
  }
})

export default router
