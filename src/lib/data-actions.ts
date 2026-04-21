/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { revalidatePath } from 'next/cache';
import { getSession } from './auth-actions';
import { Submission, QuizSubmission, Course, Lesson, Assignment, Quiz, PlannerItem, Discussion, Material, User, Certificate, Badge, UserBadge, LiveClass, Maintenance, Broadcast, StudySession } from './types';
import { userService } from './services/user.service';
import { courseService } from './services/course.service';
import { enrollmentService } from './services/enrollment.service';
import { assessmentService } from './services/assessment.service';
import { learningService } from './services/learning.service';
import { communicationService } from './services/communication.service';
import { gamificationService } from './services/gamification.service';
import { systemService } from './services/system.service';
import { supabase } from './supabase';
import { authz } from './auth/authorization.service';

async function getVerifiedUser() {
  const session = await getSession();
  if (!session || !session.sessionId) throw new Error('Unauthorized');
  return session;
}

export async function getCurrentUser() {
  const session = await getVerifiedUser();
  return userService.getCurrentUser(session.id as string, session.sessionId as string);
}

export async function createSystemLog(log: Record<string, unknown>) {
    if (log.category !== 'anti-cheat') {
        return { success: true };
    }

    const session = await getSession();
    await systemService.createLogAsync({
        ...log,
        level: (log.level as string) || 'info',
        category: (log.category as string) || 'system',
        message: (log.message as string) || '',
        user_id: session?.id as string
    });

    return { success: true };
}

// 1. Enrollment Actions
export async function enrollInCourse(courseId: string) {
  const user = await getVerifiedUser();
  // Authorization handled by RLS and implicitly by enrollment rule
  await enrollmentService.enrollInCourse(user.id as string, courseId, user.sessionId as string);

  createSystemLog({
    level: 'info',
    category: 'academic',
    message: `Student enrolled in course: ${courseId}`,
    user_id: user.id
  });

  revalidatePath('/student/courses');
  return { success: true };
}

// 2. Submission Actions
export async function submitAssignment(assignmentId: string, content: Partial<Submission>) {
  const user = await getVerifiedUser();
  const data = await assessmentService.submitAssignment(user.id as string, assignmentId, content, user.sessionId as string);

  createSystemLog({
    level: 'info',
    category: 'academic',
    message: `Assignment submitted: ${assignmentId}`,
    user_id: user.id
  });

  revalidatePath('/student/assignments');
  return { success: true, data };
}

// 3. Teacher Actions: Grading
export async function gradeSubmission(submissionId: string, gradeData: Partial<Submission>) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canGradeSubmission(currentUser);

  await assessmentService.gradeSubmission(submissionId, gradeData, user.sessionId as string);

  createSystemLog({
    level: 'info',
    category: 'academic',
    message: `Submission graded: ${submissionId} with score ${gradeData.score}`,
    user_id: user.id
  });

  revalidatePath('/teacher/grading');
  return { success: true };
}

// 4. Admin Actions: User Status
export async function toggleUserStatus(userId: string, active: boolean) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canManageUsers(currentUser);

  await userService.toggleUserStatus(userId, active, user.sessionId as string);
  revalidatePath('/admin/users');
  return { success: true };
}

// 5. Course Actions
export async function saveCourse(course: Partial<Course>) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canManageCourse(currentUser); // Initial role check

  const data = await courseService.saveCourse(currentUser, course, user.sessionId as string);

  createSystemLog({
    level: 'info',
    category: 'management',
    message: `Course ${course.id ? 'updated' : 'created'}: ${course.title} [Status: ${data.status}]`,
    user_id: user.id
  });

  revalidatePath('/teacher/courses');
  revalidatePath('/student/courses');
  return { success: true, data };
}

export async function deleteCourse(courseId: string) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canManageCourse(currentUser);

  await courseService.deleteCourse(courseId, user.sessionId as string);

  createSystemLog({
    level: 'info',
    category: 'management',
    message: `Course deleted: ${courseId}`,
    user_id: user.id
  });

  revalidatePath('/teacher/courses');
  revalidatePath('/student/courses');
  return { success: true };
}

// 6. Lesson Actions
export async function saveLesson(lesson: Partial<Lesson>) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canManageCourse(currentUser); // Simplified course access check

  const data = await learningService.saveLesson(lesson, user.sessionId as string);
  revalidatePath(`/student/courses?id=${lesson.course_id}`);
  return { success: true, data };
}

export async function deleteLesson(lessonId: string, courseId: string) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canManageCourse(currentUser);

  await learningService.deleteLesson(lessonId, user.sessionId as string);
  revalidatePath(`/student/courses?id=${courseId}`);
  return { success: true };
}

