# LumiTrace AI - 后端 API 接口文档

> 文档版本：v1.7.0
> 最后更新：2026-03-04

---

## 目录

- [1. 文件上传模块](#1-文件上传模块)
  - [1.1 上传音频文件 (Task-1.3.1)](#11-上传音频文件-task-131)
  - [1.2 上传图片文件 (Task-1.3.2)](#12-上传图片文件-task-132)
  - [1.3 上传文档文件 (Task-1.3.3)](#13-上传文档文件-task-133)
  - [1.4 删除文件 (Task-1.3.4)](#14-删除文件-task-134)
  - [1.5 获取文件信息 (Task-1.3.5)](#15-获取文件信息-task-135)
- [2. 章节模块](#2-章节模块)
  - [2.1 创建章节 (Task-1.1.1)](#21-创建章节-task-111)
  - [2.2 获取章节列表 (Task-1.1.2)](#22-获取章节列表-task-112)
  - [2.3 获取章节详情 (Task-1.1.3)](#23-获取章节详情-task-113)
  - [2.4 更新章节 (Task-1.1.4)](#24-更新章节-task-114)
  - [2.5 删除章节 (Task-1.1.5)](#25-删除章节-task-115)
- [3. 知识点模块](#3-知识模块)
  - [3.1 创建知识点 (Task-1.1.6)](#31-创建知识点-task-116)
  - [3.2 获取知识点列表 (Task-1.1.7)](#32-获取知识点列表-task-117)
  - [3.3 获取知识点详情 (Task-1.1.8)](#33-获取知识点详情-task-118)
  - [3.4 更新知识点 (Task-1.1.9)](#34-更新知识点-task-119)
  - [3.5 更新知识点掌握度 (Task-1.1.11)](#35-更新知识点掌握度-task-1111)
  - [3.6 删除知识点 (Task-1.1.10)](#36-删除知识点-task-1110)
  - [3.7 获取薄弱点列表 (Task-1.1.12)](#37-获取薄弱点列表-task-1112)
  - [3.8 获取知识点的时间分布 (Task-2.2.2)](#38-获取知识点的时间分布-task-222)
- [4. 学习记录模块](#4-学习记录模块)
  - [4.1 创建学习记录 (Task-1.2.1)](#41-创建学习记录-task-121)
  - [4.2 获取学习记录列表 (Task-1.2.2)](#42-获取学习记录列表-task-122)
  - [4.3 获取学习记录详情 (Task-1.2.3)](#43-获取学习记录详情-task-123)
  - [4.4 更新学习记录 (Task-1.2.4)](#44-更新学习记录-task-124)
  - [4.5 删除学习记录 (Task-1.2.5)](#45-删除学习记录-task-125)
  - [4.6 添加时间标记 (Task-1.2.6)](#46-添加时间标记-task-126)
  - [4.7 获取所有时间标记 (Task-1.2.7)](#47-获取所有时间标记-task-127)
  - [4.8 更新时间标记 (Task-1.2.8)](#48-更新时间标记-task-128)
  - [4.9 删除时间标记 (Task-1.2.9)](#49-删除时间标记-task-129)
  - [4.10 快速标记重点 (Task-1.2.10)](#410-快速标记重点-task-1210)
  - [4.11 添加带时间戳的笔记 (Task-2.2.1)](#411-添加带时间戳的笔记-task-221)

---

# 1. 文件上传模块

## 基础信息

| 配置项 | 值 |
|--------|-----|
| 基础路径 | `/api/upload` |
| 上传目录 | `./uploads` |
| 默认文件大小限制 | 10MB |
| 文档大小限制 | 50MB |

---

## 1.1 上传音频文件 (Task-1.3.1)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `POST /api/upload/audio` |
| **Content-Type** | `multipart/form-data` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `audio` | File | 是 | 音频文件 |

### 支持的音频格式

| MIME 类型 | 扩展名 |
|-----------|--------|
| `audio/mpeg` | .mp3 |
| `audio/wav` | .wav |
| `audio/m4a` | .m4a |
| `audio/x-m4a` | .m4a |
| `audio/mp3` | .mp3 |

### 请求示例

#### cURL
```bash
curl -X POST http://localhost:3000/api/upload/audio \
  -F "audio=@/path/to/lecture.mp3"
```

#### JavaScript (Fetch)
```javascript
const formData = new FormData()
formData.append('audio', audioFile)

const response = await fetch('http://localhost:3000/api/upload/audio', {
  method: 'POST',
  body: formData
})

const result = await response.json()
console.log(result)
```

#### React Example
```tsx
import { useRef, useState } from 'react'

const AudioUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', file)

      const res = await fetch('http://localhost:3000/api/upload/audio', {
        method: 'POST',
        body: formData
      })

      const result = await res.json()
      if (result.success) {
        setAudioUrl(`http://localhost:3000${result.data.url}`)
        console.log('上传成功:', result.data)
      } else {
        console.error('上传失败:', result.error)
      }
    } catch (error) {
      console.error('上传出错:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>上传中...</p>}
      {audioUrl && <audio src={audioUrl} controls />}
    </div>
  )
}

export default AudioUpload
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "filename": "audio-1740875512345-123456789.mp3",
    "originalName": "lecture.mp3",
    "size": 5242880,
    "mimetype": "audio/mpeg",
    "url": "/uploads/audio-1740875512345-123456789.mp3"
  }
}
```

#### 错误响应
```json
{
  "success": false,
  "error": "未上传文件"
}
```

#### 文件大小超限
```json
{
  "success": false,
  "error": "文件大小超过限制（最大 10MB）"
}
```

#### 不支持的文件类型
```json
{
  "success": false,
  "error": "不支持的文件类型: audio/ogg"
}
```

---

## 1.2 上传图片文件 (Task-1.3.2)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `POST /api/upload/image` |
| **Content-Type** | `multipart/form-data` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `image` | File | 是 | 图片文件 |

### 支持的图片格式

| MIME 类型 | 扩展名 |
|-----------|--------|
| `image/jpeg` | .jpg, .jpeg |
| `image/png` | .png |
| `image/gif` | .gif |
| `image/webp` | .webp |
| `image/svg+xml` | .svg |

### 请求示例

#### cURL
```bash
curl -X POST http://localhost:3000/api/upload/image \
  -F "image=@/path/to/board-photo.jpg"
```

#### JavaScript (Fetch)
```javascript
const formData = new FormData()
formData.append('image', imageFile)

const response = await fetch('http://localhost:3000/api/upload/image', {
  method: 'POST',
  body: formData
})

const result = await response.json()
```

#### React Example (上传板书照片)
```tsx
import { useRef, useState } from 'react'

const BoardPhotoUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('http://localhost:3000/api/upload/image', {
        method: 'POST',
        body: formData
      })

      const result = await res.json()
      if (result.success) {
        setImageUrl(`http://localhost:3000${result.data.url}`)
      }
    } catch (error) {
      console.error('上传出错:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>上传中...</p>}
      {imageUrl && <img src={imageUrl} alt="板书照片" style={{ maxWidth: '100%' }} />}
    </div>
  )
}

export default BoardPhotoUpload
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "filename": "image-1740875512345-987654321.jpg",
    "originalName": "board-photo.jpg",
    "size": 1024000,
    "mimetype": "image/jpeg",
    "url": "/uploads/image-1740875512345-987654321.jpg"
  }
}
```

---

## 1.3 上传文档文件 (Task-1.3.3)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `POST /api/upload/document` |
| **Content-Type** | `multipart/form-data` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `document` | File | 是 | 文档文件 |

### 支持的文档格式

| MIME 类型 | 扩展名 |
|-----------|--------|
| `application/pdf` | .pdf |
| `application/msword` | .doc |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | .docx |
| `application/vnd.ms-powerpoint` | .ppt |
| `application/vnd.openxmlformats-officedocument.presentationml.presentation` | .pptx |

> **注意**: 文档文件大小限制为 50MB

### 请求示例

#### cURL
```bash
curl -X POST http://localhost:3000/api/upload/document \
  -F "document=@/path/to/lecture-ppt.pptx"
```

#### JavaScript (Fetch)
```javascript
const formData = new FormData()
formData.append('document', documentFile)

const response = await fetch('http://localhost:3000/api/upload/document', {
  method: 'POST',
  body: formData
})

const result = await response.json()
```

#### React Example (上传 PPT)
```tsx
import { useRef, useState } from 'react'

const PPTUpload = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [documentUrl, setDocumentUrl] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('document', file)

      const res = await fetch('http://localhost:3000/api/upload/document', {
        method: 'POST',
        body: formData
      })

      const result = await res.json()
      if (result.success) {
        setDocumentUrl(`http://localhost:3000${result.data.url}`)
        // 这里可以调用创建 StudyRecord 的 API
      }
    } catch (error) {
      console.error('上传出错:', error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx"
        onChange={handleUpload}
        disabled={uploading}
      />
      {uploading && <p>上传中...</p>}
      {documentUrl && (
        <a href={documentUrl} target="_blank" rel="noopener noreferrer">
          查看上传的文档
        </a>
      )}
    </div>
  )
}

export default PPTUpload
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "filename": "document-1740875512345-555666777.pptx",
    "originalName": "lecture-ppt.pptx",
    "size": 20971520,
    "mimetype": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "url": "/uploads/document-1740875512345-555666777.pptx"
  }
}
```

---

## 1.4 删除文件 (Task-1.3.4)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `DELETE /api/upload/:filename` |
| **是否需要认证** | 否 |

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `filename` | String | 是 | 文件名 |

### 请求示例

#### cURL
```bash
curl -X DELETE http://localhost:3000/api/upload/audio-1740875512345-123456789.mp3
```

#### JavaScript (Fetch)
```javascript
const filename = 'audio-1740875512345-123456789.mp3'

const response = await fetch(`http://localhost:3000/api/upload/${filename}`, {
  method: 'DELETE'
})

const result = await response.json()
```

#### React Example
```tsx
const DeleteFileButton = ({ filename, onDelete }: { filename: string; onDelete: () => void }) => {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('确定要删除这个文件吗？')) return

    setDeleting(true)
    try {
      const res = await fetch(`http://localhost:3000/api/upload/${filename}`, {
        method: 'DELETE'
      })

      const result = await res.json()
      if (result.success) {
        onDelete()
        alert('文件删除成功')
      } else {
        alert(`删除失败: ${result.error}`)
      }
    } catch (error) {
      console.error('删除出错:', error)
      alert('删除出错')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={deleting}>
      {deleting ? '删除中...' : '删除文件'}
    </button>
  )
}

export default DeleteFileButton
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

#### 文件不存在
```json
{
  "success": false,
  "error": "文件不存在"
}
```

#### 无效文件名（路径遍历攻击）
```json
{
  "success": false,
  "error": "无效的文件名"
}
```

---

## 1.5 获取文件信息 (Task-1.3.5)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `GET /api/upload/info/:filename` |
| **是否需要认证** | 否 |

### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `filename` | String | 是 | 文件名 |

### 请求示例

#### cURL
```bash
curl http://localhost:3000/api/upload/info/audio-1740875512345-123456789.mp3
```

#### JavaScript (Fetch)
```javascript
const filename = 'audio-1740875512345-123456789.mp3'

const response = await fetch(`http://localhost:3000/api/upload/info/${filename}`)
const result = await response.json()
```

#### React Example
```tsx
import { useEffect, useState } from 'react'

interface FileInfo {
  filename: string
  url: string
  size: number
  sizeFormatted: string
  created: string
  modified: string
}

const FileInfo = ({ filename }: { filename: string }) => {
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null)

  useEffect(() => {
    fetch(`http://localhost:3000/api/upload/info/${filename}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setFileInfo(result.data)
        }
      })
  }, [filename])

  if (!fileInfo) return <p>加载中...</p>

  return (
    <div className="file-info">
      <p><strong>文件名:</strong> {fileInfo.originalName}</p>
      <p><strong>大小:</strong> {fileInfo.sizeFormatted}</p>
      <p><strong>上传时间:</strong> {new Date(fileInfo.created).toLocaleString()}</p>
      <p><strong>修改时间:</strong> {new Date(fileInfo.modified).toLocaleString()}</p>
    </div>
  )
}

export default FileInfo
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "filename": "audio-1740875512345-123456789.mp3",
    "url": "/uploads/audio-1740875512345-123456789.mp3",
    "size": 5242880,
    "sizeFormatted": "5.00 MB",
    "created": "2026-03-02T08:00:00.000Z",
    "modified": "2026-03-02T08:00:00.000Z"
  }
}
```

#### 文件不存在
```json
{
  "success": false,
  "error": "文件不存在"
}
```

---

# 2. 章节模块

## 基础信息

| 配置项 | 值 |
|--------|-----|
| 基础路径 | `/api/chapters` |
| 数据模型 | Chapter |

---

## 2.1 创建章节 (Task-1.1.1)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `POST /api/chapters` |
| **Content-Type** | `application/json` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `courseId` | String (UUID) | 是 | 所属课程ID |
| `name` | String | 是 | 章节名称 |
| `order` | Number | 是 | 排序序号（从1开始） |

### 请求示例

#### cURL
```bash
curl -X POST http://localhost:3000/api/chapters \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "第一章：函数基础",
    "order": 1
  }'
```

#### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/api/chapters', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    courseId: '550e8400-e29b-41d4-a716-446655440000',
    name: '第一章：函数基础',
    order: 1
  })
})

const result = await response.json()
console.log(result)
```

#### React Example
```tsx
import { useState } from 'react'

const CreateChapterForm = ({ courseId }: { courseId: string }) => {
  const [name, setName] = useState('')
  const [order, setOrder] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('请输入章节名称')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('http://localhost:3000/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          name,
          order
        })
      })

      const result = await res.json()
      if (result.success) {
        alert('章节创建成功！')
        console.log('创建的章节:', result.data)
        // 清空表单或跳转
        setName('')
        setOrder(prev => prev + 1)
      } else {
        setError(result.error || '创建失败')
      }
    } catch (err) {
      console.error('创建出错:', err)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>章节名称：</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="如：第一章：函数基础"
          required
        />
      </div>
      <div>
        <label>排序：</label>
        <input
          type="number"
          min="1"
          value={order}
          onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
          required
        />
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? '创建中...' : '创建章节'}
      </button>
    </form>
  )
}

export default CreateChapterForm
```

### 响应格式

#### 成功响应 (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "courseId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "第一章：函数基础",
    "order": 1,
    "createdAt": "2026-03-02T10:00:00.000Z",
    "course": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "高等数学"
    }
  }
}
```

#### 验证失败
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "courseId",
      "message": "Valid courseId is required"
    }
  ]
}
```

#### 课程不存在 (404)
```json
{
  "success": false,
  "error": "Course not found"
}
```

#### 排序序号冲突 (400)
```json
{
  "success": false,
  "error": "Chapter with order 1 already exists in this course"
}
```

### 业务规则

1. **唯一约束**：同一课程下，`order` 值必须唯一
2. **外键约束**：`courseId` 必须是已存在的课程 ID
3. **排序序号**：必须是正整数（≥ 1）

### 错误码说明

| 错误码 | 说明 |
|--------|------|
| P2002 | 唯一约束冲突（order 重复）|
| P2003 | 外键约束失败（courseId 不存在）|

---

# 3. 知识点模块

## 基础信息

| 配置项 | 值 |
|--------|-----|
| 基础路径 | `/api/knowledge-points` |
| 数据模型 | KnowledgePoint |

---

## 3.1 创建知识点 (Task-1.1.6)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `POST /api/knowledge-points` |
| **Content-Type** | `application/json` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `chapterId` | String (UUID) | 是 | 所属章节ID |
| `name` | String | 是 | 知识点名称 |
| `status` | String | 否 | 状态：MASTERED/WEAK/NEED_REVIEW/TODAY_REVIEW，默认 NEED_REVIEW |
| `importance` | Number | 否 | 重要性 1-10，默认 5 |

### 请求示例

#### cURL
```bash
curl -X POST http://localhost:3000/api/knowledge-points \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "函数定义",
    "status": "NEED_REVIEW",
    "importance": 8
  }'
```

#### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/api/knowledge-points', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chapterId: '550e8400-e29b-41d4-a716-446655440001',
    name: '函数定义',
    status: 'NEED_REVIEW',
    importance: 8
  })
})

const result = await response.json()
```

#### React Example
```tsx
import { useState } from 'react'

const CreateKnowledgePointForm = ({ chapterId }: { chapterId: string }) => {
  const [name, setName] = useState('')
  const [importance, setImportance] = useState(5)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/api/knowledge-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          name,
          importance
        })
      })

      const result = await res.json()
      if (result.success) {
        alert('知识点创建成功！')
        setName('')
        setImportance(5)
      }
    } catch (err) {
      console.error('创建出错:', err)
      alert('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>知识点名称：</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>重要性 (1-10)：</label>
        <input
          type="number"
          min="1"
          max="10"
          value={importance}
          onChange={(e) => setImportance(parseInt(e.target.value) || 5)}
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? '创建中...' : '创建知识点'}
      </button>
    </form>
  )
}

export default CreateKnowledgePointForm
```

### 响应格式

#### 成功响应 (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "chapterId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "函数定义",
    "status": "NEED_REVIEW",
    "importance": 8,
    "masteryScore": 0,
    "createdAt": "2026-03-02T10:00:00.000Z",
    "updatedAt": "2026-03-02T10:00:00.000Z",
    "chapter": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "第一章：函数基础"
    }
  }
}
```

#### 章节不存在 (404)
```json
{
  "success": false,
  "error": "Chapter not found"
}
```

### 业务规则

1. **外键约束**：`chapterId` 必须是已存在的章节 ID

---

## 3.2 获取知识点列表 (Task-1.1.7)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `GET /api/knowledge-points` |
| **是否需要认证** | 否 |

### 查询参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `chapterId` | String (UUID) | 否 | 按章节筛选 |
| `status` | String | 否 | 按状态筛选：MASTERED/WEAK/NEED_REVIEW/TODAY_REVIEW |

### 请求示例

#### cURL
```bash
# 获取所有知识点
curl http://localhost:3000/api/knowledge-points

# 按章节筛选
curl "http://localhost:3000/api/knowledge-points?chapterId=550e8400-e29b-41d4-a716-446655440001"

# 按状态筛选（获取薄弱点）
curl "http://localhost:3000/api/knowledge-points?status=WEAK"
```

#### JavaScript (Fetch)
```javascript
// 获取指定章节的知识点
const response = await fetch('http://localhost:3000/api/knowledge-points?chapterId=xxx')
const result = await response.json()
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "chapterId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "函数定义",
      "status": "NEED_REVIEW",
      "importance": 8,
      "masteryScore": 0,
      "createdAt": "2026-03-02T10:00:00.000Z",
      "updatedAt": "2026-03-02T10:00:00.000Z",
      "chapter": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "第一章：函数基础"
      }
    }
  ]
}
```

---

## 3.3 获取知识点详情 (Task-1.1.8)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `GET /api/knowledge-points/:id` |
| **是否需要认证** | 否 |

### 请求示例

#### cURL
```bash
curl http://localhost:3000/api/knowledge-points/550e8400-e29b-41d4-a716-446655440002
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "chapterId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "函数定义",
    "status": "NEED_REVIEW",
    "importance": 8,
    "masteryScore": 0,
    "createdAt": "2026-03-02T10:00:00.000Z",
    "updatedAt": "2026-03-02T10:00:00.000Z",
    "chapter": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "第一章：函数基础",
      "courseId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "mistakes": [],
    "timeMarks": []
  }
}
```

#### 知识点不存在 (404)
```json
{
  "success": false,
  "error": "Knowledge point not found"
}
```

---

## 3.4 更新知识点 (Task-1.1.9)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `PUT /api/knowledge-points/:id` |
| **Content-Type** | `application/json` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `name` | String | 否 | 知识点名称 |
| `status` | String | 否 | 状态：MASTERED/WEAK/NEED_REVIEW/TODAY_REVIEW |
| `importance` | Number | 否 | 重要性 1-10 |
| `masteryScore` | Number | 否 | 掌握度 0-100 |

### 请求示例

#### cURL
```bash
curl -X PUT http://localhost:3000/api/knowledge-points/550e8400-e29b-41d4-a716-446655440002 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "MASTERED",
    "masteryScore": 85
  }'
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "chapterId": "550e8400-e29b-41d4-a716-446655440001",
    "name": "函数定义",
    "status": "MASTERED",
    "importance": 8,
    "masteryScore": 85,
    "createdAt": "2026-03-02T10:00:00.000Z",
    "updatedAt": "2026-03-02T12:00:00.000Z",
    "chapter": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "第一章：函数基础"
    }
  }
}
```

#### 知识点不存在 (404)
```json
{
  "success": false,
  "error": "Knowledge point not found"
}
```

---

## 3.5 更新知识点掌握度 (Task-1.1.11)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `PATCH /api/knowledge-points/:id/mastery` |
| **Content-Type** | `application/json` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `masteryScore` | Number | 是 | 掌握度 0-100 |

### 业务规则

- `masteryScore >= 80` → 状态自动更新为 `MASTERED`
- `60 <= masteryScore < 80` → 状态自动更新为 `NEED_REVIEW`
- `masteryScore < 60` → 状态自动更新为 `WEAK`

### 请求示例

#### cURL
```bash
curl -X PATCH http://localhost:3000/api/knowledge-points/550e8400-e29b-41d4-a716-446655440002/mastery \
  -H "Content-Type: application/json" \
  -d '{
    "masteryScore": 85
  }'
