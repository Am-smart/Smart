"use server";

import { supabase, withSession } from './supabase';
import { getSession } from './auth-actions';
import { revalidatePath } from 'next/cache';
import { Submission, QuizSubmission, Course, Lesson, Assignment, Quiz, PlannerItem, Discussion, StudySession, Material, User, Certificate, Badge, UserBadge, LiveClass, Maintenance } from './types';

async function getVerifiedUser() {
  const session = await getSession();
  if (!session || !session.sessionId) throw new Error('Unauthorized');
  return session;
}

// 1. Enrollment Actions
export async function enrollInCourse(courseId: string) {
  const user = await getVerifiedUser();
  const { error } = await withSession(supabase.from('enrollments'), user.sessionId as string)
    .upsert({
      course_id: courseId,
      student_id: user.id,
      enrolled_at: new Date().toISOString()
    });

  if (error) throw new Error(error.message);
  revalidatePath('/student/courses');
  return { success: true };
}

// 2. Submission Actions
export async function submitAssignment(assignmentId: string, content: Partial<Submission>) {
  const user = await getVerifiedUser();
  const { error } = await withSession(supabase.from('submissions'), user.sessionId as string)
    .insert([{
      assignment_id: assignmentId,
      student_id: user.id,
      ...content,
      submitted_at: new Date().toISOString(),
      status: 'submitted'
    }]);

  if (error) throw new Error(error.message);
  revalidatePath('/student/assignments');
  return { success: true };
}

// 3. Teacher Actions: Grading
export async function gradeSubmission(submissionId: string, gradeData: { score: number; feedback: string }) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  const { error } = await withSession(
    supabase.from('submissions'),
    user.sessionId as string
  )
    .update({
      ...gradeData,
      status: 'graded',
      graded_at: new Date().toISOString()
    })
    .eq('id', submissionId);

  if (error) throw new Error(error.message);
  revalidatePath('/teacher/grading');
  return { success: true };
}

// 4. Admin Actions: User Status
export async function toggleUserStatus(userId: string, active: boolean) {
  const user = await getVerifiedUser();
  if (user.role !== 'admin') throw new Error('Forbidden');

  const { error } = await withSession(
    supabase.from('users'),
    user.sessionId as string
  )
    .update({ active })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
  return { success: true };
}

// 5. Course Actions
export async function saveCourse(course: Partial<Course>) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  if (!course.title) throw new Error('Course title is required');

  const { data, error } = await withSession(supabase.from('courses'), user.sessionId as string)
    .upsert({
      ...course,
      teacher_id: course.teacher_id || user.id,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/teacher/courses');
  revalidatePath('/student/courses');
  return { success: true, data };
}

export async function deleteCourse(courseId: string) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  const { error } = await withSession(supabase.from('courses'), user.sessionId as string)
    .delete()
    .eq('id', courseId);

  if (error) throw new Error(error.message);
  revalidatePath('/teacher/courses');
  revalidatePath('/student/courses');
  return { success: true };
}

// 6. Lesson Actions
export async function saveLesson(lesson: Partial<Lesson>) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  if (!lesson.title) throw new Error('Lesson title is required');
  if (!lesson.course_id) throw new Error('Course ID is required');

  const { data, error } = await withSession(supabase.from('lessons'), user.sessionId as string)
    .upsert({
      ...lesson,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath(`/student/courses?id=${lesson.course_id}`);
  return { success: true, data };
}

export async function deleteLesson(lessonId: string, courseId: string) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  const { error } = await withSession(supabase.from('lessons'), user.sessionId as string)
    .delete()
    .eq('id', lessonId);

  if (error) throw new Error(error.message);
  revalidatePath(`/student/courses?id=${courseId}`);
  return { success: true };
}

// 7. Assignment Actions
export async function saveAssignment(assignment: Partial<Assignment>) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  if (!assignment.title) throw new Error('Assignment title is required');
  if (!assignment.course_id) throw new Error('Course ID is required');

  const { data, error } = await withSession(supabase.from('assignments'), user.sessionId as string)
    .upsert({
      ...assignment,
      teacher_id: assignment.teacher_id || user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/teacher/assignments');
  revalidatePath('/student/assignments');
  return { success: true, data };
}

export async function deleteAssignment(assignmentId: string) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  const { error } = await withSession(supabase.from('assignments'), user.sessionId as string)
    .delete()
    .eq('id', assignmentId);

  if (error) throw new Error(error.message);
  revalidatePath('/teacher/assignments');
  revalidatePath('/student/assignments');
  return { success: true };
}

// 8. Quiz Actions
export async function saveQuiz(quiz: Partial<Quiz>) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  if (!quiz.title) throw new Error('Quiz title is required');
  if (!quiz.course_id) throw new Error('Course ID is required');

  const { data, error } = await withSession(supabase.from('quizzes'), user.sessionId as string)
    .upsert({
      ...quiz,
      teacher_id: quiz.teacher_id || user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/teacher/quizzes');
  revalidatePath('/student/quizzes');
  return { success: true, data };
}

export async function deleteQuiz(quizId: string) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  const { error } = await withSession(supabase.from('quizzes'), user.sessionId as string)
    .delete()
    .eq('id', quizId);

  if (error) throw new Error(error.message);
  revalidatePath('/teacher/quizzes');
  revalidatePath('/student/quizzes');
  return { success: true };
}

