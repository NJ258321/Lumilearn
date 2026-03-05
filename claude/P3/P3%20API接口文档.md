# P3 阶段 API 接口文档

> 项目：溯光智习 (LumiTrace AI)
> 阶段：P3 - 知识图谱与AI服务
> 版本：v1.0
> 创建日期：2026-03-05

---

## 一、概述

P3 阶段主要实现知识图谱关系管理和 AI 智能服务，包括：

- 知识关系数据模型与 CRUD 操作
- Gemini AI 服务封装
- 知识点解释生成
- 个性化学习建议
- 薄弱点智能分析
- 外部资源检索

---

## 二、数据库模型

### 2.1 KnowledgeRelation（知识关系）

```prisma
model KnowledgeRelation {
  id           String   @id @default(uuid())
  sourceId     String   // 源知识点ID
  targetId     String   // 目标知识点ID
  relationType String   // 关系类型
  weight       Int      @default(5) // 权重 1-10
  createdAt    DateTime @default(now())

  source       KnowledgePoint @relation(...)
  target       KnowledgePoint @relation(...)

  @@unique([sourceId, targetId, relationType])
}
```

### 2.2 关系类型枚举

| 值 | 说明 |
|-----|------|
| `PREREQUISITE` | 前置知识点（必须先学）|
| `RELATED` | 相关知识点 |
| `EXTENDS` | 扩展知识点 |
| `EXAMPLE` | 示例关系 |

---

## 三、API 接口列表

### 3.1 知识关系管理

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/knowledge-relations` | GET | 获取知识关系列表 |
| `/api/knowledge-relations` | POST | 创建知识关系 |
| `/api/knowledge-relations` | DELETE | 批量删除知识关系 |
| `/api/knowledge-relations/:id` | GET | 获取单个知识关系 |
| `/api/knowledge-relations/:id` | PUT | 更新知识关系 |
| `/api/knowledge-relations/:id` | DELETE | 删除知识关系 |
| `/api/knowledge-relations/batch` | POST | 批量创建知识关系 |
| `/api/knowledge-points/:id/relations` | GET | 获取知识关系图 |

### 3.2 AI 服务

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/ai/status` | GET | 获取 AI 服务状态 |
| `/api/ai/chat` | POST | 通用 AI 对话 |
| `/api/ai/explain` | POST | 知识点解释生成 |
| `/api/ai/suggest` | POST | 学习建议生成 |
| `/api/ai/analyze-weak-points` | POST | 薄弱点分析 |
| `/api/ai/search-resources` | POST | 外部资源检索 |

---

## 四、接口详细说明

---

### 4.1 获取知识关系列表

**接口**: `GET /api/knowledge-relations`

**描述**: 获取所有知识关系，支持按条件筛选

**请求参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sourceId | string | 否 | 源知识点 ID（UUID）|
| targetId | string | 否 | 目标知识点 ID（UUID）|
| relationType | string | 否 | 关系类型 |

**relationType 可选值**: `PREREQUISITE`, `RELATED`, `EXTENDS`, `EXAMPLE`

**示例请求**:
```bash
GET /api/knowledge-relations?relationType=PREREQUISITE
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "616aeab4-20fd-434a-b28a-a5c87c40d5a9",
      "sourceId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
      "targetId": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
      "relationType": "PREREQUISITE",
      "weight": 9,
      "createdAt": "2026-03-05T10:47:02.741Z",
      "source": {
        "id": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
        "name": "极限"
      },
      "target": {
        "id": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
        "name": "导数"
      }
    }
  ]
}
```

---

### 4.2 创建知识关系

**接口**: `POST /api/knowledge-relations`

**描述**: 创建新的知识关系

**请求头**:
```
Content-Type: application/json
```

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sourceId | string | 是 | 源知识点 ID（UUID）|
| targetId | string | 是 | 目标知识点 ID（UUID）|
| relationType | string | 是 | 关系类型 |
| weight | number | 否 | 权重 1-10，默认 5 |

**relationType 可选值**: `PREREQUISITE`, `RELATED`, `EXTENDS`, `EXAMPLE`

