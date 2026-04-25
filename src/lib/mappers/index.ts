import { User, Course, Lesson, Material } from '../types';
import { UserDTO } from './auth.dto';
import { CourseDTO, LessonDTO, MaterialDTO } from './learning.dto';

export class UserMapper {
  static toDTO(user: User): UserDTO {
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      xp: user.xp,
      level: user.level,
      phone: user.phone,
      created_at: user.created_at,
      active: user.active,
      metadata: user.metadata
    };
  }
}

export class CourseMapper {
  static toDTO(course: Course): CourseDTO {
    return {
      id: course.id,
      title: course.title,
      description: course.description,
      status: course.status,
      teacher_id: course.teacher_id,
      thumbnail_url: course.thumbnail_url,
      created_at: course.created_at,
      updated_at: course.updated_at,
      version: course.version
    };
  }
}

export class LearningMapper {
  static toLessonDTO(lesson: Lesson): LessonDTO {
    return {
      id: lesson.id,
      course_id: lesson.course_id,
      title: lesson.title,
      content: lesson.content,
      video_url: lesson.video_url,
      order_index: lesson.order_index,
      created_at: lesson.created_at
    };
  }

  static toMaterialDTO(material: Material): MaterialDTO {
    return {
      id: material.id,
      course_id: material.course_id,
      teacher_id: material.teacher_id,
      title: material.title,
      description: material.description,
      file_url: material.file_url,
      file_type: material.file_type,
      created_at: material.created_at
    };
  }
}
