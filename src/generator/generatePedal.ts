import { CHARACTERS, CHARACTER_DEF_VERSION, CHARACTER_MAP_VERSION, characterCodeFor, getCharacter } from '../characters/definitions';
import { CALC_VERSION } from '../divination';
import type { Element } from '../divination/western';
import { BRANCHES } from '../divination/eto';
import { SIGNS } from '../divination/western';
import { makeRng } from '../lib/random';
import type {
  BodyShape,
  DivinationResult,
  Explanation,
  EyeStyle,
  PatternStyle,
  ProfileInput,
  StatBlock,
  VisualSpec,
} from '../types';

export const GENERATOR_VERSION = 'gen-0.1.0-mvp';

export interface PedalCore {
  characterCode: string;
  name: string;
  effectType: string;
  visualParts: { partIds: string[]; spec: VisualSpec };
  attributes: { category: string; traits: string[]; seed: string };
  stats: StatBlock;
  profile: string;
  explanations: Explanation[];
}

const ELEMENT_COLORS: Record<Element, [string, string]> = {
  fire: ['#e8553d', '#f08a3c'],
  earth: ['#8a9a4b', '#b58a4a'],
  air: ['#e6c34a', '#7fc4e8'],
  water: ['#3f7fd0', '#5a5bc4'],
};
const ELEMENT_JA: Record<Element, string> = { fire: '火', earth: '地', air: '風', water: '水' };

const BODIES: BodyShape[] = ['box', 'wide', 'tall', 'round'];
const EYES: EyeStyle[] = ['round', 'sleepy', 'angry', 'happy', 'wide'];
const PATTERNS: PatternStyle[] = ['none', 'stripe', 'dots', 'zig', 'flame'];
const ADJECTIVES = ['夜明けの', 'きまぐれな', 'ひそかな', 'まんまるの', 'とびっきりの', 'こもれびの', 'しゃんとした', 'ほろ酔いの', 'ぴかぴかの', 'ゆうやけの', 'ふしぎな', 'さわやかな'];
const STAT_KEYS: Array<keyof StatBlock> = ['GAIN', 'TONE', 'DEPTH', 'SUSTAIN', 'MIX', 'LEVEL'];

/** シード文字列。人物IDは含めない（同じ生年月日＋時刻＋ロジックなら同じペダルを再現するため）。 */
export function buildSeed(input: Pick<ProfileInput, 'birthDate' | 'birthTime'>): string {
  return [input.birthDate, input.birthTime ?? '', CALC_VERSION, GENERATOR_VERSION, CHARACTER_DEF_VERSION, CHARACTER_MAP_VERSION].join('|');
}

const clamp = (n: number) => Math.max(5, Math.min(99, Math.round(n)));

