import { parseYMD } from '../lib/date';
import type { DivinationModule } from './types';
import { CALC_VERSION, PROVISIONAL_NOTE } from './types';

export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const BRANCH_READINGS = ['ね', 'うし', 'とら', 'う', 'たつ', 'み', 'うま', 'ひつじ', 'さる', 'とり', 'いぬ', 'い'] as const;

const TEXT: Array<[string, string[], string[]]> = [
  ['機転がきき、チャンスを素早くつかむタイプ。', ['情報収集が上手い', '順応が早い'], ['先を急ぎすぎることがある']],
  ['粘り強く、着実に歩みを進めるタイプ。', ['忍耐力がある', '誠実'], ['頑固に見られやすい']],
  ['勇敢で、思い立ったら動き出すタイプ。', ['行動力', '正義感'], ['勢いで突っ走りがち']],
  ['穏やかで、人当たりのよいタイプ。', ['気配り上手', '平和を好む'], ['衝突を避けて先送りしがち']],
  ['スケールが大きく、存在感のあるタイプ。', ['野心がある', '人を惹きつける'], ['自信が強く出すぎることも']],
  ['探究心が強く、しなやかに考えるタイプ。', ['洞察力', '粘り強い']  , ['内にこもりやすい']],
  ['明るく情熱的で、自由を愛するタイプ。', ['発信力', '前向き'], ['気分の浮き沈みが出やすい']],
  ['優しく、感性豊かなタイプ。', ['共感力', '創造性'], ['人に合わせすぎて疲れやすい']],
  ['器用で好奇心が強く、ユーモアのあるタイプ。', ['多才', '機知に富む'], ['気が散りやすい']],
  ['几帳面で、身だしなみや段取りを大切にするタイプ。', ['計画性', '向上心'], ['完璧を求めすぎがち']],
  ['忠実で、仲間思いのタイプ。', ['信頼される', '責任感'], ['心配性になりやすい']],
  ['素直で、まっすぐに突き進むタイプ。', ['集中力', '情が深い'], ['猪突猛進になりやすい']],
];

/** 立春を 2/4 固定で近似する（実際は年により 2/3〜2/5）。確定ロジックではない。 */
export function etoIndex(birthDate: string): number {
  const p = parseYMD(birthDate);
  if (!p) throw new Error('invalid birthDate');
  const beforeRisshun = p.m < 2 || (p.m === 2 && p.d < 4);
  const year = beforeRisshun ? p.y - 1 : p.y;
  return (((year - 4) % 12) + 12) % 12;
}

export const eto: DivinationModule = {
  type: 'eto',
  name: '十二支占い',
  calculate({ birthDate }) {
    const p = parseYMD(birthDate)!;
    const idx = etoIndex(birthDate);
    const [description, strengths, cautions] = TEXT[idx];
    const warnings = [PROVISIONAL_NOTE, '算出条件：立春を2月4日で固定して年の境界を近似（実際の立春は年により前後）。'];
    if (p.m === 2 && p.d >= 3 && p.d <= 5) warnings.push('2月3〜5日生まれは、実際の立春次第で干支が変わる可能性があります。');
    if (p.m === 1 || (p.m === 2 && p.d < 3)) warnings.push('旧正月（旧暦）基準で見る流派とは結果が異なる場合があります。');
    return {
      divinationType: 'eto',
      name: '十二支占い',
      status: 'provisional',
      resultCode: String(idx),
      resultLabel: `${BRANCHES[idx]}（${BRANCH_READINGS[idx]}）`,
      attributes: { index: idx, branch: BRANCHES[idx] },
      description,
      strengths,
      cautions,
      warnings,
      calculationVersion: CALC_VERSION,
      specRef: 'eto/year-branch-risshun-feb4-fixed/provisional-v0',
    };
  },
};
