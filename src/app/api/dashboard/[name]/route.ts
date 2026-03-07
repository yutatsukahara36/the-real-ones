import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { FRIENDS } from '@/lib/constants';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  if (!FRIENDS.includes(name as typeof FRIENDS[number])) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  const db = getDb();

  // Get analysis data
  const analysisRow = db.prepare('SELECT result_json FROM analysis_results ORDER BY id DESC LIMIT 1').get() as { result_json: string } | undefined;
  if (!analysisRow) {
    return NextResponse.json({ available: false });
  }

  const analysis = JSON.parse(analysisRow.result_json);

  // Get raw self-answers
  const selfAnswers = db.prepare('SELECT question_id, answer FROM self_answers WHERE respondent_name = ?').all(name) as { question_id: string; answer: string }[];

  // What others wrote about this person
  const aboutThem = db.prepare('SELECT respondent_name, question_id, answer FROM peer_answers WHERE target_name = ?').all(name) as { respondent_name: string; question_id: string; answer: string }[];

  // What this person wrote about others
  const aboutOthers = db.prepare('SELECT target_name, question_id, answer FROM peer_answers WHERE respondent_name = ?').all(name) as { target_name: string; question_id: string; answer: string }[];

  return NextResponse.json({
    available: true,
    name,
    analysis: {
      role_map: analysis.role_map[name],
      real_one_map: analysis.real_one_map[name],
      self_vs_group: analysis.self_vs_group[name],
      heatmap_incoming: analysis.heatmap.filter((h: { to: string }) => h.to === name),
      heatmap_outgoing: analysis.heatmap.filter((h: { from: string }) => h.from === name),
    },
    selfAnswers,
    aboutThem,
    aboutOthers,
  });
}
