import { API_CONFIG } from './request';

const API_BASE = API_CONFIG.baseURL;

/**
 * 检查 PPT 转换服务状态
 */
export async function checkPPTConverterStatus(): Promise<{
  success: boolean;
  data?: { available: boolean; message: string };
  error?: string;
}> {
  try {
    const response = await fetch(`${API_BASE}/api/ppt/status`);
    const data = await response.json();
    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * 转换 PPT 为图片
 * @param filePath 服务器上的 PPT 文件路径
 */
export async function convertPPT(
  filePath: string
): Promise<{
  success: boolean;
  data?: {
    pageCount: number;
    imageUrls: string[];
    message: string;
  };
  error?: string;
}> {
  try {
    const token = localStorage.getItem('lumilearn_token');
    const response = await fetch(`${API_BASE}/api/ppt/convert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify({ filePath })
    });
    const data = await response.json();
    return data;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
