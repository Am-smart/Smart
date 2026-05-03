import { assessmentDb } from '../database/assessment.db';
import { Assignment, Quiz, Submission, QuizSubmission, User, QuizQuestion } from '../types';
import { AssessmentDomain } from '../domain/assessment.domain';
import { SUBMISSION_STATUS } from '../constants';

export class AssessmentService {
  // Assignments
  async getAssignments(teacherId?: string, courseId?: string, sessionId?: string): Promise<Assignment[]> {
    return assessmentDb.findAllAssignments(teacherId, courseId, sessionId);
  }

  async saveAssignment(currentUser: User, assignment: Partial<Assignment>, sessionId: string): Promise<Assignment> {
    const assignmentToSave = AssessmentDomain.prepareAssignment(assignment, currentUser.id);
    return assessmentDb.upsertAssignment(assignmentToSave, sessionId);
  }

  async deleteAssignment(assignmentId: string, sessionId: string): Promise<void> {
    await assessmentDb.deleteAssignment(assignmentId, sessionId);
  }

  // Quizzes
  async getQuizzes(courseId?: string, teacherId?: string, sessionId?: string): Promise<Quiz[]> {
    return assessmentDb.findAllQuizzes(courseId, teacherId, sessionId);
  }

  async saveQuiz(currentUser: User, quiz: Partial<Quiz>, sessionId: string): Promise<Quiz> {
    const quizToSave = AssessmentDomain.prepareQuiz(quiz, currentUser.id);
    return assessmentDb.upsertQuiz(quizToSave, sessionId);
  }

  async deleteQuiz(quizId: string, sessionId: string): Promise<void> {
    await assessmentDb.deleteQuiz(quizId, sessionId);
  }

  // Submissions
  async getSubmissions(assignmentId?: string, studentId?: string, sessionId?: string): Promise<Submission[]> {
    return assessmentDb.findAllSubmissions(assignmentId, studentId, sessionId);
  }

  async submitAssignment(studentId: string, assignmentId: string, content: Partial<Submission>, sessionId: string): Promise<Submission> {
    const submissionToSave = AssessmentDomain.prepareSubmission(studentId, assignmentId, content);
    return assessmentDb.upsertSubmission(submissionToSave, sessionId);
  }

  async gradeSubmission(submissionId: string, gradeData: Partial<Submission>, sessionId: string): Promise<Submission> {
    const { assignments: _assignments, users: _users, ...rest } = gradeData as Record<string, unknown>;
    return assessmentDb.upsertSubmission({
      ...rest,
      id: submissionId,
      status: SUBMISSION_STATUS.GRADED,
      graded_at: new Date().toISOString(),
    } as Partial<Submission>, sessionId);
  }

  // Quiz Submissions
  async getQuizSubmissions(quizId?: string, studentId?: string, sessionId?: string): Promise<QuizSubmission[]> {
    return assessmentDb.findAllQuizSubmissions(quizId, studentId, sessionId);
  }

  async submitQuiz(studentId: string, quizId: string, submissionData: Partial<QuizSubmission>, sessionId: string): Promise<{ success: boolean, score: number }> {
    const quiz = await assessmentDb.findQuizById(quizId, sessionId);
    if (!quiz) throw new Error('Quiz not found');

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
