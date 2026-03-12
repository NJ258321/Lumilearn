# P5 用户系统与个性化服务 - API 接口文档

> 项目：LumiTrace AI (溯光智习)
> 阶段：P5 - 用户系统与个性化服务
> 版本：v1.0
> 更新日期：2026-03-06

---

## 一、概述

本文档描述了 P5 阶段的所有 API 接口，包括用户认证、个性化推荐、备考规划（复习计划生成、任务重排、多学科统筹）、学习提醒、数据导出和用户偏好设置。

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

## 二、P5.1 用户认证与权限管理

### 2.1 用户注册

**接口**: `POST /api/auth/register`

**功能**: 创建新用户账户

**请求头**: 无需认证

**请求体**:
```json
{
  "username": "string",        // 用户名 (3-20字符, 字母数字下划线)
  "email": "string",           // 邮箱地址
  "password": "string",       // 密码 (6-50字符)
  "displayName": "string"     // 显示名称 (可选, 最大50字符)
}
```

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "role": "USER",
    "createdAt": "2026-03-06T00:00:00Z"
  },
  "token": "jwt_token_string"
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| USERNAME_EXISTS | 用户名已存在 |
| EMAIL_EXISTS | 邮箱已被注册 |
| REGISTER_FAILED | 注册失败 |

---

### 2.2 用户登录

**接口**: `POST /api/auth/login`

**功能**: 用户登录，返回 JWT Token

**请求头**: 无需认证

**请求体**:
```json
{
  "email": "string",      // 邮箱地址
  "password": "string"    // 密码
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "role": "USER",
    "preferences": null,
    "createdAt": "2026-03-06T00:00:00Z"
  },
  "token": "jwt_token_string"
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| INVALID_CREDENTIALS | 邮箱或密码错误 |
| LOGIN_FAILED | 登录失败 |

---

### 2.3 获取当前用户

**接口**: `GET /api/auth/me`

**功能**: 获取当前登录用户的信息

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
    "username": "string",
    "email": "string",
    "displayName": "string",
    "role": "USER",
    "preferences": null,
    "createdAt": "2026-03-06T00:00:00Z",
    "updatedAt": "2026-03-06T00:00:00Z"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录或登录已过期 |
| USER_NOT_FOUND | 用户不存在 |

---

### 2.4 更新用户信息

**接口**: `PUT /api/auth/profile`

**功能**: 更新当前用户的个人资料

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "displayName": "string",   // 显示名称 (可选)
  "preferences": {}           // 偏好设置 (可选)
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "role": "USER",
    "preferences": {},
    "updatedAt": "2026-03-06T00:00:00Z"
  }
}
```

---

### 2.5 修改密码

**接口**: `PUT /api/auth/password`

**功能**: 修改当前用户的密码

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "currentPassword": "string",   // 当前密码
  "newPassword": "string"       // 新密码 (6-50字符)
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "密码修改成功，请重新登录"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| INCORRECT_PASSWORD | 当前密码错误 |
| CHANGE_PASSWORD_FAILED | 修改密码失败 |

---

### 2.6 获取所有用户（管理员）

**接口**: `GET /api/auth/users`

**功能**: 获取所有用户列表（仅管理员）

**请求头**:
```
Authorization: Bearer <jwt_token> (需 ADMIN 角色)
```

**查询参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| pageSize | number | 20 | 每页数量 |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "displayName": "string",
        "role": "USER",
        "createdAt": "2026-03-06T00:00:00Z",
        "updatedAt": "2026-03-06T00:00:00Z"
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
| FORBIDDEN | 权限不足，仅管理员可访问 |

---

### 2.7 删除用户（管理员）

**接口**: `DELETE /api/auth/users/:id`

**功能**: 删除指定用户（仅管理员）

