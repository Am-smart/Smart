import { withHandler } from '@/app/api/api-utils';
import { systemService } from '@/lib/services/system.service';
import { authService } from '@/lib/services/auth.service';
import { assessmentService } from '@/lib/services/assessment.service';
import { rbac } from '@/lib/auth/rbac';
import { SystemMapper, CommunicationMapper, AssessmentMapper } from '@/lib/mappers';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'logs': {
      const limit = parseInt(searchParams.get('limit') || '100');
      if (!rbac.can(user, 'system:manage')) throw new Error('Unauthorized');
      const logs = await systemService.getLogs(user, limit, user.sessionId!);
      return logs.map(SystemMapper.toSystemLogDTO);
    }
    case 'maintenance': {
      return systemService.getMaintenance(user?.sessionId);
    }
    case 'sessions': {
        const { authDb } = await import('@/lib/database/auth.db');
        return authDb.findAllSessions(user.sessionId!);
    }
    case 'settings': {
      if (!rbac.can(user, 'system:manage')) throw new Error('Unauthorized');
      return systemService.getSettings(user, user.sessionId!);
    }
    case 'users': {
      if (!rbac.can(user, 'user:manage')) throw new Error('Unauthorized');
      const users = await authService.getAllUsers(user, user.sessionId!);
      const { UserMapper } = await import('@/lib/mappers');
      return users.map(UserMapper.toDTO);
    }
    case 'planner': {
      const userId = searchParams.get('userId') || user.id;
      const items = await systemService.getPlannerItems(userId, user.sessionId!);
      return items.map(SystemMapper.toPlannerItemDTO);
    }
    case 'notifications': {
      const userId = searchParams.get('userId') || user.id;
      const notifications = await systemService.getNotifications(userId, user.sessionId!);
      return notifications.map(CommunicationMapper.toNotificationDTO);
    }
    case 'live-classes': {
      const courseId = searchParams.get('courseId') || undefined;
      const teacherId = searchParams.get('teacherId') || undefined;
      const classes = await systemService.getLiveClasses(courseId, teacherId, user.sessionId!);
      return classes.map(CommunicationMapper.toLiveClassDTO);
    }
    case 'discussions': {
      const courseId = searchParams.get('courseId');
      if (!courseId) throw new Error('courseId is required');
      const discussions = await systemService.getDiscussions(courseId, user.sessionId!);
      return discussions.map(CommunicationMapper.toDiscussionDTO);
    }
    case 'enrollments': {
      const studentId = searchParams.get('studentId');
      const courseIds = searchParams.get('courseIds')?.split(',');
      if (studentId) {
        const enrollments = await systemService.getStudentEnrollments(studentId, user.sessionId!);
        return enrollments.map(SystemMapper.toEnrollmentDTO);
      } else if (courseIds) {
        const enrollments = await systemService.getCourseEnrollments(user, courseIds, user.sessionId!);
        return enrollments.map(SystemMapper.toEnrollmentDTO);
      }
      throw new Error('studentId or courseIds required');
    }
    case 'quiz-submissions': {
        const quizId = searchParams.get('quizId') || undefined;
        const studentId = searchParams.get('studentId') || undefined;
        const submissions = await assessmentService.getQuizSubmissions(quizId, studentId, user.sessionId!);
        return submissions.map(AssessmentMapper.toQuizSubmissionDTO);
    }
    case 'lesson-completions': {
        const userId = searchParams.get('userId') || user.id;
        return systemService.getLessonCompletions(userId, user.sessionId!);
    }
    default:
      throw new Error('Invalid GET action');
  }
}, { requireAuth: false }); // Maintenance can be public

export const POST = withHandler(async (user, request) => {
  const body = await request.json();
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
        const updated = await authService.updateUserProfile(user, data.id, data, user.sessionId!);
        const { UserMapper } = await import('@/lib/mappers');
        return UserMapper.toDTO(updated);
    }
    case 'save-planner': {
        const saved = await systemService.savePlannerItem(user.id, data, user.sessionId!);
        return SystemMapper.toPlannerItemDTO(saved);
    }
    case 'save-live-class': {
        if (!rbac.can(user, 'lesson:manage')) throw new Error('Unauthorized');
        const saved = await systemService.saveLiveClass(user, data, user.sessionId!);
        return CommunicationMapper.toLiveClassDTO(saved);
    }
    case 'save-discussion': {
        const saved = await systemService.saveDiscussionPost(user, data, user.sessionId!);
        return CommunicationMapper.toDiscussionDTO(saved);
    }
    case 'enroll': {
        await systemService.enrollInCourse(user.id, data.courseId, user.sessionId!);
        return { success: true };
    }
    case 'attendance': {
        await systemService.recordAttendance(user.id, data.liveClassId, user.sessionId!);
        return { success: true };
    }
    case 'broadcast': {
        if (!rbac.can(user, 'system:manage')) throw new Error('Unauthorized');
        await systemService.createBroadcast(data, user.sessionId!);
        return { success: true };
    }
    case 'lesson-completion': {
        await systemService.markLessonComplete(user.id, data.lessonId, data.courseId, user.sessionId!);
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
            if (!rbac.can(user, 'user:manage')) throw new Error('Unauthorized');
            await authService.deleteUser(user, id, user.sessionId!);
            return { success: true };
        }
        case 'live-class': {
            if (!rbac.can(user, 'lesson:manage')) throw new Error('Unauthorized');
            await systemService.deleteLiveClass(id, user.sessionId!);
            return { success: true };
        }
        case 'planner': {
            await systemService.deletePlannerItem(user.id, id, user.sessionId!);
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
                await systemService.markAllNotificationsAsRead(userId, user.sessionId!);
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
