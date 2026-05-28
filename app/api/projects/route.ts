import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
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

export async function GET() {
  // Use server client if configured, otherwise fallback to anon client
  const activeClient = isSupabaseServerConfigured ? supabaseServer : supabase;
  const isConfigured = isSupabaseServerConfigured || isSupabaseConfigured;

  if (!isConfigured) {
    console.warn('Supabase is not configured, returning empty array.');
    return NextResponse.json([]);
  }
  try {
    const { data, error } = await activeClient
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects from Supabase:', error);
      return NextResponse.json([]);
    }
    return NextResponse.json(data || []);
  } catch (e) {
    console.error('API GET Error:', e);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseServerConfigured) {
    return NextResponse.json({ error: 'Supabase Server Client is not configured. Missing SUPABASE_SECRET_KEY.' }, { status: 503 });
  }

  try {
    const { title, description, category, image, link, tags } = await request.json();
    if (!title || !description || !category || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('projects')
      .insert([{ title, description, category, image, link, tags }])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }
    return NextResponse.json(data[0]);
  } catch (e: any) {
    console.error('API POST Error:', e);
    return NextResponse.json({ error: e.message || 'Server error during database insertion' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseServerConfigured) {
    return NextResponse.json({ error: 'Supabase Server Client is not configured. Missing SUPABASE_SECRET_KEY.' }, { status: 503 });
  }

  try {
    const { id, title, description, category, image, link, tags } = await request.json();
    if (!id || !title || !description || !category || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('projects')
      .update({ title, description, category, image, link, tags })
      .eq('id', id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }
    return NextResponse.json(data[0]);
  } catch (e: any) {
    console.error('API PUT Error:', e);
    return NextResponse.json({ error: e.message || 'Server error during database update' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isSupabaseServerConfigured) {
    return NextResponse.json({ error: 'Supabase Server Client is not configured. Missing SUPABASE_SECRET_KEY.' }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const { error } = await supabaseServer
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message || JSON.stringify(error) }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('API DELETE Error:', e);
    return NextResponse.json({ error: e.message || 'Server error during database deletion' }, { status: 500 });
  }
}