**请求头**:
```
Authorization: Bearer <jwt_token> (需 ADMIN 角色)
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | uuid | 用户ID |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "用户已删除"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| FORBIDDEN | 权限不足 |
| CANNOT_DELETE_SELF | 不能删除自己的账户 |
| USER_NOT_FOUND | 用户不存在 |

---

### 2.8 更新用户角色（管理员）

**接口**: `PUT /api/auth/users/:id/role`

**功能**: 修改用户角色（仅管理员）

**请求头**:
```
Authorization: Bearer <jwt_token> (需 ADMIN 角色)
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | uuid | 用户ID |

**请求体**:
```json
{
  "role": "USER" | "ADMIN"
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "role": "ADMIN"
  }
}
```

---

## 三、P5.2 个性化推荐算法

### 3.1 获取每日推荐

**接口**: `GET /api/recommendations/daily`

**功能**: 获取今日个性化学习推荐

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "date": "2026-03-06",
    "recommendedItems": [
      {
        "type": "knowledge_point",
        "id": "uuid",
        "name": "洛必达法则",
        "courseName": "高等数学",
        "chapterName": "第三章",
        "status": "WEAK",
        "masteryScore": 20,
        "reason": "掌握度较低，重要知识点，今天需要复习，薄弱知识点",
        "priority": "high",
        "estimatedTime": 30
      }
    ],
    "focusAreas": ["10个薄弱知识点", "超过50%知识点未掌握"],
    "statistics": {
      "totalStudyTime": 4200,
      "studyDays": 2,
      "masteredPoints": 3,
      "weakPoints": 3
    },
    "generatedAt": "2026-03-06T10:00:00Z"
  }
}
```

**推荐算法说明**:
- **掌握度因素** (0-30分): 掌握度越低分数越高
- **重要性因素** (0-20分): 重要性 * 2
- **遗忘曲线因素** (0-25分): 1天内 +25分, 3天内 +20分, 7天内 +10分
- **错题因素** (0-15分): 错题数 * 5
- **学习次数因素** (0-10分): 学习次数 < 2 次 +10分
- **状态权重**: WEAK * 1.3, NEED_REVIEW * 1.2

---

### 3.2 获取推荐学习路径

**接口**: `GET /api/recommendations/learning-path/:courseId`

**功能**: 获取课程的学习路径推荐

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| courseId | uuid | 课程ID |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "courseId": "uuid",
    "courseName": "高等数学",
    "totalPoints": 50,
    "masteredPoints": 20,
    "recommendedPath": [
      {
        "order": 1,
        "type": "review",
        "knowledgePointId": "uuid",
        "name": "极限",
        "chapterName": "第一章",
        "status": "NEED_REVIEW",
        "masteryScore": 60,
        "priority": "high",
        "reason": "掌握度较低，需要复习"
      }
    ],
    "estimatedTotalTime": 300,
    "learningStrategy": {
      "method": "基于前置依赖和掌握度的智能排序",
      "description": "优先推荐可学习且掌握度较低的知识点"
    }
  }
}
```

---

### 3.3 获取推荐资源

**接口**: `GET /api/recommendations/resources/:knowledgePointId`

**功能**: 获取指定知识点的相关学习资源

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| knowledgePointId | uuid | 知识点ID |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "knowledgePointId": "uuid",
    "knowledgePointName": "洛必达法则",
    "courseName": "高等数学",
    "currentStatus": {
      "status": "WEAK",
      "masteryScore": 20,
      "importance": 8
    },
    "resources": [
      {
        "type": "knowledge_point",
        "id": "uuid",
        "name": "导数",
        "description": "相关知识点 - 掌握度60%",
        "relevance": 80
      }
    ],
    "summary": {
      "totalResources": 10,
      "relatedPoints": 5,
      "studyRecords": 3,
      "mistakeRelated": 2
    }
  }
}
```

**资源类型**:
- `knowledge_point`: 相关知识点
- `study_record`: 相关学习记录
- `weak_point`: 易错相关知识点

---

### 3.4 记录推荐反馈

**接口**: `POST /api/recommendations/feedback`

**功能**: 记录用户对推荐的反馈，优化推荐算法

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "itemId": "uuid",                    // 项目ID
  "itemType": "knowledge_point | resource | learning_path",
  "action": "view | complete | skip | helpful | not_helpful",
  "feedback": "string"                 // 反馈内容 (可选)
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "itemId": "uuid",
    "itemType": "knowledge_point",
    "action": "complete",
    "message": "已完成学习，知识点掌握度已更新",
    "recordedAt": "2026-03-06T10:00:00Z"
  }
}
```

