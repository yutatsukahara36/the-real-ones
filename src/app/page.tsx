'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FRIENDS } from '@/lib/constants';

export default function Home() {
  const [selectedName, setSelectedName] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleStart = async () => {
    if (!selectedName) return;
    setChecking(true);
    setError('');

    try {
      const res = await fetch(`/api/check-submission?name=${encodeURIComponent(selectedName)}`);
      const data = await res.json();

      if (data.submitted) {
        setError('Already submitted. You can only respond once.');
        setChecking(false);
        return;
      }

      router.push(`/survey?name=${encodeURIComponent(selectedName)}`);
    } catch {
      setError('Something went wrong. Try again.');
      setChecking(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center fade-in">
        <h1 className="text-5xl font-bold tracking-tight mb-3">The Real Ones</h1>
        <p className="text-neutral-400 text-lg mb-12">An honest look at us.</p>

        <div className="mb-6">
          <select
            value={selectedName}
            onChange={(e) => { setSelectedName(e.target.value); setError(''); }}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-lg text-white appearance-none cursor-pointer focus:outline-none focus:border-neutral-500 transition-colors"
          >
            <option value="">Who are you?</option>
            {FRIENDS.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4 fade-in">{error}</p>
        )}

        <button
          onClick={handleStart}
          disabled={!selectedName || checking}
          className="w-full bg-white text-black font-semibold py-3 px-6 rounded-lg text-lg transition-all hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {checking ? 'Checking...' : 'Start'}
        </button>
      </div>
    </main>
  );
}
