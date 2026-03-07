import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }
  const db = getDb();
  const row = db.prepare('SELECT * FROM respondents WHERE name = ?').get(name);
  return NextResponse.json({ submitted: !!row });
}
