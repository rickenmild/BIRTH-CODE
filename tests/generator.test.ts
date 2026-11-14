import { describe, expect, it } from 'vitest';
import { characterCodeFor, getCharacter } from '../src/characters/definitions';
import { runDiagnosis } from '../src/diagnosis/runDiagnosis';
import { runAllDivinations } from '../src/divination';
import { generatePedalCore } from '../src/generator/generatePedal';

const input = (birthDate: string, birthTime: string | null = null) => ({ displayName: 'x', birthDate, birthTime, birthPlace: null });

describe('オリジナルペダル生成の再現性', () => {
  it('同一入力なら100回とも同一の定義になる', () => {
    const results = runAllDivinations(input('1990-01-01'));
    const first = JSON.stringify(generatePedalCore(input('1990-01-01'), results));
    for (let i = 0; i < 100; i++) {
      expect(JSON.stringify(generatePedalCore(input('1990-01-01'), runAllDivinations(input('1990-01-01'))))).toBe(first);
    }
  });

  it('別の人物ID・別の診断実行でも、同条件なら同じペダルになる', () => {
    const a = runDiagnosis('person-a', input('1985-07-23'), '2026-01-01T00:00:00.000Z');
    const b = runDiagnosis('person-b', input('1985-07-23'), '2026-06-01T00:00:00.000Z');
    const strip = (p: typeof a.pedal) => ({ ...p, id: '', personId: '', diagnosisId: '', createdAt: '' });
    expect(strip(a.pedal)).toEqual(strip(b.pedal));
  });

  it('生年月日が違うと結果が変わりうる（全日同一ではない）', () => {
    const names = new Set<string>();
    for (let d = 1; d <= 28; d++) {
      const s = `1990-03-${String(d).padStart(2, '0')}`;
      names.add(generatePedalCore(input(s), runAllDivinations(input(s))).name);
    }
    expect(names.size).toBeGreaterThan(5);
  });

  it('ロジックバージョンとパーツIDを保存する', () => {
    const r = runDiagnosis('p', input('1990-01-01'));
    expect(r.pedal.generatorVersion).toMatch(/^gen-/);
    expect(r.pedal.visualParts.partIds.length).toBeGreaterThan(5);
    expect(r.diagnosis.calculationVersion).toMatch(/^calc-/);
  });

  it('能力値は5〜99の範囲、説明には占術要素が含まれる', () => {
    const r = runDiagnosis('p', input('2001-09-09'));
    for (const v of Object.values(r.pedal.stats)) {
      expect(v).toBeGreaterThanOrEqual(5);
      expect(v).toBeLessThanOrEqual(99);
    }
    expect(r.pedal.explanations.some((e) => e.source === 'numerology')).toBe(true);
    expect(getCharacter(r.pedal.characterCode)).not.toBeNull();
  });
});

describe('ボード', () => {
  it('未対応の占術にはキャラを割り当てない', () => {
    const { board, diagnosis } = runDiagnosis('p', input('1990-01-01'));
    expect(board.items).toHaveLength(6);
    for (const item of board.items) {
      const r = diagnosis.divinationResults.find((x) => x.divinationType === item.divinationType)!;
      if (r.status === 'unsupported') expect(item.characterCode).toBeNull();
      else expect(getCharacter(item.characterCode)).not.toBeNull();
    }
  });

  it('キャラ対応は定義済みの全コードに解決できる', () => {
    for (let y = 1990; y <= 1991; y++) {
      for (const r of runAllDivinations(input(`${y}-05-05`))) {
        const c = characterCodeFor(r);
        if (c) expect(getCharacter(c)).not.toBeNull();
      }
    }
  });
});
