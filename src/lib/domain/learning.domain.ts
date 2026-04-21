import { Lesson, Material } from '../types';

export class LearningDomain {
  static prepareLesson(lesson: Partial<Lesson>): Partial<Lesson> {
    return {
      ...lesson,
      order_index: lesson.order_index || 0
    };
  }

  static prepareMaterial(material: Partial<Material>, teacherId: string): Partial<Material> {
    return {
      ...material,
      teacher_id: material.teacher_id || teacherId
    };
  }

  static calculateProgress(completedCount: number, totalCount: number): number {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }
}