**操作说明**:
| 操作 | 说明 |
|------|------|
| view | 查看推荐 |
| complete | 完成学习 |
| skip | 跳过 |
| helpful | 有帮助 |
| not_helpful | 无帮助 |

---

### 3.5 获取热门推荐

**接口**: `GET /api/recommendations/popular`

**功能**: 获取热门知识点推荐

**请求头**: 无需认证

**查询参数**:
| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| limit | number | 10 | 返回数量限制 |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "period": "all_time",
    "popularItems": [
      {
        "type": "knowledge_point",
        "id": "uuid",
        "name": "洛必达法则",
        "courseName": "高等数学",
        "chapterName": "第三章",
        "studyCount": 15,
        "mistakeCount": 8,
        "masteryScore": 40,
        "hotScore": 74
      }
    ],
    "generatedAt": "2026-03-06T10:00:00Z"
  }
}
```

**热门分数计算**: `学习次数 * 2 + 错题数 * 5 + 重要性 * 3`

---

## 四、P5.3 备考规划服务

### 4.1 生成复习计划

**接口**: `POST /api/review/generate-plan`

**功能**: 根据艾宾浩斯遗忘曲线生成个性化复习计划

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",              // 必填，课程ID
  "days": 30,                     // 可选，计划天数，默认30
  "dailyReviewTime": 60,          // 可选，每日复习时间（分钟），默认60
  "focusAreas": ["weak_points"],  // 可选，重点区域
  "includeNewKnowledge": true      // 可选，是否包含新知识学习
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "courseId": "uuid",
    "courseName": "高等数学",
    "planStartDate": "2026-03-07",
    "planEndDate": "2026-04-05",
    "totalReviewItems": 25,
    "estimatedDailyTime": 50,
    "dailyPlan": [
      {
        "date": "2026-03-07",
        "items": [
          {
            "type": "new",
            "knowledgePointId": "uuid",
            "knowledgePointName": "极限的定义",
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

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| NO_KNOWLEDGE_POINTS | 该课程没有知识点 |
| GENERATE_PLAN_FAILED | 生成复习计划失败 |

---

### 4.2 获取今日复习任务

**接口**: `GET /api/review/today`

**功能**: 获取当天需要复习的任务列表

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "date": "2026-03-07",
    "totalItems": 5,
    "totalTime": 120,
    "items": [
      {
        "id": "review-uuid-2026-03-07",
        "knowledgePointId": "uuid",
        "knowledgePointName": "极限的定义",
        "courseName": "高等数学",
        "type": "review",
        "reviewCount": 2,
        "reason": "上次学习已过3天",
        "estimatedTime": 15,
        "masteryScore": 45
      }
    ]
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| GET_TODAY_FAILED | 获取今日任务失败 |

---

### 4.3 记录复习完成

**接口**: `POST /api/review/:knowledgePointId/complete`

**功能**: 记录知识点复习完成，更新掌握度

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| knowledgePointId | UUID | 知识点ID |

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "difficulty": "easy",      // 可选，难度评级 (easy/medium/hard)
  "timeSpent": 20,          // 可选，学习时长（分钟）
  "notes": "笔记内容"       // 可选，笔记
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "knowledgePointId": "uuid",
    "knowledgePointName": "极限的定义",
    "previousMasteryScore": 45,
    "currentMasteryScore": 60,
    "status": "LEARNING",
    "masteryDelta": 15,
    "difficulty": "easy",
    "nextReviewDate": "2026-03-10",
    "nextReviewReason": "根据easy难度，下一次复习安排在3天后"
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| KNOWLEDGE_POINT_NOT_FOUND | 知识点不存在 |
| RECORD_COMPLETE_FAILED | 记录失败 |

---

### 4.4 获取复习统计

**接口**: `GET /api/review/statistics`

**功能**: 获取复习统计数据

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-03-01",
      "end": "2026-03-07"
    },
    "statistics": {
      "totalReviewedThisWeek": 20,
      "masteredThisWeek": 5,
      "weakPointsRemaining": 8,
      "averageImprovement": 8
    },
    "todayProgress": {
      "targetItems": 5,
      "completedItems": 3,
      "completionRate": 0.6
    },
    "upcomingReviews": [
      {
        "date": "2026-03-08",
        "interval": "1天后",
        "estimatedItems": 4
      }
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

### 4.5 获取课程复习计划

**接口**: `GET /api/review/course/:courseId`

**功能**: 获取指定课程的复习计划概览

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| courseId | UUID | 课程ID |

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "courseId": "uuid",
    "courseName": "高等数学",
    "totalKnowledgePoints": 25,
    "statusSummary": {
      "mastered": 10,
      "learning": 8,
      "weak": 5,
      "needReview": 2,
      "notStarted": 0
    },
    "upcomingReviewsThisWeek": [
      {
        "knowledgePointId": "uuid",
        "name": "洛必达法则",
        "masteryScore": 40,
        "lastReviewed": "2026-03-01",
        "nextReviewDate": "2026-03-08",
        "daysUntilNextReview": 1,
        "priority": "high"
      }
    ],
    "reviewPriority": {
      "high": 5,
      "medium": 8
    }
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| GET_COURSE_REVIEW_FAILED | 获取复习计划失败 |

---

### 4.6 任务重排

**接口**: `PUT /api/review/replan`

**功能**: 动态调整复习计划，当用户未完成某日任务时，自动将任务重新分配到后续日期

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",                    // 必填，课程ID
  "completedTaskIds": ["uuid1"],         // 可选，已完成任务ID列表
  "skipTaskIds": ["uuid2"],              // 可选，跳过的任务ID列表
  "remainingDays": 5,                    // 可选，剩余天数，默认7
  "currentDay": 1                        // 可选，当前天数，默认1
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "courseId": "uuid",
    "courseName": "高等数学",
    "originalTotalTasks": 20,
    "completedTasks": 5,
    "skippedTasks": 2,
    "pendingTasks": 13,
    "replannedDays": 5,
    "replannedPlan": [
      {
        "date": "2026-03-07",
        "items": [
          {
            "knowledgePointId": "uuid",
            "knowledgePointName": "洛必达法则",
            "reason": "之前跳过，现重新安排",
            "priority": "high",
            "estimatedTime": 15
          }
        ],
        "totalTime": 30
      }
    ],
    "summary": {
      "movedTasks": 13,
      "removedTasks": 2,
      "message": "已将13个未完成任务重新分配到5天"
    }
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 课程不存在 |
| REPLAN_FAILED | 任务重排失败 |

---

### 4.7 多学科统筹优化

**接口**: `POST /api/review/optimize`

**功能**: 多课程同时备考时，智能分配每日学习时间

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseIds": ["uuid1", "uuid2"],       // 必填，课程ID列表
  "dailyStudyHours": 3,                  // 可选，每日学习时长（小时），默认3
  "preferences": {                        // 可选，学习偏好
    "morningFocus": ["uuid1"]
  }
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "courseAnalysis": [
      {
        "courseId": "uuid1",
        "courseName": "高等数学",
        "totalKnowledgePoints": 25,
        "weakPoints": 8,
        "notMastered": 15,
        "daysUntilExam": 30,
        "priority": "medium"
      }
    ],
    "dailyAllocation": [
      {
        "courseId": "uuid1",
        "courseName": "高等数学",
        "allocatedHours": 1.5,
        "estimatedDays": 10,
        "priority": "medium",
        "weakPoints": 8,
        "notMastered": 15
      }
    ],
    "optimizedSchedule": {
      "2026-03-07": {
        "courses": [
          {
            "courseId": "uuid1",
            "courseName": "高等数学",
            "hours": 1.5,
            "focus": "薄弱点突破",
            "tasks": ["错题复习", "重点知识点"]
          }
        ],
        "totalHours": 3
      }
    },
    "warnings": ["学习计划安排合理"],
    "summary": {
      "totalCourses": 2,
      "totalDailyHours": 3,
      "totalKnowledgePoints": 40,
      "totalWeakPoints": 15,
      "averageDaysUntilExam": 25
    }
  }
}
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录 |
| COURSE_NOT_FOUND | 部分课程不存在 |
| OPTIMIZE_FAILED | 优化失败 |

---

## 五、P5.4 学习提醒服务

### 4.1 创建提醒

**接口**: `POST /api/reminders`

**功能**: 创建新的学习提醒

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "type": "study_time | review | exam | goal",  // 提醒类型
  "title": "string",                              // 标题 (1-100字符)
  "message": "string",                            // 消息内容 (可选, 最大500字符)
  "scheduledAt": "2026-03-06T09:00:00Z",         // 提醒时间 (ISO8601)
  "recurring": {                                 // 重复设置 (可选)
    "enabled": true,
    "pattern": "daily | weekly | weekdays",
    "daysOfWeek": [1, 2, 3, 4, 5]
  },
  "courseId": "uuid"                              // 课程ID (可选)
}
```

