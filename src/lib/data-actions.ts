"use server";

import { supabase } from './supabase';
import { getSession } from './auth-actions';
import { revalidatePath } from 'next/cache';
import { Submission, QuizSubmission } from './types';

async function getVerifiedUser() {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

// 1. Enrollment Actions
export async function enrollInCourse(courseId: string) {
  const user = await getVerifiedUser();
  const { error } = await supabase
    .from('enrollments')
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
  const { error } = await supabase
    .from('submissions')
    .insert([{
      assignment_id: assignmentId,
      student_id: user.id,
      ...content,
      submitted_at: new Date().toISOString(),
      status: 'pending'
    }]);

  if (error) throw new Error(error.message);
  revalidatePath('/student/assignments');
  return { success: true };
}

// 3. Teacher Actions: Grading
export async function gradeSubmission(submissionId: string, gradeData: { score: number; feedback: string }) {
  const user = await getVerifiedUser();
  if (user.role !== 'teacher' && user.role !== 'admin') throw new Error('Forbidden');

  const { error } = await supabase
    .from('submissions')
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

  const { error } = await supabase
    .from('users')
    .update({ active })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/users');
  return { success: true };
}

// 5. Quiz Submission
export async function submitQuiz(quizId: string, submissionData: Partial<QuizSubmission>) {
    const user = await getVerifiedUser();
    const { error } = await supabase
      .from('quiz_submissions')
      .insert([{
        quiz_id: quizId,
        student_id: user.id,
        ...submissionData,
        submitted_at: new Date().toISOString()
      }]);

    if (error) throw new Error(error.message);
    revalidatePath('/student/quizzes');
    return { success: true };
}
