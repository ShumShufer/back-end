import prisma from "../config/db.js";
import { AppError } from "../helpers/appError.js";
import { Role, type AuthUser } from "../types/auth.types.js";
import type {
  CreateQuizInput,
  UpdateQuizInput,
  SubmitQuizInput,
} from "../validators/quizzes.schema.js";

interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  points?: number;
}

/**
 * Get list of quizzes.
 */
export async function getQuizzes(topicId?: string) {
  const where: Record<string, unknown> = {};
  if (topicId) where.topicId = topicId;

  return prisma.quiz.findMany({
    where,
    include: {
      topic: { select: { id: true, title: true, courseId: true } },
    },
    orderBy: { title: "asc" },
  });
}

/**
 * Get single quiz by ID.
 * If actor is a STUDENT, strips correctOptionIndex from questions.
 */
export async function getQuizById(quizId: string, actor?: AuthUser) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      topic: { select: { id: true, title: true, courseId: true } },
    },
  });

  if (!quiz) throw AppError.notFound("Quiz not found");

  const questions = quiz.questions as unknown as QuizQuestion[];

  if (actor?.role === Role.STUDENT || !actor) {
    const sanitizedQuestions = questions.map(({ correctOptionIndex, ...rest }) => rest);
    return {
      ...quiz,
      questions: sanitizedQuestions,
    };
  }

  return quiz;
}

/**
 * Create a new quiz.
 * MENTOR, EDUCATION_HEAD, ADMIN, SUPER_ADMIN
 */
export async function createQuiz(input: CreateQuizInput, actor: AuthUser) {
  if (actor.role === Role.STUDENT) {
    throw AppError.forbidden("Students cannot create quizzes");
  }

  return prisma.quiz.create({
    data: {
      topicId: input.topicId ?? null,
      title: input.title,
      questions: input.questions,
      passScore: input.passScore,
    },
    include: {
      topic: { select: { id: true, title: true } },
    },
  });
}

/**
 * Update quiz.
 */
export async function updateQuiz(quizId: string, input: UpdateQuizInput, actor: AuthUser) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw AppError.notFound("Quiz not found");

  if (actor.role === Role.STUDENT) {
    throw AppError.forbidden("Students cannot update quizzes");
  }

  return prisma.quiz.update({
    where: { id: quizId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.questions && { questions: input.questions }),
      ...(input.passScore !== undefined && { passScore: input.passScore }),
    },
  });
}

/**
 * Submit answers to a quiz and compute automatic grading score.
 */
export async function submitQuiz(quizId: string, input: SubmitQuizInput) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw AppError.notFound("Quiz not found");

  const questions = quiz.questions as unknown as QuizQuestion[];
  let totalPoints = 0;
  let earnedPoints = 0;

  const results = questions.map((q, idx) => {
    const points = q.points ?? 1;
    totalPoints += points;

    const studentAnswer = input.answers.find((a) => a.questionIndex === idx);
    const isCorrect = studentAnswer?.selectedOptionIndex === q.correctOptionIndex;

    if (isCorrect) {
      earnedPoints += points;
    }

    return {
      questionIndex: idx,
      question: q.question,
      selectedOptionIndex: studentAnswer?.selectedOptionIndex ?? null,
      correctOptionIndex: q.correctOptionIndex,
      isCorrect,
    };
  });

  const scorePercentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = scorePercentage >= quiz.passScore;

  return {
    quizId: quiz.id,
    title: quiz.title,
    passScore: quiz.passScore,
    earnedPoints,
    totalPoints,
    scorePercentage,
    passed,
    breakdown: results,
  };
}
