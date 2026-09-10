import { Router } from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/authenticate.js';

const progressEventSchema = z.object({
  lesson_id: z.string().uuid().nullable().optional(),
  quiz_id: z.string().uuid().nullable().optional(),
  event_type: z.string().min(1),
  topic: z.string().min(1).nullable().optional(),
  payload: z.object({}).passthrough().optional(),
}).strict();

function requestError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

export const progressEventsRouter = Router();

progressEventsRouter.use(authenticate);

progressEventsRouter.post('/', async (req, res, next) => {
  const parsed = progressEventSchema.safeParse(req.body);

  if (!parsed.success) {
    return next(requestError('Invalid request body', 400, 'VALIDATION_ERROR'));
  }

  try {
    const { data, error } = await supabase
      .from('progress_events')
      .insert({ ...parsed.data, user_id: req.user.id })
      .select()
      .single();

    if (error) return next(error);

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

progressEventsRouter.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('progress_events')
      .select()
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return next(error);

    res.json({ data });
  } catch (error) {
    next(error);
  }
});
