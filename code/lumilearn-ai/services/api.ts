// API Base URL - should match your backend server
const API_BASE = 'http://localhost:3000/api'

// ==================== Type Definitions ====================

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Exam Task types (matching backend schema)
export interface ExamTask {
  id: string
  courseId: string
  type: 'CHAPTER_REVIEW' | 'MOCK_EXAM' | 'WEAK_POINT'
  scheduledDate: string
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
  estimatedDuration: number
  round: number
  details?: string
  createdAt: string
  updatedAt: string
  course?: {
    id: string
    name: string
    status: string
  }
}

// Mistake types
export interface Mistake {
  id: string
  courseId: string
  knowledgePointId: string
  question: string
  userAnswer: string
  correctAnswer: string
  reason?: string
  createdAt: string
  course?: {
    id: string
    name: string
  }
  knowledgePoint?: {
    id: string
    name: string
    status: string
    masteryScore: number
  }
}

// Weak Point type
export interface WeakPoint {
  id: string
  name: string
  status: string
  masteryScore: number
  mistakeCount: number
  chapter: {
    id: string
    name: string
  }
  course: {
    id: string
    name: string
  }
}

// Course types
export interface Course {
  id: string
  name: string
  status: 'STUDYING' | 'REVIEWING' | 'ARCHIVED'
  type: 'PROFESSIONAL' | 'CROSS_MAJOR' | 'ELECTIVE'
  examDate?: string
  reviewStartDate?: string
  targetGrade?: string
  createdAt: string
  updatedAt: string
}

// Chapter types
export interface Chapter {
  id: string
  courseId: string
  name: string
  order: number
  createdAt: string
}

// Knowledge Point types
export interface KnowledgePoint {
  id: string
  chapterId: string
  name: string
  status: 'MASTERED' | 'WEAK' | 'NEED_REVIEW' | 'TODAY_REVIEW'
  importance: number
  masteryScore: number
  createdAt: string
  updatedAt: string
}

// ==================== Helper Functions ====================

// Generic fetch wrapper with error handling
async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers
      }
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error ${response.status}`
      }
    }

    return {
      success: true,
      data: data.data,
      message: data.message
    }
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

// ==================== Exam Tasks API ====================

export const examTasksApi = {
  // Get all exam tasks with optional filters
  getAll: async (params?: {
    courseId?: string
    status?: string
    round?: number
    date?: string
  }): Promise<ApiResponse<ExamTask[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.courseId) queryParams.append('courseId', params.courseId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.round) queryParams.append('round', params.round.toString())
    if (params?.date) queryParams.append('date', params.date)

    const query = queryParams.toString()
    return fetchApi<ExamTask[]>(`/exam-tasks${query ? `?${query}` : ''}`)
  },

  // Get today's tasks
  getToday: async (): Promise<ApiResponse<ExamTask[]>> => {
    return fetchApi<ExamTask[]>('/exam-tasks/today')
  },

  // Get single task by ID
  getById: async (id: string): Promise<ApiResponse<ExamTask>> => {
    return fetchApi<ExamTask>(`/exam-tasks/${id}`)
  },

  // Create new exam task
  create: async (data: {
    courseId: string
    type: 'CHAPTER_REVIEW' | 'MOCK_EXAM' | 'WEAK_POINT'
    scheduledDate: string
    estimatedDuration: number
    round?: number
    details?: Record<string, unknown>
  }): Promise<ApiResponse<ExamTask>> => {
    return fetchApi<ExamTask>('/exam-tasks', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Update exam task
  update: async (id: string, data: Partial<{
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
    type: 'CHAPTER_REVIEW' | 'MOCK_EXAM' | 'WEAK_POINT'
    scheduledDate: string
    estimatedDuration: number
    round: number
    details: string | Record<string, unknown>
  }>): Promise<ApiResponse<ExamTask>> => {
    return fetchApi<ExamTask>(`/exam-tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Quick complete task
  complete: async (id: string): Promise<ApiResponse<ExamTask>> => {
    return fetchApi<ExamTask>(`/exam-tasks/${id}/complete`, {
      method: 'PATCH'
    })
  },

  // Delete exam task
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/exam-tasks/${id}`, {
      method: 'DELETE'
    })
  }
}

// ==================== Mistakes API ====================

export const mistakesApi = {
  // Get all mistakes with optional filters
  getAll: async (params?: {
    courseId?: string
    knowledgePointId?: string
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<Mistake[]>> => {
    const queryParams = new URLSearchParams()
    if (params?.courseId) queryParams.append('courseId', params.courseId)
    if (params?.knowledgePointId) queryParams.append('knowledgePointId', params.knowledgePointId)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)

    const query = queryParams.toString()
    return fetchApi<Mistake[]>(`/mistakes${query ? `?${query}` : ''}`)
  },

  // Get single mistake by ID
  getById: async (id: string): Promise<ApiResponse<Mistake>> => {
    return fetchApi<Mistake>(`/mistakes/${id}`)
  },

  // Create new mistake record
  create: async (data: {
    courseId: string
    knowledgePointId: string
    question: string
    userAnswer: string
    correctAnswer: string
    reason?: string
  }): Promise<ApiResponse<Mistake>> => {
    return fetchApi<Mistake>('/mistakes', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Delete mistake
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/mistakes/${id}`, {
      method: 'DELETE'
    })
  },

  // Get weak points (knowledge points with high mistake counts)
  getWeakPoints: async (courseId?: string): Promise<ApiResponse<WeakPoint[]>> => {
    const query = courseId ? `?courseId=${courseId}` : ''
    return fetchApi<WeakPoint[]>(`/mistakes/weak-points${query}`)
  }
}

