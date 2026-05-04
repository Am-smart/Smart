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

export class UserMapper {
  static toDTO(user: User | { id: string; full_name: string; email: string; role?: UserRole; phone?: string; created_at?: string; active?: boolean; metadata?: Record<string, string | number | boolean> }): UserDTO {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role || 'student',
      phone: user.phone,
      created_at: user.created_at || new Date().toISOString(),
      active: user.active,
      metadata: user.metadata || {},
      flagged: (user as User).flagged,
      failed_attempts: (user as User).failed_attempts,
      lockouts: (user as User).lockouts,
      locked_until: (user as User).locked_until,
      reset_request: (user as User).reset_request
    };
  }
}

export class CourseMapper {
  static toDTO(course: Course): CourseDTO {
    return {
      id: course.id,
      course_id: course.course_id,
      created_by: course.created_by,
      title: course.title,
      description: course.description,
      status: course.status,
      teacher_id: course.teacher_id,
      thumbnail_url: course.thumbnail_url,
      created_at: course.created_at || new Date().toISOString(),
      updated_at: course.updated_at,
      version: course.version,
      metadata: course.metadata || {}
    };
  }
}

export class LearningMapper {
  static toLessonDTO(lesson: Lesson): LessonDTO {
    return {
      id: lesson.id,
      course_id: lesson.course_id,
      title: lesson.title,
      content: lesson.content,
      video_url: lesson.video_url,
      order_index: lesson.order_index,
      created_at: lesson.created_at || new Date().toISOString()
    };
  }

  static toMaterialDTO(material: Material): MaterialDTO {
    return {
      id: material.id,
      course_id: material.course_id,
      teacher_id: material.teacher_id,
      title: material.title,
      description: material.description,
      file_url: material.file_url,
      file_type: material.file_type,
      created_at: material.created_at
    };
  }
}

export class AssessmentMapper {
  static toAssignmentDTO(assignment: Assignment): AssignmentDTO {
    return {
      id: assignment.id,
      course_id: assignment.course_id,
      teacher_id: assignment.teacher_id,
      title: assignment.title,
      description: assignment.description,
      start_at: assignment.start_at,
      due_date: assignment.due_date,
      status: assignment.status,
      points_possible: assignment.points_possible,
      allow_late_submissions: assignment.allow_late_submissions,
      late_penalty_per_day: assignment.late_penalty_per_day,
      allowed_extensions: assignment.allowed_extensions,
      anti_cheat_enabled: assignment.anti_cheat_enabled,
      hard_enforcement: assignment.hard_enforcement,
      regrade_requests_enabled: assignment.regrade_requests_enabled,
      questions: assignment.questions,
      attachments: assignment.attachments,
      course: assignment.courses ? CourseMapper.toDTO(assignment.courses) : undefined,
      metadata: assignment.metadata || {}
    };
  }

  static toQuizDTO(quiz: Quiz): QuizDTO {
    return {
      id: quiz.id,
      course_id: quiz.course_id,
      teacher_id: quiz.teacher_id,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      attempts_allowed: quiz.attempts_allowed,
      time_limit: quiz.time_limit,
      passing_score: quiz.passing_score,
      anti_cheat_enabled: quiz.anti_cheat_enabled,
      hard_enforcement: quiz.hard_enforcement,
      shuffle_questions: quiz.shuffle_questions,
      start_at: quiz.start_at,
      end_at: quiz.end_at,
      questions: quiz.questions,
      course: quiz.courses ? CourseMapper.toDTO(quiz.courses) : undefined,
      metadata: quiz.metadata || {}
    };
  }

  static toSubmissionDTO(submission: Submission): SubmissionDTO {
    return {
      id: submission.id,
      assignment_id: submission.assignment_id,
      student_id: submission.student_id,
      submitted_at: submission.submitted_at,
      status: submission.status,
      grade: submission.grade,
      final_grade: submission.final_grade,
      late_penalty_applied: submission.late_penalty_applied,
      feedback: submission.feedback,
      regrade_request: submission.regrade_request,
      submission_text: submission.submission_text,
      file_url: submission.file_url,
      answers: submission.answers,
      question_scores: submission.question_scores,
      response_feedback: submission.response_feedback,
      violation_count: submission.violation_count,
      assignment: submission.assignments ? AssessmentMapper.toAssignmentDTO(submission.assignments) : undefined,
      student: submission.users ? UserMapper.toDTO(submission.users) : undefined
    };
  }