**响应 (201 Created)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "study_time",
    "title": "早晨学习提醒",
    "message": "该开始今天的学习了！",
    "scheduledAt": "2026-03-06T09:00:00.000Z",
    "recurring": {
      "enabled": true,
      "pattern": "daily"
    },
    "status": "pending",
    "createdAt": "2026-03-06T10:00:00Z"
  }
}
```

**提醒类型说明**:
| 类型 | 说明 |
|------|------|
| study_time | 学习时间提醒 |
| review | 复习提醒 |
| exam | 考试提醒 |
| goal | 目标提醒 |

**重复模式说明**:
| 模式 | 说明 |
|------|------|
| daily | 每天重复 |
| weekly | 每周重复 |
| weekdays | 工作日重复 |

---

### 4.2 获取提醒列表

**接口**: `GET /api/reminders`

**功能**: 获取用户的提醒列表

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 筛选状态 (pending/completed/cancelled) |
| type | string | 筛选类型 |
| page | number | 页码 |
| pageSize | number | 每页数量 |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "reminders": [
      {
        "id": "uuid",
        "type": "study_time",
        "title": "早晨学习提醒",
        "message": "该开始今天的学习了！",
        "scheduledAt": "2026-03-06T09:00:00.000Z",
        "scheduledTime": "09:00",
        "recurring": null,
        "status": "pending",
        "completedAt": null,
        "createdAt": "2026-03-06T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

---

### 4.3 获取今日提醒

**接口**: `GET /api/reminders/today`

**功能**: 获取今日所有待处理提醒

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "date": "2026-03-06",
    "reminders": [
      {
        "id": "uuid",
        "type": "study_time",
        "title": "早晨学习提醒",
        "message": "该开始今天的学习了！",
        "scheduledAt": "2026-09:00:03-06T00.000Z",
        "scheduledTime": "09:00",
        "recurring": null,
        "status": "pending"
      }
    ],
    "statistics": {
      "total": 3,
      "studyTime": 1,
      "review": 1,
      "exam": 1,
      "goal": 0
    }
  }
}
```

