// =====================================================
// P6 - 考试与练习 API
// =====================================================

import { api, API_CONFIG } from './request';
import type {
  ApiResponse,
  ExamSession,
  AnswerRecord,
  AnswerRecordListResponse,
  GenerateExamRequest,
  GenerateExamResponse,
  GenerateByFiltersRequest,
  RandomDrawRequest,
  RandomDrawResponse,
  ChallengeRequest,
  ChallengeResponse,
  DailyPracticeResponse,
  CreateSessionRequest,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  SubmitExamResponse,
  ExamStatisticsResponse,
  MistakesResponse,
  RetryMistakesRequest,
  RetryMistakesResponse,
  PersonalizedPracticeRequest,
  PersonalizedPracticeResponse,
} from '../../src/types/api';

// AI 智能组卷
export async function generateExam(
  data: GenerateExamRequest
): Promise<ApiResponse<GenerateExamResponse>> {
  try {
    return await api.post<GenerateExamResponse>(
      API_CONFIG.endpoints.exams.generate,
      data
    );
  } catch (error) {
    console.error('[exams] generateExam error:', error);
    return { success: false, error: '生成试卷失败' };
  }
}

// 按条件组卷
export async function generateExamByFilters(
  data: GenerateByFiltersRequest
): Promise<ApiResponse<GenerateExamResponse>> {
  try {
    return await api.post<GenerateExamResponse>(
      API_CONFIG.endpoints.exams.generateByFilters,
      data
    );
  } catch (error) {
    console.error('[exams] generateExamByFilters error:', error);
    return { success: false, error: '条件组卷失败' };
  }
}

// 随机抽题
export async function randomDraw(
  data: RandomDrawRequest
): Promise<ApiResponse<RandomDrawResponse>> {
  try {
    return await api.post<RandomDrawResponse>(
      API_CONFIG.endpoints.exams.random,
      data
    );
  } catch (error) {
    console.error('[exams] randomDraw error:', error);
    return { success: false, error: '随机抽题失败' };
  }
}

// 每日一练
export async function getDailyPractice(
  courseId?: string,
  difficulty?: number
): Promise<ApiResponse<DailyPracticeResponse>> {
  try {
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (difficulty) params.append('difficulty', String(difficulty));
    const queryString = params.toString();
    const url = queryString
      ? `${API_CONFIG.endpoints.exams.dailyPractice}?${queryString}`
      : API_CONFIG.endpoints.exams.dailyPractice;
    return await api.get<DailyPracticeResponse>(url);
  } catch (error) {
    console.error('[exams] getDailyPractice error:', error);
    return { success: false, error: '获取每日一练失败' };
  }
}

// 挑战模式
export async function startChallenge(
  data: ChallengeRequest
): Promise<ApiResponse<ChallengeResponse>> {
  try {
    return await api.post<ChallengeResponse>(
      API_CONFIG.endpoints.exams.challenge,
      data
    );
  } catch (error) {
    console.error('[exams] startChallenge error:', error);
    return { success: false, error: '开启挑战模式失败' };
  }
}

// 创建答题会话
export async function createSession(
  data: CreateSessionRequest
): Promise<ApiResponse<ExamSession>> {
  try {
    return await api.post<ExamSession>(
      API_CONFIG.endpoints.exams.sessions,
      data
    );
  } catch (error) {
    console.error('[exams] createSession error:', error);
    return { success: false, error: '创建会话失败' };
  }
}

// 提交答案
export async function submitAnswer(
  sessionId: string,
  data: SubmitAnswerRequest
): Promise<ApiResponse<SubmitAnswerResponse>> {
  try {
    return await api.post<SubmitAnswerResponse>(
      API_CONFIG.endpoints.exams.sessionAnswers(sessionId),
      data
    );
  } catch (error) {
    console.error('[exams] submitAnswer error:', error);
    return { success: false, error: '提交答案失败' };
  }
}

// 交卷
export async function submitExam(
  sessionId: string
): Promise<ApiResponse<SubmitExamResponse>> {
  try {
    return await api.post<SubmitExamResponse>(
      API_CONFIG.endpoints.exams.sessionSubmit(sessionId),
      {}
    );
  } catch (error) {
    console.error('[exams] submitExam error:', error);
    return { success: false, error: '交卷失败' };
  }
}

// 获取答题记录
export async function getAnswerRecords(
  filters?: {
    questionId?: string
    isCorrect?: boolean
    page?: number
    pageSize?: number
  }
): Promise<ApiResponse<AnswerRecordListResponse>> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const queryString = params.toString();
    const url = queryString
      ? `${API_CONFIG.endpoints.exams.records}?${queryString}`
      : API_CONFIG.endpoints.exams.records;
    return await api.get<AnswerRecordListResponse>(url);
  } catch (error) {
    console.error('[exams] getAnswerRecords error:', error);
    return { success: false, error: '获取答题记录失败' };
  }
}

// 获取答题统计
export async function getExamStatistics(
  courseId?: string
): Promise<ApiResponse<ExamStatisticsResponse>> {
  try {
    const url = courseId
      ? `${API_CONFIG.endpoints.exams.statistics}?courseId=${courseId}`
      : API_CONFIG.endpoints.exams.statistics;
    return await api.get<ExamStatisticsResponse>(url);
  } catch (error) {
    console.error('[exams] getExamStatistics error:', error);
    return { success: false, error: '获取答题统计失败' };
  }
}

// 获取错题本
export async function getMistakes(
  knowledgePointId?: string
): Promise<ApiResponse<MistakesResponse>> {
  try {
    const url = knowledgePointId
      ? `${API_CONFIG.endpoints.exams.mistakes}?knowledgePointId=${knowledgePointId}`
      : API_CONFIG.endpoints.exams.mistakes;
    return await api.get<MistakesResponse>(url);
  } catch (error) {
    console.error('[exams] getMistakes error:', error);
    return { success: false, error: '获取错题本失败' };
  }
}

// 错题重做
export async function retryMistakes(
  data: RetryMistakesRequest
): Promise<ApiResponse<RetryMistakesResponse>> {
  try {
    return await api.post<RetryMistakesResponse>(
      API_CONFIG.endpoints.exams.mistakesRetry,
      data
    );
  } catch (error) {
    console.error('[exams] retryMistakes error:', error);
    return { success: false, error: '错题重做失败' };
  }
}

// 个性化练习
export async function getPersonalizedPractice(
  data: PersonalizedPracticeRequest
): Promise<ApiResponse<PersonalizedPracticeResponse>> {
  try {
    return await api.post<PersonalizedPracticeResponse>(
      API_CONFIG.endpoints.exams.personalizedPractice,
      data
    );
  } catch (error) {
    console.error('[exams] getPersonalizedPractice error:', error);
    return { success: false, error: '获取个性化练习失败' };
  }
}