// 9. Planner Actions
export async function savePlannerItem(item: Partial<PlannerItem>) {
  const user = await getVerifiedUser();
  const { data, error } = await withSession(supabase.from('planner'), user.sessionId as string)
    .upsert({
      ...item,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, data };
}

export async function deletePlannerItem(id: string) {
  const user = await getVerifiedUser();
  const { error } = await withSession(supabase.from('planner'), user.sessionId as string)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  return { success: true };
}

// 10. Discussion Actions
export async function saveDiscussionPost(post: Partial<Discussion>) {
  const user = await getVerifiedUser();
  const { data, error } = await withSession(supabase.from('discussions'), user.sessionId as string)
    .insert([{
      ...post,
      user_id: user.id
    }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { success: true, data };
}

export async function deleteDiscussionPost(id: string) {
  const user = await getVerifiedUser();
  const { error } = await withSession(supabase.from('discussions'), user.sessionId as string)
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
  return { success: true };
}

// 11. Study Session Actions
export async function saveStudySession(session: Partial<StudySession>, xpEarned?: number) {
    const user = await getVerifiedUser();
    const { error } = await withSession(supabase.from('study_sessions'), user.sessionId as string)
        .insert([{
            ...session,
            user_id: user.id
        }]);

    if (error) throw new Error(error.message);

    if (xpEarned && xpEarned > 0) {
        // Fetch current XP and level
        const { data: userData } = await withSession(supabase.from('users'), user.sessionId as string)
            .select('xp, level')
            .eq('id', user.id)
            .single();

        if (userData) {
            const newXp = (userData.xp || 0) + xpEarned;
            // Basic level logic: every 1000 XP is a level
            const newLevel = Math.floor(newXp / 1000) + 1;

            await withSession(supabase.from('users'), user.sessionId as string)
                .update({ xp: newXp, level: newLevel })
                .eq('id', user.id);
        }
    }

    return { success: true };
}

// 12. Regrade Request
export async function requestRegrade(assignmentId: string, reason: string) {
    const user = await getVerifiedUser();
    const { error } = await withSession(supabase.from('submissions'), user.sessionId as string)
        .update({
            regrade_request: reason,
            status: 'submitted'
        })
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id);

    if (error) throw new Error(error.message);
    revalidatePath('/student/assignments');
    revalidatePath('/teacher/grading');
    return { success: true };
}

// 13. Material Actions
export async function saveMaterial(material: Partial<Material>) {
    const user = await getVerifiedUser();
    if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

    const { data, error } = await withSession(supabase.from('materials'), user.sessionId as string)
        .upsert({
            ...material,
            teacher_id: material.teacher_id || user.id
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return { success: true, data };
}

export async function deleteMaterial(id: string) {
    const user = await getVerifiedUser();
    if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

    const { error } = await withSession(supabase.from('materials'), user.sessionId as string)
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
}

// 14. Student Management Actions
export async function removeEnrollment(courseId: string, studentId: string) {
    const user = await getVerifiedUser();
    if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

    const { error } = await withSession(supabase.from('enrollments'), user.sessionId as string)
        .delete()
        .eq('course_id', courseId)
        .eq('student_id', studentId);

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function issueCertificate(certificate: Partial<Certificate>) {
    const user = await getVerifiedUser();
    if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

    const { data, error } = await withSession(supabase.from('certificates'), user.sessionId as string)
        .insert([{
            ...certificate,
            issued_at: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return { success: true, data };
}

// 15. Badge Actions
export async function saveBadge(badge: Partial<Badge>) {
    const user = await getVerifiedUser();
    if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

    const { data, error } = await withSession(supabase.from('badges'), user.sessionId as string)
        .upsert(badge)
        .select()
        .single();

    if (error) throw new Error(error.message);
    return { success: true, data };
}

export async function deleteBadge(id: string) {
    const user = await getVerifiedUser();
    if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

    const { error } = await withSession(supabase.from('badges'), user.sessionId as string)
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function assignBadge(userBadge: Partial<UserBadge>) {
    const user = await getVerifiedUser();
    if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

    const { error } = await withSession(supabase.from('user_badges'), user.sessionId as string)
        .insert([{
            ...userBadge,
            awarded_at: new Date().toISOString()
        }]);

    if (error) throw new Error(error.message);
    return { success: true };
}

// 16. Live Class Actions
export async function saveLiveClass(liveClass: Partial<LiveClass>) {
    const user = await getVerifiedUser();
    if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

    const { data, error } = await withSession(supabase.from('live_classes'), user.sessionId as string)
        .upsert({
            ...liveClass,
            teacher_id: liveClass.teacher_id || user.id
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return { success: true, data };
}

export async function deleteLiveClass(id: string) {
    const user = await getVerifiedUser();
    if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

    const { error } = await withSession(supabase.from('live_classes'), user.sessionId as string)
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return { success: true };
}

// 17. Admin User & System Actions
export async function saveUser(userData: Partial<User>) {
    const user = await getVerifiedUser();
    // Users can update their own profile, or admins can update anyone
    if (user.role !== 'admin' && user.id !== userData.id) throw new Error('Forbidden');

    const { data, error } = await withSession(supabase.from('users'), user.sessionId as string)
        .update(userData)
        .eq('id', userData.id)
        .select()
        .single();

    if (error) throw new Error(error.message);
    revalidatePath('/admin/users');
    return { success: true, data };
}

export async function deleteUser(id: string) {
    const user = await getVerifiedUser();
    if (user.role !== 'admin') throw new Error('Forbidden');

    const { error } = await withSession(supabase.from('users'), user.sessionId as string)
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    revalidatePath('/admin/users');
    return { success: true };
}

export async function updateSetting(key: string, value: unknown) {
    const user = await getVerifiedUser();
    if (user.role !== 'admin') throw new Error('Forbidden');

    const { error } = await withSession(supabase, user.sessionId as string)
        .rpc('update_setting', {
            p_key: key,
            p_value: value
        });

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function updateMaintenance(maintenance: Partial<Maintenance>) {
    const user = await getVerifiedUser();
    if (user.role !== 'admin') throw new Error('Forbidden');

    const { error } = await withSession(supabase.from('maintenance'), user.sessionId as string)
        .update(maintenance)
        .eq('id', maintenance.id);

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function createBroadcast(broadcast: Record<string, unknown>) {
    const user = await getVerifiedUser();
    if (user.role !== 'admin') throw new Error('Forbidden');

    const { error } = await withSession(supabase.from('broadcasts'), user.sessionId as string)
        .insert([broadcast]);

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function createSystemLog(log: Record<string, unknown>) {
    const user = await getVerifiedUser();

    // System logs can be created by admins, or by users reporting anti-cheat violations
    const isAntiCheat = log.category === 'anti-cheat';
    if (user.role !== 'admin' && !isAntiCheat) throw new Error('Forbidden');

    const { error } = await withSession(supabase.from('system_logs'), user.sessionId as string)
        .insert([{
            ...log,
            user_id: log.user_id || user.id
        }]);

    if (error) throw new Error(error.message);
    return { success: true };
}

// 18. Quiz Submission
export async function submitQuiz(quizId: string, submissionData: Partial<QuizSubmission>) {
    const user = await getVerifiedUser();

    // Fetch quiz to validate and calculate score server-side
    const { data: quiz, error: quizError } = await withSession(
      supabase.from('quizzes'),
      user.sessionId as string
    )
      .select('questions, passing_score')
      .eq('id', quizId)
      .single();

    if (quizError || !quiz) throw new Error('Quiz not found');

    const answers = (submissionData.answers as Record<string, string>) || {};
    const questions = (quiz.questions as { id: string; correct_answer: string; points?: number }[]) || [];
    let correct = 0;

    questions.forEach((q) => {
        if (answers[q.id] === q.correct_answer) {
            correct++;
        }
    });

    const calculatedScore = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    const totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);

    const { error } = await withSession(
      supabase.from('quiz_submissions'),
      user.sessionId as string
    )
      .insert([{
        quiz_id: quizId,
        student_id: user.id,
        answers,
        score: calculatedScore,
        total_points: totalPoints,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        time_spent: submissionData.time_spent || 0,
        violation_count: submissionData.violation_count || 0,
        started_at: submissionData.started_at || new Date().toISOString()
      }]);

    if (error) throw new Error(error.message);
    revalidatePath('/student/quizzes');
    return { success: true, score: calculatedScore };
}

// Mark a notification as read (for deep linking)
export async function markNotificationAsRead(notificationId: string) {
  try {
    const user = await getVerifiedUser();
    const { error } = await withSession(supabase.from('notifications'), user.sessionId as string)
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    revalidatePath('/student');
    revalidatePath('/teacher');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error };
  }
}

// Mark all notifications as read
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const user = await getVerifiedUser();
    const { error } = await withSession(supabase.from('notifications'), user.sessionId as string)
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    revalidatePath('/student');
    revalidatePath('/teacher');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error };
  }
}

// Public function to check the count of teachers and admins (for signup form)
export async function getRoleCount(): Promise<{ teachers: number; admins: number; total: number }> {
  try {
    const { data, error } = await supabase.rpc('get_role_counts');

    if (error) {
      throw new Error(error.message);
    }

    return data as { teachers: number; admins: number; total: number };
  } catch (error) {
    console.error('Error fetching role count:', error);
    return { teachers: 0, admins: 0, total: 0 };
  }
}

export async function updateProfile(updates: Partial<User>) {
    const user = await getVerifiedUser();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return saveUser({ ...updates, id: user.id } as any);
}
