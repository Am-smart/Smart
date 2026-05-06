import { assessmentDb } from '../database/assessment.db';
import { systemService } from './system.service';
import { Assignment, Quiz, Submission, QuizSubmission, QuizQuestion } from '../types';
import { AssessmentDomain } from '../domain/assessment.domain';
import { SUBMISSION_STATUS } from '../constants';
import { NotFoundError, ForbiddenError } from '../api-error';

export class AssessmentService {
  // Assignments
  async getAssignments(teacherId?: string, courseId?: string, sessionId?: string, limit?: number, offset?: number, userId?: string, userRole?: string): Promise<Assignment[]> {
    if (userRole === 'student' && userId) {
        const enrollments = await systemService.getStudentEnrollments(userId, sessionId!);
        const enrolledCourseIds = enrollments.map(e => e.course_id);

        if (courseId && !enrolledCourseIds.includes(courseId)) {
            return [];
        }

        const assignments = await assessmentDb.findAllAssignments(teacherId, courseId, sessionId!, limit, offset);
        return assignments.filter(a => enrolledCourseIds.includes(a.course_id));
    }
    return assessmentDb.findAllAssignments(teacherId, courseId, sessionId!, limit, offset);
  }

  async saveAssignment(teacherId: string, assignment: Partial<Assignment>, sessionId: string): Promise<Assignment> {
    const assignmentToSave = AssessmentDomain.prepareAssignment(assignment, teacherId);
    return assessmentDb.upsertAssignment(assignmentToSave, sessionId);
  }

  async deleteAssignment(id: string, sessionId: string): Promise<void> {
    await assessmentDb.deleteAssignment(id, sessionId);
  }

  // Quizzes
  async getQuizzes(courseId?: string, teacherId?: string, sessionId?: string, limit?: number, offset?: number, userId?: string, userRole?: string): Promise<Quiz[]> {
    if (userRole === 'student' && userId) {
        const enrollments = await systemService.getStudentEnrollments(userId, sessionId!);
        const enrolledCourseIds = enrollments.map(e => e.course_id);

        if (courseId && !enrolledCourseIds.includes(courseId)) {
            return [];
        }

        const quizzes = await assessmentDb.findAllQuizzes(courseId, teacherId, sessionId!, limit, offset);
        return quizzes.filter(q => enrolledCourseIds.includes(q.course_id));
    }
    return assessmentDb.findAllQuizzes(courseId, teacherId, sessionId!, limit, offset);
  }

  async saveQuiz(teacherId: string, quiz: Partial<Quiz>, sessionId: string): Promise<Quiz> {
    const quizToSave = AssessmentDomain.prepareQuiz(quiz, teacherId);
    return assessmentDb.upsertQuiz(quizToSave, sessionId);
  }

  async deleteQuiz(id: string, sessionId: string): Promise<void> {
    await assessmentDb.deleteQuiz(id, sessionId);
  }

  // Submissions
  async getSubmissions(assignmentId?: string, studentId?: string, sessionId?: string, limit?: number, offset?: number, userId?: string, userRole?: string): Promise<Submission[]> {
    if (userRole === 'student' && userId) {
        // Students can only see their own submissions
        return assessmentDb.findAllSubmissions(assignmentId, userId, sessionId!, limit, offset);
    }

    const submissions = await assessmentDb.findAllSubmissions(assignmentId, studentId, sessionId!, limit, offset);

    if (userRole === 'teacher' && userId) {
        // Teachers can only see submissions for assignments they own
        return submissions.filter(s => s.assignments?.teacher_id === userId);
    }

    return submissions;
  }

  async submitAssignment(studentId: string, assignmentId: string, content: Partial<Submission>, sessionId: string): Promise<Submission> {
    const submissionToSave = AssessmentDomain.prepareSubmission(studentId, assignmentId, content);
    return assessmentDb.upsertSubmission(submissionToSave, sessionId);
  }

  async gradeSubmission(submissionId: string, gradeData: Partial<Submission>, sessionId: string, performingUserId?: string, performingUserRole?: string): Promise<Submission> {
    const submission = await assessmentDb.findSubmissionById(submissionId, sessionId);
    if (!submission) throw new NotFoundError('Submission not found');

    // Authorization check: Teachers can only grade submissions for their own assignments
    if (performingUserRole === 'teacher' && performingUserId) {
        if (submission.assignments?.teacher_id !== performingUserId) {
            throw new ForbiddenError('You are not authorized to grade this submission');
        }
    }

    const { assignments: _assignments, users: _users, ...rest } = gradeData as Record<string, unknown>;
    const updated = await assessmentDb.upsertSubmission({
      ...rest,
      id: submissionId,
      status: SUBMISSION_STATUS.GRADED,
      graded_at: new Date().toISOString(),
    } as Partial<Submission>, sessionId);

    // Notify student
    try {
        await systemService.notifyUser({
            target_id: submission.student_id,
            n_title: 'Assignment Graded',
            n_msg: `Your submission for "${submission.assignments?.title || 'an assignment'}" has been graded.`,
            n_link: `assignment:${submission.assignment_id}`,
            n_type: 'grading'
        }, sessionId);
    } catch (error) {
        console.error('Failed to send grading notification:', error);
    }

    return updated;
  }

  // Quiz Submissions
  async getQuizSubmissions(quizId?: string, studentId?: string, sessionId?: string): Promise<QuizSubmission[]> {
    return assessmentDb.findAllQuizSubmissions(quizId, studentId, sessionId!);
  }

  async findQuizAttempts(quizId: string, studentId: string, sessionId: string): Promise<QuizSubmission[]> {
    return assessmentDb.findQuizAttempts(quizId, studentId, sessionId);
  }

  async submitQuiz(studentId: string, quizId: string, submissionData: Partial<QuizSubmission>, sessionId: string): Promise<{ success: boolean, score: number }> {
    const quiz = await assessmentDb.findQuizById(quizId, sessionId);
    if (!quiz) throw new NotFoundError('Quiz not found');

    const existingSubmissions = await assessmentDb.findQuizAttempts(quizId, studentId, sessionId);
    const currentAttempts = existingSubmissions.length;

    AssessmentDomain.validateQuizAttempt(quiz, currentAttempts);

    const nextAttempt = currentAttempts + 1;
    const answers = (submissionData.answers as Record<string, string>) || {};
    const questions = (quiz.questions as QuizQuestion[]) || [];

    const { score: calculatedScore, totalPoints } = AssessmentDomain.calculateQuizScore(questions, answers);

    const submissionToSave = AssessmentDomain.prepareQuizSubmission(
      studentId,
      quizId,
      nextAttempt,
      calculatedScore,
      totalPoints,
      submissionData
    );

    await assessmentDb.insertQuizSubmission(submissionToSave, sessionId);

    return { success: true, score: calculatedScore };
  }
}

export const assessmentService = new AssessmentService();
