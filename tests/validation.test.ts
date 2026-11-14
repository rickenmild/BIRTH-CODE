import { describe, expect, it } from 'vitest';
import { parseYMD } from '../src/lib/date';
import { validateProfile } from '../src/lib/validation';

const base = { displayName: 'テスト', birthDate: '1990-01-01', birthTime: '', birthPlace: '' };
const TODAY = '2026-11-14';

describe('parseYMD', () => {
  it('存在しない日付を弾く', () => {
    expect(parseYMD('2023-02-29')).toBeNull();
    expect(parseYMD('2024-02-29')).not.toBeNull();
    expect(parseYMD('2024-13-01')).toBeNull();
    expect(parseYMD('2024-04-31')).toBeNull();
    expect(parseYMD('abc')).toBeNull();
    expect(parseYMD('1900-02-29')).toBeNull(); // 1900年は平年
    expect(parseYMD('2000-02-29')).not.toBeNull(); // 2000年はうるう年
  });
});

describe('validateProfile', () => {
  it('正常値はエラーなし', () => expect(validateProfile(base, TODAY)).toEqual({}));
  it('生年月日未入力', () => expect(validateProfile({ ...base, birthDate: '' }, TODAY).birthDate).toContain('入力'));
  it('不正日付', () => expect(validateProfile({ ...base, birthDate: '2023-02-29' }, TODAY).birthDate).toContain('存在しない'));
  it('未来日付', () => expect(validateProfile({ ...base, birthDate: '2026-11-15' }, TODAY).birthDate).toContain('未来'));
  it('今日はOK', () => expect(validateProfile({ ...base, birthDate: TODAY }, TODAY).birthDate).toBeUndefined());
  it('1900年より前', () => expect(validateProfile({ ...base, birthDate: '1899-12-31' }, TODAY).birthDate).toBeDefined());
  it('表示名が空', () => expect(validateProfile({ ...base, displayName: '  ' }, TODAY).displayName).toBeDefined());
  it('出生時刻の形式', () => {
    expect(validateProfile({ ...base, birthTime: '25:00' }, TODAY).birthTime).toBeDefined();
    expect(validateProfile({ ...base, birthTime: '07:30' }, TODAY).birthTime).toBeUndefined();
  });
  it('任意項目は空でよい', () => expect(validateProfile({ ...base, birthTime: '', birthPlace: '' }, TODAY)).toEqual({}));
});
