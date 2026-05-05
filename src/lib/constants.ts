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

export const ANTI_CHEAT = {
    MAX_VIOLATIONS: 5,
    VIOLATION_INTERVAL: 2000,
    TAB_SWITCH_THRESHOLD: 3000,
    RESIZE_THRESHOLD: 160,
    PING_INTERVAL: 5000,
    RESIZE_CHECK_INTERVAL: 2000,
} as const;

export const SESSION = {
    EXPIRY_DAYS: 7,
    CACHE_EXPIRY_MS: 5 * 60 * 1000,
} as const;

export const ASSESSMENT = {
    DEFAULT_PASSING_SCORE: 60,
} as const;
