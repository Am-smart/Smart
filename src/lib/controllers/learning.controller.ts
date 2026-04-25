import { courseService } from '../services/course.service';
import { learningService } from '../services/learning.service';
import { CourseMapper, LearningMapper } from '../mappers';
import { rbac } from '../auth/rbac';
import { User, Course, Lesson, Material } from '../types';
import { CourseDTO, LessonDTO, MaterialDTO } from '../dto/learning.dto';

export class LearningController {
  async getCourses(user: User, teacherId?: string): Promise<CourseDTO[]> {
    const courses = await courseService.getCourses(teacherId, user.sessionId);
    return courses.map(CourseMapper.toDTO);
  }

  async saveCourse(user: User, courseData: Partial<Course>): Promise<CourseDTO> {
    if (!rbac.can(user, 'course:create') && !rbac.can(user, 'course:update')) {
      throw new Error('Unauthorized');
    }
    const course = await courseService.saveCourse(user, courseData, user.sessionId);
    return CourseMapper.toDTO(course);
  }

  async deleteCourse(user: User, courseId: string): Promise<void> {
    if (!rbac.can(user, 'course:delete')) throw new Error('Unauthorized');
    await courseService.deleteCourse(courseId, user.sessionId);
  }

  async getLessons(user: User, courseId: string): Promise<LessonDTO[]> {
    const lessons = await learningService.getLessons(courseId, user.sessionId);
    return lessons.map(LearningMapper.toLessonDTO);
  }

  async saveLesson(user: User, lessonData: Partial<Lesson>): Promise<LessonDTO> {
    if (!rbac.can(user, 'lesson:manage')) throw new Error('Unauthorized');
    const lesson = await learningService.saveLesson(lessonData, user.sessionId);
    return LearningMapper.toLessonDTO(lesson);
  }

  async getMaterials(user: User, courseId?: string): Promise<MaterialDTO[]> {
    const materials = await learningService.getMaterials(courseId, user.sessionId);
    return materials.map(LearningMapper.toMaterialDTO);
  }

  async saveMaterial(user: User, materialData: Partial<Material>): Promise<MaterialDTO> {
    if (!rbac.can(user, 'course:update')) throw new Error('Unauthorized');
    const material = await learningService.saveMaterial(user, materialData, user.sessionId);
    return LearningMapper.toMaterialDTO(material);
  }

  async deleteMaterial(user: User, materialId: string): Promise<void> {
    if (!rbac.can(user, 'course:update')) throw new Error('Unauthorized');
    await learningService.deleteMaterial(materialId, user.sessionId);
  }
}

export const learningController = new LearningController();
