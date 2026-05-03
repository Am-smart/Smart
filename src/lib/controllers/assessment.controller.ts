import { assessmentService } from '../services/assessment.service';
import { AssessmentMapper } from '../mappers';
import { rbac } from '../auth/rbac';
import { User, Assignment, Quiz, Submission, QuizSubmission } from '../types';
import { AssignmentDTO, QuizDTO, SubmissionDTO, QuizSubmissionDTO } from '../types';
import { AssessmentDomain } from '../domain/assessment.domain';

export class AssessmentController {
  async getAssignments(user: User, teacherId?: string, courseId?: string): Promise<AssignmentDTO[]> {
    // Invariants check could go here if needed, but simple fetches are fine
    const assignments = await assessmentService.getAssignments(teacherId, courseId, user.sessionId);
    return assignments.map(AssessmentMapper.toAssignmentDTO);
  }

  async saveAssignment(user: User, data: Partial<Assignment>): Promise<AssignmentDTO> {
    if (!rbac.can(user, 'assignment:manage')) throw new Error('Unauthorized');

    // Domain logic: Sanitize and validate before service call
    const sanitized = AssessmentDomain.sanitizeEntity(data);
    const assignment = await assessmentService.saveAssignment(user, sanitized, user.sessionId);

    return AssessmentMapper.toAssignmentDTO(assignment);
  }

  async submitAssignment(user: User, assignmentId: string, content: Partial<Submission>): Promise<SubmissionDTO> {
    if (!rbac.can(user, 'assignment:submit')) throw new Error('Unauthorized');

    // Domain logic: validate submission invariants
    AssessmentDomain.validateSubmission(content);

    const submission = await assessmentService.submitAssignment(user.id, assignmentId, content, user.sessionId);
    return AssessmentMapper.toSubmissionDTO(submission);
  }

  async getQuizzes(user: User, courseId?: string, teacherId?: string): Promise<QuizDTO[]> {
    const quizzes = await assessmentService.getQuizzes(courseId, teacherId, user.sessionId);
    return quizzes.map(AssessmentMapper.toQuizDTO);
  }

  async saveQuiz(user: User, data: Partial<Quiz>): Promise<QuizDTO> {
    if (!rbac.can(user, 'quiz:manage')) throw new Error('Unauthorized');

    const sanitized = AssessmentDomain.sanitizeEntity(data);
    const quiz = await assessmentService.saveQuiz(user, sanitized, user.sessionId);

    return AssessmentMapper.toQuizDTO(quiz);
  }

  async submitQuiz(user: User, quizId: string, data: Partial<QuizSubmission>): Promise<{ score: number }> {
    if (!rbac.can(user, 'quiz:take')) throw new Error('Unauthorized');

    // Domain logic: check if attempt is allowed
    // Note: In a real system we'd fetch the quiz first to check attempts_allowed

    const result = await assessmentService.submitQuiz(user.id, quizId, data, user.sessionId);
    return { score: result.score };
  }

  async getSubmissions(user: User, assignmentId?: string, studentId?: string): Promise<SubmissionDTO[]> {
    const submissions = await assessmentService.getSubmissions(assignmentId, studentId, user.sessionId);
    return submissions.map(AssessmentMapper.toSubmissionDTO);
  }

  async getQuizSubmissions(user: User, quizId?: string, studentId?: string): Promise<QuizSubmissionDTO[]> {
    const submissions = await assessmentService.getQuizSubmissions(quizId, studentId, user.sessionId);
    return submissions.map(AssessmentMapper.toQuizSubmissionDTO);
  }

  async gradeSubmission(user: User, submissionId: string, gradeData: Partial<Submission>): Promise<void> {
    if (!rbac.can(user, 'assignment:grade')) throw new Error('Unauthorized');

    // Domain logic: validate grade range
    if (gradeData.grade !== undefined && (gradeData.grade < 0 || gradeData.grade > 100)) {
        throw new Error('Grade must be between 0 and 100');
    }

    await assessmentService.gradeSubmission(submissionId, gradeData, user.sessionId);
  }
}

export const assessmentController = new AssessmentController();
