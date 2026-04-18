-- SmartLMS Supabase Schema (Comprehensive Consolidated Script)
-- This script safely updates the database without losing data and aligns with backend actions.

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Utility Functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Tables (idempotent creation)
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
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  version INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
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
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
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
  due_date TIMESTAMP WITH TIME ZONE,
  points_possible INTEGER DEFAULT 100,
  allow_late_submissions BOOLEAN DEFAULT TRUE,
  late_penalty_per_day INTEGER DEFAULT 0,
  allowed_extensions TEXT[] DEFAULT '{pdf, doc, docx, zip, jpg, png}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  questions JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  anti_cheat_enabled BOOLEAN DEFAULT FALSE,
  regrade_requests_enabled BOOLEAN DEFAULT TRUE,
  version INTEGER DEFAULT 1
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
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  anti_cheat_enabled BOOLEAN DEFAULT FALSE,
  start_at TIMESTAMP WITH TIME ZONE,
  end_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
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
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
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

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  student_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon_url TEXT,
  xp_required INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  duration INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- 4. Migrations (safe column additions)
DO $$
BEGIN
    -- Anti-cheat and violation tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'assignments' AND column_name = 'anti_cheat_enabled') THEN
        ALTER TABLE assignments ADD COLUMN anti_cheat_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quizzes' AND column_name = 'anti_cheat_enabled') THEN
        ALTER TABLE quizzes ADD COLUMN anti_cheat_enabled BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'violation_count') THEN
        ALTER TABLE submissions ADD COLUMN violation_count INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_submissions' AND column_name = 'violation_count') THEN
        ALTER TABLE quiz_submissions ADD COLUMN violation_count INTEGER DEFAULT 0;
    END IF;

    -- Course Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'category') THEN
        ALTER TABLE courses ADD COLUMN category VARCHAR(100);
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'version') THEN ALTER TABLE badges ADD COLUMN version INTEGER DEFAULT 1; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discussions' AND column_name = 'version') THEN ALTER TABLE discussions ADD COLUMN version INTEGER DEFAULT 1; END IF;

    -- Timestamp Harmonization
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'live_classes' AND column_name = 'updated_at') THEN ALTER TABLE live_classes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_submissions' AND column_name = 'updated_at') THEN ALTER TABLE quiz_submissions ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'materials' AND column_name = 'updated_at') THEN ALTER TABLE materials ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planner' AND column_name = 'updated_at') THEN ALTER TABLE planner ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'updated_at') THEN ALTER TABLE badges ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(); END IF;

    -- Quiz Attempts Migration
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quiz_submissions' AND column_name = 'attempt_number') THEN
        ALTER TABLE quiz_submissions ADD COLUMN attempt_number INTEGER DEFAULT 1;
        ALTER TABLE quiz_submissions DROP CONSTRAINT IF EXISTS quiz_submissions_quiz_id_student_id_key;
        ALTER TABLE quiz_submissions ADD CONSTRAINT quiz_submissions_attempt_unique UNIQUE(quiz_id, student_id, attempt_number);
    END IF;
END $$;

