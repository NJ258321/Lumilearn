/**
 * 测试工具函数
 * TEST-01: 测试框架搭建
 */

import request, { type SuperTest, type Test } from 'supertest'
import { jest } from '@jest/globals'

// ==================== 类型定义 ====================

/** API 测试响应类型 */
export interface ApiTestResponse {
  status: number
  body: any
}

/** 带认证的请求配置 */
export interface AuthRequestOptions {
  token?: string
  body?: any
  query?: Record<string, string>
}

/** 测试助手接口 */
export interface TestHelper {
  app: any
  agent: SuperTest<Test>
  token: string | null
}

// ==================== 认证辅助函数 ====================

/**
 * 生成测试用 JWT Token
 */
export function generateTestToken(payload: object = { userId: 'test-user-id' }): string {
  const jwt = require('jsonwebtoken')
  return jwt.sign(payload, process.env.JWT_SECRET || 'test-jwt-secret-key', {
    expiresIn: '1h'
  })
}

/**
 * 创建带认证的请求头
 */
export function createAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  return headers
}

// ==================== 请求辅助函数 ====================

/**
 * 发送 GET 请求
 */
export async function get(
  agent: SuperTest<Test>,
  url: string,
  options: AuthRequestOptions = {}
): Promise<ApiTestResponse> {
  const response = await agent
    .get(url)
    .set(createAuthHeaders(options.token))
    .query(options.query || {})

  return {
    status: response.status,
    body: response.body
  }
}

/**
 * 发送 POST 请求
 */
export async function post(
  agent: SuperTest<Test>,
  url: string,
  options: AuthRequestOptions = {}
): Promise<ApiTestResponse> {
  const response = await agent
    .post(url)
    .set(createAuthHeaders(options.token))
    .send(options.body || {})

  return {
    status: response.status,
    body: response.body
  }
}

/**
 * 发送 PUT 请求
 */
export async function put(
  agent: SuperTest<Test>,
  url: string,
  options: AuthRequestOptions = {}
): Promise<ApiTestResponse> {
  const response = await agent
    .put(url)
    .set(createAuthHeaders(options.token))
    .send(options.body || {})

  return {
    status: response.status,
    body: response.body
  }
}

/**
 * 发送 DELETE 请求
 */
export async function del(
  agent: SuperTest<Test>,
  url: string,
  options: AuthRequestOptions = {}
): Promise<ApiTestResponse> {
  const response = await agent
    .delete(url)
    .set(createAuthHeaders(options.token))

  return {
    status: response.status,
    body: response.body
  }
}

// ==================== 断言辅助函数 ====================

/**
 * 断言响应成功
 */
export function expectSuccess(response: ApiTestResponse, message?: string) {
  expect(response.status).toBeLessThan(400)
  expect(response.body.success).toBe(true)
  if (message) {
    expect(response.body).toHaveProperty('data')
  }
}

/**
 * 断言响应失败
 */
export function expectError(response: ApiTestResponse, expectedCode?: string) {
  expect(response.status).toBeGreaterThanOrEqual(400)
  expect(response.body.success).toBe(false)
  expect(response.body.error).toBeDefined()

  if (expectedCode) {
    expect(response.body.error.code || response.body.error).toContain(expectedCode)
  }
}

/**
 * 断言资源不存在
 */
export function expectNotFound(response: ApiTestResponse) {
  expect(response.status).toBe(404)
  expect(response.body.success).toBe(false)
}

/**
 * 断言未授权
 */
export function expectUnauthorized(response: ApiTestResponse) {
  expect(response.status).toBe(401)
  expect(response.body.success).toBe(false)
}

/**
 * 断言禁止访问
 */
export function expectForbidden(response: ApiTestResponse) {
  expect(response.status).toBe(403)
  expect(response.body.success).toBe(false)
}

/**
 * 断言验证失败
 */
export function expectValidationError(response: ApiTestResponse) {
  expect(response.status).toBe(400)
  expect(response.body.success).toBe(false)
}

/**
 * 断言数据存在
 */
export function expectDataExists(response: ApiTestResponse, dataPath?: string) {
  expect(response.body.success).toBe(true)

  if (dataPath) {
    const data = dataPath.split('.').reduce((obj: any, key) => obj?.[key], response.body)
    expect(data).toBeDefined()
  } else {
    expect(response.body.data).toBeDefined()
  }
}

/**
 * 断言数据列表
 */
export function expectDataList(response: ApiTestResponse) {
  expect(response.body.success).toBe(true)
  expect(response.body.data).toHaveProperty('items')
  expect(Array.isArray(response.body.data.items)).toBe(true)
}

/**
 * 断言分页响应
 */
export function expectPagination(response: ApiTestResponse) {
  expect(response.body.data).toHaveProperty('total')
  expect(response.body.data).toHaveProperty('page')
  expect(response.body.data).toHaveProperty('pageSize')
  expect(response.body.data).toHaveProperty('totalPages')
}

// ==================== 测试数据辅助函数 ====================

/**
 * 生成随机字符串
 */
export function randomString(length: number = 8): string {
  return Math.random().toString(36).substring(2, 2 + length)
}

/**
 * 生成测试用课程数据
 */
export function generateTestCourse(overrides: Record<string, any> = {}) {
  return {
    name: `测试课程-${randomString()}`,
    type: 'PROFESSIONAL',
    status: 'STUDYING',
    targetGrade: 'B',
    examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides
  }
}

/**
 * 生成测试用章节数据
 */
export function generateTestChapter(courseId: string, overrides: Record<string, any> = {}) {
  return {
    courseId,
    name: `测试章节-${randomString()}`,
    order: 1,
    ...overrides
  }
}

/**
 * 生成测试用知识点数据
 */
export function generateTestKnowledgePoint(chapterId: string, overrides: Record<string, any> = {}) {
  return {
    chapterId,
    name: `知识点-${randomString()}`,
    status: 'NEED_REVIEW',
    importance: 5,
    masteryScore: 60,
    ...overrides
  }
}

/**
 * 生成测试用用户数据
 */
export function generateTestUser(overrides: Record<string, any> = {}) {
  return {
    username: `user_${randomString()}`,
    email: `test_${randomString()}@example.com`,
    password: 'Test123456!',
    ...overrides
  }
}

// ==================== Mock 辅助函数 ====================

/**
 * 模拟 Prisma 客户端
 */
export function createMockPrisma() {
  return {
    course: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({})
    },
    chapter: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({})
    },
    knowledgePoint: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({})
    },
    $transaction: jest.fn().mockImplementation((fn) => fn(prisma))
  }
}

/**
 * 模拟 JWT 验证
 */
export function mockJwtValidation() {
  return jest.spyOn(require('jsonwebtoken'), 'verify')
}

/**
 * 模拟 bcrypt
 */
export function mockBcrypt() {
  return {
    hash: jest.fn().mockResolvedValue('hashed_password'),
    compare: jest.fn().mockResolvedValue(true)
  }
}
