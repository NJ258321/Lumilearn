/**
 * Jest 配置文件
 * TEST-01: 测试框架搭建
 */

export default {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],

  // 忽略文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // 转换器配置
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      diagnostics: {
        ignoreCodes: ['TS2353', 'TS2551']
      }
    }]
  },

  // 模块名称映射（支持 ESM）
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^uuid$': 'uuid'
  },

  // 忽略某些模块的转换
  transformIgnorePatterns: [
    'node_modules/(?!(uuid)/)'
  ],

  // 设置文件
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // 测试超时时间
  testTimeout: 10000
}
