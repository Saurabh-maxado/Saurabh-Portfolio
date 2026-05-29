import { NextResponse } from 'next/server';
import { supabaseServer, isSupabaseServerConfigured } from '@/lib/supabase-server';

function cleanEnvVar(value: string | undefined): string {
  if (!value) return '';
  let cleaned = value.trim();
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1);
  }
  return cleaned.trim();
}

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

  const cleanedUrl = cleanEnvVar(supabaseUrl);
  const cleanedSecretKey = cleanEnvVar(supabaseSecretKey);

  const results: any = {
    envVars: {
      NEXT_PUBLIC_SUPABASE_URL: {
        rawLength: supabaseUrl.length,
        cleaned: cleanedUrl || 'missing',
        hasQuotes: (supabaseUrl.startsWith('"') && supabaseUrl.endsWith('"')) || (supabaseUrl.startsWith("'") && supabaseUrl.endsWith("'")),
      },
      SUPABASE_SECRET_KEY: {
        rawLength: supabaseSecretKey.length,
        hasQuotes: (supabaseSecretKey.startsWith('"') && supabaseSecretKey.endsWith('"')) || (supabaseSecretKey.startsWith("'") && supabaseSecretKey.endsWith("'")),
        masked: cleanedSecretKey ? `${cleanedSecretKey.substring(0, 8)}...${cleanedSecretKey.substring(cleanedSecretKey.length - 8)}` : 'missing',
      },
    },
    isConfigured: isSupabaseServerConfigured,
  };

  try {
    if (!cleanedUrl || !cleanedSecretKey) {
      results.error = 'Supabase environment variables are not configured correctly.';
      return NextResponse.json(results, { status: 400 });
    }

    // Try listing buckets using the server client
    const { data: buckets, error: storageError } = await supabaseServer.storage.listBuckets();

    if (storageError) {
      results.storageConnection = {
        success: false,
        error: storageError.message || JSON.stringify(storageError),
      };
    } else {
      const bucketNames = buckets?.map(b => b.name) || [];
      const bucketExists = bucketNames.includes('portfolio-media');
      
      results.storageConnection = {
        success: true,
        availableBuckets: bucketNames,
        portfolioMediaExists: bucketExists,
      };
    }
  } catch (err: any) {
    results.storageConnection = {
      success: false,
      error: err.message || JSON.stringify(err),
    };
  }

  return NextResponse.json(results);
}