---

### 4.4 获取单个提醒

**接口**: `GET /api/reminders/:id`

**功能**: 获取指定提醒的详细信息

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | uuid | 提醒ID |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "study_time",
    "title": "早晨学习提醒",
    "message": "该开始今天的学习了！",
    "scheduledAt": "2026-03-06T09:00:00.000Z",
    "scheduledTime": "09:00",
    "recurring": null,
    "status": "pending",
    "completedAt": null,
    "createdAt": "2026-03-06T10:00:00Z"
  }
}
```

---

### 4.5 更新提醒

**接口**: `PUT /api/reminders/:id`

**功能**: 更新提醒信息

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | uuid | 提醒ID |

**请求体** (所有字段可选):
```json
{
  "title": "string",
  "message": "string",
  "scheduledAt": "2026-03-07T09:00:00Z",
  "status": "pending | cancelled",
  "recurring": {}
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "study_time",
    "title": "更新后的标题",
    "message": "更新后的消息",
    "scheduledAt": "2026-03-07T09:00:00.000Z",
    "scheduledTime": "09:00",
    "recurring": null,
    "status": "pending"
  }
}
```

---

### 4.6 删除提醒

**接口**: `DELETE /api/reminders/:id`

**功能**: 删除指定提醒

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | uuid | 提醒ID |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "提醒已删除"
  }
}
```

