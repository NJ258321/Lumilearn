# P6 智能组卷与测评服务 - API 接口文档

> 项目：LumiTrace AI (溯光智习)
> 阶段：P6 - 智能组卷与测评服务
> 版本：v1.0
> 更新日期：2026-03-06

---

## 一、概述

本文档描述了 P6 阶段的所有 API 接口，包括题目管理、智能组卷、随机抽题和答题记录分析。

**基础路径**: `http://localhost:3000/api`

**认证方式**: JWT Token (Bearer Token)

**通用响应格式**:
```json
{
  "success": true,
  "data": {},
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

---

## 二、P6.1 题目数据模型

### 数据库模型

#### Question (题目)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 题目ID |
| courseId | UUID | 所属课程ID |
| chapterId | UUID | 所属章节ID（可选） |
| knowledgePointId | UUID | 所属知识点ID（可选） |
| type | String | 题目类型 |
| content | String | 题目内容（支持Markdown） |
| options | JSON | 选项内容数组 |
| answer | JSON | 答案 |
| explanation | String | 解析 |
| difficulty | Int | 难度 (1-10) |
| score | Int | 分值 |
| timeLimit | Int | 时间限制（秒） |
| tags | JSON | 标签数组 |
| source | String | 来源 |
| usedCount | Int | 使用次数 |
| correctRate | Float | 正确率 |
| status | String | 状态 (ACTIVE/INACTIVE/REVIEW) |

#### AnswerRecord (答题记录)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 记录ID |
| userId | UUID | 用户ID |
| questionId | UUID | 题目ID |
| examSessionId | UUID | 考试会话ID（可选） |
| userAnswer | String | 用户答案 |
| isCorrect | Boolean | 是否正确 |
| timeSpent | Int | 花费时间（秒） |
| answeredAt | DateTime | 答题时间 |
| aiAnalysis | String | AI分析结果 |
| suggestedReview | String | 建议复习内容 |

#### ExamSession (考试会话)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 会话ID |
| userId | UUID | 用户ID |
| courseId | UUID | 课程ID（可选） |
| type | String | 会话类型 |
| title | String | 标题 |
| description | String | 描述 |
| questionIds | JSON | 题目ID列表 |
| totalQuestions | Int | 总题数 |
| totalScore | Int | 总分 |
| answeredCount | Int | 已答题数 |
| correctCount | Int | 正确数 |
| score | Float | 得分 |
| startedAt | DateTime | 开始时间 |
| completedAt | DateTime | 完成时间 |
| status | String | 状态 |

---

## 三、P6.2 题目 CRUD API

### 3.1 获取题目列表

**接口**: `GET /api/questions`

**功能**: 获取题目列表，支持分页和筛选

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | UUID | 否 | 课程ID筛选 |
| chapterId | UUID | 否 | 章节ID筛选 |
| type | String | 否 | 题目类型筛选 |
| difficulty | Int | 否 | 难度筛选 (1-10) |
| status | String | 否 | 状态筛选 (ACTIVE/INACTIVE/REVIEW) |
| search | String | 否 | 搜索关键词 |
| page | Int | 否 | 页码，默认1 |
| pageSize | Int | 否 | 每页数量，默认20，最大100 |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "uuid",
        "courseId": "uuid",
        "chapterId": "uuid",
        "knowledgePointId": "uuid",
        "type": "SINGLE_CHOICE",
        "content": "题目内容",
        "options": [{"A": "选项1"}, {"B": "选项2"}],
        "answer": {"correct": "A"},
        "explanation": "解析内容",
        "difficulty": 5,
        "score": 10,
        "timeLimit": null,
        "tags": ["基础"],
        "source": "真题",
        "usedCount": 10,
        "correctRate": 0.75,
        "status": "ACTIVE",
        "createdAt": "2026-03-06T00:00:00Z",
        "course": { "id": "uuid", "name": "高等数学" },
        "chapter": { "id": "uuid", "name": "第一章 极限" },
        "knowledgePoint": { "id": "uuid", "name": "极限的定义" }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| GET_QUESTIONS_FAILED | 获取题目列表失败 |

---

### 3.2 获取题目详情

**接口**: `GET /api/questions/:id`

**功能**: 获取单个题目的详细信息

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | UUID | 题目ID |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "courseId": "uuid",
    "type": "SINGLE_CHOICE",
    "content": "题目内容",
    "options": [{"A": "选项1"}, {"B": "选项2"}],
    "answer": {"correct": "A"},
    "explanation": "解析内容",
    "difficulty": 5,
    "score": 10,
    "tags": ["基础"],
    "source": "真题",
    "usedCount": 10,
    "correctRate": 0.75,
    "status": "ACTIVE",
    "course": { "id": "uuid", "name": "高等数学" },
    "chapter": { "id": "uuid", "name": "第一章" },
    "knowledgePoint": { "id": "uuid", "name": "极限定义" }
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| QUESTION_NOT_FOUND | 题目不存在 |
| GET_QUESTION_FAILED | 获取题目详情失败 |

---

### 3.3 创建题目

**接口**: `POST /api/questions`

**功能**: 创建新题目

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",              // 必填，课程ID
  "chapterId": "uuid",             // 必填，章节ID
  "knowledgePointId": "uuid",      // 必填，知识点ID
  "type": "SINGLE_CHOICE",         // 必填，题目类型
  "content": "题目内容",            // 必填，题目内容
  "options": [{"A": "选项1"}, {"B": "选项2"}],  // 可选，选项数组
  "answer": {"correct": "A"},      // 必填，答案对象
  "explanation": "解析内容",        // 可选，解析
  "difficulty": 5,                 // 可选，难度1-10，默认5
  "score": 10,                     // 可选，分值，默认10
  "timeLimit": 60,                 // 可选，时间限制（秒）
  "tags": ["基础", "重要"],         // 可选，标签数组
  "source": "真题"                 // 可选，来源
}
```

