import { withHandler } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';
import { learningService } from '@/lib/services/learning.service';
import { authService } from '@/lib/services/auth.service';
import { assessmentService } from '@/lib/services/assessment.service';
import { rbac } from '@/lib/auth/rbac';
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
      const limit = parseInt(searchParams.get('limit') || '100');
      if (!rbac.can(user, 'system:logs:view')) throw new UnauthorizedError();

      const filters = {
        user_id: searchParams.get('userId') || undefined,
        course_id: searchParams.get('courseId') || undefined,
        resource_id: searchParams.get('resourceId') || undefined,
        category: searchParams.get('category') || undefined,
      };

      const logs = await systemService.getLogs(user, limit, user.sessionId!, filters);
      return logs.map(SystemMapper.toSystemLogDTO);
    }
    case 'sessions': {
        if (!user) throw new UnauthorizedError();
        return authService.getSessions(user.sessionId!);
    }
    case 'settings': {
      if (!rbac.can(user, 'system:manage')) throw new UnauthorizedError();
      return systemService.getSettings(user, user.sessionId!);
    }
    case 'users': {
      if (!rbac.can(user, 'user:manage')) throw new UnauthorizedError();
      const users = await authService.getAllUsers(user, user.sessionId!);
      const { UserMapper } = await import('@/lib/mappers');
      return users.map(UserMapper.toDTO);
    }
    case 'planner': {
      const userId = searchParams.get('userId') || user.id;
      const items = await systemService.getPlannerItems(userId, user.sessionId!, user);
      return items.map(SystemMapper.toPlannerItemDTO);
    }
    case 'notifications': {
      const userId = searchParams.get('userId') || user.id;
      const merged = await systemService.getMergedNotifications(user, userId, user.sessionId!);
      return merged.map(CommunicationMapper.toNotificationDTO);
    }
    case 'live-classes': {
      const courseId = searchParams.get('courseId') || undefined;
      const teacherId = searchParams.get('teacherId') || undefined;
      const classes = await systemService.getLiveClasses(courseId, teacherId, user.sessionId!, user.id, user.role);
      return classes.map(CommunicationMapper.toLiveClassDTO);
    }
    case 'discussions': {
      const courseId = searchParams.get('courseId');
      if (!courseId) throw new Error('courseId is required');
      if (courseId === 'global') return [];
      const discussions = await systemService.getDiscussions(courseId, user.sessionId!, user.id, user.role);
      return discussions.map(CommunicationMapper.toDiscussionDTO);
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
        const submissions = await assessmentService.getQuizSubmissions(quizId, studentId, user.sessionId!, user.id, user.role);
        return submissions.map(AssessmentMapper.toQuizSubmissionDTO);
    }
    case 'lesson-completions': {
        const userId = searchParams.get('userId') || user.id;
        return learningService.getLessonCompletions(userId, user.sessionId!);
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
            const updated = await authService.updateUserProfile(user, data.id, data, user.sessionId!);
            return UserMapper.toDTO(updated);
        } else {
            // New User Creation by Admin
            const { data: rawData, error: rpcError } = await authService.createUser(user, {
                full_name: data.full_name,
                email: data.email,
                password: data.password,
                phone: data.phone,
                role: data.role
            }, user.sessionId!);

            if (rpcError) throw new Error('Failed to create user via service');
            const result = rawData as { success: boolean, user: User, error?: string };
            if (!result.success) throw new Error(result.error || 'User creation failed');

            return UserMapper.toDTO(result.user);
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
    case 'upload': {
        // This usually requires multipart/form-data, keep separate route for physical uploads
        throw new Error('Physical uploads must use /api/system/upload');
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
            await authService.deleteUser(user, id, user.sessionId!);
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
        default:
            throw new Error('Invalid DELETE action');
    }
});

export const PATCH = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const body = await request.json();

    switch (action) {
        case 'notification': {
            if (body.markAll) {
                const userId = searchParams.get('userId');
                if (!userId) throw new Error('userId required');
                await systemService.markAllNotificationsAsRead(userId, user.sessionId!, user);
            } else {
                if (!id) throw new Error('id required');
                await systemService.markNotificationAsRead(id, user.sessionId!);
            }
            return { success: true };
        }
        default:
            throw new Error('Invalid PATCH action');
    }
});
