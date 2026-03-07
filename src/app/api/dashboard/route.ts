import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const row = db.prepare('SELECT result_json FROM analysis_results ORDER BY id DESC LIMIT 1').get() as { result_json: string } | undefined;

  if (!row) {
    return NextResponse.json({ available: false });
  }

  return NextResponse.json({ available: true, data: JSON.parse(row.result_json) });
}
