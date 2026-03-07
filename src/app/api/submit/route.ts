import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { FRIENDS } from '@/lib/constants';

interface SubmitPayload {
  respondent: string;
  selfAnswers: Record<string, string>;
  peerAnswers: Record<string, Record<string, string>>;
  groupAnswers: Record<string, string>;
}

export async function POST(req: NextRequest) {
  const body: SubmitPayload = await req.json();
  const { respondent, selfAnswers, peerAnswers, groupAnswers } = body;

  if (!FRIENDS.includes(respondent as typeof FRIENDS[number])) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 });
  }

  const db = getDb();

  const existing = db.prepare('SELECT * FROM respondents WHERE name = ?').get(respondent);
  if (existing) {
    return NextResponse.json({ error: 'Already submitted' }, { status: 409 });
  }

  const insertRespondent = db.prepare('INSERT INTO respondents (name, submitted_at) VALUES (?, ?)');
  const insertSelf = db.prepare('INSERT INTO self_answers (respondent_name, question_id, answer) VALUES (?, ?, ?)');
  const insertPeer = db.prepare('INSERT INTO peer_answers (respondent_name, target_name, question_id, answer) VALUES (?, ?, ?, ?)');
  const insertGroup = db.prepare('INSERT INTO group_answers (respondent_name, question_id, answer) VALUES (?, ?, ?)');

  const transaction = db.transaction(() => {
    insertRespondent.run(respondent, new Date().toISOString());

    for (const [qid, answer] of Object.entries(selfAnswers)) {
      insertSelf.run(respondent, qid, answer);
    }

    for (const [target, questions] of Object.entries(peerAnswers)) {
      for (const [qid, answer] of Object.entries(questions)) {
        insertPeer.run(respondent, target, qid, answer);
      }
    }

    for (const [qid, answer] of Object.entries(groupAnswers)) {
      insertGroup.run(respondent, qid, answer);
    }
  });

  transaction();

  return NextResponse.json({ success: true });
}
