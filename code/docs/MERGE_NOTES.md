# 助学练习功能合并说明

## 一、合并概述

本次合并主要包含 **助学、练习页面及相关功能** 的开发工作，涉及前后端的完整功能实现。核心改动包括：AI 智能出题、错题管理、知识点掌握度分析、学习路径推荐等模块。

**合并分支**: `merge-test` → `main`
**改动文件数**: 约 19 个文件

---

## 二、功能变更总结

### 2.1 底部导航栏（BottomNav）

#### 2.1.1 导航结构
- **五大核心入口**：
  1. **今日** (Dashboard) - 首页/仪表盘
  2. **课程** (Courses) - 课程列表
  3. **+** (Recorder) - 录音/记录（特殊圆形按钮，突出显示）
  4. **助学** (Analysis) - AI 分析与学习辅助
  5. **练习** (PracticeList) - 练习中心

#### 2.1.2 样式特点
- 固定底部导航，高度 70px
- 白色背景 + 顶部细微阴影
- 特殊加号按钮：蓝色圆形悬浮设计
- 选中态：蓝色高亮，未选中：灰色文字
- 字体大小 10px，精简标注

---

### 2.2 练习模块（Practice List & Drill）

#### 2.2.1 练习列表页 (PracticeList.tsx)
- **课程筛选功能**
  - 下拉筛选：全部课程 / 复习中 / 学习中
  - 实时过滤展示

- **课程卡片展示**
  - 课程名称与状态标签
  - 掌握度进度环（PieChart 可视化）
  - 薄弱点数量统计
  - 掌握度百分比显示

- **数据来源**
  - 调用 `getCourseList()` 获取课程列表
  - 调用 `getKnowledgeMastery()` 获取每个课程的掌握度数据

#### 2.2.2 练习中心页 (Drill.tsx)
- **考点掌握度图表**
  - 饼图展示：薄弱(红) / 待巩固(黄) / 已掌握(蓝)
  - 整体掌握度百分比计算

- **AI 智能出题**
  - 点击"AI 生成练习"按钮
  - 调用 `generateAIQuestions()` 接口
  - 支持自定义：题目数量、题型（单选/多选/判断）、难度
  - 生成后直接跳转到答题页面

- **错题数据对接**
  - 调用 `getMistakes()` 获取错题列表
  - 展示错题数量统计

---

### 2.3 错题管理模块

#### 2.3.1 错题本页面 (Mistakes.tsx)
- **错题统计概览**
  - 总错题数（红色高亮）
  - 已复习数（绿色）
  - 未复习数（黄色）

- **错题列表**
  - 按知识点分组展示
  - 显示错题内容摘要
  - 点击进入错题详情

#### 2.3.2 错题详情页面 (MistakeDetail.tsx) - **新增**
- **逐题解析模式**
  - 滑动切换查看每道错题
  - 显示：题目内容、用户答案、正确答案、解析

- **答案对比展示**
  - 正确：绿色勾选标记
  - 错误：红色叉号标记
  - 差异对比清晰

- **AI 解析功能**
  - 集成 Lumi AI 分析错题
  - 提供知识点讲解与学习建议

---

### 2.4 答题模块 (Exam.tsx)

#### 2.4.1 答题流程
- **多模式支持**
  - `daily` - 每日练习
  - `challenge` - 挑战模式
  - `random` - 随机练习
  - `session` - 专题练习
  - `personalized` - 个性化练习
  - `ai-generated` - AI 生成练习

- **答题界面**
  - 计时器显示
  - 题目序号指示器
  - 上一题/下一题导航
  - 答题进度条

- **答案处理**
  - 单选/多选/判断题支持
  - 多种选项格式兼容（对象格式/数组格式）

- **交卷与结果**
  - 提交答案到后端
  - 显示得分与正确率
  - 错题自动加入错题本

---

### 2.5 助学分析模块 (Analysis.tsx)

