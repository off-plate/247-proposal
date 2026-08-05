#!/usr/bin/env node
/* Contrast + overflow audit for AUTOSOLE.
   node tools/audit.mjs http://localhost:8471/docs
   Checks every page at 390/834/1440/2560, light and dark (#dark hash).
   Contrast: computed text color composited over effective background, WCAG 2.1.
   Overflow: document.scrollWidth vs viewport. Exit 1 on any failure. */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

const HELPERS = resolve(homedir(), 'Claude Helpers');
const req = createRequire(import.meta.url);
let chromium;
for (const p of [
  resolve(HELPERS, 'Mission Control/node_modules/playwright/index.js'),
  resolve(HELPERS, 'maps-leads/node_modules/playwright/index.js'),
]) { try { chromium = req(p).chromium; break; } catch {} }
if (!chromium) { console.error('playwright not found'); process.exit(2); }

const BASE = process.argv[2] || 'http://localhost:8471/docs';
const PAGES = ['index.html', 'fleet.html', 'book.html', 'roads.html', 'company.html', 'car-porsche-911.html', 'car-fiat-500.html', '404.html'];
const WIDTHS = [390, 834, 1440, 2560];

const AUDIT_JS = () => {
  const parse = c => {
    const m = c.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?\)/);
    return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
  };
  const comp = (fg, bg) => fg[3] >= 1 ? fg : [0, 1, 2].map(i => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat([1]);
  const lum = ([r, g, b]) => {
    const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const bgOf = el => {
    let n = el;
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c[3] > 0.9) return c;
      // element with a background-image (photo) cannot be judged here; mark skip
      if (getComputedStyle(n).backgroundImage !== 'none' && n !== el) return null;
      n = n.parentElement;
    }
    const root = parse(getComputedStyle(document.body).backgroundColor);
    return root && root[3] > 0 ? root : [255, 255, 255, 1];
  };
  const fails = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; const el = t.parentElement;
    if (!el || !t.textContent.trim() || seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('[hidden],[aria-hidden="true"]')) continue;
    if (cs.webkitTextStroke && cs.webkitTextStroke !== '0px' && parse(cs.color)?.[3] === 0) continue; // outline-drawn display type
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const fg = parse(cs.color); if (!fg) continue;
    let bg = bgOf(el);
    if (bg && Math.abs(lum(bg) - lum(parse(getComputedStyle(document.body).backgroundColor) || [255,255,255,1])) < 0.001) {
      // ancestor walk hit the page background; check the painted stack for an overlapping layer
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const rr = el.getBoundingClientRect();
      const stack = document.elementsFromPoint(Math.min(Math.max(rr.left + rr.width / 2, 1), innerWidth - 1), Math.min(Math.max(rr.top + rr.height / 2, 1), innerHeight - 1));
      let past = false;
      for (const s of stack) {
        if (s === el) { past = true; continue; }
        if (!past || s.contains(el)) continue;
        const scs = getComputedStyle(s);
        if (scs.backgroundImage !== 'none') { bg = null; break; }
        const sc = parse(scs.backgroundColor);
        if (sc && sc[3] > 0.9) { bg = sc; break; }
      }
    }
    if (!bg) continue; // photo backdrop, judged by eye instead
    const cr = ratio(comp(fg, bg), bg);
    const size = parseFloat(cs.fontSize);
    const bold = +cs.fontWeight >= 600;
    const need = (size >= 24 || (size >= 18.66 && bold)) ? 3 : 4.5;
    if (cr < need) fails.push({
      text: t.textContent.trim().slice(0, 40),
      sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''),
      cr: Math.round(cr * 100) / 100, need,
    });
  }
  return { fails, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
};

const browser = await chromium.launch();
let bad = 0;
for (const theme of ['light', 'dark']) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      await page.goto(`${BASE}/${p}${theme === 'dark' ? '#dark' : ''}`, { waitUntil: 'networkidle' });
      if (theme === 'dark') await page.reload({ waitUntil: 'networkidle' }); // hash set before load matters
      await page.evaluate(() => document.fonts.ready);
      const { fails, overflow } = await page.evaluate(AUDIT_JS);
      if (overflow > 1) { console.log(`OVERFLOW ${theme} ${w} ${p}: +${overflow}px`); bad++; }
      for (const f of fails) { console.log(`CONTRAST ${theme} ${w} ${p}: ${f.cr} < ${f.need} on <${f.sel}> "${f.text}"`); bad++; }
    }
    await ctx.close();
  }
}
await browser.close();
console.log(bad === 0 ? 'AUDIT CLEAN' : `AUDIT: ${bad} failures`);
process.exit(bad === 0 ? 0 : 1);
