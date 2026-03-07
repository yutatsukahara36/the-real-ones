'use client';

import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PROFILE_PICS } from '@/lib/constants';

interface PersonScore {
  x: number;
  y: number;
  hover_insight: string;
  self_x: number;
  self_y: number;
}

interface HeatmapEntry {
  from: string;
  to: string;
  heat: number;
  one_liner: string;
}

interface PersonData {
  available: boolean;
  name: string;
  analysis: {
    role_map: PersonScore;
    real_one_map: PersonScore;
    self_vs_group: { gap_insight: string };
    heatmap_incoming: HeatmapEntry[];
    heatmap_outgoing: HeatmapEntry[];
  };
  selfAnswers: { question_id: string; answer: string }[];
  aboutThem: { respondent_name: string; question_id: string; answer: string }[];
  aboutOthers: { target_name: string; question_id: string; answer: string }[];
}

const COLORS: Record<string, string> = {
  Yuta: '#FF6B6B',
  Satvik: '#4ECDC4',
  Ty: '#45B7D1',
  Noah: '#96CEB4',
  Hojeong: '#FFEAA7',
  Koji: '#DDA0DD',
  Kenshin: '#98D8C8',
  Hikaru: '#F7DC6F',
};

const SELF_Q_LABELS: Record<string, string> = {
  '1.1': 'Your role in the group',
  '1.2': 'What you give & take',
  '1.3': 'If you left tomorrow',
};

const PEER_Q_LABELS: Record<string, string> = {
  '2.1': 'Give & take',
  '2.2': 'Challenge or comfort',
  '2.3': 'Life without them',
  '2.4': 'Call at worst moment',
  '2.5': 'One honest sentence',
};

function heatColor(heat: number): string {
  const ratio = (heat - 1) / 9;
  const r = Math.round(59 + ratio * 196);
  const g = Math.round(130 - ratio * 100);
  const b = Math.round(246 - ratio * 186);
  return `rgb(${r}, ${g}, ${b})`;
}

function PositionCard({
  title,
  score,
  xLabel,
  yLabel,
  xRange,
  yRange,
  accentColor,
}: {
  title: string;
  score: PersonScore;
  xLabel: [string, string];
  yLabel: [string, string];
  xRange: [number, number];
  yRange: [number, number];
  accentColor: string;
}) {
  const xPct = ((score.x - xRange[0]) / (xRange[1] - xRange[0])) * 100;
  const yPct = 100 - ((score.y - yRange[0]) / (yRange[1] - yRange[0])) * 100;
  const selfXPct = ((score.self_x - xRange[0]) / (xRange[1] - xRange[0])) * 100;
  const selfYPct = 100 - ((score.self_y - yRange[0]) / (yRange[1] - yRange[0])) * 100;

  return (
    <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">{title}</h3>

      {/* Mini position map */}
      <div className="relative w-full aspect-square bg-neutral-800/50 rounded-lg mb-4 overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 flex items-center"><div className="w-full h-px bg-neutral-700/50" /></div>
        <div className="absolute inset-0 flex justify-center"><div className="h-full w-px bg-neutral-700/50" /></div>

        {/* Axis labels */}
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-600 writing-mode-vertical" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg) translateX(50%)' }}>{yLabel[1]}</span>
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-600" style={{ writingMode: 'vertical-rl' }}>{yLabel[0]}</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-neutral-600">{xLabel[0]}</span>
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-neutral-600">{xLabel[1]}</span>

        {/* Connection line */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line
            x1={selfXPct} y1={selfYPct}
            x2={xPct} y2={yPct}
            stroke={accentColor}
            strokeWidth="0.5"
            strokeDasharray="2 2"
            opacity={0.5}
          />
        </svg>

        {/* Self dot */}
        <div
          className="absolute w-3 h-3 rounded-full border-2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${selfXPct}%`, top: `${selfYPct}%`, borderColor: accentColor, opacity: 0.4 }}
        />

        {/* Group dot */}
        <div
          className="absolute w-4 h-4 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg"
          style={{ left: `${xPct}%`, top: `${yPct}%`, backgroundColor: accentColor }}
        />
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
        <div className="bg-neutral-800/50 rounded-lg p-2">
          <span className="text-neutral-500">Group sees</span>
          <p className="font-mono font-semibold" style={{ color: accentColor }}>({score.x}, {score.y})</p>
        </div>
        <div className="bg-neutral-800/50 rounded-lg p-2">
          <span className="text-neutral-500">You said</span>
          <p className="font-mono font-semibold text-neutral-400">({score.self_x}, {score.self_y})</p>
        </div>
      </div>

      {/* Insight */}
      <p className="text-sm text-neutral-300 leading-relaxed">{score.hover_insight}</p>
    </div>
  );
}

function HeatBar({
  name,
  heat,
  oneLiner,
}: {
  name: string;
  heat: number;
  oneLiner: string;
  accentColor: string;
}) {
  return (
    <div className="group">
      <div className="flex items-center gap-3 mb-1">
        {PROFILE_PICS[name] ? (
          <Image src={PROFILE_PICS[name]} alt={name} width={24} height={24} className="w-6 h-6 rounded-full object-cover shrink-0" />
        ) : (
          <span className="w-6 h-6 rounded-full shrink-0" style={{ backgroundColor: COLORS[name] || '#888' }} />
        )}
        <span className="text-sm font-medium text-white w-20 shrink-0">{name}</span>
        <div className="flex-1 h-2.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${heat * 10}%`,
              backgroundColor: heatColor(heat),
            }}
          />
        </div>
        <span className="text-sm font-mono font-bold w-6 text-right" style={{ color: heatColor(heat) }}>{heat}</span>
      </div>
      <p className="text-xs text-neutral-500 ml-[7.5rem] mb-3 leading-relaxed group-hover:text-neutral-400 transition-colors">{oneLiner}</p>
    </div>
  );
}

