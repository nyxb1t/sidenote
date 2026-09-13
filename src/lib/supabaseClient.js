/**
 * src/lib/supabaseClient.js
 *
 * Minimal Supabase client for frontend auth.
 * Uses only the public anon/publishable key -- never the service-role key.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://htyuddcmnkajaoftiamn.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_fE0ClOvCZayi9xyJw4WSug_mtBHPKTq';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
});

const authFetch = async (path, body) => {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error_description || json.msg || json.message || `Auth error ${res.status}`);
  }
  return json;
};

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      try {
        const json = await authFetch('/token?grant_type=password', { email, password });
        return {
          data: {
            session: { access_token: json.access_token, refresh_token: json.refresh_token },
            user: json.user,
          },
          error: null,
        };
      } catch (e) {
        return { data: null, error: e };
      }
    },

    signInWithIdToken: async ({ provider, token }) => {
      try {
        const json = await authFetch('/token?grant_type=id_token', { provider, id_token: token });
        return {
          data: {
            session: { access_token: json.access_token, refresh_token: json.refresh_token },
            user: json.user,
          },
          error: null,
        };
      } catch (e) {
        return { data: null, error: e };
      }
    },

    signUp: async ({ email, password }) => {
      try {
        const json = await authFetch('/signup', { email, password });
        return {
          data: {
            session: json.access_token
              ? { access_token: json.access_token, refresh_token: json.refresh_token }
              : null,
            user: json.user || json,
          },
          error: null,
        };
      } catch (e) {
        return { data: null, error: e };
      }
    },
  },
};
