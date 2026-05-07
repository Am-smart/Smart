import { withHandler } from '@/app/api/api-utils';
import { assessmentService } from '@/lib/services/assessment.service';
import { AssessmentMapper } from '@/lib/mappers';
import { rbac } from '@/lib/auth/rbac';
import { AssessmentDomain } from '@/lib/domain/assessment.domain';
import { sanitizeObject } from '@/lib/validation';
import { UnauthorizedError } from '@/lib/api-error';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'assignments': {
      const teacherId = searchParams.get('teacherId') || undefined;
      const courseId = searchParams.get('courseId') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
      const assignments = await assessmentService.getAssignments(teacherId, courseId, user.sessionId!, limit, offset, user.id, user.role);
      return assignments.map(AssessmentMapper.toAssignmentDTO);
    }
    case 'quizzes': {
      const courseId = searchParams.get('courseId') || undefined;
      const teacherId = searchParams.get('teacherId') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
      const quizzes = await assessmentService.getQuizzes(courseId, teacherId, user.sessionId!, limit, offset, user.id, user.role);
      return quizzes.map(AssessmentMapper.toQuizDTO);
    }
    case 'submissions': {
      const assignmentId = searchParams.get('assignmentId') || undefined;
      const studentId = searchParams.get('studentId') || undefined;
      const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
      const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;
      const submissions = await assessmentService.getSubmissions(assignmentId, studentId, user.sessionId!, limit, offset, user.id, user.role);
      return submissions.map(AssessmentMapper.toSubmissionDTO);
    }
    default:
      throw new Error('Invalid GET action');
  }
});

export const POST = withHandler(async (user, request) => {
  const rawBody = await request.json();
  const body = sanitizeObject(rawBody);
  const { action, ...data } = body;

  switch (action) {
    case 'save-assignment': {
      if (!rbac.can(user, 'assignment:manage')) throw new UnauthorizedError();
      const sanitized = AssessmentDomain.sanitizeEntity(data);
      const assignment = await assessmentService.saveAssignment(user.id, sanitized, user.sessionId!, user);
      return AssessmentMapper.toAssignmentDTO(assignment);
    }
    case 'submit-assignment': {
      if (!rbac.can(user, 'assignment:submit')) throw new UnauthorizedError();
      const { assignmentId, ...content } = data;
      if (!assignmentId) throw new Error('assignmentId is required');
      AssessmentDomain.validateSubmission(content);
      const submission = await assessmentService.submitAssignment(user.id, assignmentId, content, user.sessionId!);
      return AssessmentMapper.toSubmissionDTO(submission);
    }
    case 'save-quiz': {
      if (!rbac.can(user, 'quiz:manage')) throw new UnauthorizedError();
      const sanitized = AssessmentDomain.sanitizeEntity(data);
      const quiz = await assessmentService.saveQuiz(user.id, sanitized, user.sessionId!, user);
      return AssessmentMapper.toQuizDTO(quiz);
    }
    case 'submit-quiz': {
      if (!rbac.can(user, 'quiz:take')) throw new UnauthorizedError();
      const { quizId, ...content } = data;
      if (!quizId) throw new Error('quizId is required');
      return await assessmentService.submitQuiz(user.id, quizId, content, user.sessionId!);
    }
    default:
      throw new Error('Invalid POST action');
  }
});

export const DELETE = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');

  if (!id) throw new Error('id is required');

  switch (action) {
    case 'assignment': {
      if (!rbac.can(user, 'assignment:manage')) throw new UnauthorizedError();
      await assessmentService.deleteAssignment(id, user.sessionId!, user);
      return { success: true };
    }
    case 'quiz': {
      if (!rbac.can(user, 'quiz:manage')) throw new UnauthorizedError();
      await assessmentService.deleteQuiz(id, user.sessionId!, user);
      return { success: true };
    }
    default:
      throw new Error('Invalid DELETE action');
  }
});

export const PATCH = withHandler(async (user, request) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const id = searchParams.get('id');
    const rawBody = await request.json();
    const body = sanitizeObject(rawBody);

    if (!id) throw new Error('id is required');

    switch (action) {
        case 'grade-submission': {
            if (!rbac.can(user, 'assignment:grade')) throw new UnauthorizedError();
            if (body.grade !== undefined && (body.grade < 0 || body.grade > 100)) {
                throw new Error('Grade must be between 0 and 100');
            }
            await assessmentService.gradeSubmission(id, body, user.sessionId!, user.id, user.role);
            return { success: true };
        }
        default:
            throw new Error('Invalid PATCH action');
    }
});
