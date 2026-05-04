import { systemDb } from '../database/system.db';
import { learningDb } from '../database/learning.db';
import { SystemLog, Maintenance, PlannerItem, User, Setting, Enrollment, Discussion, Notification, LiveClass, Broadcast } from '../types';
import { UserDomain } from '../domain/user.domain';
import { EnrollmentDomain } from '../domain/enrollment.domain';
import { CommunicationDomain } from '../domain/communication.domain';

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
    if (!currentUser) throw new Error('Unauthorized');

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
          throw new Error('Forbidden: You can only view logs for your own courses');
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
    }

    return systemDb.findAllSystemLogs(limit, sessionId, finalFilters);
  }

  async clearLogs(
    currentUser: User,
    sessionId: string,
    filters: { course_id?: string; resource_id?: string; category?: string; before?: string } = {}
  ): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    await systemDb.deleteSystemLogs(sessionId, filters);
  }

  async updateLog(currentUser: User, id: string, updates: Partial<SystemLog>, sessionId: string): Promise<SystemLog> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    return systemDb.updateSystemLog(id, updates, sessionId);
  }

  // Maintenance
  async getMaintenance(sessionId?: string): Promise<Maintenance> {
    return systemDb.getMaintenance(sessionId);
  }

  async updateMaintenance(currentUser: User, maintenance: Partial<Maintenance>, sessionId: string): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    await systemDb.updateMaintenance(maintenance, sessionId);
  }

  // Planner
  async getPlannerItems(userId: string, sessionId: string): Promise<PlannerItem[]> {
    return systemDb.findPlannerItemsByUserId(userId, sessionId);
  }

  async savePlannerItem(userId: string, item: Partial<PlannerItem>, sessionId: string): Promise<PlannerItem> {
    return systemDb.upsertPlannerItem({ ...item, user_id: userId }, sessionId);
  }

  async deletePlannerItem(userId: string, id: string, sessionId: string): Promise<void> {
    await systemDb.deletePlannerItem(id, userId, sessionId);
  }

  // Settings
  async getSettings(currentUser: User, sessionId: string): Promise<Setting[]> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    return systemDb.findAllSettings(sessionId);
  }

  async updateSetting(currentUser: User, key: string, value: unknown, sessionId: string): Promise<void> {
    if (!UserDomain.isAdmin(currentUser)) throw new Error('Forbidden');
    await systemDb.updateSetting(key, value, sessionId);
  }

  // Enrollments (Merged from EnrollmentService)
  async enrollInCourse(studentId: string, courseId: string, sessionId: string, enrollmentCode?: string): Promise<Enrollment> {
    const course = await learningDb.findCourseById(courseId, sessionId);
    if (!course) throw new Error('Course not found');

    EnrollmentDomain.validateEnrollmentCode(course.course_id, enrollmentCode);

    const enrollmentToSave = EnrollmentDomain.create(studentId, courseId);
    return learningDb.upsertEnrollment(enrollmentToSave, sessionId);
  }

  async getStudentEnrollments(studentId: string, sessionId: string): Promise<Enrollment[]> {
    return learningDb.findEnrollmentsByStudentId(studentId, sessionId);
  }

  async getCourseEnrollments(currentUser: User, courseIds: string[], sessionId: string): Promise<Enrollment[]> {
    if (!UserDomain.canManageContent(currentUser)) throw new Error('Forbidden');
    return learningDb.findEnrollmentsByCourseIds(courseIds, sessionId);
  }

  async removeEnrollment(currentUser: User, courseId: string, studentId: string, sessionId: string): Promise<void> {
    if (!UserDomain.canManageContent(currentUser)) throw new Error('Forbidden');
    await learningDb.deleteEnrollment(courseId, studentId, sessionId);
  }

  // Communications (Merged from CommunicationService)
  async getDiscussions(courseId: string, sessionId: string): Promise<Discussion[]> {
    return systemDb.findDiscussionsByCourseId(courseId, sessionId);
  }

  async saveDiscussionPost(currentUser: User, post: Partial<Discussion>, sessionId: string): Promise<Discussion> {
    const postToSave = CommunicationDomain.prepareDiscussion(post, currentUser.id);
    return systemDb.upsertDiscussion(postToSave, sessionId);
  }

  async deleteDiscussionPost(currentUser: User, id: string, sessionId: string): Promise<void> {
    await systemDb.deleteDiscussion(id, currentUser.id, sessionId);
  }

  async getNotifications(userId: string, sessionId: string): Promise<Notification[]> {
    return systemDb.findNotificationsByUserId(userId, sessionId);
  }

  async markNotificationAsRead(id: string, sessionId: string): Promise<void> {
    await systemDb.markNotificationAsRead(id, sessionId);
  }

  async markAllNotificationsAsRead(userId: string, sessionId: string): Promise<void> {
    await systemDb.markAllNotificationsAsRead(userId, sessionId);
  }

  async notifyUser(params: { target_id: string, n_title: string, n_msg: string, n_link?: string, n_type?: string }, sessionId: string): Promise<void> {
    await systemDb.createNotification(params.target_id, params.n_title, params.n_msg, params.n_link, params.n_type, sessionId);
  }

  async getLiveClasses(courseId?: string, teacherId?: string, sessionId?: string): Promise<LiveClass[]> {
    return systemDb.findAllLiveClasses(courseId, teacherId, sessionId);
  }

  async saveLiveClass(currentUser: User, liveClass: Partial<LiveClass>, sessionId: string): Promise<LiveClass> {
    const liveClassToSave = CommunicationDomain.prepareLiveClass(liveClass, currentUser.id);
    return systemDb.upsertLiveClass(liveClassToSave, sessionId);
  }

  async deleteLiveClass(id: string, sessionId: string): Promise<void> {
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

}

export const systemService = new SystemService();
