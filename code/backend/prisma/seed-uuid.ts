// =====================================================
// 课程数据种子脚本 - 使用有效的UUID格式
// 运行命令: npx tsx prisma/seed-uuid.ts
// =====================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 使用有效的UUID
const courses = [
  { id: 'c0010001-0000-0000-0000-000000000001', name: '高等数学', status: 'STUDYING', type: 'PROFESSIONAL', semester: '2024-2025-1', examDate: new Date('2026-06-15'), targetGrade: 'A' },
  { id: 'c0010002-0000-0000-0000-000000000002', name: '程序设计', status: 'REVIEWING', type: 'PROFESSIONAL', semester: '2024-2025-1', examDate: new Date('2026-04-15'), reviewStartDate: new Date('2026-03-01'), targetGrade: 'A' },
  { id: 'c0010003-0000-0000-0000-000000000003', name: '思想道德与法治', status: 'REVIEWING', type: 'ELECTIVE', semester: '2024-2025-1', examDate: new Date('2026-05-05'), reviewStartDate: new Date('2026-03-10'), targetGrade: 'B' },
  { id: 'c0010004-0000-0000-0000-000000000004', name: '线性代数', status: 'ARCHIVED', type: 'PROFESSIONAL', semester: '2024-2025-1', examDate: new Date('2026-02-15'), targetGrade: 'A' },
  { id: 'c0010005-0000-0000-0000-000000000005', name: '普通测量学', status: 'STUDYING', type: 'PROFESSIONAL', semester: '2024-2025-1', examDate: new Date('2026-06-20'), targetGrade: 'B' },
  { id: 'c0010006-0000-0000-0000-000000000006', name: '中国近现代史纲要', status: 'STUDYING', type: 'ELECTIVE', semester: '2024-2025-1', examDate: new Date('2026-06-25'), targetGrade: 'B' },
]

