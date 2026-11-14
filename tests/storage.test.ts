import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { runDiagnosis } from '../src/diagnosis/runDiagnosis';
import { db } from '../src/storage/db';
import {
  clearAll, createPerson, deletePerson, exportAll, findPersonsByBirthDate, getBundle, getPerson,
  importBackup, listCollection, listDiagnoses, listPersons, saveBundle, updatePerson, validateBackup,
} from '../src/storage/repo';

const mk = (id: string, name: string, birthDate: string) => {
  const input = { displayName: name, birthDate, birthTime: null, birthPlace: null };
  return { person: createPerson(id, input), bundle: runDiagnosis(id, input) };
};

beforeEach(async () => {
  await clearAll();
});

describe('コレクションの追加・編集・削除・再読込', () => {
  it('追加して取得できる', async () => {
    const { person, bundle } = mk('p1', 'たろう', '1990-01-01');
    await saveBundle(bundle, person);
    expect(await getPerson('p1')).toMatchObject({ displayName: 'たろう' });
    const b = await getBundle(bundle.diagnosis.id);
    expect(b?.pedal.name).toBe(bundle.pedal.name);
    expect(b?.board.items).toHaveLength(6);
  });

  it('再読込（DBを閉じて開き直す）後もデータが保持される', async () => {
    const { person, bundle } = mk('p1', 'たろう', '1990-01-01');
    await saveBundle(bundle, person);
    db.close();
    await db.open();
    expect(await listPersons()).toHaveLength(1);
    expect((await getBundle(bundle.diagnosis.id))?.diagnosis.id).toBe(bundle.diagnosis.id);
  });

  it('編集できる（更新日時が進み、診断履歴は変わらない）', async () => {
    const { person, bundle } = mk('p1', 'たろう', '1990-01-01');
    await saveBundle(bundle, person);
    await new Promise((r) => setTimeout(r, 5));
    const next = await updatePerson('p1', { displayName: 'じろう' });
    expect(next.displayName).toBe('じろう');
    expect(next.updatedAt > person.updatedAt).toBe(true);
    expect(await listDiagnoses('p1')).toHaveLength(1);
  });

  it('再診断しても過去の診断が残る', async () => {
    const { person, bundle } = mk('p1', 'たろう', '1990-01-01');
    await saveBundle(bundle, person);
    const again = runDiagnosis('p1', person, new Date(Date.now() + 1000).toISOString());
    await saveBundle(again, null);
    const list = await listDiagnoses('p1');
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(again.diagnosis.id); // 新しい順
    expect(await getBundle(bundle.diagnosis.id)).not.toBeNull();
  });

  it('削除すると診断・ボード・ペダルも消え、他の人物は残る', async () => {
    const a = mk('p1', 'A', '1990-01-01');
    const b = mk('p2', 'B', '1991-02-02');
    await saveBundle(a.bundle, a.person);
    await saveBundle(b.bundle, b.person);
    await deletePerson('p1');
    expect(await getPerson('p1')).toBeNull();
    expect(await getBundle(a.bundle.diagnosis.id)).toBeNull();
    expect(await db.boards.count()).toBe(1);
    expect(await db.pedals.count()).toBe(1);
    expect(await getPerson('p2')).not.toBeNull();
  });

  it('同じ生年月日でも別人物として登録でき、自動統合されない', async () => {
    const a = mk('p1', 'A', '1990-01-01');
    const b = mk('p2', 'B', '1990-01-01');
    await saveBundle(a.bundle, a.person);
    expect(await findPersonsByBirthDate('1990-01-01')).toHaveLength(1); // 重複検知
    await saveBundle(b.bundle, b.person);
    expect(await listPersons()).toHaveLength(2);
    expect(a.bundle.pedal.name).toBe(b.bundle.pedal.name); // 同条件は同キャラ（仕様の再現性）
  });

  it('listCollection は人物ごとに最新のペダルを返す', async () => {
    const a = mk('p1', 'A', '1990-01-01');
    await saveBundle(a.bundle, a.person);
    const rows = await listCollection();
    expect(rows).toHaveLength(1);
    expect(rows[0].latestPedal?.id).toBe(a.bundle.pedal.id);
  });

  it('存在しない人物への保存は失敗し、何も書き込まれない（トランザクション）', async () => {
    const { bundle } = mk('ghost', 'G', '1990-01-01');
    await expect(saveBundle(bundle, null)).rejects.toThrow();
    expect(await db.diagnoses.count()).toBe(0);
    expect(await db.pedals.count()).toBe(0);
  });
});

describe('バックアップ', () => {
  it('書き出し→全削除→読み込みで復元できる', async () => {
    const a = mk('p1', 'A', '1990-01-01');
    await saveBundle(a.bundle, a.person);
    const dump = JSON.parse(JSON.stringify(await exportAll()));
    await clearAll();
    expect(await listPersons()).toHaveLength(0);
    const r = await importBackup(dump);
    expect(r.persons).toBe(1);
    expect((await getBundle(a.bundle.diagnosis.id))?.pedal.name).toBe(a.bundle.pedal.name);
  });

  it('壊れたファイル・他アプリのファイル・新しすぎる形式を拒否する', () => {
    expect(() => validateBackup(null)).toThrow();
    expect(() => validateBackup({ app: 'other' })).toThrow('BIRTH CODE');
    expect(() => validateBackup({ app: 'BIRTH CODE', schemaVersion: 99, persons: [], diagnoses: [], boards: [], pedals: [] })).toThrow('新しい形式');
    expect(() => validateBackup({ app: 'BIRTH CODE', schemaVersion: 1, persons: [{}], diagnoses: [], boards: [], pedals: [] })).toThrow('壊れて');
  });

  it('全データ削除ができる', async () => {
    const a = mk('p1', 'A', '1990-01-01');
    await saveBundle(a.bundle, a.person);
    await clearAll();
    expect(await db.persons.count()).toBe(0);
    expect(await db.diagnoses.count()).toBe(0);
  });
});
