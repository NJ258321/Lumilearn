/**
 * 多模态内容分析服务
 * 协调音频、PPT、图片的分析，并进行内容对齐
 */

import OpenAI from 'openai'
import path from 'path'
import fs from 'fs'
import { docmindService } from './docmind.js'
import { audioProcessor } from './audioProcessor.js'

// 初始化 DashScope 客户端（用于 Qwen3-Omni 和 Qwen3-VL）
const dashscopeClient = process.env.DASHSCOPE_API_KEY
  ? new OpenAI({
      apiKey: process.env.DASHSCOPE_API_KEY,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    })
  : null

// 多模态分析结果
export interface MultimodalAnalysisResult {
  audioMarks: AudioMark[]
  pptMarks: PPTMark[]
  imageMarks: ImageMark[]
  mergedMarks: UnifiedMark[]
}

export interface AudioMark {
  timestamp: number // 秒
  content: string
  type: '重点' | '知识点' | '例题' | '小结' | '疑问'
  importance: number
  summary?: string // AI生成的摘要
  keyPoints?: string[] // AI生成的关键要点
}

export interface PPTMark {
  pageNumber: number
  content: string
  timestamp?: number // 映射到音频的时间（如果有音频）
}

export interface ImageMark {
  imageUrl: string
  content: string
  timestamp?: number
  type: '板书' | '重点' | '例题'
}

export interface UnifiedMark {
  timestamp: number // 毫秒，统一时间轴
  type: 'START' | 'END' | 'EMPHASIS' | 'BOARD_CHANGE' | 'NOTE' | 'QUESTION'
  content: string
  pptPage?: number
  imageUrl?: string
  source: 'audio' | 'ppt' | 'image'
  summary?: string // AI生成的摘要
  keyPoints?: string[] // AI生成的关键要点
}

class MultimodalAnalyzer {
  /**
   * 分析音频内容
   * 注意：Qwen3-Omni 有 10MB 限制，大文件需要分段处理
   * 
   * 返回：音频标记 + 完整转录文本
   */
  async analyzeAudio(audioPath: string, duration: number): Promise<{ marks: AudioMark[]; transcript: string }> {
    if (!dashscopeClient) {
      throw new Error('DASHSCOPE_API_KEY not configured')
    }

    const fileBuffer = fs.readFileSync(audioPath)
    
    // 检查文件大小，base64 编码会增加约 37%
    const fileSizeMB = fileBuffer.length / (1024 * 1024)
    const base64SizeMB = fileSizeMB * 1.37
    console.log(`[Multimodal] Audio file size: ${fileSizeMB.toFixed(2)} MB, base64: ${base64SizeMB.toFixed(2)} MB`)
    
    // 如果文件太大，使用分段处理
    if (base64SizeMB > 9.5) {
      console.log('[Multimodal] Audio too large, using segmented analysis')
      return this.segmentedAudioAnalysis(audioPath, duration)
    }

    // 小文件直接分析
    return this.analyzeSingleAudioSegmentWithTranscript(fileBuffer, audioPath, 0)
  }

