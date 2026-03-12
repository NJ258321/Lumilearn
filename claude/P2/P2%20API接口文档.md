# P2 阶段 API 接口文档

> 项目：溯光智习 (LumiTrace AI)
> 阶段：P2 - 音频处理服务
> 版本：v1.0
> 创建日期：2026-03-05

---

## 一、概述

P2 阶段主要实现音频处理服务，包括：

- 音频元数据提取
- 音频转写接口（预留框架）
- 音频片段提取
- 语音活动检测（VAD）

---

## 二、API 接口列表

| 接口 | 方法 | 说明 |
|------|------|------|
| `GET /api/audio/:id/metadata` | GET | 音频元数据提取 |
| `POST /api/audio/:id/transcribe` | POST | 音频转写（预留）|
| `GET /api/audio/transcribe/status` | GET | 转写服务状态 |
| `GET /api/audio/:id/segment` | GET | 音频片段提取 |
| `POST /api/audio/:id/vad` | POST | 语音活动检测 |
| `GET /api/audio/vad/status` | GET | VAD 服务状态 |

---

## 三、接口详细说明

---

### 3.1 音频元数据提取

**接口**: `GET /api/audio/:id/metadata`

**描述**: 根据学习记录 ID 获取音频元数据，包括时长、格式、关联知识点等信息

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 学习记录 ID（UUID）|

**示例请求**:
```bash
GET /api/audio/550e8400-e29b-41d4-a716-446655440000/metadata
```

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "第一章 极限",
    "course": {
      "id": "course-id",
      "name": "高等数学"
    },
    "chapter": {
      "id": "chapter-id",
      "name": "第一章"
    },
    "audioUrl": "/uploads/audio-123456.mp3",
    "duration": 3600,
    "status": "COMPLETED",
    "date": "2026-03-05T10:00:00.000Z",
    "createdAt": "2026-03-05T10:00:00.000Z",
    "metadata": {
      "filename": "audio-123456.mp3",
      "url": "/uploads/audio-123456.mp3",
      "size": 52428800,
      "format": "mp3",
      "duration": 3600,
      "created": "2026-03-05T09:00:00.000Z",
      "modified": "2026-03-05T10:00:00.000Z"
    },
    "knowledgePoints": [
      { "id": "kp-1", "name": "极限的定义", "status": "NEED_REVIEW" }
    ],
    "timeMarksCount": 15,
    "emphasisCount": 5,
    "noteCount": 3
  }
}
```

**错误响应**:

| 状态码 | 错误原因 | 错误格式 |
|--------|----------|----------|
| 404 | 学习记录不存在 | `{"success": false, "error": "学习记录不存在", "code": "STUDY_RECORD_NOT_FOUND"}` |
| 500 | 服务器错误 | `{"success": false, "error": "获取音频元数据失败", "code": "GET_METADATA_FAILED"}` |

---

### 3.2 音频转写接口（预留）

**接口**: `POST /api/audio/:id/transcribe`

**描述**: 调用外部语音识别服务进行音频转写（当前为预留框架）

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 学习记录 ID（UUID）|

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| language | string | 否 | 语言代码，默认 `zh-CN` |

**language 可选值**: `zh-CN`, `en-US`, `ja-JP`

**示例请求**:
```bash
curl -X POST http://localhost:3000/api/audio/550e8400-e29b-41d4-a716-446655440000/transcribe \
  -H "Content-Type: application/json" \
  -d '{"language": "zh-CN"}'
```

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "studyRecordId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "PENDING",
    "message": "转写服务预留框架已就绪，请配置语音识别服务",
    "language": "zh-CN",
    "text": null,
    "segments": [],
    "providers": [
      { "name": "阿里云语音识别", "status": "not_configured" },
      { "name": "讯飞语音识别", "status": "not_configured" },
      { "name": "Google Speech-to-Text", "status": "not_configured" }
    ]
  }
}
```

**错误响应**:

| 状态码 | 错误原因 | 错误码 |
|--------|----------|---------|
| 404 | 学习记录不存在 | `STUDY_RECORD_NOT_FOUND` |
| 400 | 学习记录没有音频文件 | `NO_AUDIO_FILE` |
| 404 | 音频文件不存在 | `AUDIO_FILE_NOT_FOUND` |

---

### 3.3 转写服务状态

**接口**: `GET /api/audio/transcribe/status`

**描述**: 获取转写服务的配置状态和可用供应商

