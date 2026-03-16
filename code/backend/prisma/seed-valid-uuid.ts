// =====================================================
// 课程数据种子脚本 - 使用有效的RFC 4122 UUID
// =====================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 有效的UUID课程
const courses = [
  { id: '6cbf66eb-05e3-4118-ae24-bdeb41221801', name: '高等数学', status: 'STUDYING', type: 'PROFESSIONAL', semester: '2024-2025-1', examDate: new Date('2026-06-15'), targetGrade: 'A' },
  { id: '6cbf66eb-05e3-4118-ae24-bdeb41221802', name: '程序设计', status: 'REVIEWING', type: 'PROFESSIONAL', semester: '2024-2025-1', examDate: new Date('2026-04-15'), reviewStartDate: new Date('2026-03-01'), targetGrade: 'A' },
  { id: '6cbf66eb-05e3-4118-ae24-bdeb41221803', name: '思想道德与法治', status: 'REVIEWING', type: 'ELECTIVE', semester: '2024-2025-1', examDate: new Date('2026-05-05'), reviewStartDate: new Date('2026-03-10'), targetGrade: 'B' },
  { id: '6cbf66eb-05e3-4118-ae24-bdeb41221804', name: '线性代数', status: 'ARCHIVED', type: 'PROFESSIONAL', semester: '2024-2025-1', examDate: new Date('2026-02-15'), targetGrade: 'A' },
  { id: '6cbf66eb-05e3-4118-ae24-bdeb41221805', name: '普通测量学', status: 'STUDYING', type: 'PROFESSIONAL', semester: '2024-2025-1', examDate: new Date('2026-06-20'), targetGrade: 'B' },
  { id: '6cbf66eb-05e3-4118-ae24-bdeb41221806', name: '中国近现代史纲要', status: 'STUDYING', type: 'ELECTIVE', semester: '2024-2025-1', examDate: new Date('2026-06-25'), targetGrade: 'B' },
]

function uuid4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

async function main() {
  console.log('========================================')
  console.log('开始添加课程数据 (有效UUID)...')
  console.log('========================================\n')

  // 1. 创建课程
  for (const courseData of courses) {
    await prisma.course.upsert({
      where: { id: courseData.id },
      update: {},
      create: courseData,
    })
    console.log(`✓ 创建课程: ${courseData.name}`)
  }

  // 2. 创建章节和知识点
  const chaptersConfig = {
    '6cbf66eb-05e3-4118-ae24-bdeb41221801': [ // 高等数学
      { name: '第一章：函数与极限', kps: 8 },
      { name: '第二章：导数与微分', kps: 7 },
      { name: '第三章：微分中值定理', kps: 6 },
      { name: '第四章：不定积分', kps: 5 },
      { name: '第五章：定积分', kps: 6 },
      { name: '第六章：定积分应用', kps: 5 },
      { name: '第七章：微分方程', kps: 5 },
    ],
    '6cbf66eb-05e3-4118-ae24-bdeb41221802': [ // 程序设计
      { name: '第一章：程序设计基础', kps: 5 },
      { name: '第二章：顺序结构', kps: 4 },
      { name: '第三章：选择结构', kps: 5 },
      { name: '第四章：循环结构', kps: 6 },
      { name: '第五章：函数与模块', kps: 5 },
      { name: '第六章：数组', kps: 5 },
      { name: '第七章：指针', kps: 5 },
      { name: '第八章：结构体', kps: 4 },
      { name: '第九章：文件操作', kps: 4 },
    ],
    '6cbf66eb-05e3-4118-ae24-bdeb41221803': [ // 思想道德与法治
      { name: '第一章：人生观', kps: 4 },
      { name: '第二章：理想信念', kps: 4 },
      { name: '第三章：中国精神', kps: 4 },
      { name: '第四章：社会主义核心价值观', kps: 4 },
      { name: '第五章：道德本质', kps: 4 },
      { name: '第六章：法治思维', kps: 4 },
      { name: '第七章：法治实践', kps: 4 },
    ],
    '6cbf66eb-05e3-4118-ae24-bdeb41221804': [ // 线性代数
      { name: '第一章：行列式', kps: 6 },
      { name: '第二章：矩阵', kps: 6 },
      { name: '第三章：向量组', kps: 5 },
      { name: '第四章：线性方程组', kps: 5 },
      { name: '第五章：特征值与特征向量', kps: 5 },
      { name: '第六章：二次型', kps: 4 },
    ],
    '6cbf66eb-05e3-4118-ae24-bdeb41221805': [ // 普通测量学
      { name: '第一章：测量学基础知识', kps: 5 },
      { name: '第二章：水准测量', kps: 5 },
      { name: '第三章：角度测量', kps: 5 },
      { name: '第四章：距离测量', kps: 5 },
      { name: '第五章：测量误差理论', kps: 5 },
      { name: '第六章：控制测量', kps: 5 },
      { name: '第七章：地形图测绘', kps: 5 },
    ],
    '6cbf66eb-05e3-4118-ae24-bdeb41221806': [ // 中国近现代史纲要
      { name: '第一章：反对外国侵略的斗争', kps: 4 },
      { name: '第二章：对国家出路的早期探索', kps: 4 },
      { name: '第三章：辛亥革命', kps: 4 },
      { name: '第四章：开天辟地的大事变', kps: 4 },
      { name: '第五章：中国革命的新道路', kps: 4 },
      { name: '第六章：中华民族的抗日战争', kps: 4 },
      { name: '第七章：为新中国而奋斗', kps: 4 },
      { name: '第八章：社会主义建设在探索中前进', kps: 4 },
    ],
  }

  let totalChapters = 0, totalKps = 0

  for (const course of courses) {
    const chapters = chaptersConfig[course.id]
    for (let i = 0; i < chapters.length; i++) {
      const chapterId = uuid4()
      const chapter = chapters[i]

      await prisma.chapter.create({
        data: {
          id: chapterId,
          courseId: course.id,
          name: chapter.name,
          order: i + 1,
        }
      })
      totalChapters++

      // 创建知识点
      for (let j = 0; j < chapter.kps; j++) {
        const statuses = ['MASTERED', 'WEAK', 'NEED_REVIEW']
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const masteryScore = status === 'MASTERED' ? 70 + Math.floor(Math.random() * 30) :
                            status === 'WEAK' ? 30 + Math.floor(Math.random() * 25) :
                            20 + Math.floor(Math.random() * 30)

        await prisma.knowledgePoint.create({
          data: {
            id: uuid4(),
            chapterId,
            name: `知识点 ${j + 1}`,
            status,
            importance: 5 + Math.floor(Math.random() * 6),
            masteryScore,
          }
        })
        totalKps++
      }
    }
  }

  console.log(`✓ 创建了 ${totalChapters} 个章节, ${totalKps} 个知识点`)

  // 统计
  console.log('\n========================================')
  console.log('✅ 数据添加完成！')
  console.log('========================================\n')

  for (const course of courses) {
    const kps = await prisma.knowledgePoint.count({
      where: { chapter: { courseId: course.id } }
    })
    const mastered = await prisma.knowledgePoint.count({
      where: { chapter: { courseId: course.id }, status: 'MASTERED' }
    })
    const progress = kps > 0 ? Math.round((mastered / kps) * 100) : 0
    console.log(`- ${course.name}: ${kps}知识点, 掌握${mastered}, 进度${progress}%`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