-- 5. Indexes (idempotent)
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
CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class ON attendance(live_class_id);
CREATE INDEX IF NOT EXISTS idx_discussions_parent ON discussions(parent_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_quiz ON quiz_submissions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_submissions_student ON quiz_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_materials_course ON materials(course_id);
CREATE INDEX IF NOT EXISTS idx_planner_user_date ON planner(user_id, due_date);

-- 6. Helper Functions

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
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  IF v_user.active = FALSE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is deactivated');
  END IF;

  IF v_user.flagged = TRUE THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account is flagged. Please contact support.');
  END IF;

  IF v_user.locked_until IS NOT NULL AND v_user.locked_until > v_now THEN
    RETURN jsonb_build_object('success', false, 'error', 'Account locked until ' || to_char(v_user.locked_until, 'HH24:MI:SS'));
  END IF;

  -- Block users who used their temp pass but haven't changed it
  IF v_user.reset_request->>'status' = 'approved_used' THEN
     RETURN jsonb_build_object('success', false, 'error', 'Your session has expired. You must change your password using the secure prompt provided during your first login.');
  END IF;

  -- Verify password
  IF v_user.password IS NULL OR crypt(p_password, v_user.password) != v_user.password THEN
    -- PASSWORD FAILED: Check if there is reset info to show
    IF v_user.reset_request IS NOT NULL THEN
       IF v_user.reset_request->>'status' = 'pending' THEN
          RETURN jsonb_build_object('success', false, 'error', 'Your password reset request is under review.');
       ELSIF v_user.reset_request->>'status' = 'approved' THEN
          IF (v_user.reset_request->>'expires_at')::timestamp with time zone > v_now THEN
             RETURN jsonb_build_object('success', false, 'error', 'Reset approved. Your temp password is: ' || (v_user.reset_request->>'temp_password'));
          END IF;
       ELSIF v_user.reset_request->>'status' = 'denied' THEN
          RETURN jsonb_build_object('success', false, 'error', 'Reset denied: ' || (v_user.reset_request->>'denial_reason'));
       END IF;
    END IF;

    UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = v_user.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  -- Successful login
  -- One-time temp password usage: If login with temp pass succeeds, mark it as used
  IF v_user.reset_request->>'status' = 'approved' THEN
     -- Enforce expiration
     IF (v_user.reset_request->>'expires_at')::timestamp with time zone < v_now THEN
        RETURN jsonb_build_object('success', false, 'error', 'Temporary password has expired. Please request a new one.');
     END IF;
     UPDATE users
     SET reset_request = jsonb_set(reset_request, '{status}', '"approved_used"') - 'temp_password'
     WHERE id = v_user.id;
  END IF;

  UPDATE users SET last_login = v_now, failed_attempts = 0, locked_until = NULL WHERE id = v_user.id;
  INSERT INTO sessions (user_id, expires_at) VALUES (v_user.id, v_now + INTERVAL '7 days') RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('success', true, 'user', (to_jsonb(v_user) - 'password'), 'session_id', v_session_id);
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
          RETURN jsonb_build_object('success', false, 'error', 'This email is registered. A password reset request is under review.');
       ELSIF v_user.reset_request->>'status' = 'approved' THEN
          RETURN jsonb_build_object('success', false, 'error', 'This email is registered. Password reset approved. Temp Pass: ' || (v_user.reset_request->>'temp_password'));
       ELSIF v_user.reset_request->>'status' = 'denied' THEN
          RETURN jsonb_build_object('success', false, 'error', 'This email is registered. Previous reset request denied: ' || (v_user.reset_request->>'denial_reason'));
       END IF;
    END IF;
    RETURN jsonb_build_object('success', false, 'error', 'An account with this email already exists.');
  END IF;

  v_hashed_password := crypt(p_password, gen_salt('bf', 10));

  IF v_caller_role != 'admin' THEN
    IF p_role IN ('teacher', 'admin') THEN
      SELECT COUNT(*) INTO v_count FROM users WHERE role IN ('teacher', 'admin');
      IF v_count >= 3 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Public creation of teachers and admins is restricted.');
      END IF;
    END IF;
  END IF;

  INSERT INTO users (full_name, email, password, phone, role, active)
  VALUES (p_full_name, p_email, v_hashed_password, p_phone, p_role, TRUE)
  RETURNING * INTO v_user;

  INSERT INTO sessions (user_id, expires_at)
  VALUES (v_user.id, NOW() + INTERVAL '7 days')
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object('success', true, 'user', (to_jsonb(v_user) - 'password'), 'session_id', v_session_id);
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

    v_hashed_password := CASE WHEN p_password IS NOT NULL AND p_password != '' THEN crypt(p_password, gen_salt('bf', 10)) ELSE NULL END;

    UPDATE users
    SET
        full_name = COALESCE(p_full_name, full_name),
        email = COALESCE(p_email, email),
        password = COALESCE(v_hashed_password, password),
        phone = COALESCE(p_phone, phone),
        role = COALESCE(p_role, role),
        xp = COALESCE(p_xp, xp),
        active = COALESCE(p_active, active),
        flagged = COALESCE(p_flagged, flagged),
        version = version + 1,
        updated_at = NOW()
    WHERE id = p_user_id;

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

-- 7. Notifications & Broadcasting
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

-- 8. Triggers

-- Protect Grades
CREATE OR REPLACE FUNCTION tr_check_grade_protection() RETURNS TRIGGER AS $$
BEGIN
    IF current_app_role() = 'student' THEN
        -- Prevent students from changing grade-related fields
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

-- Auto Flag for Lockouts
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

-- Notify Live Class
CREATE OR REPLACE FUNCTION tr_notify_live_class() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'live' AND (OLD.status IS NULL OR OLD.status != 'live')) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'Live Class Started', 'The class "' || NEW.title || '" has started! Join now.', '/student?page=live', 'live_class', INTERVAL '1 day');
  ELSIF (NEW.status = 'scheduled' AND OLD.status IS NULL) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'Live Class Scheduled', 'A new live class "' || NEW.title || '" has been scheduled for ' || NEW.start_at, '/student?page=live', 'live_class', INTERVAL '7 days');
  ELSIF (NEW.status = 'scheduled' AND OLD.status = 'live') THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'Teacher Left Room', 'The teacher has left the session for "' || NEW.title || '". Please wait for them to rejoin.', '/student?page=live', 'teacher_left', INTERVAL '1 hour');
  ELSIF (NEW.status = 'completed' AND OLD.status = 'live') THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'Class Ended', 'The live class "' || NEW.title || '" has ended.', '/student?page=live', 'class_ended', INTERVAL '1 day');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_live_class_event ON live_classes;
