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
  course_id VARCHAR(100), -- Acts as Enrollment Code
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

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  type VARCHAR(50) DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  user_agent TEXT,
  ip_address TEXT
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

    -- Course Metadata
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'category') THEN
        ALTER TABLE courses DROP COLUMN category;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'course_id') THEN
        ALTER TABLE courses ADD COLUMN course_id VARCHAR(100);
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
        ALTER TABLE quiz_submissions ADD CONSTRAINT quiz_submissions_attempt_unique UNIQUE(quiz_id, student_id, attempt_number);
    END IF;
END $$;

-- ==========================================
-- 5. Indexes (Idempotent)
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_sessions_id ON sessions(id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
CREATE INDEX IF NOT EXISTS idx_courses_teacher ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
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

-- ==========================================
-- 6. RPC Functions (Logic Layers)
-- ==========================================

-- Custom App User Resolver
DROP FUNCTION IF EXISTS current_app_user() CASCADE;
CREATE OR REPLACE FUNCTION current_app_user() RETURNS UUID AS $$
DECLARE
  v_headers JSON;
  v_session_id TEXT;
  v_user_id UUID;
BEGIN
  BEGIN
    v_headers := current_setting('request.headers', true)::json;
    v_session_id := v_headers->>'x-session-id';
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  IF v_session_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT s.user_id INTO v_user_id
  FROM sessions s
  WHERE s.id = v_session_id::uuid
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

-- Authentication RPC
DROP FUNCTION IF EXISTS authenticate_user(p_email VARCHAR, p_password VARCHAR);
CREATE OR REPLACE FUNCTION authenticate_user(p_email VARCHAR, p_password VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_user users;
  v_session_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  SELECT * INTO v_user FROM users WHERE email = p_email;

  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Invalid email or password');
  END IF;

  IF v_user.active = FALSE THEN
    RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Account is deactivated');
  END IF;

  IF v_user.flagged = TRUE THEN
    RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Account is flagged. Please contact support.');
  END IF;

  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > v_now THEN
    RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Account locked until ' || to_char(v_user.locked_until, 'HH24:MI:SS'));
  END IF;

  -- Block users who used their temp pass but haven't changed it
  IF v_user.reset_request->>'status' = 'approved_used' THEN
     RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Your session has expired. You must change your password using the secure prompt provided during your first login.');
  END IF;

  -- Verify password
  IF v_user.password IS NULL OR crypt(p_password, v_user.password) != v_user.password THEN
    -- PASSWORD FAILED: Check if there is reset info to show
    IF v_user.reset_request IS NOT NULL THEN
       IF v_user.reset_request->>'status' = 'pending' THEN
          RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Your password reset request is under review.');
       ELSIF v_user.reset_request->>'status' = 'approved' THEN
          IF (v_user.reset_request->>'expires_at')::timestamp with time zone > v_now THEN
             RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Reset approved. Your temp password is: ' || (v_user.reset_request->>'temp_password'));
          END IF;
       ELSIF v_user.reset_request->>'status' = 'denied' THEN
          RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Reset denied: ' || (v_user.reset_request->>'denial_reason'));
       END IF;
    END IF;

    UPDATE users
    SET
        failed_attempts = failed_attempts + 1,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN v_now + INTERVAL '30 minutes' ELSE locked_until END,
        lockouts = CASE WHEN failed_attempts + 1 >= 5 THEN lockouts + 1 ELSE lockouts END
    WHERE id = v_user.id;

    RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Invalid email or password');
  END IF;

  -- Successful login
  -- One-time temp password usage: If login with temp pass succeeds, mark it as used
  IF v_user.reset_request->>'status' = 'approved' THEN
     -- Enforce expiration
     IF (v_user.reset_request->>'expires_at')::timestamp with time zone < v_now THEN
        RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Temporary password has expired. Please request a new one.');
     END IF;
     UPDATE users
     SET reset_request = jsonb_set(reset_request, '{status}', '"approved_used"') - 'temp_password'
     WHERE id = v_user.id;
  END IF;

  UPDATE users SET last_login = v_now, failed_attempts = 0, locked_until = NULL WHERE id = v_user.id;
  INSERT INTO sessions (user_id, expires_at) VALUES (v_user.id, v_now + INTERVAL '7 days') RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('success', true, 'user', (to_jsonb(v_user) - 'password'), 'session_id', v_session_id, 'error', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User Registration RPC
DROP FUNCTION IF EXISTS register_user(p_full_name VARCHAR, p_email VARCHAR, p_password VARCHAR, p_phone VARCHAR, p_role VARCHAR);
CREATE OR REPLACE FUNCTION register_user(p_full_name VARCHAR, p_email VARCHAR, p_password VARCHAR, p_phone VARCHAR, p_role VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_user users;
  v_session_id UUID;
  v_count INTEGER;
  v_caller_role TEXT;
  v_hashed_password TEXT;
BEGIN
  v_caller_role := COALESCE(current_app_role(), 'public');

  -- Check if email already exists and provide detailed feedback on reset status
  SELECT * INTO v_user FROM users WHERE email = p_email;
  IF v_user.id IS NOT NULL THEN
    IF v_user.reset_request IS NOT NULL THEN
       IF v_user.reset_request->>'status' = 'pending' THEN
          RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'This email is registered. A password reset request is under review.');
       ELSIF v_user.reset_request->>'status' = 'approved' THEN
          RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'This email is registered. Password reset approved. Temp Pass: ' || (v_user.reset_request->>'temp_password'));
       ELSIF v_user.reset_request->>'status' = 'denied' THEN
          RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'This email is registered. Previous reset request denied: ' || (v_user.reset_request->>'denial_reason'));
       END IF;
    END IF;
    RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'An account with this email already exists.');
  END IF;

  v_hashed_password := crypt(p_password, gen_salt('bf', 10));

  -- Creation limits for non-admin callers
  IF v_caller_role != 'admin' THEN
    IF p_role IN ('teacher', 'admin') THEN
      SELECT COUNT(*) INTO v_count FROM users WHERE role IN ('teacher', 'admin');
      IF v_count >= 3 THEN
        RETURN jsonb_build_object('success', false, 'user', null, 'session_id', null, 'error', 'Public creation of teachers and admins is restricted.');
      END IF;
    END IF;
  END IF;

  INSERT INTO users (full_name, email, password, phone, role, active)
  VALUES (p_full_name, p_email, v_hashed_password, p_phone, p_role, TRUE)
  RETURNING * INTO v_user;

  INSERT INTO sessions (user_id, expires_at)
  VALUES (v_user.id, NOW() + INTERVAL '7 days')
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('success', true, 'user', (to_jsonb(v_user) - 'password'), 'session_id', v_session_id, 'error', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Password Reset Management
DROP FUNCTION IF EXISTS request_password_reset(p_email VARCHAR, p_reason TEXT, p_risk_level TEXT);
CREATE OR REPLACE FUNCTION request_password_reset(p_email VARCHAR, p_reason TEXT, p_risk_level TEXT DEFAULT 'medium')
RETURNS JSONB AS $$
DECLARE
  v_user users;
BEGIN
  SELECT * INTO v_user FROM users WHERE email = p_email;
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No account found with this email.');
  END IF;

  -- Check existing reset requests
  IF v_user.reset_request IS NOT NULL THEN
     IF v_user.reset_request->>'status' = 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'A request is already under review for this account.');
     ELSIF v_user.reset_request->>'status' = 'approved' THEN
        IF (v_user.reset_request->>'expires_at')::timestamp with time zone > NOW() THEN
           RETURN jsonb_build_object('success', false, 'error', 'Reset approved. Temp Password: ' || (v_user.reset_request->>'temp_password'));
        END IF;
     END IF;
  END IF;

  UPDATE users
  SET
    reset_request = jsonb_build_object(
      'requested_at', NOW(),
      'status', 'pending',
      'reason', p_reason,
      'risk_level', p_risk_level
    ),
    flagged = CASE WHEN p_risk_level = 'high' THEN TRUE ELSE flagged END
  WHERE id = v_user.id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS admin_update_user_v2(p_user_id UUID, p_full_name VARCHAR, p_email VARCHAR, p_password VARCHAR, p_phone VARCHAR, p_role VARCHAR, p_xp INTEGER, p_active BOOLEAN, p_flagged BOOLEAN);
