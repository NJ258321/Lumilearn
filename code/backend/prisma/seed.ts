// =====================================================
// 完整的种子数据脚本 - 用于前后端联调测试
// 运行命令: npx tsx prisma/seed.ts
// =====================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('========================================')
  console.log('开始添加完整的测试数据...')
  console.log('========================================\n')

  // ==================== 0. 创建默认用户 ====================
  const defaultUser = await prisma.user.upsert({
    where: { id: 'default-user' },
    update: {},
    create: {
      id: 'default-user',
      username: 'default',
      email: 'default@example.com',
      passwordHash: 'dummy-hash',
      role: 'USER',
    },
  })
  console.log(`✓ 默认用户: ${defaultUser.username}`)

  // ==================== 1. 创建课程 ====================
  const courses = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: '高等数学',
      status: 'STUDYING',
      type: 'PROFESSIONAL',
      examDate: new Date('2026-06-15'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: '线性代数',
      status: 'STUDYING',
      type: 'PROFESSIONAL',
      examDate: new Date('2026-06-20'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: '大学英语',
      status: 'REVIEWING',
      type: 'ELECTIVE',
      examDate: new Date('2026-06-18'),
      targetGrade: 'B',
    },
  ]

  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { id: courseData.id },
      update: {},
      create: courseData,
    })
    console.log(`✓ 创建课程: ${course.name}`)
  }

  // ==================== 2. 创建章节 ====================
  const chapters = [
    // 高等数学章节
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      courseId: '550e8400-e29b-41d4-a716-446655440001',
      name: '第一章：极限与连续',
      order: 1,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      courseId: '550e8400-e29b-41d4-a716-446655440001',
      name: '第二章：导数与微分',
      order: 2,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      courseId: '550e8400-e29b-41d4-a716-446655440001',
      name: '第三章：微分中值定理',
      order: 3,
    },
    // 线性代数章节
    {
      id: '660e8400-e29b-41d4-a716-446655440010',
      courseId: '550e8400-e29b-41d4-a716-446655440002',
      name: '第一章：行列式',
      order: 1,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440011',
      courseId: '550e8400-e29b-41d4-a716-446655440002',
      name: '第二章：矩阵',
      order: 2,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440012',
      courseId: '550e8400-e29b-41d4-a716-446655440002',
      name: '第三章：向量组',
      order: 3,
    },
    // 大学英语章节
    {
      id: '660e8400-e29b-41d4-a716-446655440020',
      courseId: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Unit 1: Academic Reading',
      order: 1,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440021',
      courseId: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Unit 2: Technical Writing',
      order: 2,
    },
  ]

  for (const chapterData of chapters) {
    const chapter = await prisma.chapter.upsert({
      where: { id: chapterData.id },
      update: {},
      create: chapterData,
    })
    console.log(`✓ 创建章节: ${chapter.name}`)
  }

  // ==================== 3. 创建知识点 ====================
  const knowledgePoints = [
    // 高等数学知识点
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      chapterId: '660e8400-e29b-41d4-a716-446655440001',
      name: '极限的ε-δ定义',
      status: 'NEED_REVIEW',
      importance: 10,
      masteryScore: 30,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440002',
      chapterId: '660e8400-e29b-41d4-a716-446655440001',
      name: '极限的运算法则',
      status: 'NEED_REVIEW',
      importance: 9,
      masteryScore: 45,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440003',
      chapterId: '660e8400-e29b-41d4-a716-446655440001',
      name: '两个重要极限',
      status: 'WEAK',
      importance: 8,
      masteryScore: 50,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440004',
      chapterId: '660e8400-e29b-41d4-a716-446655440001',
      name: '函数的连续性',
      status: 'NEED_REVIEW',
      importance: 7,
      masteryScore: 25,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440005',
      chapterId: '660e8400-e29b-41d4-a716-446655440002',
      name: '导数的定义',
      status: 'NEED_REVIEW',
      importance: 10,
      masteryScore: 60,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440006',
      chapterId: '660e8400-e29b-41d4-a716-446655440002',
      name: '求导法则',
      status: 'WEAK',
      importance: 9,
      masteryScore: 40,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440007',
      chapterId: '660e8400-e29b-41d4-a716-446655440002',
      name: '微分',
      status: 'MASTERED',
      importance: 7,
      masteryScore: 85,
    },
    // 线性代数知识点
    {
      id: '770e8400-e29b-41d4-a716-446655440010',
      chapterId: '660e8400-e29b-41d4-a716-446655440010',
      name: '行列式的定义',
      status: 'NEED_REVIEW',
      importance: 8,
      masteryScore: 35,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440011',
      chapterId: '660e8400-e29b-41d4-a716-446655440010',
      name: '行列式的性质',
      status: 'WEAK',
      importance: 9,
      masteryScore: 45,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440012',
      chapterId: '660e8400-e29b-41d4-a716-446655440011',
      name: '矩阵的运算',
      status: 'NEED_REVIEW',
      importance: 10,
      masteryScore: 55,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440013',
      chapterId: '660e8400-e29b-41d4-a716-446655440011',
      name: '逆矩阵',
      status: 'WEAK',
      importance: 9,
      masteryScore: 40,
    },
    // 大学英语知识点
    {
      id: '770e8400-e29b-41d4-a716-446655440020',
      chapterId: '660e8400-e29b-41d4-a716-446655440020',
      name: 'Academic Vocabulary',
      status: 'NEED_REVIEW',
      importance: 8,
      masteryScore: 50,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440021',
      chapterId: '660e8400-e29b-41d4-a716-446655440020',
      name: 'Reading Comprehension',
      status: 'WEAK',
      importance: 7,
      masteryScore: 35,
    },
  ]

  for (const kpData of knowledgePoints) {
    const kp = await prisma.knowledgePoint.upsert({
      where: { id: kpData.id },
      update: {},
      create: kpData,
    })
    console.log(`✓ 创建知识点: ${kp.name}`)
  }

  // ==================== 4. 创建学习记录 ====================
  const studyRecords = [
    {
      id: '880e8400-e29b-41d4-a716-446655440001',
      courseId: '550e8400-e29b-41d4-a716-446655440001',
      chapterId: '660e8400-e29b-41d4-a716-446655440001',
      title: '极限的定义与性质',
      date: new Date('2026-03-01'),
      audioUrl: '/uploads/math-limit-definition.mp3',
      duration: 3600,
      status: 'COMPLETED',
      notes: '本节课学习了极限的基本概念、ε-δ定义、极限的运算法则。',
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440002',
      courseId: '550e8400-e29b-41d4-a716-446655440001',
      chapterId: '660e8400-e29b-41d4-a716-446655440001',
      title: '两个重要极限与连续性',
      date: new Date('2026-03-03'),
      audioUrl: '/uploads/math-important-limits.mp3',
      duration: 2700,
      status: 'COMPLETED',
      notes: '学习了两个重要极限公式和函数连续性的概念。',
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440003',
      courseId: '550e8400-e29b-41d4-a716-446655440001',
      chapterId: '660e8400-e29b-41d4-a716-446655440002',
      title: '导数的定义与几何意义',
      date: new Date('2026-03-05'),
      audioUrl: '/uploads/math-derivative.mp3',
      duration: 3000,
      status: 'COMPLETED',
      notes: '学习了导数的定义、几何意义以及基本求导公式。',
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440004',
      courseId: '550e8400-e29b-41d4-a716-446655440002',
      chapterId: '660e8400-e29b-41d4-a716-446655440010',
      title: '行列式的概念与性质',
      date: new Date('2026-03-02'),
      audioUrl: '/uploads/linear-determinant.mp3',
      duration: 2400,
      status: 'COMPLETED',
      notes: '学习行列式的定义、性质和计算方法。',
    },
  ]

  for (const srData of studyRecords) {
    const sr = await prisma.studyRecord.upsert({
      where: { id: srData.id },
      update: {},
      create: srData,
    })
    console.log(`✓ 创建学习记录: ${sr.title}`)
  }

  // ==================== 5. 创建时间标记 ====================
  const timeMarks = [
    // 极限课程的时间标记
    {
      id: '990e8400-e29b-41d4-a716-446655440001',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440001',
      type: 'START',
      timestamp: 0,
      content: '课程开始',
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440002',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440001',
      type: 'EMPHASIS',
      timestamp: 120000,
      content: '极限的ε-δ定义是本章重点，需要深刻理解',
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440003',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440001',
      type: 'NOTE',
      timestamp: 300000,
      content: 'ε-δ语言：∀ε>0, ∃δ>0, 当0<|x-a|<δ时, |f(x)-L|<ε',
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440004',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440001',
      type: 'BOARD_CHANGE',
      timestamp: 600000,
      content: '板书：极限的四则运算法则',
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440005',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440001',
      type: 'EMPHASIS',
      timestamp: 900000,
      content: '重点：复合函数的极限运算法则',
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440006',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440001',
      type: 'QUESTION',
      timestamp: 1200000,
      content: '学生提问：如何证明极限不存在？',
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440007',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440001',
      type: 'END',
      timestamp: 3600000,
      content: '课程结束，下节课预告：两个重要极限',
    },
    // 第二个学习记录的时间标记
    {
      id: '990e8400-e29b-41d4-a716-446655440010',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440002',
      type: 'START',
      timestamp: 0,
      content: '课程开始',
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440011',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440002',
      type: 'EMPHASIS',
      timestamp: 180000,
      content: '重要极限1：lim(x→0) sin(x)/x = 1',
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440012',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440002',
      type: 'EMPHASIS',
      timestamp: 480000,
      content: '重要极限2：lim(x→∞) (1+1/x)^x = e',
    },
    {
      id: '990e8400-e29b-41d4-a716-446655440013',
      studyRecordId: '880e8400-e29b-41d4-a716-446655440002',
      type: 'END',
      timestamp: 2700000,
      content: '课程结束',
    },
  ]

  for (const tmData of timeMarks) {
    await prisma.timeMark.upsert({
      where: { id: tmData.id },
      update: {},
      create: tmData,
    })
  }
  console.log(`✓ 创建了 ${timeMarks.length} 个时间标记`)

  // ==================== 统计 ====================
  console.log('\n========================================')
  console.log('✅ 测试数据添加完成！')
  console.log('========================================')
  console.log('\n📊 数据统计:')
  console.log(`  - 课程: ${courses.length} 门`)
  console.log(`  - 章节: ${chapters.length} 章`)
  console.log(`  - 知识点: ${knowledgePoints.length} 个`)
  console.log(`  - 学习记录: ${studyRecords.length} 条`)
  console.log(`  - 时间标记: ${timeMarks.length} 个`)
  console.log('\n📝 测试用课程ID:')
  console.log(`  - 高等数学: ${courses[0].id}`)
  console.log(`  - 线性代数: ${courses[1].id}`)
  console.log(`  - 大学英语: ${courses[2].id}`)
}

main()
  .catch((e) => {
    console.error('\n❌ 添加种子数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
