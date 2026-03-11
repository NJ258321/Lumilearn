import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
// ==================== Constants ====================
const DEFAULT_CONFIG = {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
    maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '2048'),
    temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7')
};
const SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    }
];
// ==================== Gemini Service ====================
class GeminiService {
    client = null;
    config;
    isConfigured = false;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initialize();
    }
    initialize() {
        if (!this.config.apiKey || this.config.apiKey === 'your_api_key_here') {
            console.warn('⚠️  Gemini API Key 未配置，AI 服务将使用模拟模式');
            this.isConfigured = false;
            return;
        }
        try {
            this.client = new GoogleGenerativeAI(this.config.apiKey);
            this.isConfigured = true;
            console.log('✅ Gemini AI 服务已初始化');
            console.log(`   模型: ${this.config.model}`);
        }
        catch (error) {
            console.error('❌ Gemini AI 服务初始化失败:', error);
            this.isConfigured = false;
        }
    }
    /**
     * 检查服务是否可用
     */
    isAvailable() {
        return this.isConfigured && this.client !== null;
    }
    /**
     * 获取服务状态
     */
    getStatus() {
        return {
            available: this.isAvailable(),
            model: this.config.model,
            mode: this.isConfigured ? 'production' : 'mock'
        };
    }
    /**
     * 基础对话
     */
    async chat(prompt, context) {
        if (!this.isAvailable()) {
            return this.getMockResponse(prompt, 'chat');
        }
        try {
            const model = this.client.getGenerativeModel({
                model: this.config.model,
                systemInstruction: context?.systemInstruction
            });
            const generationConfig = {
                maxOutputTokens: this.config.maxTokens,
                temperature: this.config.temperature,
                topP: 0.95,
                topK: 40
            };
            // 如果有历史消息，使用多轮对话
            if (context?.messages && context.messages.length > 0) {
                const chat = model.startChat({
                    generationConfig,
                    safetySettings: SAFETY_SETTINGS,
                    history: context.messages.map(msg => ({
                        role: msg.role,
                        parts: [{ text: msg.content }]
                    }))
                });
                const result = await chat.sendMessage(prompt);
                return result.response.text();
            }
            // 单轮对话
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig,
                safetySettings: SAFETY_SETTINGS
            });
            return result.response.text();
        }
        catch (error) {
            console.error('Gemini API 错误:', error.message);
            return this.getMockResponse(prompt, 'chat');
        }
    }
    /**
     * 流式对话
     */
    async *streamChat(prompt, context) {
        if (!this.isAvailable()) {
            const mockResponse = this.getMockResponse(prompt, 'stream');
            for (const chunk of this.chunkText(mockResponse, 50)) {
                yield chunk;
            }
            return;
        }
        try {
            const model = this.client.getGenerativeModel({
                model: this.config.model,
                systemInstruction: context?.systemInstruction
            });
            const generationConfig = {
                maxOutputTokens: this.config.maxTokens,
                temperature: this.config.temperature,
                topP: 0.95,
                topK: 40
            };
            const result = await model.generateContentStream({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig,
                safetySettings: SAFETY_SETTINGS
            });
            for await (const chunk of result.stream) {
                const text = chunk.text();
                if (text) {
                    yield text;
                }
            }
        }
        catch (error) {
            console.error('Gemini 流式 API 错误:', error.message);
            const mockResponse = this.getMockResponse(prompt, 'stream');
            for (const chunk of this.chunkText(mockResponse, 50)) {
                yield chunk;
            }
        }
    }
    /**
     * 知识点解释生成
     */
    async explainKnowledgePoint(request) {
        const { knowledgePoint, style, includeRelated, includeExamples, relatedPoints } = request;
        const styleInstructions = {
            brief: '简洁明了，不超过100字',
            detailed: '详细全面，包含定义、定理、推导过程，300字左右',
            example: '以例题为主，详细讲解解题思路和方法，250字左右'
        };
        let prompt = `你是一位大学${knowledgePoint.courseName}教授，请用${style}风格解释以下知识点：

知识点：${knowledgePoint.name}
章节：${knowledgePoint.chapterName}
课程：${knowledgePoint.courseName}
掌握程度：${knowledgePoint.masteryScore}%

要求：
1. ${styleInstructions[style]}
2. 语言通俗易懂，适合自学
3. 如果掌握程度低于60%，适当增加基础概念的解释`;
        if (includeRelated && relatedPoints && relatedPoints.length > 0) {
            prompt += `\n\n关联知识点：\n${relatedPoints.map(p => `- ${p.name} (掌握度：${p.masteryScore}%)`).join('\n')}`;
        }
        if (includeExamples) {
            prompt += '\n\n请包含1-2个典型例题及其详细解答。';
        }
        return this.chat(prompt);
    }
    /**
     * 学习建议生成
     */
    async generateSuggestion(request) {
        const { courseName, targetGrade, daysUntilExam, dailyStudyTime, focusAreas, weakPoints, studyRecords } = request;
        let prompt = `你是一位学习规划专家，请为学习${courseName}的学生制定学习建议。

学生情况：
- 目标成绩：${targetGrade}
- 距离考试：${daysUntilExam}天
- 每日学习时间：${dailyStudyTime}分钟
- 重点关注：${focusAreas.join('、')}`;
        if (weakPoints && weakPoints.length > 0) {
            prompt += `\n\n薄弱知识点：\n${weakPoints.map(wp => `- ${wp.name} (掌握度：${wp.masteryScore}%，错题率：${(wp.mistakeRate * 100).toFixed(0)}%)`).join('\n')}`;
        }
        if (studyRecords && studyRecords.length > 0) {
            const totalTime = studyRecords.reduce((sum, sr) => sum + sr.duration, 0);
            prompt += `\n\n已学习时长：${(totalTime / 60).toFixed(1)}小时，共${studyRecords.length}次学习记录`;
        }
        prompt += `

请生成：
1. 总体评估（优势、劣势）
2. 具体学习建议（按优先级排序）
3. 复习计划（建议按周分配）
4. 注意事项

注意：建议要具体可执行，包含具体的学习内容和时间安排。`;
        return this.chat(prompt);
    }
    /**
     * 薄弱点分析
     */
    async analyzeWeakPoints(request) {
        const { courseName, knowledgePoints } = request;
        // 计算每个知识点的薄弱度评分
        const analyzedPoints = knowledgePoints.map(kp => {
            // 薄弱度评分算法
            const mistakeScore = kp.mistakeRate * 40; // 错题率权重 40%
            const reviewMissScore = kp.reviewMissCount * 10 * 0.3; // 未复习权重 30%
            const masteryScore = (100 - kp.knowledgePoint.masteryScore) * 0.3; // 掌握度权重 30%
            const totalScore = Math.min(100, mistakeScore + reviewMissScore + masteryScore);
            let priority;
            if (totalScore >= 70 || kp.mistakeRate > 0.5) {
                priority = 'high';
            }
            else if (totalScore >= 40) {
                priority = 'medium';
            }
            else {
                priority = 'low';
            }
            return {
                ...kp,
                score: totalScore,
                priority
            };
        });
        // 按优先级排序
        const sortedPoints = analyzedPoints.sort((a, b) => b.score - a.score);
        const highPriority = sortedPoints.filter(p => p.priority === 'high');
        const mediumPriority = sortedPoints.filter(p => p.priority === 'medium');
        let prompt = `请分析以下${courseName}的薄弱知识点，并给出复习建议：

高优先级（需要重点复习）：\n${highPriority.map(p => `- ${p.knowledgePoint.name}：薄弱度${p.score.toFixed(0)}，错题率${(p.mistakeRate * 100).toFixed(0)}%${p.errorPatterns ? '，错误模式：' + p.errorPatterns.join('、') : ''}`).join('\n') || '无'}`;
        if (mediumPriority.length > 0) {
            prompt += `\n\n中优先级（需要适当关注）：\n${mediumPriority.map(p => `- ${p.knowledgePoint.name}：薄弱度${p.score.toFixed(0)}`).join('\n')}`;
        }
        prompt += `

请生成：
1. 薄弱点总结
2. 每个高优先级知识点的具体复习建议
3. 学习洞察和建议`;
        return this.chat(prompt);
    }
    /**
     * 资源检索（模拟）
     * 注意：实际生产中应该调用外部 API（如 B站、慕课 API）
     */
    async searchResources(request) {
        const { knowledgePointName, resourceTypes, maxResults } = request;
        // 构建搜索提示
        const prompt = `请推荐学习"${knowledgePointName}"的高质量免费资源，包括：
${resourceTypes.includes('video') ? '- 视频教程（B站、慕课等）' : ''}
${resourceTypes.includes('document') ? '- 文档资料（笔记、习题集等）' : ''}
${resourceTypes.includes('practice') ? '- 练习资源（在线题库、习题解析等）' : ''}

请列出${maxResults}个最推荐的资源，包含：
1. 资源名称
2. 来源平台
3. 推荐理由
4. 资源类型

格式要求：JSON数组，每个元素包含 title, source, reason, type 字段`;
        const response = await this.chat(prompt);
        // 解析响应（简单解析，实际可能需要更复杂的处理）
        try {
            // 尝试提取 JSON
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const resources = JSON.parse(jsonMatch[0]);
                return resources.map((r, index) => ({
                    type: r.type || resourceTypes[index % resourceTypes.length],
                    title: r.title || '未命名资源',
                    source: r.source || '未知来源',
                    url: r.url || `https://example.com/search?q=${encodeURIComponent(knowledgePointName)}`,
                    quality: r.quality || 'medium',
                    description: r.reason || '',
                    matchReason: r.reason || ''
                }));
            }
        }
        catch (e) {
            // 解析失败，返回模拟结果
        }
        // 返回模拟结果
        return this.getMockResources(knowledgePointName, resourceTypes, maxResults);
    }
    // ==================== Private Helpers ====================
    chunkText(text, chunkSize) {
        const chunks = [];
        for (let i = 0; i < text.length; i += chunkSize) {
            chunks.push(text.slice(i, i + chunkSize));
        }
        return chunks;
    }
    getMockResponse(prompt, type) {
        // 返回模拟响应
        const mockResponses = {
            chat: `您好！我是 LumiTrace AI 助手。由于当前 AI 服务未配置（请在 .env 中设置 GEMINI_API_KEY），我暂时只能提供模拟回复。

您发送的消息：${prompt.slice(0, 50)}...

配置步骤：
1. 获取 Google Gemini API Key：https://aistudio.google.com/app/apikey
2. 在 .env 文件中设置 GEMINI_API_KEY=您的API密钥
3. 重启服务后即可使用完整的 AI 功能

感谢您的理解！`,
            stream: `这是模拟的流式响应...`,
            explain: `## 知识点解释（模拟）

由于 AI 服务未配置，暂时无法生成个性化解释。

请配置 Gemini API Key 后再试。

**知识点**: ${prompt.slice(0, 30)}...`,
            suggest: `# 学习建议（模拟）

由于 AI 服务未配置，暂时无法生成个性化建议。

请配置 Gemini API Key 后再试。`,
            analyze: `# 薄弱点分析（模拟）

由于 AI 服务未配置，暂时无法生成分析报告。

请配置 Gemini API Key 后再试。`
        };
        return mockResponses[type] || mockResponses.chat;
    }
    getMockResources(knowledgePointName, _resourceTypes, maxResults) {
        // 返回预设的模拟资源
        const resources = [];
        const mockVideos = [
            { title: `${knowledgePointName} - 基础入门`, source: 'B站', quality: 'high', description: '讲解清晰，适合零基础入门' },
            { title: `${knowledgePointName} - 进阶提高`, source: '中国大学MOOC', quality: 'high', description: '系统全面，含大量例题' },
            { title: `${knowledgePointName} - 考研复习`, source: 'B站', quality: 'medium', description: '针对考试重点讲解' }
        ];
        const mockDocs = [
            { title: `${knowledgePointName} 知识笔记`, source: 'GitHub', quality: 'high', description: '整理精美的Markdown笔记' },
            { title: `${knowledgePointName} 公式汇总`, source: '知乎', quality: 'medium', description: '核心公式与定理速查' }
        ];
        const mockPractice = [
            { title: `${knowledgePointName} 练习题库`, source: '大学学习网', quality: 'high', description: '含详细解答' },
            { title: `${knowledgePointName} 历年真题`, source: '考试资源网', quality: 'medium', description: '考研/期末真题汇编' }
        ];
        let count = 0;
        // 添加视频资源
        if (count < maxResults && mockVideos.length > 0) {
            const video = mockVideos[count % mockVideos.length];
            resources.push({
                type: 'video',
                title: video.title,
                source: video.source,
                url: `https://example.com/search?type=video&q=${encodeURIComponent(knowledgePointName)}`,
                duration: '30:00',
                quality: video.quality,
                description: video.description,
                matchReason: '热门教程，推荐观看'
            });
            count++;
        }
        // 添加文档资源
        if (count < maxResults && mockDocs.length > 0) {
            const doc = mockDocs[count % mockDocs.length];
            resources.push({
                type: 'document',
                title: doc.title,
                source: doc.source,
                url: `https://example.com/search?type=doc&q=${encodeURIComponent(knowledgePointName)}`,
                pages: 20,
                quality: doc.quality,
                description: doc.description,
                matchReason: '优质学习资料'
            });
            count++;
        }
        // 添加练习资源
        if (count < maxResults && mockPractice.length > 0) {
            const practice = mockPractice[count % mockPractice.length];
            resources.push({
                type: 'practice',
                title: practice.title,
                source: practice.source,
                url: `https://example.com/search?type=practice&q=${encodeURIComponent(knowledgePointName)}`,
                quality: practice.quality,
                description: practice.description,
                matchReason: '配套练习，强化理解'
            });
        }
        return resources.slice(0, maxResults);
    }
}
// ==================== Export ====================
// 创建默认实例
const geminiService = new GeminiService();
export default geminiService;
export { GeminiService };
//# sourceMappingURL=gemini.js.map