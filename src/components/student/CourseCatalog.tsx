import React from 'react';
import { Course } from '@/lib/types';

interface CourseCatalogProps {
  courses: Course[];
  enrolledCourseIds: string[];
  onEnroll: (courseId: string) => Promise<void>;
  onViewDetails: (courseId: string) => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ courses, enrolledCourseIds, onEnroll, onViewDetails }) => {
  const handleEnrollClick = (course: Course) => {
    if (course.course_id) {
        const inputId = prompt(`This course requires a Course ID to enroll. Please enter it:`);
        if (inputId !== course.course_id) {
            alert('Invalid Course ID. Enrollment failed.');
            return;
        }
    }
    onEnroll(course.id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Course Catalog</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map(course => {
          const isEnrolled = enrolledCourseIds.includes(course.id);
          return (
            <div key={course.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-4xl text-white">📚</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">{course.title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">BY {course.created_by || 'Unknown Instructor'}</p>
                <p className="text-slate-500 text-sm line-clamp-2">{course.description}</p>
              </div>
              <div className="flex justify-between items-center mt-4">
                {isEnrolled ? (
                  <button onClick={() => onViewDetails(course.id)} className="btn-secondary text-sm">View Details</button>
                ) : (
                  <button onClick={() => handleEnrollClick(course)} className="btn-primary text-sm px-6">Enroll Now</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
