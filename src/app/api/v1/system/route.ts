import { withHandler } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';
import { learningService } from '@/lib/services/learning.service';
import { authService } from '@/lib/services/auth.service';
import { assessmentService } from '@/lib/services/assessment.service';
import { rbac } from '@/lib/auth/rbac';
import { UserDomain } from '@/lib/domain/user.domain';
import { SystemMapper, CommunicationMapper, AssessmentMapper } from '@/lib/mappers';
import { sanitizeObject } from '@/lib/validation';
import { UnauthorizedError } from '@/lib/api-error';
import { User } from '@/lib/types';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'maintenance') {
    return systemService.getMaintenance(user?.sessionId);
  }

  if (!user) throw new UnauthorizedError();

  switch (action) {
    case 'logs': {
      if (!rbac.can(user, 'system:logs:view')) throw new UnauthorizedError();

      const filters = {
        user_id: searchParams.get('userId') || undefined,
        course_id: searchParams.get('courseId') || undefined,
        resource_id: searchParams.get('resourceId') || undefined,
        category: searchParams.get('category') || undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
        offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
      };

      const logs = await systemService.getLogs(user, user.sessionId!, filters);
      return logs.map(SystemMapper.toSystemLogDTO);
    }
    case 'sessions': {
        if (!user) throw new UnauthorizedError();
        return authService.getSessions(user);
    }
    case 'settings': {
      if (!rbac.can(user, 'system:manage')) throw new UnauthorizedError();
      return systemService.getSettings(user, user.sessionId!);
    }
    case 'users': {
      if (!rbac.can(user, 'user:manage')) throw new UnauthorizedError();
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
      const users = await authService.getAllUsers(user, limit, offset);
      const { UserMapper } = await import('@/lib/mappers');
      return users.map(UserMapper.toDTO);
    }
    case 'planner': {
      const userId = searchParams.get('userId') || user.id;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
      const items = await systemService.getPlannerItems(userId, user.sessionId!, user, { limit, offset });
      return items.map(SystemMapper.toPlannerItemDTO);
    }
    case 'notifications': {
      const userId = searchParams.get('userId') || user.id;
      if (searchParams.get('unreadCount') === 'true') {
          const count = await systemService.getUnreadCount(userId, user.sessionId!, user);
          return { count };
      }
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
      const merged = await systemService.getMergedNotifications(user, userId, user.sessionId!, { limit, offset });
      return merged.map(CommunicationMapper.toNotificationDTO);
    }
    case 'live-classes': {
      const courseId = searchParams.get('courseId') || undefined;
      const teacherId = searchParams.get('teacherId') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
      const classes = await systemService.getLiveClasses(courseId, teacherId, user.sessionId!, user.id, user.role, { limit, offset });
      return classes.map(CommunicationMapper.toLiveClassDTO);
    }
    case 'discussions': {
      const courseId = searchParams.get('courseId');
      if (!courseId) throw new Error('courseId is required');
      if (courseId === 'global') return [];
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
      const discussions = await systemService.getDiscussions(courseId, user.sessionId!, user.id, user.role, { limit, offset });
      return discussions.map(CommunicationMapper.toDiscussionDTO);
    }
    case 'attendance': {
      const liveClassId = searchParams.get('liveClassId');
      if (!liveClassId) throw new Error('liveClassId is required');
      const attendance = await systemService.getAttendance(user, liveClassId, user.sessionId!);
      return attendance.map(CommunicationMapper.toAttendanceDTO);
    }
    case 'enrollments': {
      const studentId = searchParams.get('studentId');
      const courseIdsStr = searchParams.get('courseIds');
      const courseIds = courseIdsStr ? courseIdsStr.split(',').filter(id => id.trim() !== '') : undefined;

      if (studentId) {
        const enrollments = await systemService.getStudentEnrollments(studentId, user.sessionId!, user);
        return enrollments.map(SystemMapper.toEnrollmentDTO);
      } else if (courseIds && courseIds.length > 0) {
        const enrollments = await systemService.getCourseEnrollments(user, courseIds, user.sessionId!);
        return enrollments.map(SystemMapper.toEnrollmentDTO);
      }
      return [];
    }
    case 'quiz-submissions': {
        const quizId = searchParams.get('quizId') || undefined;
        const studentId = searchParams.get('studentId') || undefined;
        const courseId = searchParams.get('courseId') || undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
        const submissions = await assessmentService.getQuizSubmissions(quizId, studentId, user.sessionId!, user.id, user.role, courseId, { limit, offset });
        return submissions.map(AssessmentMapper.toQuizSubmissionDTO);
    }
    case 'lesson-completions': {
        const userId = searchParams.get('userId') || user.id;
        return learningService.getLessonCompletions(userId, user.sessionId!);
    }
    case 'stats': {
        if (!rbac.can(user, 'system:manage')) throw new UnauthorizedError();
        return systemService.getSystemStats(user.sessionId!);
    }
    case 'support-tickets': {
        if (!rbac.can(user, 'ticket:view')) throw new UnauthorizedError();
        const tickets = await systemService.getSupportTickets(user, user.sessionId!, {
            user_id: searchParams.get('userId') || undefined,
            assigned_to: searchParams.get('assignedTo') || undefined,
            status: searchParams.get('status') || undefined,
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
            offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
        });
        return tickets.map(SystemMapper.toSupportTicketDTO);
    }
    case 'health': {
        if (!rbac.can(user, 'system:manage')) throw new UnauthorizedError();
        return systemService.getHealthMetrics(user.sessionId!);
    }
    case 'anti-cheat-logs': {
        const filters = {
            user_id: searchParams.get('userId') || undefined,
            course_id: searchParams.get('courseId') || undefined,
            resource_id: searchParams.get('resourceId') || undefined,
            limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 200,
            offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
        };
        const logs = await systemService.getAntiCheatLogs(user, user.sessionId!, filters);
        return logs.map(SystemMapper.toAntiCheatLogDTO);
    }
    default:
      throw new Error('Invalid GET action');
  }
}, { requireAuth: false });

