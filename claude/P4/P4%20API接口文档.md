# P4 阶段 API 接口文档

> 项目：溯光智习 (LumiTrace AI)
> 阶段：P4 - 学习数据统计与分析服务
> 版本：v1.0
> 创建日期：2026-03-06

---

## 一、概述

P4 阶段主要实现学习数据统计、可视化、学习进度追踪、复习计划智能生成和知识点关联度分析，包括：

- 学习数据统计与可视化
- 学习进度追踪服务
- 艾宾浩斯遗忘曲线复习计划
- 知识点关联度分析
- 学习效果评估

---

## 二、API 接口列表

### 2.1 P4.1 学习数据统计

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/statistics/course/:courseId/overview` | GET | 获取课程学习概览 |
| `/api/statistics/knowledge-points/:courseId/mastery` | GET | 获取知识点掌握统计 |
| `/api/statistics/activities` | GET | 获取学习活动统计 |
| `/api/statistics/chapter/:chapterId/summary` | GET | 获取章节学习摘要 |
| `/api/statistics/dashboard` | GET | 获取总体学习仪表盘 |

### 2.2 P4.2 学习进度追踪

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/progress/course/:courseId` | GET | 获取课程学习进度 |
| `/api/progress/knowledge-point/:id` | GET | 获取知识点进度 |
| `/api/progress/knowledge-point/:id/status` | PUT | 更新知识点学习状态 |
| `/api/progress/knowledge-point/:id/progress` | POST | 记录知识点学习进度 |
| `/api/progress/milestones/:courseId` | GET | 获取学习里程碑 |
| `/api/progress/overview` | GET | 获取所有课程进度概览 |

### 2.3 P4.3 复习计划

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/review/generate-plan` | POST | 生成复习计划 |
| `/api/review/today` | GET | 获取今日复习任务 |
| `/api/review/:knowledgePointId/complete` | POST | 记录复习完成 |
| `/api/review/statistics` | GET | 获取复习统计 |
| `/api/review/course/:courseId` | GET | 获取课程复习计划 |

### 2.4 P4.4 知识点关联度分析

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/analysis/knowledge-points/:courseId/correlation` | GET | 获取知识点关联度矩阵 |
| `/api/analysis/learning-sequence/:courseId` | GET | 获取学习顺序建议 |
| `/api/analysis/bottlenecks/:courseId` | GET | 获取知识点掌握瓶颈 |

### 2.5 P4.5 学习效果评估

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/analysis/evaluate` | POST | 生成学习评估报告 |
| `/api/analysis/efficiency/:courseId` | GET | 获取学习效率分析 |
| `/api/analysis/compare/:courseId` | GET | 对比分析 |

---

## 三、接口详细说明

---

### 3.1 获取课程学习概览

**接口**: `GET /api/statistics/course/:courseId/overview`

**描述**: 获取指定课程的学习概览数据，包括学习时长、知识点掌握情况等

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| timeRange | string | 否 | 时间范围 | month |

**timeRange 可选值**: `week`, `month`, `semester`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "totalStudyTime": 4200,
    "studyDays": 2,
    "knowledgePointsCount": 4,
    "masteredCount": 1,
    "weakCount": 2,
    "completionRate": 0.25,
    "averageMasteryScore": 33,
    "studyTimeByDay": [
      { "date": "2026-03-04", "time": 3600 },
      { "date": "2026-03-05", "time": 600 }
    ],
    "knowledgeMasteryDistribution": {
      "excellent": 0,
      "good": 0,
      "medium": 1,
      "weak": 3
    }
  }
}
```

**响应字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| totalStudyTime | number | 总学习时长（秒） |
| studyDays | number | 学习天数 |
| knowledgePointsCount | number | 知识点总数 |
| masteredCount | number | 已掌握数量 |
| weakCount | number | 薄弱知识点数量 |
| completionRate | number | 完成率（0-1） |
| averageMasteryScore | number | 平均掌握度（0-100） |
| studyTimeByDay | array | 每日学习时长 |
| knowledgeMasteryDistribution | object | 掌握度分布 |

---

### 3.2 获取知识点掌握统计

**接口**: `GET /api/statistics/knowledge-points/:courseId/mastery`

