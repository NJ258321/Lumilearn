/**
 * Health Check API 测试
 * 验证基本 API 是否正常工作
 * 使用直接启动服务器的方式测试
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

// 测试 HTTP 客户端
const http = require('http')

// 测试配置
const BASE_URL = 'http://localhost:3000'

describe('Health Check API 测试', () => {
  it('GET /health - 应该返回服务健康状态', async () => {
    const response = await fetch(`${BASE_URL}/health`)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('status', 'ok')
    expect(data).toHaveProperty('timestamp')
    expect(data).toHaveProperty('uptime')
  })

  it('GET /health - 返回的时间戳应该是有效的', async () => {
    const response = await fetch(`${BASE_URL}/health`)
    const data = await response.json()
    const timestamp = new Date(data.timestamp)

    expect(timestamp.getTime()).toBeGreaterThan(0)
  })
})

describe('404 错误处理测试', () => {
  it('GET /api/not-exist - 应该返回 404 错误', async () => {
    const response = await fetch(`${BASE_URL}/api/not-exist`)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data).toHaveProperty('success', false)
    expect(data).toHaveProperty('error')
  })

  it('GET /api/not-exist - 应该包含错误码', async () => {
    const response = await fetch(`${BASE_URL}/api/not-exist`)
    const data = await response.json()

    expect(data.error).toHaveProperty('code')
    expect(data.error.code).toBe('1003')
  })
})

describe('课程列表 API 测试', () => {
  it('GET /api/courses - 应该返回课程列表', async () => {
    const response = await fetch(`${BASE_URL}/api/courses`)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBe(true)
  })
})