CREATE TRIGGER tr_live_class_event AFTER INSERT OR UPDATE ON live_classes FOR EACH ROW EXECUTE PROCEDURE tr_notify_live_class();

-- Notify Assignment
CREATE OR REPLACE FUNCTION tr_notify_assignment() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published')) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'New Assignment', 'A new assignment "' || NEW.title || '" has been published.', '/student?page=assignments', 'assignment_published', INTERVAL '14 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_assignment_published ON assignments;
CREATE TRIGGER tr_assignment_published AFTER INSERT OR UPDATE ON assignments FOR EACH ROW EXECUTE PROCEDURE tr_notify_assignment();

-- Notify Quiz
CREATE OR REPLACE FUNCTION tr_notify_quiz() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published')) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'New Quiz Available', 'A new quiz "' || NEW.title || '" has been published.', '/student?page=quizzes', 'quiz_published', INTERVAL '14 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_quiz_published ON quizzes;
CREATE TRIGGER tr_quiz_published AFTER INSERT OR UPDATE ON quizzes FOR EACH ROW EXECUTE PROCEDURE tr_notify_quiz();

-- Notify Submission
CREATE OR REPLACE FUNCTION tr_notify_submission() RETURNS TRIGGER AS $$
DECLARE
  v_teacher_id UUID;
BEGIN
  SELECT c.teacher_id INTO v_teacher_id FROM courses c JOIN assignments a ON c.id = a.course_id WHERE a.id = NEW.assignment_id;
  IF (NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status != 'submitted')) THEN
    IF v_teacher_id IS NOT NULL THEN
      PERFORM notify_user(v_teacher_id, 'New Submission', 'A student has submitted an assignment.', '/teacher?page=grading', 'submission_received');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_submission_received ON submissions;
CREATE TRIGGER tr_submission_received AFTER INSERT OR UPDATE ON submissions FOR EACH ROW EXECUTE PROCEDURE tr_notify_submission();

-- Notify Grade
CREATE OR REPLACE FUNCTION tr_notify_grade() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'graded' AND (OLD.status IS NULL OR OLD.status != 'graded')) THEN
    PERFORM notify_user(NEW.student_id, 'Assignment Graded', 'Your assignment has been graded. Score: ' || NEW.final_grade || '%', '/student?page=assignments', 'grade_posted');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_grade_posted ON submissions;
CREATE TRIGGER tr_grade_posted AFTER INSERT OR UPDATE ON submissions FOR EACH ROW EXECUTE PROCEDURE tr_notify_grade();

-- Enforce User Creation Limits
DROP FUNCTION IF EXISTS enforce_user_creation_limits() CASCADE;
CREATE OR REPLACE FUNCTION enforce_user_creation_limits() RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_caller_role TEXT;
BEGIN
  v_caller_role := current_app_role();
  IF v_caller_role = 'admin' THEN
    RETURN NEW;
  END IF;

  IF NEW.role = 'student' THEN
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

-- 9. Storage Setup
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

-- 10. Security (RLS & Permissions)

