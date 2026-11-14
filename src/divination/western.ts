import { parseYMD } from '../lib/date';
import type { DivinationModule } from './types';
import { CALC_VERSION, PROVISIONAL_NOTE } from './types';

export type Element = 'fire' | 'earth' | 'air' | 'water';
export type Modality = 'cardinal' | 'fixed' | 'mutable';

interface Sign {
  name: string;
  /** 開始月日 */
  start: [number, number];
  element: Element;
  modality: Modality;
  description: string;
  strengths: string[];
  cautions: string[];
}

/** 並びは牡羊座(3/21〜)始まり。境界日は一般的な簡易表（年・時刻により±1日ずれる）。 */
export const SIGNS: Sign[] = [
  { name: '牡羊座', start: [3, 21], element: 'fire', modality: 'cardinal', description: '先頭を切って動き出す、エネルギッシュなタイプ。', strengths: ['行動力', '率直さ'], cautions: ['せっかちになりやすい'] },
  { name: '牡牛座', start: [4, 20], element: 'earth', modality: 'fixed', description: 'マイペースで、心地よさと安定を大切にするタイプ。', strengths: ['粘り強さ', '感覚の豊かさ'], cautions: ['変化を後回しにしがち'] },
  { name: '双子座', start: [5, 21], element: 'air', modality: 'mutable', description: '好奇心旺盛で、情報と会話を楽しむタイプ。', strengths: ['機転', '発信力'], cautions: ['関心が移り気になりやすい'] },
  { name: '蟹座', start: [6, 22], element: 'water', modality: 'cardinal', description: '情が深く、身近な人を守ろうとするタイプ。', strengths: ['共感力', '面倒見のよさ'], cautions: ['気持ちを抱え込みやすい'] },
  { name: '獅子座', start: [7, 23], element: 'fire', modality: 'fixed', description: '堂々として、周りを明るく照らすタイプ。', strengths: ['存在感', '寛大さ'], cautions: ['プライドが高く出ることも'] },
  { name: '乙女座', start: [8, 23], element: 'earth', modality: 'mutable', description: '細やかな観察と改善が得意なタイプ。', strengths: ['分析力', '誠実さ'], cautions: ['自分に厳しすぎがち'] },
  { name: '天秤座', start: [9, 23], element: 'air', modality: 'cardinal', description: 'バランス感覚に優れ、調和を重んじるタイプ。', strengths: ['社交性', '公平さ'], cautions: ['決断に時間がかかりやすい'] },
  { name: '蠍座', start: [10, 24], element: 'water', modality: 'fixed', description: '深く集中し、物事の本質を見抜こうとするタイプ。', strengths: ['集中力', '洞察力'], cautions: ['内に溜め込みやすい'] },
  { name: '射手座', start: [11, 23], element: 'fire', modality: 'mutable', description: '自由と広い世界を求める、楽天的なタイプ。', strengths: ['前向きさ', '探求心'], cautions: ['大雑把になりやすい'] },
  { name: '山羊座', start: [12, 22], element: 'earth', modality: 'cardinal', description: '目標に向かい、責任をもって積み上げるタイプ。', strengths: ['計画性', '忍耐力'], cautions: ['肩に力が入りすぎがち'] },
  { name: '水瓶座', start: [1, 20], element: 'air', modality: 'fixed', description: '独自の視点をもち、枠にとらわれないタイプ。', strengths: ['独創性', '客観性'], cautions: ['距離を置きすぎて見られがち'] },
  { name: '魚座', start: [2, 19], element: 'water', modality: 'mutable', description: '感受性が豊かで、想像力にあふれるタイプ。', strengths: ['優しさ', '想像力'], cautions: ['現実との境目が曖昧になりがち'] },
];

const key = (m: number, d: number) => m * 100 + d;

export function signIndex(birthDate: string): number {
  const p = parseYMD(birthDate);
  if (!p) throw new Error('invalid birthDate');
  const k = key(p.m, p.d);
  // 年またぎ（山羊座 12/22〜1/19）を含め、開始日が k 以下で最も遅いものを選ぶ
  let best = -1;
  let bestKey = -1;
  SIGNS.forEach((s, i) => {
    const sk = key(s.start[0], s.start[1]);
    if (sk <= k && sk > bestKey) {
      best = i;
      bestKey = sk;
    }
  });
  if (best === -1) return SIGNS.findIndex((s) => s.name === '山羊座'); // 1/1〜1/19
  return best;
}

export function isCuspDate(birthDate: string): boolean {
  const p = parseYMD(birthDate);
  if (!p) return false;
  return SIGNS.some((s) => {
    const [sm, sd] = s.start;
    const start = Date.UTC(2001, sm - 1, sd);
    const cur = Date.UTC(2001, p.m - 1, p.d);
    const diff = Math.abs(cur - start) / 86400000;
    return diff <= 1 || diff >= 364;
  });
}

export const western: DivinationModule = {
  type: 'western',
  name: '西洋占星術（太陽星座）',
  calculate({ birthDate }) {
    const idx = signIndex(birthDate);
    const s = SIGNS[idx];
    const warnings = [
      PROVISIONAL_NOTE,
      '算出条件：太陽星座のみ。簡易的な日付表を使用（詳細ホロスコープは出生時刻・出生地が必要で未対応）。',
    ];
    if (isCuspDate(birthDate)) {
      warnings.push('星座の境目付近の生まれです。実際の境界は年・時刻で数時間ずれるため、結果が隣の星座になる可能性があります。');
    }
    return {
      divinationType: 'western',
      name: '西洋占星術（太陽星座）',
      status: 'provisional',
      resultCode: String(idx),
      resultLabel: s.name,
      attributes: { index: idx, element: s.element, modality: s.modality },
      description: s.description,
      strengths: s.strengths,
      cautions: s.cautions,
      warnings,
      calculationVersion: CALC_VERSION,
      specRef: 'western/sun-sign-simple-table/provisional-v0',
    };
  },
};
