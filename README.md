# BIRTH CODE（仮称）— Phase 1 MVP 骨格 v0.1.0

生年月日からエフェクター筐体キャラクターを作る占い遊び PWA。仕様書 v4.0 の Phase 1（操作可能な MVP）の実装です。
**占い結果・属性・スコアは娯楽目的です。**

## 起動手順

```bash
npm install
npm run dev        # 開発サーバー
npm run build      # 型チェック + 本番ビルド（dist/）
npm run preview    # ビルド成果物を http://127.0.0.1:4173 で確認
npm test           # 単体テスト（Vitest）
npm run e2e        # ビルド → 画面操作の通しテスト（Playwright。スマホ幅・PC幅・PWA）
```

- `dist/` は静的ファイルのみ。任意の静的ホスティングに置けます（`base: './'`、HashRouter 採用）。
- PWA の Service Worker は HTTPS または localhost でのみ有効です。
- `npm run e2e` は Playwright が必要です（未導入なら `npm i -D playwright` 後に `npx playwright install chromium`）。
- アイコン再生成: `npm run icons`（`public/icon.svg` から PNG を作成）。

## 公開手順（GitHub → Netlify 自動デプロイ）

1. このフォルダの中身を GitHub のリポジトリに push する（`.gitignore` で `node_modules` / `dist` は除外済み。`package-lock.json` は必ず含める）。
2. Netlify にログイン → **Add new site → Import an existing project → GitHub** → 対象リポジトリを選ぶ。
3. 設定は `netlify.toml` から自動で読み込まれる（Build command: `npm run build` / Publish directory: `dist` / Node 22）。そのまま **Deploy** を押す。
4. 以降は GitHub に push するたびに自動でビルド・公開される。公開URLは HTTPS なので、スマホで開いて「ホーム画面に追加」できる。

注意：Service Worker の更新は、次回の起動時に反映される（`autoUpdate`）。データ（IndexedDB）は更新の影響を受けない。

## 技術構成

TypeScript / React / Vite / React Router（Hash）/ Dexie（IndexedDB）/ vite-plugin-pwa / Vitest。外部サービス・有料 API なし。

## ファイル構成

```
src/
  divination/   占術計算（numerology, eto, western = 仮実装 / unsupported = 未対応3種）
  diagnosis/    診断の実行（占術→ボード→ペダルを束ねる）
  characters/   キャラ定義（検証用6体）と 占術結果→キャラ 対応表（仮割当）
  generator/    オリジナルペダル生成（固定シードのルールベース）
  board/        ボード項目の構築
  storage/      IndexedDB（Dexie）とリポジトリ層、バックアップ
  state/        診断途中の保持（sessionStorage）、結果取得フック
  lib/          日付・入力検証・乱数（FNV-1a + mulberry32）
  ui/           画面 9 種、SVG キャラ描画（PedalSvg）、共通部品、CSS
tests/          単体テスト（占術・検証・生成の再現性・保存/削除/復元）
e2e/            画面操作の通しテスト
scripts/        PWA アイコン生成
```

## 実装済み（Phase 1）

- 画面 9 種：HOME / PROFILE INPUT / DIAGNOSIS LOADING / DIVINATION RESULT / MY EFFECT BOARD / MY ORIGINAL PEDAL / PEDAL COLLECTION / COLLECTION DETAIL / SETTINGS
- 入力検証（未入力・存在しない日付・未来日付・1900年以前・時刻形式）。エラーは項目の近くに表示
- 戻る操作・再読込でも入力内容と未保存の診断結果が消えない
- 人物の登録・編集・削除（診断・ボード・ペダルも連動削除）、再診断（履歴保持）、検索、並べ替え
- 同じ生年月日の人物：重複案内のうえ別人物として保存（自動統合しない）
- 保存はトランザクション（全部成功か全部失敗）。保存失敗・容量不足は利用者向け文言で表示
- JSON バックアップの書き出し／読み込み、全データ削除
- PWA：manifest、アイコン、Service Worker、オフラインで HOME と保存データ画面が開く
- 占術ごとに try/catch で隔離（1 つの失敗が他を消さない）。未対応は空欄にせず「未対応」と明示
- 娯楽目的の注記、プライバシー注記、仮実装の「仮」バッジ

## 占術の状態（重要）

| 占術 | 状態 | 備考 |
|---|---|---|
| 数秘術 | **仮** | 全桁和を還元、11/22/33 を残す（流派未確定） |
| 十二支 | **仮** | 立春を 2/4 固定で近似。実際の立春・旧正月とは異なる場合あり |
| 太陽星座 | **仮** | 簡易日付表。境界付近は注意文を表示（出生時刻は未使用） |
| 動物占い | **未対応** | 分類体系・変換表・名称の利用条件を確認中 |
| 六星占術 | **未対応** | 計算方式・名称の利用条件を確認中 |
| 四柱推命 | **未対応** | 節入りデータの出典・暦法・時柱の扱いを確認中 |

`confirmed`（確定）の占術は現時点ではありません。確定実装は Phase 2 で、根拠確認のうえ 1 つずつ行います。

## 仕様に対する仮定・追加（要確認）

- 同じ生年月日＋出生時刻なら同じペダルを再現（人物 ID はシードに含めない）。別人物でも同条件は同キャラ。
- 総合属性は GAIN / TONE / DEPTH / SUSTAIN / MIX / LEVEL の 6 項目、レアリティなし。ベース種別の傾向 ± シード微調整。
- 占術結果→キャラの対応は、検証用 6 体への**仮割当**（占術的意味づけなし）。
- `DivinationResult.status`（confirmed / provisional / unsupported / error）と `OriginalPedal.explanations` を仕様に追加。
- キャラ名は独自のダジャレ名称。`parodyNote` は権利確認管理用で UI には出さない。実在ロゴ・製品名・外観は不使用。

## 既知の制約

- 占術はすべて仮・未対応のため、結果は確定情報ではない。
- キャラは検証用 6 体の SVG 仮素材。占術結果の割当が少数のキャラに集中する。
- 出生時刻・出生地は保存のみで、現在は計算に使わない。
- 削除確認は `window.confirm`（簡易）。専用ダイアログは未実装。
- バックアップ読み込みは「追加（同一 ID は上書き）」のみ。
- 他端末との同期・アカウント・SNS 共有なし（仕様上も初期対象外）。
- 実機（iOS Safari / Android Chrome）での確認は未実施。確認は Chromium のエミュレーション（390px / 1280px）まで。
- アクセシビリティは基本対応（ラベル・フォーカス・コントラスト）まで。スクリーンリーダーでの検証は未実施。

## テスト結果（2026-11-14）

- 単体テスト：4 ファイル 58 件 すべて成功（数秘術の境界・マスターナンバー、十二支の立春境界・年またぎ、星座の全日付・年またぎ・境界検出、入力検証、生成の 100 回再現性、保存・再読込・編集・再診断・削除・重複・バックアップ復元・トランザクション）
- E2E（Playwright）：63 件 すべて成功（スマホ 390px / PC 1280px の通し操作、PWA manifest・Service Worker・オフライン）
- 型チェック・本番ビルド：成功

## 次のフェーズ

Phase 2：確認済みの占術から順に確定実装し、期待値テストを整備する（動物占い・六星占術は根拠資料と利用条件の確認後、四柱推命は節入りデータの出典確認後）。
