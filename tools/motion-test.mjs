#!/usr/bin/env node
/* Motion must be additive: with reduced-motion on, or with scroll timelines
   unsupported, every element must still be fully visible and in place. */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
const r = createRequire(import.meta.url);
const { chromium } = r(resolve(homedir(), 'Claude Helpers/Mission Control/node_modules/playwright/index.js'));
const BASE = (process.argv[2] || 'http://localhost:8472/docs').replace(/\/$/, '');
const b = await chromium.launch();
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);

const SAMPLE = 'index roads faq fleet'.split(' ');

// 1. reduced motion: nothing animates, nothing is hidden
const rm = await (await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })).newPage();
for (const page of SAMPLE) {
  await rm.goto(`${BASE}/${page}.html`, { waitUntil: 'networkidle' });
  await rm.evaluate(() => document.fonts.ready);
  const bad = await rm.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.lane, .dest-body > *, .sec-h, .faq-gh, .deck-h1 span, .qa-item, .foot-col, .exitrail a')) {
      const cs = getComputedStyle(el), r = el.getBoundingClientRect();
      if (r.width < 2 && r.height < 2) continue;
      if (parseFloat(cs.opacity) < 0.95) out.push(`${el.tagName}.${(el.className||'').toString().split(' ')[0]} opacity=${cs.opacity}`);
      if (cs.animationName !== 'none') out.push(`${el.tagName}.${(el.className||'').toString().split(' ')[0]} still animating: ${cs.animationName}`);
    }
    return [...new Set(out)].slice(0, 4);
  });
  bad.length ? fail(`reduced-motion ${page}: ${bad.join(' | ')}`) : ok(`reduced-motion ${page}: everything visible, nothing animating`);
}

// 2. normal motion: content must end fully visible after scrolling through
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
for (const page of SAMPLE) {
  await p.goto(`${BASE}/${page}.html`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 700) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); }
    scrollTo(0, document.body.scrollHeight);
  });
  await p.waitForTimeout(700);
  const faded = await p.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.lane, .sec-h, .faq-gh, .foot-h, .qa-item, .foot-col, .dest-body > *')) {
      const r = el.getBoundingClientRect();
      if (r.top > innerHeight || r.bottom < 0) continue;       // only judge what is on screen
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) < 0.9) out.push(`${el.tagName}.${(el.className||'').toString().split(' ')[0]} opacity`);
      const cp = cs.clipPath;
      if (cp && cp !== 'none' && /inset\(/.test(cp) && !/inset\((?:0px?\s*){1,2}0%/.test(cp) && /[1-9]\d?%/.test(cp))
        out.push(`${el.tagName}.${(el.className||'').toString().split(' ')[0]} clipped:${cp}`);
    }
    return [...new Set(out)].slice(0, 4);
  });
  faded.length ? fail(`${page}: still faded after scrolling: ${faded.join(', ')}`) : ok(`${page}: everything resolves to full opacity`);
}
await b.close();
console.log(process.exitCode ? 'MOTION: FAILURES' : 'MOTION CLEAN');
