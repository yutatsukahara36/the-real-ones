import { NextResponse } from 'next/server';
import getDb from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { FRIENDS } from '@/lib/constants';

export const maxDuration = 120;

export async function POST() {
  const db = getDb();

  const submitted = db.prepare('SELECT name FROM respondents').all() as { name: string }[];
  if (submitted.length < FRIENDS.length) {
    return NextResponse.json({ error: 'Not all friends have submitted yet' }, { status: 400 });
  }

  const selfAnswers = db.prepare('SELECT * FROM self_answers').all();
  const peerAnswers = db.prepare('SELECT * FROM peer_answers').all();
  const groupAnswers = db.prepare('SELECT * FROM group_answers').all();

  const prompt = `You are analyzing survey responses from a close friend group of 8 people: ${FRIENDS.join(', ')}.

Each person answered questions about themselves, about each other friend, and about the group as a whole.

Here is the complete data:

## Self Answers (each person about themselves)
${JSON.stringify(selfAnswers, null, 2)}

## Peer Answers (each person about each other person)
${JSON.stringify(peerAnswers, null, 2)}

## Group Answers (each person about the group)
${JSON.stringify(groupAnswers, null, 2)}

## Question Reference
- 1.1: "What role do you play in this group?"
- 1.2: "What do you take from this group? What do you give?"
- 1.3: "How would this group change if you left tomorrow?"
- 2.1: "What does {Name} give to the group? What do they take?"
- 2.2: "Does {Name} challenge you or comfort you? How?"
- 2.3: "How would your life change if {Name} wasn't in it?"
- 2.4: "Would you call {Name} at your worst moment? Why or why not?"
- 2.5: "Describe your relationship with {Name} in one honest sentence."
- 3.1: "What's the best thing about this group?"
- 3.2: "What's the thing nobody says but everyone feels?"
- 3.3: "Where does this group need to grow?"

Analyze all responses and return a JSON object with this exact structure:

{
  "role_map": {
    "<name>": {
      "x": <number -10 to 10, Taker(-10) to Giver(+10), derived from 2.1 responses about this person>,
      "y": <number -10 to 10, Keeps Comfortable(-10) to Pushes Up(+10), derived from 2.2 responses about this person>,
      "hover_insight": "<2-3 sentence synthesized summary of why they landed there>",
      "self_x": <number -10 to 10, self-perception from 1.2>,
      "self_y": <number -10 to 10, self-perception from 1.2>
    }
  },
  "real_one_map": {
    "<name>": {
      "x": <number 1 to 10, Life Impact, derived from 2.3 responses about this person>,
      "y": <number 1 to 10, Worst Moment Trust, derived from 2.4 responses about this person>,
      "hover_insight": "<2-3 sentence synthesized summary>",
      "self_x": <number 1 to 10, self-perception from 1.3>,
      "self_y": <number 1 to 10, self-perception from 1.3>
    }
  },
  "heatmap": [
    {
      "from": "<name>",
      "to": "<name>",
      "heat": <number 1 to 10, derived from 2.3 + 2.4 + 2.5 combined>,
      "one_liner": "<one sentence essence of how 'from' feels about 'to'>"
    }
  ],
  "self_vs_group": {
    "<name>": {
      "gap_insight": "<one sentence on biggest blind spot>"
    }
  },
  "group_insights": {
    "best_thing": "<synthesized theme from 3.1 responses>",
    "unspoken_truth": "<synthesized theme from 3.2 responses>",
    "growth_area": "<synthesized theme from 3.3 responses>"
  },
  "next_steps": [
    "<actionable recommendation for strengthening the group bond, 1-2 sentences>",
    "<another recommendation>",
    "<another recommendation>",
    "<another recommendation>",
    "<another recommendation>"
  ],
  "avoid": [
    {
      "habit": "<bad habit or practice the group is doing or may start doing>",
      "why": "<why this is harmful and what it leads to, 1-2 sentences>"
    },
    ...at least 4-5 entries
  ],
  "honor_titles": {
    "microwave": {
      "winner": "<name of the person who blasts the vibe up, the life of the party, wherever they go everyone brings full energy>",
      "reason": "<2-3 sentence explanation based on the survey data>"
    },
    "leader": {
      "winner": "<name of the friend group leader>",
      "reason": "<2-3 sentence explanation based on the survey data>"
    },
    "group_clown": {
      "winner": "<name of the funniest one>",
      "reason": "<2-3 sentence explanation based on the survey data>"
    },
    "grinder": {
      "winner": "<name of the most disciplined and career-oriented one>",
      "reason": "<2-3 sentence explanation based on the survey data>"
    },
    "retard": {
      "winner": "<name of the most insane and out of pocket one>",
      "reason": "<2-3 sentence explanation based on the survey data>"
    },
    "nigga": {
      "winner": "<name of whoever didn't get selected for the other titles>",
      "reason": "<2-3 sentence explanation>"
    }
  }
}

The heatmap array should have 56 entries (8 people × 7 others each). Every directional pair must be included.

For honor_titles: each person can only win ONE title. All 6 winners must be different people. Pick based on the survey data — read between the lines of what people wrote about each other.

For next_steps: give real, specific, actionable advice based on what the survey reveals about the group dynamics. Not generic friendship advice.

For avoid: identify real patterns from the data — things the group is actually doing or trending toward that could damage the bond.

Be insightful and honest in your analysis. Read between the lines. Return ONLY the JSON object, no markdown fences, no explanation.`;

  const client = new Anthropic();

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 12000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  // Try to parse the JSON
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Try to extract JSON from possible markdown fences
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      parsed = JSON.parse(match[1]);
    } else {
      return NextResponse.json({ error: 'Failed to parse AI response', raw: text }, { status: 500 });
    }
  }

  db.prepare('INSERT INTO analysis_results (generated_at, result_json) VALUES (?, ?)').run(
    new Date().toISOString(),
    JSON.stringify(parsed)
  );

  return NextResponse.json({ success: true, analysis: parsed });
}
