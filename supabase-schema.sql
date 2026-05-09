-- SmartLMS Supabase Schema (Comprehensive Consolidated Script)
-- This script safely updates the database without losing data and aligns with backend actions.

-- ==========================================
-- 1. Extensions
-- ==========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 2. Utility Functions
-- ==========================================
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ==========================================
-- 3. Core Tables (Idempotent Creation)
-- ==========================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  lockouts INTEGER DEFAULT 0,
  flagged BOOLEAN DEFAULT FALSE,
  reset_request JSONB,
  active BOOLEAN DEFAULT TRUE,
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "inApp": true}'::jsonb,
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enrollment_id VARCHAR(100), -- Acts as Enrollment Code
  created_by VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  teacher_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS enrollments (
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (course_id, student_id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  start_at TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  points_possible INTEGER DEFAULT 100,
  allow_late_submissions BOOLEAN DEFAULT TRUE,
  late_penalty_per_day INTEGER DEFAULT 0,
  allowed_extensions TEXT[] DEFAULT '{pdf, doc, docx, zip, jpg, png}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  questions JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  anti_cheat_enabled BOOLEAN DEFAULT FALSE,
  hard_enforcement BOOLEAN DEFAULT FALSE,
  regrade_requests_enabled BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submission_text TEXT,
  file_url TEXT,
  answers JSONB DEFAULT '{}'::jsonb,
  question_scores JSONB DEFAULT '{}'::jsonb,
  response_feedback JSONB DEFAULT '{}'::jsonb,
  late_penalty_applied INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  grade INTEGER,
  final_grade INTEGER,
  feedback TEXT,
  regrade_request TEXT,
  graded_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'graded', 'returned')),
  violation_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE IF NOT EXISTS live_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE NOT NULL,
  room_name VARCHAR(255) NOT NULL,
  meeting_url TEXT,
  recording_url TEXT,
  recurring_config JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'completed', 'cancelled')),
  actual_end_at TIMESTAMP WITH TIME ZONE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  live_class_id UUID REFERENCES live_classes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  join_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  leave_time TIMESTAMP WITH TIME ZONE,
  duration INTEGER DEFAULT 0,
  is_present BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(live_class_id, student_id)
);

CREATE TABLE IF NOT EXISTS quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  time_limit INTEGER DEFAULT 0,
  attempts_allowed INTEGER DEFAULT 1,
  passing_score INTEGER DEFAULT 60,
  questions JSONB DEFAULT '[]'::jsonb,
  shuffle_questions BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  anti_cheat_enabled BOOLEAN DEFAULT FALSE,
  hard_enforcement BOOLEAN DEFAULT FALSE,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  score INTEGER,
  total_points INTEGER,
  answers JSONB DEFAULT '{}'::jsonb,
  analytics JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('in progress', 'submitted')),
  time_spent INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  violation_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  attempt_number INTEGER DEFAULT 1,
  UNIQUE(quiz_id, student_id, attempt_number)
);

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type VARCHAR(50),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS broadcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  target_role VARCHAR(50), -- 'student', 'teacher', or NULL for all
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  type VARCHAR(50) DEFAULT 'system',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  type VARCHAR(50) DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, broadcast_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_agent TEXT,
  ip_address TEXT
);

