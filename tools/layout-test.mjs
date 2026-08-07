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
    for (const pg of ['fleet/', 'how-it-works/', 'roads/', 'faq/', 'about/']) {
      await p.goto(`${B}/${pg}`, { waitUntil: 'networkidle' });
      const r = await p.evaluate(() => {
        const h = document.querySelector('.phero'), f = h.querySelector('.phero-grid');
        return [Math.round(h.getBoundingClientRect().height),
                Math.round(f.getBoundingClientRect().width / h.getBoundingClientRect().width * 100)];
      });
      hs.push(r[0]); fills.push(r[1]);
    }
    new Set(hs).size === 1 ? ok(`${w}: all five sub-page heroes are ${hs[0]}px tall`)
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

  // the homepage hero starts at the very top: any gap shows through the clear header
  await p.goto(`${B}/`, { waitUntil: 'networkidle' });
  const heroTop = await p.$eval('.hz-hero', e => Math.round(e.getBoundingClientRect().top));
  heroTop === 0 ? ok(`${w}: the hero photograph starts at the top of the page`)
                : fail(`${w}: ${heroTop}px of page background above the hero`);

  // the nav links sit with the logo, not centred, and close up further when pinned
  if (w >= 1200) {
    await p.goto(`${B}/fleet/`, { waitUntil: 'networkidle' });
    const gap = () => p.evaluate(() => {
      const l = document.querySelector('.brand'), a = document.querySelector('.pillnav-links a');
      return Math.round(a.getBoundingClientRect().left - l.getBoundingClientRect().right);
    });
    const rest = await gap();
    await p.evaluate(() => scrollTo(0, 900));
    await p.waitForTimeout(800);
    const pinned = await gap();
    rest < 120 && pinned < rest
      ? ok(`${w}: nav links sit ${rest}px after the logo, ${pinned}px once pinned`)
      : fail(`${w}: nav gap ${rest}px at rest, ${pinned}px pinned`);
  }

  // every select is drawn by us, never by the OS on top of our own chevron
  await p.goto(`${B}/fleet/`, { waitUntil: 'networkidle' });
  const native = await p.$$eval('select', els => els.filter(e => getComputedStyle(e).appearance !== 'none').length);
  native === 0 ? ok(`${w}: no select shows an OS chevron over ours`) : fail(`${w}: ${native} selects still native`);

  // no hover moves a car card or its photograph
  await p.goto(`${B}/fleet/`, { waitUntil: 'networkidle' });
  // measure against the document, not the viewport: hovering scrolls the card into
  // view on a phone, which moves the viewport rect without anything having moved
  const box = e => { const r = e.getBoundingClientRect();
    return JSON.stringify([Math.round(r.width), Math.round(r.height), Math.round(r.left + scrollX), Math.round(r.top + scrollY)]); };
  await p.$eval('.row:not([hidden]) .row-link', e => e.scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(200);
  const before = await p.$eval('.row:not([hidden]) img', box);
  await p.hover('.row:not([hidden]) .row-link');
  await p.waitForTimeout(350);
  const after = await p.$eval('.row:not([hidden]) img', box);
  before === after ? ok(`${w}: hovering a card does not move its photograph`) : fail(`${w}: photo moved on hover`);
  await p.close();
}
/* the booking page is a checkout: it fits the screen at every step, the steps stay
   in view, and the page itself never scrolls. Short laptops are the real test. */
for (const [w, h] of [[1440, 760], [1600, 900], [1920, 1080]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  const from = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 26 * 864e5).toISOString().slice(0, 10);
  await p.goto(`${B}/book/?car=hyundai-accent`, { waitUntil: 'networkidle' });
  const check = async label => {
    const r = await p.evaluate(() => ({
      overflow: document.documentElement.scrollHeight - document.documentElement.clientHeight,
      chips: Math.round(document.querySelector('.chiprail').getBoundingClientRect().top),
      controls: document.querySelector('.stepnav').getBoundingClientRect().bottom <= innerHeight + 1,
      footer: !!document.querySelector('.foot') && getComputedStyle(document.querySelector('.foot')).display !== 'none',
    }));
    r.overflow === 0 && r.chips > 0 && r.controls && !r.footer
      ? ok(`${w}x${h} ${label}: fits the screen, steps and controls in view`)
      : fail(`${w}x${h} ${label}: overflow ${r.overflow}px, chips ${r.chips}, controls ${r.controls}, footer ${r.footer}`);
  };
  await check('where and when');
  await p.click('.loc[data-loc="tia"]');
  await p.fill('#d-from', from); await p.$eval('#d-from', e => e.dispatchEvent(new Event('change')));
  await p.fill('#d-to', to); await p.$eval('#d-to', e => e.dispatchEvent(new Event('change')));
  await p.click('#next'); await p.waitForTimeout(250); await check('upgrade');
  await p.click('#up-keep'); await p.waitForTimeout(250); await check('contact');
  await p.close();
}

await b.close();
console.log(process.exitCode ? 'LAYOUT: FAILURES' : 'LAYOUT CLEAN');
