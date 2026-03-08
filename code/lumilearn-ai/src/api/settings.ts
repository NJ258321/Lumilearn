// =====================================================
// P5 - 用户设置 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type {
  ApiResponse,
  UserSettingsResponse,
  UpdateSettingsRequest,
  DefaultSettingsResponse,
} from '../../types'

/**
 * 获取用户设置
 */
export async function getUserSettings(): Promise<ApiResponse<UserSettingsResponse>> {
  try {
    return await api.get<UserSettingsResponse>(API_CONFIG.endpoints.settings.base)
  } catch (error) {
    console.error('[settings] getUserSettings error:', error)
    return { success: false, error: '获取用户设置失败' }
  }
}

/**
 * 更新用户设置
 * @param data 更新信息
 */
export async function updateUserSettings(
  data: UpdateSettingsRequest
): Promise<ApiResponse<UserSettingsResponse>> {
  try {
    return await api.put<UserSettingsResponse>(API_CONFIG.endpoints.settings.base, data)
  } catch (error) {
    console.error('[settings] updateUserSettings error:', error)
    return { success: false, error: '更新用户设置失败' }
  }
}

/**
 * 获取默认设置
 */
export async function getDefaultSettings(): Promise<ApiResponse<DefaultSettingsResponse>> {
  try {
    return await api.get<DefaultSettingsResponse>(API_CONFIG.endpoints.settings.default)
  } catch (error) {
    console.error('[settings] getDefaultSettings error:', error)
    return { success: false, error: '获取默认设置失败' }
  }
}