**题目类型**:
- `SINGLE_CHOICE` - 单选题
- `MULTIPLE_CHOICE` - 多选题
- `TRUE_FALSE` - 判断题
- `SHORT_ANSWER` - 简答题
- `ESSAY` - 论述题

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "courseId": "uuid",
    "type": "SINGLE_CHOICE",
    "content": "题目内容",
    "answer": {"correct": "A"},
    "difficulty": 5,
    "score": 10,
    "status": "ACTIVE",
    "createdAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| CHAPTER_NOT_FOUND | 章节不存在 |
| CHAPTER_NOT_IN_COURSE | 章节不属于该课程 |
| KNOWLEDGE_POINT_NOT_FOUND | 知识点不存在 |
| CREATE_QUESTION_FAILED | 创建题目失败 |

---

### 3.4 更新题目

**接口**: `PUT /api/questions/:id`

**功能**: 更新题目信息

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | UUID | 题目ID |

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "content": "新的题目内容",
  "options": [{"A": "新选项1"}, {"B": "新选项2"}],
  "answer": {"correct": "B"},
  "explanation": "新的解析",
  "difficulty": 7,
  "score": 15,
  "timeLimit": 90,
  "tags": ["提高"],
  "status": "ACTIVE"
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "新的题目内容",
    "difficulty": 7,
    "score": 15,
    "status": "ACTIVE",
    "updatedAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| QUESTION_NOT_FOUND | 题目不存在 |
| UPDATE_QUESTION_FAILED | 更新题目失败 |

---

### 3.5 删除题目

**接口**: `DELETE /api/questions/:id`

