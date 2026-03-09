/**
 * 示例测试文件
 * 验证测试框架是否正常工作
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'

// 简单的数学测试
describe('基础数学测试', () => {
  it('1 + 1 应该等于 2', () => {
    expect(1 + 1).toBe(2)
  })

  it('10 * 5 应该等于 50', () => {
    expect(10 * 5).toBe(50)
  })

  it('数组操作测试', () => {
    const arr = [1, 2, 3, 4, 5]
    expect(arr.length).toBe(5)
    expect(arr.filter(x => x > 3)).toEqual([4, 5])
  })
})

// 字符串测试
describe('字符串测试', () => {
  it('字符串反转', () => {
    const str = 'hello'
    expect(str.split('').reverse().join('')).toBe('olleh')
  })

  it('字符串模板', () => {
    const name = 'World'
    expect(`Hello, ${name}!`).toBe('Hello, World!')
  })
})

// 对象测试
describe('对象测试', () => {
  it('对象属性测试', () => {
    const obj = { name: 'test', value: 123 }
    expect(obj).toHaveProperty('name', 'test')
    expect(obj).toHaveProperty('value', 123)
  })

  it('对象合并', () => {
    const a = { x: 1 }
    const b = { y: 2 }
    expect({ ...a, ...b }).toEqual({ x: 1, y: 2 })
  })
})

// 异步测试
describe('异步测试', () => {
  it('Promise 测试', async () => {
    const promise = Promise.resolve('success')
    await expect(promise).resolves.toBe('success')
  })

  it('async/await 测试', async () => {
    const result = await Promise.resolve(42)
    expect(result).toBe(42)
  })
})

// 测试工具函数示例
describe('测试工具函数示例', () => {
  it('随机字符串生成', () => {
    const randomStr = Math.random().toString(36).substring(2, 10)
    expect(typeof randomStr).toBe('string')
    expect(randomStr.length).toBeGreaterThan(0)
  })

  it('生成测试课程数据', () => {
    const course = {
      name: `测试课程-${Math.random().toString(36).substring(2, 6)}`,
      type: 'PROFESSIONAL',
      status: 'STUDYING'
    }
    expect(course).toHaveProperty('name')
    expect(course.type).toBe('PROFESSIONAL')
  })
})
