import { CourseDTO } from './learning.dto';
import { UserDTO } from './auth.dto';

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
