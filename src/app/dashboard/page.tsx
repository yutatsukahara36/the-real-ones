'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PROFILE_PICS } from '@/lib/constants';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Label,
} from 'recharts';

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

interface AvoidEntry {
  habit: string;
  why: string;
}

interface HonorTitle {
  winner: string;
  reason: string;
}

interface AnalysisData {
  role_map: Record<string, PersonScore>;
  real_one_map: Record<string, PersonScore>;
  heatmap: HeatmapEntry[];
  self_vs_group: Record<string, { gap_insight: string }>;
  group_insights: {
    best_thing: string;
    unspoken_truth: string;
    growth_area: string;
  };
  next_steps?: string[];
  avoid?: AvoidEntry[];
  honor_titles?: Record<string, HonorTitle>;
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

const NAMES_ORDER = ['Yuta', 'Satvik', 'Ty', 'Noah', 'Hojeong', 'Koji', 'Kenshin', 'Hikaru'];

const TITLE_META: Record<string, { label: string; emoji: string; description: string }> = {
  microwave: { label: 'The Microwave', emoji: '🔥', description: 'Blasts the vibe up. Life of the party.' },
  leader: { label: 'The Leader', emoji: '👑', description: 'The friend group leader.' },
  group_clown: { label: 'Group Clown', emoji: '🤡', description: 'The funniest one.' },
  grinder: { label: 'The Grinder', emoji: '💪', description: 'Most disciplined and career-oriented.' },
  retard: { label: 'The Unhinged', emoji: '🧠', description: 'Most insane and out of pocket.' },
  nigga: { label: 'The Nigga', emoji: '🫡', description: 'Just is.' },
};

function heatColor(heat: number): string {
  const ratio = (heat - 1) / 9;
  const r = Math.round(59 + ratio * 196);
  const g = Math.round(130 - ratio * 100);
  const b = Math.round(246 - ratio * 186);
  return `rgb(${r}, ${g}, ${b})`;
}

// Custom dot that renders the person's name as a label
function NameDot(props: { cx?: number; cy?: number; payload?: { name: string }; isSelected?: boolean; dimmed?: boolean }) {
  const { cx = 0, cy = 0, payload, isSelected, dimmed } = props;
  if (!payload) return null;
  const color = COLORS[payload.name] || '#fff';
  const opacity = dimmed ? 0.15 : 1;
  const radius = isSelected ? 7 : 5;

  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={radius} fill={color} stroke={isSelected ? '#fff' : 'none'} strokeWidth={isSelected ? 2 : 0} />
      <text x={cx} y={cy - radius - 6} textAnchor="middle" fill={color} fontSize={12} fontWeight={600}>
        {payload.name}
      </text>
    </g>
  );
}

function SelfDot(props: { cx?: number; cy?: number; payload?: { name: string }; dimmed?: boolean }) {
  const { cx = 0, cy = 0, payload, dimmed } = props;
  if (!payload) return null;
  const color = COLORS[payload.name] || '#fff';
  const opacity = dimmed ? 0.08 : 0.35;

  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={4} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="3 2" />
      <text x={cx} y={cy - 10} textAnchor="middle" fill={color} fontSize={10} opacity={0.7}>
        self
      </text>
    </g>
  );
}

interface ScatterTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; x: number; y: number; hover_insight: string } }>;
}

function CustomScatterTooltip({ active, payload }: ScatterTooltipProps) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  if (!d.hover_insight) return null;
  return (
    <div className="bg-neutral-950 border border-neutral-600 rounded-lg p-4 max-w-sm shadow-2xl">
      <p className="font-bold text-white text-base mb-1.5" style={{ color: COLORS[d.name] }}>{d.name}</p>
      <p className="text-neutral-300 text-sm leading-relaxed">{d.hover_insight}</p>
      <p className="text-neutral-500 text-xs mt-2">Position: ({d.x}, {d.y})</p>
    </div>
  );
}

