import React, { useState, useMemo } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { CourseDTO } from '@/lib/dto/learning.dto';

interface CourseCatalogProps {
  courses: CourseDTO[];
  enrolledCourseIds: string[];
  onEnroll: (courseId: string) => Promise<void>;
  onViewDetails: (courseId: string) => void;
}

export const CourseCatalog: React.FC<CourseCatalogProps> = ({ courses, enrolledCourseIds, onEnroll, onViewDetails }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCourses = useMemo(() => {
    return courses.filter(course => 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [courses, searchQuery]);

  const handleEnrollClick = (course: CourseDTO) => {
    // Assuming CourseDTO doesn't have course_id in the strict DTO,
    // if it's needed it should be added to CourseDTO.
    // For now, simple enroll.
    onEnroll(course.id);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Course Catalog</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search courses by title or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map(course => {
          const isEnrolled = enrolledCourseIds.includes(course.id);
          return (
            <div key={course.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
              <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen size={64} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">{course.title}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">BY Instructor</p>
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
      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 text-lg">No courses found matching your search.</p>
        </div>
      )}
    </div>
  );
};