**功能**: 删除题目（有答题记录则软删除）

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | UUID | 题目ID |

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "题目已删除",
    "hardDeleted": true
  }
}
```

或软删除时:
```json
{
  "success": true,
  "data": {
    "message": "题目已禁用（该题目有答题记录）",
    "softDeleted": true
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| QUESTION_NOT_FOUND | 题目不存在 |
| DELETE_QUESTION_FAILED | 删除题目失败 |

---

### 3.6 批量导入题目

**接口**: `POST /api/questions/import`

**功能**: 批量导入题目

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",
  "questions": [
    {
      "type": "SINGLE_CHOICE",
      "content": "题目1内容",
      "options": [{"A": "选项1"}, {"B": "选项2"}],
      "answer": {"correct": "A"},
      "explanation": "解析",
      "difficulty": 5,
      "score": 10,
      "tags": ["基础"],
      "source": "真题"
    },
    {
      "type": "MULTIPLE_CHOICE",
      "content": "题目2内容",
      "options": [{"A": "选项1"}, {"B": "选项2"}, {"C": "选项3"}],
      "answer": {"correct": ["A", "C"]},
      "difficulty": 7
    }
  ]
}
```

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "imported": 10,
    "skipped": 2,
    "errors": 0,
    "details": {
      "imported": ["题目1...", "题目2..."],
      "skipped": ["第3题：缺少必填字段", "第5题：无效的题目类型"],
      "errors": []
    }
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| IMPORT_QUESTIONS_FAILED | 导入题目失败 |

---

### 3.7 导出题目

**接口**: `GET /api/questions/export`

**功能**: 导出题目为JSON或CSV格式

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | UUID | 否 | 课程ID筛选 |
| format | String | 否 | 导出格式 (json/csv)，默认json |

**响应**:
- JSON格式:
```json
{
  "success": true,
  "data": {
    "exportInfo": {
      "format": "json",
      "courseId": "uuid",
      "totalQuestions": 50,
      "exportedAt": "2026-03-06T00:00:00Z"
    },
    "questions": [
      {
        "type": "SINGLE_CHOICE",
        "content": "题目内容",
        "options": [{"A": "选项1"}],
        "answer": {"correct": "A"},
        "difficulty": 5,
        "score": 10
      }
    ]
  }
}
```

- CSV格式: 返回文件下载

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| EXPORT_QUESTIONS_FAILED | 导出题目失败 |

---

## 四、P6.3 智能组卷算法

### 4.1 AI 智能组卷

**接口**: `POST /api/exams/generate`

**功能**: 根据配置智能生成试卷

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",              // 必填，课程ID
  "title": "高等数学期中测试",      // 必填，试卷标题
  "description": "涵盖第1-5章内容", // 可选，描述
  "config": {
    "totalQuestions": 20,          // 必填，总题数
    "totalScore": 100,             // 可选，总分（自动计算）
    "difficulty": {                // 必填，难度分布
      "easy": 0.3,
      "medium": 0.5,
      "hard": 0.2
    },
    "typeDistribution": {         // 可选，题型分布
      "SINGLE_CHOICE": 10,
      "MULTIPLE_CHOICE": 5,
      "TRUE_FALSE": 5
    },
    "knowledgePointCoverage": 0.8, // 可选，知识点覆盖率
    "includeOldMistakes": true,    // 可选，是否包含历史错题
    "timeLimit": 90               // 可选，时间限制（分钟）
  }
}
```

**组卷策略**:
| 策略 | 说明 |
|------|------|
| random | 随机抽取 |
| difficulty_based | 按难度比例（默认） |
| knowledge_coverage | 知识点覆盖优先 |
| mistake_based | 错题相关优先 |
| hybrid | 混合策略 |

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "examSessionId": "uuid",
    "title": "高等数学期中测试",
    "questions": [
      {
        "id": "uuid",
        "type": "SINGLE_CHOICE",
        "content": "题目内容",
        "options": [{"A": "选项1"}, {"B": "选项2"}],
        "difficulty": 3,
        "score": 5,
        "knowledgePointId": "uuid",
        "chapterId": "uuid"
      }
    ],
    "totalQuestions": 20,
    "totalScore": 100,
    "timeLimit": 90,
    "generatedAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| NO_QUESTIONS_AVAILABLE | 没有可用题目 |
| GENERATE_EXAM_FAILED | 生成试卷失败 |

---

### 4.2 按条件组卷

**接口**: `POST /api/exams/generate-by-filters`

**功能**: 根据指定条件筛选并组卷

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",              // 必填，课程ID
  "questionCount": 15,             // 必填，题目数量
  "chapterIds": ["uuid1", "uuid2"], // 可选，章节ID数组
  "knowledgePointIds": ["uuid1", "uuid2"], // 可选，知识点ID数组
  "types": ["SINGLE_CHOICE", "TRUE_FALSE"], // 可选，题型数组
  "difficultyRange": [3, 7],      // 可选，难度范围 [min, max]
  "randomOrder": true,             // 可选，是否随机顺序，默认true
  "title": "章节测试"              // 可选，试卷标题
}
```

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "examSessionId": "uuid",
    "title": "章节测试",
    "questions": [...],
    "totalQuestions": 15,
    "totalScore": 150,
    "generatedAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| NO_MATCHING_QUESTIONS | 没有符合条件的题目 |
| GENERATE_EXAM_FAILED | 生成试卷失败 |

---

## 五、P6.4 随机抽题服务

### 5.1 随机抽题

**接口**: `POST /api/exams/random`

**功能**: 随机抽取指定数量的题目

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",              // 必填，课程ID
  "count": 10,                     // 必填，抽题数量
  "excludeIds": ["uuid1", "uuid2"], // 可选，排除的题目ID
  "filters": {                     // 可选，筛选条件
    "type": "SINGLE_CHOICE",
    "difficulty": [1, 8],
    "knowledgePointId": "uuid"
  }
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "uuid",
        "type": "SINGLE_CHOICE",
        "content": "题目内容",
        "options": [{"A": "选项1"}, {"B": "选项2"}],
        "difficulty": 5,
        "score": 10,
        "knowledgePointId": "uuid"
      }
    ],
    "count": 10
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| NO_QUESTIONS_AVAILABLE | 没有可用题目 |
| RANDOM_DRAW_FAILED | 随机抽题失败 |

---

### 5.2 每日一练

**接口**: `GET /api/exams/daily-practice`

**功能**: 获取每日一练题目

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | UUID | 否 | 课程ID |
| difficulty | Int | 否 | 难度偏好 (1-10) |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "date": "2026-03-06",
    "question": {
      "id": "uuid",
      "type": "SINGLE_CHOICE",
      "content": "题目内容",
      "options": [{"A": "选项1"}, {"B": "选项2"}],
      "difficulty": 5,
      "score": 10
    },
    "streak": 5,
    "totalAnswered": 50,
    "correctRate": 0.75
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| DAILY_PRACTICE_FAILED | 每日一练获取失败 |

---

### 5.3 挑战模式

**接口**: `POST /api/exams/challenge`

**功能**: 开始挑战模式练习

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",              // 必填，课程ID
  "mode": "speed",                 // 必填，模式 (speed/accuracy/endurance)
  "count": 20                      // 可选，题目数量，默认10
}
```