CREATE OR REPLACE FUNCTION admin_update_user_v2(
    p_user_id UUID,
    p_full_name VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_password VARCHAR DEFAULT NULL,
    p_phone VARCHAR DEFAULT NULL,
    p_role VARCHAR DEFAULT NULL,
    p_xp INTEGER DEFAULT NULL,
    p_active BOOLEAN DEFAULT NULL,
    p_flagged BOOLEAN DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_hashed_password TEXT;
    v_caller_role TEXT;
BEGIN
    v_caller_role := current_app_role();
    IF v_caller_role != 'admin' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only admins can perform this action');
    END IF;

    IF p_password IS NOT NULL AND p_password != '' THEN
        v_hashed_password := crypt(p_password, gen_salt('bf', 10));
        UPDATE users
        SET
            full_name = p_full_name,
            email = p_email,
            password = v_hashed_password,
            phone = p_phone,
            role = p_role,
            active = p_active,
            flagged = p_flagged,
            version = version + 1,
            updated_at = NOW()
        WHERE id = p_user_id;
    ELSE
        UPDATE users
        SET
            full_name = p_full_name,
            email = p_email,
            phone = p_phone,
            role = p_role,
            active = p_active,
            flagged = p_flagged,
            version = version + 1,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS approve_password_reset(p_user_id UUID, p_temp_password TEXT);
CREATE OR REPLACE FUNCTION approve_password_reset(p_user_id UUID, p_temp_password TEXT)
RETURNS JSONB AS $$
DECLARE
  v_hashed TEXT;
BEGIN
  v_hashed := crypt(p_temp_password, gen_salt('bf', 10));

  UPDATE users
  SET
    password = v_hashed,
    reset_request = jsonb_set(
        jsonb_set(reset_request, '{status}', '"approved"'),
        '{temp_password}', to_jsonb(p_temp_password)
    ) || jsonb_build_object('approved_at', NOW(), 'expires_at', NOW() + INTERVAL '24 hours'),
    failed_attempts = 0,
    locked_until = NULL
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS deny_password_reset(p_user_id UUID, p_reason TEXT);
CREATE OR REPLACE FUNCTION deny_password_reset(p_user_id UUID, p_reason TEXT)
RETURNS JSONB AS $$
BEGIN
  UPDATE users
  SET
    reset_request = jsonb_set(
        jsonb_set(reset_request, '{status}', '"denied"'),
        '{denial_reason}', to_jsonb(p_reason)
    )
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Other Helpers
DROP FUNCTION IF EXISTS update_setting(p_key VARCHAR, p_value JSONB);
CREATE OR REPLACE FUNCTION update_setting(p_key VARCHAR, p_value JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO settings (key, value, updated_at)
  VALUES (p_key, p_value, NOW())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_user_password(p_current_password VARCHAR, p_new_password VARCHAR);
CREATE OR REPLACE FUNCTION update_user_password(p_current_password VARCHAR, p_new_password VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_hashed_password TEXT;
BEGIN
  v_user_id := current_app_user();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM users
    WHERE id = v_user_id
    AND password IS NOT NULL
    AND crypt(p_current_password, password) = password
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Incorrect current password');
  END IF;

  v_hashed_password := crypt(p_new_password, gen_salt('bf', 10));
  UPDATE users SET password = v_hashed_password, reset_request = NULL, updated_at = NOW() WHERE id = v_user_id;

  -- Invalidate other sessions for this user on password change
  DELETE FROM sessions WHERE user_id = v_user_id AND id != (current_setting('request.headers', true)::json->>'x-session-id')::uuid;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS update_user_preferences(p_preferences JSONB);
CREATE OR REPLACE FUNCTION update_user_preferences(p_preferences JSONB)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := current_app_user();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  UPDATE users
  SET notification_preferences = p_preferences, updated_at = NOW()
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_role_counts();
CREATE OR REPLACE FUNCTION get_role_counts()
RETURNS JSONB AS $$
DECLARE
  v_teachers INTEGER;
  v_admins INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_teachers FROM users WHERE role = 'teacher';
  SELECT COUNT(*) INTO v_admins FROM users WHERE role = 'admin';
  RETURN jsonb_build_object(
    'teachers', v_teachers,
    'admins', v_admins,
    'total', v_teachers + v_admins
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 7. Notifications & Broadcasting
-- ==========================================

DROP FUNCTION IF EXISTS notify_user(target_id UUID, n_title TEXT, n_msg TEXT, n_link TEXT, n_type TEXT);
CREATE OR REPLACE FUNCTION notify_user(target_id UUID, n_title TEXT, n_msg TEXT, n_link TEXT DEFAULT NULL, n_type TEXT DEFAULT 'system')
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, link, type)
  VALUES (target_id, n_title, n_msg, n_link, n_type);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS broadcast_data(n_course_id UUID, n_role VARCHAR, n_title TEXT, n_msg TEXT, n_link TEXT, n_type TEXT, n_expires_in INTERVAL);
CREATE OR REPLACE FUNCTION broadcast_data(n_course_id UUID, n_role VARCHAR, n_title TEXT, n_msg TEXT, n_link TEXT DEFAULT NULL, n_type TEXT DEFAULT 'system', n_expires_in INTERVAL DEFAULT INTERVAL '30 days')
RETURNS VOID AS $$
BEGIN
  INSERT INTO broadcasts (course_id, target_role, title, message, link, type, expires_at)
  VALUES (n_course_id, n_role, n_title, n_msg, n_link, n_type, NOW() + n_expires_in);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 8. Triggers & Automation
-- ==========================================

-- Grade Protection
CREATE OR REPLACE FUNCTION tr_check_grade_protection() RETURNS TRIGGER AS $$
BEGIN
    IF current_app_role() = 'student' THEN
        IF TG_TABLE_NAME = 'submissions' THEN
            IF (NEW.grade IS DISTINCT FROM OLD.grade) OR
               (NEW.final_grade IS DISTINCT FROM OLD.final_grade) OR
               (NEW.graded_at IS DISTINCT FROM OLD.graded_at) THEN
                RAISE EXCEPTION 'Students are not authorized to modify grades.';
            END IF;
        ELSIF TG_TABLE_NAME = 'quiz_submissions' THEN
            IF (NEW.score IS DISTINCT FROM OLD.score) OR
               (NEW.total_points IS DISTINCT FROM OLD.total_points) THEN
                RAISE EXCEPTION 'Students are not authorized to modify assessment scores.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_asgn_grades ON submissions;
CREATE TRIGGER tr_protect_asgn_grades BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE PROCEDURE tr_check_grade_protection();

DROP TRIGGER IF EXISTS tr_protect_quiz_scores ON quiz_submissions;
CREATE TRIGGER tr_protect_quiz_scores BEFORE UPDATE ON quiz_submissions FOR EACH ROW EXECUTE PROCEDURE tr_check_grade_protection();

-- Lockout Management
CREATE OR REPLACE FUNCTION tr_check_lockouts_flag() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lockouts >= 3 AND OLD.lockouts < 3 THEN
    NEW.flagged := TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_users_lockout_flag ON users;
CREATE TRIGGER tr_users_lockout_flag BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE tr_check_lockouts_flag();

-- Broadcast Automation
CREATE OR REPLACE FUNCTION tr_notify_live_class() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status != 'live')) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'Live Class Started', 'The class "' || NEW.title || '" has started! Join now.', '/student/live', 'live_class', INTERVAL '1 day');
  ELSIF (NEW.status = 'scheduled' AND OLD.status IS NULL) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'Live Class Scheduled', 'A new live class "' || NEW.title || '" has been scheduled for ' || NEW.start_at, '/student/live', 'live_class', INTERVAL '7 days');
  ELSIF (NEW.status = 'completed' AND OLD.status = 'live') THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'Class Ended', 'The live class "' || NEW.title || '" has ended.', '/student/live', 'class_ended', INTERVAL '1 day');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_live_class_event ON live_classes;
