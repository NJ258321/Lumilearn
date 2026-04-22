# LumiLearn AI 大模型 API 使用文档

## 概述

本文档汇总了项目中使用的所有大模型 API 服务及相关配置。

---

## 使用的大模型 API

### 1. Minimax API

**用途**: 生成题目、答题分析、知识点解释、学习建议、薄弱点分析、资源搜索

**文件位置**: `code/backend/src/services/minimax.ts`

**使用的模型**:
- `MiniMax-M2.5`
- `abab6.5s-chat`
- `abab6.5-chat`
- `abab6-chat`

**API 端点**: `https://api.minimax.chat/v1/text/chatcompletion_v2`

---

### 2. 阿里云 DashScope (Qwen)

**用途**: 多模态分析（音频/图片/PPT）、文本分析、**语音识别**

**文件位置**: `code/backend/src/services/multimodalAnalyzer.ts`

**使用的模型**:
| 模型 | 用途 |
|------|------|
| `qwen3-omni-flash` | 音频多模态理解（语音识别 + 内容分析 + 重点标记） |
| `qwen3.5-flash` | 图片分析、PPT分析、时间对齐 |
| `qwen3-32b` | PPT文本分析 |

**Base URL**: `https://dashscope.aliyuncs.com/compatible-mode/v1`

---

### 3. Google Gemini

**用途**: 知识点解释、学习建议、薄弱点分析、资源检索

**文件位置**: `code/backend/src/services/gemini.ts`

**默认模型**: `gemini-1.5-pro`

---

### 4. OpenAI Whisper (语音识别)

**用途**: 语音转文字 (ASR)

**文件位置**: `code/backend/src/routes/audio.ts`

**模型**: `whisper-1`

**状态**: 代码已集成，但需要配置 `OPENAI_API_KEY`，目前未配置

---

## 语音识别方案说明

项目当前使用的语音识别方案：

| 方案 | 状态 | 说明 |
|------|------|------|
| **Qwen3-Omni (主要)** | ✅ 正在使用 | 使用阿里云 DashScope 的 `qwen3-omni-flash` 模型，直接同时完成语音识别、内容分析、重点标记提取 |
| MiniMax ASR | ⚠️ 尝试但不确定 | 尝试调用 MiniMax 语音识别 API |
| OpenAI Whisper | ❌ 未配置 | 代码已集成，需要配置 `OPENAI_API_KEY` |

---

## API Key 相关文件

| 文件路径 | 说明 |
|---------|------|
| `code/backend/.env` | **实际使用的 API Key** |
| `code/backend/.env.example` | 环境变量示例模板 |
| `code/lumilearn-ai/.env.example` | 前端环境变量示例 |
| `code/lumilearn-ai/.env.local` | 前端本地环境变量 |

---

## 环境变量配置

### 后端 (.env)

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL="file:./lumi.db"

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600

# API Keys
MINIMAX_API_KEY=sk-cp-DjQu2CvTvnUc3OomPQcmuxB1MEOa_--THQt2b3QdGY9yhI5GUdR9uDu5ecTGDpMVyQ_uL2Zp8ePeb1lVtaRgnOo0sWf2pFqp5Nl21AmYbMC-7eBDueGINI8
DASHSCOPE_API_KEY=sk-d13c35eae846443b85090bb743dd61d1
```

### 示例模板 (.env.example)

```env
# API Keys (可选)
# GEMINI_API_KEY=your_key_here
# MINIMAX_API_KEY=your_minimax_key_here
# OPENAI_API_KEY=your_openai_key_here

# 阿里云百炼 API Key（用于 Qwen 多模态模型）
# 获取地址：https://bailian.aliyun.com/
DASHSCOPE_API_KEY=sk-your-dashscope-api-key-here
```

---

## API Key 获取地址

| 服务 | 获取地址 |
|------|----------|
| Minimax | https://platform.minimax.com/ |
| 阿里云 DashScope (Qwen) | https://bailian.aliyun.com/ |
| Google Gemini | https://aistudio.google.com/app/apikey |
| OpenAI (Whisper) | https://platform.openai.com/api-keys |

---

## 服务状态说明

| 服务 | 状态 |
|------|------|
| Minimax | ✅ 已配置 |
| 阿里云 DashScope (Qwen) | ✅ 已配置 |
| Google Gemini | ❌ 未配置（使用模拟模式） |
| OpenAI Whisper | ❌ 未配置（API Key 未设置） |

---

## 功能对应关系

| 功能 | API |
|------|-----|
| **语音识别** | Qwen3-Omni (DashScope) |
| 智能出题 | Minimax |
| 答题分析 | Minimax |
| 知识点解释 | Gemini / Minimax |
| 学习建议 | Gemini / Minimax |
| 薄弱点分析 | Gemini / Minimax |
| 资源搜索 | Gemini / Minimax |
| 音频多模态分析 | Qwen (DashScope) |
| 图片内容分析 | Qwen (DashScope) |
| PPT内容分析 | Qwen (DashScope) |
| 板书与音频时间对齐 | Qwen (DashScope) |

---

*最后更新: 2026-04-03*