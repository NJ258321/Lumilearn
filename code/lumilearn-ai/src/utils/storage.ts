// =====================================================
// Storage Utils - 本地存储工具
// 统一的缓存管理，包括清除和重试逻辑
// =====================================================

// 存储键前缀
const STORAGE_PREFIX = 'lumilearn_'

// 需要清除的缓存键列表
const CACHE_KEYS = [
  'token',
  'user',
  'courses',
  'knowledgePoints',
  'studyRecords',
  'dashboard',
  'todayReview',
  'recommendations',
]

/**
 * 清除所有应用缓存
 */
export function clearAllCache(): void {
  // 清除 localStorage
  CACHE_KEYS.forEach(key => {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
    localStorage.removeItem(key)
  })

  // 清除所有以 lumilearn_ 开头的项
  const keysToRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key))

  // 清除 sessionStorage
  sessionStorage.clear()

  console.log('[Storage] All cache cleared')
}

/**
 * 清除认证相关缓存（退出登录时调用）
 */
export function clearAuthCache(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('refreshToken')
  sessionStorage.clear()
  console.log('[Storage] Auth cache cleared')
}

/**
 * 保存数据到本地缓存（带过期时间）
 */
export function setCache<T>(key: string, data: T, expireMinutes: number = 30): void {
  const expireTime = Date.now() + expireMinutes * 60 * 1000
  const cacheData = {
    data,
    expireTime,
  }
  localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(cacheData))
}

/**
 * 从本地缓存获取数据
 */
export function getCache<T>(key: string): T | null {
  const cacheStr = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
  if (!cacheStr) return null

  try {
    const cacheData = JSON.parse(cacheStr)
    if (Date.now() > cacheData.expireTime) {
      // 已过期，清除
      localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
      return null
    }
    return cacheData.data as T
  } catch {
    return null
  }
}

/**
 * 带重试的异步操作
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.warn(`[Retry] Attempt ${i + 1} failed:`, lastError.message)

      // 如果不是网络错误，不重试
      if (!isNetworkError(error)) {
        throw error
      }

      // 等待后重试
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (i + 1)))
      }
    }
  }

  throw lastError
}

/**
 * 判断是否为网络错误
 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  if (error instanceof Error) {
    return error.message.includes('network') ||
           error.message.includes('NetworkError') ||
           error.message.includes('Failed to fetch')
  }
  return false
}

/**
 * 检查网络状态
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * 网络状态变化监听
 */
export function onNetworkStatusChange(callback: (online: boolean) => void): () => void {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // 初始检查
  callback(navigator.onLine)

  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}