// ==================== Courses API ====================

export const coursesApi = {
  // Get all courses
  getAll: async (): Promise<ApiResponse<Course[]>> => {
    return fetchApi<Course[]>('/courses')
  },

  // Get single course by ID
  getById: async (id: string): Promise<ApiResponse<Course>> => {
    return fetchApi<Course>(`/courses/${id}`)
  },

  // Create new course
  create: async (data: {
    name: string
    status?: 'STUDYING' | 'REVIEWING' | 'ARCHIVED'
    type?: 'PROFESSIONAL' | 'CROSS_MAJOR' | 'ELECTIVE'
    examDate?: string
    reviewStartDate?: string
    targetGrade?: string
  }): Promise<ApiResponse<Course>> => {
    return fetchApi<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Update course
  update: async (id: string, data: Partial<{
    name: string
    status: 'STUDYING' | 'REVIEWING' | 'ARCHIVED'
    type: 'PROFESSIONAL' | 'CROSS_MAJOR' | 'ELECTIVE'
    examDate: string
    reviewStartDate: string
    targetGrade: string
  }>): Promise<ApiResponse<Course>> => {
    return fetchApi<Course>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Delete course
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/courses/${id}`, {
      method: 'DELETE'
    })
  }
}

// ==================== Knowledge Points API ====================

export const knowledgePointsApi = {
  // Get all knowledge points (optionally by chapter)
  getAll: async (chapterId?: string): Promise<ApiResponse<KnowledgePoint[]>> => {
    const query = chapterId ? `?chapterId=${chapterId}` : ''
    return fetchApi<KnowledgePoint[]>(`/knowledge-points${query}`)
  },

  // Get single knowledge point by ID
  getById: async (id: string): Promise<ApiResponse<KnowledgePoint>> => {
    return fetchApi<KnowledgePoint>(`/knowledge-points/${id}`)
  },

  // Create new knowledge point
  create: async (data: {
    chapterId: string
    name: string
    status?: 'MASTERED' | 'WEAK' | 'NEED_REVIEW' | 'TODAY_REVIEW'
    importance?: number
  }): Promise<ApiResponse<KnowledgePoint>> => {
    return fetchApi<KnowledgePoint>('/knowledge-points', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  // Update knowledge point
  update: async (id: string, data: Partial<{
    name: string
    status: 'MASTERED' | 'WEAK' | 'NEED_REVIEW' | 'TODAY_REVIEW'
    importance: number
    masteryScore: number
  }>): Promise<ApiResponse<KnowledgePoint>> => {
    return fetchApi<KnowledgePoint>(`/knowledge-points/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  // Delete knowledge point
  delete: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/knowledge-points/${id}`, {
      method: 'DELETE'
    })
  }
}

export default {
  examTasks: examTasksApi,
  mistakes: mistakesApi,
  courses: coursesApi,
  knowledgePoints: knowledgePointsApi
}
