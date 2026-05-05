import { assessmentDb } from '../database/assessment.db';
import { systemService } from './system.service';
import { Assignment, Quiz, Submission, QuizSubmission, QuizQuestion } from '../types';
import { AssessmentDomain } from '../domain/assessment.domain';
import { SUBMISSION_STATUS } from '../constants';
import { NotFoundError } from '../api-error';

export class AssessmentService {
  // Assignments
  async saveAssignment(teacherId: string, assignment: Partial<Assignment>, sessionId: string): Promise<Assignment> {
    const assignmentToSave = AssessmentDomain.prepareAssignment(assignment, teacherId);
    return assessmentDb.upsertAssignment(assignmentToSave, sessionId);
  }

  // Quizzes

  async saveQuiz(teacherId: string, quiz: Partial<Quiz>, sessionId: string): Promise<Quiz> {
    const quizToSave = AssessmentDomain.prepareQuiz(quiz, teacherId);
    return assessmentDb.upsertQuiz(quizToSave, sessionId);
  }

  // Submissions

  async submitAssignment(studentId: string, assignmentId: string, content: Partial<Submission>, sessionId: string): Promise<Submission> {
    const submissionToSave = AssessmentDomain.prepareSubmission(studentId, assignmentId, content);
    return assessmentDb.upsertSubmission(submissionToSave, sessionId);
  }

  async gradeSubmission(submissionId: string, gradeData: Partial<Submission>, sessionId: string): Promise<Submission> {
    const submission = await assessmentDb.findSubmissionById(submissionId, sessionId);
    if (!submission) throw new NotFoundError('Submission not found');

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