export default function PersonalPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = use(params);
  const [data, setData] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/${encodeURIComponent(name)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.available) setData(json);
        setLoading(false);
      });
  }, [name]);

  const color = COLORS[name] || '#fff';

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">Not available yet.</h1>
          <p className="text-neutral-500 mb-6">Dashboard hasn&apos;t been generated.</p>
          <Link href="/dashboard" className="text-neutral-400 hover:text-white transition-colors">&larr; Back to dashboard</Link>
        </div>
      </main>
    );
  }

  const { analysis, selfAnswers, aboutThem } = data;
  const selfMap = Object.fromEntries(selfAnswers.map((a) => [a.question_id, a.answer]));

  // Group "about them" responses by question
  const aboutThemByQ: Record<string, { respondent_name: string; answer: string }[]> = {};
  for (const a of aboutThem) {
    if (!aboutThemByQ[a.question_id]) aboutThemByQ[a.question_id] = [];
    aboutThemByQ[a.question_id].push({ respondent_name: a.respondent_name, answer: a.answer });
  }

  const incomingSorted = [...analysis.heatmap_incoming].sort((a, b) => b.heat - a.heat);
  const outgoingSorted = [...analysis.heatmap_outgoing].sort((a, b) => b.heat - a.heat);

  const avgIncoming = analysis.heatmap_incoming.length
    ? (analysis.heatmap_incoming.reduce((s, h) => s + h.heat, 0) / analysis.heatmap_incoming.length).toFixed(1)
    : '—';
  const avgOutgoing = analysis.heatmap_outgoing.length
    ? (analysis.heatmap_outgoing.reduce((s, h) => s + h.heat, 0) / analysis.heatmap_outgoing.length).toFixed(1)
    : '—';

  return (
    <main className="min-h-screen px-4 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10 fade-in">
        <Link href="/dashboard" className="text-neutral-500 hover:text-white transition-colors text-sm mb-4 inline-block">
          &larr; Back to dashboard
        </Link>
        <div className="flex items-center gap-4">
          {PROFILE_PICS[name] && (
            <Image
              src={PROFILE_PICS[name]}
              alt={name}
              width={64}
              height={64}
              className="w-16 h-16 rounded-full object-cover ring-2"
              style={{ '--tw-ring-color': color } as React.CSSProperties}
            />
          )}
          <div>
            <h1 className="text-4xl font-bold" style={{ color }}>{name}</h1>
            <p className="text-neutral-500 mt-0.5">Personal review summary</p>
          </div>
        </div>
      </div>

      {/* Section 1: Identity — what they said about themselves */}
      <section className="mb-12 fade-in">
        <h2 className="text-xl font-bold mb-4 text-neutral-300">In Your Own Words</h2>
        <div className="space-y-4">
          {Object.entries(SELF_Q_LABELS).map(([qid, label]) => (
            <div key={qid} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
              <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-2">{label}</h3>
              <p className="text-white leading-relaxed">{selfMap[qid] || '—'}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2: Your Position on Both Maps */}
      <section className="mb-12 fade-in">
        <h2 className="text-xl font-bold mb-4 text-neutral-300">Where You Stand</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PositionCard
            title="The Role Map"
            score={analysis.role_map}
            xLabel={['Taker', 'Giver']}
            yLabel={['Comfort', 'Growth']}
            xRange={[-10, 10]}
            yRange={[-10, 10]}
            accentColor={color}
          />
          <PositionCard
            title="The Real One"
            score={analysis.real_one_map}
            xLabel={['Low Impact', 'High Impact']}
            yLabel={['Low Trust', 'High Trust']}
            xRange={[0, 10]}
            yRange={[0, 10]}
            accentColor={color}
          />
        </div>
      </section>

      {/* Section 3: The Blind Spot */}
      <section className="mb-12 fade-in">
        <h2 className="text-xl font-bold mb-4 text-neutral-300">The Blind Spot</h2>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
          <p className="text-white leading-relaxed text-lg">{analysis.self_vs_group?.gap_insight}</p>
        </div>
      </section>

      {/* Section 4: How Others See You */}
      <section className="mb-12 fade-in">
        <h2 className="text-xl font-bold mb-1 text-neutral-300">How Others See You</h2>
        <p className="text-neutral-500 text-sm mb-4">Average: <span className="font-mono font-semibold text-white">{avgIncoming}</span>/10</p>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
          {incomingSorted.map((h) => (
            <HeatBar key={h.from} name={h.from} heat={h.heat} oneLiner={h.one_liner} accentColor={color} />
          ))}
        </div>
      </section>

      {/* Section 5: How You See Others */}
      <section className="mb-12 fade-in">
        <h2 className="text-xl font-bold mb-1 text-neutral-300">How You See Others</h2>
        <p className="text-neutral-500 text-sm mb-4">Average: <span className="font-mono font-semibold text-white">{avgOutgoing}</span>/10</p>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
          {outgoingSorted.map((h) => (
            <HeatBar key={h.to} name={h.to} heat={h.heat} oneLiner={h.one_liner} accentColor={color} />
          ))}
        </div>
      </section>

      {/* Section 6: What Others Said About You (raw quotes) */}
      <section className="mb-12 fade-in">
        <h2 className="text-xl font-bold mb-4 text-neutral-300">What They Said About You</h2>
        <div className="space-y-4">
          {Object.entries(PEER_Q_LABELS).map(([qid, label]) => {
            const responses = aboutThemByQ[qid];
            if (!responses?.length) return null;
            return (
              <div key={qid} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5">
                <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">{label}</h3>
                <div className="space-y-3">
                  {responses.map((r) => (
                    <div key={r.respondent_name} className="flex gap-3">
                      {PROFILE_PICS[r.respondent_name] ? (
                        <Image src={PROFILE_PICS[r.respondent_name]} alt={r.respondent_name} width={20} height={20} className="w-5 h-5 rounded-full object-cover mt-0.5 shrink-0" />
                      ) : (
                        <span className="w-5 h-5 rounded-full mt-0.5 shrink-0" style={{ backgroundColor: COLORS[r.respondent_name] || '#888' }} />
                      )}
                      <div>
                        <span className="text-xs font-medium" style={{ color: COLORS[r.respondent_name] || '#888' }}>{r.respondent_name}</span>
                        <p className="text-neutral-300 text-sm leading-relaxed mt-0.5">{r.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