```

#### React Example
```tsx
const MasterySlider = ({ knowledgePointId }: { knowledgePointId: string }) => {
  const [masteryScore, setMasteryScore] = useState(50)

  const handleSave = async () => {
    const res = await fetch(
      `http://localhost:3000/api/knowledge-points/${knowledgePointId}/mastery`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masteryScore })
      }
    )

    const result = await res.json()
    if (result.success) {
      alert('掌握度更新成功！')
    }
  }

  return (
    <div>
      <label>掌握度：{masteryScore}</label>
      <input
        type="range"
        min="0"
        max="100"
        value={masteryScore}
        onChange={(e) => setMasteryScore(parseInt(e.target.value))}
      />
      <button onClick={handleSave}>保存</button>
    </div>
  )
}

export default MasterySlider
```

---

## 3.6 删除知识点 (Task-1.1.10)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `DELETE /api/knowledge-points/:id` |
| **是否需要认证** | 否 |

### 请求示例

#### cURL
```bash
curl -X DELETE http://localhost:3000/api/knowledge-points/550e8400-e29b-41d4-a716-446655440002
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "message": "Knowledge point deleted successfully"
}
```

### 业务规则

- 删除知识点会级联删除所有关联的错题 (Mistakes) 和时间标记 (TimeMarks)

---

## 3.7 获取薄弱点列表 (Task-1.1.12)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `GET /api/knowledge-points/weak` |
| **是否需要认证** | 否 |

### 业务规则

- 返回 `masteryScore < 60` 的所有知识点
- 按 `masteryScore` 升序排列，然后按 `importance` 降序排列

### 请求示例

#### cURL
```bash
curl http://localhost:3000/api/knowledge-points/weak
```

#### React Example
```tsx
const WeakPointsList = () => {
  const [weakPoints, setWeakPoints] = useState([])

  useEffect(() => {
    fetch('http://localhost:3000/api/knowledge-points/weak')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setWeakPoints(result.data)
        }
      })
  }, [])

  return (
    <div>
      <h2>薄弱点 ({weakPoints.length})</h2>
      <ul>
        {weakPoints.map((kp: any) => (
          <li key={kp.id}>
            {kp.name} - 掌握度: {kp.masteryScore}
            - 重要性: {kp.importance}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default WeakPointsList
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "chapterId": "550e8400-e29b-41d4-a716-446655440001",
      "name": "复合函数",
      "status": "WEAK",
      "importance": 9,
      "masteryScore": 45,
      "createdAt": "2026-03-02T10:00:00.000Z",
      "updatedAt": "2026-03-02T10:00:00.000Z",
      "chapter": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "第一章：函数基础",
        "courseId": "550e8400-e29b-41d4-a716-446655440000"
      }
    }
  ]
}
```

---

# 4. 学习记录模块

## 基础信息

| 配置项 | 值 |
|--------|-----|
| 基础路径 | `/api/study-records` |
| 数据模型 | StudyRecord, TimeMark |

---

## 4.1 创建学习记录 (Task-1.2.1)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `POST /api/study-records` |
| **Content-Type** | `application/json` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `courseId` | String (UUID) | 是 | 所属课程ID |
| `chapterId` | String (UUID) | 是 | 所属章节ID |
| `title` | String | 是 | 录音标题 |
| `date` | String (ISO8601) | 是 | 录音日期 |
| `audioUrl` | String (URL) | 是 | 音频文件URL |
| `duration` | Number | 是 | 时长（秒） |
| `status` | String | 否 | 状态：RECORDING/PROCESSING/COMPLETED/FAILED，默认 RECORDING |
| `notes` | String | 否 | 学习笔记 |

### 请求示例

#### cURL
```bash
curl -X POST http://localhost:3000/api/study-records \
  -H "Content-Type: application/json" \
  -d '{
    "courseId": "550e8400-e29b-41d4-a716-4466554400000",
    "chapterId": "550e8400-e29b-41d4-a716-4466554400001",
    "title": "第5课：函数基础",
    "date": "2026-03-03T10:00:00.000Z",
    "audioUrl": "/uploads/audio-1740875512345-123456789.mp3",
    "duration": 3600,
    "status": "COMPLETED",
    "notes": "函数定义的三种方式：构造函数声明、表达式、箭头函数..."
  }'