// 7. Assignment Actions
export async function saveAssignment(assignment: Partial<Assignment>) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canManageAssignments(currentUser);

  const data = await assessmentService.saveAssignment(currentUser, assignment, user.sessionId as string);

  createSystemLog({
    level: 'info',
    category: 'academic',
    message: `Assignment ${assignment.id ? 'updated' : 'created'}: ${assignment.title} [Status: ${data.status}]`,
    user_id: user.id
  });

  revalidatePath('/teacher/assignments');
  revalidatePath('/student/assignments');
  return { success: true, data };
}

export async function deleteAssignment(assignmentId: string) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canManageAssignments(currentUser);

  await assessmentService.deleteAssignment(assignmentId, user.sessionId as string);

  createSystemLog({
    level: 'info',
    category: 'academic',
    message: `Assignment deleted: ${assignmentId}`,
    user_id: user.id
  });

  revalidatePath('/teacher/assignments');
  revalidatePath('/student/assignments');
  return { success: true };
}

// 8. Quiz Actions
export async function saveQuiz(quiz: Partial<Quiz>) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canManageQuizzes(currentUser);

  const data = await assessmentService.saveQuiz(currentUser, quiz, user.sessionId as string);

  createSystemLog({
    level: 'info',
    category: 'academic',
    message: `Quiz ${quiz.id ? 'updated' : 'created'}: ${quiz.title} [Status: ${data.status}]`,
    user_id: user.id
  });

  revalidatePath('/teacher/quizzes');
  revalidatePath('/student/quizzes');
  return { success: true, data };
}

export async function deleteQuiz(quizId: string) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

  authz.canManageQuizzes(currentUser);

  await assessmentService.deleteQuiz(quizId, user.sessionId as string);

  createSystemLog({
    level: 'info',
    category: 'academic',
    message: `Quiz deleted: ${quizId}`,
    user_id: user.id
  });

  revalidatePath('/teacher/quizzes');
  revalidatePath('/student/quizzes');
  return { success: true };
}

// 9. Planner Actions
export async function savePlannerItem(item: Partial<PlannerItem>) {
  const user = await getVerifiedUser();
  const data = await systemService.savePlannerItem(user.id as string, item, user.sessionId as string);
  return { success: true, data };
}

export async function deletePlannerItem(id: string) {
  const user = await getVerifiedUser();
  await systemService.deletePlannerItem(user.id as string, id, user.sessionId as string);
  return { success: true };
}

// 10. Discussion Actions
export async function saveDiscussionPost(post: Partial<Discussion>) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);
  const data = await communicationService.saveDiscussionPost(currentUser, post, user.sessionId as string);
  return { success: true, data };
}

export async function deleteDiscussionPost(id: string) {
  const user = await getVerifiedUser();
  const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);
  await communicationService.deleteDiscussionPost(currentUser, id, user.sessionId as string);
  return { success: true };
}

// 11. Study Session Actions
export async function saveStudySession(session: Partial<StudySession>, xpEarned?: number) {
    const user = await getVerifiedUser();
    await learningService.saveStudySession(user.id as string, session, xpEarned || 0, user.sessionId as string);
    return { success: true };
}

// 12. Regrade Request
export async function requestRegrade(assignmentId: string, reason: string) {
    const user = await getVerifiedUser();
    await assessmentService.submitAssignment(user.id as string, assignmentId, { regrade_request: reason, status: 'submitted' }, user.sessionId as string);
    revalidatePath('/student/assignments');
    revalidatePath('/teacher/grading');
    return { success: true };
}

// 13. Material Actions
export async function saveMaterial(material: Partial<Material>) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageCourse(currentUser);

    const data = await learningService.saveMaterial(currentUser, material, user.sessionId as string);
    return { success: true, data };
}

export async function deleteMaterial(id: string) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageCourse(currentUser);

    await learningService.deleteMaterial(id, user.sessionId as string);
    return { success: true };
}

// 14. Student Management Actions
export async function removeEnrollment(courseId: string, studentId: string) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageCourse(currentUser);

    await enrollmentService.removeEnrollment(currentUser, courseId, studentId, user.sessionId as string);
    return { success: true };
}

export async function issueCertificate(certificate: Partial<Certificate>) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageCourse(currentUser);

    const data = await gamificationService.issueCertificate(certificate, user.sessionId as string);
    return { success: true, data };
}

// 15. Badge Actions
export async function saveBadge(badge: Partial<Badge>) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageSystem(currentUser);

    const data = await gamificationService.saveBadge(badge, user.sessionId as string);
    return { success: true, data };
}

