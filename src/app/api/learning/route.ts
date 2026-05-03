import { withHandler } from '@/app/api/api-utils';
import { learningService } from '@/lib/services/learning.service';
import { CourseMapper, LearningMapper } from '@/lib/mappers';
import { rbac } from '@/lib/auth/rbac';
import { CourseDomain } from '@/lib/domain/course.domain';
import { LearningDomain } from '@/lib/domain/learning.domain';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'courses': {
      const teacherId = searchParams.get('teacherId') || undefined;
      const courses = await learningService.getCourses(teacherId, user.sessionId);
      return courses.map(CourseMapper.toDTO);
    }
    case 'lessons': {
      const courseId = searchParams.get('courseId');
      if (!courseId) throw new Error('courseId is required');
      const lessons = await learningService.getLessons(courseId, user.sessionId!);
      return lessons.map(LearningMapper.toLessonDTO);
    }
    case 'materials': {
      const courseId = searchParams.get('courseId') || undefined;
      const materials = await learningService.getMaterials(courseId, user.sessionId!);
      return materials.map(LearningMapper.toMaterialDTO);
    }
    default:
      throw new Error('Invalid GET action');
  }
});

export const POST = withHandler(async (user, request) => {
  const body = await request.json();
  const { action, ...data } = body;

  switch (action) {
    case 'save-course': {
      if (!rbac.can(user, 'course:create') && !rbac.can(user, 'course:update')) {
        throw new Error('Unauthorized');
      }
      CourseDomain.validate(data);
      const course = await learningService.saveCourse(user, data, user.sessionId!);
      return CourseMapper.toDTO(course);
    }
    case 'save-lesson': {
      if (!rbac.can(user, 'lesson:manage')) throw new Error('Unauthorized');
      LearningDomain.validateLesson(data);
      const lesson = await learningService.saveLesson(data, user.sessionId!);
      return LearningMapper.toLessonDTO(lesson);
    }
    case 'save-material': {
      if (!rbac.can(user, 'course:update')) throw new Error('Unauthorized');
      LearningDomain.validateMaterial(data);
      const material = await learningService.saveMaterial(user, data, user.sessionId!);
      return LearningMapper.toMaterialDTO(material);
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
    case 'course': {
      if (!rbac.can(user, 'course:delete')) throw new Error('Unauthorized');
      await learningService.deleteCourse(id, user.sessionId!);
      return { success: true };
    }
    case 'lesson': {
      if (!rbac.can(user, 'lesson:manage')) throw new Error('Unauthorized');
      await learningService.deleteLesson(id, user.sessionId!);
      return { success: true };
    }
    case 'material': {
      if (!rbac.can(user, 'course:update')) throw new Error('Unauthorized');
      await learningService.deleteMaterial(id, user.sessionId!);
      return { success: true };
    }
    default:
      throw new Error('Invalid DELETE action');
  }
});
