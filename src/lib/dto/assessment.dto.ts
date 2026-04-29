import { CourseDTO } from './learning.dto';
import { UserDTO } from './auth.dto';

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

export interface AttachmentDTO {
  name: string;
  url: string;
  type: string;
  size?: number;
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
  auto_submit_enabled: boolean;
  hard_enforcement: boolean;
  regrade_requests_enabled: boolean;
  questions: QuestionDTO[];
  attachments?: AttachmentDTO[];
  course?: CourseDTO;
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
  auto_submit_enabled: boolean;
  hard_enforcement: boolean;
  shuffle_questions: boolean;
  start_at?: string;
  end_at?: string;
  questions: QuestionDTO[];
  course?: CourseDTO;
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
