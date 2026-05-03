import { withHandler } from '@/app/api/api-utils';
import { assessmentService } from '@/lib/services/assessment.service';
import { AssessmentMapper } from '@/lib/mappers';
import { rbac } from '@/lib/auth/rbac';
import { AssessmentDomain } from '@/lib/domain/assessment.domain';

export const GET = withHandler(async (user, request) => {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'assignments': {
      const teacherId = searchParams.get('teacherId') || undefined;
      const courseId = searchParams.get('courseId') || undefined;
      const assignments = await assessmentService.getAssignments(teacherId, courseId, user.sessionId!);
      return assignments.map(AssessmentMapper.toAssignmentDTO);
    }
    case 'quizzes': {
      const courseId = searchParams.get('courseId') || undefined;
      const teacherId = searchParams.get('teacherId') || undefined;
      const quizzes = await assessmentService.getQuizzes(courseId, teacherId, user.sessionId!);
      return quizzes.map(AssessmentMapper.toQuizDTO);
    }
    case 'submissions': {
      const assignmentId = searchParams.get('assignmentId') || undefined;
      const studentId = searchParams.get('studentId') || undefined;
      const submissions = await assessmentService.getSubmissions(assignmentId, studentId, user.sessionId!);
      return submissions.map(AssessmentMapper.toSubmissionDTO);
    }
    default:
      throw new Error('Invalid GET action');
  }
});

export const POST = withHandler(async (user, request) => {
  const body = await request.json();
  const { action, ...data } = body;

  switch (action) {
    case 'save-assignment': {
      if (!rbac.can(user, 'assignment:manage')) throw new Error('Unauthorized');
      const sanitized = AssessmentDomain.sanitizeEntity(data);
      const assignment = await assessmentService.saveAssignment(user, sanitized, user.sessionId!);
      return AssessmentMapper.toAssignmentDTO(assignment);
    }
    case 'submit-assignment': {
      if (!rbac.can(user, 'assignment:submit')) throw new Error('Unauthorized');
      const { assignmentId, ...content } = data;
      if (!assignmentId) throw new Error('assignmentId is required');
      AssessmentDomain.validateSubmission(content);
      const submission = await assessmentService.submitAssignment(user.id, assignmentId, content, user.sessionId!);
      return AssessmentMapper.toSubmissionDTO(submission);
    }
    case 'save-quiz': {
      if (!rbac.can(user, 'quiz:manage')) throw new Error('Unauthorized');
      const sanitized = AssessmentDomain.sanitizeEntity(data);
      const quiz = await assessmentService.saveQuiz(user, sanitized, user.sessionId!);
      return AssessmentMapper.toQuizDTO(quiz);
    }
    case 'submit-quiz': {
      if (!rbac.can(user, 'quiz:take')) throw new Error('Unauthorized');
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
      if (!rbac.can(user, 'assignment:manage')) throw new Error('Unauthorized');
      await assessmentService.deleteAssignment(id, user.sessionId!);
      return { success: true };
    }
    case 'quiz': {
      if (!rbac.can(user, 'quiz:manage')) throw new Error('Unauthorized');
      await assessmentService.deleteQuiz(id, user.sessionId!);
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
    const body = await request.json();

    if (!id) throw new Error('id is required');

    switch (action) {
        case 'grade-submission': {
            if (!rbac.can(user, 'assignment:grade')) throw new Error('Unauthorized');
            if (body.grade !== undefined && (body.grade < 0 || body.grade > 100)) {
                throw new Error('Grade must be between 0 and 100');
            }
            await assessmentService.gradeSubmission(id, body, user.sessionId!);
            return { success: true };
        }
        default:
            throw new Error('Invalid PATCH action');
    }
});
