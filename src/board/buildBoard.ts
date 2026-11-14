import { characterCodeFor } from '../characters/definitions';
import { newId } from '../lib/random';
import type { BoardItem, DivinationResult, EffectBoard } from '../types';

export function buildBoardItems(results: DivinationResult[]): BoardItem[] {
  return results.map((r, slot) => ({
    divinationType: r.divinationType,
    characterCode: characterCodeFor(r),
    slot,
  }));
}

export function buildBoard(
  personId: string,
  diagnosisId: string,
  results: DivinationResult[],
  now: string = new Date().toISOString(),
): EffectBoard {
  const items = buildBoardItems(results);
  return {
    id: newId(),
    personId,
    diagnosisId,
    items,
    layout: { kind: 'grid', slots: items.length },
    createdAt: now,
  };
}
