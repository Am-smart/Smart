"use server";

import { supabase, withSession } from './supabase';
import { getSession } from './auth-actions';
import { revalidatePath } from 'next/cache';
import { Submission, QuizSubmission } from './types';

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

// 5. Quiz Submission
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