function NameFilter({
  names,
  selected,
  onToggle,
  onAll,
  onNone,
}: {
  names: string[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  onAll: () => void;
  onNone: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <button
        onClick={onAll}
        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
          selected.size === names.length
            ? 'border-neutral-500 text-white bg-neutral-700'
            : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
        }`}
      >
        All
      </button>
      {names.map((name) => {
        const active = selected.has(name);
        const color = COLORS[name];
        return (
          <button
            key={name}
            onClick={() => onToggle(name)}
            className="flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border transition-all"
            style={{
              borderColor: active ? color : '#404040',
              backgroundColor: active ? `${color}15` : 'transparent',
              color: active ? color : '#666',
            }}
          >
            <span
              className="w-2 h-2 rounded-full transition-opacity"
              style={{ backgroundColor: color, opacity: active ? 1 : 0.3 }}
            />
            {name}
          </button>
        );
      })}
      <button
        onClick={onNone}
        className="text-xs px-2.5 py-1 rounded-full border border-neutral-700 text-neutral-500 hover:border-neutral-500 transition-all"
      >
        Clear
      </button>
    </div>
  );
}

function QuadrantChart({
  data,
  selfData,
  xLabel,
  yLabel,
  xDomain,
  yDomain,
  selected,
  xLeftLabel,
  xRightLabel,
  yBottomLabel,
  yTopLabel,
}: {
  data: Array<{ name: string; x: number; y: number; hover_insight: string }>;
  selfData: Array<{ name: string; x: number; y: number }>;
  xLabel: string;
  yLabel: string;
  xDomain: [number, number];
  yDomain: [number, number];
  selected: Set<string>;
  xLeftLabel?: string;
  xRightLabel?: string;
  yBottomLabel?: string;
  yTopLabel?: string;
}) {
  const xMid = (xDomain[0] + xDomain[1]) / 2;
  const yMid = (yDomain[0] + yDomain[1]) / 2;
  const showAll = selected.size === data.length;

  return (
    <ResponsiveContainer width="100%" height={550}>
      <ScatterChart margin={{ top: 30, right: 40, bottom: 50, left: 50 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#222" />

        {/* Quadrant reference lines */}
        <ReferenceLine x={xMid} stroke="#333" strokeWidth={1}>
          {yTopLabel && <Label value={yTopLabel} position="insideTop" fill="#555" fontSize={11} offset={10} />}
          {yBottomLabel && <Label value={yBottomLabel} position="insideBottom" fill="#555" fontSize={11} offset={10} />}
        </ReferenceLine>
        <ReferenceLine y={yMid} stroke="#333" strokeWidth={1}>
          {xLeftLabel && <Label value={xLeftLabel} position="insideLeft" fill="#555" fontSize={11} offset={10} />}
          {xRightLabel && <Label value={xRightLabel} position="insideRight" fill="#555" fontSize={11} offset={10} />}
        </ReferenceLine>

        <XAxis
          type="number"
          dataKey="x"
          domain={xDomain}
          tick={{ fill: '#666', fontSize: 11 }}
          label={{ value: xLabel, position: 'bottom', fill: '#999', fontSize: 13, fontWeight: 500, offset: 25 }}
          stroke="#333"
          tickLine={{ stroke: '#333' }}
        />
        <YAxis
          type="number"
          dataKey="y"
          domain={yDomain}
          tick={{ fill: '#666', fontSize: 11 }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#999', fontSize: 13, fontWeight: 500, offset: -20 }}
          stroke="#333"
          tickLine={{ stroke: '#333' }}
        />
        <Tooltip content={<CustomScatterTooltip />} />

        {/* Connection lines from self to group placement */}
        {data.map((d) => {
          const s = selfData.find((sd) => sd.name === d.name);
          if (!s) return null;
          const dimmed = !showAll && !selected.has(d.name);
          return (
            <Scatter
              key={`line-${d.name}`}
              data={[
                { x: s.x, y: s.y, name: d.name },
                { x: d.x, y: d.y, name: d.name },
              ]}
              fill="transparent"
              line={{
                stroke: dimmed ? '#1a1a1a' : COLORS[d.name] || '#555',
                strokeDasharray: '4 4',
                strokeWidth: 1,
                strokeOpacity: dimmed ? 0.2 : 0.4,
              }}
              lineType="joint"
              shape={() => null}
            >
              <Cell fill="transparent" />
              <Cell fill="transparent" />
            </Scatter>
          );
        })}

        {/* Self-placement dots */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Scatter data={selfData} shape={(props: any) => {
          const dimmed = !showAll && !selected.has(props.payload?.name);
          return <SelfDot {...props} dimmed={dimmed} />;
        }} />

        {/* Group-placement dots with name labels */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Scatter data={data} shape={(props: any) => {
          const name = props.payload?.name;
          const isSelected = selected.has(name);
          const dimmed = !showAll && !isSelected;
          return <NameDot {...props} isSelected={!showAll && isSelected} dimmed={dimmed} />;
        }} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCell, setHoveredCell] = useState<{ from: string; to: string } | null>(null);
  const [roleMapSelected, setRoleMapSelected] = useState<Set<string>>(new Set());
  const [realOneSelected, setRealOneSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((json) => {
        if (json.available) {
          setData(json.data);
          const allNames = NAMES_ORDER.filter((n) => n in json.data.role_map);
          setRoleMapSelected(new Set(allNames));
          setRealOneSelected(new Set(allNames));
        }
        setLoading(false);
      });
  }, []);

  const names = useMemo(() =>
    data ? NAMES_ORDER.filter((n) => n in data.role_map) : [],
    [data]
  );

  const makeToggle = useCallback((setter: React.Dispatch<React.SetStateAction<Set<string>>>) => (name: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const makeAll = useCallback((setter: React.Dispatch<React.SetStateAction<Set<string>>>) => () => {
    setter(new Set(names));
  }, [names]);

  const makeNone = useCallback((setter: React.Dispatch<React.SetStateAction<Set<string>>>) => () => {
    setter(new Set());
  }, []);

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
          <h1 className="text-3xl font-bold mb-3">Waiting for all responses.</h1>
          <p className="text-neutral-500">The dashboard will appear after analysis is generated.</p>
        </div>
      </main>
    );
  }

  const roleMapData = names.map((name) => ({
    name,
    x: data.role_map[name].x,
    y: data.role_map[name].y,
    hover_insight: data.role_map[name].hover_insight,
  }));
  const roleMapSelf = names.map((name) => ({
    name,
    x: data.role_map[name].self_x,
    y: data.role_map[name].self_y,
  }));

  const realOneData = names.map((name) => ({
    name,
    x: data.real_one_map[name].x,
    y: data.real_one_map[name].y,
    hover_insight: data.real_one_map[name].hover_insight,
  }));
  const realOneSelf = names.map((name) => ({
    name,
    x: data.real_one_map[name].self_x,
    y: data.real_one_map[name].self_y,
  }));

  const getHeat = (from: string, to: string) => {
    const entry = data.heatmap.find((h) => h.from === from && h.to === to);
    return entry ? entry.heat : 0;
  };
  const getOneLiner = (from: string, to: string) => {
    const entry = data.heatmap.find((h) => h.from === from && h.to === to);
    return entry ? entry.one_liner : '';
  };

  return (
    <main className="min-h-screen px-4 py-12 max-w-5xl mx-auto">
      <div className="text-center mb-16 fade-in">
        <h1 className="text-5xl font-bold tracking-tight mb-3">The Real Ones</h1>
        <p className="text-neutral-500 text-lg">The results are in.</p>
      </div>

      {/* Personal Summaries */}
      <section className="mb-24 fade-in">
        <h2 className="text-3xl font-bold mb-2">Personal Reviews</h2>
        <p className="text-neutral-500 mb-6">Click a name to see their full personal summary.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {names.map((name) => (
            <Link
              key={name}
              href={`/dashboard/${encodeURIComponent(name)}`}
              className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 hover:border-neutral-600 transition-all group"
            >
              <div className="flex items-center gap-3 mb-1">
                {PROFILE_PICS[name] ? (
                  <Image src={PROFILE_PICS[name]} alt={name} width={36} height={36} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <span className="w-9 h-9 rounded-full" style={{ backgroundColor: COLORS[name] }} />
                )}
                <div>
                  <span className="font-semibold text-white group-hover:underline">{name}</span>
                  <p className="text-neutral-500 text-xs">View summary &rarr;</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 1: The Role Map */}
      <section className="mb-24 fade-in">
        <h2 className="text-3xl font-bold mb-2">The Role Map</h2>
        <p className="text-neutral-500 mb-6">How the group sees each person&apos;s role — giving vs. taking, comfort vs. growth.</p>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 md:p-6">
          <NameFilter
            names={names}
            selected={roleMapSelected}
            onToggle={makeToggle(setRoleMapSelected)}
            onAll={makeAll(setRoleMapSelected)}
            onNone={makeNone(setRoleMapSelected)}
          />
          <QuadrantChart
            data={roleMapData}
            selfData={roleMapSelf}
            xLabel="Taker ← → Giver"
            yLabel="Keeps Comfortable ← → Pushes Up"
            xDomain={[-10, 10]}
            yDomain={[-10, 10]}
            selected={roleMapSelected}
            xLeftLabel="TAKER"
            xRightLabel="GIVER"
            yBottomLabel="COMFORT"
            yTopLabel="GROWTH"
          />
        </div>

        {/* Self vs Group gaps */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {names.map((name) => (
            <Link
              key={name}
              href={`/dashboard/${encodeURIComponent(name)}`}
              className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4 transition-all hover:border-neutral-600"
              style={{ opacity: roleMapSelected.has(name) ? 1 : 0.3 }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[name] }} />
                <p className="font-semibold text-white text-sm hover:underline">{name}</p>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed">{data.self_vs_group[name]?.gap_insight}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 2: The Real One */}
      <section className="mb-24 fade-in">
        <h2 className="text-3xl font-bold mb-2">The Real One</h2>
        <p className="text-neutral-500 mb-6">Impact on your life × trust at your worst moment.</p>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 md:p-6">
          <NameFilter
            names={names}
            selected={realOneSelected}
            onToggle={makeToggle(setRealOneSelected)}
            onAll={makeAll(setRealOneSelected)}
            onNone={makeNone(setRealOneSelected)}
          />
          <QuadrantChart
            data={realOneData}
            selfData={realOneSelf}
            xLabel="Life Impact (low ← → high)"
            yLabel="Worst Moment Trust (low ← → high)"
            xDomain={[0, 10]}
            yDomain={[0, 10]}
            selected={realOneSelected}
            xLeftLabel="LOW IMPACT"
            xRightLabel="HIGH IMPACT"
            yBottomLabel="LOW TRUST"
            yTopLabel="HIGH TRUST"
          />
        </div>
      </section>

      {/* Section 3: Relationship Heatmap */}
      <section className="mb-24 fade-in">
        <h2 className="text-3xl font-bold mb-2">Relationship Heatmap</h2>
        <p className="text-neutral-500 mb-6">How each person feels about every other. Asymmetry is the truth.</p>
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-4 md:p-6 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Column headers */}
            <div className="flex">
              <div className="w-20 shrink-0" />
              {names.map((name) => (
                <Link key={name} href={`/dashboard/${encodeURIComponent(name)}`} className="flex-1 text-center text-xs font-medium pb-2 truncate px-0.5 hover:underline" style={{ color: COLORS[name] }}>
                  {name}
                </Link>
              ))}
            </div>

            {/* Rows */}
            {names.map((from) => (
              <div key={from} className="flex">
                <Link href={`/dashboard/${encodeURIComponent(from)}`} className="w-20 shrink-0 text-xs font-medium flex items-center truncate pr-2 hover:underline" style={{ color: COLORS[from] }}>
                  {from}
                </Link>
                {names.map((to) => {
                  if (from === to) {
                    return (
                      <div key={to} className="flex-1 aspect-square bg-neutral-800/50 m-0.5 rounded" />
                    );
                  }
                  const heat = getHeat(from, to);
                  const isHovered = hoveredCell?.from === from && hoveredCell?.to === to;
                  return (
                    <div
                      key={to}
                      className="flex-1 aspect-square m-0.5 rounded cursor-pointer transition-all relative flex items-center justify-center"
                      style={{
                        backgroundColor: heatColor(heat),
                        transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                        zIndex: isHovered ? 10 : 1,
                        boxShadow: isHovered ? `0 0 12px ${heatColor(heat)}` : 'none',
                      }}
                      onMouseEnter={() => setHoveredCell({ from, to })}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-lg">{heat}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Tooltip */}
          {hoveredCell && (
            <div className="mt-4 p-4 bg-neutral-800 border border-neutral-700 rounded-lg fade-in">
              <p className="text-sm font-semibold text-white mb-1">
                <span style={{ color: COLORS[hoveredCell.from] }}>{hoveredCell.from}</span>
                {' → '}
                <span style={{ color: COLORS[hoveredCell.to] }}>{hoveredCell.to}</span>
                <span className="text-neutral-500 ml-2">({getHeat(hoveredCell.from, hoveredCell.to)}/10)</span>
              </p>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {getOneLiner(hoveredCell.from, hoveredCell.to)}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Section 4: Group Insights */}
      <section className="mb-24 fade-in">
        <h2 className="text-3xl font-bold mb-6">Group Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Our Strength</h3>
            <p className="text-white text-lg leading-relaxed">{data.group_insights.best_thing}</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">The Unspoken Truth</h3>
            <p className="text-white text-lg leading-relaxed">{data.group_insights.unspoken_truth}</p>
          </div>
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6">
            <h3 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">Where We Grow</h3>
            <p className="text-white text-lg leading-relaxed">{data.group_insights.growth_area}</p>
          </div>
        </div>
      </section>

      {/* Section 5: Honor Titles */}
      {data.honor_titles && (
        <section className="mb-24 fade-in">
          <h2 className="text-3xl font-bold mb-2">Honor Titles</h2>
          <p className="text-neutral-500 mb-6">Awarded by the algorithm. No appeals.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(TITLE_META).map(([key, meta]) => {
              const title = data.honor_titles?.[key];
              if (!title) return null;
              const winnerColor = COLORS[title.winner] || '#fff';
              return (
                <div key={key} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 hover:border-neutral-700 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{meta.emoji}</span>
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-white">{meta.label}</h3>
                      <p className="text-xs text-neutral-500">{meta.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    {PROFILE_PICS[title.winner] && (
                      <Image src={PROFILE_PICS[title.winner]} alt={title.winner} width={40} height={40} className="w-10 h-10 rounded-full object-cover" />
                    )}
                    <span className="text-xl font-bold" style={{ color: winnerColor }}>{title.winner}</span>
                  </div>
                  <p className="text-neutral-400 text-sm leading-relaxed">{title.reason}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Section 6: Next Steps */}
      {data.next_steps && data.next_steps.length > 0 && (
        <section className="mb-24 fade-in">
          <h2 className="text-3xl font-bold mb-2">Next Steps</h2>
          <p className="text-neutral-500 mb-6">How to make the bond stronger.</p>
          <div className="space-y-3">
            {data.next_steps.map((step, i) => (
              <div key={i} className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-5 flex gap-4">
                <span className="text-2xl font-bold text-neutral-700 shrink-0 w-8">{i + 1}</span>
                <p className="text-white leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section 7: Avoid */}
      {data.avoid && data.avoid.length > 0 && (
        <section className="mb-20 fade-in">
          <h2 className="text-3xl font-bold mb-2">Avoid</h2>
          <p className="text-neutral-500 mb-6">Habits and patterns to cut before they cut you.</p>
          <div className="space-y-3">
            {data.avoid.map((item, i) => (
              <div key={i} className="bg-red-950/20 border border-red-900/30 rounded-xl p-5">
                <h3 className="text-white font-semibold mb-1">{item.habit}</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">{item.why}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
