import { apiClient } from './api-client';
import { UserDTO } from './dto/auth.dto';
import {
  CourseDTO,
  MaterialDTO,
  EnrollmentDTO,
  LessonDTO
} from './dto/learning.dto';
import {
  AssignmentDTO,
  QuizDTO,
  SubmissionDTO,
  QuizSubmissionDTO
} from './dto/assessment.dto';
import {
  NotificationDTO,
  DiscussionDTO,
  LiveClassDTO
} from './dto/communication.dto';
import {
  PlannerItemDTO,
  MaintenanceDTO,
  SettingDTO,
  SystemLogDTO
} from './dto/system.dto';
import { User, Course, Assignment, Quiz, Submission, QuizSubmission, Material, Discussion, PlannerItem, LiveClass } from './types';

// Auth / Users
export async function getUsers(): Promise<UserDTO[]> {
  return apiClient.get<UserDTO[]>('/api/system/users');
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/system/users?id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function saveUser(user: Partial<User>): Promise<{ success: boolean; data?: UserDTO; error?: string }> {
  try {
    const data = await apiClient.post<UserDTO>('/api/system/users/update', user);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

export async function approveResetRequest(userId: string, tempPass: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth/reset-request', { userId, tempPass, action: 'approve' });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function getCertificates(userId: string): Promise<CertificateDTO[]> {
    return apiClient.get<CertificateDTO[]>(`/api/system/certificates?userId=${userId}`);
}

export async function getUserBadges(userId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/api/system/user-badges?userId=${userId}`);
}

export async function getBadges(): Promise<BadgeDTO[]> {
    return apiClient.get<BadgeDTO[]>('/api/system/badges');
}

export async function saveBadge(badge: unknown): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system/badges', badge);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function deleteBadge(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/system/badges?id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function assignBadge(data: { badge_id: string; user_id: string }): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system/user-badges', data);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function denyResetRequest(userId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth/reset-request', { userId, reason, action: 'deny' });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function saveLiveClass(liveClass: Partial<LiveClass>): Promise<{ success: boolean; data?: LiveClassDTO; error?: string }> {
    try {
        const data = await apiClient.post<LiveClassDTO>('/api/system/live-classes', liveClass);
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function deleteLiveClass(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/system/live-classes?id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function deleteAssignment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/assignments?id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function deletePlannerItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/system/planner?id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// Courses
export async function getCourses(teacherId?: string): Promise<CourseDTO[]> {
  const url = teacherId ? `/api/courses?teacherId=${teacherId}` : '/api/courses';
  return apiClient.get<CourseDTO[]>(url);
}

export async function saveCourse(course: Partial<Course>): Promise<{ success: boolean; data?: CourseDTO; error?: string }> {
  try {
    const data = await apiClient.post<CourseDTO>('/api/courses', course);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

export async function deleteQuiz(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/quizzes?id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// Enrollments
export async function getEnrollments(studentId: string): Promise<EnrollmentDTO[]> {
  return apiClient.get<EnrollmentDTO[]>(`/api/system/enrollments?studentId=${studentId}`);
}

export async function enrollInCourse(courseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.post('/api/system/enroll', { courseId });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

export async function deleteCourse(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/courses?id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// Assignments
export async function getAssignments(teacherId?: string, courseId?: string): Promise<AssignmentDTO[]> {
  let url = '/api/assignments';
  const params = new URLSearchParams();
  if (teacherId) params.append('teacherId', teacherId);
  if (courseId) params.append('courseId', courseId);
  if (params.toString()) url += `?${params.toString()}`;
  return apiClient.get<AssignmentDTO[]>(url);
}

export async function saveAssignment(assignment: Partial<Assignment>): Promise<{ success: boolean; data?: AssignmentDTO; error?: string }> {
  try {
    const data = await apiClient.post<AssignmentDTO>('/api/assignments', assignment);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

export async function submitAssignment(assignmentId: string, content: Partial<Submission>): Promise<{ success: boolean; data?: SubmissionDTO; error?: string }> {
  try {
    const data = await apiClient.post<SubmissionDTO>(`/api/submissions?assignmentId=${assignmentId}`, content);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

export async function getSubmissions(assignmentId?: string, studentId?: string): Promise<SubmissionDTO[]> {
    let url = '/api/submissions';
    const params = new URLSearchParams();
    if (assignmentId) params.append('assignmentId', assignmentId);
    if (studentId) params.append('studentId', studentId);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient.get<SubmissionDTO[]>(url);
}

export async function gradeSubmission(id: string, gradeData: Partial<Submission>): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.patch(`/api/submissions?id=${id}`, gradeData);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// Quizzes
export async function getQuizzes(courseId?: string, teacherId?: string): Promise<QuizDTO[]> {
  let url = '/api/quizzes';
  const params = new URLSearchParams();
  if (courseId) params.append('courseId', courseId);
  if (teacherId) params.append('teacherId', teacherId);
  if (params.toString()) url += `?${params.toString()}`;
  return apiClient.get<QuizDTO[]>(url);
}

export async function saveQuiz(quiz: Partial<Quiz>): Promise<{ success: boolean; data?: QuizDTO; error?: string }> {
  try {
    const data = await apiClient.post<QuizDTO>('/api/quizzes', quiz);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

export async function submitQuiz(quizId: string, content: Partial<QuizSubmission>): Promise<{ success: boolean; score?: number; error?: string }> {
  try {
    const result = await apiClient.post<{ score: number }>(`/api/submissions?assignmentId=${quizId}&type=quiz`, content);
    return { success: true, score: result.score };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

export async function getQuizSubmissions(quizId?: string, studentId?: string): Promise<QuizSubmissionDTO[]> {
    let url = '/api/system/quiz-submissions';
    const params = new URLSearchParams();
    if (quizId) params.append('quizId', quizId);
    if (studentId) params.append('studentId', studentId);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient.get<QuizSubmissionDTO[]>(url);
}

// Materials
export async function getMaterials(courseId?: string): Promise<MaterialDTO[]> {
  const url = courseId ? `/api/materials?courseId=${courseId}` : '/api/materials';
  return apiClient.get<MaterialDTO[]>(url);
}

export async function saveMaterial(material: Partial<Material>): Promise<{ success: boolean; data?: MaterialDTO; error?: string }> {
  try {
    const data = await apiClient.post<MaterialDTO>('/api/materials', material);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

export async function deleteMaterial(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/materials?id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function deleteLesson(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/lessons?id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// Lessons
export async function getLessons(courseId: string): Promise<LessonDTO[]> {
    return apiClient.get<LessonDTO[]>(`/api/lessons?courseId=${courseId}`);
}

export async function saveLesson(lesson: Partial<Lesson>): Promise<{ success: boolean; data?: LessonDTO; error?: string }> {
    try {
        const data = await apiClient.post<LessonDTO>('/api/lessons', lesson);
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function markLessonComplete(lessonId: string, courseId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system/lesson-completions', { lessonId, courseId });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

export async function getLessonCompletions(userId: string): Promise<any[]> {
    return apiClient.get<any[]>(`/api/system/lesson-completions?userId=${userId}`);
}

// Discussions
export async function getDiscussions(courseId: string): Promise<DiscussionDTO[]> {
  return apiClient.get<DiscussionDTO[]>(`/api/system/discussions?courseId=${courseId}`);
}

export async function saveDiscussionPost(discussion: Partial<Discussion>): Promise<{ success: boolean; data?: DiscussionDTO; error?: string }> {
  try {
    const data = await apiClient.post<DiscussionDTO>('/api/system/discussions', discussion);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

// Notifications
export async function getNotifications(userId: string): Promise<NotificationDTO[]> {
  return apiClient.get<NotificationDTO[]>(`/api/system/notifications?userId=${userId}`);
}

export async function createBroadcast(broadcast: unknown): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system/broadcasts', broadcast);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// Maintenance
export async function getMaintenance(): Promise<MaintenanceDTO> {
  return apiClient.get<MaintenanceDTO>('/api/system/maintenance');
}

export async function updateMaintenance(data: unknown): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system/maintenance', data);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// System Logs & Anti-Cheat
export async function getSystemLogs(limit: number = 100): Promise<SystemLogDTO[]> {
    return apiClient.get<SystemLogDTO[]>(`/api/system/logs?limit=${limit}`);
}

export async function logAntiCheatViolation(data: unknown): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.post('/api/system/logs', {
        level: 'warning',
        category: 'anti-cheat',
        message: data.message || 'Anti-cheat violation detected',
        metadata: data
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

// Planner
export async function getPlannerItems(userId: string): Promise<PlannerItemDTO[]> {
    return apiClient.get<PlannerItemDTO[]>(`/api/system/planner?userId=${userId}`);
}

export async function savePlannerItem(planner: Partial<PlannerItem>): Promise<{ success: boolean; data?: PlannerItemDTO; error?: string }> {
    try {
        const data = await apiClient.post<PlannerItemDTO>('/api/system/planner', planner);
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// Settings
export async function getSettings(): Promise<SettingDTO[]> {
    return apiClient.get<SettingDTO[]>('/api/system/settings');
}

export async function updateSetting(key: string, value: unknown): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system/settings', { key, value });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// Live Classes
export async function getLiveClasses(courseId?: string, teacherId?: string): Promise<LiveClassDTO[]> {
    let url = '/api/system/live-classes';
    const params = new URLSearchParams();
    if (courseId) params.append('courseId', courseId);
    if (teacherId) params.append('teacherId', teacherId);
    if (params.toString()) url += `?${params.toString()}`;
    return apiClient.get<LiveClassDTO[]>(url);
}

export async function recordAttendance(liveClassId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system/attendance', { liveClassId });
        return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error.message };
  }
}

// Study Sessions
export async function saveStudySession(session: unknown, xpEarned: number): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system/study-sessions', { session, xpEarned });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error.message };
    }
}

// File Upload Path
export async function uploadFile(fileName: string, category: string): Promise<{ filePath: string }> {
    return apiClient.post<{ filePath: string }>('/api/system/upload-path', { fileName, category });
}

// Notifications
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.patch(`/api/system/notifications?id=${notificationId}`, { is_read: true });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.patch(`/api/system/notifications?userId=${userId}`, { markAll: true });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// Auth - Password Management
export async function updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth/password', { userId, currentPassword, newPassword });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth/reset-request', { email, action: 'request' });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// Auth - User Info
export async function getRoleCount(): Promise<{ teachers: number; admins: number; total: number }> {
    return apiClient.get<{ teachers: number; admins: number; total: number }>('/api/auth/role-count');
}

// User Preferences
export async function updatePreferences(userId: string, preferences: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth/preferences', { userId, preferences });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// System Logging
export async function createSystemLog(data: { level: string; category: string; message: string; metadata?: unknown }): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system/logs', data);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}
