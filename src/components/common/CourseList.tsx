"use client";

import React from 'react';
import { CourseDTO } from '@/lib/dto/learning.dto';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BookOpen, User, Calendar, Trash2, Edit } from 'lucide-react';

interface CourseListProps {
  courses: CourseDTO[];
  onAction: (course: CourseDTO) => void;
  actionLabel: string;
  onEdit?: (course: CourseDTO) => void;
  onDelete?: (id: string) => void;
  showStatus?: boolean;
}

export function CourseList({
  courses,
  onAction,
  actionLabel,
  onEdit,
  onDelete,
  showStatus = false
}: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by browsing or creating a course.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <div className="h-40 bg-gray-100 relative">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-50">
                <BookOpen className="h-12 w-12 text-indigo-200" />
              </div>
            )}
            {showStatus && (
              <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${
                course.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {course.status.toUpperCase()}
              </div>
            )}
          </div>

          <CardHeader>
            <CardTitle className="line-clamp-1">{course.title}</CardTitle>
            <CardDescription className="line-clamp-2 h-10">
              {course.description}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Updated {new Date(course.updated_at || course.created_at || '').toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-2 border-t pt-4">
            <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onAction(course)}
            >
              {actionLabel}
            </Button>

            {(onEdit || onDelete) && (
              <div className="flex gap-2">
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(course)}>
                    <Edit className="h-4 w-4 text-gray-600" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(course.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
