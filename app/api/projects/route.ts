import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const MOCK_PROJECTS = [
  {
    id: 'mock-1',
    title: 'Aura Decentralized Platform',
    description: 'A cutting-edge Web3 analytics dashboard built with Next.js, tailwind-merge and framer-motion.',
    category: 'web',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop',
    link: 'https://github.com/saurabhpn03',
    tags: ['Next.js', 'Web3', 'Tailwind']
  },
  {
    id: 'mock-2',
    title: 'Neon Vector Identity',
    description: 'Brand identity system including logos, typography guides, and marketing assets designed in Illustrator.',
    category: 'design',
    image: 'https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=600&auto=format&fit=crop',
    tags: ['Brand Identity', 'Illustrator', 'Graphic']
  },
  {
    id: 'mock-3',
    title: 'Cinematic Sound Montage',
    description: 'Dynamic commercial video reel highlighting modern editing styles, color matching, and pacing transition mechanics.',
    category: 'video',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=600&auto=format&fit=crop',
    link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    tags: ['Premiere', 'After Effects', 'Cinematic']
  }
];

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
  if (!isSupabaseConfigured) {
    return NextResponse.json(MOCK_PROJECTS);
  }
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects from Supabase:', error);
      return NextResponse.json(MOCK_PROJECTS);
    }
    return NextResponse.json(data || []);
  } catch (e) {
    console.error('API Error:', e);
    return NextResponse.json(MOCK_PROJECTS);
  }
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { title, description, category, image, link, tags } = await request.json();
    if (!title || !description || !category || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([{ title, description, category, image, link, tags }])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (e: any) {
    console.error('API POST Error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { id, title, description, category, image, link, tags } = await request.json();
    if (!id || !title || !description || !category || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }

    const { data, error } = await supabase
      .from('projects')
      .update({ title, description, category, image, link, tags })
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (e: any) {
    console.error('API PUT Error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    if (!isSupabaseConfigured) {
      return NextResponse.json({ error: 'Supabase is not configured' }, { status: 503 });
    }

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('API DELETE Error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
