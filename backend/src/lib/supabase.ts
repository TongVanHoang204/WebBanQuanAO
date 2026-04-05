import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

type GlobalSupabase = {
  supabaseAdmin?: SupabaseClient;
};

const globalForSupabase = global as unknown as GlobalSupabase;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

const createSupabaseAdminClient = (): SupabaseClient => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'shopfeshen-backend',
      },
    },
  });
};

export const supabaseAdmin =
  globalForSupabase.supabaseAdmin ||
  (isSupabaseConfigured ? createSupabaseAdminClient() : null);

export const getSupabaseAdminClient = (): SupabaseClient => {
  if (!supabaseAdmin) {
    throw new Error(
      'Supabase admin client is unavailable. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return supabaseAdmin;
};

if (process.env.NODE_ENV !== 'production' && supabaseAdmin) {
  globalForSupabase.supabaseAdmin = supabaseAdmin;
}
