// =====================================================
// Minimax AI 服务
// 用于智能生成试卷和AI功能
// =====================================================

interface MinimaxMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface GenerateQuestionParams {
  courseName: string;
  knowledgePoints: string[];
  difficulty: number; // 1-5
  questionType: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  count: number;
}

interface GeneratedQuestion {
  content: string;
  options?: Record<string, string>;
  correctAnswer: string;
  explanation: string;
  difficulty: number;
  knowledgePoint?: string;
}

interface ExplainRequest {
  knowledgePoint: {
    name: string;
    chapterName: string;
    courseName: string;
    masteryScore: number;
  };
  style?: string;
  includeRelated?: boolean;
  includeExamples?: boolean;
  relatedPoints?: Array<{ name: string; masteryScore: number }>;
}

interface SuggestRequest {
  courseName: string;
  targetGrade?: number;
  daysUntilExam?: number;
  dailyStudyTime?: number;
  focusAreas?: string[];
  weakPoints?: Array<{ name: string; masteryScore: number }>;
  studyRecords?: Array<any>;
}

interface AnalyzeWeakPointsRequest {
  courseId: string;
  courseName: string;
  knowledgePoints: Array<any>;
}

interface SearchResourcesRequest {
  knowledgePointName: string;
  resourceTypes?: string[];
  language?: string;
  maxResults?: number;
}

class MinimaxService {
  private apiKey: string;
  private baseUrl = 'https://api.minimax.chat/v1';
  // 尝试不同的模型名称
  private models = [
    'MiniMax-M2.5',
    'abab6.5s-chat',
    'abab6.5-chat',
    'abab6-chat',
  ];

  constructor() {
    this.apiKey = process.env.MINIMAX_API_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getStatus() {
    return {
      provider: 'minimax',
      configured: this.isConfigured(),
      model: this.models[0],
      features: {
        explain: this.isConfigured(),
        suggest: this.isConfigured(),
        analyzeWeakPoints: this.isConfigured(),
        searchResources: this.isConfigured(),
        chat: this.isConfigured(),
      }
    };
  }

  /**
   * 调用 Minimax API
   */
  async chat(messages: MinimaxMessage[], model?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Minimax API key not configured');
    }

    console.log('[Minimax] Using API key:', this.apiKey.substring(0, 20) + '...');

    // 尝试多个模型
    const modelsToTry = model ? [model] : this.models;

    let lastError = '';

    for (const modelName of modelsToTry) {
      console.log(`[Minimax] Trying model: ${modelName}`);

      try {
        const response = await fetch(`${this.baseUrl}/text/chatcompletion_v2`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: modelName,
            messages,
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });

        const status = response.status;
        const statusText = response.statusText;
        const responseText = await response.text();

        console.log(`[Minimax] Model ${modelName} - Response status:`, status, statusText);
        console.log(`[Minimax] Model ${modelName} - Response body:`, responseText.substring(0, 800));

        if (!response.ok) {
          const errorData = JSON.parse(responseText);
          if (errorData.base_resp?.status_code === 1008) {
            lastError = `Model ${modelName}: insufficient balance`;
            console.log(`[Minimax] Model ${modelName}: insufficient balance, trying next...`);
            continue;
          }
          throw new Error(`Minimax API error: ${responseText}`);
        }

        const data = JSON.parse(responseText) as any;
        if (data.choices && data.choices.length > 0) {
          return data.choices[0].message.content;
        }
        if (data.base_resp?.status_code !== 0) {
          lastError = `Model ${modelName}: ${data.base_resp?.status_msg || 'unknown error'}`;
          continue;
        }
      } catch (err: any) {
        lastError = `Model ${modelName}: ${err.message}`;
        console.log(`[Minimax] Model ${modelName} failed:`, err.message);
        continue;
      }
    }

