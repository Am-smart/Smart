import { systemDb } from '../database/system.db';
import { learningDb } from '../database/learning.db';
import { supabase, withSession } from '../supabase';
import { SystemLog, Maintenance, PlannerItem, User, Setting, Enrollment, Discussion, Notification, LiveClass, Broadcast } from '../types';
import { UserDomain } from '../domain/user.domain';
import { EnrollmentDomain } from '../domain/enrollment.domain';
import { CommunicationDomain } from '../domain/communication.domain';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../api-error';

export class SystemService {
  // Logs
  async createLog(log: SystemLog, sessionId?: string): Promise<boolean> {
    return systemDb.createSystemLog(log, sessionId);
  }

  async createLogAsync(log: SystemLog): Promise<void> {
    const { taskQueue } = await import('../queue/task-queue');
    taskQueue.enqueue(async () => {
      await this.createLog(log);
    });
  }

  async getLogs(
    currentUser: User,
    limit: number,
    sessionId: string,
    filters: { user_id?: string; course_id?: string; resource_id?: string; category?: string; course_ids?: string[] } = {}
  ): Promise<SystemLog[]> {
    if (!currentUser) throw new UnauthorizedError();

    const finalFilters: { user_id?: string; course_id?: string; resource_id?: string; category?: string; course_ids?: string[] } = { ...filters };

    // Role-based filtering logic
    if (UserDomain.isAdmin(currentUser)) {
      // Admins have full access, keep filters as is
    } else if (UserDomain.isTeacher(currentUser)) {
      // Teachers can only see anti-cheat logs for their courses
      finalFilters.category = 'anti-cheat';

      const teacherCourses = await learningDb.findAllCourses(currentUser.id, sessionId);
      const teacherCourseIds = teacherCourses.map(c => c.id);

      if (finalFilters.course_id) {
        if (!teacherCourseIds.includes(finalFilters.course_id)) {
          throw new ForbiddenError('Forbidden: You can only view logs for your own courses');
        }
      } else {
        // If no course_id is specified, the systemDb will need to handle multiple course_ids
        // Since findAllSystemLogs currently takes a single course_id, we'll implement
        // a fallback or update the adapter. For now, let's enforce providing a course_id
        // or ensure the teacher only sees logs they are authorized for.
        // We will pass all teacher course IDs to the adapter if it supports arrays.
        finalFilters.course_ids = teacherCourseIds;
      }
    } else {
      // Students can only see their own anti-cheat logs
      finalFilters.category = 'anti-cheat';
      finalFilters.user_id = currentUser.id;

      // Verify student is actually enrolled in the course if course_id is provided
      if (finalFilters.course_id) {
          const enrollment = await learningDb.findEnrollmentByCourseAndStudent(finalFilters.course_id, currentUser.id, sessionId);
          if (!enrollment) {
              throw new ForbiddenError('Forbidden: You are not enrolled in this course');
          }
      }
    }

    return systemDb.findAllSystemLogs(limit, sessionId, finalFilters);
  }