**挑战模式说明**:
| 模式 | 说明 |
|------|------|
| speed | 速度模式 - 计时挑战 |
| accuracy | 准确率模式 - 追求正确率 |
| endurance | 耐力模式 - 大量题目 |

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "mode": "speed",
    "questions": [...],
    "totalQuestions": 20,
    "timeLimit": 300,
    "startedAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| CHALLENGE_FAILED | 挑战模式开启失败 |

---

## 六、P6.5 答题记录与分析

### 6.1 创建答题会话

**接口**: `POST /api/exams/sessions`

**功能**: 创建新的答题会话

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "type": "MOCK_EXAM",             // 必填，会话类型
  "courseId": "uuid",              // 可选，课程ID
  "title": "章节测试",              // 必填，标题
  "questionIds": ["uuid1", "uuid2"] // 可选，题目ID数组
}
```

**会话类型**:
| 类型 | 说明 |
|------|------|
| MOCK_EXAM | 模拟考试 |
| PRACTICE | 练习 |
| RANDOM_TEST | 随机测试 |
| AI_GENERATED | AI生成 |

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "MOCK_EXAM",
    "title": "章节测试",
    "totalQuestions": 10,
    "status": "IN_PROGRESS",
    "startedAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| CREATE_SESSION_FAILED | 创建会话失败 |

---

### 6.2 提交答案

**接口**: `POST /api/exams/:sessionId/answers`

**功能**: 提交单道题的答案

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| sessionId | UUID | 会话ID |

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "questionId": "uuid",            // 必填，题目ID
  "userAnswer": "A",              // 必填，用户答案
  "timeSpent": 30                 // 可选，花费时间（秒）
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "isCorrect": true,
    "correctAnswer": "A",
    "explanation": "解析内容...",
    "score": 10,
    "aiAnalysis": "AI分析...",
    "streak": 3
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| SESSION_NOT_FOUND | 会话不存在 |
| QUESTION_NOT_FOUND | 题目不存在 |
| SUBMIT_ANSWER_FAILED | 提交答案失败 |

---

### 6.3 交卷

**接口**: `POST /api/exams/:sessionId/submit`

**功能**: 完成答题会话，提交试卷

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| sessionId | UUID | 会话ID |

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "MOCK_EXAM",
    "title": "章节测试",
    "totalQuestions": 10,
    "answeredCount": 10,
    "correctCount": 8,
    "score": 80,
    "status": "COMPLETED",
    "completedAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| SESSION_NOT_FOUND | 会话不存在 |
| SUBMIT_EXAM_FAILED | 交卷失败 |

---

### 6.4 获取答题记录

**接口**: `GET /api/exams/records`

**功能**: 获取用户的答题记录

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| questionId | UUID | 否 | 题目ID筛选 |
| isCorrect | Boolean | 否 | 正误筛选 |
| page | Int | 否 | 页码，默认1 |
| pageSize | Int | 否 | 每页数量，默认20 |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "questionId": "uuid",
        "examSessionId": "uuid",
        "userAnswer": "A",
        "isCorrect": true,
        "timeSpent": 30,
        "answeredAt": "2026-03-06T00:00:00Z",
        "question": {
          "id": "uuid",
          "content": "题目内容",
          "type": "SINGLE_CHOICE"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| GET_RECORDS_FAILED | 获取答题记录失败 |

---

### 6.5 获取答题统计

**接口**: `GET /api/exams/statistics`

**功能**: 获取答题统计数据

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| courseId | UUID | 否 | 课程ID筛选 |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "totalAnswered": 500,
    "correctCount": 380,
    "correctRate": 0.76,
    "averageTime": 45,
    "byType": {
      "SINGLE_CHOICE": {
        "total": 200,
        "correct": 160,
        "rate": 0.8
      },
      "MULTIPLE_CHOICE": {
        "total": 100,
        "correct": 60,
        "rate": 0.6
      }
    },
    "byDifficulty": {
      "easy": { "total": 150, "correct": 135, "rate": 0.9 },
      "medium": { "total": 250, "correct": 190, "rate": 0.76 },
      "hard": { "total": 100, "correct": 55, "rate": 0.55 }
    },
    "weakAreas": [
      {
        "knowledgePointId": "uuid",
        "name": "洛必达法则",
        "correctRate": 0.4
      }
    ],
    "trend": [
      { "date": "2026-03-01", "correctRate": 0.7 },
      { "date": "2026-03-02", "correctRate": 0.72 }
    ]
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| GET_STATISTICS_FAILED | 获取统计失败 |

---

### 6.6 获取错题本

**接口**: `GET /api/exams/mistakes`

**功能**: 获取用户的错题记录

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| knowledgePointId | UUID | 否 | 知识点ID筛选 |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "mistakes": [
      {
        "questionId": "uuid",
        "content": "题目内容",
        "options": [{"A": "选项1"}, {"B": "选项2"}],
        "userAnswer": "A",
        "correctAnswer": "B",
        "wrongCount": 3,
        "lastAnsweredAt": "2026-03-05T00:00:00Z",
        "knowledgePointId": "uuid",
        "knowledgePointName": "洛必达法则"
      }
    ],
    "statistics": {
      "total": 50,
      "reviewed": 30,
      "notReviewed": 20
    }
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| GET_MISTAKES_FAILED | 获取错题失败 |

---

### 6.7 错题重做

**接口**: `POST /api/exams/mistakes/retry`

**功能**: 基于错题创建新的练习

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "knowledgePointId": "uuid",      // 可选，知识点ID
  "count": 10                      // 可选，题目数量，默认10
}
```

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "title": "错题重做",
    "questions": [...],
    "totalQuestions": 10,
    "startedAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| NO_MISTAKES_FOUND | 没有错题记录 |