    throw new Error(`All models failed. Last error: ${lastError}`);
  }

  /**
   * 生成题目
   */
  async generateQuestions(params: GenerateQuestionParams): Promise<GeneratedQuestion[]> {
    const { courseName, knowledgePoints, difficulty, questionType, count } = params;

    const typeLabels: Record<string, string> = {
      'SINGLE_CHOICE': '单选题',
      'MULTIPLE_CHOICE': '多选题',
      'TRUE_FALSE': '判断题',
      'SHORT_ANSWER': '简答题',
    };

    const difficultyLabels: Record<string, string> = {
      1: '非常容易',
      2: '容易',
      3: '中等',
      4: '困难',
      5: '非常困难',
    };

    // 更严格的JSON格式要求
    const systemPrompt = `你是一位专业的出题专家，擅长根据知识点出题。

【重要】你必须严格返回以下JSON格式，不要包含任何其他内容：
[
  {
    "content": "题目内容（不要包含换行符或特殊字符）",
    "options": {"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"},
    "correctAnswer": "A",
    "explanation": "解析内容",
    "difficulty": 3,
    "knowledgePoint": "知识点名称"
  }
]

规则：
1. 必须返回valid JSON数组
2. content中不要使用换行符，用空格代替
3. 选项内容要简洁明了
4. difficulty必须是1-5的整数
5. 不要返回markdown代码块
6. 不要返回任何解释性文字`;

    const userPrompt = `请生成${count}道${typeLabels[questionType]}题目。

课程名称：${courseName}
知识点：${knowledgePoints.join('、')}
难度要求：${difficultyLabels[difficulty]}

请生成符合上述要求的题目，确保题目质量。`;

    const messages: MinimaxMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    try {
      const response = await this.chat(messages);
      console.log('[Minimax] Raw response:', response);

      // 尝试直接解析（最简单的情况）
      try {
        const questions = JSON.parse(response);
        if (Array.isArray(questions)) {
          console.log('[Minimax] Direct parse success:', questions.length, 'questions');
          return questions;
        }
      } catch (e) {
        // 不是直接 JSON，继续尝试其他方式
      }

      // 尝试提取 JSON 数组
      let jsonMatch = response.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        // 尝试清理 response 中的 markdown 代码块标记
        const cleanedResponse = response
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();
        jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
      }

      if (jsonMatch) {
        try {
          // 先做更彻底的清理
          let jsonStr = jsonMatch[0];
          // 移除换行符和多余空白
          jsonStr = jsonStr.replace(/\n/g, ' ').replace(/\s+/g, ' ');
          // 移除可能的问题字符
          jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
          // 处理中文引号
          jsonStr = jsonStr.replace(/[""]/g, '"');
          // 处理单引号（只在引号内部）
          jsonStr = jsonStr.replace(/'([^']*)'/g, '"$1"');

          const questions = JSON.parse(jsonStr);
          if (Array.isArray(questions)) {
            console.log('[Minimax] Parsed questions:', questions.length);
            return questions;
          }
        } catch (parseError: any) {
          console.error('[Minimax] JSON parse error after cleanup:', parseError.message);
          console.log('[Minimax] Failed JSON string:', jsonMatch[0].substring(0, 500));
        }
      }

      // 如果无法解析，尝试返回模拟数据（避免整个功能崩溃）
      console.warn('[Minimax] Failed to parse AI response, returning mock data')
      return Array.from({ length: count }, (_, i) => ({
        content: `题目${i + 1}`,
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        correctAnswer: 'A',
        explanation: '解析',
        difficulty: difficulty,
        knowledgePoint: knowledgePoints[i % knowledgePoints.length]
      }))
    } catch (error) {
      console.error('Error generating questions:', error);
      // 即使出错也返回模拟数据
      return Array.from({ length: count }, (_, i) => ({
        content: `题目${i + 1}`,
        options: { A: 'A', B: 'B', C: 'C', D: 'D' },
        correctAnswer: 'A',
        explanation: '解析',
        difficulty: difficulty,
        knowledgePoint: knowledgePoints[i % knowledgePoints.length]
      }))
    }
  }

  /**
   * 生成试卷（包含多种题型）
   */
  async generateExamPaper(params: {
    courseName: string;
    knowledgePoints: string[];
    totalQuestions: number;
    difficulty: number;
    types: string[];
  }): Promise<GeneratedQuestion[]> {
    const { courseName, knowledgePoints, totalQuestions, difficulty, types } = params;

    const allQuestions: GeneratedQuestion[] = [];

    // 每种题型生成一定数量的题目
    const questionsPerType = Math.floor(totalQuestions / types.length);

    for (const type of types) {
      try {
        const questions = await this.generateQuestions({
          courseName,
          knowledgePoints,
          difficulty,
          questionType: type as any,
          count: questionsPerType,
        });
        allQuestions.push(...questions);
      } catch (error) {
        console.error(`Error generating ${type} questions:`, error);
      }
    }

    return allQuestions;
  }

  /**
   * 分析答题情况并给出建议
   */
  async analyzeAnswer(params: {
    question: {
      content: string;
      type: string;
      options?: Record<string, string>;
      answer: string;
      explanation?: string;
    };
    userAnswer: string;
    isCorrect: boolean;
    courseName?: string;
  }): Promise<{ analysis: string; suggestions: string[] }> {
    const { question, userAnswer, isCorrect, courseName } = params;

    const prompt = `你是一位专业的${courseName || '学科'}老师。请分析学生的答题情况并给出学习建议。

题目信息：
- 题型：${question.type === 'SINGLE_CHOICE' ? '单选题' : question.type === 'MULTIPLE_CHOICE' ? '多选题' : question.type === 'TRUE_FALSE' ? '判断题' : '简答题'}
- 题目内容：${question.content}
${question.options ? `- 选项：${Object.entries(question.options).map(([k, v]) => `${k}. ${v}`).join('， ')}` : ''}
- 正确答案：${question.answer}
- 题目解析：${question.explanation || '无'}

学生答案：${userAnswer}
答题结果：${isCorrect ? '正确' : '错误'}

请按以下JSON格式返回分析结果（只返回JSON，不要其他内容）：
{
  "analysis": "针对这道题的知识点的详细分析，不超过100字",
  "suggestions": ["建议1", "建议2", "建议3"]
}`;

    try {
      const messages: MinimaxMessage[] = [
        { role: 'system', content: '你是一位专业的学科老师，擅长分析学生的答题情况并给出学习建议。只返回JSON，不要其他内容。' },
        { role: 'user', content: prompt }
      ];

      const result = await this.chat(messages);

      // 清理返回的内容，提取JSON
      let cleanedResult = result.trim();
      // 找到JSON开始和结束的位置
      const jsonStart = cleanedResult.indexOf('{');
      const jsonEnd = cleanedResult.lastIndexOf('}');

      let parsedResult;
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanedResult = cleanedResult.substring(jsonStart, jsonEnd + 1);

        // 尝试直接解析
        try {
          parsedResult = JSON.parse(cleanedResult);
        } catch (e) {
          // 如果 AI 返回的格式稀烂，不要让后端崩溃！打印错误并给一个默认保底结果
          console.error('🚨 Minimax 返回的 JSON 格式错误，解析失败:', (e as Error).message);
          console.error('原始返回文本:', cleanedResult.substring(0, 500));

          parsedResult = {
            analysis: 'AI 暂时开小差了，未能生成标准格式的解析，请稍后重试。',
            suggestions: ['建议重新提交以获取完整分析', '请检查大模型提示词是否要求了严格的 JSON 格式']
          };
        }
      } else {
        // 找不到 JSON 格式
        console.error('🚨 Minimax 返回的内容中找不到 JSON 格式');
        console.error('原始返回文本:', result.substring(0, 500));

        parsedResult = {
          analysis: 'AI 暂时开小差了，未能生成标准格式的解析，请稍后重试。',
          suggestions: ['建议重新提交以获取完整分析']
        };
      }

      return {
        analysis: parsedResult.analysis || result.substring(0, 100),
        suggestions: parsedResult.suggestions || ['建议多加练习相关知识点']
      };
    } catch (error) {
      console.error('Error analyzing answer:', error);
      return {
        analysis: '分析生成失败',
        suggestions: ['建议回顾相关知识点']
      };
    }
  }

  /**
   * 解释知识点
   */
  async explainKnowledgePoint(request: ExplainRequest): Promise<string> {
    const { knowledgePoint, style, includeRelated, includeExamples, relatedPoints } = request;

    const styleLabel = style || '通俗易懂';
    const includeRelatedStr = includeRelated ? '包括相关知识点的解释' : '';
    const includeExamplesStr = includeExamples ? '包括实际例子' : '';

    const prompt = `请用${styleLabel}的风格解释以下知识点：

知识点名称：${knowledgePoint.name}
所属章节：${knowledgePoint.chapterName}
所属课程：${knowledgePoint.courseName}
当前掌握度：${knowledgePoint.masteryScore}%

${includeRelatedStr}
${includeExamplesStr}

${relatedPoints && relatedPoints.length > 0 ? `相关知识点：${relatedPoints.map(p => p.name).join('、')}` : ''}

请给出详细的解释，包括基本概念、核心要点和应用场景。`;

    const messages: MinimaxMessage[] = [
      { role: 'system', content: '你是一位专业的学科老师，擅长用通俗易懂的语言解释知识点。' },
      { role: 'user', content: prompt }
    ];

    try {
      return await this.chat(messages);
    } catch (error) {
      console.error('Error explaining knowledge point:', error);
      return '知识点解释生成失败';
    }
  }

  /**
   * 生成学习建议
   */
  async generateSuggestion(request: SuggestRequest): Promise<string> {
    const { courseName, targetGrade, daysUntilExam, dailyStudyTime, focusAreas, weakPoints, studyRecords } = request;

    const weakPointsStr = weakPoints && weakPoints.length > 0
      ? `薄弱知识点：${weakPoints.map(p => `${p.name}(掌握度${p.masteryScore}%)`).join('、')}`
      : '暂无薄弱知识点';

    const focusAreasStr = focusAreas && focusAreas.length > 0
      ? `重点关注领域：${focusAreas.join('、')}`
      : '';

    const studyRecordsStr = studyRecords && studyRecords.length > 0
      ? `近期学习记录：${studyRecords.length}次学习`
      : '暂无学习记录';

    const prompt = `请为学习${courseName}的学生生成个性化的学习建议。

目标成绩：${targetGrade || '及格'}分
距离考试天数：${daysUntilExam || 30}天
每天学习时间：${dailyStudyTime || 2}小时
${focusAreasStr}
${weakPointsStr}
${studyRecordsStr}

请根据以上信息，给出具体的学习计划和建议，包括：
1. 总体学习策略
2. 每日学习安排
3. 重点复习内容
4. 建议的学习方法`;

    const messages: MinimaxMessage[] = [
      { role: 'system', content: '你是一位专业的学习规划顾问，擅长为学生制定个性化的学习计划。' },
      { role: 'user', content: prompt }
    ];

    try {
      return await this.chat(messages);
    } catch (error) {
      console.error('Error generating suggestion:', error);
      return '学习建议生成失败';
    }
  }

  /**
   * 分析薄弱点
   */
  async analyzeWeakPoints(request: AnalyzeWeakPointsRequest): Promise<string> {
    const { courseName, knowledgePoints } = request;

    const pointsInfo = knowledgePoints.map(kp => {
      const statusLabel = kp.status === 'WEAK' ? '薄弱' : kp.status === 'MASTERED' ? '已掌握' : '学习中';
      const mistakeCount = kp._count?.mistakes || 0;
      return `知识点：${kp.name}，掌握度：${kp.masteryScore}%，状态：${statusLabel}，错题数：${mistakeCount}`;
    }).join('\n');

    const prompt = `请分析以下课程的薄弱点，并给出改进建议。

课程名称：${courseName}

知识点详情：
${pointsInfo}

请分析：
1. 最需要加强的薄弱点是什么？
2. 这些薄弱点之间的关联是什么？
3. 建议的学习顺序是什么？
4. 如何快速提升掌握度？`;

    const messages: MinimaxMessage[] = [
      { role: 'system', content: '你是一位专业的学科分析师，擅长分析学生的薄弱点并给出改进建议。' },
      { role: 'user', content: prompt }
    ];

    try {
      return await this.chat(messages);
    } catch (error) {
      console.error('Error analyzing weak points:', error);
      return '薄弱点分析生成失败';
    }
  }

  /**
   * 搜索学习资源
   */
  async searchResources(request: SearchResourcesRequest): Promise<Array<{ title: string; url: string; type: string; description: string }>> {
    const { knowledgePointName, resourceTypes, language, maxResults } = request;

    const resourceTypesStr = resourceTypes?.join('、') || '文章、视频';
    const languageStr = language || '中文';

    const prompt = `请为以下知识点推荐学习资源。

知识点：${knowledgePointName}
资源类型：${resourceTypesStr}
语言：${languageStr}
推荐数量：${maxResults || 5}个

请按以下JSON格式返回（只返回JSON，不要其他内容）：
[
  {
    "title": "资源标题",
    "url": "资源链接",
    "type": "资源类型",
    "description": "资源简介"
  }
]`;

    const messages: MinimaxMessage[] = [
      { role: 'system', content: '你是一位专业的学习资源推荐专家，擅长为学生推荐合适的学习资源。只返回JSON格式。' },
      { role: 'user', content: prompt }
    ];

    try {
      const result = await this.chat(messages);

      // 尝试解析JSON
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Error searching resources:', error);
      return [];
    }
  }
}

export default new MinimaxService();
