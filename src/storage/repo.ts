import { newId } from '../lib/random';
import type { Bundle, Diagnosis, EffectBoard, OriginalPedal, Person, ProfileInput } from '../types';
import { SCHEMA_VERSION, db } from './db';

/** 利用者向けメッセージを持つ保存系エラー。詳細は console に出し、画面には message だけを出す。 */
export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

function toStorageError(action: string, err: unknown): StorageError {
  console.error(`[storage:${action}]`, err);
  const name = (err as { name?: string } | null)?.name;
  if (name === 'QuotaExceededError') {
    return new StorageError('端末の保存容量が不足しているため、保存できませんでした。不要なデータを削除してからもう一度お試しください。', err);
  }
  const verb = action === 'load' ? '読み込み' : action === 'delete' ? '削除' : '保存';
  return new StorageError(`データの${verb}に失敗しました。保存はされていません。もう一度お試しください。`, err);
}

async function guard<T>(action: 'save' | 'load' | 'delete', fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof StorageError) throw err;
    throw toStorageError(action, err);
  }
}

// ---------- 人物 ----------

export function createPerson(id: string, input: ProfileInput, now = new Date().toISOString()): Person {
  return { id, ...input, createdAt: now, updatedAt: now };
}

export const getPerson = (id: string) => guard('load', async () => (await db.persons.get(id)) ?? null);

export const listPersons = () => guard('load', () => db.persons.toArray());

export const findPersonsByBirthDate = (birthDate: string) =>
  guard('load', () => db.persons.where('birthDate').equals(birthDate).toArray());

export const updatePerson = (id: string, patch: Partial<ProfileInput>) =>
  guard('save', async () => {
    const cur = await db.persons.get(id);
    if (!cur) throw new StorageError('対象の人物が見つかりません。');
    const next: Person = { ...cur, ...patch, updatedAt: new Date().toISOString() };
    await db.persons.put(next);
    return next;
  });

/** 人物と、その診断・ボード・ペダルをまとめて削除する。 */
export const deletePerson = (id: string) =>
  guard('delete', () =>
    db.transaction('rw', [db.persons, db.diagnoses, db.boards, db.pedals], async () => {
      await db.pedals.where('personId').equals(id).delete();
      await db.boards.where('personId').equals(id).delete();
      await db.diagnoses.where('personId').equals(id).delete();
      await db.persons.delete(id);
    }),
  );

// ---------- 診断 ----------

/** 診断一式を保存する。人物が未登録なら同時に登録する（1トランザクション＝全部成功か全部失敗）。 */
export const saveBundle = (bundle: Bundle, person: Person | null) =>
  guard('save', () =>
    db.transaction('rw', [db.persons, db.diagnoses, db.boards, db.pedals], async () => {
      if (person) await db.persons.put(person);
      else {
        const p = await db.persons.get(bundle.diagnosis.personId);
        if (!p) throw new StorageError('保存先の人物が見つかりません。');
        await db.persons.update(p.id, { updatedAt: new Date().toISOString() });
      }
      await db.diagnoses.put(bundle.diagnosis);
      await db.boards.put(bundle.board);
      await db.pedals.put(bundle.pedal);
    }),
  );

export const getBundle = (diagnosisId: string): Promise<Bundle | null> =>
  guard('load', async () => {
    const diagnosis = await db.diagnoses.get(diagnosisId);
    if (!diagnosis) return null;
    const board = await db.boards.where('diagnosisId').equals(diagnosisId).first();
    const pedal = await db.pedals.where('diagnosisId').equals(diagnosisId).first();
    if (!board || !pedal) return null;
    return { diagnosis, board, pedal };
  });

export const listDiagnoses = (personId: string): Promise<Diagnosis[]> =>
  guard('load', async () => {
    const list = await db.diagnoses.where('personId').equals(personId).toArray();
    return list.sort((a, b) => b.executedAt.localeCompare(a.executedAt));
  });

export interface CollectionEntry {
  person: Person;
  latestDiagnosis: Diagnosis | null;
  latestPedal: OriginalPedal | null;
}

export const listCollection = (): Promise<CollectionEntry[]> =>
  guard('load', async () => {
    const persons = await db.persons.toArray();
    return Promise.all(
      persons.map(async (person) => {
        const diags = await db.diagnoses.where('personId').equals(person.id).toArray();
        diags.sort((a, b) => b.executedAt.localeCompare(a.executedAt));
        const latestDiagnosis = diags[0] ?? null;
        const latestPedal = latestDiagnosis
          ? ((await db.pedals.where('diagnosisId').equals(latestDiagnosis.id).first()) ?? null)
          : null;
        return { person, latestDiagnosis, latestPedal };
      }),
    );
  });

// ---------- バックアップ ----------

export interface BackupFile {
  app: 'BIRTH CODE';
  schemaVersion: number;
  exportedAt: string;
  persons: Person[];
  diagnoses: Diagnosis[];
  boards: EffectBoard[];
  pedals: OriginalPedal[];
}

export const exportAll = (): Promise<BackupFile> =>
  guard('load', async () => ({
    app: 'BIRTH CODE' as const,
    schemaVersion: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    persons: await db.persons.toArray(),
    diagnoses: await db.diagnoses.toArray(),
    boards: await db.boards.toArray(),
    pedals: await db.pedals.toArray(),
  }));

export function validateBackup(data: unknown): BackupFile {
  const d = data as Partial<BackupFile> | null;
  if (!d || typeof d !== 'object' || d.app !== 'BIRTH CODE') throw new StorageError('BIRTH CODE のバックアップファイルではありません。');
  if (typeof d.schemaVersion !== 'number' || d.schemaVersion > SCHEMA_VERSION) {
    throw new StorageError('このアプリより新しい形式のバックアップです。アプリを更新してから読み込んでください。');
  }
  for (const k of ['persons', 'diagnoses', 'boards', 'pedals'] as const) {
    if (!Array.isArray(d[k])) throw new StorageError('バックアップファイルの内容が壊れています。');
  }
  const ok = (x: unknown) => !!x && typeof (x as { id?: unknown }).id === 'string';
  if (![...d.persons!, ...d.diagnoses!, ...d.boards!, ...d.pedals!].every(ok)) {
    throw new StorageError('バックアップファイルの内容が壊れています。');
  }
  return d as BackupFile;
}

/** 既存データを残したまま追加する（同一IDは上書き）。 */
export const importBackup = (data: unknown) =>
  guard('save', async () => {
    const b = validateBackup(data);
    await db.transaction('rw', [db.persons, db.diagnoses, db.boards, db.pedals], async () => {
      await db.persons.bulkPut(b.persons);
      await db.diagnoses.bulkPut(b.diagnoses);
      await db.boards.bulkPut(b.boards);
      await db.pedals.bulkPut(b.pedals);
    });
    return { persons: b.persons.length, diagnoses: b.diagnoses.length };
  });

export const clearAll = () =>
  guard('delete', () =>
    db.transaction('rw', [db.persons, db.diagnoses, db.boards, db.pedals], async () => {
      await Promise.all([db.persons.clear(), db.diagnoses.clear(), db.boards.clear(), db.pedals.clear()]);
    }),
  );

export { newId };
