import { buildBoard } from '../board/buildBoard';
import { CALC_VERSION, runAllDivinations } from '../divination';
import { GENERATOR_VERSION, generatePedalCore } from '../generator/generatePedal';
import { newId } from '../lib/random';
import type { Bundle, ProfileInput } from '../types';

/** 診断を実行して Diagnosis / EffectBoard / OriginalPedal を作る（保存はしない）。 */
export function runDiagnosis(personId: string, input: ProfileInput, now: string = new Date().toISOString()): Bundle {
  const divinationResults = runAllDivinations(input);
  const diagnosis = {
    id: newId(),
    personId,
    executedAt: now,
    inputSnapshot: { ...input },
    divinationResults,
    calculationVersion: CALC_VERSION,
    generatorVersion: GENERATOR_VERSION,
  };
  const board = buildBoard(personId, diagnosis.id, divinationResults, now);
  const core = generatePedalCore(input, divinationResults);
  const pedal = {
    id: newId(),
    personId,
    diagnosisId: diagnosis.id,
    ...core,
    generatorVersion: GENERATOR_VERSION,
    createdAt: now,
  };
  return { diagnosis, board, pedal };
}
