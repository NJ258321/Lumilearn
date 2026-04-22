/**
 * 管理员大屏 - Mock数据
 * LumiTrace AI Admin Dashboard Mock Data
 */

import type {
  DashboardOverview,
  UserStats,
  CourseStats,
  KnowledgeStats,
  MultimodalStats,
  KnowledgeGraphData,
  TrainingTask,
  RagStatus,
  KnowledgeContributor,
  ModelVersion,
  SystemStatus,
  TickerItem,
  GraphNode,
  GraphLink
} from '../src/types/admin';

// 生成模拟知识图谱数据
const generateKnowledgeGraph = (): KnowledgeGraphData => {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const courses = [
    { name: '高等数学', category: 'math' },
    { name: '线性代数', category: 'math' },
    { name: '概率论', category: 'math' },
    { name: '大学物理', category: 'physics' },
    { name: '数据结构', category: 'computer' },
    { name: '算法设计', category: 'computer' },
    { name: '计算机网络', category: 'computer' },
    { name: '操作系统', category: 'computer' }
  ];

  const topics = [
    // 数学 - 高等数学
    { name: '导数', course: 'math', importance: 9 },
    { name: '积分', course: 'math', importance: 9 },
    { name: '微分方程', course: 'math', importance: 8 },
    { name: '极限', course: 'math', importance: 8 },
    { name: '级数', course: 'math', importance: 7 },
    { name: '多元函数', course: 'math', importance: 8 },
    { name: '向量代数', course: 'math', importance: 7 },
    { name: '空间解析几何', course: 'math', importance: 7 },
    // 数学 - 线性代数
    { name: '矩阵', course: 'math', importance: 9 },
    { name: '行列式', course: 'math', importance: 8 },
    { name: '向量', course: 'math', importance: 8 },
    { name: '线性方程组', course: 'math', importance: 8 },
    { name: '特征值', course: 'math', importance: 8 },
    { name: '二次型', course: 'math', importance: 7 },
    // 数学 - 概率论
    { name: '概率分布', course: 'math', importance: 9 },
    { name: '期望方差', course: 'math', importance: 8 },
    { name: '大数定律', course: 'math', importance: 7 },
    { name: '参数估计', course: 'math', importance: 8 },
    { name: '假设检验', course: 'math', importance: 7 },
    // 物理 - 力学
    { name: '牛顿运动定律', course: 'physics', importance: 9 },
    { name: '动量守恒', course: 'physics', importance: 8 },
    { name: '机械能守恒', course: 'physics', importance: 8 },
    { name: '万有引力', course: 'physics', importance: 7 },
    { name: '振动与波', course: 'physics', importance: 7 },
    // 物理 - 电磁学
    { name: '电场', course: 'physics', importance: 9 },
    { name: '磁场', course: 'physics', importance: 8 },
    { name: '电磁感应', course: 'physics', importance: 8 },
    { name: '电磁波', course: 'physics', importance: 7 },
    // 物理 - 光学与热学
    { name: '光的干涉', course: 'physics', importance: 7 },
    { name: '光的衍射', course: 'physics', importance: 6 },
    { name: '热力学第一定律', course: 'physics', importance: 8 },
    { name: '热力学第二定律', course: 'physics', importance: 7 },
    // 计算机 - 数据结构
    { name: '数组', course: 'computer', importance: 9 },
    { name: '链表', course: 'computer', importance: 9 },
    { name: '栈', course: 'computer', importance: 8 },
    { name: '队列', course: 'computer', importance: 8 },
    { name: '树', course: 'computer', importance: 9 },
    { name: '二叉树', course: 'computer', importance: 9 },
    { name: '平衡树', course: 'computer', importance: 8 },
    { name: '堆', course: 'computer', importance: 7 },
    { name: '图', course: 'computer', importance: 9 },
    { name: '哈希表', course: 'computer', importance: 8 },
    // 计算机 - 算法
    { name: '排序算法', course: 'computer', importance: 9 },
    { name: '查找算法', course: 'computer', importance: 8 },
    { name: '动态规划', course: 'computer', importance: 9 },
    { name: '贪心算法', course: 'computer', importance: 8 },
    { name: '回溯算法', course: 'computer', importance: 8 },
    { name: '分治算法', course: 'computer', importance: 7 },
    { name: '分支限界', course: 'computer', importance: 7 },
    { name: '图算法', course: 'computer', importance: 9 },
    // 计算机 - 计算机网络
    { name: 'TCP/IP协议', course: 'computer', importance: 9 },
    { name: 'HTTP协议', course: 'computer', importance: 8 },
    { name: 'DNS解析', course: 'computer', importance: 7 },
    { name: '路由算法', course: 'computer', importance: 8 },
    { name: '网络安全', course: 'computer', importance: 8 },
    // 计算机 - 操作系统
    { name: '进程管理', course: 'computer', importance: 9 },
    { name: '内存管理', course: 'computer', importance: 9 },
    { name: '文件系统', course: 'computer', importance: 8 },
    { name: '死锁', course: 'computer', importance: 7 },
    { name: '调度算法', course: 'computer', importance: 8 },
    // 计算机 - 数据库
    { name: 'SQL查询', course: 'computer', importance: 9 },
    { name: '索引', course: 'computer', importance: 8 },
    { name: '事务', course: 'computer', importance: 9 },
    { name: '范式', course: 'computer', importance: 7 },
    { name: '数据库设计', course: 'computer', importance: 8 },
    // 化学
    { name: '原子结构', course: 'chemistry', importance: 8 },
    { name: '化学键', course: 'chemistry', importance: 8 },
    { name: '化学反应', course: 'chemistry', importance: 9 },
    { name: '氧化还原', course: 'chemistry', importance: 8 },
    { name: '酸碱平衡', course: 'chemistry', importance: 7 },
    { name: '有机化学', course: 'chemistry', importance: 9 },
    { name: '分子结构', course: 'chemistry', importance: 7 },
    // 生物
    { name: '细胞结构', course: 'biology', importance: 9 },
    { name: '新陈代谢', course: 'biology', importance: 8 },
    { name: '遗传与变异', course: 'biology', importance: 9 },
    { name: '光合作用', course: 'biology', importance: 8 },
    { name: '呼吸作用', course: 'biology', importance: 7 },
    { name: '生物膜', course: 'biology', importance: 7 },
    // 英语
    { name: '词汇', course: 'english', importance: 9 },
    { name: '语法', course: 'english', importance: 9 },
    { name: '阅读理解', course: 'english', importance: 8 },
    { name: '写作', course: 'english', importance: 8 },
    { name: '翻译', course: 'english', importance: 7 },
    { name: '听力', course: 'english', importance: 7 }
  ];

  // 创建节点
  topics.forEach((topic, index) => {
    nodes.push({
      id: `kp_${index + 1}`,
      name: topic.name,
      course: topic.course,
      importance: topic.importance,
      category: topic.course
    });
  });

  // 创建边（关系）- 增加更多连接
  const relations = [
    // 数学 - 高等数学
    ['导数', '积分'], ['导数', '微分方程'], ['导数', '极限'], ['导数', '级数'],
    ['积分', '微分方程'], ['积分', '级数'], ['极限', '导数'], ['极限', '积分'],
    ['级数', '积分'], ['多元函数', '导数'], ['多元函数', '积分'], ['向量代数', '导数'],
    // 数学 - 线性代数
    ['矩阵', '行列式'], ['矩阵', '向量'], ['矩阵', '线性方程组'], ['矩阵', '特征值'],
    ['行列式', '线性方程组'], ['向量', '线性方程组'], ['特征值', '二次型'], ['线性方程组', '特征值'],
    // 数学 - 概率论
    ['概率分布', '期望方差'], ['概率分布', '大数定律'], ['期望方差', '参数估计'],
    ['大数定律', '参数估计'], ['参数估计', '假设检验'],
    // 物理 - 力学
    ['牛顿运动定律', '动量守恒'], ['牛顿运动定律', '机械能守恒'], ['动量守恒', '机械能守恒'],
    ['万有引力', '牛顿运动定律'], ['振动与波', '机械能守恒'], ['机械能守恒', '振动与波'],
    // 物理 - 电磁学
    ['电场', '磁场'], ['电场', '电磁感应'], ['磁场', '电磁感应'], ['电磁感应', '电磁波'],
    // 物理 - 光学热学
    ['光的干涉', '光的衍射'], ['热力学第一定律', '热力学第二定律'],
    // 计算机 - 数据结构
    ['数组', '链表'], ['数组', '栈'], ['数组', '排序算法'], ['数组', '哈希表'],
    ['链表', '栈'], ['链表', '队列'], ['栈', '队列'], ['栈', '递归'],
    ['树', '二叉树'], ['树', '平衡树'], ['二叉树', '平衡树'], ['二叉树', '堆'],
    ['树', '图'], ['堆', '排序算法'], ['图', '图算法'], ['哈希表', '查找算法'],
    // 计算机 - 算法
    ['排序算法', '查找算法'], ['排序算法', '动态规划'], ['排序算法', '分治算法'],
    ['动态规划', '贪心算法'], ['动态规划', '回溯算法'], ['贪心算法', '分治算法'],
    ['回溯算法', '分支限界'], ['图算法', '动态规划'], ['图算法', '贪心算法'],
    // 计算机 - 网络
    ['TCP/IP协议', 'HTTP协议'], ['TCP/IP协议', 'DNS解析'], ['TCP/IP协议', '路由算法'],
    ['HTTP协议', 'DNS解析'], ['DNS解析', '路由算法'], ['路由算法', '网络安全'],
    // 计算机 - 操作系统
    ['进程管理', '内存管理'], ['进程管理', '文件系统'], ['进程管理', '死锁'],
    ['内存管理', '文件系统'], ['内存管理', '调度算法'], ['文件系统', '死锁'],
    ['调度算法', '进程管理'],
    // 计算机 - 数据库
    ['SQL查询', '索引'], ['SQL查询', '事务'], ['索引', '数据库设计'],
    ['事务', '范式'], ['事务', '数据库设计'], ['范式', '数据库设计'],
    // 化学
    ['原子结构', '化学键'], ['原子结构', '分子结构'], ['化学键', '化学反应'],
    ['化学反应', '氧化还原'], ['氧化还原', '酸碱平衡'], ['有机化学', '分子结构'],
    // 生物
    ['细胞结构', '新陈代谢'], ['细胞结构', '生物膜'], ['新陈代谢', '光合作用'],
    ['新陈代谢', '呼吸作用'], ['遗传与变异', '细胞结构'], ['光合作用', '呼吸作用'],
    // 跨学科连接
    ['导数', '牛顿运动定律'], ['矩阵', '量子力学'], ['概率分布', '遗传与变异'],
    ['电场', '化学键'], ['进程管理', '细胞结构'], ['SQL查询', '概率分布']
  ];

  relations.forEach(([source, target]) => {
    const sourceNode = nodes.find(n => n.name === source);
    const targetNode = nodes.find(n => n.name === target);
    if (sourceNode && targetNode) {
      links.push({
        source: sourceNode.id,
        target: targetNode.id,
        weight: Math.floor(Math.random() * 5) + 3
      });
    }
  });

  return { nodes, links };
};

