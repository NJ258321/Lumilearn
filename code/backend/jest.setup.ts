/**
 * Jest 全局设置
 * TEST-01: 测试框架搭建
 */

// 设置测试环境变量
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-jwt-secret-key'
process.env.DATABASE_URL = 'file:./dev.db'
process.env.GEMINI_API_KEY = 'test-api-key'
