// =====================================================
// P5 - 用户认证 API 服务
// =====================================================

import { api, API_CONFIG } from './request'
import type {
  ApiResponse,
  AuthResponse,
  User,
  UserListResponse,
  RegisterRequest,
  LoginRequest,
  UpdatePasswordRequest,
  UpdateProfileRequest,
} from '../../types'

/**
 * 用户注册
 * @param data 注册信息
 */
export async function register(
  data: RegisterRequest
): Promise<ApiResponse<AuthResponse>> {
  try {
    return await api.post<AuthResponse>(API_CONFIG.endpoints.auth.register, data)
  } catch (error) {
    console.error('[auth] register error:', error)
    return { success: false, error: '注册失败' }
  }
}

/**
 * 用户登录
 * @param data 登录信息
 */
export async function login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
  try {
    const response = await api.post<any>(API_CONFIG.endpoints.auth.login, data)
    if (response.success && response.data) {
      // 后端返回格式: { success, data: {用户信息}, token }
      // 需要转换为前端期望格式: { success, data: { user, token } }
      return {
        success: true,
        data: {
          user: response.data,
          token: response.token
        }
      }
    }
    return { success: false, error: response.error || '登录失败' }
  } catch (error) {
    console.error('[auth] login error:', error)
    return { success: false, error: '登录失败' }
  }
}

/**
 * 调试登录 - 自动创建并登录默认用户
 */
export async function debugLogin(): Promise<ApiResponse<AuthResponse>> {
  try {
    const response = await api.post<any>(API_CONFIG.endpoints.auth.debugLogin, {})
    if (response.success && response.data) {
      // 后端返回格式: { success, data: {用户信息}, token }
      // 需要转换为前端期望格式: { success, data: { user, token } }
      return {
        success: true,
        data: {
          user: response.data,
          token: response.token
        }
      }
    }
    return { success: false, error: response.error || '调试登录失败' }
  } catch (error) {
    console.error('[auth] debug login error:', error)
    return { success: false, error: '调试登录失败' }
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  try {
    return await api.get<User>(API_CONFIG.endpoints.auth.me)
  } catch (error) {
    console.error('[auth] getCurrentUser error:', error)
    return { success: false, error: '获取用户信息失败' }
  }
}

/**
 * 更新用户信息
 * @param data 更新信息
 */
export async function updateProfile(
  data: UpdateProfileRequest
): Promise<ApiResponse<User>> {
  try {
    return await api.put<User>(API_CONFIG.endpoints.auth.profile, data)
  } catch (error) {
    console.error('[auth] updateProfile error:', error)
    return { success: false, error: '更新用户信息失败' }
  }
}

/**
 * 修改密码
 * @param data 密码信息
 */
export async function updatePassword(
  data: UpdatePasswordRequest
): Promise<ApiResponse<{ message: string }>> {
  try {
    return await api.put<{ message: string }>(API_CONFIG.endpoints.auth.password, data)
  } catch (error) {
    console.error('[auth] updatePassword error:', error)
    return { success: false, error: '修改密码失败' }
  }
}

/**
 * 获取用户列表（管理员）
 * @param page 页码
 * @param pageSize 每页数量
 */
export async function getUserList(
  page: number = 1,
  pageSize: number = 20
): Promise<ApiResponse<UserListResponse>> {
  try {
    return await api.get<UserListResponse>(API_CONFIG.endpoints.auth.users, {
      page,
      pageSize,
    })
  } catch (error) {
    console.error('[auth] getUserList error:', error)
    return { success: false, error: '获取用户列表失败' }
  }
}

/**
 * 删除用户（管理员）
 * @param userId 用户ID
 */
export async function deleteUser(
  userId: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.auth.users}/${userId}`
    return await api.delete<{ message: string }>(endpoint)
  } catch (error) {
    console.error('[auth] deleteUser error:', error)
    return { success: false, error: '删除用户失败' }
  }
}

/**
 * 更新用户角色（管理员）
 * @param userId 用户ID
 * @param role 用户角色
 */
export async function updateUserRole(
  userId: string,
  role: 'USER' | 'ADMIN'
): Promise<ApiResponse<User>> {
  try {
    const endpoint = `${API_CONFIG.endpoints.auth.userRole}/${userId}/role`
    return await api.put<User>(endpoint, { role })
  } catch (error) {
    console.error('[auth] updateUserRole error:', error)
    return { success: false, error: '更新用户角色失败' }
  }
}

// ========== Token 管理 ==========

const TOKEN_KEY = 'lumilearn_token'
const USER_KEY = 'lumilearn_user'

/**
 * 保存 token 到本地存储
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/**
 * 获取本地存储的 token
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * 清除 token
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

/**
 * 保存用户信息到本地存储
 */
export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

/**
 * 获取本地存储的用户信息
 */
export function getUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY)
  if (userStr) {
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }
  return null
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return !!getToken()
}

/**
 * 初始化认证状态（从存储恢复）
 */
export function initAuth(): { token: string | null; user: User | null } {
  return {
    token: getToken(),
    user: getUser(),
  }
}