// 用户统计数据
const userStats: UserStats = {
  total: 1234,
  active: 856,
  todayNew: 23,
  trend: [120, 145, 132, 156, 143, 168, 175]
};

// 课程统计数据
const courseStats: CourseStats = {
  total: 45,
  studying: 32,
  reviewing: 8,
  archived: 5,
  byType: {
    professional: 28,
    crossMajor: 10,
    elective: 7
  }
};

// 知识点统计数据
const knowledgeStats: KnowledgeStats = {
  totalNodes: 12890,
  totalEdges: 45230,
  mastered: 5800,
  weak: 3222,
  needReview: 3868,
  todayNew: 156
};

// 多模态数据统计
const multimodalStats: MultimodalStats = {
  audioHours: 12456,
  imageCount: 89234,
  noteCount: 45678,
  practiceCount: 234567,
  dailyTrend: [
    { date: '04-01', value: 1234 },
    { date: '04-02', value: 1456 },
    { date: '04-03', value: 1678 },
    { date: '04-04', value: 1567 },
    { date: '04-05', value: 1890 },
    { date: '04-06', value: 2100 },
    { date: '04-07', value: 1956 }
  ]
};

// 训练任务数据
const trainingRunning: TrainingTask[] = [
  {
    id: 'task_1',
    name: '模型微调-高数第一章',
    progress: 67,
    status: 'running',
    estimatedTime: '3分钟',
    course: 'math'
  },
  {
    id: 'task_2',
    name: 'RAG索引构建-数据结构',
    progress: 32,
    status: 'running',
    estimatedTime: '8分钟',
    course: 'computer'
  },
  {
    id: 'task_3',
    name: '知识图谱更新-线性代数',
    progress: 45,
    status: 'running',
    estimatedTime: '5分钟',
    course: 'math'
  }
];

