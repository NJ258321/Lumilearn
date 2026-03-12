# P1 阶段 - API 接口文档

> 项目：溯光智习 (LumiTrace AI)
> 阶段：P1 - 文件处理与存储服务
> 版本：v1.0.0
> 更新日期：2026-03-05

---

## 一、接口概述

P1 阶段提供文件上传、预览、删除等完整的文件管理功能。

**基础路径**: `/api/upload`

---

## 二、文件上传接口

### 2.1 上传音频文件

**接口**: `POST /api/upload/audio`

**描述**: 上传音频文件（MP3、WAV、M4A 等）

**请求**:
- Content-Type: `multipart/form-data`
- Body: `audio` (文件字段)

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "filename": "audio-1772699644231-123456789.mp3",
    "originalName": "recording.mp3",
    "size": 1024000,
    "mimetype": "audio/mpeg",
    "url": "/uploads/audio-1772699644231-123456789.mp3"
  }
}
```

**限制**:
- 最大文件大小: 100MB
- 支持类型: audio/mpeg, audio/wav, audio/m4a, audio/x-m4a

---

### 2.2 上传图片文件

**接口**: `POST /api/upload/image`

**描述**: 上传图片文件（PPT截图、板书照片等）

**请求**:
- Content-Type: `multipart/form-data`
- Body: `image` (文件字段)

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "filename": "image-1772699644231-303591883.png",
    "originalName": "screenshot.png",
    "size": 67000,
    "mimetype": "image/png",
    "url": "/uploads/image-1772699644231-303591883.png"
  }
}
```

**限制**:
- 最大文件大小: 10MB
- 支持类型: image/jpeg, image/png, image/gif, image/webp, image/svg+xml

---

### 2.3 上传文档文件

**接口**: `POST /api/upload/document`

**描述**: 上传文档文件（PDF、Word、PPT 等）

**请求**:
- Content-Type: `multipart/form-data`
- Body: `document` (文件字段)

**响应** (201 Created):
```json
{
  "success": true,
  "data": {
    "filename": "document-1772699644231-987654321.pdf",
    "originalName": "lecture.pdf",
    "size": 5242880,
    "mimetype": "application/pdf",
    "url": "/uploads/document-1772699644231-987654321.pdf"
  }
}
```

**限制**:
- 最大文件大小: 50MB
- 支持类型: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX

---

## 三、文件获取接口

### 3.1 获取/预览文件

**接口**: `GET /api/upload/:filename`

**描述**: 获取文件内容，支持图片直接显示、音频/视频流式播放、文档下载

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| filename | string | 文件名（上传返回的文件名）|

**响应**:

- **图片**: 直接在浏览器中显示
  - Content-Type: image/png (根据扩展名)
  - Content-Disposition: inline
  - Cache-Control: public, max-age=86400

- **音频/视频**: 流式播放
  - Content-Type: audio/mpeg / video/mp4
  - 支持 HTTP Range 请求
  - Accept-Ranges: bytes

- **文档**: 触发下载
  - Content-Type: application/pdf
  - Content-Disposition: attachment

**错误响应** (404 Not Found):
```json
{
  "success": false,
  "error": "文件不存在",
  "code": "FILE_NOT_FOUND"
}
```

**错误响应** (400 Bad Request):
```json
{
  "success": false,
  "error": "无效的文件名",
  "code": "INVALID_FILENAME"
}
```

---

### 3.2 获取文件信息

**接口**: `GET /api/upload/info/:filename`

**描述**: 获取文件的元数据信息

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| filename | string | 文件名 |

**响应** (200 OK):
```json
{
  "success": true,
  "data": {
    "filename": "image-1772699689790-738717774.png",
    "url": "/uploads/image-1772699689790-738717774.png",
    "size": 67,
    "sizeFormatted": "67.00 B",
    "created": "2026-03-05T08:34:49.791Z",
    "modified": "2026-03-05T08:34:49.792Z"
  }
}
```

---

## 四、文件删除接口

### 4.1 删除文件

**接口**: `DELETE /api/upload/:filename`

**描述**: 删除指定文件

**路径参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| filename | string | 文件名 |

**响应** (200 OK):
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

**错误响应** (404 Not Found):
```json
{
  "success": false,
  "error": "文件不存在",
  "code": "FILE_NOT_FOUND"
}
```

**错误响应** (400 Bad Request):
```json
{
  "success": false,
  "error": "无效的文件名",
  "code": "INVALID_FILENAME"
}
```

---

## 五、错误码说明

| 错误码 | HTTP状态 | 说明 |
|--------|----------|------|
| INVALID_FILENAME | 400 | 无效的文件名（路径遍历攻击）|
| FILE_NOT_FOUND | 404 | 文件不存在 |
| FILE_TOO_LARGE | 400 | 文件大小超过限制 |
| INVALID_FILE_TYPE | 400 | 文件类型不支持 |
| FILE_DELETE_FAILED | 500 | 文件删除失败 |
| FILE_READ_FAILED | 500 | 文件读取失败 |

---

## 六、支持的 MIME 类型

### 音频 (audio/*)
- audio/mpeg (.mp3)
- audio/wav (.wav)
- audio/m4a (.m4a)
- audio/x-m4a (.m4a)

### 图片 (image/*)
- image/jpeg (.jpg, .jpeg)
- image/png (.png)
- image/gif (.gif)
- image/webp (.webp)
- image/svg+xml (.svg)

### 文档 (application/*)
- application/pdf (.pdf)
- application/msword (.doc)
- application/vnd.openxmlformats-officedocument.wordprocessingml.document (.docx)
- application/vnd.ms-powerpoint (.ppt)
- application/vnd.openxmlformats-officedocument.presentationml.presentation (.pptx)
- application/vnd.ms-excel (.xls)
- application/vnd.openxmlformats-officedocument.spreadsheetml.sheet (.xlsx)

---

## 七、文件大小限制

| 类型 | 限制 |
|------|------|
| 音频 | 100MB |
| 视频 | 500MB |
| 图片 | 10MB |
| 文档 | 50MB |

---

## 八、安全说明

1. **路径遍历防护**: 禁止文件名包含 `..`、`/`、`\` 等路径分隔符
2. **文件名验证**: 上传的文件会重命名为唯一标识符（时间戳+随机数）
3. **MIME 类型验证**: 仅允许预定义的安全文件类型
4. **文件大小限制**: 防止资源耗尽攻击

---

**文档版本**: v1.0.0
**创建日期**: 2026-03-05