**示例请求**:
```bash
curl -X POST http://localhost:3000/api/knowledge-relations \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "ee76854a-e7b2-4ed8-8c1b-3bde60f41dc0",
    "targetId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
    "relationType": "PREREQUISITE",
    "weight": 8
  }'
```

**成功响应 (201)**:
```json
{
  "success": true,
  "data": {
    "id": "b03471d2-a89a-45f4-b506-908f6b53dc35",
    "sourceId": "ee76854a-e7b2-4ed8-8c1b-3bde60f41dc0",
    "targetId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
    "relationType": "PREREQUISITE",
    "weight": 8,
    "createdAt": "2026-03-05T10:47:02.626Z",
    "source": {
      "id": "ee76854a-e7b2-4ed8-8c1b-3bde60f41dc0",
      "name": "函数"
    },
    "target": {
      "id": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
      "name": "极限"
    }
  }
}
```

**错误响应**:

| 状态码 | 错误原因 |
|--------|----------|
| 400 | 参数验证失败 |
| 404 | 源或目标知识点不存在 |
| 409 | 知识关系已存在 |

**验证失败响应 (400)**:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "sourceId", "message": "源知识点ID必须是有效的UUID" }
  ]
}
```

**重复关系响应 (409)**:
```json
{
  "success": false,
  "error": "该知识关系已存在"
}
```

---

### 4.3 批量创建知识关系

**接口**: `POST /api/knowledge-relations/batch`

**描述**: 批量创建多个知识关系

**请求头**:
```
Content-Type: application/json
```

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| relations | array | 是 | 关系数组，最少1个 |

**relations 数组元素**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sourceId | string | 是 | 源知识点 ID |
| targetId | string | 是 | 目标知识点 ID |
| relationType | string | 是 | 关系类型 |
| weight | number | 否 | 权重 |

**示例请求**:
```json
{
  "relations": [
    {
      "sourceId": "ee76854a-e7b2-4ed8-8c1b-3bde60f41dc0",
      "targetId": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
      "relationType": "RELATED",
      "weight": 6
    },
    {
      "sourceId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
      "targetId": "851f2021-f17b-46a7-9355-b135625b71f6",
      "relationType": "RELATED",
      "weight": 8
    }
  ]
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "created": [
      { "id": "rel1", "sourceId": "...", "targetId": "...", ... },
      { "id": "rel2", "sourceId": "...", "targetId": "...", ... }
    ],
    "failed": 0,
    "errors": []
  }
}
```

---

### 4.4 获取单个知识关系

**接口**: `GET /api/knowledge-relations/:id`

**描述**: 根据 ID 获取知识关系详情

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 知识关系 ID（UUID）|

**示例请求**:
```bash
GET /api/knowledge-relations/616aeab4-20fd-434a-b28a-a5c87c40d5a9
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "616aeab4-20fd-434a-b28a-a5c87c40d5a9",
    "sourceId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
    "targetId": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
    "relationType": "PREREQUISITE",
    "weight": 9,
    "createdAt": "2026-03-05T10:47:02.741Z",
    "source": {
      "id": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
      "name": "极限"
    },
    "target": {
      "id": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
      "name": "导数"
    }
  }
}
```

---

### 4.5 更新知识关系

**接口**: `PUT /api/knowledge-relations/:id`

**描述**: 更新知识关系的类型或权重

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 知识关系 ID（UUID）|

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| relationType | string | 否 | 关系类型 |
| weight | number | 否 | 权重 1-10 |

**示例请求**:
```bash
curl -X PUT http://localhost:3000/api/knowledge-relations/616aeab4-20fd-434a-b28a-a5c87c40d5a9 \
  -H "Content-Type: application/json" \
  -d '{"weight": 10}'
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "616aeab4-20fd-434a-b28a-a5c87c40d5a9",
    "sourceId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
    "targetId": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
    "relationType": "PREREQUISITE",
    "weight": 10,
    "createdAt": "2026-03-05T10:47:02.741Z",
    ...
  }
}
```

---

### 4.6 删除知识关系

**接口**: `DELETE /api/knowledge-relations/:id`

**描述**: 删除指定的知识关系

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 知识关系 ID（UUID）|

**示例请求**:
```bash
DELETE /api/knowledge-relations/616aeab4-20fd-434a-b28a-a5c87c40d5a9
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "id": "616aeab4-20fd-434a-b28a-a5c87c40d5a9",
    "message": "知识关系已删除"
  }
}
```

---

### 4.7 批量删除知识关系

**接口**: `DELETE /api/knowledge-relations`

**描述**: 批量删除多个知识关系

**请求头**:
```
Content-Type: application/json
```

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | array | 是 | 知识关系 ID 数组 |

**示例请求**:
```json
{
  "ids": [
    "616aeab4-20fd-434a-b28a-a5c87c40d5a9",
    "b03471d2-a89a-45f4-b506-908f6b53dc35"
  ]
}
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "deleted": 2,
    "requested": 2
  }
}
```

---

### 4.8 获取知识关系图

**接口**: `GET /api/knowledge-points/:id/relations`

**描述**: 获取指定知识点的关系图谱，包含前置知识和相关知识

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 知识点 ID（UUID）|

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| depth | number | 否 | 追溯深度，默认2，最大5 |

**示例请求**:
```bash
GET /api/knowledge-points/1c4c986d-edaf-4a26-b639-0fc75b5da741/relations?depth=2
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "root": {
      "id": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
      "name": "极限",
      "status": "NEED_REVIEW",
      "masteryScore": 0
    },
    "relations": [
      {
        "id": "616aeab4-20fd-434a-b28a-a5c87c40d5a9",
        "sourceId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
        "targetId": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
        "relationType": "PREREQUISITE",
        "weight": 9,
        "target": {
          "id": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
          "name": "导数",
          "status": "NEED_REVIEW",
          "masteryScore": 0
        }
      }
    ],
    "prerequisites": [
      {
        "id": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
        "name": "导数",
        "masteryScore": 0
      }
    ],
    "related": [
      {
        "id": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
        "name": "导数",
        "masteryScore": 0
      },
      {
        "id": "851f2021-f17b-46a7-9355-b135625b71f6",
        "name": "微分中值定理",
        "masteryScore": 0
      }
    ]
  }
}
```

---

### 4.9 获取 AI 服务状态

**接口**: `GET /api/ai/status`

**描述**: 获取 AI 服务的运行状态和配置信息

**示例请求**:
```bash
GET /api/ai/status
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "available": false,
    "model": "gemini-1.5-pro",
    "mode": "mock",
    "features": {
      "explain": true,
      "suggest": true,
      "analyzeWeakPoints": true,
      "searchResources": true
    }
  }
}
```

**字段说明**:

| 字段 | 类型 | 说明 |
|------|------|------|
| available | boolean | AI 服务是否可用（是否配置了 API Key）|
| model | string | 使用的模型名称 |
| mode | string | 运行模式：`production`（生产）或 `mock`（模拟）|
| features | object | 各功能模块的可用状态 |

---

### 4.10 AI 通用对话

**接口**: `POST /api/ai/chat`

**描述**: 与 AI 进行通用对话

**请求头**:
```
Content-Type: application/json
```

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message | string | 是 | 用户消息 |
| systemInstruction | string | 否 | 系统指令，用于设定 AI 角色 |

**示例请求**:
```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "什么是微积分？",
    "systemInstruction": "你是一位数学教授"
  }'
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "message": "这里是 AI 的回复内容...",
    "timestamp": "2026-03-05T10:57:04.916Z"
  }
}
```

---

### 4.11 知识点解释生成

**接口**: `POST /api/ai/explain`

**描述**: 调用 AI 生成知识点的详细解释

**请求头**:
```
Content-Type: application/json
```

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| knowledgePointId | string | 是 | 知识点 ID（UUID）|
| style | string | 否 | 解释风格：`brief`/`detailed`/`example`，默认 `detailed` |
| includeRelated | boolean | 否 | 是否包含关联知识点，默认 true |
| includeExamples | boolean | 否 | 是否包含示例，默认 true |

**style 说明**:

| 值 | 说明 |
|-----|------|
| brief | 简洁版，100字左右 |
| detailed | 详细版，300字左右，包含定义、定理、推导 |
| example | 例题版，250字左右，以例题为主 |

**示例请求**:
```bash
curl -X POST http://localhost:3000/api/ai/explain \
  -H "Content-Type: application/json" \
  -d '{
    "knowledgePointId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
    "style": "detailed",
    "includeRelated": true,
    "includeExamples": true
  }'
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "knowledgePoint": {
      "id": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
      "name": "极限"
    },
    "explanation": "## 极限\n\n### 定义\n\n设函数 f(x) 在点 x0 的某一去心邻域内有定义...",
    "relatedPoints": [
      { "name": "导数", "masteryScore": 0 },
      { "name": "微分", "masteryScore": 0 }
    ],
    "generatedAt": "2026-03-05T11:08:33.851Z"
  }
}
```

---

### 4.12 学习建议生成

**接口**: `POST /api/ai/suggest`

**描述**: 基于学习数据生成个性化学习建议

**请求头**:
```
Content-Type: application/json
```

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID（UUID）|
| targetGrade | string | 否 | 目标等级：`S`/`A`/`B`/`C`，默认 `B` |
| daysUntilExam | number | 否 | 距离考试天数，默认 30 |
| dailyStudyTime | number | 否 | 每日学习时间（分钟），默认 120 |
| focusAreas | array | 否 | 重点领域，默认 `["weak_points"]` |

**focusAreas 可选值**:

| 值 | 说明 |
|-----|------|
| weak_points | 薄弱点 |
| high_frequency | 高频考点 |
| important_chapters | 重要章节 |

**示例请求**:
```bash
curl -X POST http://localhost:3000/api/ai/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "targetGrade": "A",
    "daysUntilExam": 30,
    "dailyStudyTime": 120,
    "focusAreas": ["weak_points", "high_frequency"]
  }'
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "courseName": "高等数学",
    "overallSuggestion": "## 学习建议\n\n根据你的学习情况...",
    "weakPointsCount": 4,
    "studyRecordsCount": 0,
    "generatedAt": "2026-03-05T11:08:39.955Z"
  }
}
```

---

### 4.13 薄弱点分析

**接口**: `POST /api/ai/analyze-weak-points`

**描述**: 分析课程中的薄弱知识点

**请求头**:
```
Content-Type: application/json
```

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | string | 是 | 课程 ID（UUID）|
| analyzeDepth | string | 否 | 分析深度：`quick`/`comprehensive`，默认 `quick` |

**analyzeDepth 说明**:

| 值 | 说明 |
|-----|------|
| quick | 快速分析，仅基于本地数据计算优先级 |
| comprehensive | 深入分析，调用 AI 生成详细分析报告 |

**示例请求**:
```bash
curl -X POST http://localhost:3000/api/ai/analyze-weak-points \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "analyzeDepth": "comprehensive"
  }'
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "courseId": "d84ecd76-55fd-484c-82d0-b44ef99b31c6",
    "totalKnowledgePoints": 4,
    "weakPoints": [
      {
        "knowledgePoint": {
          "id": "c90a133d-0bfa-4a83-8fa0-636d100a0fbf",
          "name": "导数",
          "masteryScore": 0,
          "status": "NEED_REVIEW"
        },
        "mistakeRate": 0.5,
        "reviewMissCount": 3,
        "lastReviewDate": "2026-02-20T00:00:00Z",
        "avgTimeSpent": 15,
        "score": 75,
        "priority": "high"
      }
    ],
    "insights": [
      "共发现 1 个高优先级薄弱点，0 个中优先级薄弱点",
      "平均错题率为 50.0%",
      "建议优先解决高优先级薄弱点"
    ],
    "detailedAnalysis": "## 薄弱点分析报告\n\n...",
    "generatedAt": "2026-03-05T11:08:51.424Z"
  }
}
```

**优先级计算公式**:
```
薄弱度评分 = 错题率 * 40 + 未复习周数 * 10 * 0.3 + (100 - 掌握度) * 0.3
```

| 优先级 | 条件 |
|--------|------|
| high | 评分 >= 70 或 错题率 > 50% |
| medium | 评分 >= 40 |
| low | 其他 |

---

### 4.14 外部资源检索

**接口**: `POST /api/ai/search-resources`

**描述**: 搜索与知识点相关的外部学习资源

**请求头**:
```
Content-Type: application/json
```

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| knowledgePointId | string | 是 | 知识点 ID（UUID）|
| resourceTypes | array | 否 | 资源类型数组，默认 `["video", "document", "practice"]` |
| language | string | 否 | 语言：`zh-CN`/`en`，默认 `zh-CN` |
| maxResults | number | 否 | 返回数量，默认 5，最大 10 |

**resourceTypes 可选值**:

| 值 | 说明 |
|-----|------|
| video | 视频教程 |
| document | 文档资料 |
| practice | 练习资源 |

**示例请求**:
```bash
curl -X POST http://localhost:3000/api/ai/search-resources \
  -H "Content-Type: application/json" \
  -d '{
    "knowledgePointId": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
    "resourceTypes": ["video", "document"],
    "maxResults": 3
  }'
