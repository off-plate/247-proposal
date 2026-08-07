import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';
const r = createRequire(import.meta.url);
const { chromium } = r(resolve(homedir(), 'Claude Helpers/Mission Control/node_modules/playwright/index.js'));
const OUT = process.argv[2];
const PAGES = process.argv.slice(3);
const b = await chromium.launch();
for (const page of PAGES) {
  for (const [tag, w] of [['desktop', 2560], ['mobile', 390]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: tag === 'mobile' ? 844 : 1440 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto(`http://localhost:8472/docs/${page}.html`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    // lazy images load on scroll but a fullPage capture resizes the viewport and can
    // leave them undrawn, so a review panel ends up judging blank rectangles that a
    // real visitor never sees. Force every image in before the shutter.
    await p.evaluate(async () => {
      document.querySelectorAll('img[loading="lazy"]').forEach(i => i.loading = 'eager');
      for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
      scrollTo(0, 0);
      await Promise.all([...document.images].map(i => i.complete ? null :
        new Promise(res => { i.addEventListener('load', res, { once: true }); i.addEventListener('error', res, { once: true }); })));
    });
    await p.waitForTimeout(700);
    const missing = await p.evaluate(() => [...document.images].filter(i => !i.complete || !i.naturalWidth).length);
    if (missing) console.log(`  WARNING ${page} ${tag}: ${missing} images did not render`);
    mkdirSync(`${OUT}/${page}`, { recursive: true });
    await p.screenshot({ path: `${OUT}/${page}/shot-${tag}.png`, fullPage: true });
    await ctx.close();
  }
  console.log('shot ' + page);
}
await b.close();
