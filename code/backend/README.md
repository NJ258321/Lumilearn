# LumiTrace AI Backend

溯光智习后端服务 - 基于 Node.js + Express + Prisma + SQLite

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **验证**: express-validator

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量。

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 创建数据库并执行迁移
npm run prisma:migrate
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 5. 健康检查

```bash
curl http://localhost:3000/health
```

## API 接口

### 基础路径

所有API路径以 `/api` 开头

### 主要端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/api/courses` | 获取所有课程 |
| POST | `/api/courses` | 创建新课程 |
| GET | `/api/courses/:id` | 获取课程详情 |
| PUT | `/api/courses/:id` | 更新课程 |
| DELETE | `/api/courses/:id` | 删除课程 |
| GET | `/api/chapters` | 获取章节列表 |
| POST | `/api/chapters` | 创建章节 |
| GET | `/api/knowledge-points` | 获取知识点 |
| POST | `/api/knowledge-points` | 创建知识点 |
| GET | `/api/study-records` | 获取学习记录 |
| POST | `/api/study-records` | 创建学习记录 |
| GET | `/api/exam-tasks` | 获取考试任务 |
| POST | `/api/exam-tasks` | 创建考试任务 |
| GET | `/api/mistakes` | 获取错题列表 |
| POST | `/api/mistakes` | 创建错题记录 |
| POST | `/api/upload/audio` | 上传音频 |
| POST | `/api/upload/image` | 上传图片 |
| POST | `/api/upload/document` | 上传文档 |

### 知识图谱 API (KG-01/02/03)

#### 1. 短板分析 (KG-01)

```http
POST /api/knowledge-graph/weakness-analysis
```

检测前置概念缺失、高频引用低覆盖节点、生成结构性预警。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 否 | 课程ID，不传则分析全部 |
| minPriority | number | 否 | 最小优先级阈值 (0-10) |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "totalKnowledgePoints": 9,
    "weakPoints": [
      {
        "id": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
        "name": "导数",
        "masteryScore": 25,
        "status": "WEAK",
        "issue": "missing_prerequisite",
        "priority": 10,
        "suggestion": "前置概念未掌握：极限"
      }
    ],
    "warnings": [
      {
        "type": "prerequisite_gap",
        "severity": "high",
        "message": "发现1个关键知识点存在严重前置概念缺失",
        "recommendation": "建议立即停止新知识学习，优先补齐这些知识点的前置概念"
      }
    ],
    "statistics": {
      "totalPrerequisiteGaps": 1,
      "averageMasteryScore": 17,
      "criticalCount": 1,
      "urgentCount": 0
    }
  }
}
```

#### 2. 图谱缺口检测 (KG-02)

```http
POST /api/knowledge-graph/detect-gaps
```

检测知识图谱完整性：孤立节点、前置缺失、循环依赖。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 否 | 课程ID，不传则分析全部 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "isComplete": false,
    "completenessScore": 20,
    "gaps": [
      {
        "type": "orphaned_node",
        "nodeId": "ee76854a-e7b2-4ed8-8c1b-3bde60f41dc0",
        "nodeName": "函数",
        "description": "知识点\"函数\"未与任何其他知识点建立关联",
        "severity": "low"
      },
      {
        "type": "missing_prerequisite",
        "nodeId": "851f2021-f17b-46a7-9355-b135625b71f6",
        "nodeName": "微积分",
        "description": "重要知识点\"微积分\"缺少前置概念定义",
        "severity": "high"
      }
    ]
  }
}
```

#### 3. 图结构优先级分析 (KG-03)

```http
POST /api/knowledge-graph/priority
```