-- Enable RLS on all tables
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
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Grant permissions to anonymous role for PostgREST access
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- RLS Helper Functions (Avoid recursion)
CREATE OR REPLACE FUNCTION check_is_course_teacher(p_course_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM courses WHERE id = p_course_id AND teacher_id = current_app_user()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_is_enrolled(p_course_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM enrollments WHERE course_id = p_course_id AND student_id = current_app_user()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_assignment_course_teacher(p_assignment_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = p_assignment_id AND c.teacher_id = current_app_user()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS Policies

-- USERS
DROP POLICY IF EXISTS "Users can view and update their own profile" ON users;
CREATE POLICY "Users can view and update their own profile" ON users
  FOR ALL TO anon USING (id = current_app_user()) WITH CHECK (id = current_app_user());

DROP POLICY IF EXISTS "Admins have full access to users" ON users;
CREATE POLICY "Admins have full access to users" ON users
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- COURSES
DROP POLICY IF EXISTS "Teachers can manage their own courses" ON courses;
CREATE POLICY "Teachers can manage their own courses" ON courses
  FOR ALL TO anon USING (teacher_id = current_app_user()) WITH CHECK (teacher_id = current_app_user());

DROP POLICY IF EXISTS "Students can view published or enrolled courses" ON courses;
CREATE POLICY "Students can view published or enrolled courses" ON courses
  FOR SELECT TO anon USING (
    status = 'published' OR
    check_is_enrolled(id)
  );

DROP POLICY IF EXISTS "Admins have full access to courses" ON courses;
CREATE POLICY "Admins have full access to courses" ON courses
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- LESSONS
DROP POLICY IF EXISTS "Teachers can manage lessons for their courses" ON lessons;
CREATE POLICY "Teachers can manage lessons for their courses" ON lessons
  FOR ALL TO anon USING (check_is_course_teacher(course_id));

DROP POLICY IF EXISTS "Students can view lessons for enrolled courses" ON lessons;
CREATE POLICY "Students can view lessons for enrolled courses" ON lessons
  FOR SELECT TO anon USING (check_is_enrolled(course_id) AND status = 'published');

DROP POLICY IF EXISTS "Admins have full access to lessons" ON lessons;
CREATE POLICY "Admins have full access to lessons" ON lessons
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- MATERIALS
DROP POLICY IF EXISTS "Teachers can manage materials for their courses" ON materials;
CREATE POLICY "Teachers can manage materials for their courses" ON materials
  FOR ALL TO anon USING (check_is_course_teacher(course_id));

DROP POLICY IF EXISTS "Students can view materials for enrolled courses" ON materials;
CREATE POLICY "Students can view materials for enrolled courses" ON materials
  FOR SELECT TO anon USING (check_is_enrolled(course_id) AND status = 'published');

DROP POLICY IF EXISTS "Admins have full access to materials" ON materials;
CREATE POLICY "Admins have full access to materials" ON materials
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- ENROLLMENTS
DROP POLICY IF EXISTS "Students can enroll themselves" ON enrollments;
CREATE POLICY "Students can enroll themselves" ON enrollments
  FOR INSERT TO anon WITH CHECK (student_id = current_app_user());

DROP POLICY IF EXISTS "Students can update their own progress" ON enrollments;
CREATE POLICY "Students can update their own progress" ON enrollments
  FOR UPDATE TO anon USING (student_id = current_app_user()) WITH CHECK (student_id = current_app_user());

DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT TO anon USING (student_id = current_app_user());

DROP POLICY IF EXISTS "Teachers can view enrollments for their courses" ON enrollments;
CREATE POLICY "Teachers can view enrollments for their courses" ON enrollments
  FOR SELECT TO anon USING (check_is_course_teacher(course_id));

DROP POLICY IF EXISTS "Teachers can manage enrollments for their courses" ON enrollments;
CREATE POLICY "Teachers can manage enrollments for their courses" ON enrollments
  FOR DELETE TO anon USING (check_is_course_teacher(course_id));

DROP POLICY IF EXISTS "Admins have full access to enrollments" ON enrollments;
CREATE POLICY "Admins have full access to enrollments" ON enrollments
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- ASSIGNMENTS
DROP POLICY IF EXISTS "Teachers can manage assignments for their courses" ON assignments;
CREATE POLICY "Teachers can manage assignments for their courses" ON assignments
  FOR ALL TO anon USING (check_is_course_teacher(course_id));

DROP POLICY IF EXISTS "Students can view assignments for enrolled courses" ON assignments;
CREATE POLICY "Students can view assignments for enrolled courses" ON assignments
  FOR SELECT TO anon USING (check_is_enrolled(course_id) AND status = 'published');

DROP POLICY IF EXISTS "Admins have full access to assignments" ON assignments;
CREATE POLICY "Admins have full access to assignments" ON assignments
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- SUBMISSIONS
DROP POLICY IF EXISTS "Students can manage their own submissions" ON submissions;
CREATE POLICY "Students can manage their own submissions" ON submissions
  FOR ALL TO anon USING (student_id = current_app_user()) WITH CHECK (student_id = current_app_user());

DROP POLICY IF EXISTS "Teachers can view and grade submissions for their courses" ON submissions;
CREATE POLICY "Teachers can view and grade submissions for their courses" ON submissions
  FOR ALL TO anon USING (check_assignment_course_teacher(assignment_id));

DROP POLICY IF EXISTS "Admins have full access to submissions" ON submissions;
CREATE POLICY "Admins have full access to submissions" ON submissions
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- QUIZZES
DROP POLICY IF EXISTS "Teachers can manage quizzes for their courses" ON quizzes;
CREATE POLICY "Teachers can manage quizzes for their courses" ON quizzes
  FOR ALL TO anon USING (check_is_course_teacher(course_id));

DROP POLICY IF EXISTS "Students can view quizzes for enrolled courses" ON quizzes;
CREATE POLICY "Students can view quizzes for enrolled courses" ON quizzes
  FOR SELECT TO anon USING (check_is_enrolled(course_id) AND status = 'published');

DROP POLICY IF EXISTS "Admins have full access to quizzes" ON quizzes;
CREATE POLICY "Admins have full access to quizzes" ON quizzes
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- QUIZ SUBMISSIONS
DROP POLICY IF EXISTS "Students can manage their own quiz submissions" ON quiz_submissions;
CREATE POLICY "Students can manage their own quiz submissions" ON quiz_submissions
  FOR ALL TO anon USING (student_id = current_app_user()) WITH CHECK (student_id = current_app_user());

DROP POLICY IF EXISTS "Teachers can view quiz submissions for their courses" ON quiz_submissions;
CREATE POLICY "Teachers can view quiz submissions for their courses" ON quiz_submissions
  FOR SELECT TO anon USING (
    EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_submissions.quiz_id AND check_is_course_teacher(course_id))
  );

DROP POLICY IF EXISTS "Admins have full access to quiz submissions" ON quiz_submissions;
CREATE POLICY "Admins have full access to quiz submissions" ON quiz_submissions
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- DISCUSSIONS
DROP POLICY IF EXISTS "Users can manage their own discussion posts" ON discussions;
CREATE POLICY "Users can manage their own discussion posts" ON discussions
  FOR ALL TO anon USING (user_id = current_app_user()) WITH CHECK (user_id = current_app_user());

DROP POLICY IF EXISTS "Users can view discussions for enrolled courses" ON discussions;
CREATE POLICY "Users can view discussions for enrolled courses" ON discussions
  FOR SELECT TO anon USING (
    course_id IS NULL OR
    check_is_enrolled(course_id) OR
    check_is_course_teacher(course_id)
  );

DROP POLICY IF EXISTS "Admins have full access to discussions" ON discussions;
CREATE POLICY "Admins have full access to discussions" ON discussions
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" ON notifications
  FOR ALL TO anon USING (user_id = current_app_user()) WITH CHECK (user_id = current_app_user());

-- PLANNER
DROP POLICY IF EXISTS "Users can manage their own planner items" ON planner;
CREATE POLICY "Users can manage their own planner items" ON planner
  FOR ALL TO anon USING (user_id = current_app_user()) WITH CHECK (user_id = current_app_user());

-- STUDY SESSIONS
DROP POLICY IF EXISTS "Users can manage their own study sessions" ON study_sessions;
CREATE POLICY "Users can manage their own study sessions" ON study_sessions
  FOR ALL TO anon USING (user_id = current_app_user()) WITH CHECK (user_id = current_app_user());

-- LESSON COMPLETIONS
DROP POLICY IF EXISTS "Students can manage their own lesson completions" ON lesson_completions;
CREATE POLICY "Students can manage their own lesson completions" ON lesson_completions
  FOR ALL TO anon USING (student_id = current_app_user()) WITH CHECK (student_id = current_app_user());

-- ATTENDANCE
DROP POLICY IF EXISTS "Students can manage their own attendance" ON attendance;
CREATE POLICY "Students can manage their own attendance" ON attendance
  FOR ALL TO anon USING (student_id = current_app_user()) WITH CHECK (student_id = current_app_user());

-- LIVE CLASSES
DROP POLICY IF EXISTS "Teachers can manage live classes for their courses" ON live_classes;
CREATE POLICY "Teachers can manage live classes for their courses" ON live_classes
  FOR ALL TO anon USING (check_is_course_teacher(course_id));

DROP POLICY IF EXISTS "Students can view live classes for enrolled courses" ON live_classes;
CREATE POLICY "Students can view live classes for enrolled courses" ON live_classes
  FOR SELECT TO anon USING (check_is_enrolled(course_id));

DROP POLICY IF EXISTS "Admins have full access to live classes" ON live_classes;
CREATE POLICY "Admins have full access to live classes" ON live_classes
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- SESSIONS
DROP POLICY IF EXISTS "Users can manage their own sessions" ON sessions;
CREATE POLICY "Users can manage their own sessions" ON sessions
  FOR ALL TO anon USING (user_id = current_app_user()) WITH CHECK (user_id = current_app_user());

-- BROADCASTS
DROP POLICY IF EXISTS "Everyone can view broadcasts" ON broadcasts;
CREATE POLICY "Everyone can view broadcasts" ON broadcasts
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage broadcasts" ON broadcasts;
CREATE POLICY "Admins can manage broadcasts" ON broadcasts
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- MAINTENANCE
DROP POLICY IF EXISTS "Everyone can view maintenance status" ON maintenance;
CREATE POLICY "Everyone can view maintenance status" ON maintenance
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage maintenance" ON maintenance;
CREATE POLICY "Admins can manage maintenance" ON maintenance
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- CERTIFICATES
DROP POLICY IF EXISTS "Users can view their own certificates" ON certificates;
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT TO anon USING (student_id = current_app_user());

DROP POLICY IF EXISTS "Teachers can manage certificates for their courses" ON certificates;
CREATE POLICY "Teachers can manage certificates for their courses" ON certificates
  FOR ALL TO anon USING (check_is_course_teacher(course_id));

DROP POLICY IF EXISTS "Admins have full access to certificates" ON certificates;
CREATE POLICY "Admins have full access to certificates" ON certificates
  FOR ALL TO anon USING (current_app_role() = 'admin');

-- BADGES & USER BADGES
DROP POLICY IF EXISTS "Everyone can view badges" ON badges;
CREATE POLICY "Everyone can view badges" ON badges
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Everyone can view user badges" ON user_badges;
CREATE POLICY "Everyone can view user badges" ON user_badges
  FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS "Admins and Teachers can manage badges" ON badges;
CREATE POLICY "Admins and Teachers can manage badges" ON badges
  FOR ALL TO anon USING (current_app_role() IN ('admin', 'teacher'));

DROP POLICY IF EXISTS "Teachers and Admins can manage user badges" ON user_badges;
CREATE POLICY "Teachers and Admins can manage user badges" ON user_badges
  FOR ALL TO anon USING (current_app_role() IN ('teacher', 'admin'));

-- SYSTEM LOGS
DROP POLICY IF EXISTS "Authenticated users can insert system logs" ON system_logs;
CREATE POLICY "Authenticated users can insert system logs" ON system_logs
  FOR INSERT TO anon WITH CHECK (current_app_user() IS NOT NULL);

DROP POLICY IF EXISTS "Only admins can view system logs" ON system_logs;
CREATE POLICY "Only admins can view system logs" ON system_logs
  FOR SELECT TO anon USING (current_app_role() = 'admin');

-- SETTINGS
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;
CREATE POLICY "Admins can manage settings" ON settings
  FOR ALL TO anon USING (current_app_role() = 'admin');

DROP POLICY IF EXISTS "Everyone can view certain settings" ON settings;
CREATE POLICY "Everyone can view certain settings" ON settings
  FOR SELECT TO anon USING (TRUE);

-- 11. Initial Data
INSERT INTO maintenance (enabled, schedules)
SELECT false, '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM maintenance);