  /**
   * 分段分析音频（同时返回转录文本）
   * 将音频切成 5 分钟片段，分别分析后合并结果
   */
  private async segmentedAudioAnalysis(audioPath: string, totalDuration: number): Promise<{ marks: AudioMark[]; transcript: string }> {
    console.log(`[Multimodal] Starting segmented analysis for ${totalDuration}s audio`)
    
    let segments: any[] = []
    let tempDir = ''
    
    try {
      // 分割音频
      segments = await audioProcessor.splitAudio(audioPath, totalDuration, 300) // 5分钟一段
      console.log(`[Multimodal] Split into ${segments.length} segments`)
      
      tempDir = path.dirname(segments[0].filePath)
      
      const allMarks: AudioMark[] = []
      const allTranscripts: string[] = []
      
      // 分析每个片段
      for (const segment of segments) {
        try {
          console.log(`[Multimodal] Analyzing segment ${segment.index + 1}/${segments.length}`)
          
          const segmentBuffer = fs.readFileSync(segment.filePath)
          const { marks, transcript } = await this.analyzeSingleAudioSegmentWithTranscript(segmentBuffer, segment.filePath, segment.startTime)
          
          // 调整时间戳为绝对时间
          const adjustedMarks = marks.map(m => ({
            ...m,
            timestamp: m.timestamp + segment.startTime
          }))
          
          allMarks.push(...adjustedMarks)
          allTranscripts.push(transcript)
          console.log(`[Multimodal] Segment ${segment.index + 1} complete: ${marks.length} marks, ${transcript.length} chars transcript`)
          
        } catch (error) {
          console.error(`[Multimodal] Failed to analyze segment ${segment.index}:`, error)
        }
      }
      
      console.log(`[Multimodal] Segmented analysis complete: ${allMarks.length} total marks`)
      
      // 去重并排序
      const uniqueMarks = this.deduplicateAndSortMarks(allMarks)
      const fullTranscript = allTranscripts.join('\n\n')
      
      return { marks: uniqueMarks, transcript: fullTranscript }
      
    } catch (error) {
      console.error('[Multimodal] Segmented analysis failed:', error)
      // 失败时回退到简单策略
      const fallbackMarks = this.fallbackAudioAnalysis(totalDuration)
      return { marks: fallbackMarks, transcript: '' }
    } finally {
      // 清理临时文件
      if (tempDir) {
        audioProcessor.cleanup(tempDir)
      }
    }
  }

