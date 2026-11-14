// public/icon.svg から PWA 用 PNG アイコンを生成する（Playwright 使用）
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(require('node:path').join(require('node:child_process').execSync('npm root -g').toString().trim(), 'playwright'))); }
const { readFileSync } = require('node:fs');

const svg = readFileSync('public/icon.svg', 'utf8');
const targets = [
  ['public/icon-192.png', 192, 1],
  ['public/icon-512.png', 512, 1],
  ['public/apple-touch-icon.png', 180, 1],
  ['public/icon-512-maskable.png', 512, 0.72], // maskable は安全領域のため縮小して余白を確保
];
(async () => {
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [path, size, scale] of targets) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * scale);
  const html = `<body style="margin:0;background:#14110e;display:grid;place-items:center;width:${size}px;height:${size}px">
    <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body>`;
  await page.setContent(html);
  await page.screenshot({ path, omitBackground: false });
  console.log('wrote', path);
}
await browser.close();
})();
