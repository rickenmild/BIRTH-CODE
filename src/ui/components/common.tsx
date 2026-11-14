import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getCharacter } from '../../characters/definitions';
import type { ResultStatus } from '../../types';
import { PedalPlaceholder, PedalSvg } from './PedalSvg';

export function Disclaimer() {
  return (
    <p className="disclaimer">
      ※ 占い結果・属性・スコアは娯楽・自己理解のためのもので、科学的な性格判定や医学的・心理学的評価ではありません。
    </p>
  );
}

const STATUS_LABEL: Record<ResultStatus, string> = {
  confirmed: '確定',
  provisional: '仮',
  unsupported: '未対応',
  error: 'エラー',
};

export function StatusBadge({ status }: { status: ResultStatus }) {
  return <span className={`badge badge-${status}`}>{STATUS_LABEL[status]}</span>;
}

export function CharacterThumb({ characterCode, size = 96, label }: { characterCode: string | null; size?: number; label?: string }) {
  const c = getCharacter(characterCode);
  if (!c) return <PedalPlaceholder size={size} label={label ?? '未対応'} />;
  return <PedalSvg spec={c.visual} size={size} title={c.name} />;
}

export function Notice({ kind = 'info', children }: { kind?: 'info' | 'error' | 'ok'; children: ReactNode }) {
  return (
    <div className={`notice notice-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
}

export function Loading({ text = '読み込み中…' }: { text?: string }) {
  return <p className="muted center pad">{text}</p>;
}

export function NotFound({ message = 'データが見つかりませんでした。' }: { message?: string }) {
  return (
    <div className="stack center pad">
      <p>{message}</p>
      <Link className="btn" to="/">HOMEへ戻る</Link>
    </div>
  );
}