```

#### JavaScript (Fetch)
```javascript
const response = await fetch('http://localhost:3000/api/study-records', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    courseId: '550e8400-e29b-41d4-a716-4466554400000',
    chapterId: '550e8400-e29b-41d4-a716-4466554400001',
    title: '第5课：函数基础',
    date: new Date().toISOString(),
    audioUrl: '/uploads/audio-1740875512345-123456789.mp3',
    duration: 3600,
    notes: '函数定义的三种方式...'
  })
})

const result = await response.json()
```

#### React Example
```tsx
import { useState } from 'react'

const CreateStudyRecord = ({ courseId, chapterId, audioUrl }: {
  courseId: string
  chapterId: string
  audioUrl: string
}) => {
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(0)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/api/study-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          chapterId,
          title,
          date: new Date().toISOString(),
          audioUrl,
          duration,
          notes,
          status: 'COMPLETED'
        })
      })

      const result = await res.json()
      if (result.success) {
        alert('学习记录创建成功！')
        console.log('创建的学习记录:', result.data)
        // 跳转到时光机页面
        window.location.href = `/time-machine/${result.data.id}`
      }
    } catch (err) {
      console.error('创建出错:', err)
      alert('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>标题：</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="如：第5课：函数基础"
          required
        />
      </div>
      <div>
        <label>时长（秒）：</label>
        <input
          type="number"
          min="0"
          value={duration}
          onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
          required
        />
      </div>
      <div>
        <label>笔记：</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="记录课堂要点..."
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? '保存中...' : '保存学习记录'}
      </button>
    </form>
  )
}