**描述**: 获取课程所有知识点的掌握情况统计

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "totalPoints": 4,
    "masteredPoints": 1,
    "learningPoints": 1,
    "weakPoints": 2,
    "notStartedPoints": 0,
    "averageScore": 33,
    "points": [
      {
        "id": "851f2021-f17b-46a7-9355-b135625b71f6",
        "name": "微积分基本定理",
        "masteryScore": 85,
        "status": "MASTERED",
        "studyCount": 2,
        "mistakeCount": 0,
        "lastStudiedAt": "2026-03-06T02:29:33.166Z"
      }
    ]
  }
}
```

**知识点状态说明**:

| 状态 | 说明 |
|------|------|
| `MASTERED` | 已掌握 |
| `LEARNING` | 学习中 |
| `WEAK` | 薄弱 |
| `NEED_REVIEW` | 需要复习 |
| `NOT_STARTED` | 未开始 |

---

### 3.3 获取学习活动统计

**接口**: `GET /api/statistics/activities`

**描述**: 获取整体学习活动统计，包括学习记录、笔记、时间标记、错题等

**响应示例**:

```json
{
  "success": true,
  "data": {
    "studyRecordsCount": 2,
    "notesCount": 0,
    "timeMarksCount": 6,
    "emphasisCount": 2,
    "mistakesCount": 0,
    "recentActivities": [
      {
        "type": "study",
        "title": "1.1 映射与函数",
        "courseName": "数据结构",
        "chapterName": "Chapter 1",
        "duration": 600,
        "timestamp": "2026-03-05T00:00:00.000Z"
      }
    ]
  }
}
```

---

### 3.4 获取章节学习摘要

**接口**: `GET /api/statistics/chapter/:chapterId/summary`

**描述**: 获取指定章节的学习摘要

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| chapterId | string | 是 | 章节 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "chapterId": "61f05c8a-3132-4bc1-953e-926b1168998d",
    "chapterName": "第一章",
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "knowledgePoints": {
      "total": 4,
      "mastered": 1,
      "weak": 2,
      "progress": 25
    },
    "studyRecords": {
      "total": 0,
      "completed": 0,
      "totalStudyTime": 0
    },
    "masteryDistribution": {
      "excellent": 0,
      "good": 0,
      "medium": 1,
      "weak": 3
    },
    "averageScore": 33
  }
}
```

---

### 3.5 获取总体学习仪表盘

**接口**: `GET /api/statistics/dashboard`

**描述**: 获取所有课程的总体学习仪表盘数据

**响应示例**:

```json
{
  "success": true,
  "data": {
    "coursesCount": 5,
    "knowledgePoints": {
      "total": 12,
      "mastered": 3,
      "weak": 2,
      "progress": 25
    },
    "weeklyStats": {
      "studyTime": 4200,
      "studyDays": 2,
      "mistakes": 0
    },
    "totalMistakes": 0,
    "recentStudyRecords": [
      { "date": "2026-03-05T00:00:00.000Z", "duration": 600 },
      { "date": "2026-03-04T10:00:00.000Z", "duration": 3600 }
    ]
  }
}
```

---

### 3.6 获取课程学习进度

**接口**: `GET /api/progress/course/:courseId`

**描述**: 获取指定课程的学习进度，包括章节进度和知识点进度

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "totalChapters": 1,
    "completedChapters": 0,
    "totalKnowledgePoints": 4,
    "completedKnowledgePoints": 1,
    "overallProgress": 0.25,
    "chapters": [
      {
        "id": "61f05c8a-3132-4bc1-953e-926b1168998d",
        "name": "第一章",
        "progress": 0.25,
        "status": "in_progress",
        "knowledgePoints": {
          "total": 4,
          "completed": 1
        }
      }
    ],
    "nextSuggestion": "建议开始学习第一章内容",
    "estimatedRemainingTime": 5400
  }
}
```

**章节状态说明**:

| 状态 | 说明 |
|------|------|
| `completed` | 已完成 |
| `in_progress` | 进行中 |
| `not_started` | 未开始 |

---

### 3.7 更新知识点学习状态

**接口**: `PUT /api/progress/knowledge-point/:id/status`

**描述**: 更新指定知识点的学习状态和掌握度

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 知识点 ID (UUID) |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | 学习状态 |
| masteryScore | number | 否 | 掌握度 (0-100) |

**status 可选值**: `NOT_STARTED`, `LEARNING`, `MASTERED`, `WEAK`

**请求示例**:

```json
{
  "status": "MASTERED",
  "masteryScore": 85
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "851f2021-f17b-46a7-9355-b135625b71f6",
    "name": "微积分基本定理",
    "status": "MASTERED",
    "masteryScore": 85,
    "chapter": {
      "id": "61f05c8a-3132-4bc1-953e-926b1168998d",
      "name": "第一章",
      "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
      "courseName": "高等数学"
    },
    "updatedAt": "2026-03-06T02:29:33.166Z"
  }
}
```

---

### 3.8 获取知识点进度

**接口**: `GET /api/progress/knowledge-point/:id`

**描述**: 获取指定知识点的详细学习进度

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 知识点 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "851f2021-f17b-46a7-9355-b135625b71f6",
    "name": "微积分基本定理",
    "status": "MASTERED",
    "masteryScore": 85,
    "importance": 10,
    "chapter": {
      "id": "61f05c8a-3132-4bc1-953e-926b1168998d",
      "name": "第一章",
      "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
      "courseName": "高等数学"
    },
    "stats": {
      "studyCount": 2,
      "mistakeCount": 0
    },
    "recentStudyRecords": [],
    "createdAt": "2026-03-05T10:46:48.559Z",
    "updatedAt": "2026-03-06T02:29:33.166Z"
  }
}
```

