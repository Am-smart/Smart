-- SmartLMS Supabase Schema (Comprehensive Replacement & Migration Script)
-- This script safely updates the database without losing data.

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted')),
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
CREATE OR REPLACE FUNCTION notify_user(target_id UUID, n_title TEXT, n_msg TEXT, n_link TEXT DEFAULT NULL, n_type TEXT DEFAULT 'system')
RETURNS VOID AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, link, type)
  VALUES (target_id, n_title, n_msg, n_link, n_type);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION broadcast_data(n_course_id UUID, n_role VARCHAR, n_title TEXT, n_msg TEXT, n_link TEXT DEFAULT NULL, n_type TEXT DEFAULT 'system', n_expires_in INTERVAL DEFAULT INTERVAL '30 days')
RETURNS VOID AS $$
BEGIN
  INSERT INTO broadcasts (course_id, target_role, title, message, link, type, expires_at)
  VALUES (n_course_id, n_role, n_title, n_msg, n_link, n_type, NOW() + n_expires_in);
END;
$$ LANGUAGE plpgsql;

-- 7. Triggers
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
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'tr_live_class_event') THEN
        CREATE TRIGGER tr_live_class_event AFTER INSERT OR UPDATE ON live_classes FOR EACH ROW EXECUTE PROCEDURE tr_notify_live_class();
    END IF;
END $$;

CREATE OR REPLACE FUNCTION tr_notify_assignment() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published')) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'New Assignment', 'A new assignment "' || NEW.title || '" has been published.', '/student?page=assignments', 'assignment_published', INTERVAL '14 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'tr_assignment_published') THEN
        CREATE TRIGGER tr_assignment_published AFTER INSERT OR UPDATE ON assignments FOR EACH ROW EXECUTE PROCEDURE tr_notify_assignment();
    END IF;
END $$;

CREATE OR REPLACE FUNCTION tr_notify_quiz() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published')) THEN
    PERFORM broadcast_data(NEW.course_id, 'student', 'New Quiz Available', 'A new quiz "' || NEW.title || '" has been published.', '/student?page=quizzes', 'quiz_published', INTERVAL '14 days');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'tr_quiz_published') THEN
        CREATE TRIGGER tr_quiz_published AFTER INSERT OR UPDATE ON quizzes FOR EACH ROW EXECUTE PROCEDURE tr_notify_quiz();
    END IF;
END $$;

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
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'tr_submission_received') THEN
        CREATE TRIGGER tr_submission_received AFTER INSERT OR UPDATE ON submissions FOR EACH ROW EXECUTE PROCEDURE tr_notify_submission();
    END IF;
END $$;

CREATE OR REPLACE FUNCTION tr_notify_grade() RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.status = 'graded' AND (OLD.status IS NULL OR OLD.status != 'graded')) THEN
    PERFORM notify_user(NEW.student_id, 'Assignment Graded', 'Your assignment has been graded. Score: ' || NEW.final_grade || '%', '/student?page=assignments', 'grade_posted');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'tr_grade_posted') THEN
        CREATE TRIGGER tr_grade_posted AFTER INSERT OR UPDATE ON submissions FOR EACH ROW EXECUTE PROCEDURE tr_notify_grade();
    END IF;
END $$;

-- 8. Storage Buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('lms-files', 'lms-files', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Storage Policies
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

-- 10. RLS & Permissions
-- Enable RLS on all data tables
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
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE planner ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Utility function to get current user's email from session/header
-- Since we use custom auth, we will set a configuration parameter 'app.user_id'
-- or expect it to be passed via a custom header which PostgREST maps to settings.
CREATE OR REPLACE FUNCTION current_app_user() RETURNS UUID AS $$
  SELECT id FROM users WHERE email = current_setting('request.headers', true)::json->>'x-user-email';
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_app_role() RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Use SECURITY DEFINER to bypass RLS when checking role
  SELECT role INTO v_role FROM users WHERE id = current_app_user();
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Security Definer Functions to break RLS recursion
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

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = current_app_user() OR current_app_role() = 'admin');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (id = current_app_user() OR current_app_role() = 'admin');
-- Policy removed for security -- For login/existence check
CREATE POLICY "Admins can manage all users" ON users FOR ALL USING (current_app_role() = 'admin');

-- Courses policies
CREATE POLICY "Anyone can view published courses" ON courses FOR SELECT USING (status = 'published');
CREATE POLICY "Teachers can manage own courses" ON courses FOR ALL USING (teacher_id = current_app_user() OR current_app_role() = 'admin');
CREATE POLICY "Students can view courses they are enrolled in" ON courses FOR SELECT USING (check_is_enrolled(id));

-- Lessons policies
CREATE POLICY "Enrolled students can view lessons" ON lessons FOR SELECT USING (
  check_is_enrolled(course_id) OR check_is_course_teacher(course_id) OR
  EXISTS (SELECT 1 FROM courses WHERE id = lessons.course_id AND status = 'published')
);
CREATE POLICY "Teachers manage own course lessons" ON lessons FOR ALL USING (
  check_is_course_teacher(course_id) OR current_app_role() = 'admin'
);

-- Enrollments policies
CREATE POLICY "Users view own enrollments" ON enrollments FOR SELECT USING (student_id = current_app_user());
CREATE POLICY "Teachers view course enrollments" ON enrollments FOR SELECT USING (check_is_course_teacher(course_id));
CREATE POLICY "Students can enroll themselves" ON enrollments FOR INSERT WITH CHECK (student_id = current_app_user());
CREATE POLICY "Admins manage enrollments" ON enrollments FOR ALL USING (current_app_role() = 'admin');

