-- SmartLMS Supabase Schema (Comprehensive Replacement & Migration Script)
-- This script safely updates the database without losing data.

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Utility Functions
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
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  video_url TEXT,
  order_index INTEGER DEFAULT 0,
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
  regrade_requests_enabled BOOLEAN DEFAULT TRUE
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  violation_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,
  file_type VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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
  user_id UUID,
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

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'category') THEN
        ALTER TABLE courses ADD COLUMN category VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'thumbnail_url') THEN
        ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'submission_text') THEN
        ALTER TABLE submissions ADD COLUMN submission_text TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'file_url') THEN
        ALTER TABLE submissions ADD COLUMN file_url TEXT;
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

-- Authenticate User with enhanced Password Reset logic
CREATE OR REPLACE FUNCTION authenticate_user(p_email VARCHAR, p_password VARCHAR)
RETURNS JSONB AS $$
DECLARE
  v_user users;
  v_session_id UUID;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Find user by email
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

  -- Verify password
  IF v_user.password IS NULL OR crypt(p_password, v_user.password) != v_user.password THEN
    -- PASSWORD FAILED: Check if there is reset info to show before reporting failure
    IF v_user.reset_request IS NOT NULL THEN
       IF v_user.reset_request->>'status' = 'pending' THEN
          RETURN jsonb_build_object('success', false, 'error', 'Your password reset request is currently under review by an administrator.');
       ELSIF v_user.reset_request->>'status' = 'approved' THEN
          IF (v_user.reset_request->>'expires_at')::timestamp with time zone > v_now THEN
             RETURN jsonb_build_object('success', false, 'error', 'Your password reset has been approved. Your temporary 5-digit password is: ' || (v_user.reset_request->>'temp_password') || '. Use this to log in and set a permanent password.');
          END IF;
       ELSIF v_user.reset_request->>'status' = 'denied' THEN
          RETURN jsonb_build_object('success', false, 'error', 'Your password reset request was denied. Reason: ' || (v_user.reset_request->>'denial_reason') || '. You may submit a new request.');
       END IF;
    END IF;

    UPDATE users SET failed_attempts = failed_attempts + 1 WHERE id = v_user.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  -- Successful login
  UPDATE users SET last_login = v_now, failed_attempts = 0, locked_until = NULL WHERE id = v_user.id;

  INSERT INTO sessions (user_id, expires_at)
  VALUES (v_user.id, v_now + INTERVAL '7 days')
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'user', (to_jsonb(v_user) - 'password'),
    'session_id', v_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_setting(p_key VARCHAR, p_value JSONB)
RETURNS VOID AS $$
BEGIN
  INSERT INTO settings (key, value, updated_at)
  VALUES (p_key, p_value, NOW())
  ON CONFLICT (key) DO UPDATE
  SET value = EXCLUDED.value, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  -- Force password change logic: update_user_password ALWAYS clears any pending/approved reset requests
  UPDATE users SET password = v_hashed_password, reset_request = NULL, updated_at = NOW() WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

  -- Check if user already exists and report reset status if relevant
  SELECT * INTO v_user FROM users WHERE email = p_email;
  IF v_user.id IS NOT NULL THEN
    IF v_user.reset_request IS NOT NULL THEN
       IF v_user.reset_request->>'status' = 'pending' THEN
          RETURN jsonb_build_object('success', false, 'error', 'This email is registered. A password reset request is under review.');
       ELSIF v_user.reset_request->>'status' = 'approved' THEN
          RETURN jsonb_build_object('success', false, 'error', 'This email is registered. Password reset approved. Temp Pass: ' || (v_user.reset_request->>'temp_password'));
       ELSIF v_user.reset_request->>'status' = 'denied' THEN
          RETURN jsonb_build_object('success', false, 'error', 'This email is registered. Previous reset denied: ' || (v_user.reset_request->>'denial_reason'));
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

  RETURN jsonb_build_object(
    'success', true,
    'user', (to_jsonb(v_user) - 'password'),
    'session_id', v_session_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced Request Password Reset
CREATE OR REPLACE FUNCTION request_password_reset(p_email VARCHAR, p_reason TEXT, p_risk_level TEXT DEFAULT 'medium')
RETURNS JSONB AS $$
DECLARE
  v_user users;
BEGIN
  SELECT * INTO v_user FROM users WHERE email = p_email;
  IF v_user.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No account found with this email.');
  END IF;

  IF v_user.reset_request IS NOT NULL THEN
     IF v_user.reset_request->>'status' = 'pending' THEN
        RETURN jsonb_build_object('success', false, 'error', 'A request is already under review for this account.');
     ELSIF v_user.reset_request->>'status' = 'approved' THEN
        IF (v_user.reset_request->>'expires_at')::timestamp with time zone > NOW() THEN
           RETURN jsonb_build_object('success', false, 'error', 'Reset approved. Your temporary password is: ' || (v_user.reset_request->>'temp_password'));
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

-- Admin Approval Logic
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

-- Admin Denial Logic
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

CREATE OR REPLACE FUNCTION current_app_role() RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM users WHERE id = current_app_user();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Creation Limit Trigger
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