export default CreateStudyRecord
```

### 响应格式

#### 成功响应 (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400003",
    "courseId": "550e8400-e29b-41d4-a716-4466554400000",
    "chapterId": "550e8400-e29b-41d4-a716-4466554400001",
    "title": "第5课：函数基础",
    "date": "2026-03-03T10:00:00.000Z",
    "audioUrl": "/uploads/audio-1740875512345-123456789.mp3",
    "duration": 3600,
    "status": "COMPLETED",
    "notes": "函数定义的三种方式：构造函数声明、表达式、箭头函数...",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "course": {
      "id": "550e8400-e29b-41d4-a716-4466554400000",
      "name": "高等数学"
    },
    "chapter": {
      "id": "550e8400-e29b-41d4-a716-4466554400001",
      "name": "第一章：函数基础"
    }
  }
}
```

#### 课程不存在 (404)
```json
{
  "success": false,
  "error": "Course not found"
}
```

#### 章节不存在 (404)
```json
{
  "success": false,
  "error": "Chapter not found"
}
```

---

## 4.2 获取学习记录列表 (Task-1.2.2)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `GET /api/study-records` |
| **是否需要认证** | 否 |

### 查询参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `courseId` | String (UUID) | 否 | 按课程筛选 |
| `chapterId` | String (UUID) | 否 | 按章节筛选 |
| `status` | String | 否 | 按状态筛选：RECORDING/PROCESSING/COMPLETED/FAILED |
| `startDate` | String (ISO8601) | 否 | 起始日期 |
| `endDate` | String (ISO8601) | 否 | 结束日期 |