-- Assignments policies
CREATE POLICY "Students view published assignments for enrolled courses" ON assignments FOR SELECT USING (
  status = 'published' AND EXISTS (SELECT 1 FROM enrollments WHERE course_id = assignments.course_id AND student_id = current_app_user())
);
CREATE POLICY "Teachers manage own assignments" ON assignments FOR ALL USING (teacher_id = current_app_user() OR current_app_role() = 'admin');

-- Security Definer helper for assignment course check
CREATE OR REPLACE FUNCTION check_assignment_course_teacher(p_assignment_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM assignments a
    JOIN courses c ON a.course_id = c.id
    WHERE a.id = p_assignment_id AND c.teacher_id = current_app_user()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Submissions policies
CREATE POLICY "Students manage own submissions" ON submissions FOR ALL USING (student_id = current_app_user());
CREATE POLICY "Teachers view and grade submissions for own courses" ON submissions FOR ALL USING (
  check_assignment_course_teacher(assignment_id) OR current_app_role() = 'admin'
);

-- Live Classes policies
CREATE POLICY "Enrolled students view live classes" ON live_classes FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments WHERE course_id = live_classes.course_id AND student_id = current_app_user())
);
CREATE POLICY "Teachers manage own live classes" ON live_classes FOR ALL USING (teacher_id = current_app_user() OR current_app_role() = 'admin');

-- Attendance policies
CREATE POLICY "Students mark own attendance" ON attendance FOR ALL USING (student_id = current_app_user());
CREATE POLICY "Teachers view attendance for own classes" ON attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM live_classes WHERE id = attendance.live_class_id AND teacher_id = current_app_user())
);

-- Quizzes policies
CREATE POLICY "Students view published quizzes for enrolled courses" ON quizzes FOR SELECT USING (
  status = 'published' AND EXISTS (SELECT 1 FROM enrollments WHERE course_id = quizzes.course_id AND student_id = current_app_user())
);
CREATE POLICY "Teachers manage own quizzes" ON quizzes FOR ALL USING (teacher_id = current_app_user() OR current_app_role() = 'admin');

-- Quiz Submissions policies
CREATE POLICY "Students manage own quiz submissions" ON quiz_submissions FOR ALL USING (student_id = current_app_user());
CREATE POLICY "Teachers view quiz submissions for own courses" ON quiz_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM quizzes WHERE id = quiz_submissions.quiz_id AND teacher_id = current_app_user())
);

-- Materials policies
CREATE POLICY "Enrolled students view materials" ON materials FOR SELECT USING (
  EXISTS (SELECT 1 FROM enrollments WHERE course_id = materials.course_id AND student_id = current_app_user())
);
CREATE POLICY "Teachers manage own materials" ON materials FOR ALL USING (teacher_id = current_app_user() OR current_app_role() = 'admin');

-- Discussions policies
CREATE POLICY "Enrolled students and teachers view/post discussions" ON discussions FOR ALL USING (
  EXISTS (SELECT 1 FROM enrollments WHERE course_id = discussions.course_id AND student_id = current_app_user()) OR
  EXISTS (SELECT 1 FROM courses WHERE id = discussions.course_id AND teacher_id = current_app_user()) OR
  current_app_role() = 'admin'
);

-- Notifications policies
CREATE POLICY "Users manage own notifications" ON notifications FOR ALL USING (user_id = current_app_user());

-- Broadcasts policies
CREATE POLICY "Anyone can view relevant broadcasts" ON broadcasts FOR SELECT USING (
  target_role IS NULL OR target_role = current_app_role() OR current_app_role() = 'admin'
);
CREATE POLICY "Admins manage broadcasts" ON broadcasts FOR ALL USING (current_app_role() = 'admin');

-- Maintenance policies
CREATE POLICY "Anyone can view maintenance status" ON maintenance FOR SELECT USING (true);
CREATE POLICY "Admins manage maintenance" ON maintenance FOR ALL USING (current_app_role() = 'admin');

-- Planner policies
CREATE POLICY "Users manage own planner" ON planner FOR ALL USING (user_id = current_app_user());

-- Certificates policies
CREATE POLICY "Users view own certificates" ON certificates FOR SELECT USING (student_id = current_app_user());
CREATE POLICY "Teachers/Admins manage certificates" ON certificates FOR ALL USING (current_app_role() IN ('teacher', 'admin'));

-- Badges policies
CREATE POLICY "Anyone can view badges" ON badges FOR SELECT USING (true);
CREATE POLICY "Admins manage badges" ON badges FOR ALL USING (current_app_role() = 'admin');

-- User Badges policies
CREATE POLICY "Anyone can view user badges" ON user_badges FOR SELECT USING (true);
CREATE POLICY "System/Admins manage user badges" ON user_badges FOR ALL USING (current_app_role() = 'admin');

-- Study Sessions policies
CREATE POLICY "Users manage own study sessions" ON study_sessions FOR ALL USING (user_id = current_app_user());

-- Lesson Completions policies
CREATE POLICY "Users manage own lesson completions" ON lesson_completions FOR ALL USING (student_id = current_app_user());

-- System Logs policies
CREATE POLICY "Users can create logs" ON system_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all logs" ON system_logs FOR SELECT USING (current_app_role() = 'admin');

-- General permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, postgres, service_role;

-- 11. Initial Data
INSERT INTO maintenance (enabled, schedules)
SELECT false, '[]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM maintenance);