---

### 3.9 记录知识点学习进度

**接口**: `POST /api/progress/knowledge-point/:id/progress`

**描述**: 记录知识点学习进度，自动更新掌握度

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 知识点 ID (UUID) |

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| studyTime | number | 否 | 学习时间（秒） |
| notes | string | 否 | 学习笔记 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "id": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
    "name": "导数",
    "previousMasteryScore": 5,
    "currentMasteryScore": 10,
    "status": "WEAK",
    "progress": 5,
    "updatedAt": "2026-03-06T02:30:07.863Z"
  }
}
```

---

### 3.10 获取学习里程碑

**接口**: `GET /api/progress/milestones/:courseId`

**描述**: 获取课程的学习里程碑进度

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "milestones": [
      {
        "id": "chapter-61f05c8a-3132-4bc1-953e-926b1168998d",
        "title": "完成第1章: 第一章",
        "description": "掌握第一章的所有知识点",
        "targetDate": null,
        "progress": 0.25,
        "status": "in_progress",
        "type": "chapter"
      },
      {
        "id": "course-completion",
        "title": "完成课程学习",
        "description": "掌握高等数学的所有知识点",
        "targetDate": null,
        "progress": 0.25,
        "status": "in_progress",
        "type": "course"
      }
    ],
    "achievedCount": 0,
    "totalCount": 2,
    "overallProgress": 0.25
  }
}
```

---

### 3.11 获取所有课程进度概览

**接口**: `GET /api/progress/overview`

**描述**: 获取所有课程的进度概览

**响应示例**:

```json
{
  "success": true,
  "data": {
    "coursesCount": 5,
    "overallProgress": 0.25,
    "totalKnowledgePoints": 12,
    "completedKnowledgePoints": 3,
    "courses": [
      {
        "courseId": "40ffd6d7-b3b5-48e1-809c-f7eafec34ecb",
        "courseName": "数据结构",
        "totalChapters": 1,
        "totalKnowledgePoints": 4,
        "completedKnowledgePoints": 2,
        "progress": 0.5,
        "status": "STUDYING"
      }
    ]
  }
}
```

---

### 3.12 生成复习计划

**接口**: `POST /api/review/generate-plan`

**描述**: 基于艾宾浩斯遗忘曲线生成智能复习计划

**请求体**:

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| courseId | string | 是 | 课程 ID (UUID) | - |
| days | number | 否 | 计划天数 | 30 |
| dailyReviewTime | number | 否 | 每日复习时间（分钟） | 60 |
| focusAreas | array | 否 | 重点区域 | ["weak_points"] |
| includeNewKnowledge | boolean | 否 | 包含新知识 | true |

**focusAreas 可选值**: `weak_points`, `high_frequency`, `not_mastered`

**请求示例**:

```json
{
  "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
  "days": 7,
  "dailyReviewTime": 30
}
```

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "planStartDate": "2026-03-05",
    "planEndDate": "2026-03-12",
    "totalReviewItems": 9,
    "estimatedDailyTime": 1,
    "dailyPlan": [
      {
        "date": "2026-03-05",
        "items": [
          {
            "type": "new",
            "knowledgePointId": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
            "knowledgePointName": "极限",
            "reason": "首次复习",
            "priority": "high",
            "estimatedTime": 30,
            "masteryScore": 0
          }
        ],
        "totalTime": 30
      }
    ],
    "reviewStrategy": {
      "method": "艾宾浩斯遗忘曲线",
      "intervals": [1, 3, 7, 14, 30],
      "description": "根据遗忘曲线，在学习后的第1、3、7、14、30天进行复习"
    }
  }
}
```

**复习类型说明**:

| 类型 | 说明 |
|------|------|
| `new` | 新知识学习 |
| `review` | 复习 |

**优先级说明**:

| 优先级 | 说明 |
|--------|------|
| `high` | 高优先级 |
| `medium` | 中优先级 |
| `low` | 低优先级 |

---

### 3.13 获取今日复习任务

**接口**: `GET /api/review/today`

**描述**: 获取今日需要复习的知识点任务

**响应示例**:

```json
{
  "success": true,
  "data": {
    "date": "2026-03-06",
    "totalItems": 4,
    "totalTime": 105,
    "items": [
      {
        "id": "review-ee76854a-e7b2-4ed8-8c1b-3bde60f41dc0-2026-03-06",
        "knowledgePointId": "ee76854a-e7b2-4ed8-8c1b-3bde60f41dc0",
        "knowledgePointName": "微分不等式",
        "courseName": "高等数学",
        "type": "review",
        "reviewCount": 1,
        "reason": "薄弱知识点，需要加强复习",
        "estimatedTime": 15,
        "masteryScore": 20
      }
    ]
  }
}
```

---

### 3.14 记录复习完成

**接口**: `POST /api/review/:knowledgePointId/complete`

**描述**: 记录复习完成，更新知识点掌握度

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| knowledgePointId | string | 是 | 知识点 ID (UUID) |

**请求体**:

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| difficulty | string | 否 | 复习难度 | medium |
| timeSpent | number | 否 | 花费时间（秒） | - |
| notes | string | 否 | 复习笔记 | - |

**difficulty 可选值**: `easy`, `medium`, `hard`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "knowledgePointId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
    "knowledgePointName": "导数",
    "previousMasteryScore": 10,
    "currentMasteryScore": 25,
    "status": "WEAK",
    "masteryDelta": 15,
    "difficulty": "easy",
    "timeSpent": 900,
    "nextReviewDate": "2026-03-09",
    "nextReviewReason": "根据easy难度，下一次复习安排在3天后",
    "updatedAt": "2026-03-06T02:32:27.565Z"
  }
}
```

**掌握度提升规则**:

| 难度 | 掌握度提升 |
|------|------------|
| easy | +15 |
| medium | +10 |
| hard | +5 |

---

### 3.15 获取复习统计

**接口**: `GET /api/review/statistics`

**描述**: 获取复习统计信息

**响应示例**:

```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-02-26",
      "end": "2026-03-06"
    },
    "statistics": {
      "totalReviewedThisWeek": 12,
      "masteredThisWeek": 3,
      "weakPointsRemaining": 10,
      "averageImprovement": 2
    },
    "todayProgress": {
      "targetItems": 0,
      "completedItems": 5,
      "completionRate": 0
    },
    "upcomingReviews": [
      { "date": "2026-03-07", "interval": "1天后", "estimatedItems": 3 },
      { "date": "2026-03-09", "interval": "3天后", "estimatedItems": 3 },
      { "date": "2026-03-13", "interval": "7天后", "estimatedItems": 3 }
    ]
  }
}
```

---

### 3.16 获取课程复习计划

**接口**: `GET /api/review/course/:courseId`

**描述**: 获取指定课程的复习计划

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "totalKnowledgePoints": 4,
    "statusSummary": {
      "mastered": 1,
      "learning": 0,
      "weak": 2,
      "needReview": 1,
      "notStarted": 0
    },
    "upcomingReviewsThisWeek": [
      {
        "knowledgePointId": "ee76854a-e7b2-4ed8-8c1b-3bde60f41dc0",
        "name": "微分不等式",
        "masteryScore": 20,
        "lastReviewed": "2026-03-05",
        "nextReviewDate": "2026-03-06",
        "daysUntilNextReview": 1,
        "priority": "high"
      }
    ],
    "reviewPriority": {
      "high": 3,
      "medium": 1
    }
  }
}
```

---

### 3.17 获取知识点关联度矩阵

**接口**: `GET /api/analysis/knowledge-points/:courseId/correlation`

**描述**: 获取课程中知识点之间的关联度矩阵

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**查询参数**:

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| limit | number | 否 | 返回数量限制 | 20 |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "totalKnowledgePoints": 4,
    "totalCorrelations": 4,
    "correlationMatrix": [
      {
        "sourceId": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
        "sourceName": "极限",
        "targetId": "851f2021-f17b-46a7-9355-b135625b71f6",
        "targetName": "微积分基本定理",
        "correlation": 100,
        "relationType": "PREREQUISITE",
        "reason": "前置知识点关系"
      }
    ],
    "clusters": [
      {
        "name": "第一章",
        "knowledgePoints": ["极限", "导数", "微分不等式", "微积分基本定理"],
        "centralPoint": "微积分基本定理",
        "pointCount": 4
      }
    ]
  }
}
```