基于 PageRank 风格影响力传播算法，综合多维度计算优先级。

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 否 | 课程ID，不传则分析全部 |
| threshold | number | 否 | 优先级阈值 (0-100) |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "priorities": [
      {
        "id": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
        "name": "导数",
        "masteryScore": 25,
        "priorityScore": 85,
        "priorityLevel": "critical",
        "factors": {
          "masteryFactor": 0.75,
          "influenceFactor": 0.8,
          "prerequisiteFactor": 0.6,
          "cascadeFactor": 0.3
        },
        "impactRadius": 5,
        "recommendedAction": "紧急优先学习 - 这是关键瓶颈点"
      }
    ],
    "insights": [
      {
        "type": "bottleneck",
        "message": "发现 3 个关键瓶颈知识点",
        "suggestion": "建议优先突破这些瓶颈点"
      }
    ],
    "learningOrder": ["point1", "point2", "..."],
    "statistics": {
      "highPriorityCount": 5,
      "mediumPriorityCount": 8,
      "lowPriorityCount": 12,
      "averagePriority": 52
    }
  }
}
```

#### 4. 学习路径建议

```http
GET /api/knowledge-graph/learning-path/:id
```

获取知识点学习路径建议。

**路径参数：**
| 参数 | 说明 |
|------|------|
| id | 知识点ID |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "path": [
      { "id": "xxx", "name": "极限", "type": "prerequisite" },
      { "id": "xxx", "name": "导数", "type": "current" }
    ],
    "estimatedTime": 45,
    "recommendations": [
      "建议先学习1个前置知识点",
      "当前知识点掌握度不足，建议先巩固"
    ]
  }
}
```

#### 5. 知识点重要性计算

```http
GET /api/knowledge-graph/importance/:id
```

计算知识点重要性分数。

**路径参数：**
| 参数 | 说明 |
|------|------|
| id | 知识点ID |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "baseScore": 90,
    "referenceScore": 0,
    "difficultyScore": 75,
    "totalScore": 165
  }
}
```

### 备考规划 API (PLAN-01)

#### 1. 智能复习计划优化

```http
POST /api/review/smart-optimize
```

基于强化学习算法的个性化复习路径规划。

**请求头：**
| 参数 | 说明 |
|------|------|
| Authorization | Bearer token |

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 否 | 课程ID，不传则分析全部 |
| dailyStudyHours | number | 否 | 每日学习时长（0.5-8小时），默认3小时 |
| constraints | object | 否 | 自定义约束条件 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "schedule": [
      {
        "date": "2026-03-09",
        "dayOfWeek": "周一",
        "sessions": [
          {
            "startTime": "09:00",
            "endTime": "10:00",
            "knowledgePointId": "xxx",
            "knowledgePointName": "导数",
            "activityType": "practice",
            "duration": 30,
            "expectedGain": 6.4,
            "priority": 180
          }
        ],
        "totalMinutes": 90,
        "estimatedMasteryGain": 19.2
      }
    ],
    "statistics": {
      "totalKnowledgePoints": 9,
      "totalStudyDays": 5,
      "totalStudyMinutes": 420,
      "averageDailyMinutes": 84,
      "projectedMastery": 100,
      "confidence": 85
    },
    "recommendations": [
      "您有 8 个知识点掌握度较低（<40%），建议优先复习"
    ],
    "feasibility": {
      "isFeasible": true,
      "riskLevel": "medium",
      "issues": ["1 个知识点的前置知识未掌握"],
      "suggestions": ["建议先补齐前置知识点，再进行复习计划"]
    }
  }
}
```

#### 2. 学习效率分析

```http
GET /api/review/efficiency?courseId=xxx
```

获取学习效率分析报告。

**请求头：**
| 参数 | 说明 |
|------|------|
| Authorization | Bearer token |

