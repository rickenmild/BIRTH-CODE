import type { CharacterDefinition, DivinationResult } from '../types';

export const CHARACTER_DEF_VERSION = 'chardef-0.1.0-mvp';

const v = CHARACTER_DEF_VERSION;

/**
 * デザイン検証用の6体（仕様書 §4.5）。名称は独自のダジャレ名称。
 * 実在メーカーのロゴ・製品名・外観は使用していない。`parodyNote` は権利確認管理用で、UIには表示しない。
 */
export const CHARACTERS: CharacterDefinition[] = [
  {
    characterCode: 'FX-OD-001',
    name: 'ホットケーキ・ドライブ',
    effectType: 'Overdrive',
    effectCategory: '歪み系',
    guitarBassCompatibility: ['guitar', 'bass'],
    visual: { body: 'box', color: '#e8b04a', color2: '#8a4b1f', knobs: 3, knobStyle: 'round', led: '#ff5a36', switches: 1, eyes: 'round', limbs: 'short', pattern: 'dots' },
    traits: ['温かく粘る', '頼れる相棒'],
    baseStats: { GAIN: 60, TONE: 55, DEPTH: 40, SUSTAIN: 55, MIX: 45, LEVEL: 60 },
    parodyNote: 'オーバードライブ全般の「ほどよく歪む」イメージをホットケーキに見立てた独自キャラ。特定製品の意匠は参照していない。',
    definitionVersion: v,
  },
  {
    characterCode: 'FX-DS-001',
    name: 'キレキレ・ディスト',
    effectType: 'Distortion',
    effectCategory: '歪み系',
    guitarBassCompatibility: ['guitar', 'bass'],
    visual: { body: 'wide', color: '#d9344a', color2: '#2b2b33', knobs: 3, knobStyle: 'hex', led: '#ffd23f', switches: 1, eyes: 'angry', limbs: 'short', pattern: 'flame' },
    traits: ['短気で情熱的', '勢いがある'],
    baseStats: { GAIN: 85, TONE: 50, DEPTH: 35, SUSTAIN: 65, MIX: 40, LEVEL: 55 },
    parodyNote: 'ディストーションの荒々しさを「キレキレ」というダジャレで表現した独自キャラ。特定製品の意匠は参照していない。',
    definitionVersion: v,
  },
  {
    characterCode: 'FX-FZ-001',
    name: 'モフモフ・ファズ',
    effectType: 'Fuzz',
    effectCategory: '歪み系',
    guitarBassCompatibility: ['guitar', 'bass'],
    visual: { body: 'round', color: '#9b7ede', color2: '#4a3b86', knobs: 2, knobStyle: 'pointer', led: '#ff8fd0', switches: 1, eyes: 'sleepy', limbs: 'short', pattern: 'zig' },
    traits: ['毛羽立った気まぐれ屋', 'もこもこの音'],
    baseStats: { GAIN: 80, TONE: 35, DEPTH: 50, SUSTAIN: 75, MIX: 55, LEVEL: 45 },
    parodyNote: 'ファズの毛羽立った質感を「モフモフ」と掛けた独自キャラ。特定製品の意匠は参照していない。',
    definitionVersion: v,
  },
  {
    characterCode: 'FX-CH-001',
    name: 'ゆらゆら・コーラス',
    effectType: 'Chorus',
    effectCategory: 'モジュレーション系',
    guitarBassCompatibility: ['guitar', 'bass'],
    visual: { body: 'tall', color: '#3fb8c9', color2: '#1d5f73', knobs: 4, knobStyle: 'round', led: '#7dffb0', switches: 1, eyes: 'happy', limbs: 'long', pattern: 'stripe' },
    traits: ['揺れて広がる癒し系', 'ふわふわの空気'],
    baseStats: { GAIN: 20, TONE: 60, DEPTH: 75, SUSTAIN: 30, MIX: 70, LEVEL: 50 },
    parodyNote: 'コーラスの揺らぎを「ゆらゆら」で表現した独自キャラ。特定製品の意匠は参照していない。',
    definitionVersion: v,
  },
  {
    characterCode: 'FX-DL-001',
    name: 'ヤッホー・ディレイ',
    effectType: 'Delay',
    effectCategory: '空間系',
    guitarBassCompatibility: ['guitar', 'bass'],
    visual: { body: 'box', color: '#4fa86b', color2: '#1f5b3a', knobs: 4, knobStyle: 'pointer', led: '#ffe066', switches: 1, eyes: 'wide', limbs: 'long', pattern: 'none' },
    traits: ['何度も返事をする', '寂しがり屋'],
    baseStats: { GAIN: 15, TONE: 50, DEPTH: 80, SUSTAIN: 45, MIX: 75, LEVEL: 50 },
    parodyNote: 'ディレイ＝やまびこ（ヤッホー）のダジャレによる独自キャラ。特定製品の意匠は参照していない。',
    definitionVersion: v,
  },
  {
    characterCode: 'FX-BC-001',
    name: 'ぎゅうぎゅう・コンプ',
    effectType: 'Bass Compressor',
    effectCategory: 'ダイナミクス系',
    guitarBassCompatibility: ['bass', 'guitar'],
    visual: { body: 'wide', color: '#5b6b8c', color2: '#d4d9e6', knobs: 4, knobStyle: 'hex', led: '#5ee0a0', switches: 2, eyes: 'round', limbs: 'long', pattern: 'none' },
    traits: ['低音を押さえ込む', '几帳面な世話焼き'],
    baseStats: { GAIN: 25, TONE: 55, DEPTH: 30, SUSTAIN: 85, MIX: 40, LEVEL: 70 },
    parodyNote: 'コンプレッサーが音を圧縮する様子を「ぎゅうぎゅう」で表現した独自キャラ。特定製品の意匠は参照していない。',
    definitionVersion: v,
  },
];

const BY_CODE = new Map(CHARACTERS.map((c) => [c.characterCode, c]));
const code = (t: string) => `FX-${t}-001`;

export function getCharacter(characterCode: string | null | undefined): CharacterDefinition | null {
  if (!characterCode) return null;
  return BY_CODE.get(characterCode) ?? null;
}

// ---- 占術結果 → キャラクター対応表（MVPの仮割当。全6体への暫定マッピングで、占術的な意味づけは未確定） ----
const NUMEROLOGY_MAP: Record<string, string> = {
  '1': code('DS'), '2': code('CH'), '3': code('DL'), '4': code('BC'), '5': code('FZ'), '6': code('OD'),
  '7': code('DL'), '8': code('DS'), '9': code('CH'), '11': code('FZ'), '22': code('BC'), '33': code('OD'),
};
const ORDER = ['OD', 'DS', 'FZ', 'CH', 'DL', 'BC'].map(code);

export const CHARACTER_MAP_VERSION = 'charmap-0.1.0-provisional';

/** 結果コードに対応するキャラクターコードを返す。対応不能なら null（誤ったキャラは出さない）。 */
export function characterCodeFor(r: DivinationResult): string | null {
  if ((r.status !== 'provisional' && r.status !== 'confirmed') || r.resultCode === null) return null;
  switch (r.divinationType) {
    case 'numerology':
      return NUMEROLOGY_MAP[r.resultCode] ?? null;
    case 'eto': {
      const i = Number(r.resultCode);
      return Number.isInteger(i) && i >= 0 && i < 12 ? ORDER[i % 6] : null;
    }
    case 'western': {
      const i = Number(r.resultCode);
      return Number.isInteger(i) && i >= 0 && i < 12 ? ORDER[(i + 3) % 6] : null;
    }
    default:
      return null;
  }
}