export async function deleteBadge(id: string) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageSystem(currentUser);

    await gamificationService.deleteBadge(id, user.sessionId as string);
    return { success: true };
}

export async function assignBadge(userBadge: Partial<UserBadge>) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageCourse(currentUser);

    await gamificationService.assignBadge(userBadge, user.sessionId as string);
    return { success: true };
}

// 16. Live Class Actions
export async function saveLiveClass(liveClass: Partial<LiveClass>) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageCourse(currentUser);

    const data = await communicationService.saveLiveClass(currentUser, liveClass, user.sessionId as string);
    return { success: true, data };
}

export async function deleteLiveClass(id: string) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageCourse(currentUser);

    await communicationService.deleteLiveClass(id, user.sessionId as string);
    return { success: true };
}

// 17. Admin User & System Actions
export async function saveUser(userData: Partial<User>) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canUpdateUser(currentUser, userData.id as string);

    const data = await userService.updateUserProfile(currentUser, userData.id as string, userData, user.sessionId as string);
    revalidatePath('/admin/users');
    return { success: true, data };
}

export async function deleteUser(id: string) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageUsers(currentUser);

    await userService.deleteUser(id, user.sessionId as string);
    revalidatePath('/admin/users');
    return { success: true };
}

export async function updateSetting(key: string, value: unknown) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageSystem(currentUser);

    await systemService.updateSetting(currentUser, key, value, user.sessionId as string);
    return { success: true };
}

export async function updateMaintenance(maintenance: Partial<Maintenance>) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageSystem(currentUser);

    await systemService.updateMaintenance(currentUser, maintenance, user.sessionId as string);
    return { success: true };
}

export async function createBroadcast(broadcast: Partial<Broadcast>) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageSystem(currentUser);

    await communicationService.createBroadcast(broadcast, user.sessionId as string);
    return { success: true };
}

// 18. Quiz Submission
export async function submitQuiz(quizId: string, submissionData: Partial<QuizSubmission>) {
    const user = await getVerifiedUser();
    const result = await assessmentService.submitQuiz(user.id as string, quizId, submissionData, user.sessionId as string);

    createSystemLog({
        level: 'info',
        category: 'academic',
        message: `Quiz submitted: ${quizId} with score ${result.score}%`,
        user_id: user.id
    });

    revalidatePath('/student/quizzes');
    return { success: true, score: result.score };
}

// Mark a notification as read (for deep linking)
export async function markNotificationAsRead(notificationId: string) {
  try {
    const user = await getVerifiedUser();
    await communicationService.markNotificationAsRead(notificationId, user.sessionId as string);
    revalidatePath('/student');
    revalidatePath('/teacher');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const user = await getVerifiedUser();
    await communicationService.markAllNotificationsAsRead(userId, user.sessionId as string);
    revalidatePath('/student');
    revalidatePath('/teacher');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error };
  }
}

// Public function to check the count of teachers and admins (for signup form)
export async function getRoleCount(): Promise<{ teachers: number; admins: number; total: number }> {
    const { data, error } = await supabase.rpc('get_role_counts');
    if (error || !data) return { teachers: 0, admins: 0, total: 0 };
    return data as { teachers: number; admins: number; total: number };
}

export async function updateProfile(updates: Partial<User>) {
    const user = await getVerifiedUser();
    return saveUser({ ...updates, id: user.id as string } as any);
}

// 20. Lesson Completion & Progress
export async function markLessonComplete(lessonId: string, courseId: string) {
    const user = await getVerifiedUser();
    const result = await learningService.markLessonComplete(user.id as string, lessonId, courseId, user.sessionId as string);
    revalidatePath(`/student/courses?id=${courseId}`);
    return result;
}

// 21. Attendance
export async function recordAttendance(liveClassId: string) {
    const user = await getVerifiedUser();
    await communicationService.recordAttendance(user.id as string, liveClassId, user.sessionId as string);
    return { success: true };
}

// 19. File Upload Utility
export async function uploadFile(fileName: string, category: 'materials' | 'submissions' | 'thumbnails') {
    const user = await getVerifiedUser();
    const filePath = `${category}/${user.id}/${Date.now()}_${fileName}`;

    createSystemLog({
        level: 'info',
        category: 'management',
        message: `File upload initiated: ${fileName} in category ${category}`,
        user_id: user.id
    });

    return { filePath };
}

// 22. Get Actions
export async function getAssignments(teacherId?: string, courseId?: string) {
    const user = await getVerifiedUser();
    return assessmentService.getAssignments(teacherId, courseId, user.sessionId as string);
}

