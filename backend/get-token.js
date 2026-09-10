import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const email = 'verified_user@example.com';
  const password = 'Password123!';
  console.log('Logging in:', email);
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    console.error('Auth error:', error.message);
    return;
  }
  console.log('Access Token:', data.session.access_token);
}
main();
