import {
  User, Course, Lesson, Material, UserRole,
  Assignment, Quiz, Submission, QuizSubmission,
  Notification, Broadcast, LiveClass, Discussion,
  PlannerItem, Enrollment, Maintenance, Setting, SystemLog
} from '../types';
import { UserDTO } from '../types';
import { CourseDTO, LessonDTO, MaterialDTO } from '../types';
import { AssignmentDTO, QuizDTO, SubmissionDTO, QuizSubmissionDTO } from '../types';
import { NotificationDTO, BroadcastDTO, LiveClassDTO, DiscussionDTO } from '../types';
import { PlannerItemDTO, EnrollmentDTO, MaintenanceDTO, SettingDTO, SystemLogDTO } from '../types';

/**
 * Generic mapper utility to clean up objects before DTO conversion
 * It excludes relational keys and handles common audit/metadata fields.
 */
function toCleanDTO<T>(obj: unknown): T {
    if (!obj || typeof obj !== 'object' || obj === null) return {} as T;

    const data = obj as Record<string, unknown>;
    const clean: Record<string, unknown> = {};

    // List of relation keys to exclude from DTOs to prevent unwanted data exposure
    const excludeKeys = ['courses', 'assignments', 'quizzes', 'assignment', 'quiz', 'users', 'student', 'lesson_completions', 'attendance'];

    for (const key in data) {
        if (!excludeKeys.includes(key)) {
            clean[key] = data[key];
        }
    }

    // Ensure audit fields are propagated if they exist in the source but might be missing in the 'clean' result
    if (!clean.created_at && (data.created_at || (obj as { created_at?: string }).created_at)) {
        clean.created_at = data.created_at;
    }

    if (!clean.updated_at && (data.updated_at || (obj as { updated_at?: string }).updated_at)) {
      clean.updated_at = data.updated_at;
    }

    if (clean.version === undefined && data.version !== undefined) {
      clean.version = data.version;
    }

    // Initialize metadata if missing or null
    if (clean.metadata === undefined || clean.metadata === null) {
        clean.metadata = {};
    }

    return clean as T;
}

export class UserMapper {
  static toDTO(user: User | { id: string; full_name: string; email: string; role?: UserRole; phone?: string; created_at?: string; updated_at?: string; active?: boolean; metadata?: Record<string, string | number | boolean>; version?: number } | null | undefined): UserDTO | null {
    if (!user) return null;

    // User often contains sensitive fields like password which must not be in DTO
    const { password: _, ...userData } = user as any;

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role || 'student',
      phone: user.phone,
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at,
      active: user.active,
      metadata: user.metadata || {},
      flagged: (user as User).flagged,
      failed_attempts: (user as User).failed_attempts,
      lockouts: (user as User).lockouts,
      locked_until: (user as User).locked_until,
      reset_request: (user as User).reset_request,
      version: user.version
    };
  }
}

export class CourseMapper {
  static toDTO(course: Course): CourseDTO {
    return {
      ...toCleanDTO<CourseDTO>(course),
      created_at: course.created_at || new Date().toISOString()
    };
  }
}

export class LearningMapper {
  static toLessonDTO(lesson: Lesson): LessonDTO {
    return {
      ...toCleanDTO<LessonDTO>(lesson),
      created_at: lesson.created_at || new Date().toISOString()
    };
  }

  static toMaterialDTO(material: Material): MaterialDTO {
    return {
      ...toCleanDTO<MaterialDTO>(material),
      created_at: material.created_at || new Date().toISOString()
    };
  }
}

export class AssessmentMapper {
  static toAssignmentDTO(assignment: Assignment): AssignmentDTO {
    return {
      ...toCleanDTO<AssignmentDTO>(assignment),
      created_at: assignment.created_at || new Date().toISOString(),
      course: assignment.courses ? CourseMapper.toDTO(assignment.courses) : undefined
    };
  }

  static toQuizDTO(quiz: Quiz): QuizDTO {
    return {
      ...toCleanDTO<QuizDTO>(quiz),
      created_at: quiz.created_at || new Date().toISOString(),
      course: quiz.courses ? CourseMapper.toDTO(quiz.courses) : undefined
    };
  }

  static toSubmissionDTO(submission: Submission): SubmissionDTO {
    return {
      ...toCleanDTO<SubmissionDTO>(submission),
      assignment: submission.assignments ? AssessmentMapper.toAssignmentDTO(submission.assignments) : undefined,
      student: submission.users ? (UserMapper.toDTO(submission.users) || undefined) : undefined
    };
  }

  static toQuizSubmissionDTO(submission: QuizSubmission): QuizSubmissionDTO {
    return {
      ...toCleanDTO<QuizSubmissionDTO>(submission),
      quiz: submission.quizzes ? AssessmentMapper.toQuizDTO(submission.quizzes) : undefined,
      student: submission.users ? (UserMapper.toDTO(submission.users) || undefined) : undefined
    };
  }
}

export class CommunicationMapper {
  static toNotificationDTO(n: Notification): NotificationDTO {
    return toCleanDTO<NotificationDTO>(n);
  }

  static toBroadcastDTO(b: Broadcast): BroadcastDTO {
    return toCleanDTO<BroadcastDTO>(b);
  }

  static toLiveClassDTO(lc: LiveClass): LiveClassDTO {
    return {
      ...toCleanDTO<LiveClassDTO>(lc),
      course: lc.courses ? CourseMapper.toDTO(lc.courses) : undefined
    };
  }

  static toDiscussionDTO(d: Discussion): DiscussionDTO {
    return {
      ...toCleanDTO<DiscussionDTO>(d),
      user: d.users ? (UserMapper.toDTO({ id: d.user_id, ...d.users }) || undefined) : undefined
    };
  }
}

export class SystemMapper {
  static toPlannerItemDTO(pi: PlannerItem): PlannerItemDTO {
    return toCleanDTO<PlannerItemDTO>(pi);
  }

  static toMaintenanceDTO(m: Maintenance): MaintenanceDTO {
    return toCleanDTO<MaintenanceDTO>(m);
  }

  static toSettingDTO(s: Setting): SettingDTO {
    return toCleanDTO<SettingDTO>(s);
  }

  static toSystemLogDTO(sl: SystemLog): SystemLogDTO {
    return {
      ...toCleanDTO<SystemLogDTO>(sl),
      user: (sl.users && sl.user_id) ? (UserMapper.toDTO({ id: sl.user_id, ...sl.users }) || undefined) : undefined
    };
  }

  static toEnrollmentDTO(e: Enrollment): EnrollmentDTO {
    return {
      ...toCleanDTO<EnrollmentDTO>(e),
      progress: e.progress || 0,
      completed: e.completed || false,
      course: e.courses ? CourseMapper.toDTO(e.courses) : undefined,
      student: e.users ? (UserMapper.toDTO(e.users) || undefined) : undefined
    };
  }
}
