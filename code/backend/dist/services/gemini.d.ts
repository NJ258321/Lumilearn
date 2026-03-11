export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}
export interface ChatContext {
    messages: ChatMessage[];
    systemInstruction?: string;
}
export interface ExplainRequest {
    knowledgePoint: {
        name: string;
        chapterName: string;
        courseName: string;
        masteryScore: number;
    };
    style: 'brief' | 'detailed' | 'example';
    includeRelated: boolean;
    includeExamples: boolean;
    relatedPoints?: Array<{
        name: string;
        masteryScore: number;
    }>;
}
export interface SuggestRequest {
    courseName: string;
    targetGrade: string;
    daysUntilExam: number;
    dailyStudyTime: number;
    focusAreas: string[];
    weakPoints?: Array<{
        name: string;
        masteryScore: number;
        mistakeRate: number;
    }>;
    studyRecords?: Array<{
        title: string;
        duration: number;
    }>;
}
export interface WeakPointAnalysis {
    knowledgePoint: {
        id: string;
        name: string;
        masteryScore: number;
        status: string;
    };
    mistakeRate: number;
    reviewMissCount: number;
    lastReviewDate?: string;
    avgTimeSpent: number;
    errorPatterns?: string[];
}
export interface AnalyzeWeakPointsRequest {
    courseId: string;
    courseName: string;
    knowledgePoints: WeakPointAnalysis[];
}
export interface ResourceResult {
    type: 'video' | 'document' | 'practice';
    title: string;
    source: string;
    url: string;
    duration?: string;
    pages?: number;
    quality: 'high' | 'medium' | 'low';
    description: string;
    matchReason?: string;
}
export interface SearchResourcesRequest {
    knowledgePointName: string;
    resourceTypes: ('video' | 'document' | 'practice')[];
    language: string;
    maxResults: number;
}
export interface GeminiConfig {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
}
declare class GeminiService {
    private client;
    private config;
    private isConfigured;
    constructor(config?: Partial<GeminiConfig>);
    private initialize;
    /**
     * 检查服务是否可用
     */
    isAvailable(): boolean;
    /**
     * 获取服务状态
     */
    getStatus(): {
        available: boolean;
        model: string;
        mode: string;
    };
    /**
     * 基础对话
     */
    chat(prompt: string, context?: ChatContext): Promise<string>;
    /**
     * 流式对话
     */
    streamChat(prompt: string, context?: ChatContext): AsyncGenerator<string, void, unknown>;
    /**
     * 知识点解释生成
     */
    explainKnowledgePoint(request: ExplainRequest): Promise<string>;
    /**
     * 学习建议生成
     */
    generateSuggestion(request: SuggestRequest): Promise<string>;
    /**
     * 薄弱点分析
     */
    analyzeWeakPoints(request: AnalyzeWeakPointsRequest): Promise<string>;
    /**
     * 资源检索（模拟）
     * 注意：实际生产中应该调用外部 API（如 B站、慕课 API）
     */
    searchResources(request: SearchResourcesRequest): Promise<ResourceResult[]>;
    private chunkText;
    private getMockResponse;
    private getMockResources;
}
declare const geminiService: GeminiService;
export default geminiService;
export { GeminiService };
//# sourceMappingURL=gemini.d.ts.map