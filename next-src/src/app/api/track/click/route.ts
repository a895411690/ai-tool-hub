import { NextRequest, NextResponse } from 'next/server';

// In-memory click counter (resets on deploy; replaced by Supabase when configured)
const clickCounts = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tool_id, tool_slug } = body;

    if (!tool_id && !tool_slug) {
      return NextResponse.json({ error: 'tool_id or tool_slug required' }, { status: 400 });
    }

    const key = String(tool_id || tool_slug);
    clickCounts.set(key, (clickCounts.get(key) || 0) + 1);

    // When Supabase is configured, also write to DB
    // import { getSupabase } from '@/lib/supabase';
    // const supabase = getSupabase();
    // await supabase.from('click_logs').insert({ tool_slug, from_page, from_section });

    return NextResponse.json({ ok: true, count: clickCounts.get(key) });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ clicks: Object.fromEntries(clickCounts) });
}
