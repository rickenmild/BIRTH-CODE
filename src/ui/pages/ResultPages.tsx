import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createPerson, findPersonsByBirthDate, getPerson, saveBundle } from '../../storage/repo';
import { clearFormDraft, getDraft, markDraftSaved } from '../../state/draft';
import { useBundle } from '../../state/useBundle';
import type { Person } from '../../types';
import { BoardView, PedalView, ResultView } from '../components/views';
import { Loading, NotFound, Notice } from '../components/common';
import { ResultTabs } from '../components/Layout';

function useResultPage(current: 'result' | 'board' | 'pedal') {
  const { id } = useParams();
  const { state, reload } = useBundle(id);
  return { id: id ?? '', state, reload, current };
}

function SaveBar({ id, reload }: { id: string; reload: () => void }) {
  const nav = useNavigate();
  const [dups, setDups] = useState<Person[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const draft = getDraft();
  if (!draft || draft.bundle.diagnosis.id !== id) return null;

  const doSave = async () => {
    setBusy(true);
    setError(null);
    try {
      const person = draft.isNewPerson ? createPerson(draft.personId, draft.input) : null;
      if (!draft.isNewPerson && !(await getPerson(draft.personId))) {
        throw new Error('再診断の対象の人物が見つかりません（削除された可能性があります）。');
      }
      await saveBundle(draft.bundle, person);
      markDraftSaved();
      clearFormDraft();
      reload();
      nav(`/collection/${draft.personId}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onSave = async () => {
    setError(null);
    if (draft.isNewPerson && !dups) {
      try {
        const same = await findPersonsByBirthDate(draft.input.birthDate);
        if (same.length > 0) {
          setDups(same);
          return;
        }
      } catch (e) {
        setError((e as Error).message);
        return;
      }
    }
    await doSave();
  };

  return (
    <div className="savebar">
      {error && <Notice kind="error">{error}<br />保存されていません。もう一度お試しください。</Notice>}
      {dups && (
        <Notice>
          同じ生年月日の人物がすでに登録されています（{dups.map((p) => p.displayName).join('、')}）。重複の可能性がありますが、別の人物として保存できます。
        </Notice>
      )}
      <button className="btn primary" onClick={onSave} disabled={busy} data-testid="save-person">
        {dups ? '別人物として保存する' : draft.isNewPerson ? 'コレクションに保存する' : 'この診断を保存する'}
      </button>
      {dups && <button className="btn ghost" onClick={() => setDups(null)}>やめる</button>}
    </div>
  );
}

function Frame({ p, children }: { p: ReturnType<typeof useResultPage>; children: (b: import('../../types').Bundle) => React.ReactNode }) {
  const { state } = p;
  if (state.status === 'loading') return <Loading />;
  if (state.status === 'missing') return <NotFound message="診断結果が見つかりませんでした。ページを再読み込みした場合、保存前の結果は消えることがあります。" />;
  if (state.status === 'error') return <Notice kind="error">{state.message}</Notice>;
  return (
    <div className="stack">
      <ResultTabs id={p.id} current={p.current} />
      {state.isDraft && !state.saved && <Notice>この結果はまだ保存されていません。</Notice>}
      {state.saved && state.isDraft && (
        <Notice kind="ok">保存済みです。<Link to={`/collection/${state.bundle.diagnosis.personId}`}>コレクションで見る</Link></Notice>
      )}
      {children(state.bundle)}
      {state.isDraft && !state.saved && <SaveBar id={p.id} reload={p.reload} />}
    </div>
  );
}

export function ResultPage() {
  const p = useResultPage('result');
  return <Frame p={p}>{(b) => <ResultView bundle={b} />}</Frame>;
}
export function BoardPage() {
  const p = useResultPage('board');
  return <Frame p={p}>{(b) => <BoardView bundle={b} />}</Frame>;
}
export function PedalPage() {
  const p = useResultPage('pedal');
  return <Frame p={p}>{(b) => <PedalView bundle={b} />}</Frame>;
}