// 章节数据
const chaptersData: Record<string, { id: string, courseId: string, name: string, order: number }[]> = {
  'c0010001-0000-0000-0000-000000000001': [ // 高等数学
    { id: 'ch0101001-0000-0000-0000-000000000001', courseId: 'c0010001-0000-0000-0000-000000000001', name: '第一章：函数与极限', order: 1 },
    { id: 'ch0101002-0000-0000-0000-000000000002', courseId: 'c0010001-0000-0000-0000-000000000001', name: '第二章：导数与微分', order: 2 },
    { id: 'ch0101003-0000-0000-0000-000000000003', courseId: 'c0010001-0000-0000-0000-000000000001', name: '第三章：微分中值定理与导数应用', order: 3 },
    { id: 'ch0101004-0000-0000-0000-000000000004', courseId: 'c0010001-0000-0000-0000-000000000001', name: '第四章：不定积分', order: 4 },
    { id: 'ch0101005-0000-0000-0000-000000000005', courseId: 'c0010001-0000-0000-0000-000000000001', name: '第五章：定积分', order: 5 },
    { id: 'ch0101006-0000-0000-0000-000000000006', courseId: 'c0010001-0000-0000-0000-000000000001', name: '第六章：定积分应用', order: 6 },
    { id: 'ch0101007-0000-0000-0000-000000000007', courseId: 'c0010001-0000-0000-0000-000000000001', name: '第七章：微分方程', order: 7 },
  ],
  'c0010002-0000-0000-0000-000000000002': [ // 程序设计
    { id: 'ch0102001-0000-0000-0000-000000000001', courseId: 'c0010002-0000-0000-0000-000000000002', name: '第一章：程序设计基础', order: 1 },
    { id: 'ch0102002-0000-0000-0000-000000000002', courseId: 'c0010002-0000-0000-0000-000000000002', name: '第二章：顺序结构', order: 2 },
    { id: 'ch0102003-0000-0000-0000-000000000003', courseId: 'c0010002-0000-0000-0000-000000000002', name: '第三章：选择结构', order: 3 },
    { id: 'ch0102004-0000-0000-0000-000000000004', courseId: 'c0010002-0000-0000-0000-000000000002', name: '第四章：循环结构', order: 4 },
    { id: 'ch0102005-0000-0000-0000-000000000005', courseId: 'c0010002-0000-0000-0000-000000000002', name: '第五章：函数与模块', order: 5 },
    { id: 'ch0102006-0000-0000-0000-000000000006', courseId: 'c0010002-0000-0000-0000-000000000002', name: '第六章：数组', order: 6 },
    { id: 'ch0102007-0000-0000-0000-000000000007', courseId: 'c0010002-0000-0000-0000-000000000002', name: '第七章：指针', order: 7 },
    { id: 'ch0102008-0000-0000-0000-000000000008', courseId: 'c0010002-0000-0000-0000-000000000002', name: '第八章：结构体', order: 8 },
    { id: 'ch0102009-0000-0000-0000-000000000009', courseId: 'c0010002-0000-0000-0000-000000000002', name: '第九章：文件操作', order: 9 },
  ],
  'c0010003-0000-0000-0000-000000000003': [ // 思想道德与法治
    { id: 'ch0103001-0000-0000-0000-000000000001', courseId: 'c0010003-0000-0000-0000-000000000003', name: '第一章：人生观', order: 1 },
    { id: 'ch0103002-0000-0000-0000-000000000002', courseId: 'c0010003-0000-0000-0000-000000000003', name: '第二章：理想信念', order: 2 },
    { id: 'ch0103003-0000-0000-0000-000000000003', courseId: 'c0010003-0000-0000-0000-000000000003', name: '第三章：中国精神', order: 3 },
    { id: 'ch0103004-0000-0000-0000-000000000004', courseId: 'c0010003-0000-0000-0000-000000000003', name: '第四章：社会主义核心价值观', order: 4 },
    { id: 'ch0103005-0000-0000-0000-000000000005', courseId: 'c0010003-0000-0000-0000-000000000003', name: '第五章：道德本质', order: 5 },
    { id: 'ch0103006-0000-0000-0000-000000000006', courseId: 'c0010003-0000-0000-0000-000000000003', name: '第六章：法治思维', order: 6 },
    { id: 'ch0103007-0000-0000-0000-000000000007', courseId: 'c0010003-0000-0000-0000-000000000003', name: '第七章：法治实践', order: 7 },
  ],
  'c0010004-0000-0000-0000-000000000004': [ // 线性代数
    { id: 'ch0104001-0000-0000-0000-000000000001', courseId: 'c0010004-0000-0000-0000-000000000004', name: '第一章：行列式', order: 1 },
    { id: 'ch0104002-0000-0000-0000-000000000002', courseId: 'c0010004-0000-0000-0000-000000000004', name: '第二章：矩阵', order: 2 },
    { id: 'ch0104003-0000-0000-0000-000000000003', courseId: 'c0010004-0000-0000-0000-000000000004', name: '第三章：向量组', order: 3 },
    { id: 'ch0104004-0000-0000-0000-000000000004', courseId: 'c0010004-0000-0000-0000-000000000004', name: '第四章：线性方程组', order: 4 },
    { id: 'ch0104005-0000-0000-0000-000000000005', courseId: 'c0010004-0000-0000-0000-000000000004', name: '第五章：特征值与特征向量', order: 5 },
    { id: 'ch0104006-0000-0000-0000-000000000006', courseId: 'c0010004-0000-0000-0000-000000000004', name: '第六章：二次型', order: 6 },
  ],
  'c0010005-0000-0000-0000-000000000005': [ // 普通测量学
    { id: 'ch0105001-0000-0000-0000-000000000001', courseId: 'c0010005-0000-0000-0000-000000000005', name: '第一章：测量学基础知识', order: 1 },
    { id: 'ch0105002-0000-0000-0000-000000000002', courseId: 'c0010005-0000-0000-0000-000000000005', name: '第二章：水准测量', order: 2 },
    { id: 'ch0105003-0000-0000-0000-000000000003', courseId: 'c0010005-0000-0000-0000-000000000005', name: '第三章：角度测量', order: 3 },
    { id: 'ch0105004-0000-0000-0000-000000000004', courseId: 'c0010005-0000-0000-0000-000000000005', name: '第四章：距离测量', order: 4 },
    { id: 'ch0105005-0000-0000-0000-000000000005', courseId: 'c0010005-0000-0000-0000-000000000005', name: '第五章：测量误差理论', order: 5 },
    { id: 'ch0105006-0000-0000-0000-000000000006', courseId: 'c0010005-0000-0000-0000-000000000005', name: '第六章：控制测量', order: 6 },
    { id: 'ch0105007-0000-0000-0000-000000000007', courseId: 'c0010005-0000-0000-0000-000000000005', name: '第七章：地形图测绘', order: 7 },
  ],
  'c0010006-0000-0000-0000-000000000006': [ // 中国近现代史纲要
    { id: 'ch0106001-0000-0000-0000-000000000001', courseId: 'c0010006-0000-0000-0000-000000000006', name: '第一章：反对外国侵略的斗争', order: 1 },
    { id: 'ch0106002-0000-0000-0000-000000000002', courseId: 'c0010006-0000-0000-0000-000000000006', name: '第二章：对国家出路的早期探索', order: 2 },
    { id: 'ch0106003-0000-0000-0000-000000000003', courseId: 'c0010006-0000-0000-0000-000000000006', name: '第三章：辛亥革命', order: 3 },
    { id: 'ch0106004-0000-0000-0000-000000000004', courseId: 'c0010006-0000-0000-0000-000000000006', name: '第四章：开天辟地的大事变', order: 4 },
    { id: 'ch0106005-0000-0000-0000-000000000005', courseId: 'c0010006-0000-0000-0000-000000000006', name: '第五章：中国革命的新道路', order: 5 },
    { id: 'ch0106006-0000-0000-0000-000000000006', courseId: 'c0010006-0000-0000-0000-000000000006', name: '第六章：中华民族的抗日战争', order: 6 },
    { id: 'ch0106007-0000-0000-0000-000000000007', courseId: 'c0010006-0000-0000-0000-000000000006', name: '第七章：为新中国而奋斗', order: 7 },
    { id: 'ch0106008-0000-0000-0000-000000000008', courseId: 'c0010006-0000-0000-0000-000000000006', name: '第八章：社会主义建设在探索中前进', order: 8 },
  ],
}