CREATE TABLE IF NOT EXISTS maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enabled BOOLEAN DEFAULT FALSE,
  manual_until TIMESTAMP WITH TIME ZONE,
  message TEXT DEFAULT 'System is undergoing maintenance.',
  schedules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planner (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lesson_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level VARCHAR(20) DEFAULT 'info',
  category VARCHAR(50),
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  resource_id UUID, -- References Assignment or Quiz ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Centralized Anti-Cheat Logs
CREATE TABLE IF NOT EXISTS anti_cheat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  resource_id UUID, -- References Assignment or Quiz ID
  type VARCHAR(50) NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category VARCHAR(50),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 4. Safe Migrations (Column Additions/Removals)
-- ==========================================
DO $$
BEGIN
    -- Anti-cheat and violation tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'anti_cheat_enabled') THEN
        ALTER TABLE assignments ADD COLUMN anti_cheat_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'auto_submit_enabled') THEN
        ALTER TABLE assignments DROP COLUMN auto_submit_enabled;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'hard_enforcement') THEN
        ALTER TABLE assignments ADD COLUMN hard_enforcement BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'metadata') THEN
        ALTER TABLE assignments ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'anti_cheat_enabled') THEN
        ALTER TABLE quizzes ADD COLUMN anti_cheat_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'auto_submit_enabled') THEN
        ALTER TABLE quizzes DROP COLUMN auto_submit_enabled;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'metadata') THEN
        ALTER TABLE quizzes ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'hard_enforcement') THEN
        ALTER TABLE quizzes ADD COLUMN hard_enforcement BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'violation_count') THEN
        ALTER TABLE submissions ADD COLUMN violation_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_submissions' AND column_name = 'violation_count') THEN
        ALTER TABLE quiz_submissions ADD COLUMN violation_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'response_feedback') THEN
        ALTER TABLE submissions ADD COLUMN response_feedback JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Notifications Extended Tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'dismissed_at') THEN
        ALTER TABLE notifications ADD COLUMN dismissed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'acknowledged_at') THEN
        ALTER TABLE notifications ADD COLUMN acknowledged_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'broadcast_id') THEN
        ALTER TABLE notifications ADD COLUMN broadcast_id UUID REFERENCES broadcasts(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'viewed_at') THEN
        ALTER TABLE notifications ADD COLUMN viewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'expires_at') THEN
        ALTER TABLE notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Notifications duplication prevention
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_broadcast_id_key') THEN
        ALTER TABLE notifications ADD CONSTRAINT notifications_user_id_broadcast_id_key UNIQUE(user_id, broadcast_id);
    END IF;

    -- Scheduling
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'start_at') THEN
        ALTER TABLE assignments ADD COLUMN start_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'start_at') THEN
        ALTER TABLE quizzes ADD COLUMN start_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'end_at') THEN
        ALTER TABLE quizzes ADD COLUMN end_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Course Metadata (Safe Migration)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'category') THEN
        -- Migrate existing category data to metadata JSONB before dropping
        UPDATE courses SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{category}', to_jsonb(category))
        WHERE category IS NOT NULL;

        ALTER TABLE courses DROP COLUMN category;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'enrollment_id') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'course_id') THEN
            ALTER TABLE courses RENAME COLUMN course_id TO enrollment_id;
        ELSE
            ALTER TABLE courses ADD COLUMN enrollment_id VARCHAR(100);
        END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'created_by') THEN
        ALTER TABLE courses ADD COLUMN created_by VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
    END IF;

    -- Submission Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'submission_text') THEN
        ALTER TABLE submissions ADD COLUMN submission_text TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'file_url') THEN
        ALTER TABLE submissions ADD COLUMN file_url TEXT;
    END IF;

    -- Conflict Detection (Versioning)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'version') THEN ALTER TABLE users ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'version') THEN ALTER TABLE courses ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'version') THEN ALTER TABLE assignments ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'version') THEN ALTER TABLE quizzes ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'version') THEN ALTER TABLE submissions ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_submissions' AND column_name = 'version') THEN ALTER TABLE quiz_submissions ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planner' AND column_name = 'version') THEN ALTER TABLE planner ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'version') THEN ALTER TABLE lessons ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_classes' AND column_name = 'version') THEN ALTER TABLE live_classes ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'version') THEN ALTER TABLE materials ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussions' AND column_name = 'version') THEN ALTER TABLE discussions ADD COLUMN version INTEGER DEFAULT 1; END IF;

    -- Timestamp Harmonization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_classes' AND column_name = 'updated_at') THEN ALTER TABLE live_classes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_submissions' AND column_name = 'updated_at') THEN ALTER TABLE quiz_submissions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'updated_at') THEN ALTER TABLE materials ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planner' AND column_name = 'updated_at') THEN ALTER TABLE planner ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;

    -- Quiz Attempts Migration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_submissions' AND column_name = 'attempt_number') THEN
        ALTER TABLE quiz_submissions ADD COLUMN attempt_number INTEGER DEFAULT 1;
        ALTER TABLE quiz_submissions DROP CONSTRAINT IF EXISTS quiz_submissions_quiz_id_student_id_key;
        ALTER TABLE quiz_submissions ADD UNIQUE(quiz_id, student_id, attempt_number);
    END IF;
END $$;

