const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const shots = [];

  async function run(opts, tag) {
    const context = await browser.newContext({ viewport: opts.viewport || { width: 1400, height: 1000 }, colorScheme: opts.colorScheme });
    const page = await context.newPage();
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`[${tag}] ${msg.text()}`); });
    page.on('pageerror', (err) => errors.push(`[${tag}] pageerror: ${err.message}`));
    if (opts.appLanguage) {
      await page.addInitScript((lang) => { window.localStorage.setItem('language', lang); }, opts.appLanguage);
    }
    await page.goto('http://localhost:3000/dash', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2500);
    const shotPath = `C:/Users/Nacer/AppData/Local/Temp/claude/c--mafqoudat/b02ab80e-2764-4429-a684-bb4f206c7baf/scratchpad/dash_${tag}.png`;
    await page.screenshot({ path: shotPath, fullPage: false });
    shots.push(shotPath);
    await context.close();
  }

  await run({ colorScheme: 'light', appLanguage: 'en' }, 'light_en');
  await run({ colorScheme: 'dark', appLanguage: 'en' }, 'dark_en');
  await run({ colorScheme: 'light', appLanguage: 'ar' }, 'light_ar');
  await run({ colorScheme: 'light', appLanguage: 'en', viewport: { width: 390, height: 844 } }, 'light_en_mobile');

  await browser.close();
  console.log(JSON.stringify({ errors, shots }, null, 2));
})();
