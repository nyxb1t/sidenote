import { supabase } from '../src/config/supabase.js';

const { error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

if (error) throw error;

console.log('Supabase connectivity check passed');
