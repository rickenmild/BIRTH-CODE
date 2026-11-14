import { useState } from 'react';
import { getCharacter } from '../../characters/definitions';
import { formatDateJa } from '../../lib/date';
import type { Bundle, DivinationResult, StatBlock } from '../../types';
import { CharacterThumb, Disclaimer, StatusBadge } from './common';
import { PedalSvg } from './PedalSvg';

// ---------------- DIVINATION RESULT ----------------

export function ResultCard({ r, characterCode }: { r: DivinationResult; characterCode: string | null }) {
  const ch = getCharacter(characterCode);
  return (
    <article className={`card result-card status-${r.status}`} data-testid={`result-${r.divinationType}`}>
      <header className="row between">
        <h3>{r.name}</h3>
        <StatusBadge status={r.status} />
      </header>
      {r.status === 'provisional' || r.status === 'confirmed' ? (
        <>
          <div className="row gap">
            <CharacterThumb characterCode={characterCode} size={84} />
            <div className="grow">
              <p className="big">{r.resultLabel}</p>
              {ch && <p className="muted small">{ch.name}（{ch.effectType}）</p>}
              <p>{r.description}</p>
            </div>
          </div>
          <div className="two-col">
            <div>
              <h4>特徴・強み</h4>
              <ul>{r.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
            <div>
              <h4>注意点・苦手傾向</h4>
              <ul>{r.cautions.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
        </>
      ) : null}
      {r.warnings.length > 0 && (
        <ul className="warn small">
          {r.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}
    </article>
  );
}

export function ResultView({ bundle }: { bundle: Bundle }) {
  const { diagnosis, board } = bundle;
  return (
    <section className="stack">
      <p className="muted small">
        {diagnosis.inputSnapshot.displayName} / {formatDateJa(diagnosis.inputSnapshot.birthDate)}
        {diagnosis.inputSnapshot.birthTime ? ` ${diagnosis.inputSnapshot.birthTime}` : ''} ・ 計算ロジック {diagnosis.calculationVersion}
      </p>
      {diagnosis.divinationResults.map((r) => (
        <ResultCard key={r.divinationType} r={r} characterCode={board.items.find((i) => i.divinationType === r.divinationType)?.characterCode ?? null} />
      ))}
      <Disclaimer />
    </section>
  );
}

// ---------------- MY EFFECT BOARD ----------------

export function BoardView({ bundle }: { bundle: Bundle }) {
  const { board, diagnosis } = bundle;
  const [sel, setSel] = useState<number | null>(null);
  const picked = sel !== null ? diagnosis.divinationResults[sel] : null;
  const pickedCode = sel !== null ? board.items[sel]?.characterCode ?? null : null;

  return (
    <section className="stack">
      <div className="board" aria-label="MY EFFECT BOARD">
        <div className="board-grid">
          {board.items.map((item, i) => {
            const r = diagnosis.divinationResults[i];
            const ch = getCharacter(item.characterCode);
            const active = sel === i;
            return (
              <button
                key={item.divinationType}
                type="button"
                className={`slot ${active ? 'active' : ''} ${ch ? '' : 'empty'}`}
                onClick={() => setSel(active ? null : i)}
                aria-pressed={active}
                data-testid={`slot-${item.divinationType}`}
              >
                <CharacterThumb characterCode={item.characterCode} size={104} label={r.status === 'error' ? 'エラー' : '未対応'} />
                <span className="slot-name">{r.name}</span>
                <span className="slot-sub">{r.resultLabel ?? (r.status === 'error' ? '計算エラー' : '未対応')}</span>
                {ch && r.status === 'provisional' && <span className="badge badge-provisional">仮</span>}
              </button>
            );
          })}
        </div>
        <div className="cable" aria-hidden="true" />
      </div>
      <p className="muted small center">キャラクターをタップすると、その占術の診断詳細を表示します。</p>
      {picked ? (
        <ResultCard r={picked} characterCode={pickedCode} />
      ) : null}
      <Disclaimer />
    </section>
  );
}

// ---------------- MY ORIGINAL PEDAL ----------------

const STAT_KEYS: Array<keyof StatBlock> = ['GAIN', 'TONE', 'DEPTH', 'SUSTAIN', 'MIX', 'LEVEL'];
const SOURCE_LABEL: Record<string, string> = {
  numerology: '数秘術', eto: '十二支', western: '太陽星座', animal: '動物占い', sixstar: '六星占術', shichu: '四柱推命', seed: '固定シード',
};

export function PedalView({ bundle }: { bundle: Bundle }) {
  const { pedal } = bundle;
  return (
    <section className="stack">
      <div className="hero" data-testid="original-pedal">
        <PedalSvg spec={pedal.visualParts.spec} size={220} title={pedal.name} />
        <h2 className="pedal-name" data-testid="pedal-name">{pedal.name}</h2>
        <p className="muted">{pedal.effectType} ／ {pedal.attributes.category}</p>
      </div>
      <article className="card">
        <h3>プロフィール</h3>
        <p>{pedal.profile}</p>
      </article>
      <article className="card">
        <h3>能力値（娯楽上の指標）</h3>
        <div className="stats">
          {STAT_KEYS.map((k) => (
            <div key={k} className="stat">
              <span>{k}</span>
              <div className="bar"><div style={{ width: `${pedal.stats[k]}%` }} /></div>
              <b>{pedal.stats[k]}</b>
            </div>
          ))}
        </div>
      </article>
      <article className="card">
        <h3>どの占術がどこに反映された？</h3>
        <ul className="explain">
          {pedal.explanations.map((e, i) => (
            <li key={i}>
              <span className="tag">{SOURCE_LABEL[e.source] ?? e.source}</span>
              <b>{e.part}</b>：{e.text}
            </li>
          ))}
        </ul>
      </article>
      <details className="card small muted">
        <summary>生成情報</summary>
        <p>生成ロジック: {pedal.generatorVersion}</p>
        <p>使用パーツID: {pedal.visualParts.partIds.join(', ')}</p>
      </details>
      <Disclaimer />
    </section>
  );
}
