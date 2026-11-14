// 画面操作の通し確認（スマホ幅・PC幅）。`npm run e2e` で、ビルド → preview 起動 → Playwright 実行。
// Playwright が見つからない場合はグローバルの playwright を探す。
const { spawn, execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'))); }

const URL = 'http://127.0.0.1:4173/';
const SHOTS = process.env.SHOTS_DIR || path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('  ok  ', m); } else { fail++; console.log('  FAIL', m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// 非同期描画を待って判定する（最大4秒ポーリング）
async function okEv(fn, m, t = 4000) {
  const s0 = Date.now(); let v = false;
  while (Date.now() - s0 < t) { try { v = await fn(); } catch { v = false; } if (v) break; await sleep(100); }
  ok(v, m);
}

async function waitServer() {
  for (let i = 0; i < 50; i++) { try { const r = await fetch(URL); if (r.ok) return; } catch {} await sleep(200); }
  throw new Error('preview server did not start');
}

async function diagnose(page, name, date, extra) {
  await page.goto(URL + '#/profile');
  await page.fill('input[name=displayName]', name);
  await page.fill('input[name=birthDate]', date);
  await page.click('button[type=submit]');
  await page.waitForURL(/#\/result\//, { timeout: 10000 });
}

async function run(browser, label, ctxOpts) {
  console.log(`\n== ${label} ==`);
  const ctx = await browser.newContext({ acceptDownloads: true, ...ctxOpts });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', (d) => d.accept());
  const tag = label.replace(/\W+/g, '_');

  // HOME
  await page.goto(URL);
  ok(await page.locator('[data-testid=start]').isVisible(), 'HOME: 診断開始ボタンが表示される');
  await page.screenshot({ path: `${SHOTS}/${tag}-1-home.png` });

  // 入力検証
  await page.click('[data-testid=start]');
  await page.fill('input[name=displayName]', 'たろう');
  await page.click('button[type=submit]');
  ok(await page.getByText('生年月日を入力してください。').isVisible(), '検証: 生年月日未入力でエラーが項目の近くに出る');
  await page.fill('input[name=birthDate]', '2999-01-01');
  await page.click('button[type=submit]');
  ok(await page.getByText('未来の日付は入力できません。').isVisible(), '検証: 未来日付を弾く');
  await page.screenshot({ path: `${SHOTS}/${tag}-2-input-error.png` });

  // 入力保持（他画面へ行って戻っても消えない）
  await page.fill('input[name=birthDate]', '1990-01-01');
  await page.click('.tabbar >> text=SETTINGS');
  await page.click('.tabbar >> text=診断');
  ok((await page.inputValue('input[name=displayName]')) === 'たろう' && (await page.inputValue('input[name=birthDate]')) === '1990-01-01', '入力保持: 画面を行き来しても入力が残る');

  // 診断
  await page.click('button[type=submit]');
  await page.waitForURL(/#\/result\//, { timeout: 10000 });
  await okEv(async () => (await page.locator('[data-testid^=result-]').count()) === 6, '結果: 6占術のカードが表示される');
  await okEv(async () => (await page.locator('.badge-unsupported').count()) === 3, '結果: 未対応3占術が「未対応」と明示される');
  await okEv(async () => (await page.locator('.badge-provisional').count()) >= 3, '結果: 仮実装が「仮」と明示される');
  ok(await page.getByText('娯楽').first().isVisible(), '結果: 娯楽目的の注記が表示される');
  await page.screenshot({ path: `${SHOTS}/${tag}-3-result.png`, fullPage: true });

  // 未保存のまま再読込しても結果が残る
  await page.reload();
  await okEv(async () => (await page.locator('[data-testid^=result-]').count()) === 6, '再読込: 未保存の結果が消えない');

  // BOARD
  await page.click('.subtabs >> text=EFFECT BOARD');
  await okEv(async () => (await page.locator('.slot').count()) === 6, 'BOARD: 6スロット');
  await okEv(async () => (await page.locator('.slot.empty').count()) === 3, 'BOARD: 未対応スロットは空表示（誤ったキャラを出さない）');
  await page.click('[data-testid=slot-numerology]');
  await okEv(() => page.locator('[data-testid=result-numerology]').isVisible(), 'BOARD: キャラ選択で診断詳細が開く');
  await page.screenshot({ path: `${SHOTS}/${tag}-4-board.png`, fullPage: true });

  // PEDAL
  await page.click('.subtabs >> text=ORIGINAL PEDAL');
  await page.locator('[data-testid=pedal-name]').waitFor();
  const pedalName = await page.locator('[data-testid=pedal-name]').innerText();
  ok(pedalName.length > 0, `PEDAL: オリジナルペダルが表示される（${pedalName}）`);
  ok(await page.getByText('どの占術がどこに反映された？').isVisible(), 'PEDAL: 反映元の説明が表示される');
  await page.screenshot({ path: `${SHOTS}/${tag}-5-pedal.png`, fullPage: true });

  // 保存
  await page.click('[data-testid=save-person]');
  await page.waitForURL(/#\/collection\/.+/);
  await okEv(async () => (await page.locator('[data-testid=person-name]').innerText()) === 'たろう', '保存: 人物詳細へ遷移し、名前が表示される');
  await okEv(async () => (await page.locator('[data-testid=pedal-name]').innerText()) === pedalName, '保存: 保存前後で同じペダル');
  await page.screenshot({ path: `${SHOTS}/${tag}-6-detail.png`, fullPage: true });

  // 再読込で保持
  await page.reload();
  await okEv(async () => (await page.locator('[data-testid=pedal-name]').innerText()) === pedalName, '再読込: 保存データが保持される');

  // 同じ生年月日の別人物（重複案内・自動統合しない）
  await diagnose(page, 'はなこ', '1990-01-01');
  await page.click('.subtabs >> text=ORIGINAL PEDAL');
  await page.locator('[data-testid=pedal-name]').waitFor();
  const name2 = await page.locator('[data-testid=pedal-name]').innerText();
  await page.click('[data-testid=save-person]');
  await okEv(() => page.getByText('同じ生年月日の人物がすでに登録されています').isVisible(), '重複: 同じ生年月日の案内が出る');
  await page.click('[data-testid=save-person]');
  await page.waitForURL(/#\/collection\/.+/);
  ok(name2 === pedalName, '重複: 同条件の人物は同じペダル（再現性）');

  // コレクション一覧
  await page.click('.tabbar >> text=COLLECTION');
  await okEv(async () => (await page.locator('[data-testid=collection-item]').count()) === 2, 'COLLECTION: 2人が別人物として並ぶ');
  await page.screenshot({ path: `${SHOTS}/${tag}-7-collection.png`, fullPage: true });
  await page.fill('input[type=search]', 'はな');
  await okEv(async () => (await page.locator('[data-testid=collection-item]').count()) === 1, 'COLLECTION: 名前検索で絞り込める');
  await page.fill('input[type=search]', '');

  // 編集・再診断
  await page.locator('[data-testid=collection-item]', { hasText: 'はなこ' }).click();
  await page.click('[data-testid=edit]');
  await page.fill('input[name=displayName]', 'はなこ2');
  await page.click('button[type=submit]');
  await okEv(async () => (await page.locator('[data-testid=person-name]').innerText()) === 'はなこ2', '編集: 表示名を更新できる');
  await page.click('[data-testid=rediagnose]');
  await page.waitForURL(/#\/result\//, { timeout: 10000 });
  await page.click('.subtabs >> text=ORIGINAL PEDAL');
  await page.click('[data-testid=save-person]');
  await page.waitForURL(/#\/collection\/.+/);
  await okEv(async () => (await page.locator('select option').count()) === 2, '再診断: 診断履歴が2件になる（過去結果が残る）');

  // 削除
  await page.click('[data-testid=delete]');
  await page.waitForURL(/#\/collection$/);
  await okEv(async () => (await page.locator('[data-testid=collection-item]').count()) === 1, '削除: 人物を削除できる');

  // バックアップ書き出し → 全削除 → 読み込み
  await page.click('.tabbar >> text=SETTINGS');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-testid=export]')]);
  const file = path.join(SHOTS, `${tag}-backup.json`);
  await dl.saveAs(file);
  ok(JSON.parse(fs.readFileSync(file, 'utf8')).persons.length === 1, '設定: バックアップを書き出せる');
  await page.click('[data-testid=clear-all]');
  await page.click('.tabbar >> text=COLLECTION');
  await okEv(() => page.getByText('まだ誰も登録されていません。').isVisible(), '設定: 全データ削除できる');
  await page.click('.tabbar >> text=SETTINGS');
  await page.setInputFiles('[data-testid=import-file]', file);
  await page.getByText('読み込みました').waitFor();
  await page.click('.tabbar >> text=COLLECTION');
  await okEv(async () => (await page.locator('[data-testid=collection-item]').count()) === 1, '設定: バックアップから復元できる');
  await page.screenshot({ path: `${SHOTS}/${tag}-8-settings.png`, fullPage: true });

  ok(errors.filter((e) => !/favicon/.test(e)).length === 0, `コンソールエラーなし ${errors.join(' | ')}`);
  await ctx.close();
}

(async () => {
  const server = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], { stdio: 'ignore', cwd: path.join(__dirname, '..') });
  const browser = await chromium.launch();
  try {
    await waitServer();
    await run(browser, 'mobile-390', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await run(browser, 'desktop-1280', { viewport: { width: 1280, height: 800 } });

    // PWA: manifest / Service Worker / オフライン
    console.log('\n== PWA ==');
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await page.goto(URL);
    const mf = await (await page.request.get(URL + 'manifest.webmanifest')).json();
    ok(mf.name === 'BIRTH CODE' && mf.display === 'standalone' && mf.icons.length >= 3, 'manifest: 名前・standalone・アイコン');
    for (const i of mf.icons) ok((await page.request.get(URL + i.src)).ok(), `manifest: ${i.src} が取得できる`);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await sleep(500);
    ok(await page.evaluate(() => !!navigator.serviceWorker.controller), 'Service Worker: ページを制御している');
    await ctx.setOffline(true);
    await page.reload();
    ok(await page.locator('[data-testid=start]').isVisible(), 'オフライン: HOME が表示できる');
    await page.goto(URL + '#/collection');
    await okEv(() => page.getByText('PEDAL COLLECTION').isVisible(), 'オフライン: 保存データ画面（COLLECTION）が開ける');
    await ctx.close();
  } catch (e) {
    fail++; console.log('  FAIL', 'exception:', e.message);
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