const trainingQueued: TrainingTask[] = [
  {
    id: 'task_4',
    name: '错题分析-计算机组成',
    progress: 0,
    status: 'queued',
    course: 'computer'
  },
  {
    id: 'task_5',
    name: '考点预测-概率论',
    progress: 0,
    status: 'queued',
    course: 'math'
  },
  {
    id: 'task_6',
    name: '薄弱点建模-操作系统',
    progress: 0,
    status: 'queued',
    course: 'computer'
  },
  {
    id: 'task_7',
    name: '知识向量化-大学物理',
    progress: 0,
    status: 'queued',
    course: 'physics'
  },
  {
    id: 'task_8',
    name: '复习计划生成-算法设计',
    progress: 0,
    status: 'queued',
    course: 'computer'
  }
];

// RAG状态数据
const ragStatus: RagStatus = {
  totalEntries: 45678,
  dimension: 1536,
  indexType: 'HNSW',
  lastUpdate: '2026-04-07 14:25',
  sources: [
    { name: '教材', count: 20555, ratio: 45 },
    { name: '真题', count: 9136, ratio: 20 },
    { name: '笔记', count: 6832, ratio: 15 },
    { name: '用户贡献', count: 9155, ratio: 20 }
  ]
};

// 众源知识贡献者
const contributions: KnowledgeContributor[] = [
  {
    id: 'contrib_1',
    name: '张教授',
    role: 'teacher',
    contributionCount: 2345,
    quality: 4.5,
    status: 'merged',
    latestContribution: '导数几何应用'
  },
  {
    id: 'contrib_2',
    name: '李老师',
    role: 'teacher',
    contributionCount: 1890,
    quality: 4.3,
    status: 'merged',
    latestContribution: '定积分计算'
  },
  {
    id: 'contrib_3',
    name: '王同学',
    role: 'student',
    contributionCount: 5678,
    quality: 3.8,
    status: 'reviewing',
    latestContribution: '矩阵性质补充'
  },
  {
    id: 'contrib_4',
    name: '赵同学',
    role: 'student',
    contributionCount: 3456,
    quality: 3.5,
    status: 'reviewing',
    latestContribution: '排序算法对比'
  },
  {
    id: 'contrib_5',
    name: '外部导入',
    role: 'external',
    contributionCount: 3456,
    quality: 4.2,
    status: 'merged',
    latestContribution: '历年真题库'
  }
];