-- ==========================================
-- 5. Indexes (Idempotent)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_system_logs_user ON system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_course ON system_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_resource ON system_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_system_logs_category ON system_logs(category);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_logs_user ON anti_cheat_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_logs_course ON anti_cheat_logs(course_id);
CREATE INDEX IF NOT EXISTS idx_anti_cheat_logs_resource ON anti_cheat_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_enrollment_code ON courses(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON enrollments(student_id, course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(live_class_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent ON discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student ON quiz_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_materials_course ON materials(course_id);
CREATE INDEX IF NOT EXISTS idx_planner_user_date ON planner(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_dismissed ON notifications(user_id, dismissed_at);
CREATE INDEX IF NOT EXISTS idx_notifications_broadcast_id ON notifications(broadcast_id);

-- ==========================================
-- 6. Utility Functions (Backend Identity Resolution)
-- ==========================================

-- Custom App User Resolver (Maintained for RLS)
DROP FUNCTION IF EXISTS current_app_user() CASCADE;
CREATE OR REPLACE FUNCTION current_app_user() RETURNS UUID AS $$
DECLARE
  v_headers JSON;
  v_token_hash TEXT;
  v_user_id UUID;
BEGIN
  BEGIN
    v_headers := current_setting('request.headers', true)::json;
    v_token_hash := v_headers->>'x-session-id';
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  IF v_token_hash IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT s.user_id INTO v_user_id
  FROM sessions s
  WHERE s.token_hash = v_token_hash
  AND s.expires_at > NOW();

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Custom App Role Resolver
DROP FUNCTION IF EXISTS current_app_role() CASCADE;
CREATE OR REPLACE FUNCTION current_app_role() RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = current_app_user();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==========================================
-- 7. Security (RLS Policies)
-- ==========================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE anti_cheat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- SECURITY MODEL: STRICT BACKEND-ONLY ACCESS
-- Data access is restricted and proxied through our secure API/Service layer.
-- Authorization is enforced by the `withSession(x-session-id)` helper
-- which injects session context that our PL/pgSQL functions (like `current_app_user()`)
-- use to evaluate permissions and identity.

-- 1. Users Table
DROP POLICY IF EXISTS "Users Select" ON users;
CREATE POLICY "Users Select" ON users FOR SELECT TO anon
USING (
  id = current_app_user()
  OR current_app_role() = 'admin'
  OR (
    current_app_role() = 'teacher' AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE e.student_id = users.id AND c.teacher_id = current_app_user()
    )
  )
  OR (
    EXISTS (
      SELECT 1 FROM enrollments e1
      JOIN enrollments e2 ON e1.course_id = e2.course_id
      WHERE e1.student_id = current_app_user() AND e2.student_id = users.id
    )
  )
  OR (
    current_app_role() = 'student' AND
    EXISTS (
      SELECT 1 FROM enrollments e
      JOIN courses c ON c.id = e.course_id
      WHERE c.teacher_id = users.id AND e.student_id = current_app_user()
    )
  )
);
DROP POLICY IF EXISTS "Users Update" ON users;
CREATE POLICY "Users Update" ON users FOR UPDATE TO anon
USING (id = current_app_user() OR current_app_role() = 'admin');
DROP POLICY IF EXISTS "Users Delete" ON users;
CREATE POLICY "Users Delete" ON users FOR DELETE TO anon
USING (current_app_role() = 'admin');
DROP POLICY IF EXISTS "Users Insert" ON users;
CREATE POLICY "Users Insert" ON users FOR INSERT TO anon
WITH CHECK (current_app_role() = 'admin' OR current_app_user() IS NULL);

-- 2. Courses Table
DROP POLICY IF EXISTS "Courses Select" ON courses;
CREATE POLICY "Courses Select" ON courses FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR teacher_id = current_app_user()
  OR EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = courses.id AND e.student_id = current_app_user())
  OR status = 'published'
);
DROP POLICY IF EXISTS "Courses Manage" ON courses;
CREATE POLICY "Courses Manage" ON courses FOR ALL TO anon
USING (current_app_role() = 'admin' OR teacher_id = current_app_user());

-- 3. Lessons Table
DROP POLICY IF EXISTS "Lessons Select" ON lessons;
CREATE POLICY "Lessons Select" ON lessons FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR EXISTS (
    SELECT 1 FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    WHERE c.id = lessons.course_id
    AND (c.teacher_id = current_app_user() OR e.student_id = current_app_user())
  )
);
DROP POLICY IF EXISTS "Lessons Manage" ON lessons;
CREATE POLICY "Lessons Manage" ON lessons FOR ALL TO anon
USING (
  current_app_role() = 'admin'
  OR EXISTS (SELECT 1 FROM courses c WHERE c.id = lessons.course_id AND c.teacher_id = current_app_user())
);

