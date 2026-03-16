// 清理重复的课程数据
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 删除旧的重复课程（UUID格式的ID）
  const oldCourses = [
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
  ]

  console.log('Deleting old duplicate courses...')

  for (const id of oldCourses) {
    try {
      await prisma.course.delete({ where: { id } })
      console.log('✓ Deleted:', id)
    } catch (e) {
      console.log('○ Not found:', id)
    }
  }

  // 统计剩余课程
  const courses = await prisma.course.findMany({
    include: { chapters: true, _count: { select: { chapters: true } } }
  })

  console.log('\n📊 Remaining courses:', courses.length)
  courses.forEach(c => console.log(`- ${c.name} (${c.status}) - ${c._count.chapters} chapters`))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
