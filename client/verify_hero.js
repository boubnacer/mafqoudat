const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const cardTexts = await page.locator('text=نُشر مؤخرًا').locator('xpath=../..').first().innerText().catch(() => 'not found via xpath');
  console.log('SECTION TEXT:\n', cardTexts);

  await browser.close();
})();
