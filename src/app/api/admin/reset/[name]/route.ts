// import { NextRequest, NextResponse } from 'next/server';
// import getDb from '@/lib/db';
// import { FRIENDS } from '@/lib/constants';

// export async function POST(
//   _req: NextRequest,
//   { params }: { params: Promise<{ name: string }> }
// ) {
//   const { name } = await params;

//   if (!FRIENDS.includes(name as typeof FRIENDS[number])) {
//     return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
//   }

//   const db = getDb();

//   db.transaction(() => {
//     db.prepare('DELETE FROM peer_answers WHERE respondent_name = ?').run(name);
//     db.prepare('DELETE FROM peer_answers WHERE target_name = ?').run(name);
//     db.prepare('DELETE FROM self_answers WHERE respondent_name = ?').run(name);
//     db.prepare('DELETE FROM group_answers WHERE respondent_name = ?').run(name);
//     db.prepare('DELETE FROM respondents WHERE name = ?').run(name);
//     // Clear analysis since it's now stale
//     db.prepare('DELETE FROM analysis_results').run();
//   })();

//   return NextResponse.json({ success: true });
// }

import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { FRIENDS } from '@/lib/constants';
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  if (!FRIENDS.includes(name as typeof FRIENDS[number])) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }
  const db = getDb();
  db.transaction(() => {
    db.prepare('DELETE FROM peer_answers WHERE respondent_name = ?').run(name);
    db.prepare('DELETE FROM self_answers WHERE respondent_name = ?').run(name);
    db.prepare('DELETE FROM group_answers WHERE respondent_name = ?').run(name);
    db.prepare('DELETE FROM respondents WHERE name = ?').run(name);
    // Clear analysis since it's now stale
    db.prepare('DELETE FROM analysis_results').run();
  })();
  return NextResponse.json({ success: true });
}
