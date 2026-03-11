# Dashboard 页面重构任务计划

> 创建时间：2026-03-11
> 目的：统一Dashboard的"今日安排"卡片和Timeline时间线的数据展示

---

## 一、问题现状

### 1.1 核心问题

| 模块 | API | 返回内容 | 问题 |
|-----|-----|---------|------|
| 今日安排卡片 | `/api/daily-review/overview` | 所有非归档课程概览（5门） | 展示课程状态 |
| Timeline时间线 | `/api/review/today` | 每天最多6个任务 | 只展示有任务的课程 |

两个模块数据来源不同，导致显示不一致。

---

## 二、任务类型定义

### 2.1 任务来源

| 任务类型 | 来源 | 任务时长 | 休息时长 |
|---------|------|---------|---------|
| 课堂回顾 | ExamTask (CHAPTER_REVIEW) | 40分钟 | 10分钟 |
| 全真模拟 | ExamTask (MOCK_EXAM) | 80分钟 | 15分钟 |
| 题目练习 | ExamTask (WEAK_POINT) | 25分钟 | 8分钟 |
| 薄弱点复习 | 动态生成 | 15分钟 | 5分钟 |
| 艾宾浩斯复习 | 动态生成 | 10分钟 | 5分钟 |
| 新知识学习 | 动态生成 | 25分钟 | 8分钟 |

### 2.2 休息时长规则

```
任务时长 < 30分钟  → 休息5分钟
任务时长 30-45分钟 → 休息8分钟
任务时长 > 45分钟  → 休息10分钟
```

---

## 三、用户设置功能

### 3.1 学习时间段设置

在用户设置的 `preferences` 中新增 `schedule` 字段：

```typescript
interface SchedulePreferences {
  enabled: boolean
  morning: { start: string, end: string }     // 默认 09:00-12:00
  afternoon: { start: string, end: string }   // 默认 14:00-18:00
  evening: { start: string, end: string }     // 默认 19:00-21:00
}
```

### 3.2 默认时间段

| 时段 | 默认时间 | 说明 |
|-----|---------|------|
| 上午 | 09:00-12:00 | 可安排学习任务 |
| 午休 | 12:00-14:00 | 不安排任务 |
| 下午 | 14:00-18:00 | 可安排学习任务 |
| 晚休 | 18:00-19:00 | 不安排任务 |
| 晚上 | 19:00-21:00 | 可安排学习任务 |

---

## 四、具体任务清单

### 任务1：扩展用户设置 - 学习时间段配置 ✅ 已完成

**优先级**：P0（前置任务）

**后端改动**：
- [x] 1.1 修改 `settings.ts`，在 `DEFAULT_PREFERENCES` 中新增 `schedule` 字段
- [x] 1.2 修改 `PUT /api/settings`，支持接收和保存 `schedule` 配置
- [x] 1.3 修改 `GET /api/settings`，返回 `schedule` 配置

**前端改动**：
- [x] 1.4 在类型定义中添加 `SchedulePreferences` 类型
- [ ] 1.5 修改设置页面，添加时间段配置UI（待前端页面开发）

---

### 任务2：修改 /api/review/today API ✅ 已完成

**优先级**：P0（核心任务）

**后端改动** (`review.ts`)：

- [x] 2.1 获取用户设置中的可用时间段
- [x] 2.2 从 `exam_tasks` 表获取今日计划任务（按日期筛选）
- [x] 2.3 计算每个时间段可安排的任务数量：
  ```
  可用时长 = 上午时长 + 下午时长 + 晚上时长
  任务数量 = 可用时长 ÷ (平均任务时长 + 休息时长)
  ```
- [x] 2.4 为每个任务分配具体时间（按时间段依次安排）
- [x] 2.5 如果ExamTask不足，用动态生成补充（薄弱点、艾宾浩斯、新知识）
- [x] 2.6 返回任务列表增加 `scheduledTime` 字段

**新增返回字段**：
```typescript
interface TodayReviewResponse {
  date: string
  dailyGoal: number
  totalItems: number
  totalTime: number
  totalRestTime: number
  totalTaskAndRestTime: number
  coveredCourses: number
  schedule: {
    enabled: boolean
    morning: { start: string, end: string }
    afternoon: { start: string, end: string }
    evening: { start: string, end: string }
  }
  courses: CourseInfo[]
  items: Task[]
}
```

---

### 任务3：扩展本周学习概览卡片 ✅ 已完成

**优先级**：P1

