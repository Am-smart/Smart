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
export const parseDeepLink = (link?: string): string | null => {
  if (!link) return null;

  try {
    // Handle URL-style links: /student/assignments/abc123
    if (link.startsWith('/')) {
      return link;
    }

    // Handle structured links: type:id format
    // e.g., "course:abc123", "assignment:xyz789", "quiz:def456"
    if (link.includes(':')) {
      const [type, ...idParts] = link.split(':');
      const id = idParts.join(':'); // Handle IDs that might contain colons
      const routes: Record<string, string> = {
        course: `/student/courses?id=${id}`,
        assignment: `/student/assignments?id=${id}`,
        quiz: `/student/quizzes?id=${id}`,
        discussion: `/student/discussions?id=${id}`,
        material: `/student/materials?id=${id}`,
        live: `/student/live?id=${id}`,
        grading: `/teacher/grading?id=${id}`,
        students: `/teacher/students?id=${id}`,
      };

      if (routes[type]) {
          return routes[type];
      }
    }

    // Fallback for simple names
    if (['dashboard', 'courses', 'assignments', 'quizzes', 'live', 'calendar', 'settings'].includes(link)) {
        return `/student/${link}`;
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
