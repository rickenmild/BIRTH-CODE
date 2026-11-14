import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { MODULES } from '../../divination';
import { runDiagnosis } from '../../diagnosis/runDiagnosis';
import { clearPending, getPending, setDraft } from '../../state/draft';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function LoadingPage() {
  const nav = useNavigate();
  const [pending] = useState(getPending);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!pending) return;
    let alive = true;
    (async () => {
      try {
        const bundle = runDiagnosis(pending.personId, pending.input);
        for (let i = 1; i <= MODULES.length; i++) {
          await sleep(160);
          if (!alive) return;
          setStep(i);
        }
        await sleep(250);
        if (!alive) return;
        setDraft({ personId: pending.personId, isNewPerson: pending.isNewPerson, input: pending.input, bundle, saved: false });
        clearPending();
        nav(`/result/${bundle.diagnosis.id}`, { replace: true });
      } catch (e) {
        console.error('[diagnosis]', e);
        if (alive) setError('診断中に問題が発生しました。もう一度お試しください。');
      }
    })();
    return () => {
      alive = false;
    };
  }, [pending, nav, attempt]);

  if (!pending) return <Navigate to="/profile" replace />;

  return (
    <div className="stack center pad" aria-live="polite" data-testid="loading">
      <h1>DIAGNOSING…</h1>
      <div className="spinner" aria-hidden="true" />
      <ul className="steps">
        {MODULES.map((m, i) => (
          <li key={m.type} className={i < step ? 'done' : ''}>{i < step ? '✔' : '・'} {m.name}</li>
        ))}
      </ul>
      {error && (
        <div className="stack" role="alert">
          <p className="err">{error}</p>
          <button className="btn" onClick={() => { setError(null); setStep(0); setAttempt((a) => a + 1); }}>再試行</button>
          <Link to="/profile" className="btn ghost">入力に戻る</Link>
        </div>
      )}
    </div>
  );
}
