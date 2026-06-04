/**
 * Import tools.json → Supabase
 * Usage: NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/import-tools.ts
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const dataPath = join(__dirname, '../public/data/tools.json');
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));

  console.log(`Importing ${data.tools.length} tools...`);

  // Insert categories
  const categories = data.categories.map((c: { id: string; name: string; icon: string }, i: number) => ({
    name: c.name,
    slug: c.id,
    icon: c.icon,
    sort_order: i,
  }));

  const { error: catError } = await supabase.from('categories').upsert(categories, { onConflict: 'slug' });
  if (catError) console.error('Categories error:', catError);
  else console.log(`✓ ${categories.length} categories`);

  // Insert tools — use id-based slug for Chinese tool names
  const tools = data.tools.map((t: Record<string, unknown>) => {
    const nameSlug = slugify(t.name as string);
    const slug = nameSlug || `tool-${t.id}`;
    return {
      id: t.id,
      name: t.name,
      slug,
      description: t.desc || '',
      website_url: t.url || '',
      category: t.category,
      categories: t.categories || [t.category],
      tags: t.tags || [],
      tool_tags: t.toolTags || [],
      pricing: t.pricing || [],
      value_tag: t.valueTag || '',
      highlights: t.highlights || [],
      is_domestic: (t.toolTags as string[])?.includes('国产') || false,
      requires_login: !(t.toolTags as string[])?.includes('无需登录'),
      icon: t.icon || '',
      difficulty: (t.difficulty as string) || null,
      status: (t.status as string) || 'stable',
    };
  });

  const batchSize = 20;
  let imported = 0;
  for (let i = 0; i < tools.length; i += batchSize) {
    const batch = tools.slice(i, i + batchSize);
    const { error } = await supabase.from('tools').upsert(batch, { onConflict: 'id' });
    if (error) console.error(`Batch ${i} error:`, error);
    else imported += batch.length;
  }
  console.log(`✓ ${imported} tools imported`);

  console.log('Done!');
}

main().catch(console.error);
