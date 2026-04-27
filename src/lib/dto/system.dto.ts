import { PlannerItem, Maintenance, Setting, SystemLog } from '../types';
import { UserDTO } from './auth.dto';

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

export interface ScheduleDTO {
  id: string;
  start_time: string;
  end_time: string;
  reason?: string;
}

export interface MaintenanceDTO {
  enabled: boolean;
  message?: string;
  schedules: ScheduleDTO[];
}

export interface SettingDTO {
  key: string;
  value: string | number | boolean | Record<string, unknown>;
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

export interface CertificateDTO {
  id: string;
  course_id: string;
  student_id: string;
  issued_at: string;
  certificate_url: string;
  course?: { title: string };
}

export interface BadgeDTO {
  id: string;
  title: string;
  description: string;
  icon_url: string;
  xp_required?: number;
  created_at?: string;
}