**查询参数：**
| 参数 | 说明 |
|------|------|
| courseId | 课程ID（可选） |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "masteryDistribution": {
      "mastered": 1,
      "medium": 0,
      "weak": 8
    },
    "efficiencyScore": 11,
    "timeEfficiency": 11,
    "totalPoints": 9,
    "daysRemaining": 30,
    "recommendations": ["需要重点突破薄弱知识点"]
  }
}
```

### 智能路径优化 API (PLAN-02)

#### 1. 智能学习路径优化

```http
POST /api/planning/optimize
```

基于目标函数最大化提分概率的智能学习路径规划。

**请求头：**
| 参数 | 说明 |
|------|------|
| Authorization | Bearer token |

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 否 | 课程ID |
| targetMastery | number | 否 | 目标掌握度（50-100），默认90 |
| dailyHours | number | 否 | 每日学习时长（0.5-8小时），默认3 |
| examDate | string | 否 | 考试日期（ISO格式） |
| constraints | object | 否 | 自定义约束 |

**约束参数 (constraints)：**
| 参数 | 说明 |
|------|------|
| maxSessionMinutes | 单次最大学习时长（默认45分钟） |
| breakMinutes | 休息时长（默认10分钟） |
| includeMockExam | 是否包含模拟考试 |
| mockExamDays | 模拟考试安排天数 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "path": {
      "stages": [
        {
          "stage": 1,
          "name": "夯实基础",
          "description": "重点攻克掌握度低于40%的知识点",
          "targetDuration": 4,
          "expectedMasteryGain": 25
        }
      ],
      "totalDays": 5,
      "strategy": "balanced"
    },
    "optimization": {
      "objectiveFunction": "最大化提分概率，目标掌握度90%",
      "algorithm": "heuristic",
      "convergenceScore": 0.95
    },
    "schedule": [
      {
        "day": 1,
        "date": "2026-03-10",
        "sessions": [
          {
            "timeSlot": "09:00-10:00",
            "activityType": "new_learn",
            "topic": "导数",
            "duration": 45,
            "difficulty": "hard",
            "expectedScoreGain": 3
          }
        ],
        "totalMinutes": 90,
        "masteryTarget": 17
      }
    ],
    "projection": {
      "currentMastery": 17,
      "projectedFinal": 90,
      "confidence": 85
    },
    "mockExams": [
      {
        "day": 23,
        "date": "2026-04-01",
        "scope": "全部知识点",
        "duration": 120
      }
    ]
  }
}
```

#### 2. 单知识点优化路径

```http
GET /api/planning/point/:id?target=90
```

获取单个知识点的最优复习路径。

**路径参数：**
| 参数 | 说明 |
|------|------|
| id | 知识点ID |

**查询参数：**
| 参数 | 说明 |
|------|------|
| target | 目标掌握度（默认90） |

#### 3. 多学科统筹优化 (PLAN-03)

```http
POST /api/planning/multi-course
```

跨课程时间分配算法，多门课程同时备考时智能分配每日学习时间。