CREATE TRIGGER tr_live_class_event AFTER INSERT OR UPDATE ON live_classes FOR EACH ROW EXECUTE PROCEDURE tr_notify_live_class();

CREATE OR REPLACE FUNCTION tr_notify_assignment() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published')) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'New Assignment', 'A new assignment "' || NEW.title || '" has been published.', '/student/assignments', 'assignment_published', INTERVAL '14 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_assignment_published ON assignments;
CREATE TRIGGER tr_assignment_published AFTER INSERT OR UPDATE ON assignments FOR EACH ROW EXECUTE PROCEDURE tr_notify_assignment();

CREATE OR REPLACE FUNCTION tr_notify_quiz() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published')) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'New Quiz Available', 'A new quiz "' || NEW.title || '" has been published.', '/student/quizzes', 'quiz_published', INTERVAL '14 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_quiz_published ON quizzes;
CREATE TRIGGER tr_quiz_published AFTER INSERT OR UPDATE ON quizzes FOR EACH ROW EXECUTE PROCEDURE tr_notify_quiz();

-- User Creation Limits
DROP FUNCTION IF EXISTS enforce_user_creation_limits() CASCADE;
CREATE OR REPLACE FUNCTION enforce_user_creation_limits() RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_caller_role TEXT;
BEGIN
  v_caller_role := current_app_role();
  IF v_caller_role = 'admin' OR NEW.role = 'student' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_count FROM users WHERE role IN ('teacher', 'admin');
  IF v_count >= 3 THEN
    RAISE EXCEPTION 'Public creation of teachers and admins is restricted.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_user_creation_limit ON users;
