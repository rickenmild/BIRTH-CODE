import type { DivinationModule } from './types';
import { unsupportedResult } from './types';

/**
 * 動物占い・六星占術・四柱推命は、計算方式・参照表・利用条件の確認が済むまで実装しない（仕様書 §0-3, §16）。
 * 画面には「未対応」と理由を表示する。
 */
export const animal: DivinationModule = {
  type: 'animal',
  name: '動物占い',
  calculate: () =>
    unsupportedResult('animal', '動物占い', '未対応：分類体系・変換表・名称の利用条件を確認中のため、まだ計算しません。'),
};

export const sixstar: DivinationModule = {
  type: 'sixstar',
  name: '六星占術',
  calculate: () =>
    unsupportedResult('sixstar', '六星占術', '未対応：計算方式・名称の利用条件を確認中のため、まだ計算しません。'),
};

export const shichu: DivinationModule = {
  type: 'shichu',
  name: '四柱推命',
  calculate: () =>
    unsupportedResult('shichu', '四柱推命', '未対応：節入りデータの出典と暦法・時柱の扱いを確認中のため、まだ計算しません。'),
};
