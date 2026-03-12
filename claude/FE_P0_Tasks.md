# LumiTrace AI - 前端 P0 核心任务拆解文档

> **文档版本**：v1.0.0
> **创建日期**：2026-03-04
> **项目背景**：全维伴随式采集（数据录入）+ 时光机回溯（数据消费）

---

## 一、全局规范与准备

### 1.1 API 请求封装

**目标**：统一处理后端的标准错误响应和 HTTP 状态码

```typescript
// src/api/request.ts

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: ValidationError[]
}

interface ValidationError {
  field: string
  message: string
}

// 全局配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
        }
      }

      return data
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Network error',
      }
    }
  }

  get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  postFormData<T>(endpoint: string, formData: FormData): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: formData,
    })
  }

  put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  patch<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const api = new ApiClient(API_BASE_URL)
export default api
```

### 1.2 状态管理策略

**推荐方案**：React Context + useReducer（轻量级）

| 场景 | 方案 | 说明 |
|------|------|------|
| 全局用户态 | Context | 用户登录信息、应用全局配置 |
| 页面级数据 | useState + useEffect | 单页数据获取与缓存 |
| 复杂交互态 | useReducer | 多步骤表单、播放器状态 |

### 1.3 TypeScript 类型定义同步方案

```typescript
// src/types/api.ts

// ========== 通用响应类型 ==========
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  details?: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
}

// ========== 分页类型 ==========
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PaginationParams {
  page?: number
  pageSize?: number
}

// ========== 文件上传类型 ==========
export interface UploadedFile {
  filename: string
  originalName: string
  size: number
  mimetype: string
  url: string
}
```

---

## 二、模块与页面映射

### 2.1 前端页面结构

| 页面文件 | 核心功能 | 对接后端模块 |
|---------|---------|-------------|
| `App.jsx` (时光机) | 音画笔同步回放、AI增强面板 | Task-2.1.x (回溯数据) |
| `ReviewPage.jsx` (复习页) | 知识点导航、进度控制 | Task-1.2.x (学习记录) |
| `PlannerPage.jsx` (备考计划) | 任务清单、智能重排 | Task-2.3.x (智能检索) |
| `KnowledgeGraph.jsx` (知识图谱) | 知识点可视化 | Task-1.1.x (知识点) |
| `ProfilePage.jsx` (个人中心) | 用户信息、设置 | 待扩展 |

### 2.2 前后端模块映射表

| 前端模块 | 后端 API 模块 | 页面组件 |
|---------|--------------|---------|
| **数据录入** | Phase 1.1 (章节/知识点) | KnowledgeGraph, 章节选择器 |
| **数据录入** | Phase 1.2 (学习记录) | ReviewPage, 创建记录表单 |
| **数据录入** | Phase 1.3 (文件上传) | 文件上传组件 |
| **数据消费** | Phase 2.1 (回溯数据) | App.jsx (时光机) |
| **数据消费** | Phase 2.2 (笔记关联) | 笔记编辑组件 |
| **数据消费** | Phase 2.3 (智能检索) | PlannerPage |

---

## 三、前端任务拆解详情

### Phase FE-1: 基础架构（API 层）

| 任务ID | 名称 | 依赖API | 涉及组件 | 核心逻辑 |
|-------|------|--------|---------|---------|
| **Task-FE-1.0.1** | API 请求封装 | - | `src/api/request.ts` | 封装 fetch、错误处理、统一响应格式 |
| **Task-FE-1.0.2** | 类型定义同步 | 后端 types | `src/types/api.ts` | 创建 ApiResponse、Models 类型 |
| **Task-FE-1.0.3** | 环境变量配置 | - | `.env` | VITE_API_BASE_URL 配置 |

---

### Phase FE-2: 全维伴随式采集（数据录入）

#### 2.1 章节与知识点管理

