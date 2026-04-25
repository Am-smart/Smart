import { assessmentService } from '../services/assessment.service';
import { AssessmentMapper } from '../mappers/domain-to-dto.mapper';
import { rbac } from '../auth/rbac';
import { User, Assignment, Quiz, Submission, QuizSubmission } from '../types';
import { AssignmentDTO, QuizDTO, SubmissionDTO, QuizSubmissionDTO } from '../dto/assessment.dto';

export class AssessmentController {
  async getAssignments(user: User, teacherId?: string, courseId?: string): Promise<AssignmentDTO[]> {
    const assignments = await assessmentService.getAssignments(teacherId, courseId, user.sessionId);
    return assignments.map(AssessmentMapper.toAssignmentDTO);
  }

  async saveAssignment(user: User, data: Partial<Assignment>): Promise<AssignmentDTO> {
    if (!rbac.can(user, 'assignment:manage')) throw new Error('Unauthorized');
    const assignment = await assessmentService.saveAssignment(user, data, user.sessionId);
    return AssessmentMapper.toAssignmentDTO(assignment);
  }

  async submitAssignment(user: User, assignmentId: string, content: Partial<Submission>): Promise<SubmissionDTO> {
    if (!rbac.can(user, 'assignment:submit')) throw new Error('Unauthorized');
    const submission = await assessmentService.submitAssignment(user.id, assignmentId, content, user.sessionId);
    return AssessmentMapper.toSubmissionDTO(submission);
  }

  async getQuizzes(user: User, courseId?: string, teacherId?: string): Promise<QuizDTO[]> {
    const quizzes = await assessmentService.getQuizzes(courseId, teacherId, user.sessionId);
    return quizzes.map(AssessmentMapper.toQuizDTO);
  }

  async saveQuiz(user: User, data: Partial<Quiz>): Promise<QuizDTO> {
    if (!rbac.can(user, 'quiz:manage')) throw new Error('Unauthorized');
    const quiz = await assessmentService.saveQuiz(user, data, user.sessionId);
    return AssessmentMapper.toQuizDTO(quiz);
  }

  async submitQuiz(user: User, quizId: string, data: Partial<QuizSubmission>): Promise<{ score: number }> {
    if (!rbac.can(user, 'quiz:take')) throw new Error('Unauthorized');
    const result = await assessmentService.submitQuiz(user.id, quizId, data, user.sessionId);
    return { score: result.score };
  }

  async getSubmissions(user: User, assignmentId?: string, studentId?: string): Promise<SubmissionDTO[]> {
    const submissions = await assessmentService.getSubmissions(assignmentId, studentId, user.sessionId);
    return submissions.map(AssessmentMapper.toSubmissionDTO);
  }

  async gradeSubmission(user: User, submissionId: string, gradeData: Partial<Submission>): Promise<void> {
    if (!rbac.can(user, 'assignment:grade')) throw new Error('Unauthorized');
    await assessmentService.gradeSubmission(submissionId, gradeData, user.sessionId);
  }
}

export const assessmentController = new AssessmentController();