### 请求示例

#### cURL
```bash
# 获取所有学习记录
curl http://localhost:3000/api/study-records

# 按课程筛选
curl "http://localhost:3000/api/study-records?courseId=550e8400-e29b-41d4-a716-4466554400000"

# 按章节和状态筛选
curl "http://localhost:3000/api/study-records?chapterId=xxx&status=COMPLETED"

# 按日期范围筛选
curl "http://localhost:3000/api/study-records?startDate=2026-03-01&endDate=2026-03-31"
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-4466554400003",
      "courseId": "550e8400-e29b-41d4-a716-4466554400000",
      "chapterId": "550e8400-e29b-41d4-a716-4466554400001",
      "title": "第5课：函数基础",
      "date": "2026-03-03T10:00:00.000Z",
      "audioUrl": "/uploads/audio-1740875512345-123456789.mp3",
      "duration": 3600,
      "status": "COMPLETED",
      "notes": "函数定义的三种方式...",
      "createdAt": "2026-03-03T10:00:00.000Z",
      "course": {
        "id": "550e8400-e29b-41d4-a716-4466554400000",
        "name": "高等数学"
      },
      "chapter": {
        "id": "550e8400-e29b-41d4-a716-4466554400001",
        "name": "第一章：函数基础"
      }
    }
  ]
}
```

