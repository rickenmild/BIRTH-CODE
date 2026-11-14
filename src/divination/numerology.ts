import { parseYMD } from '../lib/date';
import type { DivinationModule } from './types';
import { CALC_VERSION, PROVISIONAL_NOTE } from './types';

type Entry = [label: string, description: string, strengths: string[], cautions: string[]];

const TABLE: Record<number, Entry> = {
  1: ['開拓の1', '自分で道を切り開くのが得意な、先頭に立つタイプ。', ['決断が早い', '独立心が強い'], ['ひとりで抱え込みやすい']],
  2: ['調和の2', '人の気持ちを汲み取り、場をなめらかにつなぐタイプ。', ['聞き上手', '協調性が高い'], ['遠慮して本音を飲み込みがち']],
  3: ['表現の3', '楽しさと言葉で周りを明るくする、表現力のあるタイプ。', ['発想が自由', '場を和ませる'], ['飽きっぽくなりやすい']],
  4: ['基盤の4', 'コツコツ積み上げて、土台を固めるのが得意なタイプ。', ['計画的', '責任感が強い'], ['変化への切り替えに時間がかかる']],
  5: ['自由の5', '変化と冒険を楽しみ、フットワークの軽いタイプ。', ['適応力が高い', '好奇心旺盛'], ['落ち着きを欠きやすい']],
  6: ['愛情の6', '身近な人を気づかい、居心地のよい場所をつくるタイプ。', ['面倒見がよい', '美意識がある'], ['世話を焼きすぎることがある']],
  7: ['探究の7', '物事を深く掘り下げ、ひとり時間で力を蓄えるタイプ。', ['分析力がある', '洞察が深い'], ['考えすぎて動き出しが遅れがち']],
  8: ['実現の8', '目標を形にする力と、現実的な感覚をもつタイプ。', ['行動力がある', '管理能力が高い'], ['頑張りすぎて余裕をなくしやすい']],
  9: ['包容の9', '広い視野で人を受け入れ、まとめ上げるタイプ。', ['寛容', '理想を語れる'], ['手放すタイミングを迷いやすい']],
  11: ['直感の11', '鋭い感受性とひらめきで、人に気づきを与えるタイプ。', ['直感が冴える', '人を鼓舞する'], ['気持ちの波が大きくなりやすい']],
  22: ['構想の22', '大きなビジョンを現実に落とし込む、スケールの大きいタイプ。', ['実行力と構想力', '周囲を巻き込む'], ['理想が高く負荷を抱え込みがち']],
  33: ['奉仕の33', '人のために力を尽くすことに喜びを見出す、おおらかなタイプ。', ['思いやりが深い', '癒やす力がある'], ['自分のケアを後回しにしがち']],
};

const KEEP = new Set([11, 22, 33]);

const digitSum = (n: number) => String(n).split('').reduce((a, c) => a + Number(c), 0);

export function reduceNumber(n: number): number {
  let v = n;
  while (v > 9 && !KEEP.has(v)) v = digitSum(v);
  return v;
}

/** 生年月日の全桁の和をマスターナンバー(11/22/33)を残して還元する（流派は未確定のため暫定）。 */
export function lifePathNumber(birthDate: string): number {
  const p = parseYMD(birthDate);
  if (!p) throw new Error('invalid birthDate');
  const digits = birthDate.replace(/-/g, '');
  const sum = digits.split('').reduce((a, c) => a + Number(c), 0);
  return reduceNumber(sum);
}

export const numerology: DivinationModule = {
  type: 'numerology',
  name: '数秘術',
  calculate({ birthDate }) {
    const n = lifePathNumber(birthDate);
    const [label, description, strengths, cautions] = TABLE[n];
    return {
      divinationType: 'numerology',
      name: '数秘術',
      status: 'provisional',
      resultCode: String(n),
      resultLabel: label,
      attributes: { lifePath: n },
      description,
      strengths,
      cautions,
      warnings: [
        PROVISIONAL_NOTE,
        '算出条件：生年月日の全桁を足し、11・22・33はそのまま残して還元（流派は未確定）。',
      ],
      calculationVersion: CALC_VERSION,
      specRef: 'numerology/lifepath-alldigits-keep112233/provisional-v0',
    };
  },
};