**示例请求**:
```bash
GET /api/audio/transcribe/status
```

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "available": false,
    "message": "语音识别服务尚未配置",
    "supportedLanguages": ["zh-CN", "en-US", "ja-JP"],
    "providers": [
      {
        "name": "阿里云语音识别",
        "description": "支持中文英文等多种语言",
        "status": "not_configured",
        "configFields": ["accessKeyId", "accessKeySecret", "appKey"]
      },
      {
        "name": "讯飞语音识别",
        "description": "中文识别效果优秀",
        "status": "not_configured",
        "configFields": ["appId", "apiKey", "apiSecret"]
      },
      {
        "name": "Google Speech-to-Text",
        "description": "支持多种语言",
        "status": "not_configured",
        "configFields": ["apiKey", "projectId"]
      }
    ]
  }
}
```

---

### 3.4 音频片段提取

**接口**: `GET /api/audio/:id/segment`

**描述**: 根据片段并返回文件流

时间范围提取音频**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 学习记录 ID（UUID）|

**查询参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start | number | 是 | 开始时间（秒）|
| end | number | 是 | 结束时间（秒）|

**示例请求**:
```bash
GET /api/audio/550e8400-e29b-41d4-a716-446655440000/segment?start=60&end=120
```

**成功响应**:

```
HTTP/1.1 200 OK
Content-Type: audio/mpeg
Content-Length: 5242880
Content-Disposition: attachment; filename="segment-60-120.mp3"

[音频数据流...]
```

**错误响应**:

| 状态码 | 错误原因 | 错误码 |
|--------|----------|---------|
| 400 | 参数无效 | `INVALID_PARAMS` |
| 400 | 开始时间为负数 | `INVALID_TIME_RANGE` |
| 400 | 结束时间小于等于开始时间 | `INVALID_TIME_RANGE` |
| 400 | 片段时长超过5分钟 | `SEGMENT_TOO_LONG` |
| 400 | 结束时间超过音频时长 | `INVALID_TIME_RANGE` |
| 404 | 学习记录不存在 | `STUDY_RECORD_NOT_FOUND` |
| 400 | 学习记录没有音频文件 | `NO_AUDIO_FILE` |
| 404 | 音频文件不存在 | `AUDIO_FILE_NOT_FOUND` |
| 503 | ffmpeg 不可用 | `FFMPEG_NOT_AVAILABLE` |

**错误响应格式**:
```json
{
  "success": false,
  "error": "片段时长不能超过 300 秒（5分钟）",
  "code": "SEGMENT_TOO_LONG"
}
```

---

### 3.5 语音活动检测

**接口**: `POST /api/audio/:id/vad`

**描述**: 检测音频中的语音活动，返回语音片段的时间范围

**路径参数**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 学习记录 ID（UUID）|

**请求体**:

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sensitivity | number | 否 | 灵敏度 0-100，默认 50 |
| minDuration | number | 否 | 最小语音片段时长（秒），默认 0.5 |
| minSilence | number | 否 | 最小静音间隔（秒），默认 0.3 |

**参数说明**:

| 参数 | 说明 |
|------|------|
| sensitivity | 数值越高越敏感，能检测到更轻的声音 |
| minDuration | 小于此长度的语音片段将被忽略 |
| minSilence | 超过此间隔认为语音片段结束 |

**示例请求**:
```bash
curl -X POST http://localhost:3000/api/audio/550e8400-e29b-41d4-a716-446655440000/vad \
  -H "Content-Type: application/json" \
  -d '{
    "sensitivity": 50,
    "minDuration": 0.5,
    "minSilence": 0.3
  }'