**关联度说明**: 0-100，数值越高关联度越强

---

### 3.18 获取学习顺序建议

**接口**: `GET /api/analysis/learning-sequence/:courseId`

**描述**: 基于前置依赖和掌握程度生成最优学习顺序

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "totalKnowledgePoints": 4,
    "masteredPoints": 1,
    "suggestedSequence": [
      {
        "order": 1,
        "knowledgePointId": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
        "name": "极限",
        "chapterName": "第一章",
        "status": "NEED_REVIEW",
        "masteryScore": 0,
        "importance": 9,
        "prerequisites": ["导数"],
        "reason": "作为课程起始点",
        "estimatedTime": 70
      }
    ],
    "totalEstimatedTime": 260,
    "skipableTime": 55,
    "effectiveTime": 205,
    "learningStrategy": {
      "method": "基于章节顺序和前置依赖的拓扑排序",
      "description": "优先学习章节靠前、前置知识已掌握、掌握程度较低的知识点"
    }
  }
}
```

---

### 3.19 获取知识点掌握瓶颈

**接口**: `GET /api/analysis/bottlenecks/:courseId`

**描述**: 分析学习过程中的瓶颈知识点

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "totalKnowledgePoints": 4,
    "bottleneckCount": 3,
    "difficultyStats": {
      "hard": 1,
      "medium": 2,
      "easy": 0
    },
    "bottlenecks": [
      {
        "knowledgePointId": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
        "name": "极限",
        "chapterName": "第一章",
        "difficulty": "hard",
        "bottleneckScore": 83,
        "blockers": [
          {
            "blockerPoint": "导数",
            "blockerStatus": "WEAK",
            "blockerScore": 25,
            "impact": 0.75,
            "suggestion": "建议优先复习\"导数\""
          }
        ],
        "recommendedPrerequisites": ["导数"],
        "reasons": ["掌握度较低(0分)", "前置知识\"导数\"未掌握", "学习次数较少"]
      }
    ],
    "analysisSummary": {
      "totalBottlenecks": 3,
      "mainReasons": {
        "weakPrerequisites": 2,
        "lowMastery": 3,
        "manyMistakes": 0
      }
    }
  }
}
```

**瓶颈分数说明**: 0-100，分数越高表示瓶颈越严重

**难度等级说明**:

| 难度 | 分数范围 |
|------|----------|
| easy | 15-30 |
| medium | 30-60 |
| hard | >60 |

---

### 3.20 生成学习评估报告

**接口**: `POST /api/analysis/evaluate`

**描述**: 生成综合学习评估报告

**请求体**:

| 参数 | 类型 | 必填 | 说明 | 默认值 |
|------|------|------|------|--------|
| courseId | string | 是 | 课程 ID (UUID) | - |
| timeRange | string | 否 | 时间范围 | month |
| includeDetails | boolean | 否 | 包含详情 | true |

**timeRange 可选值**: `week`, `month`, `semester`

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "reportPeriod": {
      "start": "2026-02-04",
      "end": "2026-03-06",
      "timeRange": "month"
    },
    "overallScore": 36,
    "grade": "D",
    "dimensions": {
      "studyTime": {
        "score": 0,
        "rating": "需改进",
        "details": "共学习0小时"
      },
      "knowledgeMastery": {
        "score": 33,
        "rating": "需改进",
        "details": "4个知识点中掌握1个"
      },
      "practice": {
        "score": 100,
        "rating": "优秀",
        "details": "错题0道，正确率100%"
      },
      "review": {
        "score": 25,
        "rating": "需改进",
        "details": "25%知识点已掌握"
      }
    },
    "strengths": ["练习正确率高"],
    "weaknesses": ["学习时间不足", "知识点理解不够深入", "复习不够系统"],
    "suggestions": [
      "建议每天增加学习时间至少30分钟",
      "建议加强基础知识的学习",
      "建议使用艾宾浩斯遗忘曲线进行复习"
    ],
    "trend": "stable",
    "generatedAt": "2026-03-06T02:35:22.172Z"
  }
}
```

**等级说明**:

| 等级 | 分数范围 |
|------|----------|
| S | 90-100 |
| A | 80-89 |
| B | 70-79 |
| C | 60-69 |
| D | <60 |

**趋势说明**:

| 趋势 | 说明 |
|------|------|
| improving | 进步中 |
| stable | 稳定 |
| declining | 退步 |

---

### 3.21 获取学习效率分析

**接口**: `GET /api/analysis/efficiency/:courseId`

**描述**: 获取学习效率分析

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "efficiencyScore": 43,
    "metrics": {
      "timePerPoint": 0,
      "retentionRate": 0.33,
      "sessionsPerDay": 0,
      "averageSessionLength": 0
    },
    "studyPatterns": {
      "preferredTime": "evening",
      "averageSessionLength": 45,
      "sessionsPerDay": 2.5,
      "totalStudyDays": 10,
      "totalSessions": 25
    },
    "recommendations": [
      "单次学习时长建议延长至45-60分钟",
      "知识保持率偏低，建议加强复习"
    ]
  }
}
```

