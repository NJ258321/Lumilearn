// =====================================================
// P5 - 学习提醒 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import { isLoggedIn, debugLogin, setToken, setUser } from './auth'
import type {
  ApiResponse,
  Reminder,
  ReminderListResponse,
  TodayRemindersResponse,
  CreateReminderRequest,
  UpdateReminderRequest,
  CompleteReminderResponse,
} from '../../types'

/**
 * 创建提醒
 * @param data 提醒信息
 */
export async function createReminder(
  data: CreateReminderRequest
): Promise<ApiResponse<Reminder>> {
  try {
    return await api.post<Reminder>(API_CONFIG.endpoints.reminders.base, data)
  } catch (error) {
    console.error('[reminders] createReminder error:', error)
    return { success: false, error: '创建提醒失败' }
  }
}

/**
 * 获取提醒列表
 * @param status 筛选状态
 * @param type 筛选类型
 * @param page 页码
 * @param pageSize 每页数量
 */
export async function getReminderList(
  status?: string,
  type?: string,
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<ReminderListResponse>> {
  try {
    const params: Record<string, unknown> = { page, pageSize }
    if (status) params.status = status
    if (type) params.type = type
    return await api.get<ReminderListResponse>(API_CONFIG.endpoints.reminders.base, params)
  } catch (error) {
    console.error('[reminders] getReminderList error:', error)
    return { success: false, error: '获取提醒列表失败' }
  }
}

/**
 * 获取今日提醒 - 自动确保登录
 */
export async function getTodayReminders(): Promise<ApiResponse<TodayRemindersResponse>> {
  // 确保已登录
  if (!isLoggedIn()) {
    console.log('[reminders] 未登录，自动登录...')
    const result = await debugLogin()
    if (result.success && result.data) {
      setToken(result.data.token)
      setUser(result.data.user)
    }
  }

  try {
    return await api.get<TodayRemindersResponse>(API_CONFIG.endpoints.reminders.today)
  } catch (error) {
    console.error('[reminders] getTodayReminders error:', error)
    return { success: false, error: '获取今日提醒失败' }
  }
}

/**
 * 获取单个提醒
 * @param id 提醒ID
 */
export async function getReminder(id: string): Promise<ApiResponse<Reminder>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.reminders.base}/${id}`
    return await api.get<Reminder>(endpoint)
  } catch (error) {
    console.error('[reminders] getReminder error:', error)
    return { success: false, error: '获取提醒详情失败' }
  }
}

/**
 * 更新提醒
 * @param id 提醒ID
 * @param data 更新信息
 */
export async function updateReminder(
  id: string,
  data: UpdateReminderRequest
): Promise<ApiResponse<Reminder>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.reminders.base}/${id}`
    return await api.put<Reminder>(endpoint, data)
  } catch (error) {
    console.error('[reminders] updateReminder error:', error)
    return { success: false, error: '更新提醒失败' }
  }
}

/**
 * 删除提醒
 * @param id 提醒ID
 */
export async function deleteReminder(
  id: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.reminders.base}/${id}`
    return await api.delete<{ message: string }>(endpoint)
  } catch (error) {
    console.error('[reminders] deleteReminder error:', error)
    return { success: false, error: '删除提醒失败' }
  }
}

/**
 * 标记提醒完成
 * @param id 提醒ID
 */
export async function completeReminder(
  id: string
): Promise<ApiResponse<CompleteReminderResponse>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.reminders.complete}/${id}/complete`
    return await api.post<CompleteReminderResponse>(endpoint)
  } catch (error) {
    console.error('[reminders] completeReminder error:', error)
    return { success: false, error: '标记提醒完成失败' }
  }
}

/**
 * 批量删除提醒
 * @param ids 提醒ID列表
 */
export async function batchDeleteReminders(
  ids: string[]
): Promise<ApiResponse<{ deleted: number; requested: number }>> {
  try {
    return await api.post<{ deleted: number; requested: number }>(
      API_CONFIG.endpoints.reminders.batchDelete,
      { ids }
    )
  } catch (error) {
    console.error('[reminders] batchDeleteReminders error:', error)
    return { success: false, error: '批量删除提醒失败' }
  }
}