#### 2.5.1 课程选择
- 顶部课程下拉选择器
- 支持搜索课程
- 默认选中：高等数学

#### 2.5.2 分析功能 Tab
- **薄弱点分析** (weak) - 掌握度不足的知识点
- **掌握度分布** (mastery) - 各类知识点占比
- **知识关联** (correlation) - 知识点之间的关系网络
- **学习顺序** (sequence) - 推荐的知识点学习路径
- **瓶颈检测** (bottleneck) - 影响整体学习进度的关键知识点
- **学习评估** (evaluation) - AI 综合评估报告
- **学习效率** (efficiency) - 学习效率分析
- **对比分析** (compare) - 不同时期的学习对比

#### 2.5.3 数据展示
- 柱状图、饼图、趋势图等多种可视化
- 加载状态指示
- 空数据友好提示

---

### 2.6 AI 助手 (Lumi) - Bug 修复

#### 2.6.1 问题描述
- 原问题：Lumi 对话时直接调用 Google Gemini API
- `.env.local` 中的 API Key 为占位符 (`PLACEHOLDER_API_KEY`)
- 导致每次对话都会报错

#### 2.6.2 修复方案
- 改为调用后端 `/api/ai/chat` 接口
- 使用后端已配置的 Minimax AI 服务
- 前端新增 `services/aiChatService.ts`

---

### 2.7 课程学习模块增强 (CourseDetailStudy.tsx)

#### 2.7.1 学习记录管理
- 章节知识点树形展示
- 学习状态跟踪（已完成/进行中/未开始）
- 知识点掌握度显示

#### 2.7.2 知识点操作
- 批量创建知识点
- 批量更新状态
- 掌握度更新

---

## 三、改动文件清单

### 3.1 前端文件（lumilearn-ai）

| 文件路径 | 改动类型 | 说明 |
|---------|---------|------|
| `components/BottomNav.tsx` | 样式调整 | 底部导航栏（5个入口） |
| `pages/PracticeList.tsx` | **增强** | 练习列表页（课程筛选、掌握度展示） |
| `pages/Drill.tsx` | **增强** | 练习中心（AI 出题、掌握度图表） |
| `pages/Mistakes.tsx` | **增强** | 错题本（统计、列表） |
| `pages/MistakeDetail.tsx` | **新增** | 错题详情（逐题解析） |
| `pages/Exam.tsx` | **增强** | 答题页面（多模式支持） |
| `pages/Analysis.tsx` | **增强** | 助学分析页（多维度分析） |
| `pages/CourseDetailStudy.tsx` | 增强 | 课程学习详情 |
| `pages/Agent.tsx` | 修复 | Lumi AI 对话修复 |
| `services/aiChatService.ts` | **新增** | AI 对话服务封装 |
| `src/api/exams.ts` | 增强 | 考试相关 API |
| `src/api/statistics.ts` | 增强 | 统计数据 API |
| `src/api/courses.ts` | 扩展 | 课程 CRUD API |
| `src/api/knowledgePoints.ts` | 扩展 | 知识点 API |
| `src/api/request.ts` | 修复/扩展 | 修复 GET 请求、新增端点 |

### 3.2 后端文件（backend）

| 文件路径 | 改动类型 | 说明 |
|---------|---------|------|
| `src/routes/review.ts` | 重大增强 | 智能复习计划生成算法 |
| `src/routes/settings.ts` | 增强 | 用户设置相关 |
| `src/routes/statistics.ts` | 增强 | 统计数据接口完善 |
| `src/routes/ai.ts` | 新增接口 | AI 对话接口 |
| `src/index.ts` | 调整 | 路由注册 |

---

## 四、API 接口变更

### 4.1 新增接口

