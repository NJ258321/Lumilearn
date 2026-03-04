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
- [ ] 添加用户认证
- [ ] 实现文件删除功能
- [ ] 添加单元测试
- [ ] 集成AI服务（Gemini API）
- [ ] 实现备考规划算法
- [ ] 实现薄弱点发现算法
