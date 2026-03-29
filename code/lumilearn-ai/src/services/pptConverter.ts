/**
 * PPT 转图片服务
 * 将 PPT/PPTX 文件转换为图片数组
 * 
 * 注意：前端转换有局限性，复杂 PPT 可能无法完美渲染
 * 考虑使用后端方案：LibreOffice 或 python-pptx
 */

import parse from 'pptx-parser'

export interface PPTSlide {
  pageNumber: number
  imageUrl: string  // base64 data URL
  textContent: string
}

/**
 * 将 PPT 文件转换为图片
 * @param file PPT 文件
 * @returns 图片数组
 */
export async function convertPPTToImages(file: File): Promise<PPTSlide[]> {
  console.log('[PPTConverter] Starting conversion:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB')
  
  try {
    console.log('[PPTConverter] Parsing file...')
    
    // 使用 pptx-parser 直接解析 File 对象
    const result: any = await parse(file)
    console.log('[PPTConverter] Parse result:', result)
    
    if (!result || !result.slides) {
      console.error('[PPTConverter] No slides found in result:', result)
      throw new Error('No slides found in PPT')
    }
    
    console.log('[PPTConverter] Parsed slides:', result.slides.length)
        
        const slides: PPTSlide[] = []
        
        // 遍历每一页
        for (let i = 0; i < (result.slides?.length || 0); i++) {
          const slide = result.slides[i]
          
          // 创建 canvas 将幻灯片转为图片
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) continue

          // 设置画布尺寸 (16:9 比例)
          canvas.width = 1280
          canvas.height = 720

          // 填充白色背景
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // 绘制文本内容（简化版，实际可能需要更复杂的渲染）
          ctx.fillStyle = '#333333'
          ctx.font = 'bold 32px Arial'
          
          // 提取文本
          let textContent = ''
          if (slide.texts && slide.texts.length > 0) {
            textContent = slide.texts.join('\n')
            // 在 canvas 上绘制文本（简单处理）
            const lines = textContent.split('\n').slice(0, 10) // 最多10行
            lines.forEach((line, idx) => {
              ctx.fillText(line.substring(0, 50), 50, 80 + idx * 40) // 截断长文本
            })
          }

          // 转换为 base64
          const imageUrl = canvas.toDataURL('image/jpeg', 0.8)
          
          slides.push({
            pageNumber: i + 1,
            imageUrl,
            textContent: textContent.substring(0, 500) // 限制文本长度
          })
        }

        console.log('[PPTConverter] Conversion complete:', slides.length, 'slides')
        return slides
        
  } catch (error) {
    console.error('[PPTConverter] Conversion failed:', error)
    throw error
  }
}

/**
 * 将 PPT 文件上传到服务器并保存
 * 同时返回转换后的图片
 */
export async function processPPTFile(
  file: File, 
  uploadFn: (file: File) => Promise<{ url: string; originalName: string }>
): Promise<{ documentUrl: string; slides: PPTSlide[]; originalName: string }> {
  // 并行执行：上传原文件 + 转换为图片
  const [uploadResult, slides] = await Promise.all([
    uploadFn(file),
    convertPPTToImages(file).catch(err => {
      console.warn('[PPTConverter] Image conversion failed:', err)
      return [] as PPTSlide[]
    })
  ])

  return {
    documentUrl: uploadResult.url,
    slides,
    originalName: uploadResult.originalName
  }
}
