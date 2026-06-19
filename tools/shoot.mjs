// Chụp ảnh THẬT giao diện demo bằng cách điều khiển Chrome (Puppeteer).
// Thực hiện đúng kịch bản tấn công rồi chụp từng trạng thái. Một số ảnh được
// chụp theo PHẦN TỬ (element screenshot) ở DPI cao để chữ to, rõ trên báo cáo.
import puppeteer from 'puppeteer-core';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'http://127.0.0.1:5173';
const OUT = '/home/son/KTANM_final_report/ANDD/report_latex/figures';
const CHROME = '/usr/bin/google-chrome';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2'],
  defaultViewport: { width: 1340, height: 1080, deviceScaleFactor: 2 },
});

const page = await browser.newPage();

async function shot(name) {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log('shot ->', name);
}

// Ẩn/hiện header sticky để không lọt vào ảnh element
async function setHeader(display) {
  await page.evaluate((d) => {
    const h = document.querySelector('header');
    if (h) h.style.display = d;
  }, display);
}

// Chụp riêng một phần tử theo selector (ảnh to, gọn, chữ rõ)
async function shotEl(selector, name, padding = 14) {
  const el = await page.$(selector);
  if (!el) { console.log('shotEl MISS:', selector); return false; }
  await setHeader('none');
  // Cuộn về đầu trang để toạ độ boundingBox (viewport) trùng toạ độ document,
  // captureBeyondViewport sẽ chụp được cả phần dưới màn hình.
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(400);
  const box = await el.boundingBox();
  if (!box) { console.log('shotEl no-box:', selector); await setHeader(''); return false; }
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: {
      x: Math.max(0, box.x - padding), y: Math.max(0, box.y - padding),
      width: box.width + padding * 2, height: box.height + padding * 2,
    },
  });
  await setHeader('');
  console.log('shotEl ->', name);
  return true;
}

async function clickByText(text) {
  const ok = await page.evaluate((t) => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(el => (el.textContent || '').trim().includes(t));
    if (b) { b.click(); return true; }
    return false;
  }, text);
  console.log(ok ? `click OK: ${text}` : `click MISS: ${text}`);
  return ok;
}

async function waitAuxRows(n, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const c = await page.evaluate(() =>
      (document.body.innerText.match(/views · wt/g) || []).length);
    if (c >= n) return c;
    await sleep(300);
  }
  return 0;
}

try {
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 30000 });
  await sleep(1500);

  // 1) Màn hình tổng quan
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot('ui_01_overview');

  // 2) Nạp nạn nhân thật -> chụp riêng bảng điều khiển (to, rõ trọng số)
  await clickByText('Nạn nhân thật');
  const rows = await waitAuxRows(3);
  console.log('aux rows:', rows);
  await sleep(700);
  await shotEl('#attacker-console', 'ui_02_aux_loaded');

  // 3) Thực thi tấn công -> chụp các thẻ con (ngắn-rộng, dễ đọc)
  await clickByText('THỰC THI GIẢI ẨN DANH');
  await page.waitForFunction(
    () => /Đã định danh|Định danh thất bại/.test(document.body.innerText),
    { timeout: 15000 }
  );
  await sleep(1200);
  await shotEl('#result-card', 'ui_03_result_identified');
  await shotEl('#exposed-history', 'ui_04_exposed_history');
  await shotEl('#top-candidates', 'ui_06_top_candidates');

  // 5) Kịch bản BỀN VỮNG: aux có nhiễu vẫn định danh được -> thẻ kết quả
  await page.reload({ waitUntil: 'networkidle2' });
  await sleep(1200);
  await clickByText('Aux có nhiễu');
  await waitAuxRows(5);
  await sleep(600);
  await clickByText('THỰC THI GIẢI ẨN DANH');
  await page.waitForFunction(
    () => /Đã định danh|Định danh thất bại/.test(document.body.innerText),
    { timeout: 15000 }
  );
  await sleep(1200);
  await shotEl('#result-card', 'ui_05_robust_noisy');

  console.log('DONE');
} catch (e) {
  console.error('ERR', e);
} finally {
  await browser.close();
}
