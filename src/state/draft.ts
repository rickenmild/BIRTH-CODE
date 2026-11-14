import type { Bundle, ProfileInput } from '../types';

/**
 * 診断直後〜保存前の状態を sessionStorage に保持する。
 * 戻る操作・再読込をしても、未保存の診断結果や入力内容が消えないようにするため。
 */
export interface Draft {
  personId: string;
  /** true = 新規人物（保存時に人物を新規登録）。false = 保存済み人物の再診断 */
  isNewPerson: boolean;
  input: ProfileInput;
  bundle: Bundle;
  saved: boolean;
}

export interface Pending {
  personId: string;
  isNewPerson: boolean;
  input: ProfileInput;
}

const K_DRAFT = 'bc.draft';
const K_PENDING = 'bc.pending';
const K_FORM = 'bc.form';

function read<T>(key: string): T | null {
  try {
    const s = sessionStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, v: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* 保存不可の環境でも画面遷移は継続する */
  }
}
function remove(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

export const getDraft = () => read<Draft>(K_DRAFT);
export const setDraft = (d: Draft) => write(K_DRAFT, d);
export const clearDraft = () => remove(K_DRAFT);
export const markDraftSaved = () => {
  const d = getDraft();
  if (d) setDraft({ ...d, saved: true });
};

export const getPending = () => read<Pending>(K_PENDING);
export const setPending = (p: Pending) => write(K_PENDING, p);
export const clearPending = () => remove(K_PENDING);

export const getFormDraft = () =>
  read<{ displayName: string; birthDate: string; birthTime: string; birthPlace: string }>(K_FORM);
export const setFormDraft = (v: { displayName: string; birthDate: string; birthTime: string; birthPlace: string }) =>
  write(K_FORM, v);
export const clearFormDraft = () => remove(K_FORM);
