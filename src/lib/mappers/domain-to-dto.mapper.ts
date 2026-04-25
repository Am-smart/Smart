import {
  Assignment, Quiz, Submission, QuizSubmission,
  Notification, Broadcast, LiveClass, Discussion,
  PlannerItem, Maintenance, Setting, SystemLog
} from '../types';
import { AssignmentDTO, QuizDTO, SubmissionDTO, QuizSubmissionDTO } from '../dto/assessment.dto';
import { NotificationDTO, BroadcastDTO, LiveClassDTO, DiscussionDTO } from '../dto/communication.dto';
import { PlannerItemDTO, MaintenanceDTO, SettingDTO, SystemLogDTO } from '../dto/system.dto';
import { CourseMapper, UserMapper } from './index';

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
      anti_cheat_enabled: assignment.anti_cheat_enabled,
      auto_submit_enabled: assignment.auto_submit_enabled,
      hard_enforcement: assignment.hard_enforcement,
      regrade_requests_enabled: assignment.regrade_requests_enabled,
      questions: assignment.questions,
      attachments: assignment.attachments,
      course: assignment.courses ? CourseMapper.toDTO(assignment.courses) : undefined
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
      auto_submit_enabled: quiz.auto_submit_enabled,
      hard_enforcement: quiz.hard_enforcement,
      shuffle_questions: quiz.shuffle_questions,
      start_at: quiz.start_at,
      end_at: quiz.end_at,
      questions: quiz.questions,
      course: quiz.courses ? CourseMapper.toDTO(quiz.courses) : undefined
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
      feedback: submission.feedback,
      submission_text: submission.submission_text,
      file_url: submission.file_url,
      assignment: submission.assignments ? this.toAssignmentDTO(submission.assignments) : undefined,
      student: submission.users ? UserMapper.toDTO(submission.users as any) : undefined
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
      submitted_at: submission.submitted_at,
      quiz: submission.quizzes ? this.toQuizDTO(submission.quizzes) : undefined,
      student: submission.users ? UserMapper.toDTO(submission.users as any) : undefined
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
      user: d.users ? UserMapper.toDTO(d.users as any) : undefined
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
      user: sl.users ? UserMapper.toDTO(sl.users as any) : undefined
    };
  }
}
