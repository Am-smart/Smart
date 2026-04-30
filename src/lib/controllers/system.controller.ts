import { userService } from '../services/user.service';
import { systemService } from '../services/system.service';
import { communicationService } from '../services/communication.service';
import { enrollmentService } from '../services/enrollment.service';
import { SystemMapper, CommunicationMapper, UserMapper } from '../mappers';
import { rbac } from '../auth/rbac';
import { User, PlannerItem, Discussion } from '../types';
import { UserDTO } from '../dto/auth.dto';
import { PlannerItemDTO } from '../dto/system.dto';
import { DiscussionDTO, NotificationDTO, LiveClassDTO } from '../dto/communication.dto';
import { EnrollmentDomain } from '../domain/enrollment.domain';
import { CommunicationDomain } from '../domain/communication.domain';

export class SystemController {
  async getAllUsers(user: User): Promise<UserDTO[]> {
    if (!rbac.can(user, 'user:manage')) throw new Error('Unauthorized');
    const users = await userService.getAllUsers(user, user.sessionId);
    return users.map(UserMapper.toDTO);
  }

  async getPlannerItems(user: User, userId: string): Promise<PlannerItemDTO[]> {
    const items = await systemService.getPlannerItems(userId, user.sessionId);
    return items.map(SystemMapper.toPlannerItemDTO);
  }

  async savePlannerItem(user: User, item: Partial<PlannerItem>): Promise<PlannerItemDTO> {
    const saved = await systemService.savePlannerItem(user.id, item, user.sessionId);
    return SystemMapper.toPlannerItemDTO(saved);
  }

  async getDiscussions(user: User, courseId: string): Promise<DiscussionDTO[]> {
    const discussions = await communicationService.getDiscussions(courseId, user.sessionId);
    return discussions.map(CommunicationMapper.toDiscussionDTO);
  }

  async saveDiscussionPost(user: User, post: Partial<Discussion>): Promise<DiscussionDTO> {
    // Domain logic: validation
    CommunicationDomain.validateDiscussionPost(post);

    const saved = await communicationService.saveDiscussionPost(user, post, user.sessionId);
    return CommunicationMapper.toDiscussionDTO(saved);
  }

  async getLiveClasses(user: User, courseId?: string, teacherId?: string): Promise<LiveClassDTO[]> {
    const classes = await communicationService.getLiveClasses(courseId, teacherId, user.sessionId);
    return classes.map(CommunicationMapper.toLiveClassDTO);
  }

  async getNotifications(user: User, userId: string): Promise<NotificationDTO[]> {
    const notifications = await communicationService.getNotifications(userId, user.sessionId);
    return notifications.map(CommunicationMapper.toNotificationDTO);
  }

  async enrollInCourse(user: User, courseId: string): Promise<void> {
    // Domain logic: Enrollment invariants
    // (Check if course is published, etc. - usually handled in service or domain)
    await enrollmentService.enrollInCourse(user.id, courseId, user.sessionId);
  }

  async unenrollFromCourse(user: User, courseId: string, studentId: string): Promise<void> {
    if (!rbac.can(user, 'course:update')) throw new Error('Unauthorized');

    // Domain logic: check if unenrollment is allowed
    EnrollmentDomain.validateUnenrollment(user, studentId);

    await enrollmentService.removeEnrollment(user, courseId, studentId, user.sessionId);
  }
}

export const systemController = new SystemController();