export async function getQuizzes(courseId?: string, teacherId?: string) {
    const user = await getVerifiedUser();
    return assessmentService.getQuizzes(courseId, teacherId, user.sessionId as string);
}

export async function getSubmissions(assignmentId?: string, studentId?: string) {
    const user = await getVerifiedUser();
    return assessmentService.getSubmissions(assignmentId, studentId, user.sessionId as string);
}

export async function getEnrollments(studentId?: string, courseIds?: string[]) {
    const user = await getVerifiedUser();
    if (studentId) return enrollmentService.getStudentEnrollments(studentId, user.sessionId as string);
    return enrollmentService.getCourseEnrollments(user as any, courseIds || [], user.sessionId as string);
}

export async function getCourses(teacherId?: string) {
    const session = await getSession();
    return courseService.getCourses(teacherId, session?.sessionId as string);
}

export async function getCourse(id: string) {
    const user = await getVerifiedUser();
    return courseService.getCourse(id, user.sessionId as string);
}

export async function getLessons(courseId: string) {
    const user = await getVerifiedUser();
    return learningService.getLessons(courseId, user.sessionId as string);
}

export async function getMaterials(courseId?: string) {
    const user = await getVerifiedUser();
    return learningService.getMaterials(courseId, user.sessionId as string);
}

export async function getLiveClasses(courseId?: string, teacherId?: string) {
    const user = await getVerifiedUser();
    return communicationService.getLiveClasses(courseId, teacherId, user.sessionId as string);
}

export async function getNotifications(userId: string) {
    const user = await getVerifiedUser();
    return communicationService.getNotifications(userId, user.sessionId as string);
}

export async function getMaintenance() {
    const session = await getSession();
    return systemService.getMaintenance(session?.sessionId as string);
}

export async function getPlannerItems(userId: string) {
    const user = await getVerifiedUser();
    return systemService.getPlannerItems(userId, user.sessionId as string);
}

export async function getDiscussions(courseId: string) {
    const user = await getVerifiedUser();
    return communicationService.getDiscussions(courseId, user.sessionId as string);
}

export async function getSystemLogs(limit = 100) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);
    return systemService.getLogs(currentUser, limit, user.sessionId as string);
}

export async function getUserBadges(userId: string) {
    const user = await getVerifiedUser();
    return gamificationService.getUserBadges(userId, user.sessionId as string);
}

export async function getCertificates(userId: string) {
    const user = await getVerifiedUser();
    return gamificationService.getCertificates(userId, user.sessionId as string);
}

export async function getQuizSubmissions(quizId?: string, studentId?: string) {
    const user = await getVerifiedUser();
    return assessmentService.getQuizSubmissions(quizId, studentId, user.sessionId as string);
}

export async function getBadges() {
    await getVerifiedUser();
    return gamificationService.getBadges();
}

export async function getSettings() {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);
    return systemService.getSettings(currentUser, user.sessionId as string);
}

export async function getUsers() {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageUsers(currentUser);

    return userService.getAllUsers(user.sessionId as string);
}

export async function notifyUser(params: { target_id: string, n_title: string, n_msg: string, n_link?: string, n_type?: string }) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageSystem(currentUser);

    return communicationService.notifyUser(params, user.sessionId as string);
}

export async function updateSystemLog(id: string, updates: Record<string, unknown>) {
    const user = await getVerifiedUser();
    const currentUser = await userService.getCurrentUser(user.id as string, user.sessionId as string);

    authz.canManageSystem(currentUser);

    return systemService.updateLog(currentUser, id, updates, user.sessionId as string);
}

export async function getLessonCompletions(userId?: string) {
    const user = await getVerifiedUser();
    return learningService.getLessonCompletions(userId || user.id as string, user.sessionId as string);
}

export async function getSessions() {
    const user = await getVerifiedUser();
    const { SessionRepository } = await import('./repositories/session.repository');
    const repo = new SessionRepository();
    return repo.findAll(user.sessionId as string);
}

export async function logAntiCheatViolation(violation: { type: string; assessmentTitle: string; metadata?: Record<string, unknown> }) {
    const user = await getVerifiedUser();

    return await createSystemLog({
        category: 'anti-cheat',
        level: 'warning',
        message: `User ${user.email} attempted ${violation.type} during ${violation.assessmentTitle}`,
        user_id: user.id,
        metadata: { ...violation.metadata, type: violation.type, assessmentTitle: violation.assessmentTitle, timestamp: new Date().toISOString() }
    });
}
