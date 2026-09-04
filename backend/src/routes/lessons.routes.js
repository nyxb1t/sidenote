import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/authenticate.js';

const lessonSchema = z.object({
  topic: z.string().min(1),
  title: z.string().min(1),
  subject: z.string().min(1).nullable().optional(),
  teaching_strategy: z.enum(['visual', 'analogy', 'step-by-step', 'socratic']),
  content: z.object({}).passthrough(),
});

const lessonIdSchema = z.string().uuid();
const progressSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
  progress: z.number().min(0).max(1).optional(),
  current_section_index: z.number().int().min(0).optional(),
  started_at: z.string().datetime({ offset: true }).nullable().optional(),
  completed_at: z.string().datetime({ offset: true }).nullable().optional(),
}).strict().refine((value) => Object.keys(value).length > 0);

function requestError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

async function getOwnedLesson(id, userId) {
  return supabase
    .from('lessons')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
}

export const lessonsRouter = Router();

lessonsRouter.use(authenticate);

lessonsRouter.post('/', async (req, res, next) => {
  const parsed = lessonSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'VALIDATION_ERROR'));
  }

  try {
    const { data, error } = await supabase
      .from('lessons')
      .insert({ ...parsed.data, user_id: req.user.id })
      .select()
      .single();

    if (error) return next(error);

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

lessonsRouter.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select()
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return next(error);

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

lessonsRouter.get('/:id/progress', async (req, res, next) => {
  if (!lessonIdSchema.safeParse(req.params.id).success) {
    return next(requestError('Lesson not found', 404, 'NOT_FOUND'));
  }

  try {
    const { data: lesson, error: lessonError } = await getOwnedLesson(req.params.id, req.user.id);

    if (lessonError) return next(lessonError);
    if (!lesson) return next(requestError('Lesson not found', 404, 'NOT_FOUND'));

    const { data, error } = await supabase
      .from('lesson_progress')
      .select()
      .eq('lesson_id', req.params.id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) return next(error);

    res.json({
      data: data ?? {
        lesson_id: req.params.id,
        user_id: req.user.id,
        status: 'not_started',
        progress: 0,
        current_section_index: 0,
        started_at: null,
        completed_at: null,
      },
    });
  } catch (error) {
    next(error);
  }
});

lessonsRouter.put('/:id/progress', async (req, res, next) => {
  if (!lessonIdSchema.safeParse(req.params.id).success) {
    return next(requestError('Lesson not found', 404, 'NOT_FOUND'));
  }

  const parsed = progressSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'VALIDATION_ERROR'));
  }

  try {
    const { data: lesson, error: lessonError } = await getOwnedLesson(req.params.id, req.user.id);

    if (lessonError) return next(lessonError);
    if (!lesson) return next(requestError('Lesson not found', 404, 'NOT_FOUND'));

    const { data, error } = await supabase
      .from('lesson_progress')
      .upsert(
        { ...parsed.data, lesson_id: req.params.id, user_id: req.user.id },
        { onConflict: 'lesson_id,user_id' },
      )
      .select()
      .single();

    if (error) return next(error);

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

lessonsRouter.get('/:id', async (req, res, next) => {
  if (!lessonIdSchema.safeParse(req.params.id).success) {
    return next(requestError('Lesson not found', 404, 'NOT_FOUND'));
  }

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) return next(error);
    if (!data) return next(requestError('Lesson not found', 404, 'NOT_FOUND'));

    res.json({ data });
  } catch (error) {
    next(error);
  }
});