CREATE TRIGGER tr_user_creation_limit
  BEFORE INSERT ON users
  FOR EACH ROW EXECUTE PROCEDURE enforce_user_creation_limits();

-- ==========================================
-- 9. Storage Setup
-- ==========================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('lms-files', 'lms-files', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public view files" ON storage.objects;
    CREATE POLICY "Public view files" ON storage.objects FOR SELECT USING (bucket_id = 'lms-files');

    DROP POLICY IF EXISTS "Anyone can upload files" ON storage.objects;
    CREATE POLICY "Anyone can upload files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'lms-files');

    DROP POLICY IF EXISTS "Users can manage own files" ON storage.objects;
    CREATE POLICY "Users can manage own files" ON storage.objects FOR ALL USING (bucket_id = 'lms-files');

    DROP POLICY IF EXISTS "Admins full storage access" ON storage.objects;
    CREATE POLICY "Admins full storage access" ON storage.objects FOR ALL USING (true);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ==========================================
-- 10. Security (RLS Policies)
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
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- STRICT BACKEND-ONLY ACCESS POLICIES
-- Data access is proxied through our API/Service layer using withSession(x-session-id).

DROP POLICY IF EXISTS "Strict Backend Access" ON users;
CREATE POLICY "Strict Backend Access" ON users FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON courses;
CREATE POLICY "Strict Backend Access" ON courses FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON lessons;
CREATE POLICY "Strict Backend Access" ON lessons FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON enrollments;
CREATE POLICY "Strict Backend Access" ON enrollments FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON assignments;
CREATE POLICY "Strict Backend Access" ON assignments FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON submissions;
CREATE POLICY "Strict Backend Access" ON submissions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON live_classes;
CREATE POLICY "Strict Backend Access" ON live_classes FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON attendance;
CREATE POLICY "Strict Backend Access" ON attendance FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON quizzes;
CREATE POLICY "Strict Backend Access" ON quizzes FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON quiz_submissions;
CREATE POLICY "Strict Backend Access" ON quiz_submissions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON materials;
CREATE POLICY "Strict Backend Access" ON materials FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON discussions;
CREATE POLICY "Strict Backend Access" ON discussions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON notifications;
CREATE POLICY "Strict Backend Access" ON notifications FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON sessions;
CREATE POLICY "Strict Backend Access" ON sessions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON broadcasts;
CREATE POLICY "Strict Backend Access" ON broadcasts FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON maintenance;
CREATE POLICY "Strict Backend Access" ON maintenance FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON planner;
CREATE POLICY "Strict Backend Access" ON planner FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON lesson_completions;
CREATE POLICY "Strict Backend Access" ON lesson_completions FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON system_logs;
CREATE POLICY "Strict Backend Access" ON system_logs FOR ALL TO anon USING (false);
DROP POLICY IF EXISTS "Strict Backend Access" ON settings;
CREATE POLICY "Strict Backend Access" ON settings FOR ALL TO anon USING (false);

-- ==========================================
-- 11. Initial Data
-- ==========================================
INSERT INTO maintenance (enabled, schedules)
SELECT false, '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM maintenance);
