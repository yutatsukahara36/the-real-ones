import { NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function GET() {
  const db = getDb();
  const respondents = db.prepare('SELECT * FROM respondents').all();
  const selfAnswers = db.prepare('SELECT * FROM self_answers').all();
  const peerAnswers = db.prepare('SELECT * FROM peer_answers').all();
  const groupAnswers = db.prepare('SELECT * FROM group_answers').all();

  return NextResponse.json({
    respondents,
    selfAnswers,
    peerAnswers,
    groupAnswers,
  });
}