  async clearLogs(
    currentUser: User,
    sessionId: string,
    filters: { course_id?: string; resource_id?: string; category?: string; before?: string } = {}
  ): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    await systemDb.deleteSystemLogs(sessionId, filters);
  }

  async updateLog(currentUser: User, id: string, updates: Partial<SystemLog>, sessionId: string): Promise<SystemLog> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    return systemDb.updateSystemLog(id, updates, sessionId);
  }

  // Maintenance
  async getMaintenance(sessionId?: string): Promise<Maintenance> {
    return systemDb.getMaintenance(sessionId);
  }

  async updateMaintenance(currentUser: User, maintenance: Partial<Maintenance>, sessionId: string): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    await systemDb.updateMaintenance(maintenance, sessionId);
  }

  // Planner
  async getPlannerItems(userId: string, sessionId: string, currentUser?: User): Promise<PlannerItem[]> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only view your own planner items');
    }
    return systemDb.findPlannerItemsByUserId(userId, sessionId);
  }

  async savePlannerItem(userId: string, item: Partial<PlannerItem>, sessionId: string, currentUser?: User): Promise<PlannerItem> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only manage your own planner items');
    }
    return systemDb.upsertPlannerItem({ ...item, user_id: userId }, sessionId);
  }

  async deletePlannerItem(userId: string, id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only manage your own planner items');
    }
    await systemDb.deletePlannerItem(id, userId, sessionId);
  }

  // Settings
  async getSettings(currentUser: User, sessionId: string): Promise<Setting[]> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    return systemDb.findAllSettings(sessionId);
  }

  async updateSetting(currentUser: User, key: string, value: unknown, sessionId: string): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new ForbiddenError();
    await systemDb.updateSetting(key, value, sessionId);
  }

  // Enrollments (Merged from EnrollmentService)
  async enrollInCourse(studentId: string, courseId: string, sessionId: string, enrollmentCode?: string): Promise<Enrollment> {
    const course = await learningDb.findCourseById(courseId, sessionId);
    if (!course) throw new NotFoundError('Course not found');

    EnrollmentDomain.validateEnrollmentCode(course.enrollment_id, enrollmentCode);

    const enrollmentToSave = EnrollmentDomain.create(studentId, courseId);
    return learningDb.upsertEnrollment(enrollmentToSave, sessionId);
  }

  async getStudentEnrollments(studentId: string, sessionId: string, currentUser?: User): Promise<Enrollment[]> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== studentId) {
        throw new ForbiddenError('Unauthorized: You can only view your own enrollments');
    }
    return learningDb.findEnrollmentsByStudentId(studentId, sessionId);
  }

  async getCourseEnrollments(currentUser: User, courseIds: string[], sessionId: string): Promise<Enrollment[]> {
    if (!UserDomain.canManageContent(currentUser)) throw new ForbiddenError();

    if (UserDomain.isTeacher(currentUser)) {
        const teacherCourses = await learningDb.findAllCourses(currentUser.id, sessionId);
        const teacherCourseIds = teacherCourses.map(c => c.id);
        if (!courseIds.every(id => teacherCourseIds.includes(id))) {
            throw new ForbiddenError('Forbidden: You can only view enrollments for your own courses');
        }
    }

    return learningDb.findEnrollmentsByCourseIds(courseIds, sessionId);
  }

  async removeEnrollment(currentUser: User, courseId: string, studentId: string, sessionId: string): Promise<void> {
    if (!UserDomain.canManageContent(currentUser)) throw new ForbiddenError();
    await learningDb.deleteEnrollment(courseId, studentId, sessionId);
  }

  // Communications (Merged from CommunicationService)
  async getDiscussions(courseId: string, sessionId: string, userId?: string, userRole?: string): Promise<Discussion[]> {
    if (userRole === 'student' && userId) {
        const enrollment = await learningDb.findEnrollmentByCourseAndStudent(courseId, userId, sessionId!);
        if (!enrollment) return [];
    }
    return systemDb.findDiscussionsByCourseId(courseId, sessionId);
  }

  async saveDiscussionPost(currentUser: User, post: Partial<Discussion>, sessionId: string): Promise<Discussion> {
    const postToSave = CommunicationDomain.prepareDiscussion(post, currentUser.id);
    return systemDb.upsertDiscussion(postToSave, sessionId);
  }

  async deleteDiscussionPost(currentUser: User, id: string, sessionId: string): Promise<void> {
    await systemDb.deleteDiscussion(id, currentUser.id, sessionId);
  }

  async getNotifications(userId: string, sessionId: string, currentUser?: User): Promise<Notification[]> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only view your own notifications');
    }
    return systemDb.findNotificationsByUserId(userId, sessionId);
  }

  async markNotificationAsRead(id: string, sessionId: string): Promise<void> {
    // Note: The systemDb operation uses sessionId for RLS if configured,
    // but we might want to check ownership if possible here too.
    // For now, RLS handles individual record access.
    await systemDb.markNotificationAsRead(id, sessionId);
  }

  async markAllNotificationsAsRead(userId: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && currentUser.role === 'student' && currentUser.id !== userId) {
        throw new ForbiddenError('Unauthorized: You can only manage your own notifications');
    }
    // "Clear All" should dismiss all notifications for the user
    await systemDb.updateNotificationsForUser(userId, { dismissed_at: new Date().toISOString(), is_read: true }, sessionId);
  }

  async dismissNotification(id: string, sessionId: string): Promise<void> {
      await systemDb.updateNotification(id, { dismissed_at: new Date().toISOString() }, sessionId);
  }

  async acknowledgeNotification(id: string, sessionId: string): Promise<void> {
      await systemDb.updateNotification(id, { acknowledged_at: new Date().toISOString(), is_read: true }, sessionId);
  }

  async notifyUser(params: { target_id: string, n_title: string, n_msg: string, n_link?: string, n_type?: string }, sessionId: string): Promise<void> {
    await systemDb.createNotification(params.target_id, params.n_title, params.n_msg, params.n_link, params.n_type, sessionId);
  }

  async getMergedNotifications(user: User, userId: string, sessionId: string): Promise<Notification[]> {
    // With fan-out trigger, all broadcasts now exist as individual notifications.
    // We only need to fetch from the notifications table.
    // We filter out dismissed and expired notifications.
    const notifications = await this.getNotifications(userId, sessionId, user);
    const now = new Date();

    return notifications.filter(n => {
        if (n.dismissed_at) return false;

        // Check for expiration in metadata
        if (n.metadata?.expires_at) {
            try {
                const expiresAt = new Date(n.metadata.expires_at as string);
                if (expiresAt < now) return false;
            } catch {
                // If invalid date, keep the notification
            }
        }

        return true;
    }).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  async getLiveClasses(courseId?: string, teacherId?: string, sessionId?: string, userId?: string, userRole?: string): Promise<LiveClass[]> {
    if (userRole === 'student' && userId) {
        const enrollments = await learningDb.findEnrollmentsByStudentId(userId, sessionId!);
        const enrolledCourseIds = enrollments.map(e => e.course_id);

        if (courseId && !enrolledCourseIds.includes(courseId)) {
            return [];
        }

        const liveClasses = await systemDb.findAllLiveClasses(courseId, teacherId, sessionId);
        return liveClasses.filter(lc => enrolledCourseIds.includes(lc.course_id));
    }

    if (userRole === 'teacher' && userId) {
        const liveClasses = await systemDb.findAllLiveClasses(courseId, userId, sessionId);
        return liveClasses;
    }

    return systemDb.findAllLiveClasses(courseId, teacherId, sessionId);
  }

  async saveLiveClass(currentUser: User, liveClass: Partial<LiveClass>, sessionId: string): Promise<LiveClass> {
    if (!UserDomain.canManageContent(currentUser)) throw new ForbiddenError();

    if (UserDomain.isTeacher(currentUser)) {
        if (liveClass.id) {
            const existing = await systemDb.findLiveClassById(liveClass.id, sessionId);
            if (existing && existing.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only manage your own live classes');
            }
        } else if (liveClass.course_id) {
            const course = await learningDb.findCourseById(liveClass.course_id, sessionId);
            if (course && course.teacher_id !== currentUser.id) {
                throw new ForbiddenError('Unauthorized: You can only create live classes for your own courses');
            }
        }
    }

    const liveClassToSave = CommunicationDomain.prepareLiveClass(liveClass, currentUser.id);
    return systemDb.upsertLiveClass(liveClassToSave, sessionId);
  }

  async deleteLiveClass(id: string, sessionId: string, currentUser?: User): Promise<void> {
    if (currentUser && UserDomain.isTeacher(currentUser)) {
        const existing = await systemDb.findLiveClassById(id, sessionId);
        if (existing && existing.teacher_id !== currentUser.id) {
            throw new ForbiddenError('Unauthorized: You can only manage your own live classes');
        }
    }
    await systemDb.deleteLiveClass(id, sessionId);
  }

  async recordAttendance(studentId: string, liveClassId: string, sessionId: string): Promise<void> {
    await systemDb.upsertAttendance({
      live_class_id: liveClassId,
      student_id: studentId,
      join_time: new Date().toISOString(),
      is_present: true
    }, sessionId);
  }

  async createBroadcast(broadcast: Partial<Broadcast>, sessionId: string): Promise<Broadcast> {
    const broadcastToSave = CommunicationDomain.prepareBroadcast(broadcast);
    return systemDb.createBroadcast(broadcastToSave, sessionId);
  }

  // Stats & Health
  async getSystemStats(sessionId: string): Promise<Record<string, number>> {
    return systemDb.getSystemStats(sessionId);
  }

  async getHealthMetrics(sessionId: string): Promise<unknown> {
    return systemDb.getHealthMetrics(sessionId);
  }

  // Storage
  async uploadFile(file: File, category: string, userId: string, sessionId: string): Promise<{ filePath: string, publicUrl: string }> {
    const fileName = file.name;
    const filePath = `${category}/${userId}/${Date.now()}_${fileName}`;
    const buffer = await file.arrayBuffer();

    const storage = supabase.storage.from('lms-files');
    const storageWithSession = sessionId ? withSession(storage, sessionId) : storage;

    const { error: uploadError } = await storageWithSession.upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
    });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('lms-files')
      .getPublicUrl(filePath);

    await this.createLogAsync({
        level: 'info',
        category: 'management',
        message: `File uploaded: ${fileName} in category ${category}`,
        user_id: userId,
        metadata: { filePath, publicUrl }
    });

    return { filePath, publicUrl };
  }
}

export const systemService = new SystemService();