/** 純関数：入力と占術結果から、ID・日時を含まないペダル定義を決定的に生成する。 */
export function generatePedalCore(
  input: Pick<ProfileInput, 'birthDate' | 'birthTime'>,
  results: DivinationResult[],
): PedalCore {
  const seed = buildSeed(input);
  const rng = makeRng(seed);
  const explanations: Explanation[] = [];
  const by = (t: string) => results.find((r) => r.divinationType === t && (r.status === 'provisional' || r.status === 'confirmed'));
  const num = by('numerology');
  const eto = by('eto');
  const west = by('western');

  // 1) ベース種別：各占術に対応するキャラへ1票ずつ。同点はシードで決定。
  const votes = new Map<string, number>(CHARACTERS.map((c) => [c.characterCode, 0]));
  for (const r of results) {
    const c = characterCodeFor(r);
    if (c) votes.set(c, (votes.get(c) ?? 0) + 1);
  }
  const top = Math.max(...votes.values());
  const tied = CHARACTERS.filter((c) => votes.get(c.characterCode) === top);
  const base = tied.length === 1 ? tied[0] : rng.pick(tied);
  explanations.push({
    source: num ? 'numerology' : 'seed',
    part: 'エフェクター種別',
    text: `占術結果に対応するキャラの得票が最多の「${base.effectType}」をベースに決定${tied.length > 1 ? '（同点のためシードで選択）' : ''}。`,
  });

  const spec: VisualSpec = { ...base.visual };
  const partIds: string[] = [`base:${base.characterCode}`];

  // 2) 筐体形状：シード
  spec.body = rng.pick(BODIES);
  partIds.push(`body:${spec.body}`);
  explanations.push({ source: 'seed', part: '筐体の形', text: `固定シードから「${spec.body}」型を選択。` });

  // 3) 色：太陽星座の元素 → メイン、十二支 → サブ・LED
  if (west) {
    const sign = SIGNS[Number(west.resultCode)];
    const [c1, c2] = ELEMENT_COLORS[sign.element];
    spec.color = rng.next() < 0.5 ? c1 : c2;
    explanations.push({ source: 'western', part: 'メインカラー', text: `${sign.name}（${ELEMENT_JA[sign.element]}のエレメント）の色味から決定。` });
    spec.pattern = PATTERNS[Number(west.resultCode) % PATTERNS.length];
    explanations.push({ source: 'western', part: '模様', text: `${sign.name}の並び順から模様「${spec.pattern}」を選択。` });
  } else {
    explanations.push({ source: 'seed', part: 'メインカラー・模様', text: '太陽星座が使えないため、ベースキャラの色・模様を継承。' });
  }
  partIds.push(`color:${spec.color}`, `pattern:${spec.pattern}`);

  if (eto) {
    const i = Number(eto.resultCode);
    spec.color2 = `hsl(${i * 30}, 45%, 28%)`;
    spec.led = `hsl(${(i * 30 + 15) % 360}, 90%, 62%)`;
    explanations.push({ source: 'eto', part: 'サブカラー・LED', text: `${BRANCHES[i]}の位置（${i + 1}/12）から色相を決定。` });
  } else {
    explanations.push({ source: 'seed', part: 'サブカラー・LED', text: '十二支が使えないため、ベースキャラの色を継承。' });
  }
  partIds.push(`color2:${spec.color2}`, `led:${spec.led}`);

  // 4) ノブ数：数秘術
  if (num) {
    const n = Number(num.resultCode);
    spec.knobs = 2 + (n % 5);
    explanations.push({ source: 'numerology', part: 'ノブの数', text: `ライフパス数${n}から、ノブを${spec.knobs}個に決定。` });
  } else {
    explanations.push({ source: 'seed', part: 'ノブの数', text: '数秘術が使えないため、ベースキャラの値を継承。' });
  }
  spec.knobStyle = rng.pick(['round', 'hex', 'pointer'] as const);
  spec.switches = rng.next() < 0.25 ? 2 : 1;
  spec.limbs = rng.next() < 0.5 ? 'short' : 'long';
  spec.eyes = rng.next() < 0.5 ? base.visual.eyes : rng.pick(EYES);
  partIds.push(`knobs:${spec.knobs}:${spec.knobStyle}`, `sw:${spec.switches}`, `limbs:${spec.limbs}`, `eyes:${spec.eyes}`);
  explanations.push({ source: 'seed', part: 'ノブ形状・フットスイッチ・手足・目', text: '固定シードから決定。' });

  // 5) 能力値（娯楽上の指標）：ベースの傾向 ± シードによる微調整
  const stats = {} as StatBlock;
  for (const k of STAT_KEYS) stats[k] = clamp(base.baseStats[k] + rng.int(-10, 10));
  explanations.push({ source: 'seed', part: '能力値', text: `ベース種別の傾向に、固定シードで±10の微調整（娯楽上の指標で、実際の性格・能力の測定値ではありません）。` });

  // 6) 名前・プロフィール
  const adjective = rng.pick(ADJECTIVES);
  const name = `${adjective}${base.name}`;
  const topStat = STAT_KEYS.reduce((a, b) => (stats[b] > stats[a] ? b : a), STAT_KEYS[0]);
  const profile = `${name}は、${base.traits.join('で、')}エフェクターの化身。いちばん高いノブは「${topStat}」（${stats[topStat]}）。あなたの生年月日から生まれた、世界にひとつのペダルです。`;

  return {
    characterCode: base.characterCode,
    name,
    effectType: base.effectType,
    visualParts: { partIds, spec },
    attributes: { category: base.effectCategory, traits: base.traits, seed },
    stats,
    profile,
    explanations,
  };
}

export { getCharacter };