| 任务ID | 名称 | 依赖后端API | 涉及组件 | 核心逻辑 |
|-------|------|------------|---------|---------|
| **Task-FE-1.1.1** | 章节 CRUD 页面 | Task-1.1.1~1.1.5 | `ChapterList`, `ChapterForm` | 列表展示、创建、编辑、删除、Loading 态 |
| **Task-FE-1.1.2** | 知识点管理页面 | Task-1.1.6~1.1.12 | `KnowledgeList`, `KnowledgeForm` | 知识点列表、掌握度更新、薄弱点筛选 |
| **Task-FE-1.1.3** | 知识点批量操作 | Task-1.4.1, 1.4.3 | `BatchImportModal` | 批量导入、状态批量更新 |

#### 2.2 学习记录与时间锚点

| 任务ID | 名称 | 依赖后端API | 涉及组件 | 核心逻辑 |
|-------|------|------------|---------|---------|
| **Task-FE-1.2.1** | 创建学习记录 | Task-1.2.1 | `RecordCreateForm` | 表单验证、音频/图片上传、关联章节 |
| **Task-FE-1.2.2** | 学习记录列表 | Task-1.2.2 | `RecordList` | 列表展示、筛选（按课程/日期）、分页 |
| **Task-FE-1.2.3** | 复习页面绑定 | Task-1.2.3~1.2.5 | `ReviewPage` | 详情展示、笔记编辑、删除确认 |
| **Task-FE-1.2.4** | 时间标记交互 | Task-1.2.6~1.2.10 | `TimeMarker` | 添加标记、编辑标记、快速标记重点、Toast 提示 |

#### 2.3 文件上传组件

| 任务ID | 名称 | 依赖后端API | 涉及组件 | 核心逻辑 |
|-------|------|------------|---------|---------|
| **Task-FE-1.3.1** | 音频上传组件 | Task-1.3.1 | `AudioUploader` | 文件选择、格式校验、进度条、上传成功回调 |
| **Task-FE-1.3.2** | 图片上传组件 | Task-1.3.2 | `ImageUploader` | 图片预览、压缩（可选）、上传回调 |
| **Task-FE-1.3.3** | 文档上传组件 | Task-1.3.3 | `DocumentUploader` | PDF/Word/PPT 支持、上传回调 |
| **Task-FE-1.3.4** | 文件管理组件 | Task-1.3.4, 1.3.5 | `FileManager` | 文件列表、删除操作、URL 获取 |

---

### Phase FE-3: 时光机回溯（数据消费）

#### 3.1 回溯核心功能

| 任务ID | 名称 | 依赖后端API | 涉及组件 | 核心逻辑 |
|-------|------|------------|---------|---------|
| **Task-FE-2.1.1** | 时光机播放器 | Task-2.1.1 | `App.jsx` | 加载回溯数据、音频播放、时间轴同步、PPT 切换 |
| **Task-FE-2.1.2** | 时间轴组件 | Task-2.1.2 | `Timeline` | 可视化时间轴、标记点交互、拖拽定位 |
| **Task-FE-2.1.3** | 笔记索引展示 | Task-2.1.3 | `NoteIndex` | 笔记按时间戳列表、点击跳转 |
| **Task-FE-2.1.4** | 重点标记导航 | Task-2.1.4 | `EmphasisNavigator` | 重点标记列表、一键跳转 |

#### 3.2 AI 增强面板

| 任务ID | 名称 | 依赖后端API | 涉及组件 | 核心逻辑 |
|-------|------|------------|---------|---------|
| **Task-FE-2.2.1** | AI 增强面板 | Task-2.2.1~2.2.3 | `AIPanel` (App.jsx 内) | 知识点关联展示、外部资源推荐 |
| **Task-FE-2.2.2** | 笔记时间戳编辑 | Task-2.2.1 | `TimestampNoteEditor` | 添加/编辑带时间戳的笔记 |

#### 3.3 智能检索与推荐