---

### 4.7 标记提醒完成

**接口**: `POST /api/reminders/:id/complete`

**功能**: 标记提醒为已完成（如果是重复提醒，会自动创建下一次）

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| id | uuid | 提醒ID |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "study_time",
    "title": "早晨学习提醒",
    "status": "completed",
    "completedAt": "2026-03-06T10:00:00Z",
    "message": "提醒已完成，下一次提醒已自动创建"
  }
}
```

---

### 4.8 批量删除提醒

**接口**: `POST /api/reminders/batch-delete`

**功能**: 批量删除提醒

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "deleted": 3,
    "requested": 3
  }
}
```

---

## 五、P5.4 数据导出与同步

### 5.1 导出学习数据

**接口**: `POST /api/export/data`

**功能**: 导出用户学习数据

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "format": "json | csv",                                           // 导出格式
  "dataTypes": ["courses", "chapters", "knowledge_points", ...],    // 数据类型
  "timeRange": {                                                    // 时间范围 (可选)
    "start": "2026-01-01",
    "end": "2026-03-06"
  }
}
```

**数据类型选项**:
| 类型 | 说明 |
|------|------|
| courses | 课程 |
| chapters | 章节 |
| knowledge_points | 知识点 |
| study_records | 学习记录 |
| mistakes | 错题 |
| notes | 笔记 |

**JSON 响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "exportInfo": {
      "format": "json",
      "dataTypes": ["courses", "knowledge_points"],
      "timeRange": {
        "start": "2026-01-01",
        "end": "2026-03-06"
      },
      "exportedAt": "2026-03-06T10:00:00Z"
    },
    "statistics": {
      "totalRecords": 100,
      "breakdown": {
        "courses": 5,
        "knowledge_points": 50
      }
    },
    "data": {
      "courses": [],
      "knowledge_points": []
    }
  }
}
```

**CSV 响应**: 直接返回文件下载

---

### 5.2 导出学习报告

**接口**: `POST /api/export/report`

