import { useRef, useState } from 'react';
import { CHARACTER_DEF_VERSION } from '../../characters/definitions';
import { CALC_VERSION } from '../../divination';
import { GENERATOR_VERSION } from '../../generator/generatePedal';
import { clearAll, exportAll, importBackup } from '../../storage/repo';
import { clearDraft } from '../../state/draft';
import { Disclaimer, Notice } from '../components/common';

export function SettingsPage() {
  const [msg, setMsg] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onExport = async () => {
    try {
      const data = await exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `birth-code-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMsg({ kind: 'ok', text: `${data.persons.length}人分のデータを書き出しました。` });
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message });
    }
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const r = await importBackup(json);
      setMsg({ kind: 'ok', text: `${r.persons}人・診断${r.diagnoses}件を読み込みました（既存データは残し、同じIDは上書き）。` });
    } catch (e) {
      const text = e instanceof SyntaxError ? 'ファイルを読み取れませんでした（JSON形式ではありません）。' : (e as Error).message;
      setMsg({ kind: 'error', text });
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onClear = async () => {
    if (!window.confirm('この端末に保存されているすべての人物・診断データを削除します。元に戻せません。先にバックアップを書き出すことをおすすめします。続けますか？')) return;
    if (!window.confirm('本当にすべて削除しますか？')) return;
    try {
      await clearAll();
      clearDraft();
      setMsg({ kind: 'ok', text: 'すべてのデータを削除しました。' });
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message });
    }
  };

  return (
    <div className="stack">
      <h1>SETTINGS / DATA</h1>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}

      <article className="card stack">
        <h3>バックアップ</h3>
        <p className="small muted">データはこの端末のブラウザ内にのみ保存されます。ブラウザのデータ消去や端末の変更で失われるため、定期的な書き出しをおすすめします。</p>
        <button className="btn" onClick={onExport} data-testid="export">データを書き出す（JSON）</button>
        <button className="btn" onClick={() => fileRef.current?.click()}>データを読み込む</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => onImport(e.target.files?.[0])} data-testid="import-file" />
      </article>

      <article className="card stack">
        <h3>データの削除</h3>
        <p className="small muted">人物ごとの削除は、COLLECTION の人物詳細から行えます。</p>
        <button className="btn danger" onClick={onClear} data-testid="clear-all">すべてのデータを削除</button>
      </article>

      <article className="card stack small">
        <h3>プライバシー</h3>
        <p>生年月日などの入力情報は、この端末内（IndexedDB）にのみ保存し、外部のサーバーへは送信しません。他の人の情報を登録する場合は、ご本人の了解を得てください。</p>
      </article>

      <article className="card stack small">
        <h3>アプリ情報</h3>
        <p>BIRTH CODE（仮称） 開発版 MVP v0.1.0</p>
        <p className="muted">計算ロジック {CALC_VERSION} ／ 生成ロジック {GENERATOR_VERSION} ／ キャラ定義 {CHARACTER_DEF_VERSION}</p>
        <p className="muted">現在の占術はすべて「仮」のサンプルロジックです。動物占い・六星占術・四柱推命は根拠確認中のため未対応です。</p>
      </article>
      <Disclaimer />
    </div>
  );
}
