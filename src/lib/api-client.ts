import {
  AuthRequestDTO,
  SignupRequestDTO,
  PasswordUpdateRequestDTO,
  ResetPasswordRequestDTO,
  PreferenceUpdateRequestDTO,
  AuthResponseDTO,
  UserResponseDTO,
  SessionResponseDTO
} from './dto/auth.dto';
import {
  CourseResponseDTO,
  EnrollmentResponseDTO,
  MaterialResponseDTO,
  LessonResponseDTO,
  EnrollmentRequestDTO
} from './dto/learning.dto';
import {
  AssignmentResponseDTO,
  QuizResponseDTO,
  SubmissionResponseDTO,
  QuizSubmissionResponseDTO,
  SubmissionRequestDTO,
  QuizSubmissionRequestDTO,
  RegradeRequestDTO
} from './dto/assessment.dto';
import {
  NotificationResponseDTO,
  BroadcastResponseDTO,
  LiveClassResponseDTO,
  DiscussionResponseDTO,
  AttendanceRequestDTO,
  NotificationUpdateRequestDTO
} from './dto/communication.dto';
import {
  PlannerItemResponseDTO,
  PlannerItemRequestDTO,
  MaintenanceResponseDTO,
  SystemLogResponseDTO,
  BadgeResponseDTO,
  UserBadgeResponseDTO,
  CertificateResponseDTO
} from './dto/system.dto';

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || 'API request failed');
  }

  return response.json();
}

export const apiClient = {
  get: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'GET' }),
  post: <T>(url: string, body?: unknown, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body?: unknown, options?: RequestInit) =>
    apiFetch<T>(url, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string, options?: RequestInit) => apiFetch<T>(url, { ...options, method: 'DELETE' }),
};

// Auth
export const login = (data: AuthRequestDTO) => apiClient.post<AuthResponseDTO>('/api/auth/login', data);
export const signup = (data: SignupRequestDTO) => apiClient.post<AuthResponseDTO>('/api/auth/signup', data);
export const logout = () => apiClient.post<{ success: boolean }>('/api/auth/logout');
export const getMe = () => apiClient.get<UserResponseDTO>('/api/auth/me');
export const getSession = () => apiClient.get<SessionResponseDTO>('/api/auth/session');
export const updateProfile = (data: Partial<UserResponseDTO>) => apiClient.patch<UserResponseDTO>('/api/auth/profile', data);
export const updatePassword = (data: PasswordUpdateRequestDTO) => apiClient.post<{ success: boolean }>('/api/auth/password', data);
export const updatePreferences = (data: PreferenceUpdateRequestDTO) => apiClient.patch<UserResponseDTO>('/api/auth/preferences', data);
export const requestPasswordReset = (data: ResetPasswordRequestDTO) => apiClient.post<{ success: boolean }>('/api/auth/reset-request', data);
export const getRoleCount = (role: string) => apiClient.get<{ count: number }>(`/api/auth/signup?role=${role}`);

// Learning
export const getCourses = () => apiClient.get<CourseResponseDTO[]>('/api/courses');
export const getLessons = (courseId: string) => apiClient.get<LessonResponseDTO[]>(`/api/lessons?courseId=${courseId}`);
export const getMaterials = (courseId?: string) => apiClient.get<MaterialResponseDTO[]>(`/api/materials${courseId ? `?courseId=${courseId}` : ''}`);
export const getEnrollments = (userId?: string) => apiClient.get<EnrollmentResponseDTO[]>(`/api/system/enrollments${userId ? `?userId=${userId}` : ''}`);
export const enrollStudent = (data: EnrollmentRequestDTO) => apiClient.post<EnrollmentResponseDTO>('/api/system/enroll', data);
export const removeEnrollment = (id: string) => apiClient.delete<void>(`/api/system/enrollments?id=${id}`);
export const markLessonComplete = (lessonId: string) => apiClient.post<void>('/api/system/lesson-completions', { lessonId });
export const getLessonCompletions = () => apiClient.get<string[]>('/api/system/lesson-completions');

