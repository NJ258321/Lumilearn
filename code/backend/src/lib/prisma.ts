import { PrismaClient } from '@prisma/client'

// 创建 Prisma 客户端实例
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
})

// 处理进程退出时的 Prisma 连接关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma
