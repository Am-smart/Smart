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

export interface MaintenanceDTO {
  enabled: boolean;
  message?: string;
  schedules: unknown[];
}

export interface SettingDTO {
  key: string;
  value: unknown;
}

export interface SystemLogDTO {
  id?: string;
  level: string;
  category: string;
  message: string;
  metadata?: unknown;
  user_id?: string;
  created_at?: string;
  user?: UserDTO;
}