---

## 4.3 获取学习记录详情 (Task-1.2.3)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `GET /api/study-records/:id` |
| **是否需要认证** | 否 |

### 请求示例

#### cURL
```bash
curl http://localhost:3000/api/study-records/550e8400-e29b-41d4-a716-4466554400003
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400003",
    "courseId": "550e8400-e29b-41d4-a716-4466554400000",
    "chapterId": "550e8400-e29b-41d4-a716-4466554400001",
    "title": "第5课：函数基础",
    "date": "2026-03-03T10:00:00.000Z",
    "audioUrl": "/uploads/audio-1740875512345-123456789.mp3",
    "duration": 3600,
    "status": "COMPLETED",
    "notes": "函数定义的三种方式...",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "course": {
      "id": "550e8400-e29b-41d4-a716-4466554400000",
      "name": "高等数学"
    },
    "chapter": {
      "id": "550e8400-e29b-41d4-a716-4466554400001",
      "name": "第一章：函数基础"
    },
    "timeMarks": [
      {
        "id": "550e8400-e29b-41d4-a716-4466554400004",
        "studyRecordId": "550e8400-e29b-41d4-a716-4466554400003",
        "knowledgePointId": null,
        "type": "START",
        "timestamp": 0,
        "pptPage": null,
        "content": "课程开始",
        "imageUrl": null,
        "createdAt": "2026-03-03T10:00:00.000Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-4466554400005",
        "studyRecordId": "550e8400-e29b-41d4-a716-4466554400003",
        "knowledgePointId": "550e8400-e29b-41d4-a716-4466554400002",
        "type": "EMPHASIS",
        "timestamp": 5000,
        "pptPage": 5,
        "content": "重点：函数定义的三种方式",
        "imageUrl": null,
        "createdAt": "2026-03-03T10:00:05.000Z",
        "knowledgePoint": {
          "id": "550e8400-e29b-41d4-a716-4466554400002",
          "name": "函数定义"
        }
      }
    ]
  }
}
```

