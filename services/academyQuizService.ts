import { supabase, TABLES } from '../supabase';
import type {
  AcademyQuiz,
  AcademyQuizQuestion,
  AcademyQuizOption,
  AcademyQuizAttempt,
  AcademyQuestionType,
} from '../types';

const QUIZZES_TABLE = TABLES.ACADEMY_QUIZZES;
const QUESTIONS_TABLE = TABLES.ACADEMY_QUIZ_QUESTIONS;
const OPTIONS_TABLE = TABLES.ACADEMY_QUIZ_OPTIONS;
const ATTEMPTS_TABLE = TABLES.ACADEMY_QUIZ_ATTEMPTS;

const mapOptionRow = (row: any): AcademyQuizOption => ({
  id: row.id,
  questionId: row.question_id,
  optionText: row.option_text,
  isCorrect: row.is_correct,
  orderIndex: row.order_index,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const mapQuestionRow = (
  row: any,
  options?: AcademyQuizOption[]
): AcademyQuizQuestion => ({
  id: row.id,
  quizId: row.quiz_id,
  questionText: row.question_text,
  questionType: row.question_type as AcademyQuestionType,
  orderIndex: row.order_index,
  options,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const mapQuizRow = (row: any, questions?: AcademyQuizQuestion[]): AcademyQuiz => ({
  id: row.id,
  lessonId: row.lesson_id,
  title: row.title,
  description: row.description ?? undefined,
  passingScore: Number(row.passing_score ?? 0),
  maxAttempts: row.max_attempts ?? undefined,
  isActive: row.is_active,
  questions,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

const mapAttemptRow = (row: any): AcademyQuizAttempt => ({
  id: row.id,
  quizId: row.quiz_id,
  enrollmentId: row.enrollment_id,
  startedAt: new Date(row.started_at || row.created_at),
  submittedAt: row.submitted_at ? new Date(row.submitted_at) : undefined,
  score: row.score !== null && row.score !== undefined ? Number(row.score) : undefined,
  passed: row.passed ?? undefined,
  answers: row.answers || undefined,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export interface SaveQuizInput {
  lessonId: string;
  title: string;
  description?: string;
  passingScore: number;
  maxAttempts?: number;
  isActive?: boolean;
  questions: Array<{
    id?: string;
    questionText: string;
    questionType: AcademyQuestionType;
    orderIndex?: number;
    options: Array<{
      id?: string;
      optionText: string;
      isCorrect: boolean;
      orderIndex?: number;
    }>;
  }>;
}

export const getQuizForLesson = async (
  lessonId: string
): Promise<AcademyQuiz | null> => {
  const { data, error } = await supabase
    .from(QUIZZES_TABLE)
    .select('*')
    .eq('lesson_id', lessonId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching Academy quiz:', error);
    throw new Error(error.message || 'Failed to fetch quiz');
  }

  if (!data) {
    return null;
  }

  return getQuizWithQuestions(data.id);
};

export const getQuizWithQuestions = async (
  quizId: string
): Promise<AcademyQuiz | null> => {
  const { data: quizRow, error: quizError } = await supabase
    .from(QUIZZES_TABLE)
    .select('*')
    .eq('id', quizId)
    .single();

  if (quizError) {
    if ((quizError as any).code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching Academy quiz:', quizError);
    throw new Error(quizError.message || 'Failed to fetch quiz');
  }

  const { data: questionsRows, error: questionsError } = await supabase
    .from(QUESTIONS_TABLE)
    .select('*')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });

  if (questionsError) {
    console.error('Error fetching Academy quiz questions:', questionsError);
    throw new Error(questionsError.message || 'Failed to fetch quiz questions');
  }

  const questionIds = (questionsRows || []).map((q: any) => q.id);
  let optionsByQuestion: Record<string, AcademyQuizOption[]> = {};

  if (questionIds.length > 0) {
    const { data: optionsRows, error: optionsError } = await supabase
      .from(OPTIONS_TABLE)
      .select('*')
      .in('question_id', questionIds)
      .order('order_index', { ascending: true });

    if (optionsError) {
      console.error('Error fetching Academy quiz options:', optionsError);
      throw new Error(optionsError.message || 'Failed to fetch quiz options');
    }

    (optionsRows || []).forEach((row: any) => {
      const option = mapOptionRow(row);
      if (!optionsByQuestion[option.questionId]) {
        optionsByQuestion[option.questionId] = [];
      }
      optionsByQuestion[option.questionId].push(option);
    });
  }

  const questions: AcademyQuizQuestion[] = (questionsRows || []).map((row: any) =>
    mapQuestionRow(row, optionsByQuestion[row.id] || [])
  );

  return mapQuizRow(quizRow, questions);
};

export const saveQuiz = async (input: SaveQuizInput): Promise<AcademyQuiz> => {
  if (!input.lessonId) {
    throw new Error('Lesson ID is required for quiz');
  }
  if (!input.title || !input.title.trim()) {
    throw new Error('Quiz title is required');
  }

  // Upsert quiz by lesson
  const { data: existingQuiz, error: existingError } = await supabase
    .from(QUIZZES_TABLE)
    .select('*')
    .eq('lesson_id', input.lessonId)
    .maybeSingle();

  if (existingError) {
    console.error('Error checking existing Academy quiz:', existingError);
    throw new Error(existingError.message || 'Failed to save quiz');
  }

  let quizId: string;

  if (existingQuiz) {
    const { data, error } = await supabase
      .from(QUIZZES_TABLE)
      .update({
        title: input.title.trim(),
        description: input.description || null,
        passing_score: input.passingScore,
        max_attempts: input.maxAttempts ?? null,
        is_active: input.isActive ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingQuiz.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Academy quiz:', error);
      throw new Error(error.message || 'Failed to save quiz');
    }

    quizId = data.id;
  } else {
    const { data, error } = await supabase
      .from(QUIZZES_TABLE)
      .insert({
        lesson_id: input.lessonId,
        title: input.title.trim(),
        description: input.description || null,
        passing_score: input.passingScore,
        max_attempts: input.maxAttempts ?? null,
        is_active: input.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Academy quiz:', error);
      throw new Error(error.message || 'Failed to save quiz');
    }

    quizId = data.id;
  }

  // Replace questions and options for simplicity
  const { error: deleteOptionsError } = await supabase
    .from(OPTIONS_TABLE)
    .delete()
    .in(
      'question_id',
      supabase.from(QUESTIONS_TABLE).select('id').eq('quiz_id', quizId) as any
    );

  if (deleteOptionsError) {
    console.error('Error deleting old Academy quiz options:', deleteOptionsError);
    throw new Error(deleteOptionsError.message || 'Failed to save quiz options');
  }

  const { error: deleteQuestionsError } = await supabase
    .from(QUESTIONS_TABLE)
    .delete()
    .eq('quiz_id', quizId);

  if (deleteQuestionsError) {
    console.error('Error deleting old Academy quiz questions:', deleteQuestionsError);
    throw new Error(deleteQuestionsError.message || 'Failed to save quiz questions');
  }

  // Insert new questions and options
  for (const [qIndex, question] of input.questions.entries()) {
    const { data: questionRow, error: questionError } = await supabase
      .from(QUESTIONS_TABLE)
      .insert({
        quiz_id: quizId,
        question_text: question.questionText,
        question_type: question.questionType,
        order_index: question.orderIndex ?? qIndex,
      })
      .select()
      .single();

    if (questionError) {
      console.error('Error inserting Academy quiz question:', questionError);
      throw new Error(questionError.message || 'Failed to save quiz questions');
    }

    const questionId = questionRow.id;

    const optionsPayload = question.options.map((opt, oIndex) => ({
      question_id: questionId,
      option_text: opt.optionText,
      is_correct: opt.isCorrect,
      order_index: opt.orderIndex ?? oIndex,
    }));

    const { error: optionsError } = await supabase
      .from(OPTIONS_TABLE)
      .insert(optionsPayload);

    if (optionsError) {
      console.error('Error inserting Academy quiz options:', optionsError);
      throw new Error(optionsError.message || 'Failed to save quiz options');
    }
  }

  return getQuizWithQuestions(quizId) as Promise<AcademyQuiz>;
};

export interface SubmitQuizAnswersInput {
  quizId: string;
  enrollmentId: string;
  answers: Record<string, string[] | boolean>;
}

export const submitQuizAttempt = async (
  input: SubmitQuizAnswersInput
): Promise<AcademyQuizAttempt> => {
  const quiz = await getQuizWithQuestions(input.quizId);
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    throw new Error('Quiz not found or has no questions');
  }

  // Grade the attempt
  let totalQuestions = 0;
  let correctQuestions = 0;

  for (const question of quiz.questions) {
    totalQuestions += 1;
    const userAnswer = input.answers[question.id];

    const correctOptions =
      question.options?.filter((o) => o.isCorrect).map((o) => o.id) || [];

    let isCorrect = false;

    if (question.questionType === 'true_false') {
      if (typeof userAnswer === 'boolean' && question.options && question.options.length === 2) {
        const trueOption = question.options.find(
          (o) => o.optionText.toLowerCase() === 'true'
        );
        const falseOption = question.options.find(
          (o) => o.optionText.toLowerCase() === 'false'
        );
        if (trueOption && falseOption) {
          const correctOption = correctOptions[0];
          isCorrect =
            (userAnswer && correctOption === trueOption.id) ||
            (!userAnswer && correctOption === falseOption.id);
        }
      }
    } else if (Array.isArray(userAnswer)) {
      const sortedUser = [...userAnswer].sort();
      const sortedCorrect = [...correctOptions].sort();
      isCorrect =
        sortedUser.length === sortedCorrect.length &&
        sortedUser.every((val, idx) => val === sortedCorrect[idx]);
    }

    if (isCorrect) {
      correctQuestions += 1;
    }
  }

  const score =
    totalQuestions > 0 ? (correctQuestions / totalQuestions) * 100 : 0;
  const passed = score >= quiz.passingScore;

  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from(ATTEMPTS_TABLE)
    .insert({
      quiz_id: input.quizId,
      enrollment_id: input.enrollmentId,
      started_at: nowIso,
      submitted_at: nowIso,
      score,
      passed,
      answers: input.answers,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating Academy quiz attempt:', error);
    throw new Error(error.message || 'Failed to submit quiz');
  }

  return mapAttemptRow(data);
};

export const getQuizAttempts = async (
  quizId: string,
  enrollmentId: string
): Promise<AcademyQuizAttempt[]> => {
  const { data, error } = await supabase
    .from(ATTEMPTS_TABLE)
    .select('*')
    .eq('quiz_id', quizId)
    .eq('enrollment_id', enrollmentId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching Academy quiz attempts:', error);
    throw new Error(error.message || 'Failed to fetch quiz attempts');
  }

  return (data || []).map((row: any) => mapAttemptRow(row));
};