-- 4. Enrollments Table
DROP POLICY IF EXISTS "Enrollments Select" ON enrollments;
CREATE POLICY "Enrollments Select" ON enrollments FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR student_id = current_app_user()
  OR EXISTS (SELECT 1 FROM courses c WHERE c.id = enrollments.course_id AND c.teacher_id = current_app_user())
);
DROP POLICY IF EXISTS "Enrollments Manage" ON enrollments;
CREATE POLICY "Enrollments Manage" ON enrollments FOR ALL TO anon
USING (current_app_role() = 'admin' OR student_id = current_app_user());

-- 5. Assignments Table
DROP POLICY IF EXISTS "Assignments Select" ON assignments;
CREATE POLICY "Assignments Select" ON assignments FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR teacher_id = current_app_user()
  OR (
    status = 'published' AND
    EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = assignments.course_id AND e.student_id = current_app_user())
  )
);
DROP POLICY IF EXISTS "Assignments Manage" ON assignments;
CREATE POLICY "Assignments Manage" ON assignments FOR ALL TO anon
USING (current_app_role() = 'admin' OR teacher_id = current_app_user());

-- 6. Submissions Table
DROP POLICY IF EXISTS "Submissions Select" ON submissions;
CREATE POLICY "Submissions Select" ON submissions FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR student_id = current_app_user()
  OR EXISTS (SELECT 1 FROM assignments a WHERE a.id = submissions.assignment_id AND a.teacher_id = current_app_user())
);
DROP POLICY IF EXISTS "Submissions Manage" ON submissions;
CREATE POLICY "Submissions Manage" ON submissions FOR ALL TO anon
USING (
  current_app_role() = 'admin'
  OR student_id = current_app_user()
  OR EXISTS (SELECT 1 FROM assignments a WHERE a.id = submissions.assignment_id AND a.teacher_id = current_app_user())
);

-- 7. Live Classes Table
DROP POLICY IF EXISTS "Live Classes Select" ON live_classes;
CREATE POLICY "Live Classes Select" ON live_classes FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR teacher_id = current_app_user()
  OR EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = live_classes.course_id AND e.student_id = current_app_user())
);
DROP POLICY IF EXISTS "Live Classes Manage" ON live_classes;
CREATE POLICY "Live Classes Manage" ON live_classes FOR ALL TO anon
USING (current_app_role() = 'admin' OR teacher_id = current_app_user());

-- 8. Attendance Table
DROP POLICY IF EXISTS "Attendance Select" ON attendance;
CREATE POLICY "Attendance Select" ON attendance FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR student_id = current_app_user()
  OR EXISTS (SELECT 1 FROM live_classes lc WHERE lc.id = attendance.live_class_id AND lc.teacher_id = current_app_user())
);
DROP POLICY IF EXISTS "Attendance Manage" ON attendance;
CREATE POLICY "Attendance Manage" ON attendance FOR ALL TO anon
USING (
  current_app_role() = 'admin'
  OR student_id = current_app_user()
  OR EXISTS (SELECT 1 FROM live_classes lc WHERE lc.id = attendance.live_class_id AND lc.teacher_id = current_app_user())
);

-- 9. Quizzes Table
DROP POLICY IF EXISTS "Quizzes Select" ON quizzes;
CREATE POLICY "Quizzes Select" ON quizzes FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR teacher_id = current_app_user()
  OR (
    status = 'published' AND
    EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = quizzes.course_id AND e.student_id = current_app_user())
  )
);
DROP POLICY IF EXISTS "Quizzes Manage" ON quizzes;
CREATE POLICY "Quizzes Manage" ON quizzes FOR ALL TO anon
USING (current_app_role() = 'admin' OR teacher_id = current_app_user());

