'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { FRIENDS, SELF_QUESTIONS, PEER_QUESTIONS, GROUP_QUESTIONS, MIN_ANSWER_LENGTH } from '@/lib/constants';

type FriendName = typeof FRIENDS[number];

interface Step {
  type: 'self' | 'peer' | 'group';
  questionId: string;
  question: string;
  targetName?: string;
}

function SurveyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const name = searchParams.get('name') as FriendName;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const others = useMemo(() =>
    FRIENDS.filter((f) => f !== name), [name]
  );

  const steps = useMemo((): Step[] => {
    const s: Step[] = [];

    // Self questions
    for (const [qid, question] of Object.entries(SELF_QUESTIONS)) {
      s.push({ type: 'self', questionId: qid, question });
    }

    // Peer questions
    for (const other of others) {
      for (const [qid, questionFn] of Object.entries(PEER_QUESTIONS)) {
        s.push({ type: 'peer', questionId: qid, question: questionFn(other), targetName: other });
      }
    }

    // Group questions
    for (const [qid, question] of Object.entries(GROUP_QUESTIONS)) {
      s.push({ type: 'group', questionId: qid, question });
    }

    return s;
  }, [others]);

  const totalSteps = steps.length;
  const step = steps[currentStep];
  const progress = ((currentStep) / totalSteps) * 100;

  const answerKey = step
    ? step.type === 'peer'
      ? `${step.type}:${step.targetName}:${step.questionId}`
      : `${step.type}:${step.questionId}`
    : '';

  const currentAnswer = answers[answerKey] || '';
  const canProceed = currentAnswer.length >= MIN_ANSWER_LENGTH;

  useEffect(() => {
    if (!name || !FRIENDS.includes(name)) {
      router.push('/');
    }
  }, [name, router]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    const selfAnswers: Record<string, string> = {};
    const peerAnswers: Record<string, Record<string, string>> = {};
    const groupAnswers: Record<string, string> = {};

    for (const [key, value] of Object.entries(answers)) {
      const parts = key.split(':');
      if (parts[0] === 'self') {
        selfAnswers[parts[1]] = value;
      } else if (parts[0] === 'peer') {
        if (!peerAnswers[parts[1]]) peerAnswers[parts[1]] = {};
        peerAnswers[parts[1]][parts[2]] = value;
      } else if (parts[0] === 'group') {
        groupAnswers[parts[1]] = value;
      }
    }

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          respondent: name,
          selfAnswers,
          peerAnswers,
          groupAnswers,
        }),
      });

      if (res.ok) {
        setDone(true);
      } else {
        const data = await res.json();
        alert(data.error || 'Submission failed');
        setSubmitting(false);
      }
    } catch {
      alert('Submission failed. Try again.');
      setSubmitting(false);
    }
  };

  if (!name) return null;

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center fade-in">
          <h1 className="text-4xl font-bold mb-4">Done.</h1>
          <p className="text-neutral-400 text-lg">Your honesty matters.</p>
        </div>
      </main>
    );
  }

  const sectionLabel = step.type === 'self'
    ? 'About You'
    : step.type === 'peer'
      ? `About ${step.targetName}`
      : 'The Group';

  return (
    <main className="min-h-screen flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-neutral-800 z-50">
        <div
          className="h-full bg-white progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step counter */}
      <div className="fixed top-4 right-4 text-neutral-500 text-sm z-50">
        {currentStep + 1} / {totalSteps}
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-xl w-full fade-in" key={currentStep}>
          {/* Section label */}
          <div className="mb-2">
            <span className="text-xs uppercase tracking-widest text-neutral-500">
              {sectionLabel}
            </span>
          </div>

          {/* Target name for peer questions */}
          {step.type === 'peer' && step.targetName && (
            <h2 className="text-3xl font-bold mb-4 text-white">
              {step.targetName}
            </h2>
          )}

          {/* Question */}
          <h3 className="text-xl md:text-2xl font-medium mb-8 text-neutral-200 leading-relaxed">
            {step.question}
          </h3>

          {/* Answer */}
          <textarea
            value={currentAnswer}
            onChange={(e) =>
              setAnswers((prev) => ({ ...prev, [answerKey]: e.target.value }))
            }
            placeholder="Be honest..."
            rows={5}
            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-3 text-lg text-white resize-none focus:outline-none focus:border-neutral-500 transition-colors placeholder:text-neutral-600"
          />

          {/* Character count */}
          <div className="flex justify-between items-center mt-2 mb-8">
            <span className={`text-xs ${currentAnswer.length < MIN_ANSWER_LENGTH ? 'text-neutral-600' : 'text-neutral-500'}`}>
              {currentAnswer.length < MIN_ANSWER_LENGTH
                ? `${MIN_ANSWER_LENGTH - currentAnswer.length} more characters needed`
                : 'Good to go'}
            </span>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="px-6 py-3 rounded-lg border border-neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canProceed || submitting}
              className="flex-1 bg-white text-black font-semibold py-3 px-6 rounded-lg text-lg transition-all hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting
                ? 'Submitting...'
                : currentStep === totalSteps - 1
                  ? 'Submit'
                  : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SurveyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-500">Loading...</p>
      </main>
    }>
      <SurveyContent />
    </Suspense>
  );
}