**后端改动**：
- [x] 3.1 扩展 `/api/statistics/dashboard` 返回更多字段：
  - 今日目标学习时长 (dailyGoal)
  - 今日已学习时长 (todayStudyTime)
  - 今日任务完成进度 (todayProgress)

**前端改动** (`Dashboard.tsx`)：
- [ ] 3.2 在卡片中显示：今日目标时长（从设置获取，可下拉修改）
- [ ] 3.3 显示：今日已学习时长
- [ ] 3.4 显示：任务完成进度（百分比 + 已完成任务数/总任务数）
- [ ] 3.5 下拉修改"今日目标"后调用API保存到后端

---

### 任务4：修改"今日安排"卡片 ✅ 已完成

**优先级**：P1

**采用方案**：方案一（学习任务汇总，使用 `/api/daily-review/overview`）

**前端改动** (`Dashboard.tsx`)：
- [x] 4.1 将"今日安排"改名为"学习任务汇总"
- [x] 4.2 使用 `/api/daily-review/overview` API数据
- [x] 4.3 设计精简的卡片样式（只显示前3个科目）
- [x] 4.4 每个课程卡片显示：课程名、紧迫度

---

### 任务5：修改Timeline时间线显示 ✅ 已完成

**优先级**：P1

**前端改动** (`Dashboard.tsx`)：
- [x] 5.1 使用 `/api/review/today` 返回的数据
- [x] 5.2 每个任务显示：具体时间、任务类型、课程名、知识点
- [x] 5.3 任务类型标签显示

---

### 任务6：Timeline时间线动态化 ✅ 已完成

**优先级**：P1

**已完成功能**：
- [x] 6.1 **动态时间节点计算**：根据用户设置的时间段动态计算任务时间
- [x] 6.2 **当前时间点呼吸动画**：当前进行中的任务显示橙色呼吸动画
- [x] 6.3 **下一个紧邻任务高亮**：下一任务显示蓝色边框高亮和"即将开始"标签
- [x] 6.4 **已完成任务样式**：当前时间之前的任务显示灰色透明样式

**动态时间线数据结构设计**：

```typescript
interface TimelineItem {
  type: 'period_start' | 'break' | 'task'
  time: string          // 时间点 "09:00"
  label: string         // 显示文本 "上午学习"
  isActive: boolean     // 当前进行中
  isNext: boolean       // 下一个即将开始
  isPast: boolean       // 已完成
  courseName?: string   // 任务所属课程（仅task类型）
  task?: Task           // 任务详情（仅task类型）
}
```

**UI展示效果示例**：

```
09:00    [上午学习]          ← 大节点，呼吸动画（当前进行中）
         ├── 高等数学
         │   └── 导数定义 (40min) + 休息(10min)
         │
12:00    [午休]              ← 大节点
         └── 12:00-14:00 休息
         │
14:00    [下午学习]          ← 大节点
         ├── 程序设计
         │   └── 指针练习 (25min) + 休息(8min)
         │
18:00    [休息]              ← 大节点
         └── 18:00-19:00 休息
         │
19:00    [晚上学习] 🔥       ← 大节点，下一个任务高亮
         └── 线性代数
             └── 矩阵运算 (25min)
```

**需要新增的状态**：

```typescript
// Dashboard组件中新增状态
const [currentTime, setCurrentTime] = useState<Date>(new Date())
const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])

// useEffect中定时更新当前时间
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date())
  }, 60000) // 每分钟更新一次
  return () => clearInterval(timer)
}, [])
```

**计算逻辑**：

1. **isActive 判断**：任务开始时间 <= 当前时间 < 任务结束时间
2. **isNext 判断**：下一个即将开始的任务（当前时间 < 任务开始时间 && 距离最近）
3. **isPast 判断**：任务结束时间 <= 当前时间

---

### 任务7：前后端类型定义更新 ✅ 已完成

**优先级**：P0

**已完成**：
- [x] 更新 `TodayReview` 类型定义
- [x] 添加 `restTime`, `source`, `schedule` 等字段
- [x] 添加 `SchedulePreferences` 类型
- [x] 添加 `TodayStats` 类型
- [x] 更新 `UserSettingsResponse`, `UpdateSettingsRequest` 类型

---

## 五、任务依赖关系

```
任务1 (用户设置)
    ↓
任务2 (修改review/today) ← 依赖任务1
    ↓
任务3 (本周学习概览)
    ↓
任务4 (今日安排卡片) ← 依赖任务2
    ↓
任务5 (Timeline静态显示) ← 依赖任务2
    ↓
任务6 (Timeline动态化) ← 依赖任务2,5
    ↑
    │
任务7 (类型定义) ← 任务1,2的前置
```

