import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserRole } from "./types";
import { USER_ROLES, ASSESSMENT_STATUS } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses deep links in various formats (path-based, type:id, or keywords)
 * and returns a standard path for navigation.
 */
export const parseDeepLink = (link?: string, role: string = 'student'): string | null => {
  if (!link) return null;

  try {
    // Handle URL-style links
    if (link.startsWith('/')) {
      return link;
    }

    const base = role === 'teacher' ? 'teacher' : role === 'admin' ? 'admin' : 'student';

    // Handle structured links: type:id format
    if (link.includes(':')) {
      const [type, ...idParts] = link.split(':');
      const id = idParts.join(':');

      const routes: Record<string, string> = {
        course: `/${base}/courses?id=${id}`,
        assignment: `/${base}/assignments?id=${id}`,
        quiz: `/${base}/quizzes?id=${id}`,
        discussion: `/${base}/discussions?id=${id}`,
        material: `/${base}/materials?id=${id}`,
        live: `/${base}/live?id=${id}`,
        grading: `/teacher/grading?id=${id}`,
        students: `/teacher/students?id=${id}`,
        submission: `/teacher/grading?id=${id}`, // Direct link for teachers
        lesson: `/${base}/courses?id=${id.split(':')[0]}&lessonId=${id.split(':')[1]}`,
      };

      if (routes[type]) {
          return routes[type];
      }
    }

    // Fallback for simple names
    if (['dashboard', 'courses', 'assignments', 'quizzes', 'live', 'calendar', 'settings'].includes(link)) {
        return `/${base}/${link}`;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
};

/**
 * Type guard for UserRole
 */
export function isUserRole(role: unknown): role is UserRole {
    return (Object.values(USER_ROLES) as unknown[]).includes(role);
}

/**
 * Type guard for AssessmentStatus
 */
export function isAssessmentStatus(status: unknown): status is typeof ASSESSMENT_STATUS[keyof typeof ASSESSMENT_STATUS] {
    return (Object.values(ASSESSMENT_STATUS) as unknown[]).includes(status);
}
