import { QuizQuestion } from './types';

/**
 * Unified quiz scoring logic for consistent calculation across online and offline modes.
 */
export function calculateQuizScore(questions: QuizQuestion[], answers: Record<string, string | number | unknown>) {
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