---

## 4.4 更新学习记录 (Task-1.2.4)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `PUT /api/study-records/:id` |
| **Content-Type** | `application/json` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `title` | String | 否 | 录音标题 |
| `duration` | Number | 否 | 时长（秒） |
| `status` | String | 否 | 状态：RECORDING/PROCESSING/COMPLETED/FAILED |
| `notes` | String | 否 | 学习笔记 |

### 请求示例

#### cURL
```bash
curl -X PUT http://localhost:3000/api/study-records/550e8400-e29b-41d4-a716-4466554400003 \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "更新后的笔记内容..."
  }'
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400003",
    "courseId": "550e8400-e29b-41d4-a716-4466554400000",
    "chapterId": "550e8400-e29b-41d4-a716-4466554400001",
    "title": "第5课：函数基础",
    "date": "2026-03-03T10:00:00.000Z",
    "audioUrl": "/uploads/audio-1740875512345-123456789.mp3",
    "duration": 3600,
    "status": "COMPLETED",
    "notes": "更新后的笔记内容...",
    "createdAt": "2026-03-03T10:00:00.000Z",
    "course": { "id": "...", "name": "高等数学" },
    "chapter": { "id": "...", "name": "第一章：函数基础" }
  }
}
```

---

## 4.5 删除学习记录 (Task-1.2.5)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `DELETE /api/study-records/:id` |
| **是否需要认证** | 否 |

### 请求示例

#### cURL
```bash
curl -X DELETE http://localhost:3000/api/study-records/550e8400-e29b-41d4-a716-4466554400003
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "message": "Study record deleted successfully"
}
```

### 业务规则

- 删除学习记录会级联删除所有关联的时间标记 (TimeMarks)

---

## 4.6 添加时间标记 (Task-1.2.6)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `POST /api/study-records/:id/time-marks` |
| **Content-Type** | `application/json` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `type` | String | 是 | 类型：START/END/EMPHASIS/BOARD_CHANGE/NOTE/QUESTION |
| `timestamp` | Number | 是 | 时间戳（毫秒） |
| `knowledgePointId` | String (UUID) | 否 | 关联的知识点ID |
| `pptPage` | Number | 否 | PPT页码 |
| `content` | String | 否 | 笔记内容 |
| `imageUrl` | String (URL) | 否 | 图片/板书URL |

### 请求示例

#### cURL
```bash
curl -X POST http://localhost:3000/api/study-records/550e8400-e29b-41d4-a716-4466554400003/time-marks \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EMPHASIS",
    "timestamp": 5000,
    "knowledgePointId": "550e8400-e29b-41d4-a716-4466554400002",
    "pptPage": 5,
    "content": "重点：函数定义的三种方式"
  }'
```

### 响应格式