async function main() {
  console.log('========================================')
  console.log('开始添加课程数据 (UUID格式)...')
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

  // 2. 创建章节
  let totalChapters = 0
  for (const courseId of Object.keys(chaptersData)) {
    for (const chapterData of chaptersData[courseId]) {
      await prisma.chapter.upsert({
        where: { id: chapterData.id },
        update: {},
        create: chapterData,
      })
      totalChapters++
    }
  }
  console.log(`✓ 创建了 ${totalChapters} 个章节`)

  // 3. 创建知识点 - 每个课程随机生成一些知识点
  let totalKps = 0
  for (const course of courses) {
    const chapters = chaptersData[course.id]
    let kpIndex = 1

    for (const chapter of chapters) {
      // 每个章节生成4-6个知识点
      const kpCount = 4 + Math.floor(Math.random() * 3)
      for (let i = 0; i < kpCount; i++) {
        const statuses = ['MASTERED', 'WEAK', 'NEED_REVIEW']
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        const masteryScore = status === 'MASTERED' ? 70 + Math.floor(Math.random() * 30) :
                            status === 'WEAK' ? 30 + Math.floor(Math.random() * 25) :
                            20 + Math.floor(Math.random() * 30)

        await prisma.knowledgePoint.create({
          data: {
            id: `kp${chapter.id.slice(2)}-${kpIndex.toString().padStart(3, '0')}`,
            chapterId: chapter.id,
            name: `知识点 ${kpIndex}`,
            status,
            importance: 5 + Math.floor(Math.random() * 6),
            masteryScore,
          }
        })
        kpIndex++
        totalKps++
      }
    }
  }
  console.log(`✓ 创建了 ${totalKps} 个知识点`)

  // 统计
  console.log('\n========================================')
  console.log('✅ 数据添加完成！')
  console.log('========================================\n')

  // 输出各课程统计
  for (const course of courses) {
    const kps = await prisma.knowledgePoint.count({
      where: { chapter: { courseId: course.id } }
    })
    const mastered = await prisma.knowledgePoint.count({
      where: { chapter: { courseId: course.id }, status: 'MASTERED' }
    })
    const weak = await prisma.knowledgePoint.count({
      where: { chapter: { courseId: course.id }, status: 'WEAK' }
    })
    const progress = kps > 0 ? Math.round((mastered / kps) * 100) : 0

    console.log(`- ${course.name}: ${kps}知识点, 掌握${mastered}, 薄弱${weak}, 进度${progress}%`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
