// =====================================================
// 清理数据库脚本
// 运行命令: npx tsx prisma/clear.ts
// =====================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始清理数据库...')

  // 按依赖顺序删除
  await prisma.timeMark.deleteMany()
  console.log('✓ 已删除时间标记')

  await prisma.studyRecord.deleteMany()
  console.log('✓ 已删除学习记录')

  await prisma.knowledgePoint.deleteMany()
  console.log('✓ 已删除知识点')

  await prisma.chapter.deleteMany()
  console.log('✓ 已删除章节')

  await prisma.course.deleteMany()
  console.log('✓ 已删除课程')

  console.log('\n✅ 数据库清理完成！')
}

main()
  .catch((e) => {
    console.error('清理失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
