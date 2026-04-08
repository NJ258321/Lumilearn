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
  // 当前时间：2026年3月（大二下学期）
  // 课程按照实际学习顺序编排，体现先修后继关系
  const courses = [
    // 
    // 【当前学期】大二下学期（2025-2026-2）：正在学习专业核心课
    // 
    
    // 学习中（正在上课）
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      name: '遥感原理与应用',
      status: 'STUDYING',  // 学习中
      type: 'PROFESSIONAL',
      semester: '2025-2026-2',
      examDate: new Date('2026-07-10'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: '数据库原理',
      status: 'STUDYING',  // 学习中
      type: 'PROFESSIONAL',
      semester: '2025-2026-2',
      examDate: new Date('2026-07-15'),
      targetGrade: 'A',
    },
    
    // 复习中（即将考试）
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      name: '摄影测量学',
      status: 'REVIEWING',  // 复习中
      type: 'PROFESSIONAL',
      semester: '2025-2026-2',
      examDate: new Date('2026-06-20'),  // 即将考试
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440008',
      name: '概率论与数理统计',
      status: 'REVIEWING',  // 复习中
      type: 'PROFESSIONAL',
      semester: '2025-2026-2',
      examDate: new Date('2026-06-25'),
      targetGrade: 'A',
    },

    // 
    // 【上学期】大二上学期（2025-2026-1）：已结课
    // 
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      name: '地理信息系统原理',
      status: 'ARCHIVED',  // 已结课
      type: 'PROFESSIONAL',
      semester: '2025-2026-1',
      examDate: new Date('2026-01-15'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: '计算机组成原理',
      status: 'ARCHIVED',  // 已结课
      type: 'PROFESSIONAL',
      semester: '2025-2026-1',
      examDate: new Date('2026-01-18'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: '大学英语（二）',
      status: 'ARCHIVED',  // 已结课
      type: 'ELECTIVE',
      semester: '2025-2026-1',
      examDate: new Date('2026-01-10'),
      targetGrade: 'B',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440014',
      name: '大学物理',
      status: 'ARCHIVED',  // 已结课
      type: 'PROFESSIONAL',
      semester: '2025-2026-1',
      examDate: new Date('2026-01-20'),
      targetGrade: 'B',
    },

    // 
    // 【大一下学期】2024-2025-2：已结课
    // 
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: '高等数学（下）',
      status: 'ARCHIVED',  // 已结课
      type: 'PROFESSIONAL',
      semester: '2024-2025-2',
      examDate: new Date('2025-07-10'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      name: '线性代数',
      status: 'ARCHIVED',  // 已结课
      type: 'PROFESSIONAL',
      semester: '2024-2025-2',
      examDate: new Date('2025-07-15'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: '数据结构',
      status: 'ARCHIVED',  // 已结课
      type: 'PROFESSIONAL',
      semester: '2024-2025-2',
      examDate: new Date('2025-07-08'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440015',
      name: '面向对象程序设计',
      status: 'ARCHIVED',  // 已结课
      type: 'PROFESSIONAL',
      semester: '2024-2025-2',
      examDate: new Date('2025-07-12'),
      targetGrade: 'B',
    },

    // 
    // 【大一上学期】2024-2025-1：已结课
    // 
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: '高等数学（上）',
      status: 'ARCHIVED',  // 已结课
      type: 'PROFESSIONAL',
      semester: '2024-2025-1',
      examDate: new Date('2025-01-15'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440009',
      name: 'C语言程序设计',
      status: 'ARCHIVED',  // 已结课
      type: 'PROFESSIONAL',
      semester: '2024-2025-1',
      examDate: new Date('2025-01-10'),
      targetGrade: 'A',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      name: '大学英语（一）',
      status: 'ARCHIVED',  // 已结课
      type: 'ELECTIVE',
      semester: '2024-2025-1',
      examDate: new Date('2025-01-12'),
      targetGrade: 'B',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440016',
      name: '中国近现代史纲要',
      status: 'ARCHIVED',  // 已结课
      type: 'CROSS_MAJOR',
      semester: '2024-2025-1',
      examDate: new Date('2025-01-08'),
      targetGrade: 'B',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440017',
      name: '思想道德与法治',
      status: 'ARCHIVED',  // 已结课
      type: 'CROSS_MAJOR',
      semester: '2024-2025-1',
      examDate: new Date('2025-01-05'),
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
    // 
    // 【本学期课程】大二下学期（2025-2026-2）
    // 
    // 遥感原理与应用（学习中）
    {
      id: '660e8400-e29b-41d4-a716-446655440100',
      courseId: '550e8400-e29b-41d4-a716-446655440011',
      name: '第一章：遥感物理基础',
      order: 1,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440101',
      courseId: '550e8400-e29b-41d4-a716-446655440011',
      name: '第二章：遥感平台与传感器',
      order: 2,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440102',
      courseId: '550e8400-e29b-41d4-a716-446655440011',
      name: '第三章：遥感图像处理',
      order: 3,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440103',
      courseId: '550e8400-e29b-41d4-a716-446655440011',
      name: '第四章：遥感图像分类',
      order: 4,
    },
    // 数据库原理（学习中）
    {
      id: '660e8400-e29b-41d4-a716-446655440110',
      courseId: '550e8400-e29b-41d4-a716-446655440010',
      name: '第一章：数据库系统概述',
      order: 1,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440111',
      courseId: '550e8400-e29b-41d4-a716-446655440010',
      name: '第二章：关系数据库',
      order: 2,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440112',
      courseId: '550e8400-e29b-41d4-a716-446655440010',
      name: '第三章：SQL语言',
      order: 3,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440113',
      courseId: '550e8400-e29b-41d4-a716-446655440010',
      name: '第四章：数据库设计',
      order: 4,
    },
    // 摄影测量学（复习中）
    {
      id: '660e8400-e29b-41d4-a716-446655440120',
      courseId: '550e8400-e29b-41d4-a716-446655440012',
      name: '第一章：摄影测量基础',
      order: 1,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440121',
      courseId: '550e8400-e29b-41d4-a716-446655440012',
      name: '第二章：立体像对解析',
      order: 2,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440122',
      courseId: '550e8400-e29b-41d4-a716-446655440012',
      name: '第三章：数字摄影测量',
      order: 3,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440123',
      courseId: '550e8400-e29b-41d4-a716-446655440012',
      name: '第四章：遥感影像处理',
      order: 4,
    },
    // 概率论与数理统计（复习中）
    {
      id: '660e8400-e29b-41d4-a716-446655440130',
      courseId: '550e8400-e29b-41d4-a716-446655440008',
      name: '第一章：随机事件与概率',
      order: 1,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440131',
      courseId: '550e8400-e29b-41d4-a716-446655440008',
      name: '第二章：随机变量及其分布',
      order: 2,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440132',
      courseId: '550e8400-e29b-41d4-a716-446655440008',
      name: '第三章：数理统计基础',
      order: 3,
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440133',
      courseId: '550e8400-e29b-41d4-a716-446655440008',
      name: '第四章：参数估计与检验',
      order: 4,
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
    //
    // 【本学期课程】知识点 - 大二下学期
    //
    // 遥感原理与应用（学习中）- 增加更多知识点
    {
      id: '770e8400-e29b-41d4-a716-446655440100',
      chapterId: '660e8400-e29b-41d4-a716-446655440100',
      name: '电磁波谱与地物光谱特性',
      status: 'MASTERED',
      importance: 10,
      masteryScore: 85,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440101',
      chapterId: '660e8400-e29b-41d4-a716-446655440100',
      name: '大气窗口与辐射传输',
      status: 'MASTERED',
      importance: 9,
      masteryScore: 80,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440102',
      chapterId: '660e8400-e29b-41d4-a716-446655440100',
      name: '热红外遥感原理',
      status: 'MASTERED',
      importance: 9,
      masteryScore: 78,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440103',
      chapterId: '660e8400-e29b-41d4-a716-446655440101',
      name: 'Landsat与Sentinel卫星',
      status: 'LEARNING',
      importance: 8,
      masteryScore: 55,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440104',
      chapterId: '660e8400-e29b-41d4-a716-446655440101',
      name: '高分辨率遥感卫星',
      status: 'LEARNING',
      importance: 8,
      masteryScore: 50,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440105',
      chapterId: '660e8400-e29b-41d4-a716-446655440102',
      name: '图像几何校正',
      status: 'NEED_REVIEW',
      importance: 9,
      masteryScore: 45,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440106',
      chapterId: '660e8400-e29b-41d4-a716-446655440102',
      name: '图像增强与滤波',
      status: 'WEAK',
      importance: 9,
      masteryScore: 35,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440107',
      chapterId: '660e8400-e29b-41d4-a716-446655440102',
      name: '图像融合与变换',
      status: 'NOT_STARTED',
      importance: 7,
      masteryScore: 20,
    },
    // 数据库原理（学习中）- 增加更多知识点
    {
      id: '770e8400-e29b-41d4-a716-446655440110',
      chapterId: '660e8400-e29b-41d4-a716-446655440110',
      name: '数据模型与数据库三级模式',
      status: 'MASTERED',
      importance: 9,
      masteryScore: 82,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440111',
      chapterId: '660e8400-e29b-41d4-a716-446655440111',
      name: '关系代数与关系运算',
      status: 'LEARNING',
      importance: 10,
      masteryScore: 60,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440112',
      chapterId: '660e8400-e29b-41d4-a716-446655440111',
      name: '关系规范化理论',
      status: 'LEARNING',
      importance: 9,
      masteryScore: 58,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440113',
      chapterId: '660e8400-e29b-41d4-a716-446655440112',
      name: 'SQL查询与数据操作',
      status: 'NEED_REVIEW',
      importance: 10,
      masteryScore: 50,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440114',
      chapterId: '660e8400-e29b-41d4-a716-446655440112',
      name: '索引与查询优化',
      status: 'WEAK',
      importance: 8,
      masteryScore: 40,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440115',
      chapterId: '660e8400-e29b-41d4-a716-446655440112',
      name: '事务与并发控制',
      status: 'NOT_STARTED',
      importance: 9,
      masteryScore: 25,
    },
    // 摄影测量学（复习中）- 设置合理的掌握状态
    {
      id: '770e8400-e29b-41d4-a716-446655440120',
      chapterId: '660e8400-e29b-41d4-a716-446655440120',
      name: '摄影机与摄影几何',
      status: 'MASTERED',
      importance: 10,
      masteryScore: 80,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440121',
      chapterId: '660e8400-e29b-41d4-a716-446655440120',
      name: '内方位元素与外方位元素',
      status: 'MASTERED',
      importance: 9,
      masteryScore: 75,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440122',
      chapterId: '660e8400-e29b-41d4-a716-446655440121',
      name: '共线方程与空间后方交会',
      status: 'LEARNING',
      importance: 10,
      masteryScore: 65,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440123',
      chapterId: '660e8400-e29b-41d4-a716-446655440121',
      name: '空间前方交会',
      status: 'NEED_REVIEW',
      importance: 9,
      masteryScore: 55,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440124',
      chapterId: '660e8400-e29b-41d4-a716-446655440122',
      name: '影像匹配与DEM生成',
      status: 'WEAK',
      importance: 9,
      masteryScore: 35,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440125',
      chapterId: '660e8400-e29b-41d4-a716-446655440122',
      name: '数字高程模型构建',
      status: 'NOT_STARTED',
      importance: 8,
      masteryScore: 20,
    },
    // 概率论与数理统计（复习中）- 设置合理的掌握状态
    {
      id: '770e8400-e29b-41d4-a716-446655440130',
      chapterId: '660e8400-e29b-41d4-a716-446655440130',
      name: '条件概率与贝叶斯公式',
      status: 'MASTERED',
      importance: 10,
      masteryScore: 85,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440131',
      chapterId: '660e8400-e29b-41d4-a716-446655440130',
      name: '全概率公式',
      status: 'MASTERED',
      importance: 9,
      masteryScore: 80,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440132',
      chapterId: '660e8400-e29b-41d4-a716-446655440131',
      name: '常见分布（正态、泊松、二项）',
      status: 'LEARNING',
      importance: 10,
      masteryScore: 60,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440133',
      chapterId: '660e8400-e29b-41d4-a716-446655440131',
      name: '分布函数与概率密度',
      status: 'NEED_REVIEW',
      importance: 9,
      masteryScore: 50,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440134',
      chapterId: '660e8400-e29b-41d4-a716-446655440132',
      name: '参数估计与假设检验',
      status: 'WEAK',
      importance: 9,
      masteryScore: 35,
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440135',
      chapterId: '660e8400-e29b-41d4-a716-446655440132',
      name: '置信区间与显著性水平',
      status: 'NOT_STARTED',
      importance: 8,
      masteryScore: 25,
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
    // 
    // 【本学期课程】学习记录 - 大二下学期
    // 
    // 遥感原理与应用（学习中）
    {
      id: '880e8400-e29b-41d4-a716-446655440101',
      courseId: '550e8400-e29b-41d4-a716-446655440011',
      chapterId: '660e8400-e29b-41d4-a716-446655440100',
      title: '遥感物理基础学习',
      date: new Date('2026-03-10'),
      audioUrl: '/uploads/rs-physics-basics.mp3',
      duration: 3600,
      status: 'COMPLETED',
      notes: '学习了电磁波谱、地物光谱特性、大气窗口等基础概念。',
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440102',
      courseId: '550e8400-e29b-41d4-a716-446655440011',
      chapterId: '660e8400-e29b-41d4-a716-446655440101',
      title: '遥感平台与传感器介绍',
      date: new Date('2026-03-17'),
      audioUrl: '/uploads/rs-platforms-sensors.mp3',
      duration: 3300,
      status: 'COMPLETED',
      notes: '了解了Landsat、Sentinel等常用卫星平台及其传感器特性。',
    },
    // 数据库原理（学习中）
    {
      id: '880e8400-e29b-41d4-a716-446655440111',
      courseId: '550e8400-e29b-41d4-a716-446655440010',
      chapterId: '660e8400-e29b-41d4-a716-446655440110',
      title: '数据库系统概述',
      date: new Date('2026-03-12'),
      audioUrl: '/uploads/db-introduction.mp3',
      duration: 3000,
      status: 'COMPLETED',
      notes: '介绍了数据库系统的基本概念、发展历程和三级模式结构。',
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440112',
      courseId: '550e8400-e29b-41d4-a716-446655440010',
      chapterId: '660e8400-e29b-41d4-a716-446655440111',
      title: '关系数据库基础',
      date: new Date('2026-03-19'),
      audioUrl: '/uploads/db-relational.mp3',
      duration: 3600,
      status: 'COMPLETED',
      notes: '学习了关系模型、关系代数和关系数据库的基本概念。',
    },
    // 摄影测量学（复习中）
    {
      id: '880e8400-e29b-41d4-a716-446655440121',
      courseId: '550e8400-e29b-41d4-a716-446655440012',
      chapterId: '660e8400-e29b-41d4-a716-446655440120',
      title: '摄影测量基础复习',
      date: new Date('2026-03-15'),
      audioUrl: '/uploads/photo-basics-review.mp3',
      duration: 2700,
      status: 'COMPLETED',
      notes: '复习了摄影机结构、摄影几何、内方位元素和外方位元素。',
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440122',
      courseId: '550e8400-e29b-41d4-a716-446655440012',
      chapterId: '660e8400-e29b-41d4-a716-446655440121',
      title: '立体像对解析复习',
      date: new Date('2026-03-20'),
      audioUrl: '/uploads/photo-stereo-review.mp3',
      duration: 3000,
      status: 'COMPLETED',
      notes: '复习了共线方程、空间后方交会、前方交会等重要内容。',
    },
    // 概率论与数理统计（复习中）
    {
      id: '880e8400-e29b-41d4-a716-446655440131',
      courseId: '550e8400-e29b-41d4-a716-446655440008',
      chapterId: '660e8400-e29b-41d4-a716-446655440130',
      title: '随机事件与概率复习',
      date: new Date('2026-03-14'),
      audioUrl: '/uploads/probability-review.mp3',
      duration: 3300,
      status: 'COMPLETED',
      notes: '复习了条件概率、贝叶斯公式、全概率公式等重要概念。',
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440132',
      courseId: '550e8400-e29b-41d4-a716-446655440008',
      chapterId: '660e8400-e29b-41d4-a716-446655440132',
      title: '数理统计方法复习',
      date: new Date('2026-03-21'),
      audioUrl: '/uploads/statistics-review.mp3',
      duration: 3600,
      status: 'COMPLETED',
      notes: '复习了点估计、区间估计、假设检验等统计推断方法。',
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
  console.log(`  - 遥感原理与应用: 550e8400-e29b-41d4-a716-446655440011 (学习中, 约58%掌握度)`)
  console.log(`  - 数据库原理: 550e8400-e29b-41d4-a716-446655440010 (学习中, 约47%掌握度)`)
  console.log(`  - 摄影测量学: 550e8400-e29b-41d4-a716-446655440012 (复习中, 约42%掌握度)`)
  console.log(`  - 概率论与数理统计: 550e8400-e29b-41d4-a716-446655440008 (复习中, 约48%掌握度)`)
}

main()
  .catch((e) => {
    console.error('\n❌ 添加种子数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
