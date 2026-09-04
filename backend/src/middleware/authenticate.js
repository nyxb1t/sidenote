import { supabase } from '../config/supabase.js';

export async function authenticate(req, res, next) {
  const [scheme, token] = req.get('authorization')?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
  }

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
  }

  req.user = data.user;
  next();
}
