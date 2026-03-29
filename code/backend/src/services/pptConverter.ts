/**
 * PPT 转换服务
 * 将 PPT 转换为 PDF 供前端显示
 */

import { execFile } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMP_DIR = path.join(process.cwd(), 'temp', 'ppt');

// 缓存找到的 Python 路径
let pythonPathCache: string | null = null;

// 查找可用的 Python 解释器
async function findPython(): Promise<string | null> {
  if (pythonPathCache) return pythonPathCache;
  
  const candidates = process.platform === 'win32' ? [
    'C:\\ProgramData\\Anaconda3\\python.exe',
    'python',
    'python3',
    'py',
  ] : [
    'python3',
    'python',
  ];
  
  for (const cmd of candidates) {
    try {
      await new Promise<void>((resolve, reject) => {
        execFile(cmd, ['--version'], { timeout: 5000 }, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
      pythonPathCache = cmd;
      return cmd;
    } catch {
      // 继续尝试下一个
    }
  }
  
  return null;
}

/**
 * 将 PPT 转换为 PDF
 * 使用 LibreOffice 或 python-pptx + 渲染
 */
export async function convertPPTToPDF(pptPath: string, outputDir: string): Promise<string> {
  const pythonCmd = await findPython();
  if (!pythonCmd) {
    throw new Error('Python not found');
  }

  // 使用 LibreOffice 转换（效果最好）
  try {
    const pdfPath = await convertWithLibreOffice(pptPath, outputDir);
    if (pdfPath) return pdfPath;
  } catch (e) {
    console.warn('[PPTConverter] LibreOffice failed:', e);
  }

  // 备用方案：提示用户
  throw new Error('PPT to PDF conversion failed. Please install LibreOffice.');
}

async function convertWithLibreOffice(pptPath: string, outputDir: string): Promise<string | null> {
  const { exec } = require('child_process');
  
  return new Promise((resolve, reject) => {
    // 查找 LibreOffice
    const libreOfficeCmd = process.platform === 'win32' 
      ? 'soffice.exe' 
      : 'libreoffice';
    
    const cmd = `${libreOfficeCmd} --headless --convert-to pdf --outdir "${outputDir}" "${pptPath}"`;
    
    exec(cmd, { timeout: 120000 }, async (error: any, stdout: string, stderr: string) => {
      if (error) {
        reject(error);
        return;
      }
      
      // 查找生成的 PDF
      const baseName = path.basename(pptPath, path.extname(pptPath));
      const pdfPath = path.join(outputDir, `${baseName}.pdf`);
      
      try {
        await fs.access(pdfPath);
        resolve(pdfPath);
      } catch {
        reject(new Error('PDF file not found'));
      }
    });
  });
}

/**
 * 检查转换服务是否可用
 */
export async function isConverterAvailable(): Promise<boolean> {
  const pythonCmd = await findPython();
  return !!pythonCmd;
}
