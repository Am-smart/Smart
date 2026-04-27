import { UserDTO } from './auth.dto';

export interface CourseDTO {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  teacher_id: string;
  thumbnail_url?: string;
  created_at?: string;
  updated_at?: string;
  version?: number;
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

export interface LessonDTO {
  id: string;
  course_id: string;
  title: string;
  content: string;
  video_url?: string;
  order_index: number;
  created_at?: string;
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
