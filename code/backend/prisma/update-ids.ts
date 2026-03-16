// 将课程ID更新为有效的UUID格式
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 课程ID映射：旧ID -> 新UUID
const courseIdMap: Record<string, string> = {
  'course-001': 'c0010001-0000-0000-0000-000000000001',
  'course-002': 'c0010002-0000-0000-0000-000000000002',
  'course-003': 'c0010003-0000-0000-0000-000000000003',
  'course-004': 'c0010004-0000-0000-0000-000000000004',
  'course-005': 'c0010005-0000-0000-0000-000000000005',
  'course-006': 'c0010006-0000-0000-0000-000000000006',
}

// 章节ID映射
const chapterIdMap: Record<string, string> = {}
const knowledgePointIdMap: Record<string, string> = {}

function generateUUID(prefix: string): string {
  const uuid = '00000000-0000-0000-0000-000000000000'.replace(/0/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  )
  return `${prefix}-${uuid.slice(prefix.length)}`
}

async function main() {
  console.log('Updating course IDs to UUID format...\n')

  // 1. 获取所有课程
  const courses = await prisma.course.findMany({
    include: {
      chapters: {
        include: { knowledgePoints: true }
      }
    }
  })

  console.log(`Found ${courses.length} courses`)

  for (const course of courses) {
    const newCourseId = courseIdMap[course.id]
    if (!newCourseId) {
      console.log(`Skipping unknown course: ${course.id}`)
      continue
    }

    console.log(`\nProcessing: ${course.name} (${course.id} -> ${newCourseId})`)

    // 更新章节
    for (const chapter of course.chapters) {
      const newChapterId = `ch-${newCourseId.slice(0, 8)}-${chapter.order.toString().padStart(2, '0')}`
      chapterIdMap[chapter.id] = newChapterId

      // 更新章节的 courseId
      await prisma.chapter.update({
        where: { id: chapter.id },
        data: { id: newChapterId, courseId: newCourseId }
      })

      // 更新知识点
      for (const kp of chapter.knowledgePoints) {
        const newKpId = `kp-${newChapterId.slice(3, 11)}-${kp.name.charCodeAt(0).toString(16)}`
        knowledgePointIdMap[kp.id] = newKpId

        await prisma.knowledgePoint.update({
          where: { id: kp.id },
          data: { id: newKpId, chapterId: newChapterId }
        })
      }
    }

    // 更新课程ID
    await prisma.course.update({
      where: { id: course.id },
      data: { id: newCourseId }
    })

    console.log(`✓ Updated: ${course.name}`)
  }

  // 验证
  console.log('\n========================================')
  console.log('Verifying updated courses:')
  const updatedCourses = await prisma.course.findMany({
    include: {
      chapters: true,
      _count: { select: { chapters: true, knowledgePoints: true } }
    }
  })

  for (const c of updatedCourses) {
    console.log(`- ${c.name}: ${c.id}, ${c._count.chapters} chapters, ${c._count.knowledgePoints} KPs`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
