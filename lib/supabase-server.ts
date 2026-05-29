import { createClient } from '@supabase/supabase-js';

function cleanEnvVar(value: string | undefined): string {
  if (!value) return '';
  let cleaned = value.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}

const supabaseUrl = cleanEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseSecretKey = cleanEnvVar(process.env.SUPABASE_SECRET_KEY);

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