export const POST = withHandler(async (user, request) => {
  const rawBody = await request.json();
  const body = sanitizeObject(rawBody);
  const { action, ...data } = body;

  switch (action) {
    case 'log': {
      await systemService.createLog({ ...data, user_id: user.id }, user.sessionId!);
      return { success: true };
    }
    case 'anti-cheat-log': {
        await systemService.createAntiCheatLog({ ...data, user_id: user.id }, user.sessionId!);
        return { success: true };
    }
    case 'update-maintenance': {
      await systemService.updateMaintenance(user, data, user.sessionId!);
      return { success: true };
    }
    case 'update-setting': {
      await systemService.updateSetting(user, data.key, data.value, user.sessionId!);
      return { success: true };
    }
    case 'save-user': {
        const { UserMapper } = await import('@/lib/mappers');
        if (data.id) {
            UserDomain.validateUpdate(user, data.id);
            const updated = await authService.updateUserProfile(user, data.id, data, user.sessionId!);
            return UserMapper.toDTO(updated);
        } else {
            // New User Creation by Admin
            const newUser = await authService.createUser(user, {
                full_name: data.full_name,
                email: data.email,
                password: data.password,
                phone: data.phone,
                role: data.role
            });

            if (!newUser) throw new Error('User creation failed');

            return UserMapper.toDTO(newUser);
        }
    }
    case 'save-planner': {
        const userId = data.user_id || user.id;
        const saved = await systemService.savePlannerItem(userId, data, user.sessionId!, user);
        return SystemMapper.toPlannerItemDTO(saved);
    }
    case 'save-live-class': {
        if (!rbac.can(user, 'lesson:manage')) throw new UnauthorizedError();
        const saved = await systemService.saveLiveClass(user, data, user.sessionId!);
        return CommunicationMapper.toLiveClassDTO(saved);
    }
    case 'save-discussion': {
        const saved = await systemService.saveDiscussionPost(user, data, user.sessionId!);
        return CommunicationMapper.toDiscussionDTO(saved);
    }
    case 'enroll': {
        await systemService.enrollInCourse(user.id, data.courseId, user.sessionId!, data.enrollmentCode);
        return { success: true };
    }
    case 'attendance': {
        await systemService.recordAttendance(user.id, data.liveClassId, user.sessionId!);
        return { success: true };
    }
    case 'broadcast': {
        if (!rbac.can(user, 'system:manage')) throw new UnauthorizedError();
        await systemService.createBroadcast(data, user.sessionId!);
        return { success: true };
    }
    case 'lesson-completion': {
        await learningService.markLessonComplete(user.id, data.lessonId, data.courseId, user.sessionId!);
        return { success: true };
    }
    case 'upload-path': {
        const { fileName, category } = data;
        const filePath = `${category}/${user.id}/${Date.now()}_${fileName}`;
        await systemService.createLogAsync({
            level: 'info',
            category: 'management',
            message: `File upload initiated: ${fileName} in category ${category}`,
            user_id: user.id
        });
        return { filePath };
    }
    case 'register-push': {
        const { systemDb } = await import('@/lib/database/system.db');
        const saved = await systemDb.upsertPushSubscription({
            user_id: user.id,
            endpoint: data.endpoint,
            p256dh: data.keys.p256dh,
            auth: data.keys.auth
        }, user.sessionId!);
        return SystemMapper.toPushSubscriptionDTO(saved);
    }
    case 'unregister-push': {
        const { systemDb } = await import('@/lib/database/system.db');
        await systemDb.deletePushSubscription(data.endpoint, user.sessionId!);
        return { success: true };
    }
    case 'save-ticket': {
        if (!rbac.can(user, 'ticket:create')) throw new UnauthorizedError();
        const saved = await systemService.saveSupportTicket(user, data, user.sessionId!);
        return SystemMapper.toSupportTicketDTO(saved);
    }
    case 'upload': {
        // This usually requires multipart/form-data, keep separate route for physical uploads
        throw new Error('Physical uploads must use /api/system/upload');
    }
    case 'clear-cache': {
        if (!rbac.can(user, 'system:manage')) throw new UnauthorizedError();
        // Server-side cache clearing logic would go here if any.
        // For now, we'll return success to indicate the request was handled.
        return { success: true };
    }
    default:
      throw new Error('Invalid POST action');
  }
});

