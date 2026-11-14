import type { ProfileInput } from '../types';
import { parseHM, parseYMD, todayLocal } from './date';

export interface FormValues {
  displayName: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
}

export type FormErrors = Partial<Record<keyof FormValues, string>>;

export const MIN_YEAR = 1900;

export function validateProfile(v: FormValues, today: string = todayLocal()): FormErrors {
  const e: FormErrors = {};
  const name = v.displayName.trim();
  if (!name) e.displayName = '表示名を入力してください。';
  else if (name.length > 30) e.displayName = '表示名は30文字以内で入力してください。';

  if (!v.birthDate) {
    e.birthDate = '生年月日を入力してください。';
  } else {
    const p = parseYMD(v.birthDate);
    if (!p) e.birthDate = '存在しない日付です。年月日を確認してください。';
    else if (p.y < MIN_YEAR) e.birthDate = `${MIN_YEAR}年以降の日付を入力してください。`;
    else if (v.birthDate > today) e.birthDate = '未来の日付は入力できません。';
  }

  if (v.birthTime && !parseHM(v.birthTime)) e.birthTime = '出生時刻は「HH:MM」の形式で入力してください。';
  if (v.birthPlace.length > 50) e.birthPlace = '出生地は50文字以内で入力してください。';
  return e;
}

export function toProfileInput(v: FormValues): ProfileInput {
  return {
    displayName: v.displayName.trim(),
    birthDate: v.birthDate,
    birthTime: v.birthTime ? v.birthTime : null,
    birthPlace: v.birthPlace.trim() ? v.birthPlace.trim() : null,
  };
}

export function fromProfileInput(p: ProfileInput): FormValues {
  return {
    displayName: p.displayName,
    birthDate: p.birthDate,
    birthTime: p.birthTime ?? '',
    birthPlace: p.birthPlace ?? '',
  };
}
