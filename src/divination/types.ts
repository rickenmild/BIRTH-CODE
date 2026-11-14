import type { DivinationResult, DivinationType, ProfileInput } from '../types';

export type DivinationInput = Pick<ProfileInput, 'birthDate' | 'birthTime' | 'birthPlace'>;

export interface DivinationModule {
  type: DivinationType;
  name: string;
  calculate(input: DivinationInput): DivinationResult;
}

export const CALC_VERSION = 'calc-0.1.0-mvp';

export const PROVISIONAL_NOTE =
  '【仮】この結果は暫定ロジックによるサンプルです。計算方式の根拠確認が済むまで確定結果としては扱いません。';

export function unsupportedResult(type: DivinationType, name: string, reason: string): DivinationResult {
  return {
    divinationType: type,
    name,
    status: 'unsupported',
    resultCode: null,
    resultLabel: null,
    attributes: {},
    description: '',
    strengths: [],
    cautions: [],
    warnings: [reason],
    calculationVersion: CALC_VERSION,
    specRef: 'none',
  };
}