export const DELETE = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    if (!id) throw new Error('id is required');

    switch (action) {
        case 'user': {
            if (!rbac.can(user, 'user:manage')) throw new UnauthorizedError();
            await authService.deleteUser(user, id);
            return { success: true };
        }
        case 'live-class': {
            if (!rbac.can(user, 'lesson:manage')) throw new UnauthorizedError();
            await systemService.deleteLiveClass(id, user.sessionId!, user);
            return { success: true };
        }
        case 'planner': {
            const userId = searchParams.get('userId') || user.id;
            await systemService.deletePlannerItem(userId, id, user.sessionId!, user);
            return { success: true };
        }
        case 'discussion': {
            await systemService.deleteDiscussionPost(user, id, user.sessionId!);
            return { success: true };
        }
        case 'enrollment': {
            const studentId = searchParams.get('studentId');
            if (!studentId) throw new Error('studentId required');
            await systemService.removeEnrollment(user, id, studentId, user.sessionId!);
            return { success: true };
        }
        case 'logs': {
            if (!rbac.can(user, 'system:manage')) throw new UnauthorizedError();
            const filters = {
                course_id: searchParams.get('courseId') || undefined,
                resource_id: searchParams.get('resourceId') || undefined,
                category: searchParams.get('category') || undefined,
                before: searchParams.get('before') || undefined,
            };
            await systemService.clearLogs(user, user.sessionId!, filters);
            return { success: true };
        }
        case 'ticket': {
            await systemService.deleteSupportTicket(user, id, user.sessionId!);
            return { success: true };
        }
        default:
            throw new Error('Invalid DELETE action');
    }
});

export const PATCH = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const subAction = searchParams.get('subAction');
    const id = searchParams.get('id');
    const body = await request.json();

    switch (action) {
        case 'notification': {
            if (body.markAll) {
                const userId = searchParams.get('userId');
                if (!userId) throw new Error('userId required');
                await systemService.markAllNotificationsAsRead(userId, user.sessionId!, user);
            } else if (subAction === 'view' && body.ids && Array.isArray(body.ids)) {
                await systemService.markNotificationsAsViewed(body.ids, user.sessionId!);
            } else {
                if (!id) throw new Error('id required');
                if (subAction === 'dismiss') {
                    await systemService.dismissNotification(id, user.sessionId!);
                } else if (subAction === 'acknowledge') {
                    await systemService.acknowledgeNotification(id, user.sessionId!);
                } else if (subAction === 'view') {
                    await systemService.markNotificationAsViewed(id, user.sessionId!);
                } else {
                    await systemService.markNotificationAsRead(id, user.sessionId!);
                }
            }
            return { success: true };
        }
        case 'log': {
            if (!rbac.can(user, 'system:manage')) throw new UnauthorizedError();
            if (!id) throw new Error('id required');
            await systemService.updateLog(user, id, body, user.sessionId!);
            return { success: true };
        }
        case 'ticket': {
            if (!id) throw new Error('id required');
            if (body.status || body.assigned_to) {
                if (!rbac.can(user, 'ticket:manage')) throw new UnauthorizedError();
            }
            await systemService.saveSupportTicket(user, { ...body, id }, user.sessionId!);
            return { success: true };
        }
        default:
            throw new Error('Invalid PATCH action');
    }
});