#### 成功响应 (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400005",
    "studyRecordId": "550e8400-e29b-41d4-a716-4466554400003",
    "knowledgePointId": "550e8400-e29b-41d4-a716-4466554400002",
    "type": "EMPHASIS",
    "timestamp": 5000,
    "pptPage": 5,
    "content": "重点：函数定义的三种方式",
    "imageUrl": null,
    "createdAt": "2026-03-03T10:00:05.000Z",
    "studyRecord": {
      "id": "550e8400-e29b-41d4-a716-4466554400003",
      "title": "第5课：函数基础"
    },
    "knowledgePoint": {
      "id": "550e8400-e29b-41d4-a716-4466554400002",
      "name": "函数定义"
    }
  }
}
```

---

## 4.7 获取所有时间标记 (Task-1.2.7)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `GET /api/study-records/:id/time-marks` |
| **是否需要认证** | 否 |

### 请求示例

#### cURL
```bash
curl http://localhost:3000/api/study-records/550e8400-e29b-41d4-a716-4466554400003/time-marks
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-4466554400004",
      "studyRecordId": "550e8400-e29b-41d4-a716-4466554400003",
      "knowledgePointId": null,
      "type": "START",
      "timestamp": 0,
      "pptPage": null,
      "content": "课程开始",
      "imageUrl": null,
      "createdAt": "2026-03-03T10:00:00.000Z",
      "knowledgePoint": null
    },
    {
      "id": "550e8400-e29b-41d4-a716-4466554400005",
      "studyRecordId": "550e8400-e29b-41d4-a716-4466554400003",
      "knowledgePointId": "550e8400-e29b-41d4-a716-4466554400002",
      "type": "EMPHASIS",
      "timestamp": 5000,
      "pptPage": 5,
      "content": "重点：函数定义的三种方式",
      "imageUrl": null,
      "createdAt": "2026-03-03T10:00:05.000Z",
      "knowledgePoint": {
        "id": "550e8400-e29b-41d4-a716-4466554400002",
        "name": "函数定义"
      }
    }
  ]
}
```

---

## 4.8 更新时间标记 (Task-1.2.8)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `PUT /api/study-records/time-marks/:id` |
| **Content-Type** | `application/json` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `type` | String | 否 | 类型：START/END/EMPHASIS/BOARD_CHANGE/NOTE/QUESTION |
| `timestamp` | Number | 否 | 时间戳（毫秒） |
| `knowledgePointId` | String (UUID) | 否 | 关联的知识点ID |
| `pptPage` | Number | 否 | PPT页码 |
| `content` | String | 否 | 笔记内容 |
| `imageUrl` | String (URL) | 否 | 图片/板书URL |

### 请求示例

#### cURL
```bash
curl -X PUT http://localhost:3000/api/study-records/time-marks/550e8400-e29b-41d4-a716-4466554400005 \
  -H "Content-Type: application/json" \
  -d '{
    "content": "更新后的重点内容"
  }'
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400005",
    "studyRecordId": "550e8400-e29b-41d4-a716-4466554400003",
    "knowledgePointId": "550e8400-e29b-41d4-a716-4466554400002",
    "type": "EMPHASIS",
    "timestamp": 5000,
    "pptPage": 5,
    "content": "更新后的重点内容",
    "imageUrl": null,
    "createdAt": "2026-03-03T10:00:05.000Z",
    "studyRecord": {
      "id": "550e8400-e29b-41d4-a716-4466554400003",
      "title": "第5课：函数基础"
    },
    "knowledgePoint": {
      "id": "550e8400-e29b-41d4-a716-4466554400002",
      "name": "函数定义"
    }
  }
}
```

---

## 4.9 删除时间标记 (Task-1.2.9)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `DELETE /api/study-records/time-marks/:id` |
| **是否需要认证** | 否 |

### 请求示例

#### cURL
```bash
curl -X DELETE http://localhost:3000/api/study-records/time-marks/550e8400-e29b-41d4-a716-4466554400005
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "message": "Time mark deleted successfully"
}
```

---

## 4.10 快速标记重点 (Task-1.2.10)

### 接口信息

| 项目 | 内容 |
|------|------|
| **接口地址** | `POST /api/study-records/:id/emphasis` |
| **Content-Type** | `application/json` |
| **是否需要认证** | 否 |

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `timestamp` | Number | 是 | 时间戳（毫秒） |
| `content` | String | 否 | 重点内容 |
| `pptPage` | Number | 否 | PPT页码 |
| `imageUrl` | String (URL) | 否 | 图片/板书URL |
| `knowledgePointId` | String (UUID) | 否 | 关联的知识点ID |

### 请求示例

#### cURL
```bash
curl -X POST http://localhost:3000/api/study-records/550e8400-e29b-41d4-a716-4466554400003/emphasis \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": 15000,
    "content": "重点：复合函数的求导法则",
    "knowledgePointId": "550e8400-e29b-41d4-a716-4466554400003"
  }'
```

### 响应格式

#### 成功响应 (201 Created)
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-4466554400006",
    "studyRecordId": "550e8400-e29b-41d4-a716-4466554400003",
    "knowledgePointId": "550e8400-e29b-41d4-a716-4466554400003",
    "type": "EMPHASIS",
    "timestamp": 15000,
    "pptPage": null,
    "content": "重点：复合函数的求导法则",
    "imageUrl": null,
    "createdAt": "2026-03-03T10:00:15.000Z",
    "studyRecord": {
      "id": "550e8400-e29b-41d4-a716-4466554400003",
      "title": "第5课：函数基础"
    },
    "knowledgePoint": {
      "id": "550e8400-e29b-41d4-a716-4466554400003",
      "name": "复合函数"
    }
  }
}
```

---

## 通用错误响应格式

### 验证失败
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "field_name",
      "message": "error message"
    }
  ]
}
```

### 服务器错误
```json
{
  "success": false,
  "error": "Internal server error"
}
```

---

## 文件名生成规则

上传的文件会自动重命名，格式为：

```
<field-name>-<timestamp>-<random><extension>
```

示例：
- `audio-1740875512345-123456789.mp3`
- `image-1740875512345-987654321.jpg`
- `document-1740875512345-555666777.pdf`