---

## 六、验收标准

1. 今日安排卡片和Timeline显示的课程/任务数据一致
2. 用户可以自定义学习时间段
3. 任务按照用户设置的时间段自动安排
4. 休息时长根据任务时长动态计算
5. 本周学习概览卡片显示完整的今日学习进度

---

## 七、注意事项

1. 未登录用户使用默认时间段配置
2. 前端修改今日目标后实时调用API保存
3. 任务时间安排需要考虑跨时段的情况
4. 每日任务数量根据可用时长动态计算，不是固定6个

---

## 八、受影响的其他页面

### 8.1 直接影响（需要同步修改）

| 页面 | 文件 | 使用的API | 需要修改的内容 |
|-----|------|---------|--------------|
| **设置页面** | `pages/Settings.tsx` | `getUserSettings`, `updateUserSettings` | 新增学习时间段配置UI |
| **备考日历** | `pages/ExamCalendar.tsx` | `getTodayReview` | API返回结构变化，需适配 `scheduledTime` 等新字段 |

### 8.2 间接影响（可能需要调整）

| 页面/组件 | 文件 | 影响说明 |
|----------|------|---------|
| API请求模块 | `src/api/review.ts` | 类型定义变化，需更新 `TodayReview` 接口 |
| API请求模块 | `src/api/statistics.ts` | 类型定义变化，需更新 `Dashboard` 接口 |
| 类型定义 | `src/types/api.ts` | 需新增 `SchedulePreferences`, 更新 `Task`, `TodayReview` 等类型 |

### 8.3 Settings.tsx 需要修改的内容

由于新增了 `schedule` 字段到用户设置，需要在设置页面添加：

```typescript
// 1. 新增类型
interface SchedulePreferences {
  enabled: boolean
  morning: { start: string, end: string }
  afternoon: { start: string, end: string }
  evening: { start: string, end: string }
}

// 2. 在 LearningPreferences 中添加（可选）
interface LearningPreferences {
  // ... 现有字段
  schedule?: SchedulePreferences  // 新增
}

// 3. UI修改
// 在设置页面添加时间段配置区域：
// - 上午学习时间段 (默认 09:00-12:00)
// - 下午学习时间段 (默认 14:00-18:00)
// - 晚上学习时间段 (默认 19:00-21:00)
```

### 8.4 ExamCalendar.tsx 需要修改的内容

`getTodayReview` API返回结构变化，需要适配：

```typescript
// 旧返回结构
interface TodayReview {
  items: Task[]
  totalKnowledgePoints: number
  totalStudyMinutes: number
}

// 新返回结构（需要兼容）
interface TodayReview {
  date: string
  totalItems: number
  totalTime: number
  totalRestTime: number
  coveredCourses: number
  schedule: {  // 新增
    morning: { start: string, end: string, tasks: Task[] }
    afternoon: { start: string, end: string, tasks: Task[] }
    evening: { start: string, end: string, tasks: Task[] }
  }
  items: Task[]  // 保留，但增加 scheduledTime 字段
}
```

需要检查 ExamCalendar.tsx 中使用 `todayReview` 数据的地方，确保兼容新的字段结构。

### 8.5 提醒事项

1. **数据库不能改动** - 只能通过用户偏好(preferences JSON字段)存储新设置
2. **向后兼容** - 新字段应有默认值，不影响旧数据
3. **合作者协调** - 建议在修改前与Settings页面和ExamCalendar页面的开发者沟通
4. **测试覆盖** - 修改后需要测试：设置保存/读取、学习计划生成、备考日历显示

---

## 九、任务优先级排序

| 优先级 | 任务 | 预计改动量 | 依赖 |
|-------|------|-----------|------|
| P0 | 1. 用户设置类型定义 | 小 | 无 |
| P0 | 2. 后端Settings API | 中 | 无 |
| P0 | 7. 前后端类型同步 | 中 | 任务1,2 |
| P1 | 3. 后端review/today API | 大 | 任务1,2 |
| P1 | 4. Dashboard本周概览卡片 | 中 | 任务3 |
| P1 | 5. Dashboard今日安排卡片 | 中 | 任务3 |
| P1 | 6. Dashboard Timeline静态显示 | 中 | 任务3 |
| P2 | 7. Timeline动态化(当前时间/下一任务) | 中 | 任务5 |
| P2 | 8. Settings页面UI ✅ | 中 | 任务1,2 |
| P3 | 9. ExamCalendar适配 ✅ | 小 | 任务3 |

---

*文档版本：v1.0*
*最后更新：2026-03-11*
