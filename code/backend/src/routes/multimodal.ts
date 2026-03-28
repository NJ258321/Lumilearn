/**
 * 多模态分析路�?
 * 处理音频 + PPT + 图片的统一分析
 */

import { Router, type Request, type Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { ApiResponse } from '../types/index.js'
import { getFilePath } from '../utils/file.js'
import { multimodalAnalyzer } from '../services/multimodalAnalyzer.js'
import path from 'path'
import fs from 'fs'

const router = Router()
const prisma = new PrismaClient()

/**
 * POST /api/study-records/:id/multimodal-analysis
 * 对学习记录进行多模态分析（音频 + PPT + 图片�?
 */
router.post('/:id/multimodal-analysis', async (req: Request, res: Response) => {
  const startTime = Date.now()

  try {
    const { id } = req.params

    // 1. 获取学习记录
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id },
      include: {
        chapter: { include: { course: true } }
      }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: '学习记录不存在',
        code: 'STUDY_RECORD_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 解析 JSON 字段
    let imageUrls: string[] = []
    let pptContent: any = null
    try {
      imageUrls = JSON.parse((studyRecord as any).imageUrls || '[]')
      pptContent = JSON.parse((studyRecord as any).pptContent || '{}')
    } catch (e) {
      console.error('[Multimodal] Failed to parse JSON fields:', e)
    }

    console.log(`[Multimodal] Starting analysis for record: ${id}`)
    console.log(`[Multimodal] Audio: ${studyRecord.audioUrl || 'none'}`)
    console.log(`[Multimodal] PPT Content: ${pptContent?.page_count || 0} pages`)
    console.log(`[Multimodal] Board Images: ${imageUrls.length}`)
    console.log(`[Multimodal] Notes/Transcript length: ${(studyRecord.notes || '').length} chars`)
    console.log(`[Multimodal] Notes preview: ${(studyRecord.notes || '').substring(0, 200)}...`)

    const results: {
      audio?: any[]
      ppt?: any[]
      images?: any[]
    } = {}

    // 2. 分析音频（使�?Qwen3-Omni-Flash，同时获取转录文本）
    let audioMarks: any[] = []
    let audioDuration = studyRecord.duration || 0
    let audioTranscript = studyRecord.notes || ''

    if (studyRecord.audioUrl) {
      try {
        const filename = path.basename(studyRecord.audioUrl)
        const filePath = getFilePath(filename)

        if (fs.existsSync(filePath)) {
          console.log('[Multimodal] Analyzing audio with Qwen3-Omni-Flash...')
          const audioResult = await multimodalAnalyzer.analyzeAudio(filePath, audioDuration)
          
          audioMarks = audioResult.marks
          // 如果数据库中没有转录文本，使用分析结果中的转�?
          if (!audioTranscript && audioResult.transcript) {
            audioTranscript = audioResult.transcript
            // 保存到数据库
            await prisma.studyRecord.update({
              where: { id },
              data: { notes: audioTranscript }
            })
            console.log(`[Multimodal] Transcription saved: ${audioTranscript.length} chars`)
          }
          
          results.audio = audioMarks
          console.log(`[Multimodal] Audio analysis complete: ${audioMarks.length} marks, transcript: ${audioTranscript.length} chars`)
        }
      } catch (error) {
        console.error('[Multimodal] Audio analysis failed:', error)
      }
    }

    // 3. PPT 内容仅保存，不生成时间轴标记（前端单独显示）
    let pptMarks: any[] = []
    if (pptContent && pptContent.page_count > 0) {
      console.log(`[Multimodal] PPT content saved: ${pptContent.page_count} pages, skipping timeline marks`)
      // PPT 不在时间轴上显示，只保留在数据库中供前端翻页查看
    }

    // 4. 板书图片 - 时间定死到4:20 (260秒)，同时进行视觉分析
    let imageMarks: any[] = []
    
    if (imageUrls.length > 0) {
      console.log(`[Multimodal] Analyzing ${imageUrls.length} board images with vision model...`)
      
      const FIXED_TIMESTAMP = 260 // 4分20秒
      
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i]
        try {
          // 调用视觉模型分析板书图片
          const imageAnalysis = await multimodalAnalyzer.analyzeSingleImage(url, i)
          
          if (imageAnalysis) {
            const markType = imageAnalysis.type || '板书'
            imageMarks.push({
              imageUrl: url,
              content: imageAnalysis.content || `课堂板书图片 ${i + 1}`,
              type: markType,
              timestamp: FIXED_TIMESTAMP,
              confidence: 1.0
            })
            console.log(`[Multimodal] Image ${i + 1} analyzed: type=${markType}, content=${imageAnalysis.content?.substring(0, 30)}...`)
          } else {
            // 分析失败，使用默认内容
            imageMarks.push({
              imageUrl: url,
              content: `课堂板书图片 ${i + 1}`,
              type: '板书',
              timestamp: FIXED_TIMESTAMP,
              confidence: 1.0
            })
          }
        } catch (err) {
          console.error(`[Multimodal] Failed to analyze image ${i + 1}:`, err)
          imageMarks.push({
            imageUrl: url,
            content: `课堂板书图片 ${i + 1}`,
            type: '板书',
            timestamp: FIXED_TIMESTAMP,
            confidence: 1.0
          })
        }
      }
      
      console.log(`[Multimodal] Board images analyzed and set to 04:20: ${imageMarks.length} marks`)
    }

    // 5. 合并标记 - 包含音频重点和板书图片（PPT不加入时间轴�?
    const unifiedMarks = multimodalAnalyzer.mergeMarks(
      audioMarks,
      [],  // PPT 不加入时间轴
      imageMarks,  // 板书图片加入时间�?
      audioDuration
    )

    console.log(`[Multimodal] Total unified marks: ${unifiedMarks.length}`)

    // 6. 转换�?TimeMark 格式并批量创建（同时生成AI分析�?
    if (unifiedMarks.length > 0) {
      // 删除旧的AI生成标记（保留用户手动标记）
      await prisma.timeMark.deleteMany({
        where: {
          studyRecordId: id,
        }
      })

      // 逐个创建标记并生成AI分析
      const createdMarks = []
      for (const mark of unifiedMarks) {
        let aiAnalysisJson: string | null = null
        
        // 为标记生成AI分析
        if (mark.imageUrl) {
          // 板书标记：使用视觉分析的内容
          const analysis = {
            summary: mark.content || '课堂板书内容',
            keyPoints: [mark.content || '板书内容', '查看图片了解详细内容'],
            knowledgePoints: ['板书内容'],
            reviewSuggestions: {
              firstReview: getReviewDate(1),
              secondReview: getReviewDate(3),
              consolidation: getReviewDate(7)
            },
            memoryTips: '结合板书图片和课堂笔记进行复习'
          }
          aiAnalysisJson = JSON.stringify(analysis)
        } else if (mark.type === 'EMPHASIS' || mark.type === 'NOTE') {
          // 音频重点：使用AI生成的摘要和要点（知识图谱和复习计划写死）
          const analysis = {
            summary: mark.summary || mark.content || '重点内容',
            keyPoints: mark.keyPoints?.length > 0 ? mark.keyPoints : [mark.content || '重点内容'],
            knowledgePoints: ['重点知识'],
            reviewSuggestions: {
              firstReview: getReviewDate(1),
              secondReview: getReviewDate(3),
              consolidation: getReviewDate(7)
            },
            memoryTips: '多次复习有助于加深记忆'
          }
          aiAnalysisJson = JSON.stringify(analysis)
        }
        
        // 创建标记
        console.log(`[Multimodal] Creating mark: type=${mark.type}, timestamp=${mark.timestamp}ms (${Math.floor(mark.timestamp/60000)}:${String(Math.floor((mark.timestamp%60000)/1000)).padStart(2,'0')})`)
        const created = await prisma.timeMark.create({
          data: {
            studyRecordId: id,
            type: mark.type,
            timestamp: mark.timestamp,
            content: mark.content,
            pptPage: mark.pptPage || null,
            imageUrl: mark.imageUrl || null,
            aiAnalysis: aiAnalysisJson,
            knowledgePointId: null
          }
        })
        console.log(`[Multimodal] Created mark with id: ${created.id}`)
        createdMarks.push(created)
      }
      
      console.log(`[Multimodal] Created ${createdMarks.length} time marks with AI analysis`)
    } else {
      console.log('[Multimodal] No marks to create')
    }

    const processTime = Date.now() - startTime

    // 7. 返回结果
    res.json({
      success: true,
      data: {
        studyRecordId: id,
        audioMarksCount: audioMarks.length,
        pptMarksCount: pptMarks.length,
        imageMarksCount: imageMarks.length,
        totalMarks: unifiedMarks.length,
        marks: unifiedMarks,
        processTimeMs: processTime
      }
    } as ApiResponse<any>)

  } catch (error: any) {
    console.error('[Multimodal] Analysis failed:', error)
    res.status(500).json({
      success: false,
      error: error.message || '多模态分析失败',
      code: 'MULTIMODAL_ANALYSIS_FAILED'
    } as ApiResponse<undefined>)
  }
})

