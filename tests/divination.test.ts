import { describe, expect, it } from 'vitest';
import { etoIndex, eto, BRANCHES } from '../src/divination/eto';
import { lifePathNumber, numerology } from '../src/divination/numerology';
import { isCuspDate, signIndex, SIGNS, western } from '../src/divination/western';
import { runAllDivinations } from '../src/divination';

const sign = (d: string) => SIGNS[signIndex(d)].name;

describe('数秘術（仮）', () => {
  it.each([
    ['1990-01-01', 3],
    ['1989-12-31', 7],
    ['2000-02-29', 6], // うるう日
    ['2000-01-08', 11],
    ['1990-10-02', 22],
    ['1999-12-02', 33], // 1+9+9+9+1+2+0+2 = 33
    ['1999-12-03', 7], // 34 → 7
    ['1980-05-06', 11], // 29 → 11
  ])('%s → %i', (d, n) => expect(lifePathNumber(d)).toBe(n));

  it('仮ステータスと注記を持つ', () => {
    const r = numerology.calculate({ birthDate: '1990-01-01', birthTime: null, birthPlace: null });
    expect(r.status).toBe('provisional');
    expect(r.warnings.join('')).toContain('仮');
  });
});

describe('十二支（仮・立春2/4固定）', () => {
  it.each([
    ['2024-03-01', '辰'],
    ['2024-02-03', '卯'], // 立春前は前年
    ['2024-02-04', '辰'],
    ['2000-01-15', '卯'], // 年またぎ（1999年扱い）
    ['2000-02-29', '辰'],
    ['1996-12-31', '子'],
  ])('%s → %s', (d, b) => expect(BRANCHES[etoIndex(d)]).toBe(b));

  it('境界日付近は注意文が付く', () => {
    const r = eto.calculate({ birthDate: '2024-02-04', birthTime: null, birthPlace: null });
    expect(r.warnings.join('')).toContain('立春');
  });
});

describe('太陽星座（仮・簡易表）', () => {
  it.each([
    ['1990-03-20', '魚座'],
    ['1990-03-21', '牡羊座'],
    ['1990-12-21', '射手座'],
    ['1990-12-22', '山羊座'],
    ['1990-12-31', '山羊座'],
    ['1990-01-01', '山羊座'], // 年またぎ
    ['1990-01-19', '山羊座'],
    ['1990-01-20', '水瓶座'],
    ['2000-02-29', '魚座'],
    ['1990-07-22', '蟹座'],
    ['1990-07-23', '獅子座'],
  ])('%s → %s', (d, s) => expect(sign(d)).toBe(s));

  it('全366日で星座が決まる', () => {
    for (let m = 1; m <= 12; m++) {
      const dim = new Date(2000, m, 0).getDate();
      for (let d = 1; d <= dim; d++) {
        const s = `2000-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        expect(signIndex(s)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('境界付近を検出して注意文を付ける', () => {
    expect(isCuspDate('1990-03-21')).toBe(true);
    expect(isCuspDate('1990-03-20')).toBe(true);
    expect(isCuspDate('1990-04-05')).toBe(false);
    const r = western.calculate({ birthDate: '1990-03-21', birthTime: null, birthPlace: null });
    expect(r.warnings.join('')).toContain('境目');
  });
});

describe('runAllDivinations', () => {
  it('6占術を返し、未対応は誤った結果を出さない', () => {
    const rs = runAllDivinations({ birthDate: '1990-01-01', birthTime: null, birthPlace: null });
    expect(rs).toHaveLength(6);
    for (const t of ['animal', 'sixstar', 'shichu'] as const) {
      const r = rs.find((x) => x.divinationType === t)!;
      expect(r.status).toBe('unsupported');
      expect(r.resultCode).toBeNull();
    }
    for (const t of ['numerology', 'eto', 'western'] as const) {
      expect(rs.find((x) => x.divinationType === t)!.status).toBe('provisional');
    }
  });
});
