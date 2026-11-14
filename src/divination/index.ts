import type { DivinationResult, DivinationType } from '../types';
import { eto } from './eto';
import { numerology } from './numerology';
import { animal, shichu, sixstar } from './unsupported';
import type { DivinationInput, DivinationModule } from './types';
import { CALC_VERSION } from './types';
import { western } from './western';

export { CALC_VERSION };

/** 画面・ボードでの並び順（エフェクターボード上の左→右） */
export const MODULES: DivinationModule[] = [animal, sixstar, western, shichu, numerology, eto];

export const DIVINATION_ORDER: DivinationType[] = MODULES.map((m) => m.type);

/** 占術ごとに try/catch し、1つの失敗が他の占術結果を消さないようにする（仕様 §12）。 */
export function runAllDivinations(input: DivinationInput): DivinationResult[] {
  return MODULES.map((m) => {
    try {
      return m.calculate(input);
    } catch (err) {
      console.error(`[divination:${m.type}]`, err); // 開発用ログ（利用者向け表示とは分離）
      return {
        divinationType: m.type,
        name: m.name,
        status: 'error' as const,
        resultCode: null,
        resultLabel: null,
        attributes: {},
        description: '',
        strengths: [],
        cautions: [],
        warnings: ['この占術の計算に失敗しました。他の占術の結果には影響しません。'],
        calculationVersion: CALC_VERSION,
        specRef: 'none',
      };
    }
  });
}

export function hasCharacter(r: DivinationResult): boolean {
  return (r.status === 'provisional' || r.status === 'confirmed') && r.resultCode !== null;
}
