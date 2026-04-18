export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  sessionId?: string;
  email: string;
  full_name: string;
  role: UserRole;
  xp?: number;
  level?: number;
  phone?: string;
  password?: string;
  created_at: string;
  updated_at?: string;
  active?: boolean;
  failed_attempts?: number;
  lockouts?: number;
  flagged?: boolean;
  locked_until?: string | null;
  reset_request?: Record<string, unknown> | null;
  notification_preferences?: Record<string, boolean>;
  version?: number;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: 'draft' | 'published' | 'archived';
  teacher_id: string;
  thumbnail_url?: string;
  updated_at?: string;
  version?: number;
  metadata?: Record<string, unknown>;
}

export interface Enrollment {
  course_id: string;
  student_id: string;
  enrolled_at?: string;
  progress: number;
  completed: boolean;
  courses?: Course;
  users?: User;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  video_url?: string;
  status: 'draft' | 'published' | 'archived';
  order_index: number;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  due_date: string;
  status: 'draft' | 'published' | 'archived';
  points_possible: number;
  allow_late_submissions: boolean;
  anti_cheat_enabled: boolean;
  regrade_requests_enabled: boolean;
  version?: number;
  questions: AssignmentQuestion[];
  attachments?: Record<string, unknown>[];
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
  teacher_id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  attempts_allowed: number;
  time_limit: number;
  passing_score: number;
  anti_cheat_enabled: boolean;
  shuffle_questions: boolean;
  version?: number;
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
  student_id: string;
  submitted_at: string;
  submission_text?: string;
  file_url?: string;
  answers?: Record<string, unknown>;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  final_grade?: number;
  feedback?: string;
  violation_count?: number;
  version?: number;
  regrade_request?: string;
  assignments?: Assignment;
  graded_at?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  student_id: string;
  submitted_at: string;
  started_at: string;
  answers: Record<string, unknown>;
  score: number;
  total_points: number;
  status: 'in progress' | 'submitted';
  attempt_number?: number;
  time_spent: number;
  violation_count?: number;
  version?: number;
  quizzes?: Quiz;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Maintenance {
  id: string;
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
  user_id: string;
  course_id: string;
  duration: number;
  started_at: string;
  ended_at: string;
}

export interface LiveClass {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  room_name: string;
  meeting_url?: string;
  start_at: string;
  end_at: string;
  actual_end_at?: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  version?: number;
}

export interface Attendance {
  id: string;
  live_class_id: string;
  student_id: string;
  join_time: string;
  leave_time?: string;
  duration?: number;
  is_present: boolean;
}

export interface PlannerItem {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  version?: number;
  created_at: string;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  version?: number;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badges: Badge;
}

export interface Material {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  file_url: string;
  status: 'draft' | 'published' | 'archived';
  version?: number;
  created_at: string;
}

export interface Discussion {
  id: string;
  course_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  version?: number;
  created_at: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface Certificate {
  id: string;
  course_id: string;
  student_id: string;
  issued_at: string;
  certificate_url: string;
  metadata?: Record<string, unknown>;
  courses?: { title: string };
}
