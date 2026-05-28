import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

export const isSupabaseServerConfigured = !!(supabaseUrl && supabaseSecretKey);

if (!isSupabaseServerConfigured && typeof window === 'undefined') {
  console.warn(
    'Supabase secret key variable SUPABASE_SECRET_KEY is missing. Server operations will fail until configured.'
  );
}

export const supabaseServer = createClient(
  supabaseUrl || 'https://placeholder-project-id.supabase.co',
  supabaseSecretKey || 'placeholder-secret-key',
  {
    auth: {
      persistSession: false,
    },
  }
);