| RETRY_FAILED | 错题重做失败 |

---

### 6.8 个性化练习

**接口**: `POST /api/exams/personalized-practice`

**功能**: 基于用户薄弱知识点生成个性化练习

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",              // 必填，课程ID
  "count": 5,                      // 可选，题目数量，默认5
  "difficulty": 6,                 // 可选，难度偏好
  "focusAreas": ["weak_points"]    // 可选，重点区域
}
```

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "sessionId": "uuid",
    "title": "个性化练习",
    "questions": [
      {
        "id": "uuid",
        "type": "SINGLE_CHOICE",
        "content": "题目内容",
        "difficulty": 6,
        "knowledgePointId": "uuid",
        "reason": "基于您的错题记录推荐"
      }
    ],
    "totalQuestions": 5,
    "startedAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| PERSONALIZED_FAILED | 个性化练习生成失败 |

---

## 七、API 接口清单汇总

### P6.2 题目 CRUD
| 接口 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/api/questions` | GET | 获取题目列表 | ✅ |
| `/api/questions/:id` | GET | 获取题目详情 | ✅ |
| `/api/questions` | POST | 创建题目 | ✅ |
| `/api/questions/:id` | PUT | 更新题目 | ✅ |
| `/api/questions/:id` | DELETE | 删除题目 | ✅ |
| `/api/questions/import` | POST | 批量导入题目 | ✅ |
| `/api/questions/export` | GET | 导出题目 | ✅ |

