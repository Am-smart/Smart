export type UserRole = 'student' | 'teacher' | 'admin';

export interface ResetRequest {
  status: 'pending' | 'approved' | 'denied' | 'approved_used';
  requested_at: string;
  reason?: string;
  risk_level?: string;
  temp_password?: string;
  approved_at?: string;
  expires_at?: string;
  denial_reason?: string;
}

export interface User {
  id: string;
  sessionId: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  password?: string;
  created_at: string;
  updated_at?: string;
  last_login?: string;
  failed_attempts?: number;
  lockouts?: number;
  flagged?: boolean;
  locked_until?: string | null;
  reset_request?: ResetRequest | null;
  notification_preferences?: Record<string, boolean>;
  active?: boolean;
  version?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface UserDTO {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  active?: boolean;
  notification_preferences?: Record<string, boolean>;
  metadata?: Record<string, string | number | boolean>;
  flagged?: boolean;
  failed_attempts?: number;
  lockouts?: number;
  locked_until?: string | null;
  reset_request?: ResetRequest | null;
  sessionId?: string;
}

export interface AuthResponseDTO {
  success: boolean;
  user: UserDTO | null;
  sessionId: string | null;
  error?: string | null;
}

export interface LoginRequestDTO {
  email: string;
  password?: string;
}

export interface SignupRequestDTO {
  email: string;
  password?: string;
  full_name: string;
  role?: UserRole;
  phone?: string;
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
  metadata?: Record<string, string | number | boolean>;
}

export interface CourseDTO {
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
  metadata?: Record<string, string | number | boolean>;
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

export interface EnrollmentDTO {
  course_id: string;
  student_id: string;
  enrolled_at?: string;
  progress: number;
  completed: boolean;
  course?: CourseDTO;
  student?: UserDTO;
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

export interface LessonDTO {
  id: string;
  course_id: string;
  title: string;
  content: string;
  video_url?: string;
  order_index: number;
  created_at?: string;
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export interface AttachmentDTO {
  name: string;
  url: string;
  type: string;
  size?: number;
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
  hard_enforcement: boolean;
  regrade_requests_enabled: boolean;
  late_penalty_applied?: number; // Added from Submission
  late_penalty_per_day?: number;
  allowed_extensions?: string[];
  created_at?: string;
  updated_at?: string;
  version?: number;
  questions: AssignmentQuestion[];
  attachments?: Attachment[];
  courses?: Course;
}

export interface QuestionDTO {
  id: string;
  text: string;
  type: 'mcq' | 'tf' | 'short' | 'essay' | 'file' | 'link';
  points: number;
  options?: string[];
  correct_answer?: string | number;
  hint?: string;
  explanation?: string;
  extensions?: string;
}

export interface AssignmentDTO {
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
  late_penalty_per_day?: number;
  allowed_extensions?: string[];
  anti_cheat_enabled: boolean;
  hard_enforcement: boolean;
  regrade_requests_enabled: boolean;
  questions: QuestionDTO[];
  attachments?: AttachmentDTO[];
  course?: CourseDTO;
  metadata?: Record<string, string | number | boolean>;
}

export interface AssignmentQuestion {
  id: string;
  text: string;
  type: 'essay' | 'file' | 'link';
  points: number;
  correct_answer?: string | number;
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

export interface QuizDTO {
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
  hard_enforcement: boolean;
  shuffle_questions: boolean;
  start_at?: string;
  end_at?: string;
  questions: QuestionDTO[];
  course?: CourseDTO;
  metadata?: Record<string, string | number | boolean>;
}

export interface QuizQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'tf' | 'short';
  points: number;
  options?: string[];
  correct_answer?: string | number;
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
  answers?: Record<string, string | number | boolean>;
  question_scores?: Record<string, number>;
  response_feedback?: Record<string, string>;
  late_penalty_applied?: number;
  attachments?: Attachment[];
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

export interface SubmissionDTO {
  id: string;
  assignment_id: string;
  student_id: string;
  submitted_at: string;
  status: 'draft' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  final_grade?: number;
  late_penalty_applied?: number;
  feedback?: string;
  regrade_request?: string | null;
  submission_text?: string;
  file_url?: string;
  answers?: Record<string, string | number | boolean>;
  question_scores?: Record<string, number>;
  response_feedback?: Record<string, string>;
  violation_count?: number;
  assignment?: AssignmentDTO;
  student?: UserDTO;
}

export interface QuizSubmission {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_points: number;
  answers: Record<string, string | number | boolean>;
  analytics?: Record<string, string | number | boolean>;
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

export interface QuizSubmissionDTO {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
  total_points: number;
  status: 'in progress' | 'submitted';
  time_spent: number;
  started_at: string;
  answers?: Record<string, string | number | boolean>;
  submitted_at: string;
  violation_count?: number;
  quiz?: QuizDTO;
  student?: UserDTO;
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

export interface NotificationDTO {
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

export interface BroadcastDTO {
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

export interface MaintenanceDTO {
  id: string;
  enabled: boolean;
  message?: string;
  schedules: MaintenanceSchedule[];
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

export interface PlannerItemDTO {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  created_at: string;
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
  recurring_config?: Record<string, string | number | boolean>;
  metadata?: Record<string, string | number | boolean>;
  start_at: string;
  end_at: string;
  actual_end_at?: string | null;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  version?: number;
  created_at?: string;
  updated_at?: string;
  courses?: Course;
}

export interface LiveClassDTO {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  room_name: string;
  meeting_url?: string;
  start_at: string;
  end_at: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  course?: CourseDTO;
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

export interface MaterialDTO {
  id: string;
  course_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  created_at: string;
  course?: CourseDTO;
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

export interface DiscussionDTO {
  id: string;
  course_id: string;
  user_id: string;
  parent_id?: string;
  title?: string;
  content: string;
  created_at: string;
  user?: UserDTO;
}

export interface SystemLog {
  id?: string;
  level: string;
  category: string;
  message: string;
  metadata?: Record<string, string | number | boolean>;
  user_id?: string;
  created_at?: string;
  users?: {
    full_name: string;
    email: string;
  };
}

export interface SystemLogDTO {
  id?: string;
  level: string;
  category: string;
  message: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
  created_at?: string;
  user?: UserDTO;
}

export interface Setting {
  key: string;
  value: string | number | boolean | Record<string, string | number | boolean>;
  updated_at?: string;
}

export interface SettingDTO {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
}