-- 10. Quiz Submissions Table
DROP POLICY IF EXISTS "Quiz Submissions Select" ON quiz_submissions;
CREATE POLICY "Quiz Submissions Select" ON quiz_submissions FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR student_id = current_app_user()
  OR EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_submissions.quiz_id AND q.teacher_id = current_app_user())
);
DROP POLICY IF EXISTS "Quiz Submissions Manage" ON quiz_submissions;
CREATE POLICY "Quiz Submissions Manage" ON quiz_submissions FOR ALL TO anon
USING (
  current_app_role() = 'admin'
  OR student_id = current_app_user()
  OR EXISTS (SELECT 1 FROM quizzes q WHERE q.id = quiz_submissions.quiz_id AND q.teacher_id = current_app_user())
);

-- 11. Anti-Cheat Logs Table
DROP POLICY IF EXISTS "anti_cheat_logs_admin_policy" ON anti_cheat_logs;
CREATE POLICY "anti_cheat_logs_admin_policy" ON anti_cheat_logs FOR ALL TO anon
USING (current_app_role() = 'admin');
DROP POLICY IF EXISTS "anti_cheat_logs_teacher_policy" ON anti_cheat_logs;
CREATE POLICY "anti_cheat_logs_teacher_policy" ON anti_cheat_logs FOR SELECT TO anon
USING (
  current_app_role() = 'teacher' AND
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = anti_cheat_logs.course_id AND c.teacher_id = current_app_user()
  )
);
DROP POLICY IF EXISTS "anti_cheat_logs_student_select_policy" ON anti_cheat_logs;
CREATE POLICY "anti_cheat_logs_student_select_policy" ON anti_cheat_logs FOR SELECT TO anon
USING (user_id = current_app_user());
DROP POLICY IF EXISTS "anti_cheat_logs_student_insert_policy" ON anti_cheat_logs;
CREATE POLICY "anti_cheat_logs_student_insert_policy" ON anti_cheat_logs FOR INSERT TO anon
WITH CHECK (user_id = current_app_user());

-- 12. Materials Table
DROP POLICY IF EXISTS "Materials Select" ON materials;
CREATE POLICY "Materials Select" ON materials FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR teacher_id = current_app_user()
  OR EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = materials.course_id AND e.student_id = current_app_user())
);
DROP POLICY IF EXISTS "Materials Manage" ON materials;
CREATE POLICY "Materials Manage" ON materials FOR ALL TO anon
USING (current_app_role() = 'admin' OR teacher_id = current_app_user());

-- 13. Discussions Table
DROP POLICY IF EXISTS "Discussions Select" ON discussions;
CREATE POLICY "Discussions Select" ON discussions FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR user_id = current_app_user()
  OR EXISTS (
    SELECT 1 FROM courses c
    LEFT JOIN enrollments e ON e.course_id = c.id
    WHERE c.id = discussions.course_id
    AND (c.teacher_id = current_app_user() OR e.student_id = current_app_user())
  )
);
DROP POLICY IF EXISTS "Discussions Manage" ON discussions;
CREATE POLICY "Discussions Manage" ON discussions FOR ALL TO anon
USING (current_app_role() = 'admin' OR user_id = current_app_user());

-- 14. Notifications Table
DROP POLICY IF EXISTS "Notifications SELECT" ON notifications;
CREATE POLICY "Notifications SELECT" ON notifications FOR SELECT TO anon
USING (
    user_id = current_app_user()
    OR (current_app_role() = 'admin')
    OR (
        current_app_role() = 'teacher' AND
        EXISTS (
            SELECT 1 FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.student_id = notifications.user_id
            AND c.teacher_id = current_app_user()
        )
    )
);
DROP POLICY IF EXISTS "Notifications UPDATE" ON notifications;
CREATE POLICY "Notifications UPDATE" ON notifications FOR UPDATE TO anon
USING (user_id = current_app_user() OR current_app_role() = 'admin')
WITH CHECK (user_id = current_app_user() OR current_app_role() = 'admin');
DROP POLICY IF EXISTS "Notifications DELETE" ON notifications;
CREATE POLICY "Notifications DELETE" ON notifications FOR DELETE TO anon
USING (user_id = current_app_user() OR current_app_role() = 'admin');
DROP POLICY IF EXISTS "Notifications INSERT" ON notifications;
CREATE POLICY "Notifications INSERT" ON notifications FOR INSERT TO anon
WITH CHECK (current_app_user() IS NOT NULL);

