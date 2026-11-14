// BIRTH CODE 共通型定義（仕様書 v4.0 §9 に対応）

export type DivinationType = 'animal' | 'sixstar' | 'western' | 'shichu' | 'numerology' | 'eto';

/** 計算ステータス。confirmed は「根拠確認済みの確定実装」。MVPでは confirmed の占術は無い。 */
export type ResultStatus = 'confirmed' | 'provisional' | 'unsupported' | 'error';

export interface ProfileInput {
  displayName: string;
  /** YYYY-MM-DD（Date型は使わず、タイムゾーンずれを避ける） */
  birthDate: string;
  /** HH:MM または null */
  birthTime: string | null;
  birthPlace: string | null;
}

export interface Person extends ProfileInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface DivinationResult {
  divinationType: DivinationType;
  name: string;
  status: ResultStatus;
  resultCode: string | null;
  resultLabel: string | null;
  attributes: Record<string, string | number>;
  description: string;
  strengths: string[];
  cautions: string[];
  /** 不足情報・算出条件の注記 */
  warnings: string[];
  calculationVersion: string;
  /** 参照した計算仕様・データの識別情報 */
  specRef: string;
}

export interface Diagnosis {
  id: string;
  personId: string;
  executedAt: string;
  inputSnapshot: ProfileInput;
  divinationResults: DivinationResult[];
  calculationVersion: string;
  generatorVersion: string;
}

export interface BoardItem {
  divinationType: DivinationType;
  /** null = 未対応・未計算 */
  characterCode: string | null;
  slot: number;
}

export interface EffectBoard {
  id: string;
  personId: string;
  diagnosisId: string;
  items: BoardItem[];
  layout: { kind: 'grid'; slots: number };
  createdAt: string;
}

export type BodyShape = 'box' | 'wide' | 'tall' | 'round';
export type EyeStyle = 'round' | 'sleepy' | 'angry' | 'happy' | 'wide';
export type PatternStyle = 'none' | 'stripe' | 'dots' | 'zig' | 'flame';
export type KnobStyle = 'round' | 'hex' | 'pointer';

export interface VisualSpec {
  body: BodyShape;
  color: string;
  color2: string;
  knobs: number;
  knobStyle: KnobStyle;
  led: string;
  switches: 1 | 2;
  eyes: EyeStyle;
  limbs: 'short' | 'long';
  pattern: PatternStyle;
}

export interface StatBlock {
  GAIN: number;
  TONE: number;
  DEPTH: number;
  SUSTAIN: number;
  MIX: number;
  LEVEL: number;
}

export interface Explanation {
  source: DivinationType | 'seed';
  part: string;
  text: string;
}

export interface OriginalPedal {
  id: string;
  personId: string;
  diagnosisId: string;
  characterCode: string; // ベースとなった基本キャラクター
  name: string;
  effectType: string;
  visualParts: { partIds: string[]; spec: VisualSpec };
  attributes: { category: string; traits: string[]; seed: string };
  stats: StatBlock;
  profile: string;
  explanations: Explanation[];
  generatorVersion: string;
  createdAt: string;
}

export interface CharacterDefinition {
  characterCode: string;
  /** 独自名称（ダジャレ等のパロディ名称。実在の製品名・ロゴは使わない） */
  name: string;
  effectType: string;
  effectCategory: string;
  guitarBassCompatibility: Array<'guitar' | 'bass'>;
  visual: VisualSpec;
  traits: string[];
  baseStats: StatBlock;
  /** 何をオマージュしたかのメモ（UIには出さない・権利確認表用） */
  parodyNote: string;
  definitionVersion: string;
}

export interface Bundle {
  diagnosis: Diagnosis;
  board: EffectBoard;
  pedal: OriginalPedal;
}