// Assessment
export const getAssignments = (courseId?: string) => apiClient.get<AssignmentResponseDTO[]>(`/api/assignments${courseId ? `?courseId=${courseId}` : ''}`);
export const getQuizzes = (courseId?: string) => apiClient.get<QuizResponseDTO[]>(`/api/quizzes${courseId ? `?courseId=${courseId}` : ''}`);
export const getSubmissions = (assignmentId?: string) => apiClient.get<SubmissionResponseDTO[]>(`/api/submissions${assignmentId ? `?assignmentId=${assignmentId}` : ''}`);
export const getQuizSubmissions = (quizId?: string) => apiClient.get<QuizSubmissionResponseDTO[]>(`/api/system/quiz-submissions${quizId ? `?quizId=${quizId}` : ''}`);
export const submitAssignment = (data: SubmissionRequestDTO) => apiClient.post<SubmissionResponseDTO>('/api/submissions', data);
export const submitQuiz = (data: QuizSubmissionRequestDTO) => apiClient.post<QuizSubmissionResponseDTO>('/api/system/quiz-submissions', data);
export const requestRegrade = (data: RegradeRequestDTO) => apiClient.post<void>('/api/submissions?regrade=true', data);
export const saveAssignment = (data: AssignmentResponseDTO) => apiClient.post<AssignmentResponseDTO>('/api/assignments', data);
export const saveQuiz = (data: QuizResponseDTO) => apiClient.post<QuizResponseDTO>('/api/quizzes', data);
export const deleteAssignment = (id: string) => apiClient.delete<void>(`/api/assignments?id=${id}`);
export const deleteQuiz = (id: string) => apiClient.delete<void>(`/api/quizzes?id=${id}`);

// Communication
export const getNotifications = () => apiClient.get<NotificationResponseDTO[]>('/api/system/notifications');
export const markNotificationAsRead = (id: string) => apiClient.patch<void>(`/api/system/notifications?id=${id}`, { read: true } as NotificationUpdateRequestDTO);
export const markAllNotificationsAsRead = () => apiClient.patch<void>('/api/system/notifications?all=true', { read: true } as NotificationUpdateRequestDTO);
export const getLiveClasses = (courseId?: string) => apiClient.get<LiveClassResponseDTO[]>(`/api/system/live-classes${courseId ? `?courseId=${courseId}` : ''}`);
export const saveLiveClass = (data: LiveClassResponseDTO) => apiClient.post<LiveClassResponseDTO>('/api/system/live-classes', data);
export const recordAttendance = (data: AttendanceRequestDTO) => apiClient.post<void>('/api/system/attendance', data);
export const getDiscussions = (courseId?: string) => apiClient.get<DiscussionResponseDTO[]>(`/api/system/discussions${courseId ? `?courseId=${courseId}` : ''}`);
export const saveDiscussion = (data: DiscussionResponseDTO) => apiClient.post<DiscussionResponseDTO>('/api/system/discussions', data);
export const notifyUser = (data: Partial<NotificationResponseDTO>) => apiClient.post<NotificationResponseDTO>('/api/system/notifications', data);

// System
export const getPlannerItems = () => apiClient.get<PlannerItemResponseDTO[]>('/api/system/planner');
export const savePlannerItem = (data: PlannerItemRequestDTO) => apiClient.post<PlannerItemResponseDTO>('/api/system/planner', data);
export const deletePlannerItem = (id: string) => apiClient.delete<void>(`/api/system/planner?id=${id}`);
export const getMaintenance = () => apiClient.get<MaintenanceResponseDTO>('/api/system/maintenance');
export const saveMaintenance = (data: MaintenanceResponseDTO) => apiClient.post<MaintenanceResponseDTO>('/api/system/maintenance', data);
export const getSystemLogs = (limit?: number) => apiClient.get<SystemLogResponseDTO[]>(`/api/system/logs${limit ? `?limit=${limit}` : ''}`);
export const createSystemLog = (data: Partial<SystemLogResponseDTO>) => apiClient.post<SystemLogResponseDTO>('/api/system/logs', data);
export const updateSystemLog = (id: string, data: Partial<SystemLogResponseDTO>) => apiClient.patch<SystemLogResponseDTO>(`/api/system/logs?id=${id}`, data);
export const getCertificates = () => apiClient.get<CertificateResponseDTO[]>('/api/system/certificates');
export const getUserBadges = (userId?: string) => apiClient.get<UserBadgeResponseDTO[]>(`/api/system/user-badges${userId ? `?userId=${userId}` : ''}`);
export const saveStudySession = (data: { course_id: string; duration_minutes: number }) => apiClient.post<void>('/api/system/study-sessions', data);
export const getUsers = () => apiClient.get<UserResponseDTO[]>('/api/system/users');
export const adminUpdateUser = (id: string, data: Partial<UserResponseDTO>) => apiClient.patch<UserResponseDTO>(`/api/system/users/update?id=${id}`, data);
export const getUploadPath = (bucket: string, path: string) => apiClient.get<{ url: string }>(`/api/system/upload-path?bucket=${bucket}&path=${path}`);
export const getSettings = () => apiClient.get<Record<string, unknown>>('/api/system/settings');
export const saveSettings = (data: Record<string, unknown>) => apiClient.post<void>('/api/system/settings', data);
export const getBroadcasts = () => apiClient.get<BroadcastResponseDTO[]>('/api/system/broadcasts');
export const saveBroadcast = (data: BroadcastResponseDTO) => apiClient.post<BroadcastResponseDTO>('/api/system/broadcasts', data);
export const getSessions = () => apiClient.get<SessionResponseDTO[]>('/api/system/sessions');
