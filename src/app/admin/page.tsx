'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminData {
  friends: string[];
  submitted: { name: string; submitted_at: string }[];
  submittedNames: string[];
  totalResponses: number;
  allSubmitted: boolean;
  hasAnalysis: boolean;
}

interface RawExport {
  respondents: { name: string; submitted_at: string }[];
  selfAnswers: { respondent_name: string; question_id: string; answer: string }[];
  peerAnswers: { respondent_name: string; target_name: string; question_id: string; answer: string }[];
  groupAnswers: { respondent_name: string; question_id: string; answer: string }[];
}

const ADMIN_PASSWORD = 'kojigoons';

const SELF_Q_LABELS: Record<string, string> = {
  '1.1': 'Role in the group',
  '1.2': 'Give & take',
  '1.3': 'If they left tomorrow',
};

const PEER_Q_LABELS: Record<string, string> = {
  '2.1': 'Give & take',
  '2.2': 'Challenge or comfort',
  '2.3': 'Life without them',
  '2.4': 'Call at worst moment',
  '2.5': 'One honest sentence',
};

const GROUP_Q_LABELS: Record<string, string> = {
  '3.1': 'Best thing about the group',
  '3.2': 'Unspoken truth',
  '3.3': 'Where to grow',
};

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 fade-in">
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-neutral-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [data, setData] = useState<AdminData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState('');
  const [rawData, setRawData] = useState<RawExport | null>(null);
  const [viewingResponses, setViewingResponses] = useState(false);
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    confirmLabel: string;
    action: () => Promise<void>;
  } | null>(null);

  const fetchData = useCallback(async () => {
    const res = await fetch('/api/admin');
    setData(await res.json());
  }, []);

  const fetchRaw = useCallback(async () => {
    const res = await fetch('/api/admin/export');
    setRawData(await res.json());
  }, []);

  useEffect(() => {
    if (authed) {
      fetchData();
      fetchRaw();
    }
  }, [authed, fetchData, fetchRaw]);

  const handleExport = async () => {
    const res = await fetch('/api/admin/export');
    const json = await res.json();
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'survey-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGenResult('');
    try {
      const res = await fetch('/api/admin/generate', { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setGenResult('Dashboard generated successfully!');
        fetchData();
      } else {
        setGenResult(`Error: ${json.error}`);
      }
    } catch {
      setGenResult('Failed to generate. Check server logs.');
    }
    setGenerating(false);
  };

  const handleResetAll = () => {
    setConfirmAction({
      title: 'Reset Everything',
      message: 'This will permanently delete ALL survey responses, analysis, and dashboard data. Everyone will need to re-submit. This cannot be undone.',
      confirmLabel: 'Delete Everything',
      action: async () => {
        await fetch('/api/admin/reset', { method: 'POST' });
        await fetchData();
        await fetchRaw();
        setGenResult('');
        setConfirmAction(null);
      },
    });
  };

  const handleResetPerson = (name: string) => {
    setConfirmAction({
      title: `Reset ${name}`,
      message: `This will delete all of ${name}'s responses AND everything others wrote about ${name}. The dashboard analysis will also be cleared. ${name} will need to re-submit.`,
      confirmLabel: `Delete ${name}'s Data`,
      action: async () => {
        await fetch(`/api/admin/reset/${encodeURIComponent(name)}`, { method: 'POST' });
        await fetchData();
        await fetchRaw();
        setGenResult('');
        setConfirmAction(null);
      },
    });
  };

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center fade-in">
          <h1 className="text-3xl font-bold mb-6">Admin</h1>
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (passwordInput === ADMIN_PASSWORD) setAuthed(true);
                else setPasswordError(true);
              }
            }}
            placeholder="Password"
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-lg text-white text-center focus:outline-none focus:border-neutral-500 transition-colors mb-3"
          />
          {passwordError && <p className="text-red-400 text-sm mb-3 fade-in">Wrong password.</p>}
          <button
            onClick={() => {
              if (passwordInput === ADMIN_PASSWORD) setAuthed(true);
              else setPasswordError(true);
            }}
            className="w-full bg-white text-black font-semibold py-3 px-6 rounded-lg transition-all hover:bg-neutral-200"
          >
            Enter
          </button>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    );
  }

  // Build per-person raw data
  const getPersonSelf = (name: string) =>
    rawData?.selfAnswers.filter((a) => a.respondent_name === name) || [];
  const getPersonPeerWritten = (name: string) =>
    rawData?.peerAnswers.filter((a) => a.respondent_name === name) || [];
  const getPersonGroup = (name: string) =>
    rawData?.groupAnswers.filter((a) => a.respondent_name === name) || [];

  return (
    <main className="min-h-screen px-4 py-12 max-w-3xl mx-auto">
      {confirmAction && (
        <ConfirmDialog
          title={confirmAction.title}
          message={confirmAction.message}
          confirmLabel={confirmAction.confirmLabel}
          onConfirm={confirmAction.action}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      <h1 className="text-4xl font-bold mb-2">Admin</h1>
      <p className="text-neutral-500 mb-8">Survey management</p>

      {/* Submission status */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Submissions ({data.submittedNames.length}/{data.friends.length})</h2>
        <div className="space-y-2">
          {data.friends.map((name) => {
            const sub = data.submitted.find((s) => s.name === name);
            return (
              <div key={name} className="flex items-center gap-2 py-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${sub ? 'bg-green-500' : 'bg-neutral-600'}`} />
                <span className={`${sub ? 'text-white' : 'text-neutral-500'} flex-1`}>{name}</span>
                {sub && (
                  <>
                    <span className="text-neutral-600 text-xs">
                      {new Date(sub.submitted_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleResetPerson(name)}
                      className="text-xs text-red-400/60 hover:text-red-400 transition-colors ml-2"
                    >
                      Reset
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-6 mb-6">
        <p className="text-neutral-400">Total responses: <span className="text-white font-semibold">{data.totalResponses}</span></p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mb-10">
        <button
          onClick={() => { setViewingResponses(!viewingResponses); if (!rawData) fetchRaw(); }}
          className="w-full bg-neutral-800 border border-neutral-700 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:bg-neutral-700"
        >
          {viewingResponses ? 'Hide Raw Responses' : 'View Raw Responses'}
        </button>

        <button
          onClick={handleExport}
          className="w-full bg-neutral-800 border border-neutral-700 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:bg-neutral-700"
        >
          Export All Data
        </button>

        <button
          onClick={handleGenerate}
          disabled={!data.allSubmitted || generating}
          className="w-full bg-white text-black font-semibold py-3 px-6 rounded-lg transition-all hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {generating ? 'Generating Dashboard...' : 'Generate Dashboard'}
        </button>

        {!data.allSubmitted && (
          <p className="text-neutral-600 text-sm text-center">
            All 8 friends must submit before generating the dashboard.
          </p>
        )}

        {genResult && (
          <p className={`text-sm text-center fade-in ${genResult.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>
            {genResult}
          </p>
        )}

        {data.hasAnalysis && (
          <a
            href="/dashboard"
            className="w-full text-center bg-neutral-800 border border-neutral-700 text-white font-semibold py-3 px-6 rounded-lg transition-all hover:bg-neutral-700 block"
          >
            View Dashboard
          </a>
        )}

        <div className="border-t border-neutral-800 pt-3 mt-2">
          <button
            onClick={handleResetAll}
            className="w-full bg-red-950/30 border border-red-900/40 text-red-400 font-semibold py-3 px-6 rounded-lg transition-all hover:bg-red-950/50 hover:border-red-800/60"
          >
            Reset Everything
          </button>
          <p className="text-neutral-600 text-xs text-center mt-2">
            Deletes all responses and dashboard data.
          </p>
        </div>
      </div>

      {/* Raw Responses Viewer */}
      {viewingResponses && rawData && (
        <div className="fade-in">
          <h2 className="text-2xl font-bold mb-4">Raw Responses</h2>

          {data.submittedNames.length === 0 && (
            <p className="text-neutral-500">No responses yet.</p>
          )}

          {data.friends.map((name) => {
            if (!data.submittedNames.includes(name)) return null;
            const isExpanded = expandedPerson === name;
            const selfAs = getPersonSelf(name);
            const peerAs = getPersonPeerWritten(name);
            const groupAs = getPersonGroup(name);

            // Group peer answers by target
            const peerByTarget: Record<string, { question_id: string; answer: string }[]> = {};
            for (const a of peerAs) {
              if (!peerByTarget[a.target_name]) peerByTarget[a.target_name] = [];
              peerByTarget[a.target_name].push({ question_id: a.question_id, answer: a.answer });
            }

            return (
              <div key={name} className="mb-4">
                <button
                  onClick={() => setExpandedPerson(isExpanded ? null : name)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-4 flex items-center justify-between hover:border-neutral-700 transition-all"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="font-semibold text-white">{name}</span>
                    <span className="text-neutral-600 text-xs">
                      {selfAs.length + peerAs.length + groupAs.length} answers
                    </span>
                  </div>
                  <span className="text-neutral-500 text-sm">{isExpanded ? '▲' : '▼'}</span>
                </button>

                {isExpanded && (
                  <div className="mt-2 space-y-3 pl-4 border-l-2 border-neutral-800 fade-in">
                    {/* Self answers */}
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
                      <h4 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">About Themselves</h4>
                      {selfAs.map((a) => (
                        <div key={a.question_id} className="mb-3 last:mb-0">
                          <p className="text-xs text-neutral-500 mb-0.5">{SELF_Q_LABELS[a.question_id] || a.question_id}</p>
                          <p className="text-neutral-200 text-sm leading-relaxed">{a.answer}</p>
                        </div>
                      ))}
                    </div>

                    {/* Peer answers grouped by target */}
                    {Object.entries(peerByTarget).map(([target, answers]) => (
                      <div key={target} className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
                        <h4 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">
                          About {target}
                        </h4>
                        {answers.map((a) => (
                          <div key={a.question_id} className="mb-3 last:mb-0">
                            <p className="text-xs text-neutral-500 mb-0.5">{PEER_Q_LABELS[a.question_id] || a.question_id}</p>
                            <p className="text-neutral-200 text-sm leading-relaxed">{a.answer}</p>
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Group answers */}
                    <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-4">
                      <h4 className="text-xs uppercase tracking-widest text-neutral-500 mb-3">About the Group</h4>
                      {groupAs.map((a) => (
                        <div key={a.question_id} className="mb-3 last:mb-0">
                          <p className="text-xs text-neutral-500 mb-0.5">{GROUP_Q_LABELS[a.question_id] || a.question_id}</p>
                          <p className="text-neutral-200 text-sm leading-relaxed">{a.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
