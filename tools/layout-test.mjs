#!/usr/bin/env node
/* Layout facts that kept regressing, asserted with numbers instead of opinions. */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
const r = createRequire(import.meta.url);
const { chromium } = r(resolve(homedir(), 'Claude Helpers/Mission Control/node_modules/playwright/index.js'));
const B = (process.argv[2] || 'http://localhost:8472/docs').replace(/\/$/, '');
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);
const b = await chromium.launch();

for (const w of [2560, 1600, 390]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 1000 } })).newPage();

  // one left edge per page, every top-level band
  for (const page of ['', 'fleet/', 'roads/', 'faq/', 'how-it-works/', 'about/', 'book/', 'cars/jaguar-xf/']) {
    await p.goto(`${B}/${page}`, { waitUntil: 'networkidle' });
    const edges = await p.evaluate(() => {
      const s = new Set();
      document.querySelectorAll('main > section, main > div, footer .foot-card').forEach(el => {
        const r = el.getBoundingClientRect();
        // a band may bleed on purpose; it says so with data-bleed
        if (el.hasAttribute('data-bleed')) return;
        if (r.width > 200 && getComputedStyle(el).position !== 'fixed') s.add(Math.round(r.left));
      });
      return [...s];
    });
    edges.length === 1
      ? ok(`${w} ${page || 'index'}: one left edge (${edges[0]})`)
      : fail(`${w} ${page || 'index'}: ${edges.length} left edges: ${edges.sort((a, z) => a - z).join(', ')}`);
  }

  // FAQ questions must sit inside their card, not on its border
  await p.goto(`${B}/faq/`, { waitUntil: 'networkidle' });
  const inset = await p.evaluate(() => {
    const g = document.querySelector('.faq-group'), q = document.querySelector('.qa-q');
    return Math.round(q.getBoundingClientRect().left - g.getBoundingClientRect().left);
  });
  inset >= 20 ? ok(`${w}: FAQ questions inset ${inset}px from the card border`) : fail(`${w}: FAQ inset only ${inset}px`);

  // the footer's legal line sits under the columns, not floating between them
  const foot = await p.evaluate(() => {
    const c = document.querySelector('.foot-brand'), l = document.querySelector('.foot-legal p');
    return [Math.round(c.getBoundingClientRect().left), Math.round(l.getBoundingClientRect().left)];
  });
  foot[0] === foot[1] ? ok(`${w}: footer legal aligns with the columns (${foot[0]})`) : fail(`${w}: footer legal at ${foot[1]}, columns at ${foot[0]}`);

  // the four sub-page heroes are one component: same height, and they use the width.
  // Checked at desktop widths, where two of them can be compared side by side.
  if (w >= 1200) {
    const hs = [], fills = [];
    for (const pg of ['how-it-works/', 'roads/', 'faq/', 'about/']) {
      await p.goto(`${B}/${pg}`, { waitUntil: 'networkidle' });
      const r = await p.evaluate(() => {
        const h = document.querySelector('.phero'), f = h.querySelector('.phero-foot');
        return [Math.round(h.getBoundingClientRect().height),
                Math.round(f.getBoundingClientRect().width / h.getBoundingClientRect().width * 100)];
      });
      hs.push(r[0]); fills.push(r[1]);
    }
    new Set(hs).size === 1 ? ok(`${w}: all four sub-page heroes are ${hs[0]}px tall`)
                           : fail(`${w}: hero heights differ: ${hs.join(', ')}`);
    fills.every(f => f >= 95) ? ok(`${w}: every hero uses the full shell width`)
                              : fail(`${w}: heroes fill only ${fills.join('%, ')}%`);
  }

  // the fleet card must be the homepage card, to the pixel, at desktop widths
  if (w >= 1600) {
    await p.goto(`${B}/`, { waitUntil: 'networkidle' });
    const home = await p.$eval('.pcard', e => Math.round(e.getBoundingClientRect().width));
    await p.goto(`${B}/fleet/`, { waitUntil: 'networkidle' });
    const flt = await p.$eval('.row-link', e => Math.round(e.getBoundingClientRect().width));
    home === flt ? ok(`${w}: fleet card matches the homepage card (${home}px)`)
                 : fail(`${w}: fleet card ${flt}px against homepage ${home}px`);
  }

  // no hover moves a car card or its photograph
  await p.goto(`${B}/fleet/`, { waitUntil: 'networkidle' });
  const before = await p.$eval('.row:not([hidden]) img', e => JSON.stringify(e.getBoundingClientRect()));
  await p.hover('.row:not([hidden]) .row-link');
  await p.waitForTimeout(350);
  const after = await p.$eval('.row:not([hidden]) img', e => JSON.stringify(e.getBoundingClientRect()));
  before === after ? ok(`${w}: hovering a card does not move its photograph`) : fail(`${w}: photo moved on hover`);
  await p.close();
}
await b.close();
console.log(process.exitCode ? 'LAYOUT: FAILURES' : 'LAYOUT CLEAN');