**功能**: 生成并导出课程学习报告

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "courseId": "uuid",                                         // 课程ID
  "format": "json | pdf",                                    // 格式 (默认 json)
  "include": ["progress", "statistics", "evaluation", "recommendations"]  // 包含内容
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "course": {
      "id": "uuid",
      "name": "高等数学",
      "type": "PROFESSIONAL",
      "status": "STUDYING",
      "targetGrade": "A",
      "examDate": "2026-06-15"
    },
    "progress": {
      "chapters": [
        {
          "id": "uuid",
          "name": "第一章",
          "order": 1,
          "totalPoints": 10,
          "masteredPoints": 6,
          "progress": 60
        }
      ],
      "overall": {
        "totalChapters": 5,
        "totalKnowledgePoints": 50,
        "masteredPoints": 20,
        "progress": 40
      }
    },
    "statistics": {
      "totalStudyTime": 300,
      "studyDays": 15,
      "averageSessionLength": 20,
      "totalMistakes": 25,
      "mistakeRate": 8
    },
    "evaluation": {
      "averageMasteryScore": 65,
      "grade": "B",
      "status": {
        "mastered": 20,
        "learning": 15,
        "weak": 10,
        "notStarted": 5
      }
    },
    "recommendations": {
      "priorityTopics": [],
      "suggestions": []
    },
    "metadata": {
      "generatedAt": "2026-03-06T10:00:00Z",
      "courseId": "uuid",
      "format": "json"
    }
  }
}
```

---

### 5.3 获取同步状态

**接口**: `GET /api/sync/status`

**功能**: 获取数据同步状态

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "lastSyncAt": "2026-03-06T10:00:00Z",
    "syncStatus": "synced",
    "pendingChanges": 0,
    "devices": [
      {
        "deviceId": "default-device",
        "deviceName": "当前设备",
        "lastActive": "2026-03-06T10:00:00Z",
        "platform": "web"
      }
    ],
    "syncSettings": {
      "autoSync": true,
      "syncInterval": 60,
      "lastSuccessfulSync": "2026-03-06T10:00:00Z"
    }
  }
}
```

---

### 5.4 触发同步

**接口**: `POST /api/sync/trigger`

**功能**: 手动触发数据同步

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "force": false   // 是否强制同步
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "syncId": "sync_1234567890",
    "status": "completed",
    "startedAt": "2026-03-06T10:00:00Z",
    "completedAt": "2026-03-06T10:00:01Z",
    "stats": {
      "courses": 5,
      "chapters": 20,
      "knowledgePoints": 100,
      "studyRecords": 50,
      "mistakes": 25,
      "timeMarks": 200
    },
    "changes": {
      "uploaded": 75,
      "downloaded": 0,
      "conflicts": 0
    },
    "message": "同步完成"
  }
}
```

---

### 5.5 导入数据

**接口**: `POST /api/import/data`

**功能**: 从 JSON 数据导入学习记录

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "format": "json",
  "mergeStrategy": "merge | replace",   // 合并策略
  "data": {
    "courses": [],
    "chapters": [],
    "knowledgePoints": [],
    "studyRecords": [],
    "mistakes": []
  }
}
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "imported": {
      "courses": 2,
      "chapters": 5,
      "knowledgePoints": 20,
      "studyRecords": 10,
      "mistakes": 5
    },
    "skipped": {
      "courses": 0,
      "chapters": 0,
      "knowledgePoints": 0,
      "studyRecords": 0,
      "mistakes": 0
    },
    "errors": []
  }
}
```

---

## 六、P5.5 用户偏好设置

### 6.1 获取用户设置

**接口**: `GET /api/settings`