```

**成功响应**:
```json
{
  "success": true,
  "data": {
    "knowledgePoint": {
      "id": "1c4c986d-edaf-4a26-b639-0fc75b5da741",
      "name": "极限"
    },
    "resources": [
      {
        "type": "video",
        "title": "高等数学 - 极限 - 基础入门",
        "source": "B站",
        "url": "https://example.com/search?type=video&q=极限",
        "duration": "30:00",
        "quality": "high",
        "description": "讲解清晰，适合零基础入门",
        "matchReason": "热门教程，推荐观看"
      },
      {
        "type": "document",
        "title": "极限公式汇总",
        "source": "知乎",
        "url": "https://example.com/search?type=doc&q=极限",
        "pages": 20,
        "quality": "medium",
        "description": "核心公式与定理速查",
        "matchReason": "优质学习资料"
      }
    ],
    "generatedAt": "2026-03-05T11:08:56.621Z"
  }
}
```

---

## 五、错误响应格式

所有 API 错误响应遵循统一格式：

### 5.1 验证错误 (400)

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "fieldName", "message": "错误描述" }
  ]
}
```

### 5.2 资源不存在 (404)

```json
{
  "success": false,
  "error": "资源名称不存在"
}
```

### 5.3 重复冲突 (409)

```json
{
  "success": false,
  "error": "该资源已存在"
}
```

