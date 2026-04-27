import { Assignment, Quiz, Submission, QuizSubmission } from '../types';
import { CourseDTO } from './learning.dto';
import { UserDTO } from './auth.dto';

export interface QuestionDTO {
  id: string;
  question_text: string;
  question_type: string;
  points: number;
  options?: string[];
}

export interface AttachmentDTO {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
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
  feedback?: string;
  submission_text?: string;
  file_url?: string;
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
  submitted_at: string;
  quiz?: QuizDTO;
  student?: UserDTO;
}
