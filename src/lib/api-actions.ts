import { apiClient } from './api-client';
import {
  User,
  Course,
  Submission,
  QuizSubmission,
  Material,
  Discussion,
  PlannerItem,
  Session,
  LiveClass,
  UserDTO,
  CourseDTO,
  MaterialDTO,
  EnrollmentDTO,
  LessonDTO,
  AssignmentDTO,
  QuizDTO,
  SubmissionDTO,
  QuizSubmissionDTO,
  NotificationDTO,
  DiscussionDTO,
  LiveClassDTO,
  PlannerItemDTO,
  MaintenanceDTO,
  SettingDTO,
  SystemLogDTO
} from './types';

// Auth / Users
export async function login(credentials: { email: string; password?: string }): Promise<{ success: boolean; data?: { user: UserDTO; sessionId: string }; error?: string }> {
  try {
    const result = await apiClient.post<{ user: UserDTO; sessionId: string; error?: string }>('/api/auth', { action: 'login', ...credentials });
    return { success: true, data: result as { user: UserDTO; sessionId: string } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function signup(userData: Partial<User>): Promise<{ success: boolean; data?: { user: UserDTO; sessionId: string }; error?: string }> {
  try {
    const result = await apiClient.post<{ user: UserDTO; sessionId: string; error?: string }>('/api/auth', { action: 'signup', ...userData });
    return { success: true, data: result as { user: UserDTO; sessionId: string } };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function logout(): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.post('/api/auth', { action: 'logout' });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getMe(): Promise<UserDTO | null> {
    try {
        return await apiClient.get<UserDTO>('/api/auth?action=me');
    } catch {
        return null;
    }
}

export async function getSessions(): Promise<Session[]> {
    return apiClient.get<Session[]>('/api/system?action=sessions');
}

export async function getSession(): Promise<{ sessionId: string } | null> {
    try {
        return await apiClient.get<{ sessionId: string }>('/api/auth?action=session');
    } catch {
        return null;
    }
}

export async function updateProfile(updates: Partial<User>): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth', { action: 'profile', ...updates });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getUsers(): Promise<UserDTO[]> {
  return apiClient.get<UserDTO[]>('/api/system?action=users');
}

export async function deleteUser(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/system?action=user&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function saveUser(user: Partial<User> & { id?: string }): Promise<{ success: boolean; data?: UserDTO; error?: string }> {
  try {
    const data = await apiClient.post<UserDTO>('/api/system', { action: 'save-user', ...user });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function approveResetRequest(userId: string, tempPass: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth', { userId, tempPassword: tempPass, action: 'reset-request', subAction: 'approve' });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function denyResetRequest(userId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth', { userId, reason, action: 'reset-request', subAction: 'deny' });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function saveLiveClass(liveClass: Partial<LiveClass>): Promise<{ success: boolean; data?: LiveClassDTO; error?: string }> {
    try {
        const data = await apiClient.post<LiveClassDTO>('/api/system', { action: 'save-live-class', ...liveClass });
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteLiveClass(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/system?action=live-class&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteAssignment(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/assessment?action=assignment&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deletePlannerItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/system?action=planner&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Courses
export async function getCourses(teacherId?: string): Promise<CourseDTO[]> {
  const url = teacherId ? `/api/learning?action=courses&teacherId=${teacherId}` : '/api/learning?action=courses';
  return apiClient.get<CourseDTO[]>(url);
}

export async function saveCourse(course: Partial<Course>): Promise<{ success: boolean; data?: CourseDTO; error?: string }> {
  try {
    const data = await apiClient.post<CourseDTO>('/api/learning', { action: 'save-course', ...course });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteQuiz(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/assessment?action=quiz&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Enrollments
export async function getEnrollments(studentId?: string, courseIds?: string[]): Promise<EnrollmentDTO[]> {
  let url = '/api/system?action=enrollments';
  if (studentId) url += `&studentId=${studentId}`;
  if (courseIds) url += `&courseIds=${courseIds.join(',')}`;
  return apiClient.get<EnrollmentDTO[]>(url);
}

export async function enrollInCourse(courseId: string, enrollmentCode?: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.post('/api/system', { action: 'enroll', courseId, enrollmentCode });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function unenrollStudent(courseId: string, studentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.delete(`/api/system?action=enrollment&id=${courseId}&studentId=${studentId}`);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteCourse(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/learning?action=course&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Assignments
export async function getAssignments(teacherId?: string, courseId?: string): Promise<AssignmentDTO[]> {
  let url = '/api/assessment?action=assignments';
  if (teacherId) url += `&teacherId=${teacherId}`;
  if (courseId) url += `&courseId=${courseId}`;
  return apiClient.get<AssignmentDTO[]>(url);
}

export async function saveAssignment(assignment: Omit<AssignmentDTO, 'course' | 'metadata'>): Promise<{ success: boolean; data?: AssignmentDTO; error?: string }> {
  try {
    const data = await apiClient.post<AssignmentDTO>('/api/assessment', { action: 'save-assignment', ...assignment });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function submitAssignment(assignmentId: string, content: Partial<Submission>): Promise<{ success: boolean; data?: SubmissionDTO; error?: string }> {
  try {
    const data = await apiClient.post<SubmissionDTO>('/api/assessment', { action: 'submit-assignment', assignmentId, ...content });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getSubmissions(assignmentId?: string, studentId?: string): Promise<SubmissionDTO[]> {
    let url = '/api/assessment?action=submissions';
    if (assignmentId) url += `&assignmentId=${assignmentId}`;
    if (studentId) url += `&studentId=${studentId}`;
    return apiClient.get<SubmissionDTO[]>(url);
}

export async function gradeSubmission(id: string, gradeData: Partial<Submission>): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.patch(`/api/assessment?action=grade-submission&id=${id}`, gradeData);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Quizzes
export async function getQuizzes(courseId?: string, teacherId?: string): Promise<QuizDTO[]> {
  let url = '/api/assessment?action=quizzes';
  if (courseId) url += `&courseId=${courseId}`;
  if (teacherId) url += `&teacherId=${teacherId}`;
  return apiClient.get<QuizDTO[]>(url);
}

export async function saveQuiz(quiz: Omit<QuizDTO, 'course' | 'metadata'>): Promise<{ success: boolean; data?: QuizDTO; error?: string }> {
  try {
    const data = await apiClient.post<QuizDTO>('/api/assessment', { action: 'save-quiz', ...quiz });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function submitQuiz(quizId: string, content: Partial<QuizSubmission>): Promise<{ success: boolean; score?: number; error?: string }> {
  try {
    const result = await apiClient.post<{ score: number }>('/api/assessment', { action: 'submit-quiz', quizId, ...content });
    return { success: true, score: result.score };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function getQuizSubmissions(quizId?: string, studentId?: string): Promise<QuizSubmissionDTO[]> {
    let url = '/api/system?action=quiz-submissions';
    if (quizId) url += `&quizId=${quizId}`;
    if (studentId) url += `&studentId=${studentId}`;
    return apiClient.get<QuizSubmissionDTO[]>(url);
}

// Materials
export async function getMaterials(courseId?: string): Promise<MaterialDTO[]> {
  const url = courseId ? `/api/learning?action=materials&courseId=${courseId}` : '/api/learning?action=materials';
  return apiClient.get<MaterialDTO[]>(url);
}

export async function saveMaterial(material: Partial<Material>): Promise<{ success: boolean; data?: MaterialDTO; error?: string }> {
  try {
    const data = await apiClient.post<MaterialDTO>('/api/learning', { action: 'save-material', ...material });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteMaterial(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/learning?action=material&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteLesson(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/learning?action=lesson&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Lessons
export async function getLessons(courseId: string): Promise<LessonDTO[]> {
    return apiClient.get<LessonDTO[]>(`/api/learning?action=lessons&courseId=${courseId}`);
}

export async function saveLesson(lesson: Partial<LessonDTO>): Promise<{ success: boolean; data?: LessonDTO; error?: string }> {
    try {
        const data = await apiClient.post<LessonDTO>('/api/learning', { action: 'save-lesson', ...lesson });
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function markLessonComplete(lessonId: string, courseId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system', { action: 'lesson-completion', lessonId, courseId });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

export async function getLessonCompletions(userId?: string): Promise<Record<string, unknown>[]> {
    let url = '/api/system?action=lesson-completions';
    if (userId) url += `&userId=${userId}`;
    return apiClient.get<Record<string, unknown>[]>(url);
}

// Discussions
export async function getDiscussions(courseId: string): Promise<DiscussionDTO[]> {
  return apiClient.get<DiscussionDTO[]>(`/api/system?action=discussions&courseId=${courseId}`);
}

export async function saveDiscussionPost(discussion: Partial<Discussion>): Promise<{ success: boolean; data?: DiscussionDTO; error?: string }> {
  try {
    const data = await apiClient.post<DiscussionDTO>('/api/system', { action: 'save-discussion', ...discussion });
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

export async function deleteDiscussionPost(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.delete(`/api/system?action=discussion&id=${id}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Notifications
export async function getNotifications(userId: string): Promise<NotificationDTO[]> {
  return apiClient.get<NotificationDTO[]>(`/api/system?action=notifications&userId=${userId}`);
}

export async function createBroadcast(broadcast: unknown): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system', { action: 'broadcast', ...broadcast as object });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Maintenance
export async function getMaintenance(): Promise<MaintenanceDTO> {
  return apiClient.get<MaintenanceDTO>('/api/system?action=maintenance');
}

export async function updateMaintenance(data: unknown): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system', { action: 'update-maintenance', ...data as object });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// System Logs & Anti-Cheat
export async function getSystemLogs(limit: number = 100): Promise<SystemLogDTO[]> {
    return apiClient.get<SystemLogDTO[]>(`/api/system?action=logs&limit=${limit}`);
}

export async function logAntiCheatViolation(data: Record<string, unknown> & { message?: string }): Promise<{ success: boolean; error?: string }> {
  try {
    await apiClient.post('/api/system', {
        action: 'log',
        level: 'warning',
        category: 'anti-cheat',
        message: data.message || 'Anti-cheat violation detected',
        metadata: data
    });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

// Planner
export async function getPlannerItems(userId: string): Promise<PlannerItemDTO[]> {
    return apiClient.get<PlannerItemDTO[]>(`/api/system?action=planner&userId=${userId}`);
}

export async function savePlannerItem(planner: Partial<PlannerItem>): Promise<{ success: boolean; data?: PlannerItemDTO; error?: string }> {
    try {
        const data = await apiClient.post<PlannerItemDTO>('/api/system', { action: 'save-planner', ...planner });
        return { success: true, data };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Settings
export async function getSettings(): Promise<SettingDTO[]> {
    return apiClient.get<SettingDTO[]>('/api/system?action=settings');
}

export async function updateSetting(key: string, value: unknown): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system', { action: 'update-setting', key, value });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: (error as Error).message };
    }
}

// Live Classes
export async function getLiveClasses(courseId?: string, teacherId?: string): Promise<LiveClassDTO[]> {
    let url = '/api/system?action=live-classes';
    if (courseId) url += `&courseId=${courseId}`;
    if (teacherId) url += `&teacherId=${teacherId}`;
    return apiClient.get<LiveClassDTO[]>(url);
}

export async function recordAttendance(liveClassId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system', { action: 'attendance', liveClassId });
        return { success: true };
  } catch (error: unknown) {
    return { success: false, error: (error as Error).message };
  }
}

// File Upload Path
export async function uploadFile(fileName: string, category: string): Promise<{ filePath: string }> {
    return apiClient.post<{ filePath: string }>('/api/system', { action: 'upload-path', fileName, category });
}

// Notifications
export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.patch(`/api/system?action=notification&id=${notificationId}`, {});
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.patch(`/api/system?action=notification&userId=${userId}`, { markAll: true });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

// Auth - Password Management
export async function updatePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth', { action: 'password', currentPassword, newPassword });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

export async function requestPasswordReset(email: string, reason: string, riskLevel: string): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth', { action: 'reset-request', subAction: 'request', email, reason, riskLevel });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

// Auth - User Info
export async function getRoleCount(): Promise<{ teachers: number; admins: number; total: number }> {
    return apiClient.get<{ teachers: number; admins: number; total: number }>('/api/auth?action=role-count');
}

// User Preferences
export async function updatePreferences(preferences: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/auth', { action: 'preferences', preferences });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}

// System Logging
export async function createSystemLog(data: { level: string; category: string; message: string; metadata?: unknown }): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/api/system', { action: 'log', ...data });
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? (error as Error).message : 'Unknown error' };
    }
}
