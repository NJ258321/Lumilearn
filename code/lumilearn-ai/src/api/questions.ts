// =====================================================
// P6 - 题目管理 API
// =====================================================

import { api, API_CONFIG } from './request';
import type {
  ApiResponse,
  Question,
  QuestionFilters,
  QuestionListResponse,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  ImportQuestionsRequest,
  ImportQuestionsResponse,
  ExportQuestionsRequest,
  ExportQuestionsResponse,
} from '../../src/types/api';

// 获取题目列表
export async function getQuestionList(
  filters?: QuestionFilters
): Promise<ApiResponse<QuestionListResponse>> {
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
      ? `${API_CONFIG.endpoints.questions.list}?${queryString}`
      : API_CONFIG.endpoints.questions.list;
    return await api.get<QuestionListResponse>(url);
  } catch (error) {
    console.error('[questions] getQuestionList error:', error);
    return { success: false, error: '获取题目列表失败' };
  }
}

// 获取题目详情
export async function getQuestionDetail(
  id: string
): Promise<ApiResponse<Question>> {
  try {
    return await api.get<Question>(API_CONFIG.endpoints.questions.detail(id));
  } catch (error) {
    console.error('[questions] getQuestionDetail error:', error);
    return { success: false, error: '获取题目详情失败' };
  }
}

// 创建题目
export async function createQuestion(
  data: CreateQuestionRequest
): Promise<ApiResponse<Question>> {
  try {
    return await api.post<Question>(
      API_CONFIG.endpoints.questions.create,
      data
    );
  } catch (error) {
    console.error('[questions] createQuestion error:', error);
    return { success: false, error: '创建题目失败' };
  }
}

// 更新题目
export async function updateQuestion(
  id: string,
  data: UpdateQuestionRequest
): Promise<ApiResponse<Question>> {
  try {
    return await api.put<Question>(
      API_CONFIG.endpoints.questions.update(id),
      data
    );
  } catch (error) {
    console.error('[questions] updateQuestion error:', error);
    return { success: false, error: '更新题目失败' };
  }
}

// 删除题目
export async function deleteQuestion(
  id: string
): Promise<ApiResponse<{ message: string; hardDeleted?: boolean; softDeleted?: boolean }>> {
  try {
    return await api.delete(API_CONFIG.endpoints.questions.delete(id));
  } catch (error) {
    console.error('[questions] deleteQuestion error:', error);
    return { success: false, error: '删除题目失败' };
  }
}

// 批量导入题目
export async function importQuestions(
  data: ImportQuestionsRequest
): Promise<ApiResponse<ImportQuestionsResponse>> {
  try {
    return await api.post<ImportQuestionsResponse>(
      API_CONFIG.endpoints.questions.import,
      data
    );
  } catch (error) {
    console.error('[questions] importQuestions error:', error);
    return { success: false, error: '导入题目失败' };
  }
}

// 导出题目
export async function exportQuestions(
  params?: ExportQuestionsRequest
): Promise<ApiResponse<ExportQuestionsResponse>> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.courseId) searchParams.append('courseId', params.courseId);
    if (params?.format) searchParams.append('format', params.format);
    const queryString = searchParams.toString();
    const url = queryString
      ? `${API_CONFIG.endpoints.questions.export}?${queryString}`
      : API_CONFIG.endpoints.questions.export;
    return await api.get<ExportQuestionsResponse>(url);
  } catch (error) {
    console.error('[questions] exportQuestions error:', error);
    return { success: false, error: '导出题目失败' };
  }
}
