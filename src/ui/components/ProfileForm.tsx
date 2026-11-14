import { useState, type FormEvent } from 'react';
import { MIN_YEAR, validateProfile, type FormErrors, type FormValues } from '../../lib/validation';
import { todayLocal } from '../../lib/date';

interface Props {
  initial: FormValues;
  submitLabel: string;
  onSubmit: (v: FormValues) => void;
  onChange?: (v: FormValues) => void;
  onCancel?: () => void;
  busy?: boolean;
}

export function ProfileForm({ initial, submitLabel, onSubmit, onChange, onCancel, busy }: Props) {
  const [v, setV] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [open, setOpen] = useState(Boolean(initial.birthTime || initial.birthPlace));

  const set = (k: keyof FormValues, val: string) => {
    const next = { ...v, [k]: val };
    setV(next);
    onChange?.(next);
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateProfile(v);
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSubmit(v);
  };

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <label className="field">
        <span>表示名・ニックネーム</span>
        <input
          name="displayName"
          value={v.displayName}
          onChange={(e) => set('displayName', e.target.value)}
          maxLength={40}
          autoComplete="off"
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? 'err-name' : undefined}
        />
        {errors.displayName && <em id="err-name" className="err">{errors.displayName}</em>}
      </label>

      <label className="field">
        <span>生年月日（必須）</span>
        <input
          name="birthDate"
          type="date"
          value={v.birthDate}
          min={`${MIN_YEAR}-01-01`}
          max={todayLocal()}
          onChange={(e) => set('birthDate', e.target.value)}
          aria-invalid={!!errors.birthDate}
          aria-describedby={errors.birthDate ? 'err-date' : undefined}
        />
        {errors.birthDate && <em id="err-date" className="err">{errors.birthDate}</em>}
      </label>

      <button type="button" className="link-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        {open ? '▼' : '▶'} 出生時刻・出生地（任意）
      </button>
      {open && (
        <div className="stack optional">
          <p className="muted small">未入力でも診断できます。必要な占術を使うときだけ、計算の精度向上に使われます（現在は計算に使用しません）。</p>
          <label className="field">
            <span>出生時刻</span>
            <input name="birthTime" type="time" value={v.birthTime} onChange={(e) => set('birthTime', e.target.value)} aria-invalid={!!errors.birthTime} />
            {errors.birthTime && <em className="err">{errors.birthTime}</em>}
          </label>
          <label className="field">
            <span>出生地</span>
            <input name="birthPlace" value={v.birthPlace} onChange={(e) => set('birthPlace', e.target.value)} maxLength={60} autoComplete="off" />
            {errors.birthPlace && <em className="err">{errors.birthPlace}</em>}
          </label>
        </div>
      )}

      <div className="row gap">
        {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>キャンセル</button>}
        <button type="submit" className="btn primary grow" disabled={busy}>{submitLabel}</button>
      </div>
    </form>
  );
}
