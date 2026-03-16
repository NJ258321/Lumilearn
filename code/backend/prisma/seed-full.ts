// =====================================================
// 完整的课程数据种子脚本 - 基于数据库课程数据.md
// 运行命令: npx tsx prisma/seed-full.ts
// =====================================================

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 生成UUID的辅助函数
function generateUUID(prefix: string, num: number): string {
  const hex = num.toString(16).padStart(12, '0')
  return `${prefix}-${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16)}`
}

async function main() {
  console.log('========================================')
  console.log('开始添加完整课程数据...')
  console.log('========================================\n')

  // ==================== 1. 创建课程 ====================
  const courses = [
    {
      id: 'course-001',
      name: '高等数学',
      status: 'STUDYING',
      type: 'PROFESSIONAL',
      semester: '2024-2025-1',
      examDate: new Date('2026-06-15'),
      targetGrade: 'A',
    },
    {
      id: 'course-002',
      name: '程序设计',
      status: 'REVIEWING',
      type: 'PROFESSIONAL',
      semester: '2024-2025-1',
      examDate: new Date('2026-04-15'),
      reviewStartDate: new Date('2026-03-01'),
      targetGrade: 'A',
    },
    {
      id: 'course-003',
      name: '思想道德与法治',
      status: 'REVIEWING',
      type: 'ELECTIVE',
      semester: '2024-2025-1',
      examDate: new Date('2026-05-05'),
      reviewStartDate: new Date('2026-03-10'),
      targetGrade: 'B',
    },
    {
      id: 'course-004',
      name: '线性代数',
      status: 'ARCHIVED',
      type: 'PROFESSIONAL',
      semester: '2024-2025-1',
      examDate: new Date('2026-02-15'),
      targetGrade: 'A',
    },
    {
      id: 'course-005',
      name: '普通测量学',
      status: 'STUDYING',
      type: 'PROFESSIONAL',
      semester: '2024-2025-1',
      examDate: new Date('2026-06-20'),
      targetGrade: 'B',
    },
    {
      id: 'course-006',
      name: '中国近现代史纲要',
      status: 'STUDYING',
      type: 'ELECTIVE',
      semester: '2024-2025-1',
      examDate: new Date('2026-06-25'),
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
    // 高等数学章节 (course-001)
    { id: 'ch-001-01', courseId: 'course-001', name: '第一章：函数与极限', order: 1 },
    { id: 'ch-001-02', courseId: 'course-001', name: '第二章：导数与微分', order: 2 },
    { id: 'ch-001-03', courseId: 'course-001', name: '第三章：微分中值定理与导数应用', order: 3 },
    { id: 'ch-001-04', courseId: 'course-001', name: '第四章：不定积分', order: 4 },
    { id: 'ch-001-05', courseId: 'course-001', name: '第五章：定积分', order: 5 },
    { id: 'ch-001-06', courseId: 'course-001', name: '第六章：定积分应用', order: 6 },
    { id: 'ch-001-07', courseId: 'course-001', name: '第七章：微分方程', order: 7 },

    // 程序设计章节 (course-002)
    { id: 'ch-002-01', courseId: 'course-002', name: '第一章：程序设计基础', order: 1 },
    { id: 'ch-002-02', courseId: 'course-002', name: '第二章：顺序结构', order: 2 },
    { id: 'ch-002-03', courseId: 'course-002', name: '第三章：选择结构', order: 3 },
    { id: 'ch-002-04', courseId: 'course-002', name: '第四章：循环结构', order: 4 },
    { id: 'ch-002-05', courseId: 'course-002', name: '第五章：函数与模块', order: 5 },
    { id: 'ch-002-06', courseId: 'course-002', name: '第六章：数组', order: 6 },
    { id: 'ch-002-07', courseId: 'course-002', name: '第七章：指针', order: 7 },
    { id: 'ch-002-08', courseId: 'course-002', name: '第八章：结构体', order: 8 },
    { id: 'ch-002-09', courseId: 'course-002', name: '第九章：文件操作', order: 9 },

    // 思想道德与法治章节 (course-003)
    { id: 'ch-003-01', courseId: 'course-003', name: '第一章：人生观', order: 1 },
    { id: 'ch-003-02', courseId: 'course-003', name: '第二章：理想信念', order: 2 },
    { id: 'ch-003-03', courseId: 'course-003', name: '第三章：中国精神', order: 3 },
    { id: 'ch-003-04', courseId: 'course-003', name: '第四章：社会主义核心价值观', order: 4 },
    { id: 'ch-003-05', courseId: 'course-003', name: '第五章：道德本质', order: 5 },
    { id: 'ch-003-06', courseId: 'course-003', name: '第六章：法治思维', order: 6 },
    { id: 'ch-003-07', courseId: 'course-003', name: '第七章：法治实践', order: 7 },

    // 线性代数章节 (course-004)
    { id: 'ch-004-01', courseId: 'course-004', name: '第一章：行列式', order: 1 },
    { id: 'ch-004-02', courseId: 'course-004', name: '第二章：矩阵', order: 2 },
    { id: 'ch-004-03', courseId: 'course-004', name: '第三章：向量组', order: 3 },
    { id: 'ch-004-04', courseId: 'course-004', name: '第四章：线性方程组', order: 4 },
    { id: 'ch-004-05', courseId: 'course-004', name: '第五章：特征值与特征向量', order: 5 },
    { id: 'ch-004-06', courseId: 'course-004', name: '第六章：二次型', order: 6 },

    // 普通测量学章节 (course-005)
    { id: 'ch-005-01', courseId: 'course-005', name: '第一章：测量学基础知识', order: 1 },
    { id: 'ch-005-02', courseId: 'course-005', name: '第二章：水准测量', order: 2 },
    { id: 'ch-005-03', courseId: 'course-005', name: '第三章：角度测量', order: 3 },
    { id: 'ch-005-04', courseId: 'course-005', name: '第四章：距离测量', order: 4 },
    { id: 'ch-005-05', courseId: 'course-005', name: '第五章：测量误差理论', order: 5 },
    { id: 'ch-005-06', courseId: 'course-005', name: '第六章：控制测量', order: 6 },
    { id: 'ch-005-07', courseId: 'course-005', name: '第七章：地形图测绘', order: 7 },

    // 中国近现代史纲要章节 (course-006)
    { id: 'ch-006-01', courseId: 'course-006', name: '第一章：反对外国侵略的斗争', order: 1 },
    { id: 'ch-006-02', courseId: 'course-006', name: '第二章：对国家出路的早期探索', order: 2 },
    { id: 'ch-006-03', courseId: 'course-006', name: '第三章：辛亥革命', order: 3 },
    { id: 'ch-006-04', courseId: 'course-006', name: '第四章：开天辟地的大事变', order: 4 },
    { id: 'ch-006-05', courseId: 'course-006', name: '第五章：中国革命的新道路', order: 5 },
    { id: 'ch-006-06', courseId: 'course-006', name: '第六章：中华民族的抗日战争', order: 6 },
    { id: 'ch-006-07', courseId: 'course-006', name: '第七章：为新中国而奋斗', order: 7 },
    { id: 'ch-006-08', courseId: 'course-006', name: '第八章：社会主义建设在探索中前进', order: 8 },
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
    // 第一章：函数与极限
    { id: 'kp-001-01-01', chapterId: 'ch-001-01', name: '函数的概念与性质', status: 'NEED_REVIEW', importance: 8, masteryScore: 40 },
    { id: 'kp-001-01-02', chapterId: 'ch-001-01', name: '反函数与复合函数', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    { id: 'kp-001-01-03', chapterId: 'ch-001-01', name: '基本初等函数', status: 'WEAK', importance: 8, masteryScore: 45 },
    { id: 'kp-001-01-04', chapterId: 'ch-001-01', name: '数列的极限', status: 'NEED_REVIEW', importance: 9, masteryScore: 30 },
    { id: 'kp-001-01-05', chapterId: 'ch-001-01', name: '函数的极限定义', status: 'NEED_REVIEW', importance: 10, masteryScore: 25 },
    { id: 'kp-001-01-06', chapterId: 'ch-001-01', name: '极限的运算法则', status: 'WEAK', importance: 9, masteryScore: 40 },
    { id: 'kp-001-01-07', chapterId: 'ch-001-01', name: '两个重要极限', status: 'WEAK', importance: 10, masteryScore: 35 },
    { id: 'kp-001-01-08', chapterId: 'ch-001-01', name: '函数的连续性', status: 'NEED_REVIEW', importance: 8, masteryScore: 30 },
    // 第二章：导数与微分
    { id: 'kp-001-02-01', chapterId: 'ch-001-02', name: '导数的定义', status: 'MASTERED', importance: 10, masteryScore: 85 },
    { id: 'kp-001-02-02', chapterId: 'ch-001-02', name: '导数的几何意义', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-001-02-03', chapterId: 'ch-001-02', name: '求导法则', status: 'WEAK', importance: 10, masteryScore: 50 },
    { id: 'kp-001-02-04', chapterId: 'ch-001-02', name: '隐函数求导', status: 'WEAK', importance: 8, masteryScore: 45 },
    { id: 'kp-001-02-05', chapterId: 'ch-001-02', name: '参数方程求导', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    { id: 'kp-001-02-06', chapterId: 'ch-001-02', name: '高阶导数', status: 'NEED_REVIEW', importance: 7, masteryScore: 40 },
    { id: 'kp-001-02-07', chapterId: 'ch-001-02', name: '微分', status: 'MASTERED', importance: 8, masteryScore: 75 },
    // 第三章：微分中值定理
    { id: 'kp-001-03-01', chapterId: 'ch-001-03', name: '罗尔定理', status: 'NEED_REVIEW', importance: 8, masteryScore: 30 },
    { id: 'kp-001-03-02', chapterId: 'ch-001-03', name: '拉格朗日中值定理', status: 'NEED_REVIEW', importance: 9, masteryScore: 35 },
    { id: 'kp-001-03-03', chapterId: 'ch-001-03', name: '柯西中值定理', status: 'NEED_REVIEW', importance: 7, masteryScore: 25 },
    { id: 'kp-001-03-04', chapterId: 'ch-001-03', name: '洛必达法则', status: 'WEAK', importance: 10, masteryScore: 45 },
    { id: 'kp-001-03-05', chapterId: 'ch-001-03', name: '函数的单调性', status: 'NEED_REVIEW', importance: 8, masteryScore: 40 },
    { id: 'kp-001-03-06', chapterId: 'ch-001-03', name: '极值与最值', status: 'NEED_REVIEW', importance: 9, masteryScore: 35 },
    // 第四章：不定积分
    { id: 'kp-001-04-01', chapterId: 'ch-001-04', name: '不定积分的概念', status: 'NEED_REVIEW', importance: 7, masteryScore: 40 },
    { id: 'kp-001-04-02', chapterId: 'ch-001-04', name: '换元积分法', status: 'NEED_REVIEW', importance: 9, masteryScore: 35 },
    { id: 'kp-001-04-03', chapterId: 'ch-001-04', name: '分部积分法', status: 'NEED_REVIEW', importance: 8, masteryScore: 30 },
    { id: 'kp-001-04-04', chapterId: 'ch-001-04', name: '有理函数积分', status: 'NEED_REVIEW', importance: 7, masteryScore: 25 },
    { id: 'kp-001-04-05', chapterId: 'ch-001-04', name: '三角函数积分', status: 'NEED_REVIEW', importance: 6, masteryScore: 20 },
    // 第五章：定积分
    { id: 'kp-001-05-01', chapterId: 'ch-001-05', name: '定积分的定义', status: 'NEED_REVIEW', importance: 8, masteryScore: 35 },
    { id: 'kp-001-05-02', chapterId: 'ch-001-05', name: '定积分的性质', status: 'NEED_REVIEW', importance: 7, masteryScore: 40 },
    { id: 'kp-001-05-03', chapterId: 'ch-001-05', name: '微积分基本公式', status: 'NEED_REVIEW', importance: 10, masteryScore: 30 },
    { id: 'kp-001-05-04', chapterId: 'ch-001-05', name: '定积分的换元法', status: 'NEED_REVIEW', importance: 8, masteryScore: 25 },
    { id: 'kp-001-05-05', chapterId: 'ch-001-05', name: '定积分的分部积分法', status: 'NEED_REVIEW', importance: 7, masteryScore: 25 },
    { id: 'kp-001-05-06', chapterId: 'ch-001-05', name: '广义积分', status: 'NEED_REVIEW', importance: 6, masteryScore: 20 },
    // 第六章：定积分应用
    { id: 'kp-001-06-01', chapterId: 'ch-001-06', name: '平面图形面积', status: 'NEED_REVIEW', importance: 8, masteryScore: 30 },
    { id: 'kp-001-06-02', chapterId: 'ch-001-06', name: '旋转体体积', status: 'NEED_REVIEW', importance: 8, masteryScore: 25 },
    { id: 'kp-001-06-03', chapterId: 'ch-001-06', name: '平面曲线弧长', status: 'NEED_REVIEW', importance: 6, masteryScore: 20 },
    { id: 'kp-001-06-04', chapterId: 'ch-001-06', name: '物理应用', status: 'NEED_REVIEW', importance: 5, masteryScore: 15 },
    { id: 'kp-001-06-05', chapterId: 'ch-001-06', name: '平均值', status: 'NEED_REVIEW', importance: 5, masteryScore: 20 },
    // 第七章：微分方程
    { id: 'kp-001-07-01', chapterId: 'ch-001-07', name: '微分方程的概念', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    { id: 'kp-001-07-02', chapterId: 'ch-001-07', name: '可分离变量方程', status: 'NEED_REVIEW', importance: 8, masteryScore: 30 },
    { id: 'kp-001-07-03', chapterId: 'ch-001-07', name: '齐次方程', status: 'NEED_REVIEW', importance: 7, masteryScore: 25 },
    { id: 'kp-001-07-04', chapterId: 'ch-001-07', name: '一阶线性方程', status: 'NEED_REVIEW', importance: 9, masteryScore: 25 },
    { id: 'kp-001-07-05', chapterId: 'ch-001-07', name: '二阶常系数线性方程', status: 'NEED_REVIEW', importance: 8, masteryScore: 20 },

    // 程序设计知识点
    // 第一章：程序设计基础
    { id: 'kp-002-01-01', chapterId: 'ch-002-01', name: '程序设计语言概述', status: 'MASTERED', importance: 7, masteryScore: 85 },
    { id: 'kp-002-01-02', chapterId: 'ch-002-01', name: '算法描述方法', status: 'WEAK', importance: 8, masteryScore: 55 },
    { id: 'kp-002-01-03', chapterId: 'ch-002-01', name: '算法的复杂度分析', status: 'WEAK', importance: 9, masteryScore: 50 },
    { id: 'kp-002-01-04', chapterId: 'ch-002-01', name: 'C语言程序结构', status: 'MASTERED', importance: 8, masteryScore: 80 },
    { id: 'kp-002-01-05', chapterId: 'ch-002-01', name: '开发环境配置', status: 'MASTERED', importance: 6, masteryScore: 90 },
    // 第二章：顺序结构
    { id: 'kp-002-02-01', chapterId: 'ch-002-02', name: '基本数据类型', status: 'MASTERED', importance: 9, masteryScore: 85 },
    { id: 'kp-002-02-02', chapterId: 'ch-002-02', name: '常量与变量', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-002-02-03', chapterId: 'ch-002-02', name: '运算符与表达式', status: 'WEAK', importance: 8, masteryScore: 60 },
    { id: 'kp-002-02-04', chapterId: 'ch-002-02', name: '输入输出函数', status: 'MASTERED', importance: 8, masteryScore: 75 },
    // 第三章：选择结构
    { id: 'kp-002-03-01', chapterId: 'ch-002-03', name: 'if语句', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-002-03-02', chapterId: 'ch-002-03', name: 'if-else语句', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-002-03-03', chapterId: 'ch-002-03', name: '嵌套if语句', status: 'WEAK', importance: 8, masteryScore: 55 },
    { id: 'kp-002-03-04', chapterId: 'ch-002-03', name: 'switch语句', status: 'WEAK', importance: 8, masteryScore: 60 },
    { id: 'kp-002-03-05', chapterId: 'ch-002-03', name: '条件运算符', status: 'NEED_REVIEW', importance: 7, masteryScore: 45 },
    // 第四章：循环结构
    { id: 'kp-002-04-01', chapterId: 'ch-002-04', name: 'while循环', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-002-04-02', chapterId: 'ch-002-04', name: 'do-while循环', status: 'WEAK', importance: 7, masteryScore: 55 },
    { id: 'kp-002-04-03', chapterId: 'ch-002-04', name: 'for循环', status: 'MASTERED', importance: 9, masteryScore: 85 },
    { id: 'kp-002-04-04', chapterId: 'ch-002-04', name: '循环嵌套', status: 'WEAK', importance: 8, masteryScore: 50 },
    { id: 'kp-002-04-05', chapterId: 'ch-002-04', name: 'break与continue', status: 'WEAK', importance: 8, masteryScore: 55 },
    { id: 'kp-002-04-06', chapterId: 'ch-002-04', name: '循环经典算法', status: 'NEED_REVIEW', importance: 9, masteryScore: 40 },
    // 第五章：函数与模块
    { id: 'kp-002-05-01', chapterId: 'ch-002-05', name: '函数定义与调用', status: 'WEAK', importance: 9, masteryScore: 55 },
    { id: 'kp-002-05-02', chapterId: 'ch-002-05', name: '函数参数传递', status: 'WEAK', importance: 9, masteryScore: 50 },
    { id: 'kp-002-05-03', chapterId: 'ch-002-05', name: '递归函数', status: 'NEED_REVIEW', importance: 8, masteryScore: 40 },
    { id: 'kp-002-05-04', chapterId: 'ch-002-05', name: '变量的作用域', status: 'WEAK', importance: 7, masteryScore: 50 },
    { id: 'kp-002-05-05', chapterId: 'ch-002-05', name: '静态变量与全局变量', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    // 第六章：数组
    { id: 'kp-002-06-01', chapterId: 'ch-002-06', name: '一维数组', status: 'MASTERED', importance: 9, masteryScore: 75 },
    { id: 'kp-002-06-02', chapterId: 'ch-002-06', name: '二维数组', status: 'WEAK', importance: 8, masteryScore: 50 },
    { id: 'kp-002-06-03', chapterId: 'ch-002-06', name: '字符数组与字符串', status: 'WEAK', importance: 8, masteryScore: 55 },
    { id: 'kp-002-06-04', chapterId: 'ch-002-06', name: '数组与函数', status: 'NEED_REVIEW', importance: 8, masteryScore: 40 },
    { id: 'kp-002-06-05', chapterId: 'ch-002-06', name: '排序算法', status: 'NEED_REVIEW', importance: 9, masteryScore: 35 },
    // 第七章：指针
    { id: 'kp-002-07-01', chapterId: 'ch-002-07', name: '指针的概念', status: 'WEAK', importance: 9, masteryScore: 50 },
    { id: 'kp-002-07-02', chapterId: 'ch-002-07', name: '指针运算', status: 'NEED_REVIEW', importance: 8, masteryScore: 35 },
    { id: 'kp-002-07-03', chapterId: 'ch-002-07', name: '指针与数组', status: 'NEED_REVIEW', importance: 9, masteryScore: 40 },
    { id: 'kp-002-07-04', chapterId: 'ch-002-07', name: '指针与函数', status: 'NEED_REVIEW', importance: 8, masteryScore: 35 },
    { id: 'kp-002-07-05', chapterId: 'ch-002-07', name: '动态内存分配', status: 'NEED_REVIEW', importance: 8, masteryScore: 30 },
    // 第八章：结构体
    { id: 'kp-002-08-01', chapterId: 'ch-002-08', name: '结构体定义', status: 'WEAK', importance: 8, masteryScore: 55 },
    { id: 'kp-002-08-02', chapterId: 'ch-002-08', name: '结构体变量', status: 'WEAK', importance: 8, masteryScore: 50 },
    { id: 'kp-002-08-03', chapterId: 'ch-002-08', name: '结构体数组', status: 'NEED_REVIEW', importance: 7, masteryScore: 40 },
    { id: 'kp-002-08-04', chapterId: 'ch-002-08', name: '结构体与函数', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    // 第九章：文件操作
    { id: 'kp-002-09-01', chapterId: 'ch-002-09', name: '文件概述', status: 'MASTERED', importance: 6, masteryScore: 75 },
    { id: 'kp-002-09-02', chapterId: 'ch-002-09', name: '文件打开与关闭', status: 'WEAK', importance: 7, masteryScore: 50 },
    { id: 'kp-002-09-03', chapterId: 'ch-002-09', name: '文件读写函数', status: 'NEED_REVIEW', importance: 8, masteryScore: 40 },
    { id: 'kp-002-09-04', chapterId: 'ch-002-09', name: '文件定位', status: 'NEED_REVIEW', importance: 6, masteryScore: 30 },

    // 思想道德与法治知识点
    // 第一章：人生观
    { id: 'kp-003-01-01', chapterId: 'ch-003-01', name: '人生观的概念', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-003-01-02', chapterId: 'ch-003-01', name: '人生价值', status: 'WEAK', importance: 8, masteryScore: 35 },
    { id: 'kp-003-01-03', chapterId: 'ch-003-01', name: '人生目的', status: 'WEAK', importance: 7, masteryScore: 40 },
    { id: 'kp-003-01-04', chapterId: 'ch-003-01', name: '人生态度', status: 'NEED_REVIEW', importance: 6, masteryScore: 25 },
    // 第二章：理想信念
    { id: 'kp-003-02-01', chapterId: 'ch-003-02', name: '理想的内涵', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-003-02-02', chapterId: 'ch-003-02', name: '信念的内涵', status: 'NEED_REVIEW', importance: 7, masteryScore: 25 },
    { id: 'kp-003-02-03', chapterId: 'ch-003-02', name: '理想与信念的关系', status: 'WEAK', importance: 8, masteryScore: 35 },
    { id: 'kp-003-02-04', chapterId: 'ch-003-02', name: '崇高理想', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    // 第三章：中国精神
    { id: 'kp-003-03-01', chapterId: 'ch-003-03', name: '民族精神', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-003-03-02', chapterId: 'ch-003-03', name: '时代精神', status: 'WEAK', importance: 7, masteryScore: 35 },
    { id: 'kp-003-03-03', chapterId: 'ch-003-03', name: '爱国主义', status: 'WEAK', importance: 9, masteryScore: 45 },
    { id: 'kp-003-03-04', chapterId: 'ch-003-03', name: '改革创新', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    // 第四章：社会主义核心价值观
    { id: 'kp-003-04-01', chapterId: 'ch-003-04', name: '社会主义核心价值观内涵', status: 'WEAK', importance: 9, masteryScore: 50 },
    { id: 'kp-003-04-02', chapterId: 'ch-003-04', name: '国家层面价值要求', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-003-04-03', chapterId: 'ch-003-04', name: '社会层面价值要求', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    { id: 'kp-003-04-04', chapterId: 'ch-003-04', name: '公民层面价值要求', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    // 第五章：道德本质
    { id: 'kp-003-05-01', chapterId: 'ch-003-05', name: '道德的起源', status: 'NEED_REVIEW', importance: 6, masteryScore: 25 },
    { id: 'kp-003-05-02', chapterId: 'ch-003-05', name: '道德的本质', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-003-05-03', chapterId: 'ch-003-05', name: '道德的功能', status: 'WEAK', importance: 7, masteryScore: 35 },
    { id: 'kp-003-05-04', chapterId: 'ch-003-05', name: '道德修养', status: 'NEED_REVIEW', importance: 6, masteryScore: 25 },
    // 第六章：法治思维
    { id: 'kp-003-06-01', chapterId: 'ch-003-06', name: '法治思维的含义', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-003-06-02', chapterId: 'ch-003-06', name: '法治思维的特征', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-003-06-03', chapterId: 'ch-003-06', name: '法律权威', status: 'WEAK', importance: 7, masteryScore: 35 },
    { id: 'kp-003-06-04', chapterId: 'ch-003-06', name: '权利与义务', status: 'WEAK', importance: 8, masteryScore: 40 },
    // 第七章：法治实践
    { id: 'kp-003-07-01', chapterId: 'ch-003-07', name: '宪法基本原则', status: 'WEAK', importance: 8, masteryScore: 35 },
    { id: 'kp-003-07-02', chapterId: 'ch-003-07', name: '民法基本原则', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-003-07-03', chapterId: 'ch-003-07', name: '民事权利', status: 'NEED_REVIEW', importance: 7, masteryScore: 25 },
    { id: 'kp-003-07-04', chapterId: 'ch-003-07', name: '合同基本原理', status: 'NEED_REVIEW', importance: 6, masteryScore: 20 },

    // 线性代数知识点
    // 第一章：行列式
    { id: 'kp-004-01-01', chapterId: 'ch-004-01', name: 'n阶行列式定义', status: 'MASTERED', importance: 8, masteryScore: 85 },
    { id: 'kp-004-01-02', chapterId: 'ch-004-01', name: '行列式性质', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-004-01-03', chapterId: 'ch-004-01', name: '行列式按行展开', status: 'MASTERED', importance: 8, masteryScore: 85 },
    { id: 'kp-004-01-04', chapterId: 'ch-004-01', name: '克莱默法则', status: 'MASTERED', importance: 7, masteryScore: 75 },
    { id: 'kp-004-01-05', chapterId: 'ch-004-01', name: '行列式计算技巧', status: 'MASTERED', importance: 8, masteryScore: 80 },
    { id: 'kp-004-01-06', chapterId: 'ch-004-01', name: '行列式应用', status: 'MASTERED', importance: 7, masteryScore: 70 },
    // 第二章：矩阵
    { id: 'kp-004-02-01', chapterId: 'ch-004-02', name: '矩阵概念', status: 'MASTERED', importance: 9, masteryScore: 90 },
    { id: 'kp-004-02-02', chapterId: 'ch-004-02', name: '矩阵运算', status: 'MASTERED', importance: 9, masteryScore: 85 },
    { id: 'kp-004-02-03', chapterId: 'ch-004-02', name: '逆矩阵', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-004-02-04', chapterId: 'ch-004-02', name: '秩', status: 'MASTERED', importance: 10, masteryScore: 85 },
    { id: 'kp-004-02-05', chapterId: 'ch-004-02', name: '初等变换', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-004-02-06', chapterId: 'ch-004-02', name: '分块矩阵', status: 'MASTERED', importance: 7, masteryScore: 75 },
    // 第三章：向量组
    { id: 'kp-004-03-01', chapterId: 'ch-004-03', name: '向量概念', status: 'MASTERED', importance: 8, masteryScore: 85 },
    { id: 'kp-004-03-02', chapterId: 'ch-004-03', name: '向量组线性相关性', status: 'MASTERED', importance: 10, masteryScore: 80 },
    { id: 'kp-004-03-03', chapterId: 'ch-004-03', name: '极大线性无关组', status: 'MASTERED', importance: 9, masteryScore: 75 },
    { id: 'kp-004-03-04', chapterId: 'ch-004-03', name: '向量空间', status: 'MASTERED', importance: 8, masteryScore: 75 },
    { id: 'kp-004-03-05', chapterId: 'ch-004-03', name: '基与维数', status: 'MASTERED', importance: 8, masteryScore: 70 },
    // 第四章：线性方程组
    { id: 'kp-004-04-01', chapterId: 'ch-004-04', name: '齐次线性方程组', status: 'MASTERED', importance: 9, masteryScore: 85 },
    { id: 'kp-004-04-02', chapterId: 'ch-004-04', name: '非齐次线性方程组', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-004-04-03', chapterId: 'ch-004-04', name: '解的结构', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-004-04-04', chapterId: 'ch-004-04', name: '解的判定', status: 'MASTERED', importance: 10, masteryScore: 85 },
    { id: 'kp-004-04-05', chapterId: 'ch-004-04', name: '消元法', status: 'MASTERED', importance: 9, masteryScore: 85 },
    // 第五章：特征值与特征向量
    { id: 'kp-004-05-01', chapterId: 'ch-004-05', name: '特征值与特征向量定义', status: 'MASTERED', importance: 9, masteryScore: 85 },
    { id: 'kp-004-05-02', chapterId: 'ch-004-05', name: '特征值与特征向量性质', status: 'MASTERED', importance: 8, masteryScore: 80 },
    { id: 'kp-004-05-03', chapterId: 'ch-004-05', name: '相似矩阵', status: 'MASTERED', importance: 8, masteryScore: 75 },
    { id: 'kp-004-05-04', chapterId: 'ch-004-05', name: '对角化条件', status: 'MASTERED', importance: 8, masteryScore: 75 },
    { id: 'kp-004-05-05', chapterId: 'ch-004-05', name: '实对称矩阵', status: 'MASTERED', importance: 7, masteryScore: 70 },
    // 第六章：二次型
    { id: 'kp-004-06-01', chapterId: 'ch-004-06', name: '二次型及其矩阵', status: 'MASTERED', importance: 8, masteryScore: 80 },
    { id: 'kp-004-06-02', chapterId: 'ch-004-06', name: '标准形', status: 'MASTERED', importance: 9, masteryScore: 80 },
    { id: 'kp-004-06-03', chapterId: 'ch-004-06', name: '规范形', status: 'MASTERED', importance: 7, masteryScore: 70 },
    { id: 'kp-004-06-04', chapterId: 'ch-004-06', name: '正定二次型', status: 'MASTERED', importance: 7, masteryScore: 70 },

    // 普通测量学知识点
    // 第一章
    { id: 'kp-005-01-01', chapterId: 'ch-005-01', name: '测量学的定义与作用', status: 'NEED_REVIEW', importance: 6, masteryScore: 40 },
    { id: 'kp-005-01-02', chapterId: 'ch-005-01', name: '地球椭球体', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    { id: 'kp-005-01-03', chapterId: 'ch-005-01', name: '坐标系统', status: 'NEED_REVIEW', importance: 8, masteryScore: 30 },
    { id: 'kp-005-01-04', chapterId: 'ch-005-01', name: '高程系统', status: 'WEAK', importance: 8, masteryScore: 45 },
    { id: 'kp-005-01-05', chapterId: 'ch-005-01', name: '测量工作原则', status: 'MASTERED', importance: 6, masteryScore: 75 },
    // 第二章
    { id: 'kp-005-02-01', chapterId: 'ch-005-02', name: '水准测量原理', status: 'WEAK', importance: 9, masteryScore: 50 },
    { id: 'kp-005-02-02', chapterId: 'ch-005-02', name: '水准仪及其使用', status: 'WEAK', importance: 8, masteryScore: 45 },
    { id: 'kp-005-02-03', chapterId: 'ch-005-02', name: '水准路线测量', status: 'NEED_REVIEW', importance: 8, masteryScore: 40 },
    { id: 'kp-005-02-04', chapterId: 'ch-005-02', name: '三、四等水准测量', status: 'NEED_REVIEW', importance: 8, masteryScore: 35 },
    { id: 'kp-005-02-05', chapterId: 'ch-005-02', name: '水准测量误差', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    // 第三章
    { id: 'kp-005-03-01', chapterId: 'ch-005-03', name: '水平角测量原理', status: 'NEED_REVIEW', importance: 8, masteryScore: 35 },
    { id: 'kp-005-03-02', chapterId: 'ch-005-03', name: '经纬仪及其使用', status: 'NEED_REVIEW', importance: 8, masteryScore: 40 },
    { id: 'kp-005-03-03', chapterId: 'ch-005-03', name: '测回法', status: 'NEED_REVIEW', importance: 8, masteryScore: 35 },
    { id: 'kp-005-03-04', chapterId: 'ch-005-03', name: '竖直角测量', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-005-03-05', chapterId: 'ch-005-03', name: '角度测量误差', status: 'NEED_REVIEW', importance: 6, masteryScore: 25 },
    // 第四章
    { id: 'kp-005-04-01', chapterId: 'ch-005-04', name: '钢尺量距', status: 'NEED_REVIEW', importance: 7, masteryScore: 40 },
    { id: 'kp-005-04-02', chapterId: 'ch-005-04', name: '视距测量', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    { id: 'kp-005-04-03', chapterId: 'ch-005-04', name: '电磁波测距', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-005-04-04', chapterId: 'ch-005-04', name: '距离测量改正', status: 'NEED_REVIEW', importance: 6, masteryScore: 25 },
    { id: 'kp-005-04-05', chapterId: 'ch-005-04', name: '全站仪测量', status: 'WEAK', importance: 8, masteryScore: 45 },
    // 第五章
    { id: 'kp-005-05-01', chapterId: 'ch-005-05', name: '测量误差分类', status: 'NEED_REVIEW', importance: 8, masteryScore: 35 },
    { id: 'kp-005-05-02', chapterId: 'ch-005-05', name: '精度指标', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-005-05-03', chapterId: 'ch-005-05', name: '误差传播定律', status: 'NEED_REVIEW', importance: 9, masteryScore: 25 },
    { id: 'kp-005-05-04', chapterId: 'ch-005-05', name: '平差计算', status: 'NEED_REVIEW', importance: 7, masteryScore: 20 },
    { id: 'kp-005-05-05', chapterId: 'ch-005-05', name: '权与定权', status: 'NEED_REVIEW', importance: 6, masteryScore: 15 },
    // 第六章
    { id: 'kp-005-06-01', chapterId: 'ch-005-06', name: '控制网概念', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-005-06-02', chapterId: 'ch-005-06', name: '导线测量', status: 'NEED_REVIEW', importance: 8, masteryScore: 25 },
    { id: 'kp-005-06-03', chapterId: 'ch-005-06', name: '三角测量', status: 'NEED_REVIEW', importance: 7, masteryScore: 20 },
    { id: 'kp-005-06-04', chapterId: 'ch-005-06', name: 'GNSS控制测量', status: 'NEED_REVIEW', importance: 8, masteryScore: 25 },
    { id: 'kp-005-06-05', chapterId: 'ch-005-06', name: '坐标计算', status: 'NEED_REVIEW', importance: 7, masteryScore: 20 },
    // 第七章
    { id: 'kp-005-07-01', chapterId: 'ch-005-07', name: '地形图基本知识', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    { id: 'kp-005-07-02', chapterId: 'ch-005-07', name: '地物表示', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-005-07-03', chapterId: 'ch-005-07', name: '地貌表示', status: 'NEED_REVIEW', importance: 7, masteryScore: 25 },
    { id: 'kp-005-07-04', chapterId: 'ch-005-07', name: '地形图测绘方法', status: 'NEED_REVIEW', importance: 8, masteryScore: 20 },
    { id: 'kp-005-07-05', chapterId: 'ch-005-07', name: '数字地形图', status: 'NEED_REVIEW', importance: 6, masteryScore: 15 },

    // 中国近现代史纲要知识点
    // 第一章
    { id: 'kp-006-01-01', chapterId: 'ch-006-01', name: '近代中国社会的性质', status: 'WEAK', importance: 8, masteryScore: 45 },
    { id: 'kp-006-01-02', chapterId: 'ch-006-01', name: '资本-帝国主义侵略', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-006-01-03', chapterId: 'ch-006-01', name: '中国人民的反抗斗争', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    { id: 'kp-006-01-04', chapterId: 'ch-006-01', name: '民族意识的觉醒', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    // 第二章
    { id: 'kp-006-02-01', chapterId: 'ch-006-02', name: '太平天国运动', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-006-02-02', chapterId: 'ch-006-02', name: '洋务运动', status: 'WEAK', importance: 8, masteryScore: 45 },
    { id: 'kp-006-02-03', chapterId: 'ch-006-02', name: '戊戌变法', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-006-02-04', chapterId: 'ch-006-02', name: '早期探索的教训', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    // 第三章
    { id: 'kp-006-03-01', chapterId: 'ch-006-03', name: '辛亥革命爆发的历史条件', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-006-03-02', chapterId: 'ch-006-03', name: '辛亥革命的过程', status: 'WEAK', importance: 7, masteryScore: 35 },
    { id: 'kp-006-03-03', chapterId: 'ch-006-03', name: '辛亥革命的历史意义', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-006-03-04', chapterId: 'ch-006-03', name: '辛亥革命的局限', status: 'WEAK', importance: 7, masteryScore: 35 },
    // 第四章
    { id: 'kp-006-04-01', chapterId: 'ch-006-04', name: '五四运动', status: 'WEAK', importance: 9, masteryScore: 50 },
    { id: 'kp-006-04-02', chapterId: 'ch-006-04', name: '马克思主义的传播', status: 'WEAK', importance: 8, masteryScore: 45 },
    { id: 'kp-006-04-03', chapterId: 'ch-006-04', name: '中国共产党的成立', status: 'WEAK', importance: 9, masteryScore: 45 },
    { id: 'kp-006-04-04', chapterId: 'ch-006-04', name: '国民革命', status: 'NEED_REVIEW', importance: 7, masteryScore: 35 },
    // 第五章
    { id: 'kp-006-05-01', chapterId: 'ch-006-05', name: '武装起义和土地革命', status: 'NEED_REVIEW', importance: 8, masteryScore: 35 },
    { id: 'kp-006-05-02', chapterId: 'ch-006-05', name: '农村革命根据地', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-006-05-03', chapterId: 'ch-006-05', name: '红军长征', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-006-05-04', chapterId: 'ch-006-05', name: '革命经验的总结', status: 'NEED_REVIEW', importance: 6, masteryScore: 25 },
    // 第六章
    { id: 'kp-006-06-01', chapterId: 'ch-006-06', name: '日本侵华与民族危机', status: 'WEAK', importance: 9, masteryScore: 45 },
    { id: 'kp-006-06-02', chapterId: 'ch-006-06', name: '抗日民族统一战线', status: 'WEAK', importance: 9, masteryScore: 50 },
    { id: 'kp-006-06-03', chapterId: 'ch-006-06', name: '正面战场与敌后战场', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-006-06-04', chapterId: 'ch-006-06', name: '抗战胜利的原因与意义', status: 'WEAK', importance: 8, masteryScore: 45 },
    // 第七章
    { id: 'kp-006-07-01', chapterId: 'ch-006-07', name: '解放战争', status: 'NEED_REVIEW', importance: 8, masteryScore: 35 },
    { id: 'kp-006-07-02', chapterId: 'ch-006-07', name: '土地改革', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-006-07-03', chapterId: 'ch-006-07', name: '中国共产党的建国主张', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-006-07-04', chapterId: 'ch-006-07', name: '新中国成立', status: 'WEAK', importance: 8, masteryScore: 45 },
    // 第八章
    { id: 'kp-006-08-01', chapterId: 'ch-006-08', name: '社会主义改造', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
    { id: 'kp-006-08-02', chapterId: 'ch-006-08', name: '社会主义建设道路的探索', status: 'NEED_REVIEW', importance: 7, masteryScore: 25 },
    { id: 'kp-006-08-03', chapterId: 'ch-006-08', name: '社会主义建设的成就', status: 'WEAK', importance: 8, masteryScore: 40 },
    { id: 'kp-006-08-04', chapterId: 'ch-006-08', name: '文化大革命', status: 'NEED_REVIEW', importance: 7, masteryScore: 30 },
  ]

  for (const kpData of knowledgePoints) {
    const kp = await prisma.knowledgePoint.upsert({
      where: { id: kpData.id },
      update: {},
      create: kpData,
    })
  }
  console.log(`✓ 创建了 ${knowledgePoints.length} 个知识点`)

  // ==================== 统计 ====================
  console.log('\n========================================')
  console.log('✅ 完整课程数据添加完成！')
  console.log('========================================')
  console.log('\n📊 数据统计:')
  console.log(`  - 课程: ${courses.length} 门`)
  console.log(`  - 章节: ${chapters.length} 章`)
  console.log(`  - 知识点: ${knowledgePoints.length} 个`)
}

main()
  .catch((e) => {
    console.error('\n❌ 添加课程数据失败:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
