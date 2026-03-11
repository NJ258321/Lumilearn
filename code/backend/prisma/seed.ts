// =====================================================
// 完整的种子数据脚本 - 包含6门大学课程
// 运行命令: npx tsx prisma/seed.ts
// =====================================================

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// 生成UUID的辅助函数
function generateUUID(prefix: string, index: number): string {
  const hex = '0123456789abcdef'
  let uuid = prefix
  for (let i = 0; i < 32 - prefix.length; i++) {
    uuid += hex[(Date.now() + index * i) % 16]
  }
  return uuid
}

async function main() {
  console.log('========================================')
  console.log('开始添加课程数据...')
  console.log('========================================\n')

  // ==================== 创建默认用户 ====================
  const defaultPasswordHash = await bcrypt.hash('demo123456', 10)
  await prisma.user.upsert({
    where: { email: 'demo@lumilearn.com' },
    update: {},
    create: {
      id: 'default-user-001',
      username: 'demo',
      email: 'demo@lumilearn.com',
      passwordHash: defaultPasswordHash,
      displayName: 'Demo用户',
      role: 'USER',
    },
  })
  console.log('✓ 创建默认用户: demo@lumilearn.com (密码: demo123456)\n')

  // 先清空现有数据
  await prisma.knowledgeRelation.deleteMany()
  await prisma.timeMark.deleteMany()
  await prisma.studyRecord.deleteMany()
  await prisma.knowledgePoint.deleteMany()
  await prisma.chapter.deleteMany()
  await prisma.course.deleteMany()
  console.log('✓ 已清空现有数据\n')

  // ==================== 1. 创建课程 ====================
  // 设计：3门复习阶段(REVIEWING)，3门学习阶段(STUDYING)
  const courses = [
    {
      id: 'course-001',
      name: '高等数学',
      status: 'STUDYING',           // 正在学习
      type: 'PROFESSIONAL',
      examDate: new Date('2026-01-15'),
      targetGrade: 'A',
    },
    {
      id: 'course-002',
      name: '程序设计',
      status: 'REVIEWING',          // 复习阶段
      type: 'PROFESSIONAL',
      examDate: new Date('2026-01-10'),
      targetGrade: 'A',
      reviewStartDate: new Date('2026-01-01'),
    },
    {
      id: 'course-003',
      name: '思想道德与法治',
      status: 'REVIEWING',          // 复习阶段
      type: 'ELECTIVE',
      examDate: new Date('2026-01-12'),
      targetGrade: 'B',
      reviewStartDate: new Date('2026-01-02'),
    },
    {
      id: 'course-004',
      name: '线性代数',
      status: 'REVIEWING',          // 复习阶段
      type: 'PROFESSIONAL',
      examDate: new Date('2026-01-18'),
      targetGrade: 'A',
      reviewStartDate: new Date('2025-12-28'),
    },
    {
      id: 'course-005',
      name: '普通测量学',
      status: 'STUDYING',           // 正在学习
      type: 'PROFESSIONAL',
      examDate: new Date('2026-01-20'),
      targetGrade: 'B',
    },
    {
      id: 'course-006',
      name: '中国近现代史纲要',
      status: 'STUDYING',           // 正在学习
      type: 'ELECTIVE',
      examDate: new Date('2026-01-16'),
      targetGrade: 'B',
    },
  ]

  for (const courseData of courses) {
    const course = await prisma.course.upsert({
      where: { id: courseData.id },
      update: {},
      create: courseData,
    })
    console.log(`✓ 创建课程: ${course.name} (${course.status === 'REVIEWING' ? '复习阶段' : '学习阶段'})`)
  }

  // ==================== 2. 创建章节 ====================

  // 高等数学章节
  const mathChapters = [
    { id: 'math-ch-001', courseId: 'course-001', name: '第一章：函数与极限', order: 1 },
    { id: 'math-ch-002', courseId: 'course-001', name: '第二章：导数与微分', order: 2 },
    { id: 'math-ch-003', courseId: 'course-001', name: '第三章：微分中值定理与导数应用', order: 3 },
    { id: 'math-ch-004', courseId: 'course-001', name: '第四章：不定积分', order: 4 },
    { id: 'math-ch-005', courseId: 'course-001', name: '第五章：定积分', order: 5 },
    { id: 'math-ch-006', courseId: 'course-001', name: '第六章：定积分应用', order: 6 },
    { id: 'math-ch-007', courseId: 'course-001', name: '第七章：微分方程', order: 7 },
  ]

  // 程序设计章节 (复习阶段)
  const csChapters = [
    { id: 'cs-ch-001', courseId: 'course-002', name: '第一章：程序设计基础', order: 1 },
    { id: 'cs-ch-002', courseId: 'course-002', name: '第二章：基本数据类型与表达式', order: 2 },
    { id: 'cs-ch-003', courseId: 'course-002', name: '第三章：顺序结构与输入输出', order: 3 },
    { id: 'cs-ch-004', courseId: 'course-002', name: '第四章：选择结构', order: 4 },
    { id: 'cs-ch-005', courseId: 'course-002', name: '第五章：循环结构', order: 5 },
    { id: 'cs-ch-006', courseId: 'course-002', name: '第六章：数组', order: 6 },
    { id: 'cs-ch-007', courseId: 'course-002', name: '第七章：函数', order: 7 },
    { id: 'cs-ch-008', courseId: 'course-002', name: '第八章：指针', order: 8 },
    { id: 'cs-ch-009', courseId: 'course-002', name: '第九章：结构体', order: 9 },
  ]

  // 思想道德与法治章节 (复习阶段)
  const moraleChapters = [
    { id: 'morale-ch-001', courseId: 'course-003', name: '第一章：领悟人生真谛', order: 1 },
    { id: 'morale-ch-002', courseId: 'course-003', name: '第二章：追求远大理想', order: 2 },
    { id: 'morale-ch-003', courseId: 'course-003', name: '第三章：继承爱国传统', order: 3 },
    { id: 'morale-ch-004', courseId: 'course-003', name: '第四章：弘扬中国精神', order: 4 },
    { id: 'morale-ch-005', courseId: 'course-003', name: '第五章：遵守道德规范', order: 5 },
    { id: 'morale-ch-006', courseId: 'course-003', name: '第六章：学习法治思想', order: 6 },
    { id: 'morale-ch-007', courseId: 'course-003', name: '第七章：提升法治素养', order: 7 },
  ]

  // 线性代数章节 (复习阶段)
  const laChapters = [
    { id: 'la-ch-001', courseId: 'course-004', name: '第一章：行列式', order: 1 },
    { id: 'la-ch-002', courseId: 'course-004', name: '第二章：矩阵', order: 2 },
    { id: 'la-ch-003', courseId: 'course-004', name: '第三章：向量组', order: 3 },
    { id: 'la-ch-004', courseId: 'course-004', name: '第四章：线性方程组', order: 4 },
    { id: 'la-ch-005', courseId: 'course-004', name: '第五章：特征值与特征向量', order: 5 },
    { id: 'la-ch-006', courseId: 'course-004', name: '第六章：二次型', order: 6 },
  ]

  // 普通测量学章节
  const surveyChapters = [
    { id: 'survey-ch-001', courseId: 'course-005', name: '第一章：测量学基本知识', order: 1 },
    { id: 'survey-ch-002', courseId: 'course-005', name: '第二章：水准测量', order: 2 },
    { id: 'survey-ch-003', courseId: 'course-005', name: '第三章：角度测量', order: 3 },
    { id: 'survey-ch-004', courseId: 'course-005', name: '第四章：距离测量', order: 4 },
    { id: 'survey-ch-005', courseId: 'course-005', name: '第五章：控制测量', order: 5 },
    { id: 'survey-ch-006', courseId: 'course-005', name: '第六章：地形图测绘', order: 6 },
    { id: 'survey-ch-007', courseId: 'course-005', name: '第七章：施工测量', order: 7 },
  ]

  // 中国近现代史纲要章节
  const historyChapters = [
    { id: 'history-ch-001', courseId: 'course-006', name: '第一章：进入近代后中华民族的磨难与抗争', order: 1 },
    { id: 'history-ch-002', courseId: 'course-006', name: '第二章：不同社会力量对国家出路的探索', order: 2 },
    { id: 'history-ch-003', courseId: 'course-006', name: '第三章：辛亥革命与君主专制制度的终结', order: 3 },
    { id: 'history-ch-004', courseId: 'course-006', name: '第四章：中国共产党成立与新民主主义革命', order: 4 },
    { id: 'history-ch-005', courseId: 'course-006', name: '第五章：全民族抗日战争', order: 5 },
    { id: 'history-ch-006', courseId: 'course-006', name: '第六章：解放战争与新中国成立', order: 6 },
    { id: 'history-ch-007', courseId: 'course-006', name: '第七章：社会主义建设道路的探索', order: 7 },
    { id: 'history-ch-008', courseId: 'course-006', name: '第八章：改革开放与中国特色社会主义', order: 8 },
  ]

  const allChapters = [
    ...mathChapters,
    ...csChapters,
    ...moraleChapters,
    ...laChapters,
    ...surveyChapters,
    ...historyChapters,
  ]

  for (const chapterData of allChapters) {
    await prisma.chapter.upsert({
      where: { id: chapterData.id },
      update: {},
      create: chapterData,
    })
  }
  console.log(`✓ 创建章节: ${allChapters.length} 章`)

  // ==================== 3. 创建知识点 (带详细状态) ====================

  // 知识点状态设计：
  // - MASTERED: 已掌握
  // - WEAK: 薄弱环节，需要加强
  // - NEED_REVIEW: 需要复习
  // - TODAY_REVIEW: 今天需要复习

  const knowledgePoints = [
    // ==================== 高等数学 (STUDYING - 正在学习) ====================
    // 第一章：函数与极限
    { chapterId: 'math-ch-001', name: '函数的概念与性质', importance: 10, masteryScore: 40, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-001', name: '数列的极限', importance: 9, masteryScore: 35, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-001', name: '函数的极限', importance: 10, masteryScore: 50, status: 'WEAK' },
    { chapterId: 'math-ch-001', name: '极限的运算法则', importance: 9, masteryScore: 60, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-001', name: '两个重要极限', importance: 10, masteryScore: 45, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-001', name: '函数的连续性', importance: 8, masteryScore: 55, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-001', name: '间断点及其分类', importance: 7, masteryScore: 30, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-001', name: '闭区间上连续函数的性质', importance: 8, masteryScore: 25, status: 'NEED_REVIEW' },

    // 第二章：导数与微分
    { chapterId: 'math-ch-002', name: '导数的定义', importance: 10, masteryScore: 70, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-002', name: '导数的几何意义', importance: 9, masteryScore: 65, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-002', name: '函数的可导性与连续性', importance: 8, masteryScore: 50, status: 'WEAK' },
    { chapterId: 'math-ch-002', name: '求导法则', importance: 10, masteryScore: 55, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-002', name: '复合函数求导', importance: 10, masteryScore: 40, status: 'WEAK' },
    { chapterId: 'math-ch-002', name: '隐函数求导', importance: 9, masteryScore: 35, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-002', name: '参数方程求导', importance: 8, masteryScore: 30, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-002', name: '微分', importance: 9, masteryScore: 60, status: 'NEED_REVIEW' },

    // 后续章节 - 正在学习，状态较新
    { chapterId: 'math-ch-003', name: '罗尔定理', importance: 9, masteryScore: 20, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-003', name: '拉格朗日中值定理', importance: 10, masteryScore: 15, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-003', name: '柯西中值定理', importance: 7, masteryScore: 10, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-003', name: '洛必达法则', importance: 10, masteryScore: 5, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-003', name: '泰勒公式', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-003', name: '函数的单调性', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-003', name: '函数的极值', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-003', name: '最大值与最小值', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-003', name: '曲线的凹凸性', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-003', name: '渐近线', importance: 7, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'math-ch-004', name: '不定积分的概念', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-004', name: '换元积分法', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-004', name: '分部积分法', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-004', name: '有理函数的积分', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-004', name: '三角函数有理式的积分', importance: 7, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'math-ch-005', name: '定积分的定义', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-005', name: '定积分的性质', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-005', name: '微积分基本公式', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-005', name: '定积分的换元法', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-005', name: '定积分的分部积分法', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'math-ch-006', name: '定积分的几何应用', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-006', name: '平面图形面积', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-006', name: '旋转体体积', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-006', name: '平面曲线弧长', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-006', name: '物理应用', importance: 7, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'math-ch-007', name: '微分方程的概念', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-007', name: '可分离变量方程', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-007', name: '齐次方程', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-007', name: '一阶线性微分方程', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-007', name: '二阶常系数齐次线性微分方程', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'math-ch-007', name: '二阶常系数非齐次线性微分方程', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },

    // ==================== 程序设计 (REVIEWING - 复习阶段) ====================
    // 第一章：已复习完
    { chapterId: 'cs-ch-001', name: '程序设计的基本概念', importance: 9, masteryScore: 85, status: 'MASTERED' },
    { chapterId: 'cs-ch-001', name: '算法与程序的关系', importance: 8, masteryScore: 80, status: 'MASTERED' },
    { chapterId: 'cs-ch-001', name: '算法的描述方法', importance: 7, masteryScore: 75, status: 'MASTERED' },
    { chapterId: 'cs-ch-001', name: '结构化程序设计', importance: 8, masteryScore: 78, status: 'MASTERED' },

    // 第二章：已复习完
    { chapterId: 'cs-ch-002', name: '基本数据类型', importance: 10, masteryScore: 90, status: 'MASTERED' },
    { chapterId: 'cs-ch-002', name: '常量与变量', importance: 10, masteryScore: 88, status: 'MASTERED' },
    { chapterId: 'cs-ch-002', name: '运算符与表达式', importance: 10, masteryScore: 82, status: 'MASTERED' },
    { chapterId: 'cs-ch-002', name: '数据类型转换', importance: 8, masteryScore: 70, status: 'WEAK' },

    // 第三章：已复习完
    { chapterId: 'cs-ch-003', name: '语句与复合语句', importance: 9, masteryScore: 80, status: 'MASTERED' },
    { chapterId: 'cs-ch-003', name: '格式化输出printf', importance: 10, masteryScore: 75, status: 'WEAK' },
    { chapterId: 'cs-ch-003', name: '格式化输入scanf', importance: 10, masteryScore: 72, status: 'WEAK' },
    { chapterId: 'cs-ch-003', name: '字符输入输出', importance: 7, masteryScore: 78, status: 'MASTERED' },

    // 第四章：今天复习
    { chapterId: 'cs-ch-004', name: 'if语句', importance: 10, masteryScore: 65, status: 'TODAY_REVIEW' },
    { chapterId: 'cs-ch-004', name: 'if-else语句', importance: 10, masteryScore: 60, status: 'TODAY_REVIEW' },
    { chapterId: 'cs-ch-004', name: '嵌套if语句', importance: 9, masteryScore: 55, status: 'TODAY_REVIEW' },
    { chapterId: 'cs-ch-004', name: 'switch语句', importance: 9, masteryScore: 50, status: 'TODAY_REVIEW' },
    { chapterId: 'cs-ch-004', name: '条件运算符', importance: 7, masteryScore: 45, status: 'WEAK' },

    // 第五章：待日后复习
    { chapterId: 'cs-ch-005', name: 'while循环', importance: 10, masteryScore: 40, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-005', name: 'do-while循环', importance: 9, masteryScore: 35, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-005', name: 'for循环', importance: 10, masteryScore: 38, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-005', name: '嵌套循环', importance: 9, masteryScore: 30, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-005', name: 'break与continue', importance: 9, masteryScore: 32, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-005', name: '循环应用举例', importance: 8, masteryScore: 28, status: 'NEED_REVIEW' },

    // 第六章：待日后复习
    { chapterId: 'cs-ch-006', name: '一维数组的定义与使用', importance: 10, masteryScore: 25, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-006', name: '数组的初始化', importance: 9, masteryScore: 22, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-006', name: '数组应用：排序', importance: 9, masteryScore: 20, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-006', name: '数组应用：查找', importance: 8, masteryScore: 18, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-006', name: '二维数组', importance: 9, masteryScore: 15, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-006', name: '字符数组与字符串', importance: 10, masteryScore: 12, status: 'NEED_REVIEW' },

    // 第七-九章：薄弱环节
    { chapterId: 'cs-ch-007', name: '函数的定义', importance: 10, masteryScore: 50, status: 'WEAK' },
    { chapterId: 'cs-ch-007', name: '函数的调用', importance: 10, masteryScore: 48, status: 'WEAK' },
    { chapterId: 'cs-ch-007', name: '函数的参数传递', importance: 10, masteryScore: 45, status: 'WEAK' },
    { chapterId: 'cs-ch-007', name: '函数的递归调用', importance: 9, masteryScore: 40, status: 'WEAK' },
    { chapterId: 'cs-ch-007', name: '变量作用域', importance: 9, masteryScore: 42, status: 'WEAK' },
    { chapterId: 'cs-ch-007', name: '存储类别', importance: 7, masteryScore: 35, status: 'NEED_REVIEW' },

    { chapterId: 'cs-ch-008', name: '指针的概念', importance: 10, masteryScore: 38, status: 'WEAK' },
    { chapterId: 'cs-ch-008', name: '指针变量', importance: 10, masteryScore: 35, status: 'WEAK' },
    { chapterId: 'cs-ch-008', name: '指针与数组', importance: 10, masteryScore: 30, status: 'WEAK' },
    { chapterId: 'cs-ch-008', name: '指针与函数', importance: 9, masteryScore: 28, status: 'WEAK' },
    { chapterId: 'cs-ch-008', name: '指针数组与指向指针的指针', importance: 8, masteryScore: 25, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-008', name: '动态内存分配', importance: 9, masteryScore: 22, status: 'WEAK' },

    { chapterId: 'cs-ch-009', name: '结构体的定义', importance: 10, masteryScore: 40, status: 'WEAK' },
    { chapterId: 'cs-ch-009', name: '结构体变量的使用', importance: 9, masteryScore: 38, status: 'WEAK' },
    { chapterId: 'cs-ch-009', name: '结构体数组', importance: 9, masteryScore: 35, status: 'WEAK' },
    { chapterId: 'cs-ch-009', name: '结构体与指针', importance: 8, masteryScore: 30, status: 'NEED_REVIEW' },
    { chapterId: 'cs-ch-009', name: 'typedef用法', importance: 7, masteryScore: 28, status: 'NEED_REVIEW' },

    // ==================== 思想道德与法治 (REVIEWING - 复习阶段) ====================
    // 前面章节已复习完
    { chapterId: 'morale-ch-001', name: '人生与人生观', importance: 8, masteryScore: 85, status: 'MASTERED' },
    { chapterId: 'morale-ch-001', name: '个人与社会的辩证关系', importance: 9, masteryScore: 82, status: 'MASTERED' },
    { chapterId: 'morale-ch-001', name: '树立正确的人生观', importance: 8, masteryScore: 80, status: 'MASTERED' },
    { chapterId: 'morale-ch-001', name: '创造有意义的人生', importance: 7, masteryScore: 78, status: 'MASTERED' },

    { chapterId: 'morale-ch-002', name: '理想与信念', importance: 9, masteryScore: 83, status: 'MASTERED' },
    { chapterId: 'morale-ch-002', name: '理想信念的内涵与特征', importance: 8, masteryScore: 80, status: 'MASTERED' },
    { chapterId: 'morale-ch-002', name: '理想信念是精神之钙', importance: 9, masteryScore: 78, status: 'MASTERED' },
    { chapterId: 'morale-ch-002', name: '坚定理想信念', importance: 8, masteryScore: 75, status: 'WEAK' },

    { chapterId: 'morale-ch-003', name: '爱国主义的内涵', importance: 9, masteryScore: 70, status: 'TODAY_REVIEW' },
    { chapterId: 'morale-ch-003', name: '爱国主义是中华民族精神的核心', importance: 9, masteryScore: 68, status: 'TODAY_REVIEW' },
    { chapterId: 'morale-ch-003', name: '新时代的爱国主义', importance: 8, masteryScore: 65, status: 'TODAY_REVIEW' },
    { chapterId: 'morale-ch-003', name: '做忠诚的爱国者', importance: 7, masteryScore: 60, status: 'WEAK' },

    { chapterId: 'morale-ch-004', name: '中国精神的内涵', importance: 9, masteryScore: 50, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-004', name: '以爱国主义为核心的民族精神', importance: 9, masteryScore: 48, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-004', name: '以改革创新为核心的时代精神', importance: 8, masteryScore: 45, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-004', name: '实现中国梦需要弘扬中国精神', importance: 8, masteryScore: 42, status: 'NEED_REVIEW' },

    { chapterId: 'morale-ch-005', name: '道德及其历史发展', importance: 8, masteryScore: 40, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-005', name: '社会主义核心价值观', importance: 10, masteryScore: 38, status: 'WEAK' },
    { chapterId: 'morale-ch-005', name: '公民基本道德规范', importance: 9, masteryScore: 35, status: 'WEAK' },
    { chapterId: 'morale-ch-005', name: '网络道德与职业道德', importance: 7, masteryScore: 30, status: 'NEED_REVIEW' },

    { chapterId: 'morale-ch-006', name: '法治与法治思维', importance: 9, masteryScore: 28, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-006', name: '全面依法治国的总目标', importance: 8, masteryScore: 25, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-006', name: '法治中国的建设', importance: 8, masteryScore: 22, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-006', name: '坚持依法治国和以德治国相结合', importance: 7, masteryScore: 20, status: 'NEED_REVIEW' },

    { chapterId: 'morale-ch-007', name: '我国宪法确立的基本原则', importance: 9, masteryScore: 18, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-007', name: '我国的实体法律制度', importance: 8, masteryScore: 15, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-007', name: '我国的程序法律制度', importance: 7, masteryScore: 12, status: 'NEED_REVIEW' },
    { chapterId: 'morale-ch-007', name: '依法行使权利与履行义务', importance: 9, masteryScore: 10, status: 'NEED_REVIEW' },

    // ==================== 线性代数 (REVIEWING - 复习阶段) ====================
    // 第一章：已复习完
    { chapterId: 'la-ch-001', name: '排列与逆序', importance: 8, masteryScore: 90, status: 'MASTERED' },
    { chapterId: 'la-ch-001', name: 'n阶行列式的定义', importance: 9, masteryScore: 88, status: 'MASTERED' },
    { chapterId: 'la-ch-001', name: '行列式的性质', importance: 10, masteryScore: 85, status: 'MASTERED' },
    { chapterId: 'la-ch-001', name: '行列式按行展开', importance: 9, masteryScore: 82, status: 'MASTERED' },
    { chapterId: 'la-ch-001', name: '行列式的计算', importance: 10, masteryScore: 80, status: 'WEAK' },
    { chapterId: 'la-ch-001', name: '克拉默法则', importance: 8, masteryScore: 78, status: 'MASTERED' },

    // 第二章：今天复习
    { chapterId: 'la-ch-002', name: '矩阵的概念', importance: 9, masteryScore: 70, status: 'TODAY_REVIEW' },
    { chapterId: 'la-ch-002', name: '矩阵的运算', importance: 10, masteryScore: 65, status: 'TODAY_REVIEW' },
    { chapterId: 'la-ch-002', name: '方阵的行列式', importance: 8, masteryScore: 60, status: 'WEAK' },
    { chapterId: 'la-ch-002', name: '逆矩阵', importance: 10, masteryScore: 58, status: 'TODAY_REVIEW' },
    { chapterId: 'la-ch-002', name: '矩阵的秩', importance: 10, masteryScore: 55, status: 'TODAY_REVIEW' },
    { chapterId: 'la-ch-002', name: '初等变换与初等矩阵', importance: 9, masteryScore: 50, status: 'WEAK' },

    // 第三章：待日后复习
    { chapterId: 'la-ch-003', name: '向量组及其线性组合', importance: 9, masteryScore: 45, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-003', name: '向量组的线性相关性', importance: 10, masteryScore: 42, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-003', name: '向量组的秩', importance: 9, masteryScore: 40, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-003', name: '向量空间', importance: 8, masteryScore: 38, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-003', name: '向量的内积与正交', importance: 8, masteryScore: 35, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-003', name: '正交矩阵', importance: 7, masteryScore: 30, status: 'NEED_REVIEW' },

    // 第四章：薄弱环节
    { chapterId: 'la-ch-004', name: '线性方程组的有解条件', importance: 10, masteryScore: 35, status: 'WEAK' },
    { chapterId: 'la-ch-004', name: '齐次线性方程组', importance: 9, masteryScore: 32, status: 'WEAK' },
    { chapterId: 'la-ch-004', name: '非齐次线性方程组', importance: 9, masteryScore: 30, status: 'WEAK' },
    { chapterId: 'la-ch-004', name: '向量空间与线性方程组', importance: 8, masteryScore: 25, status: 'WEAK' },

    // 第五-六章：待复习
    { chapterId: 'la-ch-005', name: '特征值与特征向量', importance: 10, masteryScore: 20, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-005', name: '特征多项式与特征方程', importance: 9, masteryScore: 18, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-005', name: '相似矩阵', importance: 9, masteryScore: 15, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-005', name: '矩阵的相似对角化', importance: 10, masteryScore: 12, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-005', name: '实对称矩阵的对角化', importance: 9, masteryScore: 10, status: 'NEED_REVIEW' },

    { chapterId: 'la-ch-006', name: '二次型及其标准形', importance: 9, masteryScore: 8, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-006', name: '用正交变换化二次型为标准形', importance: 10, masteryScore: 5, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-006', name: '用配方法化二次型为标准形', importance: 8, masteryScore: 3, status: 'NEED_REVIEW' },
    { chapterId: 'la-ch-006', name: '正定二次型', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },

    // ==================== 普通测量学 (STUDING - 正在学习) ====================
    { chapterId: 'survey-ch-001', name: '测量学的任务与作用', importance: 7, masteryScore: 75, status: 'MASTERED' },
    { chapterId: 'survey-ch-001', name: '地球的形状和大小', importance: 8, masteryScore: 70, status: 'MASTERED' },
    { chapterId: 'survey-ch-001', name: '测量坐标系统', importance: 9, masteryScore: 65, status: 'WEAK' },
    { chapterId: 'survey-ch-001', name: '测量工作的基本要素', importance: 8, masteryScore: 60, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-001', name: '测量误差的基本知识', importance: 9, masteryScore: 55, status: 'NEED_REVIEW' },

    { chapterId: 'survey-ch-002', name: '水准测量的原理', importance: 10, masteryScore: 50, status: 'WEAK' },
    { chapterId: 'survey-ch-002', name: '水准仪及其使用', importance: 10, masteryScore: 45, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-002', name: '水准测量的实施方法', importance: 9, masteryScore: 40, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-002', name: '水准测量的内业计算', importance: 9, masteryScore: 35, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-002', name: '水准仪的检验与校正', importance: 8, masteryScore: 30, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-002', name: '三、四等水准测量', importance: 8, masteryScore: 25, status: 'NEED_REVIEW' },

    { chapterId: 'survey-ch-003', name: '角度测量原理', importance: 9, masteryScore: 20, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-003', name: '经纬仪及其使用', importance: 10, masteryScore: 15, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-003', name: '水平角观测', importance: 10, masteryScore: 10, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-003', name: '竖直角观测', importance: 9, masteryScore: 8, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-003', name: '经纬仪的检验与校正', importance: 8, masteryScore: 5, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-003', name: '角度测量的误差分析', importance: 7, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'survey-ch-004', name: '钢尺量距', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-004', name: '视距测量', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-004', name: '电磁波测距', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-004', name: '全站仪及其应用', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-004', name: '距离测量的误差分析', importance: 7, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'survey-ch-005', name: '控制测量的概述', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-005', name: '导线测量', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-005', name: '导线测量的内业计算', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-005', name: '三角高程测量', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-005', name: 'GPS控制测量', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'survey-ch-006', name: '地形图的基本知识', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-006', name: '地形图的测绘方法', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-006', name: '地形图的阅读与应用', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-006', name: '数字测图概述', importance: 7, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'survey-ch-007', name: '施工测量的基本工作', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-007', name: '施工控制网的建立', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-007', name: '建筑工程施工测量', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-007', name: '道路桥梁施工测量', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'survey-ch-007', name: '竣工测量', importance: 7, masteryScore: 0, status: 'NEED_REVIEW' },

    // ==================== 中国近现代史纲要 (STUDYING - 正在学习) ====================
    { chapterId: 'history-ch-001', name: '近代中国的社会性质', importance: 9, masteryScore: 60, status: 'WEAK' },
    { chapterId: 'history-ch-001', name: '近代中国的主要矛盾', importance: 9, masteryScore: 55, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-001', name: '近代中国人民的两大历史任务', importance: 8, masteryScore: 50, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-001', name: '鸦片战争与近代中国的开端', importance: 9, masteryScore: 45, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-001', name: '太平天国运动', importance: 8, masteryScore: 40, status: 'NEED_REVIEW' },

    { chapterId: 'history-ch-002', name: '洋务运动', importance: 9, masteryScore: 35, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-002', name: '戊戌维新运动', importance: 8, masteryScore: 30, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-002', name: '辛亥革命', importance: 10, masteryScore: 25, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-002', name: '新文化运动', importance: 9, masteryScore: 20, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-002', name: '五四运动', importance: 10, masteryScore: 15, status: 'NEED_REVIEW' },

    { chapterId: 'history-ch-003', name: '辛亥革命的历史条件', importance: 8, masteryScore: 12, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-003', name: '辛亥革命的过程', importance: 9, masteryScore: 10, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-003', name: '中华民国成立', importance: 9, masteryScore: 8, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-003', name: '辛亥革命的历史意义', importance: 10, masteryScore: 5, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-003', name: '辛亥革命的教训', importance: 8, masteryScore: 3, status: 'NEED_REVIEW' },

    { chapterId: 'history-ch-004', name: '马克思主义的传播', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-004', name: '中国共产党的成立', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-004', name: '民主革命纲领的制定', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-004', name: '第一次国共合作', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-004', name: '北伐战争', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'history-ch-005', name: '日本侵华战争', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-005', name: '抗日民族统一战线', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-005', name: '正面战场与敌后战场', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-005', name: '抗日战争的胜利', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-005', name: '抗日战争的历史意义', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'history-ch-006', name: '重庆谈判与政协会议', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-006', name: '全面内战爆发', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-006', name: '战略进攻与战略决战', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-006', name: '新中国的成立', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-006', name: '新民主主义革命胜利的原因', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'history-ch-007', name: '社会主义制度的确立', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-007', name: '社会主义建设的探索', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-007', name: '十年建设的成就', importance: 7, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-007', name: '文化大革命', importance: 8, masteryScore: 0, status: 'NEED_REVIEW' },

    { chapterId: 'history-ch-008', name: '改革开放的启动', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-008', name: '社会主义市场经济', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-008', name: '中国特色社会主义进入新时代', importance: 10, masteryScore: 0, status: 'NEED_REVIEW' },
    { chapterId: 'history-ch-008', name: '中华民族伟大复兴的中国梦', importance: 9, masteryScore: 0, status: 'NEED_REVIEW' },
  ]

  let kpIndex = 0
  for (const kpData of knowledgePoints) {
    await prisma.knowledgePoint.create({
      data: {
        id: `kp-${String(kpIndex).padStart(4, '0')}`,
        ...kpData,
      },
    })
    kpIndex++
  }
  console.log(`✓ 创建知识点: ${knowledgePoints.length} 个`)

  // ==================== 统计 ====================
  console.log('\n========================================')
  console.log('✅ 数据添加完成！')
  console.log('========================================\n')

  // 统计各状态知识点数量
  const statusCount = await prisma.knowledgePoint.groupBy({
    by: ['status'],
    _count: true,
  })

  console.log('📊 数据统计:')
  console.log(`  - 课程: ${courses.length} 门`)
  console.log(`  - 章节: ${allChapters.length} 章`)
  console.log(`  - 知识点: ${knowledgePoints.length} 个`)

  console.log('\n📝 课程状态:')
  courses.forEach(c => {
    const statusText = c.status === 'REVIEWING' ? '复习阶段' : '学习阶段'
    console.log(`  - ${c.name}: ${statusText}`)
  })

  console.log('\n📈 知识点状态分布:')
  statusCount.forEach(s => {
    const statusText = {
      'MASTERED': '已掌握',
      'WEAK': '薄弱环节',
      'NEED_REVIEW': '需要复习',
      'TODAY_REVIEW': '今天复习'
    }[s.status] || s.status
    console.log(`  - ${statusText}: ${s._count} 个`)
  })
}

main()
  .catch((e) => {
    console.error('\n❌ 添加种子数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
