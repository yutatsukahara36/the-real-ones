import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST() {
  const db = getDb();

  db.transaction(() => {
    db.prepare('DELETE FROM peer_answers').run();
    db.prepare('DELETE FROM self_answers').run();
    db.prepare('DELETE FROM group_answers').run();
    db.prepare('DELETE FROM respondents').run();
    db.prepare('DELETE FROM analysis_results').run();
  })();

  return NextResponse.json({ success: true });
}
