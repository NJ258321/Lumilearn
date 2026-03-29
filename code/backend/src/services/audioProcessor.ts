/**
 * 音频处理服务
 * 支持音频分段、压缩
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'
import { randomUUID } from 'crypto'

const execAsync = promisify(exec)

interface AudioSegment {
  index: number
  startTime: number  // 秒
  endTime: number    // 秒
  filePath: string
  duration: number
}

class AudioProcessor {
  /**
   * 将音频分割成多个片段（每个不超过 maxSizeMB）
   * 使用 ffmpeg 按时间段分割
   */
  async splitAudio(
    inputPath: string, 
    totalDuration: number,
    maxSegmentDuration: number = 300  // 5分钟一段
  ): Promise<AudioSegment[]> {
    // 检查 ffmpeg 是否可用
    try {
      await execAsync('ffmpeg -version')
    } catch {
      throw new Error('ffmpeg not found. Please install ffmpeg.')
    }

    const segments: AudioSegment[] = []
    const numSegments = Math.ceil(totalDuration / maxSegmentDuration)
    
    console.log(`[AudioProcessor] Splitting audio into ${numSegments} segments`)

    const tempDir = path.join(process.cwd(), 'temp', randomUUID())
    fs.mkdirSync(tempDir, { recursive: true })

    try {
      for (let i = 0; i < numSegments; i++) {
        const startTime = i * maxSegmentDuration
        const endTime = Math.min((i + 1) * maxSegmentDuration, totalDuration)
        const duration = endTime - startTime
        
        const outputPath = path.join(tempDir, `segment_${i}.mp3`)
        
        // 使用 ffmpeg 提取片段，压缩为较低码率以减少大小
        // -ar 16000: 16kHz 采样率
        // -b:a 32k: 32kbps 码率
        const cmd = `ffmpeg -i "${inputPath}" -ss ${startTime} -t ${duration} -ar 16000 -b:a 32k -ac 1 "${outputPath}" -y`
        
        console.log(`[AudioProcessor] Extracting segment ${i + 1}/${numSegments}: ${startTime}s - ${endTime}s`)
        await execAsync(cmd)

        segments.push({
          index: i,
          startTime,
          endTime,
          filePath: outputPath,
          duration
        })
      }

      return segments
    } catch (error) {
      // 清理临时文件
      this.cleanup(tempDir)
      throw error
    }
  }

  /**
   * 压缩音频文件
   */
  async compressAudio(inputPath: string, outputPath: string): Promise<void> {
    try {
      await execAsync('ffmpeg -version')
    } catch {
      throw new Error('ffmpeg not found. Please install ffmpeg.')
    }

    // 压缩参数：16kHz, 32kbps, 单声道
    const cmd = `ffmpeg -i "${inputPath}" -ar 16000 -b:a 32k -ac 1 "${outputPath}" -y`
    await execAsync(cmd)
  }

  /**
   * 获取音频时长（秒）
   */
  async getDuration(filePath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`
      )
      return parseFloat(stdout.trim())
    } catch {
      return 0
    }
  }

  /**
   * 清理临时文件
   */
  cleanup(tempDir: string): void {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
    } catch (error) {
      console.error('[AudioProcessor] Cleanup failed:', error)
    }
  }

  /**
   * 读取文件并转为 base64
   */
  readAsBase64(filePath: string): string {
    return fs.readFileSync(filePath).toString('base64')
  }
}

export const audioProcessor = new AudioProcessor()
export default audioProcessor