-- 15. Sessions Table
DROP POLICY IF EXISTS "Strict Backend Access" ON sessions;
CREATE POLICY "Strict Backend Access" ON sessions FOR ALL TO anon
USING (user_id = current_app_user() OR current_app_role() = 'admin');

-- 16. Broadcasts Table
DROP POLICY IF EXISTS "Broadcasts Select" ON broadcasts;
CREATE POLICY "Broadcasts Select" ON broadcasts FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR (
    (target_role IS NULL OR target_role = current_app_role())
    AND (
      course_id IS NULL
      OR EXISTS (SELECT 1 FROM enrollments e WHERE e.course_id = broadcasts.course_id AND e.student_id = current_app_user())
      OR EXISTS (SELECT 1 FROM courses c WHERE c.id = broadcasts.course_id AND c.teacher_id = current_app_user())
    )
  )
);
DROP POLICY IF EXISTS "Broadcasts Manage" ON broadcasts;
CREATE POLICY "Broadcasts Manage" ON broadcasts FOR ALL TO anon
USING (current_app_role() = 'admin');

-- 17. Maintenance Table
DROP POLICY IF EXISTS "Maintenance Select" ON maintenance;
CREATE POLICY "Maintenance Select" ON maintenance FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Maintenance Manage" ON maintenance;
CREATE POLICY "Maintenance Manage" ON maintenance FOR ALL TO anon USING (current_app_role() = 'admin');

-- 18. Planner Table
DROP POLICY IF EXISTS "Planner Access" ON planner;
CREATE POLICY "Planner Access" ON planner FOR ALL TO anon
USING (user_id = current_app_user() OR current_app_role() = 'admin');

-- 19. Lesson Completions Table
DROP POLICY IF EXISTS "Lesson Completions Select" ON lesson_completions;
CREATE POLICY "Lesson Completions Select" ON lesson_completions FOR SELECT TO anon
USING (
  current_app_role() = 'admin'
  OR student_id = current_app_user()
  OR EXISTS (
    SELECT 1 FROM lessons l
    JOIN courses c ON c.id = l.course_id
    WHERE l.id = lesson_completions.lesson_id AND c.teacher_id = current_app_user()
  )
);
DROP POLICY IF EXISTS "Lesson Completions Manage" ON lesson_completions;
CREATE POLICY "Lesson Completions Manage" ON lesson_completions FOR ALL TO anon
USING (current_app_role() = 'admin' OR student_id = current_app_user());

-- 20. System Logs Table
DROP POLICY IF EXISTS "System Logs Select" ON system_logs;
CREATE POLICY "System Logs Select" ON system_logs FOR SELECT TO anon
USING (current_app_role() = 'admin');
DROP POLICY IF EXISTS "System Logs Insert" ON system_logs;
CREATE POLICY "System Logs Insert" ON system_logs FOR INSERT TO anon
WITH CHECK (current_app_user() IS NOT NULL);
DROP POLICY IF EXISTS "System Logs Manage" ON system_logs;
CREATE POLICY "System Logs Manage" ON system_logs FOR ALL TO anon
USING (current_app_role() = 'admin');

-- 21. Support Tickets Table
DROP POLICY IF EXISTS "Support Tickets Access" ON support_tickets;
CREATE POLICY "Support Tickets Access" ON support_tickets FOR ALL TO anon
USING (
    user_id = current_app_user()
    OR assigned_to = current_app_user()
    OR current_app_role() = 'admin'
)
WITH CHECK (
    user_id = current_app_user()
    OR current_app_role() = 'admin'
    OR assigned_to = current_app_user()
);

-- 22. Settings Table
DROP POLICY IF EXISTS "Settings Select" ON settings;
CREATE POLICY "Settings Select" ON settings FOR SELECT TO anon
USING (current_app_user() IS NOT NULL);
DROP POLICY IF EXISTS "Settings Manage" ON settings;
CREATE POLICY "Settings Manage" ON settings FOR ALL TO anon
USING (current_app_role() = 'admin');

-- ==========================================
-- 8. Initial Data
-- ==========================================
INSERT INTO maintenance (enabled, schedules)
SELECT false, '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM maintenance);