| 接口路径 | 方法 | 说明 |
|---------|------|------|
| `/api/ai/chat` | POST | AI 对话通用接口 |
| `/api/mistakes` | GET | 获取错题列表 |
| `/api/ai/explain` | POST | 知识点解释生成 |
| `/api/ai/suggest` | POST | 学习建议生成 |
| `/api/statistics/knowledge-points/:courseId/mastery` | GET | 知识点掌握度统计 |
| `/api/analysis/knowledge-points/:courseId/correlation` | GET | 知识关联分析 |
| `/api/analysis/learning-sequence/:courseId` | GET | 学习顺序推荐 |
| `/api/analysis/bottlenecks/:courseId` | GET | 瓶颈检测 |

### 4.2 优化接口

| 接口路径 | 方法 | 优化内容 |
|---------|------|---------|
| `/api/exams/ai-generate` | POST | AI 智能生成题目 |
| `/api/review/today` | GET | 智能任务生成 |

---

## 五、合并建议

### 5.1 合并顺序

1. **第一步**：合并后端代码
   - `src/routes/review.ts`（核心复习逻辑）
   - `src/routes/ai.ts`（AI 接口）
   - `src/routes/statistics.ts`

2. **第二步**：合并前端基础配置
   - `src/api/request.ts`
   - `types.ts`

3. **第三步**：合并前端 API 层
   - `src/api/exams.ts`
   - `src/api/statistics.ts`
   - `services/aiChatService.ts`

4. **第四步**：合并前端页面
   - `pages/MistakeDetail.tsx`（新增）
   - `pages/Drill.tsx`
   - `pages/Mistakes.tsx`
   - `pages/Exam.tsx`
   - `pages/Analysis.tsx`
   - `pages/PracticeList.tsx`

5. **最后**：合并组件
   - `components/BottomNav.tsx`

### 5.2 潜在冲突点

| 文件 | 冲突风险 | 解决方案 |
|------|---------|---------|
| `pages/Analysis.tsx` | 中 | 多 Tab 切换逻辑需仔细对比 |
| `pages/Exam.tsx` | 中 | 答题状态管理可能冲突 |
| `src/api/request.ts` | 低 | 注意端点定义 |

### 5.3 测试建议

1. **导航测试**：验证 5 个入口都能正确跳转
2. **练习流程**：筛选课程 → 进入练习 → AI 出题 → 答题 → 查看结果
3. **错题流程**：答题出错 → 进入错题本 → 查看详情 → AI 解析
4. **助学流程**：选择课程 → 切换分析 Tab → 查看各类分析数据
5. **AI 对话**：进入 Lumi 页面，发送消息，确认能正常回复

### 5.4 环境配置

**后端（backend/.env）**:
```env
MINIMAX_API_KEY=your_minimax_key  # AI 对话服务
```

**前端（lumilearn-ai/.env.local）**:
```env
VITE_API_BASE_URL=http://localhost:3000
```

---

## 六、数据流说明

### 6.1 练习数据流
```
PracticeList → Drill → Exam → (答题结果)
                   ↓
            generateAIQuestions
                   ↓
              AI 生成题目
                   ↓
               跳转 Exam
```

### 6.2 错题数据流
```
Exam (答题错误) → 创建错题
        ↓
Mistakes (错题本) → MistakeDetail (详情) → Lumi AI (解析)
```

### 6.3 助学数据流
```
Analysis (选择课程) → 多维度分析
    ├── getKnowledgeMastery → 掌握度分布
    ├── getKnowledgeCorrelation → 知识关联
    ├── getLearningSequence → 学习顺序
    └── getBottlenecks → 瓶颈检测
```

---

## 七、注意事项

1. **AI 出题功能**：需要后端 Minimax API Key 已配置
2. **知识点掌握度**：依赖 `knowledgePoint` 表的 `masteryScore` 字段
3. **错题记录**：答题错误时自动创建错题记录
4. **底部导航**：5 个入口对应 5 个主要页面组件

---

## 八、版本兼容性

- **前端版本**: 需要重新构建 `npm run build`
- **后端版本**: 需要重启服务
- **数据库**: 无需迁移，兼容现有结构

---

*文档生成时间: 2026-03-15*
*合并分支: merge-test → main*