  /**
   * 分析单个音频片段（同时返回转录文本）
   */
  private async analyzeSingleAudioSegmentWithTranscript(
    fileBuffer: Buffer, 
    filePath: string, 
    timeOffset: number
  ): Promise<{ marks: AudioMark[]; transcript: string }> {
    const base64Audio = fileBuffer.toString('base64')
    const mimeType = path.extname(filePath).toLowerCase() === '.mp3' 
      ? 'audio/mpeg' 
      : 'audio/wav'

    const prompt = `你是一位课堂录音分析专家。请深度分析这段课堂录音：

任务1 - 提取带时间戳的详细转录：
请转录音频完整内容，每句加时间戳 [MM:SS]。

任务2 - 提取重点标记（JSON格式）：
[{
  "timestamp": 45,
  "content": "简短描述",
  "summary": "该重点的详细摘要（50-80字），说明讲解了什么问题、核心概念是什么",
  "keyPoints": ["要点1：具体说明了什么", "要点2：核心结论是什么", "要点3：如何应用或理解"],
  "importance": 9
}]

要求：
- 标记点 4-6 个，间隔至少30秒
- content: 简短标题（15字内）
- summary: 详细摘要，说明这个重点讲了什么具体内容（不要泛泛而谈）
- keyPoints: 3个具体要点，每个要点要有实质内容，不能只是重复标题
- 优先标记：概念定义、核心公式、关键结论、典型例题

输出格式：
[转录文本]

---MARKS---
[JSON数组]`

    const stream = await dashscopeClient!.chat.completions.create({
      model: 'qwen3-omni-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: {
                data: `data:${mimeType};base64,${base64Audio}`,
                format: mimeType === 'audio/mpeg' ? 'mp3' : 'wav'
              }
            },
            { type: 'text', text: prompt }
          ]
        }
      ],
      stream: true,
      modalities: ['text']
    })

    let fullResponse = ''
    for await (const chunk of stream) {
      fullResponse += chunk.choices[0]?.delta?.content || ''
    }

    // 分离转录文本和标记
    const parts = fullResponse.split('---MARKS---')
    const transcript = parts[0]?.trim() || ''
    const marksJson = parts[1]?.trim() || fullResponse

    const marks = this.parseAudioMarks(marksJson)
    
    return { marks, transcript }
  }

  /**
   * 分析单个音频片段（兼容旧版本）
   */
  private async analyzeSingleAudioSegment(
    fileBuffer: Buffer, 
    filePath: string, 
    timeOffset: number
  ): Promise<AudioMark[]> {
    const result = await this.analyzeSingleAudioSegmentWithTranscript(fileBuffer, filePath, timeOffset)
    return result.marks
  }

  /**
   * 去重并排序标记
   * 合并相近时间戳的标记
   */
  private deduplicateAndSortMarks(marks: AudioMark[]): AudioMark[] {
    // 按时间戳排序
    marks.sort((a, b) => a.timestamp - b.timestamp)
    
    const result: AudioMark[] = []
    const minInterval = 30  // 最小间隔 30 秒
    
    for (const mark of marks) {
      // 检查是否与上一个标记太接近
      const lastMark = result[result.length - 1]
      if (lastMark && Math.abs(mark.timestamp - lastMark.timestamp) < minInterval) {
        // 保留重要性更高的
        if (mark.importance > lastMark.importance) {
          result[result.length - 1] = mark
        }
      } else {
        result.push(mark)
      }
    }
    
    return result
  }

  /**
   * 分析PPT内容（使用文档智能API + Qwen3分析）
   * 
   * 流程：
   * 1. 调用阿里云文档智能 API 解析 PPT 文本
   * 2. 使用 Qwen3 分析每页内容，提取知识点
   * 3. 如有音频转录，进行内容对齐
   */
  async analyzePPT(pptPath: string, audioTranscript?: string): Promise<PPTMark[]> {
    console.log('[Multimodal] Starting PPT analysis...')

    // 检查文档智能服务是否配置
    if (!docmindService.isConfigured()) {
      console.warn('[Multimodal] DocMind not configured, skipping PPT analysis')
      return []
    }

    try {
      // 1. 解析 PPT 获取每页内容
      const fileName = path.basename(pptPath)
      const pages = await docmindService.parseDocument(pptPath, fileName)

      if (pages.length === 0) {
        console.log('[Multimodal] No content extracted from PPT')
        return []
      }

      console.log(`[Multimodal] Extracted ${pages.length} pages from PPT`)

      // 2. 使用 Qwen3 分析每页内容
      const marks: PPTMark[] = []

      for (const page of pages) {
        if (!page.content.trim()) continue

        try {
          const analysis = await this.analyzePageContent(page, audioTranscript)
          if (analysis.content) {
            marks.push({
              pageNumber: page.pageNumber,
              content: analysis.content,
              timestamp: analysis.timestamp // 可能为 undefined，后续合并时分配
            })
          }
        } catch (error) {
          console.error(`[Multimodal] Failed to analyze page ${page.pageNumber}:`, error)
        }
      }

      console.log(`[Multimodal] PPT analysis complete: ${marks.length} marks`)
      return marks

    } catch (error) {
      console.error('[Multimodal] PPT analysis failed:', error)
      return []
    }
  }

  /**
   * 分析单页 PPT 内容
   */
  private async analyzePageContent(
    page: { pageNumber: number; content: string; title?: string },
    audioTranscript?: string
  ): Promise<{ content: string; timestamp?: number }> {
    if (!dashscopeClient) {
      return { content: page.content.substring(0, 100) }
    }

    const prompt = `你是一位课堂 PPT 分析助手。请分析这页 PPT 的内容，提取关键知识点。

PPT 第 ${page.pageNumber} 页内容：
${page.content.substring(0, 2000)}

${audioTranscript ? `相关课堂讲解内容：\n${audioTranscript.substring(0, 1000)}\n` : ''}

请用 JSON 格式返回：
{
  "content": "这页的核心知识点（30字以内）",
  "importance": 8  // 1-10 的重要性评分
}

如果这页内容不重要（如封面、目录），返回 { "content": "", "importance": 0 }`

    const response = await dashscopeClient.chat.completions.create({
      model: 'qwen3-32b',  // 使用更稳定的文本模型
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content || ''
    
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return { content: '' }

      const parsed = JSON.parse(jsonMatch[0])
      const importance = Math.floor(Number(parsed.importance) || 0)
      
      // 只返回重要内容
      if (importance >= 5 && parsed.content) {
        return {
          content: String(parsed.content).substring(0, 100),
          timestamp: undefined
        }
      }
      
      return { content: '' }
    } catch {
      // JSON 解析失败，返回原始内容的摘要
      return {
        content: page.content.substring(0, 80).replace(/[#\*\`]/g, '')
      }
    }
  }

  /**
   * 分析图片内容（使用 Qwen3.5-Flash - 视觉能力更强）
   * 
   * 支持分批处理：每批最多 4 张图片
   * 
   * @param imageUrls 图片 URL 列表
   * @param batchSize 每批处理的图片数量，默认 4
   */
  async analyzeImages(imageUrls: string[], batchSize: number = 4): Promise<ImageMark[]> {
    if (!dashscopeClient) {
      throw new Error('DASHSCOPE_API_KEY not configured')
    }

    const marks: ImageMark[] = []
    
    // 分批处理
    const batches = Math.ceil(imageUrls.length / batchSize)
    console.log(`[Multimodal] Analyzing ${imageUrls.length} images in ${batches} batches (batchSize=${batchSize})`)

    for (let batchIdx = 0; batchIdx < batches; batchIdx++) {
      const startIdx = batchIdx * batchSize
      const endIdx = Math.min((batchIdx + 1) * batchSize, imageUrls.length)
      const batchUrls = imageUrls.slice(startIdx, endIdx)
      
      console.log(`[Multimodal] Processing batch ${batchIdx + 1}/${batches} (${batchUrls.length} images)`)
      
      try {
        // 构建多图片消息内容
        const content: any[] = []
        
        // 添加所有图片
        for (const url of batchUrls) {
          const imageBase64 = await this.downloadImageAsBase64(url)
          content.push({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          })
        }
        
        // 添加提示词
        content.push({
          type: 'text',
          text: `以上 ${batchUrls.length} 张图片是课堂的 PPT 页面或板书照片。

请分析每张图片，提取关键知识点。返回 JSON 数组格式：
[
  {
    "imageIndex": 0,  // 图片序号，从0开始
    "content": "核心知识点（30字以内）",
    "type": "板书" | "重点" | "例题",
    "importance": 8  // 1-10的重要性
  }
]

忽略模糊、无关的图片。只返回重要的知识点。`
        })

        const response = await dashscopeClient.chat.completions.create({
          model: 'qwen3.5-flash', // Qwen3.5-Flash，视觉能力更强
          messages: [
            {
              role: 'user',
              content
            }
          ],
          temperature: 0.3
        })

        const responseText = response.choices[0]?.message?.content || ''
        const parsedMarks = this.parseBatchImageAnalysis(responseText, batchUrls, startIdx)
        
        marks.push(...parsedMarks)
        console.log(`[Multimodal] Batch ${batchIdx + 1} complete: ${parsedMarks.length} marks`)
        
      } catch (error) {
        console.error(`[Multimodal] Failed to analyze batch ${batchIdx + 1}:`, error)
        // 尝试逐个分析作为回退
        for (let i = 0; i < batchUrls.length; i++) {
          try {
            const mark = await this.analyzeSingleImage(batchUrls[i], startIdx + i)
            if (mark) marks.push(mark)
          } catch (e) {
            console.error(`[Multimodal] Single image analysis failed:`, e)
          }
        }
      }
    }

    return marks
  }

  /**
   * 分析单张图片（回退方案）
   */
  public async analyzeSingleImage(imageUrl: string, index: number): Promise<ImageMark | null> {
    const imageBase64 = await this.downloadImageAsBase64(imageUrl)
    
    const prompt = `分析这张课堂板书图片，提取关键信息。
请用JSON格式返回：
{
  "content": "图片主要内容（30字以内），如公式、图表、概念等",
  "type": "板书"
}

注意：type 固定为 "板书"，因为这些都是课堂板书照片

如果图片模糊或不包含有效内容，返回 { "content": "", "type": "板书" }`

    const response = await dashscopeClient!.chat.completions.create({
      model: 'qwen3.5-flash',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            },
            { type: 'text', text: prompt }
          ]
        }
      ],
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content || ''
    const parsed = this.parseImageAnalysis(content)

    if (parsed.content) {
      return {
        imageUrl,
        content: parsed.content,
        type: parsed.type as any,
        timestamp: undefined
      }
    }
    return null
  }

  /**
   * 解析批量图片分析结果
   */
  private parseBatchImageAnalysis(response: string, batchUrls: string[], offset: number): ImageMark[] {
    const marks: ImageMark[] = []
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return marks

      const parsed = JSON.parse(jsonMatch[0])
      if (!Array.isArray(parsed)) return marks

      for (const item of parsed) {
        const idx = Number(item.imageIndex)
        if (isNaN(idx) || idx < 0 || idx >= batchUrls.length) continue
        
        const content = String(item.content || '').trim()
        if (!content) continue

        marks.push({
          imageUrl: batchUrls[idx],
          content: content.substring(0, 100),
          type: (['板书', '重点', '例题'].includes(item.type) ? item.type : '板书') as any,
          timestamp: undefined
        })
      }
    } catch (error) {
      console.error('[Multimodal] Failed to parse batch image analysis:', error)
    }
    
    return marks
  }

  /**
   * 分析PPT文本内容
   * @param pptText 格式化的PPT文本
   * @param pageCount 页数
   */
  async analyzePPTText(pptText: string, pageCount: number): Promise<PPTMark[]> {
    if (!dashscopeClient) {
      throw new Error('DASHSCOPE_API_KEY not configured')
    }

    console.log(`[Multimodal] Analyzing PPT text content (${pageCount} pages)...`)

    const prompt = `请分析以下课件PPT的文本内容，提取关键知识点和时间点标记。

${pptText}

请返回JSON数组格式，每个标记包含：
[
  {
    "timestamp": 120,  // 预计的时间戳（秒），基于页码估算
    "content": "知识点内容（30字以内）",
    "pageNumber": 3    // 对应的PPT页码
  }
]

要求：
1. 提取每页的重点概念、定义、公式
2. 为每页生成1-2个时间点标记
3. timestamp根据页码估算（第1页0秒，第2页60秒，以此类推）
4. 只返回关键知识点，不要返回所有文本

只返回JSON数组，不要其他内容。`

    const response = await dashscopeClient.chat.completions.create({
      model: 'qwen3.5-flash',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })

    const content = response.choices[0]?.message?.content || ''
    
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.warn('[Multimodal] No JSON array found in PPT text analysis response')
        return []
      }

      const parsed = JSON.parse(jsonMatch[0])
      if (!Array.isArray(parsed)) {
        console.warn('[Multimodal] PPT text analysis response is not an array')
        return []
      }

      const marks: PPTMark[] = parsed.map((item: any) => ({
        timestamp: Number(item.timestamp) || 0,
        content: String(item.content || '').substring(0, 100),
        pageNumber: Number(item.pageNumber) || 1
      })).filter((m: PPTMark) => m.content)

      console.log(`[Multimodal] PPT text analysis complete: ${marks.length} marks`)
      return marks

    } catch (error) {
      console.error('[Multimodal] Failed to parse PPT text analysis response:', error)
      return []
    }
  }

  /**
   * 合并所有模态的标记
   * 
   * 合并策略：
   * 1. 音频标记作为主时间轴
   * 2. PPT标记根据内容相似度映射到音频时间
   * 3. 图片标记如果没有时间戳，按顺序放在音频后
   */
  mergeMarks(
    audioMarks: AudioMark[],
    pptMarks: PPTMark[],
    imageMarks: ImageMark[],
    audioDuration: number
  ): UnifiedMark[] {
    const unifiedMarks: UnifiedMark[] = []

    // 1. 转换音频标记
    for (const mark of audioMarks) {
      unifiedMarks.push({
        timestamp: mark.timestamp * 1000, // 转为毫秒
        type: this.mapAudioTypeToMarkType(mark.type),
        content: mark.content,
        source: 'audio',
        summary: mark.summary,
        keyPoints: mark.keyPoints
      })
    }

    // 2. 处理PPT标记
    // TODO: 实现基于内容的时间映射
    // 临时方案：均匀分布在音频时间轴上
    for (let i = 0; i < pptMarks.length; i++) {
      const mark = pptMarks[i]
      const timestamp = mark.timestamp !== undefined 
        ? mark.timestamp * 1000
        : Math.floor((audioDuration / Math.max(pptMarks.length, 1)) * i * 1000)

      unifiedMarks.push({
        timestamp,
        type: 'NOTE',
        content: mark.content,
        pptPage: mark.pageNumber,
        source: 'ppt'
      })
    }

    // 3. 处理图片标记
    for (const mark of imageMarks) {
      // mark.timestamp 已经是秒，转为毫秒
      const timestampMs = (mark.timestamp || 0) * 1000
      
      // 确保板书类型正确转换
      const isBoard = mark.type === '板书' || mark.type?.includes('板')
      const markType = isBoard ? 'BOARD_CHANGE' : 'EMPHASIS'
      
      console.log(`[MergeMarks] Image mark: type=${mark.type}, converted to ${markType}, timestamp=${timestampMs}ms`)

      unifiedMarks.push({
        timestamp: timestampMs,
        type: markType,
        content: mark.content,
        imageUrl: mark.imageUrl,
        source: 'image'
      })
    }

    // 4. 按时间戳排序
    unifiedMarks.sort((a, b) => a.timestamp - b.timestamp)

    return unifiedMarks
  }

  /**
   * 将音频类型映射到 TimeMark 类型
   */
  private mapAudioTypeToMarkType(audioType: string): UnifiedMark['type'] {
    const mapping: Record<string, UnifiedMark['type']> = {
      '重点': 'EMPHASIS',
      '知识点': 'NOTE',
      '例题': 'NOTE',
      '小结': 'NOTE',
      '疑问': 'QUESTION'
    }
    return mapping[audioType] || 'NOTE'
  }

  /**
   * 音频文件过大时的备用分析策略
   * 生成基于时长的均匀分布标记点
   */
  private fallbackAudioAnalysis(duration: number): AudioMark[] {
    console.log(`[Multimodal] Using fallback audio analysis for ${duration}s`)
    
    if (duration <= 0) return []
    
    const markCount = Math.min(6, Math.max(3, Math.floor(duration / 60)))
    const interval = duration / markCount
    
    return Array.from({ length: markCount }, (_, i) => ({
      timestamp: Math.floor(i * interval),
      content: i === 0 ? '课程开始' : i === markCount - 1 ? '课程小结' : `第${i}个知识点`,
      type: i === 0 ? '知识点' : i === markCount - 1 ? '小结' : '重点',
      importance: i === 0 || i === markCount - 1 ? 8 : 6
    }))
  }

  private parseAudioMarks(response: string): AudioMark[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) return []

      const marks = JSON.parse(jsonMatch[0])
      if (!Array.isArray(marks)) return []

      return marks.map((m: any) => ({
        timestamp: Math.max(0, Math.floor(Number(m.timestamp) || 0)),
        content: String(m.content || '').substring(0, 100),
        type: '重点',
        importance: Math.min(10, Math.max(1, Math.floor(Number(m.importance) || 5))),
        summary: String(m.summary || m.content || '').substring(0, 200),
        keyPoints: Array.isArray(m.keyPoints) 
          ? m.keyPoints.map((p: any) => String(p).substring(0, 150)).slice(0, 3)
          : []
      }))
    } catch (error) {
      console.error('[Multimodal] Failed to parse audio marks:', error)
      return []
    }
  }

  private parseImageAnalysis(content: string): { content: string; type: string } {
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return { content: '', type: '板书' }

      const parsed = JSON.parse(jsonMatch[0])
      return {
        content: String(parsed.content || '').substring(0, 100),
        type: ['板书', '重点', '例题'].includes(parsed.type) ? parsed.type : '板书'
      }
    } catch (error) {
      console.error('[Multimodal] Failed to parse image analysis:', error)
      return { content: '', type: '板书' }
    }
  }

  private async downloadImageAsBase64(url: string): Promise<string> {
    // 本地文件路径
    if (url.startsWith('/uploads/') || url.startsWith('./uploads/')) {
      const filePath = path.join(process.cwd(), url.replace(/^\//, ''))
      const buffer = fs.readFileSync(filePath)
      return buffer.toString('base64')
    }

    // 远程URL
    const response = await fetch(url)
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer).toString('base64')
  }

  /**
   * 对齐板书图片与音频时间戳
   * 
   * 策略：
   * 1. 分析每张板书图片的内容
   * 2. 将图片内容与音频转录文本进行语义匹配
   * 3. 找到最相关的时间段，返回建议的时间戳
   * 
   * @param imageUrls 板书图片URL列表
   * @param audioTranscript 音频转录文本（带时间戳格式）
   * @param audioDuration 音频总时长（秒）
   * @returns 每张图片的建议时间戳（秒）
   */
  async alignBoardImagesWithAudio(
    imageUrls: string[],
    audioTranscript: string,
    audioDuration: number
  ): Promise<Array<{ imageUrl: string; timestamp: number; confidence: number; reason: string }>> {
    if (!dashscopeClient) {
      throw new Error('DASHSCOPE_API_KEY not configured')
    }

    if (!audioTranscript || audioTranscript.trim().length === 0) {
      console.log('[Align] No audio transcript, using uniform distribution')
      // 没有转录文本，均匀分布
      return imageUrls.map((url, index) => ({
        imageUrl: url,
        timestamp: Math.floor((index / Math.max(imageUrls.length - 1, 1)) * audioDuration * 0.8),
        confidence: 0.5,
        reason: '无音频转录，按顺序均匀分布'
      }))
    }

    console.log(`[Align] Aligning ${imageUrls.length} board images with audio transcript...`)
    const results: Array<{ imageUrl: string; timestamp: number; confidence: number; reason: string }> = []

    // 分批处理图片（避免请求过大）
    const batchSize = 3
    const batches = Math.ceil(imageUrls.length / batchSize)

    for (let batchIdx = 0; batchIdx < batches; batchIdx++) {
      const startIdx = batchIdx * batchSize
      const endIdx = Math.min((batchIdx + 1) * batchSize, imageUrls.length)
      const batchUrls = imageUrls.slice(startIdx, endIdx)

      try {
        // 构建消息内容：图片 + 音频转录文本
        const content: any[] = []
        
        // 添加图片
        for (const url of batchUrls) {
          const imageBase64 = await this.downloadImageAsBase64(url)
          content.push({
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
          })
        }

        // 添加提示词和音频转录文本
        content.push({
          type: 'text',
          text: `以上 ${batchUrls.length} 张图片是课堂板书照片。

以下是课堂音频的文字转录，包含时间戳：

${audioTranscript.substring(0, 8000)}

请分析每张板书图片的内容，并与音频转录文本进行匹配，找到图片内容与音频最相关的时间点。

返回 JSON 数组格式：
[
  {
    "imageIndex": 0,  // 图片序号，从0开始
    "timestamp": 120, // 建议的时间戳（秒），在 0 到 ${audioDuration} 之间
    "confidence": 0.85, // 匹配置信度 0-1
    "reason": "图片展示了XXX内容，与音频中2分钟左右讲解的XXX相关" // 匹配原因
  }
]

注意：
1. timestamp 必须是数字（秒），不要带单位
2. 置信度 0-1 之间，越高表示匹配越确定
3. 如果无法确定时间，返回 audioDuration * 0.1 * (imageIndex + 1) 作为估计值
4. 优先匹配图片中的关键词在音频转录中出现的时间点`
        })

        const response = await dashscopeClient.chat.completions.create({
          model: 'qwen3.5-flash',
          messages: [{ role: 'user', content }],
          temperature: 0.3
        })

        const responseText = response.choices[0]?.message?.content || ''
        const parsed = this.parseAlignmentResult(responseText, batchUrls, startIdx, audioDuration)
        
        results.push(...parsed)
        console.log(`[Align] Batch ${batchIdx + 1} complete: ${parsed.length} results`)

      } catch (error) {
        console.error(`[Align] Failed to align batch ${batchIdx + 1}:`, error)
        // 失败时使用均匀分布
        for (let i = 0; i < batchUrls.length; i++) {
          const idx = startIdx + i
          results.push({
            imageUrl: batchUrls[i],
            timestamp: Math.floor((idx / Math.max(imageUrls.length - 1, 1)) * audioDuration * 0.8),
            confidence: 0.3,
            reason: '对齐分析失败，使用默认值'
          })
        }
      }
    }

    console.log(`[Align] Alignment complete: ${results.length} results`)
    return results
  }

  /**
   * 解析时间对齐结果
   */
  private parseAlignmentResult(
    response: string, 
    batchUrls: string[], 
    offset: number,
    audioDuration: number
  ): Array<{ imageUrl: string; timestamp: number; confidence: number; reason: string }> {
    const results: Array<{ imageUrl: string; timestamp: number; confidence: number; reason: string }> = []
    
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.warn('[Align] No JSON array found in response')
        return this.fallbackAlignment(batchUrls, offset, audioDuration)
      }

      const parsed = JSON.parse(jsonMatch[0])
      if (!Array.isArray(parsed)) {
        console.warn('[Align] Response is not an array')
        return this.fallbackAlignment(batchUrls, offset, audioDuration)
      }

      for (const item of parsed) {
        const idx = Number(item.imageIndex)
        if (isNaN(idx) || idx < 0 || idx >= batchUrls.length) continue

        const timestamp = Math.max(0, Math.min(audioDuration, Number(item.timestamp) || 0))
        const confidence = Math.max(0, Math.min(1, Number(item.confidence) || 0.5))
        
        results.push({
          imageUrl: batchUrls[idx],
          timestamp,
          confidence,
          reason: String(item.reason || '基于内容匹配')
        })
      }

      // 如果解析结果数量不对，补充默认值
      if (results.length !== batchUrls.length) {
        const existingIndices = new Set(results.map(r => batchUrls.indexOf(r.imageUrl)))
        for (let i = 0; i < batchUrls.length; i++) {
          if (!existingIndices.has(i)) {
            results.push({
              imageUrl: batchUrls[i],
              timestamp: Math.floor(((offset + i) / Math.max(batchUrls.length + offset - 1, 1)) * audioDuration * 0.8),
              confidence: 0.3,
              reason: '解析失败，使用默认值'
            })
          }
        }
      }

    } catch (error) {
      console.error('[Align] Failed to parse alignment result:', error)
      return this.fallbackAlignment(batchUrls, offset, audioDuration)
    }
    
    return results
  }

  /**
   * 对齐失败的回退方案
   */
  private fallbackAlignment(
    batchUrls: string[], 
    offset: number, 
    audioDuration: number
  ): Array<{ imageUrl: string; timestamp: number; confidence: number; reason: string }> {
    return batchUrls.map((url, index) => ({
      imageUrl: url,
      timestamp: Math.floor(((offset + index) / Math.max(offset + batchUrls.length - 1, 1)) * audioDuration * 0.8),
      confidence: 0.3,
      reason: '解析失败，使用默认值'
    }))
  }
}

export const multimodalAnalyzer = new MultimodalAnalyzer()
export default multimodalAnalyzer
