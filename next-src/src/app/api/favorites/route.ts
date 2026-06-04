import { NextRequest, NextResponse } from 'next/server';

// Fallback: in-memory favorites (for demo/no-auth mode)
const userFavorites = new Map<string, Set<number>>();

function getSessionId(req: NextRequest): string {
  return req.headers.get('x-session-id') || 'anonymous';
}

export async function GET(req: NextRequest) {
  // Try to get user from Supabase JWT
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
      if (user) {
        const { data } = await supabase
          .from('favorites')
          .select('tool_id')
          .eq('user_id', user.id);
        return NextResponse.json({ favorites: (data || []).map((r: { tool_id: string }) => Number(r.tool_id)) });
      }
    } catch { /* fallback */ }
  }

  const sessionId = getSessionId(req);
  const favs = userFavorites.get(sessionId) || new Set();
  return NextResponse.json({ favorites: Array.from(favs) });
}

export async function POST(req: NextRequest) {
  try {
    const { tool_id, action } = await req.json();

    // Try Supabase
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
        if (user) {
          if (action === 'add') {
            await supabase.from('favorites').upsert({
              user_id: user.id, tool_id: tool_id,
            }, { onConflict: 'user_id,tool_id' });
          } else if (action === 'remove') {
            await supabase.from('favorites').delete().match({
              user_id: user.id, tool_id: tool_id,
            });
          }
          // Return updated list
          const { data } = await supabase.from('favorites').select('tool_id').eq('user_id', user.id);
          return NextResponse.json({ ok: true, favorites: (data || []).map((r: { tool_id: string }) => Number(r.tool_id)) });
        }
      } catch { /* fallback */ }
    }

    // Fallback: in-memory
    const sessionId = getSessionId(req);
    if (!userFavorites.has(sessionId)) userFavorites.set(sessionId, new Set());
    const favs = userFavorites.get(sessionId)!;
    if (action === 'add') favs.add(tool_id);
    else if (action === 'remove') favs.delete(tool_id);
    return NextResponse.json({ ok: true, favorites: Array.from(favs) });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
