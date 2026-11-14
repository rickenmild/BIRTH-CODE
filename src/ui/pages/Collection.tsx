import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCharacter } from '../../characters/definitions';
import { formatDateTimeJa } from '../../lib/date';
import { listCollection, type CollectionEntry } from '../../storage/repo';
import { CharacterThumb, Loading, Notice } from '../components/common';
import { PedalSvg } from '../components/PedalSvg';

type Sort = 'updated' | 'created' | 'name';

function mainType(e: CollectionEntry): string {
  const r = e.latestDiagnosis?.divinationResults.find((x) => x.status === 'provisional' || x.status === 'confirmed');
  return r?.resultLabel ? `${r.name.replace(/（.*）/, '')}：${r.resultLabel}` : '診断なし';
}

export function CollectionPage() {
  const [entries, setEntries] = useState<CollectionEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<Sort>('updated');

  useEffect(() => {
    let alive = true;
    listCollection()
      .then((l) => alive && setEntries(l))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  const shown = useMemo(() => {
    if (!entries) return [];
    const kw = q.trim().toLowerCase();
    const f = entries.filter((e) => !kw || e.person.displayName.toLowerCase().includes(kw) || (e.latestPedal?.name ?? '').toLowerCase().includes(kw));
    return [...f].sort((a, b) =>
      sort === 'name'
        ? a.person.displayName.localeCompare(b.person.displayName, 'ja')
        : sort === 'created'
          ? b.person.createdAt.localeCompare(a.person.createdAt)
          : b.person.updatedAt.localeCompare(a.person.updatedAt),
    );
  }, [entries, q, sort]);

  if (error) return <Notice kind="error">{error}</Notice>;
  if (!entries) return <Loading />;

  return (
    <div className="stack">
      <h1>PEDAL COLLECTION</h1>
      <div className="row gap">
        <input className="grow" type="search" placeholder="名前で検索" value={q} onChange={(e) => setQ(e.target.value)} aria-label="名前で検索" />
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="並び替え">
          <option value="updated">更新が新しい順</option>
          <option value="created">登録が新しい順</option>
          <option value="name">名前順</option>
        </select>
      </div>

      {entries.length === 0 ? (
        <div className="stack center pad">
          <p>まだ誰も登録されていません。</p>
          <Link to="/profile" className="btn primary">診断をはじめる</Link>
        </div>
      ) : shown.length === 0 ? (
        <p className="muted center pad">該当する人物がいません。</p>
      ) : (
        <ul className="coll-grid" data-testid="collection-list">
          {shown.map((e) => (
            <li key={e.person.id}>
              <Link to={`/collection/${e.person.id}`} className="coll-card" data-testid="collection-item">
                {e.latestPedal ? <PedalSvg spec={e.latestPedal.visualParts.spec} size={120} title={e.latestPedal.name} /> : <CharacterThumb characterCode={null} size={120} label="診断なし" />}
                <b className="coll-name">{e.person.displayName}</b>
                <span className="small">{e.latestPedal?.name ?? '—'}</span>
                <span className="muted small">{mainType(e)}</span>
                <span className="muted small">{formatDateTimeJa(e.person.updatedAt)}</span>
                {e.latestPedal && getCharacter(e.latestPedal.characterCode) === null && <span className="badge badge-error">素材欠損</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/profile" className="btn">＋ 人物を追加</Link>
    </div>
  );
}
