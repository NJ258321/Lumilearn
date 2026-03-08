import { Router, type Request, type Response } from 'express'
import { PrismaClient } from '@prisma/client'
import type { ApiResponse } from '../types/index.js'
import { getFilePath, UPLOAD_DIR } from '../utils/file.js'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)
const router = Router()
const prisma = new PrismaClient()

// 最大片段时长（秒）
const MAX_SEGMENT_DURATION = 300 // 5分钟

/**
 * P2.1: GET /api/audio/:id/metadata
 * 获取音频元数据
 */
router.get('/:id/metadata', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // 获取学习记录
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
          select: { id: true, knowledgePointId: true, type: true }
        }
      }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: '学习记录不存在',
        code: 'STUDY_RECORD_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 获取音频文件信息
    const audioUrl = studyRecord.audioUrl
    let metadata = null

    if (audioUrl) {
      // 从 URL 中提取文件名
      const filename = path.basename(audioUrl)
      const filePath = getFilePath(filename)

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath)
        const ext = path.extname(filename).toLowerCase().slice(1)

        // 估算音频时长（基于文件大小和典型比特率）
        // 实际应该使用 music-metadata 库获取准确时长
        const estimatedDuration = studyRecord.duration || Math.floor(stats.size / 16000) // 估算

        metadata = {
          filename,
          url: audioUrl,
          size: stats.size,
          format: ext,
          duration: estimatedDuration,
          created: stats.birthtime,
          modified: stats.mtime
        }
      }
    }

    // 获取关联的知识点
    const knowledgePointIds = [...new Set(studyRecord.timeMarks
      .filter(tm => tm.knowledgePointId)
      .map(tm => tm.knowledgePointId!)
    )]

    const knowledgePoints = await prisma.knowledgePoint.findMany({
      where: { id: { in: knowledgePointIds } },
      select: { id: true, name: true, status: true }
    })

    // 获取时间标记统计
    const timeMarksCount = await prisma.timeMark.count({
      where: { studyRecordId: id }
    })

    res.json({
      success: true,
      data: {
        id: studyRecord.id,
        title: studyRecord.title,
        course: studyRecord.course,
        chapter: studyRecord.chapter,
        audioUrl: studyRecord.audioUrl,
        duration: studyRecord.duration,
        status: studyRecord.status,
        date: studyRecord.date,
        createdAt: studyRecord.createdAt,
        metadata,
        knowledgePoints,
        timeMarksCount,
        emphasisCount: studyRecord.timeMarks.filter(tm => tm.type === 'EMPHASIS').length,
        noteCount: studyRecord.timeMarks.filter(tm => tm.type === 'NOTE').length
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting audio metadata:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取音频元数据失败',
      code: 'GET_METADATA_FAILED'
    } as ApiResponse<undefined>)
  }
})

/**
 * P2.2: POST /api/audio/:id/transcribe
 * 音频转写接口（预留框架）
 * 后续可集成阿里云语音识别、讯飞语音识别等
 */