**偏好时段说明**:

| 时段 | 说明 |
|------|------|
| morning | 早晨 (6:00-12:00) |
| afternoon | 下午 (12:00-14:00) |
| late_afternoon | 傍晚 (14:00-18:00) |
| evening | 晚上 (18:00-22:00) |
| night | 深夜 (22:00-6:00) |

---

### 3.22 对比分析

**接口**: `GET /api/analysis/compare/:courseId`

**描述**: 与班级平均进行对比分析

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID (UUID) |

**响应示例**:

```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "comparison": {
      "classAverage": 68,
      "yourScore": 33,
      "percentile": 32,
      "rank": 55,
      "totalStudents": 50,
      "level": "需努力"
    },
    "dimensionComparison": [
      {
        "dimension": "知识点掌握",
        "classAverage": 65,
        "yourScore": 33,
        "difference": "-32"
      },
      {
        "dimension": "学习时长",
        "classAverage": 30,
        "yourScore": 0,
        "difference": "-30"
      }
    ],
    "note": "班级数据为模拟数据，实际应用需根据真实用户数据计算"
  }
}
```

**注意**: 班级数据为模拟数据，实际部署时需根据真实用户数据计算。

---

## 四、错误码说明

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| COURSE_NOT_FOUND | 404 | 课程不存在 |
| CHAPTER_NOT_FOUND | 404 | 章节不存在 |
| KNOWLEDGE_POINT_NOT_FOUND | 404 | 知识点不存在 |
| NO_KNOWLEDGE_POINTS | 400 | 该课程没有知识点 |
| GET_OVERVIEW_FAILED | 500 | 获取概览失败 |
| GET_MASTERY_FAILED | 500 | 获取掌握度失败 |
| GET_ACTIVITIES_FAILED | 500 | 获取活动统计失败 |
| GET_PROGRESS_FAILED | 500 | 获取进度失败 |
| UPDATE_STATUS_FAILED | 500 | 更新状态失败 |
| GET_MILESTONES_FAILED | 500 | 获取里程碑失败 |
| RECORD_PROGRESS_FAILED | 500 | 记录进度失败 |
| GENERATE_PLAN_FAILED | 500 | 生成计划失败 |
| GET_TODAY_FAILED | 500 | 获取今日任务失败 |
| RECORD_COMPLETE_FAILED | 500 | 记录完成失败 |
| GET_STATISTICS_FAILED | 500 | 获取统计失败 |
| GET_COURSE_REVIEW_FAILED | 500 | 获取复习计划失败 |
| GET_CORRELATION_FAILED | 500 | 获取关联度失败 |
| GET_LEARNING_SEQUENCE_FAILED | 500 | 获取学习顺序失败 |
| GET_BOTTLENECKS_FAILED | 500 | 获取瓶颈失败 |
| GENERATE_REPORT_FAILED | 500 | 生成报告失败 |
| GET_EFFICIENCY_FAILED | 500 | 获取效率失败 |
| GET_COMPARISON_FAILED | 500 | 获取对比失败 |

---

## 五、依赖说明

本阶段 API 依赖以下现有数据模型：

- Course（课程）
- Chapter（章节）
- KnowledgePoint（知识点）
- StudyRecord（学习记录）
- TimeMark（时间标记）
- Mistake（错题）
- KnowledgeRelation（知识关系）

---

**文档版本**: v1.0
**最后更新**: 2026-03-06
