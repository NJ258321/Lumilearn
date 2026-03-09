
export enum AppView {
  DASHBOARD = 'DASHBOARD',
  COURSES = 'COURSES',
  AGENT = 'AGENT',
  DRILL = 'DRILL',
  TIME_MACHINE = 'TIME_MACHINE',
  RECORDER = 'RECORDER',
  COURSE_DETAIL_REVIEW = 'COURSE_DETAIL_REVIEW',
  COURSE_DETAIL_STUDY = 'COURSE_DETAIL_STUDY',
  ANALYSIS = 'ANALYSIS'
}

export interface Task {
  id: string;
  courseName: string;
  title: string;
  duration: string;
  status: 'pending' | 'in-progress' | 'completed';
  type: 'review' | 'quiz' | 'paper' | 'mistake';
  tag: string; // e.g. "一轮复习"
}

export interface TaskGroup {
  courseId: string;
  courseName: string;
  tag: string;
  tagColor: 'red' | 'orange' | 'blue';
  progress: string;
  tasks: Task[];
}

export interface Course {
  id: string;
  name: string;
  lastReview?: string;
  status: 'reviewing' | 'studying' | 'archived';
  type: 'major' | 'elective';
  semester: string; // e.g. "2024-2025 秋季"
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

export interface TranscriptSegment {
  time: number; // seconds
  text: string;
  isKeypoint?: boolean;
}