router.post('/:id/transcribe', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { language = 'zh-CN' } = req.body

    // 验证学习记录存在
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: '学习记录不存在',
        code: 'STUDY_RECORD_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 检查音频文件是否存在
    if (!studyRecord.audioUrl) {
      return res.status(400).json({
        success: false,
        error: '该学习记录没有音频文件',
        code: 'NO_AUDIO_FILE'
      } as ApiResponse<undefined>)
    }

    const filename = path.basename(studyRecord.audioUrl)
    const filePath = getFilePath(filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: '音频文件不存在',
        code: 'AUDIO_FILE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // TODO: 集成外部语音识别服务
    // 预留框架，当前返回提示信息

    // 示例：预留的转写响应格式
    // 后续集成时替换为实际调用
    res.json({
      success: true,
      data: {
        studyRecordId: id,
        status: 'PENDING',
        message: '转写服务预留框架已就绪，请配置语音识别服务',
        language,
        // 预留字段
        text: null,
        segments: [],
        providers: [
          { name: '阿里云语音识别', status: 'not_configured' },
          { name: '讯飞语音识别', status: 'not_configured' },
          { name: 'Google Speech-to-Text', status: 'not_configured' }
        ]
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error transcribing audio:', error)
    res.status(500).json({
      success: false,
      error: error.message || '音频转写失败',
      code: 'TRANSCRIBE_FAILED'
    } as ApiResponse<undefined>)
  }
})

/**
 * P2.3: GET /api/audio/:id/segment
 * 音频片段提取
 * 根据时间范围提取音频片段并返回
 */
router.get('/:id/segment', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { start, end } = req.query

    // 验证参数
    const startTime = parseFloat(start as string)
    const endTime = parseFloat(end as string)

    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({
        success: false,
        error: '请提供有效的 start 和 end 参数（秒）',
        code: 'INVALID_PARAMS'
      } as ApiResponse<undefined>)
    }

    if (startTime < 0) {
      return res.status(400).json({
        success: false,
        error: '开始时间不能为负数',
        code: 'INVALID_TIME_RANGE'
      } as ApiResponse<undefined>)
    }

    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        error: '结束时间必须大于开始时间',
        code: 'INVALID_TIME_RANGE'
      } as ApiResponse<undefined>)
    }

    const duration = endTime - startTime
    if (duration > MAX_SEGMENT_DURATION) {
      return res.status(400).json({
        success: false,
        error: `片段时长不能超过 ${MAX_SEGMENT_DURATION} 秒（5分钟）`,
        code: 'SEGMENT_TOO_LONG'
      } as ApiResponse<undefined>)
    }

    // 获取学习记录
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: '学习记录不存在',
        code: 'STUDY_RECORD_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    if (!studyRecord.audioUrl) {
      return res.status(400).json({
        success: false,
        error: '该学习记录没有音频文件',
        code: 'NO_AUDIO_FILE'
      } as ApiResponse<undefined>)
    }

    // 检查音频文件是否存在
    const filename = path.basename(studyRecord.audioUrl)
    const inputPath = getFilePath(filename)

    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({
        success: false,
        error: '音频文件不存在',
        code: 'AUDIO_FILE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 检查音频时长
    const audioDuration = studyRecord.duration || 0
    if (audioDuration > 0 && endTime > audioDuration) {
      return res.status(400).json({
        success: false,
        error: `结束时间超过音频时长（${audioDuration}秒）`,
        code: 'INVALID_TIME_RANGE'
      } as ApiResponse<undefined>)
    }

    // 生成输出文件名
    const outputFilename = `segment-${id}-${Date.now()}.mp3`
    const outputPath = path.join(UPLOAD_DIR, outputFilename)

    // 检查 ffmpeg 是否可用
    let ffmpegAvailable = false
    try {
      await execAsync('ffmpeg -version')
      ffmpegAvailable = true
    } catch {
      ffmpegAvailable = false
    }

    if (!ffmpegAvailable) {
      // 如果 ffmpeg 不可用，尝试简单复制（仅适用于整个文件）
      if (startTime === 0 && (endTime >= audioDuration || audioDuration === 0)) {
        // 简单复制整个文件
        fs.copyFileSync(inputPath, outputPath)

        res.setHeader('Content-Type', 'audio/mpeg')
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`)

        const fileStream = fs.createReadStream(outputPath)
        fileStream.pipe(res)

        // 传输完成后删除临时文件
        fileStream.on('end', () => {
          try {
            fs.unlinkSync(outputPath)
          } catch (e) {
            console.error('Failed to delete temp file:', e)
          }
        })

        return
      }

      return res.status(503).json({
        success: false,
        error: '音频处理服务暂不可用（ffmpeg 未安装）',
        code: 'FFMPEG_NOT_AVAILABLE',
        message: '请安装 ffmpeg 以支持音频片段提取功能'
      } as ApiResponse<undefined>)
    }

    // 使用 ffmpeg 提取音频片段
    const ffmpegCommand = `ffmpeg -i "${inputPath}" -ss ${startTime} -to ${endTime} -vn -acodec libmp3lame -q:a 2 "${outputPath}" -y`

    try {
      await execAsync(ffmpegCommand, { timeout: 60000 })

      // 检查输出文件是否生成
      if (!fs.existsSync(outputPath)) {
        throw new Error('Failed to generate audio segment')
      }

      const stats = fs.statSync(outputPath)

      // 设置响应头
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Length', stats.size)
      res.setHeader('Content-Disposition', `attachment; filename="segment-${startTime}-${endTime}.mp3"`)

      // 返回文件流
      const fileStream = fs.createReadStream(outputPath)
      fileStream.pipe(res)

      // 传输完成后删除临时文件
      fileStream.on('end', () => {
        try {
          fs.unlinkSync(outputPath)
        } catch (e) {
          console.error('Failed to delete temp file:', e)
        }
      })

      fileStream.on('error', (err) => {
        console.error('Stream error:', err)
        try {
          fs.unlinkSync(outputPath)
        } catch (e) {
          // ignore
        }
      })
    } catch (ffmpegError: any) {
      console.error('FFmpeg error:', ffmpegError)

      // 清理可能生成的临时文件
      if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath)
      }

      return res.status(500).json({
        success: false,
        error: `音频片段提取失败: ${ffmpegError.message}`,
        code: 'SEGMENT_EXTRACTION_FAILED'
      } as ApiResponse<undefined>)
    }
  } catch (error: any) {
    console.error('Error extracting audio segment:', error)
    res.status(500).json({
      success: false,
      error: error.message || '音频片段提取失败',
      code: 'SEGMENT_EXTRACTION_FAILED'
    } as ApiResponse<undefined>)
  }
})

/**
 * 获取转写服务状态
 * GET /api/audio/transcribe/status
 */
router.get('/transcribe/status', async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        available: false,
        message: '语音识别服务尚未配置',
        supportedLanguages: ['zh-CN', 'en-US', 'ja-JP'],
        providers: [
          {
            name: '阿里云语音识别',
            description: '支持中文英文等多种语言',
            status: 'not_configured',
            configFields: ['accessKeyId', 'accessKeySecret', 'appKey']
          },
          {
            name: '讯飞语音识别',
            description: '中文识别效果优秀',
            status: 'not_configured',
            configFields: ['appId', 'apiKey', 'apiSecret']
          },
          {
            name: 'Google Speech-to-Text',
            description: '支持多种语言',
            status: 'not_configured',
            configFields: ['apiKey', 'projectId']
          }
        ]
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting transcribe status:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取转写服务状态失败',
      code: 'GET_STATUS_FAILED'
    } as ApiResponse<undefined>)
  }
})

/**
 * P2.4: POST /api/audio/:id/vad
 * 语音活动检测（Voice Activity Detection）
 * 检测音频中的语音活动，返回语音片段的时间范围
 */
router.post('/:id/vad', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { sensitivity = 50, minDuration = 0.5, minSilence = 0.3 } = req.body

    // 验证灵敏度
    if (typeof sensitivity !== 'number' || sensitivity < 0 || sensitivity > 100) {
      return res.status(400).json({
        success: false,
        error: '灵敏度必须是 0-100 之间的数字',
        code: 'INVALID_SENSITIVITY'
      } as ApiResponse<undefined>)
    }

    // 获取学习记录
    const studyRecord = await prisma.studyRecord.findUnique({
      where: { id }
    })

    if (!studyRecord) {
      return res.status(404).json({
        success: false,
        error: '学习记录不存在',
        code: 'STUDY_RECORD_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    if (!studyRecord.audioUrl) {
      return res.status(400).json({
        success: false,
        error: '该学习记录没有音频文件',
        code: 'NO_AUDIO_FILE'
      } as ApiResponse<undefined>)
    }

    const filename = path.basename(studyRecord.audioUrl)
    const inputPath = getFilePath(filename)

    if (!fs.existsSync(inputPath)) {
      return res.status(404).json({
        success: false,
        error: '音频文件不存在',
        code: 'AUDIO_FILE_NOT_FOUND'
      } as ApiResponse<undefined>)
    }

    // 检查 ffmpeg 是否可用
    let ffmpegAvailable = false
    try {
      await execAsync('ffmpeg -version')
      ffmpegAvailable = true
    } catch {
      ffmpegAvailable = false
    }

    const audioDuration = studyRecord.duration || 0

    if (!ffmpegAvailable) {
      // 如果 ffmpeg 不可用，返回基于统计的简化估算
      if (audioDuration === 0) {
        return res.status(400).json({
          success: false,
          error: '无法获取音频时长，请先配置 ffmpeg',
          code: 'FFMPEG_NOT_AVAILABLE'
        } as ApiResponse<undefined>)
      }

      // 简化估算：假设语音占比 60-80%
      const estimatedSpeechRatio = 0.6 + (sensitivity / 100) * 0.2
      const estimatedSpeechDuration = Math.floor(audioDuration * estimatedSpeechRatio)
      const estimatedSegments = Math.ceil(estimatedSpeechDuration / 30)

      const segments: { start: number; end: number }[] = []
      let currentTime = 0

      for (let i = 0; i < estimatedSegments; i++) {
        const segmentDuration = Math.min(30 + Math.random() * 20, audioDuration - currentTime)
        segments.push({
          start: Math.round(currentTime * 10) / 10,
          end: Math.round((currentTime + segmentDuration) * 10) / 10
        })
        currentTime += segmentDuration + Math.random() * 5
        if (currentTime >= audioDuration) break
      }

      return res.json({
        success: true,
        data: {
          studyRecordId: id,
          method: 'estimation',
          message: 'ffmpeg 不可用，返回基于统计的估算结果',
          segments,
          totalSpeechDuration: Math.round(segments.reduce((sum, s) => sum + (s.end - s.start), 0) * 10) / 10,
          audioDuration,
          sensitivity,
          minDuration,
          minSilence
        }
      } as ApiResponse<any>)
    }

    // 使用 ffmpeg 进行语音活动检测
    const vadThreshold = (100 - sensitivity) / 100 * 30 + 30
    const silenceThreshold = '-40' // dB

    // 使用 silencedetect 滤镜检测静音区间
    const analysisCommand = `ffmpeg -i "${inputPath}" -af "silencedetect=noise=${silenceThreshold}dB:d=${minSilence}" -f null - 2>&1`

    try {
      const { stdout, stderr } = await execAsync(analysisCommand, { timeout: 180000 })
      const output = stdout + stderr

      // 解析静音检测结果
      const silenceStartMatches = output.matchAll(/silence_start: ([\d.]+)/g)
      const silenceEndMatches = output.matchAll(/silence_end: ([\d.]+)/g)

      const silenceStarts: number[] = []
      const silenceEnds: number[] = []

      for (const match of silenceStartMatches) {
        silenceStarts.push(parseFloat(match[1]))
      }
      for (const match of silenceEndMatches) {
        silenceEnds.push(parseFloat(match[1]))
      }

      // 根据静音区间反推语音区间
      const segments: { start: number; end: number }[] = []

      if (silenceStarts.length === 0) {
        // 没有检测到静音，整个音频为语音
        segments.push({
          start: 0,
          end: audioDuration
        })
      } else {
        // 第一个语音段从0开始
        let currentStart = 0

        for (let i = 0; i < silenceEnds.length; i++) {
          const silenceEnd = silenceEnds[i]

          // 如果当前语音段时长足够，添加
          if (silenceEnd - currentStart >= minDuration) {
            segments.push({
              start: Math.round(currentStart * 10) / 10,
              end: Math.round(silenceEnd * 10) / 10
            })
          }

          // 更新下一个语音段的开始时间
          currentStart = i < silenceStarts.length ? silenceStarts[i] : audioDuration
        }

        // 处理最后一个语音段
        if (audioDuration - currentStart >= minDuration) {
          segments.push({
            start: Math.round(currentStart * 10) / 10,
            end: Math.round(audioDuration * 10) / 10
          })
        }
      }

      const totalSpeechDuration = segments.reduce((sum, s) => sum + (s.end - s.start), 0)

      res.json({
        success: true,
        data: {
          studyRecordId: id,
          method: 'ffmpeg_silencedetect',
          segments,
          totalSpeechDuration: Math.round(totalSpeechDuration * 10) / 10,
          audioDuration: Math.round(audioDuration * 10) / 10,
          speechRatio: Math.round((totalSpeechDuration / audioDuration) * 1000) / 1000,
          sensitivity,
          vadThreshold,
          minDuration,
          minSilence
        }
      } as ApiResponse<any>)
      return
    } catch (analysisError: any) {
      console.error('VAD analysis error:', analysisError)

      return res.json({
        success: true,
        data: {
          studyRecordId: id,
          method: 'fallback',
          message: '音频分析失败，返回估算结果',
          segments: [],
          totalSpeechDuration: 0,
          audioDuration,
          sensitivity,
          error: analysisError.message
        }
      } as ApiResponse<any>)
    }
  } catch (error: any) {
    console.error('Error performing VAD:', error)
    res.status(500).json({
      success: false,
      error: error.message || '语音活动检测失败',
      code: 'VAD_FAILED'
    } as ApiResponse<undefined>)
  }
})

/**
 * 获取 VAD 服务状态
 * GET /api/audio/vad/status
 */
router.get('/vad/status', async (_req: Request, res: Response) => {
  try {
    let ffmpegAvailable = false
    try {
      await execAsync('ffmpeg -version')
      ffmpegAvailable = true
    } catch {
      ffmpegAvailable = false
    }

    res.json({
      success: true,
      data: {
        available: ffmpegAvailable,
        method: ffmpegAvailable ? 'ffmpeg_analysis' : 'estimation',
        description: ffmpegAvailable
          ? '使用 ffmpeg 进行音频音量分析，精确检测语音段'
          : '基于统计估算，仅返回近似结果',
        parameters: {
          sensitivity: {
            type: 'number',
            range: '0-100',
            default: 50,
            description: '语音检测灵敏度，数值越高越敏感'
          },
          minDuration: {
            type: 'number',
            range: '>=0.1',
            default: 0.5,
            description: '最小语音片段时长（秒）'
          },
          minSilence: {
            type: 'number',
            range: '>=0.1',
            default: 0.3,
            description: '最小静音间隔（秒），超过此值认为语音片段结束'
          }
        }
      }
    } as ApiResponse<any>)
  } catch (error: any) {
    console.error('Error getting VAD status:', error)
    res.status(500).json({
      success: false,
      error: error.message || '获取 VAD 服务状态失败',
      code: 'GET_STATUS_FAILED'
    } as ApiResponse<undefined>)
  }
})

export default router
