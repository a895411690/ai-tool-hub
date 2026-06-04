import { NextRequest, NextResponse } from 'next/server';

// In-memory fallback
const toolRatings = new Map<number, { scores: number[]; avg: number; count: number; reviews: { score: number; tags: string[]; comment: string }[] }>();

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const toolId = Number(url.searchParams.get('tool_id'));
  if (!toolId) return NextResponse.json({ error: 'tool_id required' }, { status: 400 });

  // Try Supabase for aggregate data
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: tool } = await supabase.from('tools').select('avg_rating, rating_count').eq('id', toolId).maybeSingle();
    const { data: reviews } = await supabase.from('ratings').select('score, tags, comment').eq('tool_id', toolId).order('created_at', { ascending: false }).limit(10);
    if (tool) {
      return NextResponse.json({
        tool_id: toolId,
        avg_rating: tool.avg_rating || 0,
        rating_count: tool.rating_count || 0,
        reviews: reviews || [],
      });
    }
  } catch { /* fallback */ }

  const data = toolRatings.get(toolId);
  if (!data) return NextResponse.json({ tool_id: toolId, avg_rating: 0, rating_count: 0, reviews: [] });
  return NextResponse.json({ tool_id: toolId, avg_rating: data.avg, rating_count: data.count, reviews: data.reviews });
}

export async function POST(req: NextRequest) {
  try {
    const { tool_id, score, tags, comment } = await req.json();
    if (!tool_id || !score || score < 1 || score > 5) {
      return NextResponse.json({ error: 'tool_id and score (1-5) required' }, { status: 400 });
    }

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
          await supabase.from('ratings').upsert({
            user_id: user.id,
            tool_id: tool_id,
            score,
            tags: tags || [],
            comment: comment || '',
          }, { onConflict: 'user_id,tool_id' });

          // Fetch updated aggregate
          const { data: tool } = await supabase.from('tools').select('avg_rating, rating_count').eq('id', tool_id).maybeSingle();
          return NextResponse.json({ ok: true, avg_rating: tool?.avg_rating || score, rating_count: tool?.rating_count || 1 });
        }
      } catch { /* fallback */ }
    }

    // Fallback: in-memory
    if (!toolRatings.has(tool_id)) toolRatings.set(tool_id, { scores: [], avg: 0, count: 0, reviews: [] });
    const data = toolRatings.get(tool_id)!;
    data.scores.push(score);
    data.count = data.scores.length;
    data.avg = Number((data.scores.reduce((a, b) => a + b, 0) / data.count).toFixed(2));
    if (tags || comment) data.reviews.push({ score, tags: tags || [], comment: comment || '' });
    return NextResponse.json({ ok: true, avg_rating: data.avg, rating_count: data.count });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