**请求头：**
| 参数 | 说明 |
|------|------|
| Authorization | Bearer token |

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseIds | string[] | 是 | 课程ID列表 |
| dailyStudyHours | number | 否 | 每日学习时长（1-12小时），默认3 |
| examDates | object | 否 | 各课程考试日期 {courseId: date} |
| preferences | object | 否 | 偏好设置 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "allocation": [
      {
        "courseId": "xxx",
        "courseName": "高等数学",
        "dailyHours": 2.1,
        "priority": "high",
        "urgencyScore": 60,
        "knowledgePoints": { "total": 20, "weak": 5, "medium": 10, "mastered": 5 },
        "daysUntilExam": 15
      }
    ],
    "dailySchedule": [
      {
        "date": "2026-03-10",
        "dayOfWeek": "周一",
        "sessions": [
          { "timeSlot": "08:00-09:30", "courseName": "高等数学", "activity": "薄弱点突破", "duration": 90 }
        ],
        "totalHours": 3
      }
    ],
    "statistics": {
      "totalCourses": 2,
      "totalKnowledgePoints": 30,
      "highPriorityCourses": 1
    }
  }
}
```

#### 4. 任务智能平摊 (PLAN-04)

```http
POST /api/planning/balance
```

未完成任务检测、延期重规划、优先级动态调整。

**请求头：**
| 参数 | 说明 |
|------|------|
| Authorization | Bearer token |

**请求参数：**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 否 | 课程ID |
| daysAhead | number | 否 | 前瞻天数（1-30），默认7 |
| maxDailyTasks | number | 否 | 每日最大学习任务数，默认5 |

**响应示例：**
```json
{
  "success": true,
  "data": {
    "unbalanced": [
      {
        "taskId": "xxx",
        "taskName": "导数",
        "courseName": "高等数学",
        "originalDate": "2026-03-05",
        "currentStatus": "overdue",
        "riskLevel": "critical",
        "reason": "已逾期 3 天"
      }
    ],
    "rescheduled": [],
    "priorities": [
      {
        "taskId": "xxx",
        "taskName": "极限",
        "priority": 85,
        "factors": { "difficulty": 0.6, "importance": 0.7, "overdueDays": 2, "examProximity": 0.5 }
      }
    ],
    "statistics": {
      "totalTasks": 10,
      "overdueTasks": 1,
      "atRiskTasks": 2,
      "completionRate": 70
    },
    "recommendations": ["您有 1 项任务已逾期，请尽快完成"]
  }
}
```

#### 5. 知识关系图

```http
GET /api/knowledge-points/:id/relations?depth=2
```

获取知识点关系图。

**路径参数：**
| 参数 | 说明 |
|------|------|
| id | 知识点ID |

**查询参数：**
| 参数 | 说明 |
|------|------|
| depth | 深度 (1-5)，默认2 |

## 项目结构

```
backend/
├── src/
│   ├── index.ts              # 应用入口
│   ├── routes/               # API路由
│   │   ├── courses.ts
│   │   ├── chapters.ts
│   │   ├── knowledge-points.ts
│   │   ├── study-records.ts
│   │   ├── exam-tasks.ts
│   │   ├── mistakes.ts
│   │   └── upload.ts
│   ├── middleware/           # 中间件
│   │   └── validator.ts
│   ├── services/             # 业务逻辑
│   ├── models/               # 数据模型
│   ├── types/                # TypeScript类型定义
│   ├── utils/                # 工具函数
│   └── lib/                  # 库文件
│       └── prisma.ts         # Prisma客户端
├── prisma/
│   ├── schema.prisma         # 数据库Schema
│   └── migrations/           # 数据库迁移
├── uploads/                  # 文件上传目录
├── .env                      # 环境变量
├── .env.example              # 环境变量示例
├── package.json
├── tsconfig.json
└── README.md
```

## 开发命令

| 命令 | 描述 |
|------|------|
| `npm run dev` | 启动开发服务器（热重载） |
| `npm run build` | 编译TypeScript |
| `npm start` | 启动生产服务器 |
| `npm run prisma:generate` | 生成Prisma Client |
| `npm run prisma:migrate` | 执行数据库迁移 |
| `npm run prisma:studio` | 打开Prisma Studio（数据库可视化） |

## 数据库模型

### Course（课程）
- 状态：学习中、复习中、已结课
- 类型：专业课、跨专业、公选课
- 考试日期、开始复习日期、目标等级

### Chapter（章节）
- 所属课程
- 章节名称
- 排序序号

### KnowledgePoint（知识点）
- 所属章节
- 知识点名称
- 状态：已掌握、薄弱点、需复习、今日需复习
- 重要性（1-10）
- 掌握度（0-100）

### StudyRecord（学习记录）
- 所属课程和章节
- 日期
- 音频URL
- 时长
- 笔记

### TimeMark（时间标记）
- 所属学习记录
- 类型：开始、结束、重点、板书变化、笔记
- 时间戳（毫秒）
- 关联数据

### ExamTask（考试任务）
- 所属课程
- 类型：章节复习、模拟考试、薄弱点复习
- 计划日期
- 状态
- 预估时长
- 复习轮次（1/2/3）

### Mistake（错题）
- 所属课程和知识点
- 题目
- 用户答案
- 正确答案
- 错因

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| PORT | 服务器端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| DATABASE_URL | 数据库连接URL | file:./dev.db |
| UPLOAD_DIR | 上传文件目录 | ./uploads |
| MAX_FILE_SIZE | 最大文件大小（字节） | 10485760 |

## 错误处理

API使用统一的错误响应格式：

```json
{
  "success": false,
  "error": "错误描述"
}
```

验证错误包含详细信息：

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Course name is required"
    }
  ]
}
```

## TODO

- [ ] 实现所有API路由的数据库操作
- [x] 知识图谱API (KG-01 短板发现算法)
- [x] 知识图谱API (KG-02 缺口检测)
- [x] 知识图谱API (KG-03 图结构优先级分析)
- [x] 智能备考规划 (PLAN-01 强化学习算法)
- [x] 智能路径优化 (PLAN-02 目标函数优化)
- [x] 多学科统筹 (PLAN-03 跨课程时间分配)
- [x] 任务智能平摊 (PLAN-04 优先级动态调整)
- [ ] 添加用户认证
- [x] 实现文件删除功能
- [ ] 添加单元测试
- [x] 集成AI服务（Gemini API）
- [x] 实现备考规划算法（已集成到 PLAN-01）
- [ ] 实现薄弱点发现算法（已集成到 KG-01/03）
