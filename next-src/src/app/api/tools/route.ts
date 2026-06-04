import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

let cached: unknown = null;

function getToolsData() {
  if (cached) return cached;
  const path = join(process.cwd(), 'public/data/tools.json');
  cached = JSON.parse(readFileSync(path, 'utf8'));
  return cached;
}

export async function GET() {
  try {
    const data = getToolsData();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to load tools' }, { status: 500 });
  }
}