  static toQuizSubmissionDTO(submission: QuizSubmission): QuizSubmissionDTO {
    return {
      id: submission.id,
      quiz_id: submission.quiz_id,
      student_id: submission.student_id,
      score: submission.score,
      total_points: submission.total_points,
      status: submission.status,
      time_spent: submission.time_spent,
      started_at: submission.started_at,
      answers: submission.answers,
      submitted_at: submission.submitted_at,
      violation_count: submission.violation_count,
      quiz: submission.quizzes ? AssessmentMapper.toQuizDTO(submission.quizzes) : undefined,
      student: submission.users ? UserMapper.toDTO(submission.users) : undefined
    };
  }
}

export class CommunicationMapper {
  static toNotificationDTO(n: Notification): NotificationDTO {
    return {
      id: n.id,
      user_id: n.user_id,
      title: n.title,
      message: n.message,
      link: n.link,
      type: n.type,
      is_read: n.is_read,
      created_at: n.created_at
    };
  }

  static toBroadcastDTO(b: Broadcast): BroadcastDTO {
    return {
      id: b.id,
      course_id: b.course_id,
      target_role: b.target_role,
      title: b.title,
      message: b.message,
      link: b.link,
      type: b.type,
      expires_at: b.expires_at,
      created_at: b.created_at
    };
  }

  static toLiveClassDTO(lc: LiveClass): LiveClassDTO {
    return {
      id: lc.id,
      course_id: lc.course_id,
      teacher_id: lc.teacher_id,
      title: lc.title,
      description: lc.description,
      room_name: lc.room_name,
      meeting_url: lc.meeting_url,
      start_at: lc.start_at,
      end_at: lc.end_at,
      status: lc.status,
      course: lc.courses ? CourseMapper.toDTO(lc.courses) : undefined
    };
  }

  static toDiscussionDTO(d: Discussion): DiscussionDTO {
    return {
      id: d.id,
      course_id: d.course_id,
      user_id: d.user_id,
      parent_id: d.parent_id,
      title: d.title,
      content: d.content,
      created_at: d.created_at,
      user: d.users ? UserMapper.toDTO({ id: d.user_id, ...d.users }) : undefined
    };
  }
}

export class SystemMapper {
  static toPlannerItemDTO(pi: PlannerItem): PlannerItemDTO {
    return {
      id: pi.id,
      user_id: pi.user_id,
      title: pi.title,
      description: pi.description,
      due_date: pi.due_date,
      priority: pi.priority,
      completed: pi.completed,
      created_at: pi.created_at
    };
  }

  static toMaintenanceDTO(m: Maintenance): MaintenanceDTO {
    return {
      id: m.id,
      enabled: m.enabled,
      message: m.message,
      schedules: m.schedules
    };
  }

  static toSettingDTO(s: Setting): SettingDTO {
    return {
      key: s.key,
      value: s.value
    };
  }

  static toSystemLogDTO(sl: SystemLog): SystemLogDTO {
    return {
      id: sl.id,
      level: sl.level,
      category: sl.category,
      message: sl.message,
      metadata: sl.metadata,
      user_id: sl.user_id,
      created_at: sl.created_at,
      user: (sl.users && sl.user_id) ? UserMapper.toDTO({ id: sl.user_id, ...sl.users }) : undefined
    };
  }

  static toEnrollmentDTO(e: Enrollment): EnrollmentDTO {
    return {
      course_id: e.course_id,
      student_id: e.student_id,
      enrolled_at: e.enrolled_at,
      progress: e.progress || 0,
      completed: e.completed || false,
      course: e.courses ? CourseMapper.toDTO(e.courses) : undefined,
      student: e.users ? UserMapper.toDTO(e.users) : undefined
    };
  }
}
