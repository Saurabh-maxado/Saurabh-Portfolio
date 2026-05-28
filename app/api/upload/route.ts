import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseServer, isSupabaseServerConfigured } from '@/lib/supabase-server';

async function isAuthenticated() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    return session && session.value === 'authenticated';
  } catch (e) {
    return false;
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseServerConfigured) {
    return NextResponse.json(
      { error: 'Supabase Server Client is not configured. Please define SUPABASE_SECRET_KEY in environment variables.' },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    if (!path) {
      return NextResponse.json({ error: 'No upload path provided.' }, { status: 400 });
    }

    // Convert the File object to a Uint8Array for Supabase Storage Upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload using server-only client
    const { data, error } = await supabaseServer.storage
      .from('portfolio-media')
      .upload(path, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      console.error('Supabase Storage Server Upload Error:', error);
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Upload returned no response data.' }, { status: 500 });
    }

    // Get public URL
    const { data: urlData } = supabaseServer.storage
      .from('portfolio-media')
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      return NextResponse.json({ error: 'Failed to retrieve public URL from storage.' }, { status: 500 });
    }

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (e: any) {
    console.error('Upload route error:', e);
    return NextResponse.json({ error: e.message || 'Server error during upload.' }, { status: 500 });
  }
}
