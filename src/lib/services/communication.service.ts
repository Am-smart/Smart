import { DiscussionRepository } from '../repositories/discussion.repository';
import { NotificationRepository } from '../repositories/notification.repository';
import { LiveClassRepository } from '../repositories/live-class.repository';
import { AttendanceRepository } from '../repositories/attendance.repository';
import { BroadcastRepository } from '../repositories/broadcast.repository';
import { Discussion, Notification, LiveClass, User, Broadcast } from '../types';

export class CommunicationService {
  private discussionRepo = new DiscussionRepository();
  private notificationRepo = new NotificationRepository();
  private liveClassRepo = new LiveClassRepository();
  private attendanceRepo = new AttendanceRepository();
  private broadcastRepo = new BroadcastRepository();

  // Discussions
  async getDiscussions(courseId: string, sessionId: string): Promise<Discussion[]> {
    return this.discussionRepo.findByCourseId(courseId, sessionId);
  }

  async saveDiscussionPost(currentUser: User, post: Partial<Discussion>, sessionId: string): Promise<Discussion> {
    return this.discussionRepo.upsert({
      ...post,
      user_id: post.user_id || currentUser.id
    }, sessionId);
  }

  async deleteDiscussionPost(currentUser: User, id: string, sessionId: string): Promise<void> {
    await this.discussionRepo.delete(id, currentUser.id, sessionId);
  }

  // Notifications
  async getNotifications(userId: string, sessionId: string): Promise<Notification[]> {
    return this.notificationRepo.findByUserId(userId, sessionId);
  }

  async markNotificationAsRead(id: string, sessionId: string): Promise<void> {
    await this.notificationRepo.markAsRead(id, sessionId);
  }

  async markAllNotificationsAsRead(userId: string, sessionId: string): Promise<void> {
    await this.notificationRepo.markAllAsRead(userId, sessionId);
  }

  async notifyUser(currentUser: User, params: { target_id: string, n_title: string, n_msg: string, n_link?: string, n_type?: string }, sessionId: string): Promise<void> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    await this.notificationRepo.create(params.target_id, params.n_title, params.n_msg, params.n_link, params.n_type, sessionId);
  }

  // Live Classes
  async getLiveClasses(courseId?: string, teacherId?: string, sessionId?: string): Promise<LiveClass[]> {
    return this.liveClassRepo.findAll(courseId, teacherId, sessionId);
  }

  async saveLiveClass(currentUser: User, liveClass: Partial<LiveClass>, sessionId: string): Promise<LiveClass> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    return this.liveClassRepo.upsert({
      ...liveClass,
      teacher_id: liveClass.teacher_id || currentUser.id,
      status: liveClass.status || 'scheduled'
    }, sessionId);
  }

  async deleteLiveClass(currentUser: User, id: string, sessionId: string): Promise<void> {
    if (currentUser.role !== 'admin' && currentUser.role !== 'teacher') throw new Error('Forbidden');
    await this.liveClassRepo.delete(id, sessionId);
  }

  async recordAttendance(studentId: string, liveClassId: string, sessionId: string): Promise<void> {
    await this.attendanceRepo.upsert({
      live_class_id: liveClassId,
      student_id: studentId,
      join_time: new Date().toISOString(),
      is_present: true
    }, sessionId);
  }

  async createBroadcast(currentUser: User, broadcast: Partial<Broadcast>, sessionId: string): Promise<Broadcast> {
    if (currentUser.role !== 'admin') throw new Error('Forbidden');
    return this.broadcastRepo.create(broadcast, sessionId);
  }
}

export const communicationService = new CommunicationService();
