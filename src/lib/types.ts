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
  last_login?: string;
  failed_attempts?: number;
  lockouts?: number;
  flagged?: boolean;
  locked_until?: string | null;
  reset_request?: Record<string, unknown> | null;
  notification_preferences?: Record<string, boolean>;
  active?: boolean;
  version?: number;
  metadata?: Record<string, unknown>;
}

export interface Course {
  id: string;
  course_id?: string;
  created_by?: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  teacher_id: string;
  thumbnail_url?: string;
  created_at?: string;
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
  start_at?: string;
  due_date: string;
  status: 'draft' | 'published';
  points_possible: number;
  allow_late_submissions: boolean;
  anti_cheat_enabled: boolean;
  auto_submit_enabled: boolean;
  hard_enforcement: boolean;
  regrade_requests_enabled: boolean;
  late_penalty_per_day?: number;
  allowed_extensions?: string[];
  created_at?: string;
  updated_at?: string;
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
  status: 'draft' | 'published';
  attempts_allowed: number;
  time_limit: number;
  passing_score: number;
  anti_cheat_enabled: boolean;
  auto_submit_enabled: boolean;
  hard_enforcement: boolean;
  shuffle_questions: boolean;
  start_at?: string;
  end_at?: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
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
  updated_at?: string;
  submission_text?: string;
  file_url?: string;
  answers?: Record<string, unknown>;
  question_scores?: Record<string, number>;
  response_feedback?: Record<string, string>;
  late_penalty_applied?: number;
  attachments?: Record<string, unknown>[];
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  final_grade?: number;
  feedback?: string;
  regrade_request?: string | null;
  graded_at?: string;
  violation_count?: number;
  version?: number;
  assignments?: Assignment;
  users?: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_points: number;
  answers: Record<string, unknown>;
  analytics?: Record<string, unknown>;
  status: 'in progress' | 'submitted';
  time_spent: number;
  started_at: string;
  submitted_at: string;
  updated_at?: string;
  violation_count?: number;
  version?: number;
  attempt_number?: number;
  quizzes?: Quiz;
  users?: {
    id: string;
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

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  user_agent?: string;
  ip_address?: string;
}

export interface Broadcast {
  id: string;
  course_id: string | null;
  target_role?: string | null;
  title: string;
  message: string;
  link?: string;
  type: string;
  expires_at?: string;
  created_at: string;
}

export interface Maintenance {
  id: string;
  enabled: boolean;
  manual_until?: string;
  message?: string;
  schedules: MaintenanceSchedule[];
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceSchedule {
  start_at: string;
  end_at: string;
  reason?: string;
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
  updated_at?: string;
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

export interface Badge {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  xp_required?: number;
  version?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UserBadge {
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badges?: Badge;
}

export interface StudySession {
  id: string;
  user_id: string;
  course_id: string;
  duration: number;
  started_at: string;
  ended_at: string;
}

export interface LessonCompletion {
  id: string;
  student_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface LiveClass {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  room_name: string;
  meeting_url?: string;
  recording_url?: string;
  recurring_config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  start_at: string;
  end_at: string;
  actual_end_at?: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  version?: number;
  created_at?: string;
  updated_at?: string;
  courses?: Course;
}

export interface Attendance {
  id: string;
  live_class_id: string;
  student_id: string;
  join_time: string;
  leave_time?: string;
  duration?: number;
  is_present: boolean;
  created_at?: string;
}

export interface Material {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  courses?: Course;
}

export interface Discussion {
  id: string;
  course_id: string;
  user_id: string;
  parent_id?: string;
  title?: string;
  content: string;
  version?: number;
  created_at: string;
  updated_at?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface SystemLog {
  id?: string;
  level: string;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
  created_at?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface Setting {
  key: string;
  value: unknown;
  updated_at?: string;
}
