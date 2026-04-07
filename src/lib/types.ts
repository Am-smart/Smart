export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  email: string;
  full_name?: string;
  role: UserRole;
  xp?: number;
  level?: number;
  phone?: string;
  password?: string;
  updated_at?: string;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'draft' | 'published' | 'archived';
  teacher_email: string;
  thumbnail_url?: string;
  updated_at?: string;
}

export interface Enrollment {
  id: string;
  course_id: string;
  student_email: string;
  progress: number;
  completed: boolean;
  courses?: Course;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'draft' | 'published';
  points_possible: number;
  allow_late_submissions: boolean;
  anti_cheat_enabled: boolean;
  questions: AssignmentQuestion[];
  courses?: Course;
}

export interface AssignmentQuestion {
  text: string;
  type: 'essay' | 'file' | 'link';
  points: number;
  extensions?: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published';
  attempts_allowed: number;
  time_limit: number;
  anti_cheat_enabled: boolean;
  shuffle_questions: boolean;
  start_at?: string;
  end_at?: string;
  questions: QuizQuestion[];
  courses?: Course;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  type: 'mcq' | 'tf' | 'short';
  points: number;
  options?: string[];
  correct_answer: string | number;
  hint?: string;
  explanation?: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_email: string;
  submitted_at: string;
  submission_text?: string;
  file_url?: string;
  answers?: Record<number, string>;
  status: 'draft' | 'submitted' | 'graded';
  grade?: number;
  final_grade?: number;
  feedback?: string;
  violation_count?: number;
  regrade_request?: string;
  assignments?: Assignment;
  graded_at?: string;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  student_email: string;
  submitted_at: string;
  started_at: string;
  answers: Record<number, string | number>;
  score: number;
  total_points: number;
  status: 'draft' | 'submitted';
  time_spent: number;
  violation_count?: number;
  quizzes?: Quiz;
}

export interface Notification {
  id: string;
  user_email: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Maintenance {
  enabled: boolean;
  schedules: MaintenanceSchedule[];
}

export interface MaintenanceSchedule {
  start_at: string;
  end_at: string;
  reason?: string;
}

export interface StudySession {
  id: string;
  user_email: string;
  course_id: string;
  duration: number;
  started_at: string;
  ended_at: string;
}

export interface LiveClass {
  id: string;
  course_id: string;
  teacher_email: string;
  title: string;
  room_name: string;
  meeting_url?: string;
  start_at: string;
  end_at: string;
  status: 'scheduled' | 'live' | 'ended';
}

export interface Attendance {
  id: string;
  live_class_id: string;
  student_email: string;
  join_time: string;
  leave_time?: string;
  duration?: number;
  is_present: boolean;
}

export interface PlannerItem {
  id: string;
  user_email: string;
  title: string;
  due_date: string;
  completed: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon_url: string;
}

export interface UserBadge {
  user_email: string;
  badge_id: string;
  awarded_at: string;
  badges: Badge;
}

export interface Material {
  id: string;
  course_id: string;
  title: string;
  file_url: string;
  created_at: string;
}

export interface Discussion {
  id: string;
  course_id: string;
  user_email: string;
  content: string;
  parent_id?: string;
  created_at: string;
}