**功能**: 获取当前用户的偏好设置

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "learning": {
      "dailyGoal": 60,
      "weeklyGoal": 300,
      "targetGrade": "B",
      "examDate": null
    },
    "notifications": {
      "studyReminder": true,
      "reviewReminder": true,
      "examReminder": true,
      "reminderTime": "09:00"
    },
    "ai": {
      "autoExplain": true,
      "autoSuggest": true,
      "difficulty": "medium"
    },
    "display": {
      "theme": "light",
      "language": "zh-CN"
    }
  }
}
```

---

### 6.2 更新用户设置

**接口**: `PUT /api/settings`

**功能**: 更新用户偏好设置

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体** (所有字段可选):
```json
{
  "displayName": "string",
  "learning": {
    "dailyGoal": 90,
    "weeklyGoal": 450,
    "targetGrade": "A",
    "examDate": "2026-06-15"
  },
  "notifications": {
    "studyReminder": false,
    "reviewReminder": true,
    "examReminder": true,
    "reminderTime": "08:00"
  },
  "ai": {
    "autoExplain": true,
    "autoSuggest": false,
    "difficulty": "hard"
  },
  "display": {
    "theme": "dark",
    "language": "zh-CN"
  }
}
```

**字段说明**:

| 字段 | 类型 | 范围 | 说明 |
|------|------|------|------|
| learning.dailyGoal | number | 0-720 | 每日学习目标(分钟) |
| learning.weeklyGoal | number | 0-5040 | 每周学习目标(分钟) |
| learning.targetGrade | string | S/A/B/C | 目标等级 |
| learning.examDate | string | ISO8601 | 考试日期 |
| notifications.studyReminder | boolean | - | 学习提醒 |
| notifications.reviewReminder | boolean | - | 复习提醒 |
| notifications.examReminder | boolean | - | 考试提醒 |
| notifications.reminderTime | string | HH:mm | 提醒时间 |
| ai.autoExplain | boolean | - | 自动解释 |
| ai.autoSuggest | boolean | - | 自动建议 |
| ai.difficulty | string | easy/medium/hard | AI 难度 |
| display.theme | string | light/dark/auto | 主题 |
| display.language | string | zh-CN/en | 语言 |

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "userId": "uuid",
    "username": "string",
    "email": "string",
    "displayName": "string",
    "learning": {
      "dailyGoal": 90,
      "weeklyGoal": 450,
      "targetGrade": "A",
      "examDate": "2026-06-15"
    },
    "notifications": {
      "studyReminder": false,
      "reviewReminder": true,
      "examReminder": true,
      "reminderTime": "08:00"
    },
    "ai": {
      "autoExplain": true,
      "autoSuggest": false,
      "difficulty": "hard"
    },
    "display": {
      "theme": "dark",
      "language": "zh-CN"
    }
  }
}
```

---

### 6.3 获取默认设置

**接口**: `GET /api/settings/default`

**功能**: 获取系统默认偏好设置

**请求头**: 无需认证

**响应 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "learning": {
      "dailyGoal": 60,
      "weeklyGoal": 300,
      "targetGrade": "B",
      "examDate": null
    },
    "notifications": {
      "studyReminder": true,
      "reviewReminder": true,
      "examReminder": true,
      "reminderTime": "09:00"
    },
    "ai": {
      "autoExplain": true,
      "autoSuggest": true,
      "difficulty": "medium"
    },
    "display": {
      "theme": "light",
      "language": "zh-CN"
    }
  }
}
```

---

## 七、通用错误码汇总

| 错误码 | 说明 |
|--------|------|
| NOT_AUTHENTICATED | 未登录或登录已过期 |
| FORBIDDEN | 权限不足 |
| USER_NOT_FOUND | 用户不存在 |
| USERNAME_EXISTS | 用户名已存在 |
| EMAIL_EXISTS | 邮箱已被注册 |
| INVALID_CREDENTIALS | 邮箱或密码错误 |
| INCORRECT_PASSWORD | 当前密码错误 |
| COURSE_NOT_FOUND | 课程不存在 |
| KNOWLEDGE_POINT_NOT_FOUND | 知识点不存在 |
| REMINDER_NOT_FOUND | 提醒不存在 |
| INVALID_SCHEDULED_TIME | 提醒时间必须是未来时间 |
| REMINDER_ALREADY_COMPLETED | 该提醒已完成或已取消 |
| EXPORT_DATA_FAILED | 导出数据失败 |
| EXPORT_REPORT_FAILED | 导出报告失败 |
| GET_SETTINGS_FAILED | 获取设置失败 |
| UPDATE_SETTINGS_FAILED | 更新设置失败 |

---

## 八、认证流程

### 8.1 JWT Token 验证

所有需要认证的接口都需要在请求头中携带 JWT Token：

```
Authorization: Bearer <jwt_token>
```

Token 包含以下信息：
```json
{
  "userId": "uuid",
  "username": "string",
  "role": "USER | ADMIN",
  "iat": 1234567890,
  "exp": 1234567890
}
```

Token 有效期：7天

### 8.2 角色权限

| 角色 | 权限 |
|------|------|
| USER | 普通用户，可访问自己的数据 |
| ADMIN | 管理员，可访问所有用户数据 |

---

## 九、版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.0 | 2026-03-06 | 初始版本 |

---

**文档结束**
