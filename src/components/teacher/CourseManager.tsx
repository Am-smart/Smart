import React from 'react';
import { Course } from '@/lib/types';

interface CourseManagerProps {
  courses: Course[];
  onCreate: () => void;
  onEdit: (course: Course) => void;
  onDelete: (id: string) => void;
}

export const CourseManager: React.FC<CourseManagerProps> = ({ courses, onCreate, onEdit, onDelete }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Course Management</h2>
        <button onClick={onCreate} className="btn-primary">Create New Course</button>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
              <th className="px-6 py-4">Course Title</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Students</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {courses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">No courses created yet.</td>
              </tr>
            ) : (
              courses.map(course => (
                <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{course.title}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${course.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">0</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onEdit(course)} className="text-blue-600 font-bold text-xs uppercase mr-4">Edit</button>
                    <button onClick={() => onDelete(course.id)} className="text-red-600 font-bold text-xs uppercase">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
