import { Task, Course, TranscriptSegment, TaskGroup } from './types';

export const COLORS = {
  bg: '#F7F9FC',
  card: '#FFFFFF',
  primary: '#3498DB', // Brand Blue updated
  secondary: '#10B981', // Green
  warning: '#F59E0B', // Yellow
  danger: '#EF4444',  // Red
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF'
};

export const MOCK_TASK_GROUPS: TaskGroup[] = [
  {
    courseId: 'c1',
    courseName: '数据结构',
    tag: '三轮冲刺',
    tagColor: 'red',
    progress: '3/3',
    tasks: [
      { id: '1-1', courseName: '数据结构', title: '全真模拟卷 (2024卷)', duration: '120min', status: 'in-progress', type: 'paper', tag: '' },
      { id: '1-2', courseName: '数据结构', title: '错题重刷 (第5-8章)', duration: '45min', status: 'pending', type: 'mistake', tag: '' }
    ]
  },
  {
    courseId: 'c2',
    courseName: '高等数学',
    tag: '二轮突破',
    tagColor: 'orange',
    progress: '1/2',
    tasks: [
      { id: '2-1', courseName: '高等数学', title: '复习知识点：第5章 1-3节', duration: '30min', status: 'completed', type: 'review', tag: '' },
      { id: '2-2', courseName: '高等数学', title: '章节测试：第5章', duration: '20min', status: 'pending', type: 'quiz', tag: '' }
    ]
  },
  {
    courseId: 'c3',
    courseName: '计算机网络',
    tag: '一轮夯实',
    tagColor: 'blue',
    progress: '0/1',
    tasks: [
      { id: '3-1', courseName: '计算机网络', title: '课堂回溯：物理层基本概念', duration: '45min', status: 'pending', type: 'review', tag: '' }
    ]
  }
];

export const MOCK_COURSES: Course[] = [
  { id: 'c1', name: '数据结构', lastReview: '2025/01/24', status: 'reviewing', type: 'major', semester: '2024-2025 秋季' },
  { id: 'c2', name: '高等数学', lastReview: '2025/01/23', status: 'reviewing', type: 'major', semester: '2024-2025 秋季' },
  { id: 'c3', name: '计算机网络', lastReview: '2025/01/20', status: 'reviewing', type: 'major', semester: '2024-2025 秋季' },
  { id: 'c4', name: '近代史纲要', lastReview: '2025/01/15', status: 'studying', type: 'elective', semester: '2024-2025 秋季' },
  { id: 'c5', name: '大学英语', lastReview: '2025/01/18', status: 'studying', type: 'major', semester: '2024-2025 秋季' },
  { id: 'c6', name: 'C语言程序设计', status: 'archived', type: 'major', semester: '2023-2024 春季' },
  { id: 'c7', name: '思想道德修养', status: 'archived', type: 'elective', semester: '2023-2024 春季' },
  { id: 'c8', name: '线性代数', status: 'archived', type: 'major', semester: '2023-2024 春季' },
];

export const MOCK_TRANSCRIPT: TranscriptSegment[] = [
    { time: 0, text: "好，我们开始上课。" },
    { time: 2, text: "今天我们来讲二叉树的遍历，这部分非常重要。" },
    { time: 5, text: "大家看这张图，这是一个典型的满二叉树结构。" },
    { time: 10, text: "所谓前序遍历，就是‘根-左-右’的顺序。", isKeypoint: true },
    { time: 15, text: "我们先访问根节点A，然后去它的左子树..." },
    { time: 20, text: "如果左子树也是一棵树，我们就递归地运用这个规则。" },
    { time: 25, text: "这个递归的思想是数据结构的核心，也是考试的必考点。", isKeypoint: true },
    { time: 30, text: "很多同学在写代码的时候容易忘记递归出口。" },
    { time: 35, text: "一定要注意，当节点为空时，直接返回。" },
    { time: 40, text: "我们来看一下这个具体的代码实现..." }
];