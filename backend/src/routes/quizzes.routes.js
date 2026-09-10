import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/authenticate.js';
import { updateLearnerModel } from '../lib/ai-bridge.js';

const quizSchema = z.object({
  lesson_id: z.string().uuid(),
  topic: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  content: z.object({}).passthrough(),
}).strict();

const attemptSchema = z.object({
  answers: z.object({}).passthrough(),
  score: z.number().min(0).max(1).optional(),
  mistake_topics: z.array(z.string()).optional(),
}).strict();

const idSchema = z.string().uuid();

function requestError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

async function getOwnedRecord(table, id, userId) {
  return supabase
    .from(table)
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
}

export const quizzesRouter = Router();

quizzesRouter.use(authenticate);

quizzesRouter.post('/', async (req, res, next) => {
  const parsed = quizSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'VALIDATION_ERROR'));
  }

  try {
    const { data: lesson, error: lessonError } = await getOwnedRecord(
      'lessons',
      parsed.data.lesson_id,
      req.user.id,
    );

    if (lessonError) return next(lessonError);
    if (!lesson) return next(requestError('Lesson not found', 404, 'NOT_FOUND'));

    const { data, error } = await supabase
      .from('quizzes')
      .insert({ ...parsed.data, user_id: req.user.id })
      .select()
      .single();

    if (error) return next(error);

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

quizzesRouter.get('/:id', async (req, res, next) => {
  if (!idSchema.safeParse(req.params.id).success) {
    return next(requestError('Quiz not found', 404, 'NOT_FOUND'));
  }

  try {
    const { data, error } = await supabase
      .from('quizzes')
      .select()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) return next(error);
    if (!data) return next(requestError('Quiz not found', 404, 'NOT_FOUND'));

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

quizzesRouter.post('/:id/attempts', async (req, res, next) => {
  if (!idSchema.safeParse(req.params.id).success) {
    return next(requestError('Quiz not found', 404, 'NOT_FOUND'));
  }

  const parsed = attemptSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'VALIDATION_ERROR'));
  }

  try {
    // Fetch the quiz to get its topic
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('id, topic, user_id')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (quizError) return next(quizError);
    if (!quiz) return next(requestError('Quiz not found', 404, 'NOT_FOUND'));

    // Persist the quiz attempt (existing behaviour preserved)
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({ ...parsed.data, quiz_id: req.params.id, user_id: req.user.id })
      .select()
      .single();

    if (error) return next(error);

    // Respond immediately — learner model update is best-effort
    res.status(201).json({ data });

    // Fire-and-forget: update learner model with quiz result
    try {
      const { data: lmRow } = await supabase
        .from('learner_models')
        .select('model')
        .eq('user_id', req.user.id)
        .maybeSingle();

      if (lmRow?.model) {
        const event = {
          type:          'quiz_result',
          topic:         quiz.topic,
          score:         parsed.data.score ?? 0,
          mistakeTopics: parsed.data.mistake_topics ?? [],
        };
        const updated = updateLearnerModel(lmRow.model, event);
        await supabase
          .from('learner_models')
          .update({ model: updated })
          .eq('user_id', req.user.id);
      }
    } catch (lmErr) {
      // Non-fatal — log but do not surface to client
      console.warn('[quizzes] learner model update failed (non-fatal):', lmErr.message);
    }
  } catch (error) {
    next(error);
  }
});

