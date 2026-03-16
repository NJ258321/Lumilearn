import { api as apiClient } from '../src/api/request'

const systemInstruction = `You are an intelligent AI tutor for university students.
Your name is "Lumi".
Your goal is to help students review efficiently, explain complex concepts simply, and identify knowledge gaps.
Keep responses concise, encouraging, and structured.
If asked about a specific study plan, suggest a "Time Machine" review session for weak points.`

interface ChatResponse {
  message: string
  timestamp: string
}

export const sendChatMessage = async (message: string): Promise<string> => {
  try {
    const response = await apiClient.request<ChatResponse>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        systemInstruction
      })
    })

    if (response.success && response.data) {
      return response.data.message
    }

    return response.error || '抱歉，我现在无法回答，请稍后重试。'
  } catch (error) {
    console.error('AI Chat Error:', error)
    return '抱歉，连接服务器失败，请检查网络后重试。'
  }
}