### P6.3 智能组卷
| 接口 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/api/exams/generate` | POST | AI智能组卷 | ✅ |
| `/api/exams/generate-by-filters` | POST | 按条件组卷 | ✅ |

### P6.4 随机抽题
| 接口 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/api/exams/random` | POST | 随机抽题 | ✅ |
| `/api/exams/daily-practice` | GET | 每日一练 | ✅ |
| `/api/exams/challenge` | POST | 挑战模式 | ✅ |

### P6.5 答题记录
| 接口 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/api/exams/sessions` | POST | 创建答题会话 | ✅ |
| `/api/exams/:sessionId/answers` | POST | 提交答案 | ✅ |
| `/api/exams/:sessionId/submit` | POST | 交卷 | ✅ |
| `/api/exams/records` | GET | 获取答题记录 | ✅ |
| `/api/exams/statistics` | GET | 获取答题统计 | ✅ |
| `/api/exams/mistakes` | GET | 获取错题本 | ✅ |
| `/api/exams/mistakes/retry` | POST | 错题重做 | ✅ |
| `/api/exams/personalized-practice` | POST | 个性化练习 | ✅ |

---

## 八、错误码汇总

| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录或登录已过期 |
| COURSE_NOT_FOUND | 课程不存在 |
| CHAPTER_NOT_FOUND | 章节不存在 |
| CHAPTER_NOT_IN_COURSE | 章节不属于该课程 |
| KNOWLEDGE_POINT_NOT_FOUND | 知识点不存在 |
| QUESTION_NOT_FOUND | 题目不存在 |
| SESSION_NOT_FOUND | 答题会话不存在 |
| NO_QUESTIONS_AVAILABLE | 没有可用题目 |
| NO_MATCHING_QUESTIONS | 没有符合条件的题目 |
| NO_MISTAKES_FOUND | 没有错题记录 |
| GET_QUESTIONS_FAILED | 获取题目列表失败 |
| CREATE_QUESTION_FAILED | 创建题目失败 |
| UPDATE_QUESTION_FAILED | 更新题目失败 |
| DELETE_QUESTION_FAILED | 删除题目失败 |
| IMPORT_QUESTIONS_FAILED | 导入题目失败 |
| EXPORT_QUESTIONS_FAILED | 导出题目失败 |
| GENERATE_EXAM_FAILED | 生成试卷失败 |
| RANDOM_DRAW_FAILED | 随机抽题失败 |
| DAILY_PRACTICE_FAILED | 每日一练获取失败 |
| CHALLENGE_FAILED | 挑战模式开启失败 |
| CREATE_SESSION_FAILED | 创建会话失败 |
| SUBMIT_ANSWER_FAILED | 提交答案失败 |
| SUBMIT_EXAM_FAILED | 交卷失败 |
| GET_RECORDS_FAILED | 获取答题记录失败 |
| GET_STATISTICS_FAILED | 获取统计失败 |
| GET_MISTAKES_FAILED | 获取错题失败 |
| RETRY_FAILED | 错题重做失败 |
| PERSONALIZED_FAILED | 个性化练习生成失败 |

---

**文档版本**: v1.0
**更新日期**: 2026-03-06