```

**成功响应 (200)** - ffmpeg 可用时:
```json
{
  "success": true,
  "data": {
    "studyRecordId": "550e8400-e29b-41d4-a716-446655440000",
    "method": "ffmpeg_silencedetect",
    "segments": [
      { "start": 0.5, "end": 10.2 },
      { "start": 15.0, "end": 25.5 },
      { "start": 30.0, "end": 45.0 }
    ],
    "totalSpeechDuration": 35.2,
    "audioDuration": 3600,
    "speechRatio": 0.98,
    "sensitivity": 50,
    "vadThreshold": 30,
    "minDuration": 0.5,
    "minSilence": 0.3
  }
}
```

**成功响应 (200)** - ffmpeg 不可用时（估算模式）:
```json
{
  "success": true,
  "data": {
    "studyRecordId": "550e8400-e29b-41d4-a716-446655440000",
    "method": "estimation",
    "message": "ffmpeg 不可用，返回基于统计的估算结果",
    "segments": [
      { "start": 0.0, "end": 35.2 },
      { "start": 42.5, "end": 78.0 }
    ],
    "totalSpeechDuration": 70.7,
    "audioDuration": 3600,
    "sensitivity": 50,
    "minDuration": 0.5,
    "minSilence": 0.3
  }
}
```

**错误响应**:

| 状态码 | 错误原因 | 错误码 |
|--------|----------|---------|
| 400 | 灵敏度无效 | `INVALID_SENSITIVITY` |
| 404 | 学习记录不存在 | `STUDY_RECORD_NOT_FOUND` |
| 400 | 学习记录没有音频文件 | `NO_AUDIO_FILE` |
| 404 | 音频文件不存在 | `AUDIO_FILE_NOT_FOUND` |
| 400 | 无法获取音频时长 | `FFMPEG_NOT_AVAILABLE` |

---

### 3.6 VAD 服务状态

**接口**: `GET /api/audio/vad/status`

**描述**: 获取语音活动检测服务的状态和参数说明

**示例请求**:
```bash
GET /api/audio/vad/status
```

**成功响应 (200)**:
```json
{
  "success": true,
  "data": {
    "available": true,
    "method": "ffmpeg_analysis",
    "description": "使用 ffmpeg 进行音频音量分析，精确检测语音段",
    "parameters": {
      "sensitivity": {
        "type": "number",
        "range": "0-100",
        "default": 50,
        "description": "语音检测灵敏度，数值越高越敏感"
      },
      "minDuration": {
        "type": "number",
        "range": ">=0.1",
        "default": 0.5,
        "description": "最小语音片段时长（秒）"
      },
      "minSilence": {
        "type": "number",
        "range": ">=0.1",
        "default": 0.3,
        "description": "最小静音间隔（秒），超过此值认为语音片段结束"
      }
    }
  }
}
```

---

## 四、错误响应格式

所有 API 错误响应遵循统一格式：

### 4.1 格式示例

```json
{
  "success": false,
  "error": "错误描述信息",
  "code": "ERROR_CODE"
}
```

### 4.2 错误码列表

| 错误码 | 说明 |
|--------|------|
| `STUDY_RECORD_NOT_FOUND` | 学习记录不存在 |
| `NO_AUDIO_FILE` | 学习记录没有音频文件 |
| `AUDIO_FILE_NOT_FOUND` | 音频文件不存在 |
| `INVALID_PARAMS` | 请求参数无效 |
| `INVALID_TIME_RANGE` | 时间范围无效 |
| `SEGMENT_TOO_LONG` | 片段时长超过限制 |
| `FFMPEG_NOT_AVAILABLE` | ffmpeg 不可用 |
| `INVALID_SENSITIVITY` | 灵敏度参数无效 |
| `GET_METADATA_FAILED` | 获取元数据失败 |
| `TRANSCRIBE_FAILED` | 转写失败 |
| `SEGMENT_EXTRACTION_FAILED` | 片段提取失败 |
| `VAD_FAILED` | 语音活动检测失败 |
| `GET_STATUS_FAILED` | 获取状态失败 |

---

## 五、依赖说明

### 5.1 运行时依赖

| 依赖 | 说明 | 用途 |
|------|------|------|
| ffmpeg | 音频处理工具 | 音频片段提取、语音活动检测 |

### 5.2 安装 ffmpeg

**Windows (使用 Chocolatey)**:
```bash
choco install ffmpeg
```

**Windows (手动)**:
1. 下载 ffmpeg: https://ffmpeg.org/download.html
2. 将 ffmpeg 添加到系统 PATH

**macOS**:
```bash
brew install ffmpeg
```

**Linux (Ubuntu)**:
```bash
sudo apt install ffmpeg
```

### 5.3 无 ffmpeg 时的行为

当 ffmpeg 不可用时：
- **音频片段提取**: 仅支持提取整个文件，无法按时间范围提取
- **语音活动检测**: 返回基于统计的估算结果

---

## 六、使用示例

### 6.1 获取音频元数据

```bash
# 获取学习记录的音频元数据
curl -X GET http://localhost:3000/api/audio/study-record-id/metadata
```

### 6.2 提取音频片段

```bash
# 提取第1分钟到第2分钟的音频片段
curl -X GET "http://localhost:3000/api/audio/study-record-id/segment?start=60&end=120" \
  -o segment.mp3
```

### 6.3 语音活动检测

```bash
# 使用默认参数进行语音活动检测
curl -X POST http://localhost:3000/api/audio/study-record-id/vad \
  -H "Content-Type: application/json" \
  -d '{
    "sensitivity": 60,
    "minDuration": 1.0,
    "minSilence": 0.5
  }'
```

### 6.4 获取服务状态

```bash
# 获取转写服务状态
curl -X GET http://localhost:3000/api/audio/transcribe/status

# 获取 VAD 服务状态
curl -X GET http://localhost:3000/api/audio/vad/status
```

---

## 七、注意事项

1. **音频文件格式**: 当前支持 MP3 格式，其他格式可能需要转码

2. **片段时长限制**: 单次提取的音频片段不能超过 5 分钟（300秒）

3. **大文件处理**: 音频片段提取采用流式处理，避免内存溢出

4. **临时文件**: 提取完成后会自动清理临时文件

5. **转写服务**: 当前为预留框架，需要配置外部语音识别服务才能使用

---

## 八、版本历史

| 版本 | 日期 | 修改内容 |
|------|------|----------|
| v1.0 | 2026-03-05 | 初始版本 |

---

**文档版本**: v1.0
**最后更新**: 2026-03-05
