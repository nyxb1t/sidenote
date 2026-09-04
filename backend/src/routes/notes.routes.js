import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/authenticate.js';

const noteSchema = z.object({
  lesson_id: z.string().uuid(),
  topic: z.string().min(1),
  tag: z.enum(['Concept', 'Insight', 'Visual', 'Reference']),
  summary: z.string().min(1),
  content: z.object({}).passthrough(),
}).strict();

const noteIdSchema = z.string().uuid();

function requestError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

export const notesRouter = Router();

notesRouter.use(authenticate);

notesRouter.post('/', async (req, res, next) => {
  const parsed = noteSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'VALIDATION_ERROR'));
  }

  try {
    const { data: lesson, error: lessonError } = await supabase
      .from('lessons')
      .select('id')
      .eq('id', parsed.data.lesson_id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (lessonError) return next(lessonError);
    if (!lesson) return next(requestError('Lesson not found', 404, 'NOT_FOUND'));

    const { data, error } = await supabase
      .from('notes')
      .insert({ ...parsed.data, user_id: req.user.id })
      .select()
      .single();

    if (error) return next(error);

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

notesRouter.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select()
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return next(error);

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

notesRouter.get('/:id', async (req, res, next) => {
  if (!noteIdSchema.safeParse(req.params.id).success) {
    return next(requestError('Note not found', 404, 'NOT_FOUND'));
  }

  try {
    const { data, error } = await supabase
      .from('notes')
      .select()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (error) return next(error);
    if (!data) return next(requestError('Note not found', 404, 'NOT_FOUND'));

    res.json({ data });
  } catch (error) {
    next(error);
  }
});