| 任务ID | 名称 | 依赖后端API | 涉及组件 | 核心逻辑 |
|-------|------|------------|---------|---------|
| **Task-FE-2.3.1** | 时间范围搜索 | Task-2.3.1 | `RecordSearch` | 日期范围选择、搜索结果展示 |
| **Task-FE-2.3.2** | 相关标记导航 | Task-2.3.2 | `RelatedMarks` | 当前时间点 ±N 秒标记展示 |
| **Task-FE-2.3.3** | 复习建议卡片 | Task-2.3.3 | `ReviewSuggestions` (PlannerPage) | 最近复习知识点、复习提醒 |

---

## 四、任务执行细节示例

### Task-FE-2.1.1 时光机播放器 - 详细规格

```typescript
// 依赖的后端 API
// - GET /api/study-records/:id/playback (Task-2.1.1)
// - GET /api/study-records/:id/timeline (Task-2.1.2)

// 涉及组件
// - AudioPlayer: 音频播放控制
// - SlideViewer: PPT/图片展示
// - TranscriptView: 逐字稿同步
// - TimelineBar: 底部时间轴

// 核心交互逻辑
// 1. 组件挂载时：showLoading() → 调用 playback API → 初始化播放器状态
// 2. 播放/暂停：togglePlay() → 更新 currentTime → 同步 PPT/Transcript
// 3. 进度拖拽：onSeek(time) → 更新 currentTime → 跳转对应 PPT 页
// 4. 错误处理：API 失败时显示 ErrorToast，提供重试按钮
```

### Task-FE-1.2.1 创建学习记录 - 表单验证

```typescript
// 依赖的后端 API
// - POST /api/study-records (Task-1.2.1)
// - POST /api/upload/audio (Task-1.3.1)

// 表单字段验证规则
const validationRules = {
  title: { required: true, maxLength: 100 },
  courseId: { required: true },
  chapterId: { required: true },
  audioFile: { required: true, allowedTypes: ['audio/mpeg', 'audio/wav', 'audio/m4a'] },
  duration: { required: true, min: 1 },
}

// 交互逻辑
// 1. 提交前：validateForm() → 显示字段级错误
// 2. 提交中：setSubmitting(true) → 禁用按钮 → 显示 Loading
// 3. 提交成功：onSuccess(data) → Toast 成功提示 → 跳转列表页
// 4. 提交失败：setSubmitting(false) → 显示 ErrorToast
```

---

## 五、依赖关系图

```
Task-FE-1.0.1 (API 封装)
    │
    ├─→ Task-FE-1.0.2 (类型定义)
    │       │
    │       ├─→ Task-FE-1.1.x (章节知识点)
    │       │       │
    │       │       └─→ Task-FE-1.3.x (文件上传)
    │       │
    │       └─→ Task-FE-1.2.x (学习记录)
    │               │
    │               └─→ Task-FE-1.2.4 (时间标记)
    │
    └─→ Task-FE-2.1.x (时光机回溯)
            │
            ├─→ Task-FE-2.1.2 (时间轴)
            ├─→ Task-FE-2.1.3 (笔记索引)
            └─→ Task-FE-2.1.4 (重点标记)
                    │
                    └─→ Task-FE-2.2.x (AI 增强)
                            │
                            └─→ Task-FE-2.3.x (智能检索)
```

---

## 六、协作规则

1. **任务执行**：每次收到 `Task-FE-X.X.X` 指令后，直接输出完整代码
2. **代码规范**：
   - 必须包含 TypeScript 类型定义
   - 必须包含 try-catch 错误处理
   - 必须包含 Loading 状态和 Toast 提示
3. **响应格式**：
   - 成功：显示成功 Toast
   - 失败：显示错误 Toast（包含后端返回的 error 信息）
4. **组件要求**：
   - 使用 `api.get/post/put/delete` 方法
   - 使用 `useState` 管理 loading/error 状态
   - 使用 `useEffect` 处理副作用数据获取

