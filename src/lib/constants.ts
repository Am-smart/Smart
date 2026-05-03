/**
 * Shared system constants
 */

export const USER_ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    ADMIN: 'admin'
} as const;

export const ASSESSMENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    ARCHIVED: 'archived'
} as const;

export const SUBMISSION_STATUS = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    GRADED: 'graded',
    RETURNED: 'returned',
    IN_PROGRESS: 'in progress'
} as const;

export const QUESTION_TYPES = {
    MCQ: 'mcq',
    TF: 'tf',
    SHORT: 'short',
    ESSAY: 'essay',
    FILE: 'file',
    LINK: 'link'
} as const;

export const PLANNER_PRIORITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
} as const;