// 模型版本数据
const modelVersion: ModelVersion = {
  currentVersion: 'v2.3.1',
  baseModel: 'gpt-4o-mini',
  fineTuneMethod: 'LoRA (r=16, lora_alpha=32)',
  trainDataCount: 45678,
  accuracy: 92.3,
  history: [
    { version: 'v2.3.1', date: '2026-04-05', status: 'current' },
    { version: 'v2.3.0', date: '2026-03-20', status: 'previous' },
    { version: 'v2.2.9', date: '2026-03-01', status: 'archive' },
    { version: 'v2.2.8', date: '2026-02-15', status: 'archive' }
  ]
};

// 系统状态数据
const systemStatus: SystemStatus = {
  onlineUsers: 128,
  systemHealth: 'normal',
  lastUpdate: new Date().toISOString()
};

// 底部滚动数据
const tickerData: TickerItem[] = [
  { label: '今日学习时长', value: 12456, unit: 'h' },
  { label: '新增题目', value: 2341, unit: '题' },
  { label: '活跃课程', value: 45, unit: '门' },
  { label: '知识节点', value: 12890, unit: '个' },
  { label: 'AI分析次数', value: 8765, unit: '次' },
  { label: '错题本更新', value: 234, unit: '条' }
];

// 导出完整的Mock数据
export const mockDashboardData: DashboardOverview = {
  users: userStats,
  courses: courseStats,
  knowledge: knowledgeStats,
  multimodal: multimodalStats,
  knowledgeGraph: generateKnowledgeGraph(),
  training: {
    running: trainingRunning,
    queued: trainingQueued,
    completed: 12
  },
  rag: ragStatus,
  contributions: contributions,
  model: modelVersion,
  system: systemStatus,
  ticker: tickerData
};

export default mockDashboardData;