---

## 七、任务清单汇总

| Phase | 任务数 | 核心功能 |
|-------|-------|---------|
| FE-1 基础架构 | 3 | API封装、类型定义、环境配置 |
| FE-2 数据录入 | 10 | 章节/知识点、学习记录、文件上传 |
| FE-3 数据消费 | 9 | 时光机、AI增强、智能检索 |
| **合计** | **22** | 完整前后端对接 |

---

## 八、详细任务 ID 列表

### Phase FE-1: 基础架构（API 层）

| 任务ID | 任务名称 | 文件路径 |
|--------|---------|---------|
| Task-FE-1.0.1 | API 请求封装 | `src/api/request.ts` |
| Task-FE-1.0.2 | 类型定义同步 | `src/types/api.ts` |
| Task-FE-1.0.3 | 环境变量配置 | `.env` |

### Phase FE-2: 全维伴随式采集（数据录入）

#### 章节与知识点管理

| 任务ID | 任务名称 | 文件路径 |
|--------|---------|---------|
| Task-FE-1.1.1 | 章节 CRUD 页面 | `src/components/ChapterList.tsx`, `src/components/ChapterForm.tsx` |
| Task-FE-1.1.2 | 知识点管理页面 | `src/components/KnowledgeList.tsx`, `src/components/KnowledgeForm.tsx` |
| Task-FE-1.1.3 | 知识点批量操作 | `src/components/BatchImportModal.tsx` |

#### 学习记录与时间锚点

| 任务ID | 任务名称 | 文件路径 |
|--------|---------|---------|
| Task-FE-1.2.1 | 创建学习记录 | `src/components/RecordCreateForm.tsx` |
| Task-FE-1.2.2 | 学习记录列表 | `src/components/RecordList.tsx` |
| Task-FE-1.2.3 | 复习页面绑定 | `src/ReviewPage.jsx` |
| Task-FE-1.2.4 | 时间标记交互 | `src/components/TimeMarker.tsx` |

#### 文件上传组件

| 任务ID | 任务名称 | 文件路径 |
|--------|---------|---------|
| Task-FE-1.3.1 | 音频上传组件 | `src/components/AudioUploader.tsx` |
| Task-FE-1.3.2 | 图片上传组件 | `src/components/ImageUploader.tsx` |
| Task-FE-1.3.3 | 文档上传组件 | `src/components/DocumentUploader.tsx` |
| Task-FE-1.3.4 | 文件管理组件 | `src/components/FileManager.tsx` |

### Phase FE-3: 时光机回溯（数据消费）

#### 回溯核心功能

| 任务ID | 任务名称 | 文件路径 |
|--------|---------|---------|
| Task-FE-2.1.1 | 时光机播放器 | `src/App.jsx` |
| Task-FE-2.1.2 | 时间轴组件 | `src/components/Timeline.tsx` |
| Task-FE-2.1.3 | 笔记索引展示 | `src/components/NoteIndex.tsx` |
| Task-FE-2.1.4 | 重点标记导航 | `src/components/EmphasisNavigator.tsx` |

#### AI 增强面板

| 任务ID | 任务名称 | 文件路径 |
|--------|---------|---------|
| Task-FE-2.2.1 | AI 增强面板 | `src/components/AIPanel.tsx` |
| Task-FE-2.2.2 | 笔记时间戳编辑 | `src/components/TimestampNoteEditor.tsx` |

#### 智能检索与推荐

| 任务ID | 任务名称 | 文件路径 |
|--------|---------|---------|
| Task-FE-2.3.1 | 时间范围搜索 | `src/components/RecordSearch.tsx` |
| Task-FE-2.3.2 | 相关标记导航 | `src/components/RelatedMarks.tsx` |
| Task-FE-2.3.3 | 复习建议卡片 | `src/components/ReviewSuggestions.tsx` |

---

**文档版本**：v1.0.0
**创建日期**：2026-03-04