### 5.5 服务器错误 (500)

```json
{
  "success": false,
  "error": "服务器内部错误"
}
```

---

## 六、配置说明

### 6.1 环境变量

在 `.env` 文件中配置以下内容：

```env
# Gemini AI 配置
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7
```

### 6.2 获取 API Key

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 创建新的 API Key
3. 将 API Key 填入 `.env` 文件

### 6.3 模拟模式

如果未配置 `GEMINI_API_KEY`，AI 服务将运行在模拟模式：
- 所有 AI 相关接口返回预设的模拟响应
- 不影响其他功能的正常使用

---

## 七、测试数据示例

### 7.1 创建测试数据

```bash
# 1. 创建课程
COURSE=$(curl -s -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{"name": "高等数学", "status": "STUDYING"}')

# 2. 创建章节
CHAPTER=$(curl -s -X POST http://localhost:3000/api/chapters \
  -H "Content-Type: application/json" \
  -d '{"courseId": "<COURSE_ID>", "name": "第一章", "order": 1}')

# 3. 创建知识点
KP1=$(curl -s -X POST http://localhost:3000/api/knowledge-points \
  -H "Content-Type: application/json" \
  -d '{"chapterId": "<CHAPTER_ID>", "name": "函数", "importance": 8}')

KP2=$(curl -s -X POST http://localhost:3000/api/knowledge-points \
  -H "Content-Type: application/json" \
  -d '{"chapterId": "<CHAPTER_ID>", "name": "极限", "importance": 9}')

# 4. 创建知识关系
curl -X POST http://localhost:3000/api/knowledge-relations \
  -H "Content-Type: application/json" \
  -d '{"sourceId": "<KP1_ID>", "targetId": "<KP2_ID>", "relationType": "PREREQUISITE", "weight": 8}'
```

---

## 八、版本历史

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| v1.0 | 2026-03-05 | 初始版本 |

---

**文档版本**: v1.0
**最后更新**: 2026-03-05
