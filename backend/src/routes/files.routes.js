import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { env } from '../config/env.js';
import { supabase } from '../config/supabase.js';
import { authenticate } from '../middleware/authenticate.js';

const maxFileSize = 10 * 1024 * 1024;
const fileSchema = z.object({
  originalname: z.string().min(1).max(255),
  mimetype: z.string().min(1).max(255),
  size: z.number().int().positive().max(maxFileSize),
});
const fileIdSchema = z.string().uuid();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxFileSize } });

function requestError(message, statusCode, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

function uploadFile(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (error) {
      error.statusCode = 400;
      error.code = 'VALIDATION_ERROR';
    }
    next(error);
  });
}

export const filesRouter = Router();

filesRouter.use(authenticate);

filesRouter.post('/', uploadFile, async (req, res, next) => {
  const parsed = fileSchema.safeParse(req.file);

  if (!parsed.success) {
    return next(requestError('Invalid file', 400, 'VALIDATION_ERROR'));
  }

  const storagePath = `${req.user.id}/${randomUUID()}`;

  try {
    const { error: storageError } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .upload(storagePath, req.file.buffer, { contentType: parsed.data.mimetype, upsert: false });

    if (storageError) return next(storageError);

    const { data, error } = await supabase
      .from('uploaded_files')
      .insert({
        user_id: req.user.id,
        storage_path: storagePath,
        original_filename: parsed.data.originalname,
        mime_type: parsed.data.mimetype,
        byte_size: parsed.data.size,
      })
      .select()
      .single();

    if (error) {
      await supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).remove([storagePath]);
      return next(error);
    }

    res.status(201).json({ data });
  } catch (error) {
    next(error);
  }
});

filesRouter.get('/', async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select()
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return next(error);

    res.json({ data });
  } catch (error) {
    next(error);
  }
});

filesRouter.delete('/:id', async (req, res, next) => {
  if (!fileIdSchema.safeParse(req.params.id).success) {
    return next(requestError('File not found', 404, 'NOT_FOUND'));
  }

  try {
    const { data: file, error: fileError } = await supabase
      .from('uploaded_files')
      .select('id, storage_path')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .maybeSingle();

    if (fileError) return next(fileError);
    if (!file) return next(requestError('File not found', 404, 'NOT_FOUND'));

    const { error: storageError } = await supabase.storage
      .from(env.SUPABASE_STORAGE_BUCKET)
      .remove([file.storage_path]);

    if (storageError) return next(storageError);

    const { error } = await supabase
      .from('uploaded_files')
      .delete()
      .eq('id', file.id)
      .eq('user_id', req.user.id);

    if (error) return next(error);

    res.json({ data: { id: file.id } });
  } catch (error) {
    next(error);
  }
});
