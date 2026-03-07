import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { FRIENDS } from '@/lib/constants';

export async function GET() {
  const db = getDb();
  const submitted = db.prepare('SELECT name, submitted_at FROM respondents').all() as { name: string; submitted_at: string }[];
  const submittedNames = submitted.map((r) => r.name);

  const selfCount = (db.prepare('SELECT COUNT(*) as c FROM self_answers').get() as { c: number }).c;
  const peerCount = (db.prepare('SELECT COUNT(*) as c FROM peer_answers').get() as { c: number }).c;
  const groupCount = (db.prepare('SELECT COUNT(*) as c FROM group_answers').get() as { c: number }).c;

  const analysis = db.prepare('SELECT id, generated_at FROM analysis_results ORDER BY id DESC LIMIT 1').get();

  return NextResponse.json({
    friends: FRIENDS,
    submitted,
    submittedNames,
    totalResponses: selfCount + peerCount + groupCount,
    allSubmitted: submittedNames.length === FRIENDS.length,
    hasAnalysis: !!analysis,
  });
}
