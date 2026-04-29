import { AssignmentRepository } from '../repositories/assignment.repository';
import { QuizRepository } from '../repositories/quiz.repository';
import { SubmissionRepository } from '../repositories/submission.repository';
import { QuizSubmissionRepository } from '../repositories/quiz-submission.repository';
import { Assignment, Quiz, Submission, QuizSubmission, User, QuizQuestion } from '../types';
import { AssessmentDomain } from '../domain/assessment.domain';

export class AssessmentService {
  private assignmentRepo = new AssignmentRepository();
  private quizRepo = new QuizRepository();
  private submissionRepo = new SubmissionRepository();
  private quizSubmissionRepo = new QuizSubmissionRepository();

  // Assignments
  async getAssignments(teacherId?: string, courseId?: string, sessionId?: string): Promise<Assignment[]> {
    return this.assignmentRepo.findAll(teacherId, courseId, sessionId);
  }

  async saveAssignment(currentUser: User, assignment: Partial<Assignment>, sessionId: string): Promise<Assignment> {
    const assignmentToSave = AssessmentDomain.prepareAssignment(assignment, currentUser.id);
    return this.assignmentRepo.upsert(assignmentToSave, sessionId);
  }

  async deleteAssignment(assignmentId: string, sessionId: string): Promise<void> {
    await this.assignmentRepo.delete(assignmentId, sessionId);
  }

  // Quizzes
  async getQuizzes(courseId?: string, teacherId?: string, sessionId?: string): Promise<Quiz[]> {
    return this.quizRepo.findAll(courseId, teacherId, sessionId);
  }

  async saveQuiz(currentUser: User, quiz: Partial<Quiz>, sessionId: string): Promise<Quiz> {
    const quizToSave = AssessmentDomain.prepareQuiz(quiz, currentUser.id);
    return this.quizRepo.upsert(quizToSave, sessionId);
  }

  async deleteQuiz(quizId: string, sessionId: string): Promise<void> {
    await this.quizRepo.delete(quizId, sessionId);
  }

  // Submissions
  async getSubmissions(assignmentId?: string, studentId?: string, sessionId?: string): Promise<Submission[]> {
    return this.submissionRepo.findAll(assignmentId, studentId, sessionId);
  }

  async submitAssignment(studentId: string, assignmentId: string, content: Partial<Submission>, sessionId: string): Promise<Submission> {
    const submissionToSave = AssessmentDomain.prepareSubmission(studentId, assignmentId, content);
    return this.submissionRepo.upsert(submissionToSave, sessionId);
  }

  async gradeSubmission(submissionId: string, gradeData: Partial<Submission>, sessionId: string): Promise<Submission> {
    const { assignments: _assignments, users: _users, ...rest } = gradeData as Record<string, unknown>;
    return this.submissionRepo.upsert({
      ...rest,
      id: submissionId,
      status: 'graded',
      graded_at: new Date().toISOString(),
    } as Partial<Submission>, sessionId);
  }

  // Quiz Submissions
  async getQuizSubmissions(quizId?: string, studentId?: string, sessionId?: string): Promise<QuizSubmission[]> {
    return this.quizSubmissionRepo.findAll(quizId, studentId, sessionId);
  }

  async submitQuiz(studentId: string, quizId: string, submissionData: Partial<QuizSubmission>, sessionId: string): Promise<{ success: boolean, score: number }> {
    const quiz = await this.quizRepo.findById(quizId, sessionId);
    if (!quiz) throw new Error('Quiz not found');

    const existingSubmissions = await this.quizSubmissionRepo.findAttempts(quizId, studentId, sessionId);
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

    await this.quizSubmissionRepo.insert(submissionToSave, sessionId);

    return { success: true, score: calculatedScore };
  }
}

export const assessmentService = new AssessmentService();
