/**
 * 管理员大屏 - TypeScript类型定义
 * LumiTrace AI Admin Dashboard Types
 */

// 用户统计数据
export interface UserStats {
  total: number;
  active: number;
  todayNew: number;
  trend: number[];
}

// 课程统计数据
export interface CourseStats {
  total: number;
  studying: number;
  reviewing: number;
  archived: number;
  byType: {
    professional: number;
    crossMajor: number;
    elective: number;
  };
}

// 知识点统计数据
export interface KnowledgeStats {
  totalNodes: number;
  totalEdges: number;
  mastered: number;
  weak: number;
  needReview: number;
  todayNew: number;
}

// 多模态数据统计
export interface MultimodalStats {
  audioHours: number;
  imageCount: number;
  noteCount: number;
  practiceCount: number;
  dailyTrend: {
    date: string;
    value: number;
  }[];
}

// 知识图谱节点
export interface GraphNode {
  id: string;
  name: string;
  course: string;
  importance: number;
  category: string;
}

// 知识图谱边
export interface GraphLink {
  source: string;
  target: string;
  weight: number;
}

// 知识图谱数据
export interface KnowledgeGraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

// 训练任务
export interface TrainingTask {
  id: string;
  name: string;
  progress: number;
  status: 'running' | 'queued' | 'completed';
  estimatedTime?: string;
  course?: string;
}

// RAG知识库条目
export interface RagSource {
  name: string;
  count: number;
  ratio: number;
}

// RAG状态
export interface RagStatus {
  totalEntries: number;
  dimension: number;
  indexType: string;
  lastUpdate: string;
  sources: RagSource[];
}

// 众源知识贡献者
export interface KnowledgeContributor {
  id: string;
  name: string;
  role: 'teacher' | 'student' | 'external';
  contributionCount: number;
  quality: number;
  status: 'merged' | 'reviewing';
  latestContribution?: string;
}

// 模型版本信息
export interface ModelVersion {
  currentVersion: string;
  baseModel: string;
  fineTuneMethod: string;
  trainDataCount: number;
  accuracy: number;
  history: {
    version: string;
    date: string;
    status: string;
  }[];
}

// 系统状态
export interface SystemStatus {
  onlineUsers: number;
  systemHealth: 'normal' | 'warning' | 'error';
  lastUpdate: string;
}

// 底部滚动数据项
export interface TickerItem {
  label: string;
  value: string | number;
  unit?: string;
}

// 大屏总览数据 (综合)
export interface DashboardOverview {
  users: UserStats;
  courses: CourseStats;
  knowledge: KnowledgeStats;
  multimodal: MultimodalStats;
  knowledgeGraph: KnowledgeGraphData;
  training: {
    running: TrainingTask[];
    queued: TrainingTask[];
    completed: number;
  };
  rag: RagStatus;
  contributions: KnowledgeContributor[];
  model: ModelVersion;
  system: SystemStatus;
  ticker: TickerItem[];
}

// 知识图谱节点课程分类
export type CourseCategory = 'math' | 'physics' | 'computer' | 'chemistry' | 'biology' | 'english' | 'other';

// 课程分类颜色映射
export const COURSE_COLORS: Record<CourseCategory, string> = {
  math: '#3b82f6',       // 科技蓝
  physics: '#6366f1',    // 蓝紫
  computer: '#06b6d4',   // 翡翠青
  chemistry: '#f59e0b',  // 暖橙
  biology: '#ec4899',    // 淡粉
  english: '#d97706',   // 暗金
  other: '#64748b',      // 灰蓝
};