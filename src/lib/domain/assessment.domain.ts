import { Assignment, Quiz, QuizQuestion, QuizSubmission, Submission } from '../types';

export class AssessmentDomain {
  static calculateQuizScore(questions: QuizQuestion[], answers: Record<string, unknown>) {
    if (!questions || questions.length === 0) return { score: 0, totalPoints: 0, correctCount: 0 };

    let correctCount = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((q) => {
        const points = q.points || 0;
        totalPoints += points;

        const userAnswer = answers[q.id];
        // Ensure comparison handles both string and number for MCQ/TF
        if (userAnswer !== undefined && String(userAnswer).toLowerCase() === String(q.correct_answer).toLowerCase()) {
            correctCount++;
            earnedPoints += points;
        }
    });

    const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

    return {
        score: scorePercentage,
        earnedPoints,
        totalPoints,
        correctCount
    };
  }

  static validateQuizAttempt(quiz: Quiz, currentAttempts: number): void {
    if (quiz.attempts_allowed > 0 && currentAttempts >= quiz.attempts_allowed) {
      throw new Error(`Maximum attempts (${quiz.attempts_allowed}) reached for this quiz.`);
    }
  }

  static prepareAssignment(assignment: Partial<Assignment>, teacherId: string): Partial<Assignment> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { courses: _, ...rest } = assignment as any;
    return {
      ...rest,
      teacher_id: assignment.teacher_id || teacherId,
      status: assignment.status || 'draft',
      allowed_extensions: assignment.allowed_extensions || ['pdf', 'doc', 'docx', 'zip', 'jpg', 'png']
    };
  }

  static prepareQuiz(quiz: Partial<Quiz>, teacherId: string): Partial<Quiz> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { courses: _, ...rest } = quiz as any;
    return {
      ...rest,
      teacher_id: quiz.teacher_id || teacherId,
      status: quiz.status || 'draft',
      shuffle_questions: quiz.shuffle_questions || false
    };
  }

  static prepareSubmission(studentId: string, assignmentId: string, content: Partial<Submission>): Partial<Submission> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const { assignments: _a, users: _u, ...rest } = content as any;
    return {
      ...rest,
      assignment_id: assignmentId,
      student_id: studentId,
      submitted_at: new Date().toISOString(),
      status: 'submitted'
    };
  }

  static prepareQuizSubmission(studentId: string, quizId: string, attemptNumber: number, score: number, totalPoints: number, submissionData: Partial<QuizSubmission>): Partial<QuizSubmission> {
    return {
      quiz_id: quizId,
      student_id: studentId,
      attempt_number: attemptNumber,
      answers: submissionData.answers || {},
      score: score,
      total_points: totalPoints,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      time_spent: submissionData.time_spent || 0,
      violation_count: submissionData.violation_count || 0,
      started_at: submissionData.started_at || new Date().toISOString()
    };
  }
}