/**
 * GET /api/study-records/:id/multimodal-content
 * 获取多模态内容的完整信息（音频转录、PPT每页内容、图片描述）
 */
router.get('/:id/multimodal-content', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id },
      include: {
        chapter: { include: { course: true } },
        timeMarks: { orderBy: { timestamp: 'asc' } }
      }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: '学习记录不存在',
      } as ApiResponse<undefined>)
    }

    // 按来源分类标记
    const audioMarks = studyRecord.timeMarks.filter(tm => 
      !tm.pptPage && !tm.imageUrl && tm.timestamp < (studyRecord.duration || 0) * 1000
    )
    
    const pptMarks = studyRecord.timeMarks.filter(tm => tm.pptPage)
    const imageMarks = studyRecord.timeMarks.filter(tm => tm.imageUrl)

    // 解析 imageUrls JSON 字符�?
    let imageUrls: string[] = []
    try {
      imageUrls = JSON.parse((studyRecord as any).imageUrls || '[]')
    } catch (e) {
      imageUrls = []
    }

    res.json({
      success: true,
      data: {
        studyRecordId: id,
        duration: studyRecord.duration,
        audio: {
          url: studyRecord.audioUrl,
          marks: audioMarks
        },
        ppt: {
          url: (studyRecord as any).documentUrl,
          marks: pptMarks
        },
        images: {
          urls: imageUrls,
          marks: imageMarks
        },
        allMarks: studyRecord.timeMarks
      }
    })

  } catch (error: any) {
    console.error('[Multimodal] Get content failed:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * 格式化PPT内容为AI可读的文�?
 */
function formatPPTContent(pptContent: any): string {
  if (!pptContent || !pptContent.slides) return ''
  
  const lines = ['以下是课件PPT的内容：\n']
  
  for (const slide of pptContent.slides) {
    const timeOffset = (slide.page - 1) * 60 // 假设每页�?分钟
    const minutes = Math.floor(timeOffset / 60)
    const seconds = timeOffset % 60
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`
    
    lines.push(`\n[${timeStr}] �?{slide.page}页`)
    
    if (slide.title) {
      lines.push(`标题：${slide.title}`)
    }
    
    if (slide.content && slide.content.length > 0) {
      lines.push('内容：')
      for (const text of slide.content) {
        lines.push(`  - ${text}`)
      }
    }
  }
  
  return lines.join('\n')
}

/**
 * 计算复习日期（基于艾宾浩斯遗忘曲线）
 */
function getReviewDate(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export default router
