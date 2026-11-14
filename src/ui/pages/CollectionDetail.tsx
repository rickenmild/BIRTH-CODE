import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { formatDateJa, formatDateTimeJa } from '../../lib/date';
import { toProfileInput, fromProfileInput, type FormValues } from '../../lib/validation';
import { setPending } from '../../state/draft';
import { deletePerson, getBundle, getPerson, listDiagnoses, updatePerson } from '../../storage/repo';
import type { Bundle, Diagnosis, Person } from '../../types';
import { Loading, NotFound, Notice } from '../components/common';
import { ProfileForm } from '../components/ProfileForm';
import { BoardView, PedalView, ResultView } from '../components/views';

type Tab = 'pedal' | 'board' | 'result';

export function CollectionDetailPage() {
  const { personId = '' } = useParams();
  const nav = useNavigate();
  const [person, setPerson] = useState<Person | null | undefined>(undefined);
  const [diags, setDiags] = useState<Diagnosis[]>([]);
  const [diagId, setDiagId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [tab, setTab] = useState<Tab>('pedal');
  const [editing, setEditing] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const p = await getPerson(personId);
      setPerson(p);
      if (!p) return;
      const list = await listDiagnoses(personId);
      setDiags(list);
      setDiagId((cur) => (cur && list.some((d) => d.id === cur) ? cur : (list[0]?.id ?? null)));
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message });
      setPerson(null);
    }
  }, [personId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let alive = true;
    if (!diagId) {
      setBundle(null);
      return;
    }
    getBundle(diagId)
      .then((b) => alive && setBundle(b))
      .catch((e: Error) => alive && setMsg({ kind: 'error', text: e.message }));
    return () => {
      alive = false;
    };
  }, [diagId]);

  if (person === undefined) return <Loading />;
  if (person === null) return <NotFound message="この人物は見つかりませんでした。削除された可能性があります。" />;

  const onEdit = async (v: FormValues) => {
    try {
      const input = toProfileInput(v);
      const changedBirth = input.birthDate !== person.birthDate || input.birthTime !== person.birthTime;
      await updatePerson(person.id, input);
      setEditing(false);
      setMsg({ kind: 'ok', text: changedBirth ? '更新しました。生年月日・出生時刻を変えたので、「再診断」で結果を更新できます（過去の結果は履歴に残ります）。' : '更新しました。' });
      await load();
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message });
    }
  };

  const onDelete = async () => {
    if (!window.confirm(`「${person.displayName}」と、その診断結果・ボード・ペダルをすべて削除します。元に戻せません。よろしいですか？`)) return;
    try {
      await deletePerson(person.id);
      nav('/collection', { replace: true });
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message });
    }
  };

  const onRediagnose = () => {
    setPending({ personId: person.id, isNewPerson: false, input: toProfileInput(fromProfileInput(person)) });
    nav('/loading');
  };

  return (
    <div className="stack">
      <Link to="/collection" className="back">← COLLECTION</Link>
      <header className="row between wrap">
        <div>
          <h1 data-testid="person-name">{person.displayName}</h1>
          <p className="muted small">
            {formatDateJa(person.birthDate)}{person.birthTime ? ` ${person.birthTime}` : ''}{person.birthPlace ? ` ／ ${person.birthPlace}` : ''}
            <br />登録 {formatDateTimeJa(person.createdAt)} ・ 更新 {formatDateTimeJa(person.updatedAt)}
          </p>
        </div>
      </header>

      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      {editing ? (
        <article className="card">
          <h3>プロフィールを編集</h3>
          <ProfileForm initial={fromProfileInput(person)} submitLabel="更新する" onSubmit={onEdit} onCancel={() => setEditing(false)} />
        </article>
      ) : (
        <div className="row gap wrap">
          <button className="btn" onClick={() => setEditing(true)} data-testid="edit">編集</button>
          <button className="btn" onClick={onRediagnose} data-testid="rediagnose">再診断</button>
          <button className="btn danger" onClick={onDelete} data-testid="delete">削除</button>
        </div>
      )}

      {diags.length === 0 ? (
        <p className="muted">診断結果がありません。「再診断」で作成できます。</p>
      ) : (
        <>
          {diags.length > 1 && (
            <label className="field">
              <span>診断履歴</span>
              <select value={diagId ?? ''} onChange={(e) => setDiagId(e.target.value)}>
                {diags.map((d, i) => (
                  <option key={d.id} value={d.id}>{formatDateTimeJa(d.executedAt)}{i === 0 ? '（最新）' : ''} ／ {d.calculationVersion}</option>
                ))}
              </select>
            </label>
          )}
          <div className="subtabs" role="tablist">
            {([['pedal', 'ORIGINAL PEDAL'], ['board', 'EFFECT BOARD'], ['result', '診断結果']] as Array<[Tab, string]>).map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}</button>
            ))}
          </div>
          {!bundle ? <Loading /> : tab === 'pedal' ? <PedalView bundle={bundle} /> : tab === 'board' ? <BoardView bundle={bundle} /> : <ResultView bundle={bundle} />}
        </>
      )}
    </div>
  );
}
