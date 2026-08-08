#!/usr/bin/env node
/* MOBILE. Measured at 360 and 390 on every page type.
   Three things, each of which has actually broken here before:
     - the page never scrolls sideways
     - no interactive control is under 38px tall, counting its label as its hit area
     - no visible text falls under 12.5px
   The 404 is served from the project path because it carries site-absolute paths;
   at the plain docs path its stylesheet 404s and the page renders unstyled. */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
const r = createRequire(import.meta.url);
const { chromium } = r(resolve(homedir(), 'Claude Helpers/Mission Control/node_modules/playwright/index.js'));
const B = (process.argv[2] || 'http://localhost:8472/docs').replace(/\/$/, '');
const ROOT404 = process.argv[3] || 'http://localhost:8472/247-proposal';
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);
const b = await chromium.launch();

const probe = () => ({
  over: Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0),
  tiny: [...new Set([...document.querySelectorAll('a,button,summary')].filter(e => {
    const t = e.closest('label') || e, r = t.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.height < 38;
  }).map(e => e.tagName + '.' + String(e.className).split(' ')[0]))].slice(0, 4),
  small: [...new Set([...document.querySelectorAll('p,li,span,td,em,a,strong')].filter(e =>
    e.getBoundingClientRect().height > 0 &&
    parseFloat(getComputedStyle(e).fontSize) < 12.5 &&
    e.textContent.trim().length > 2
  ).map(e => e.tagName + '.' + String(e.className).split(' ')[0]))].slice(0, 4),
  styled: getComputedStyle(document.body).fontFamily.includes('Switzer'),
});

for (const w of [390, 360]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 844 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  for (const pg of ['', 'fleet/', 'roads/', 'faq/', 'how-it-works/', 'about/', 'book/', 'cars/jaguar-xf/']) {
    await p.goto(`${B}/${pg}`, { waitUntil: 'networkidle' });
    const r = await p.evaluate(probe);
    const bad = [];
    if (r.over) bad.push(`${r.over}px sideways scroll`);
    if (r.tiny.length) bad.push(`tap targets under 38px: ${r.tiny.join(', ')}`);
    if (r.small.length) bad.push(`text under 12.5px: ${r.small.join(', ')}`);
    bad.length ? fail(`${w} /${pg || ''}: ${bad.join(' | ')}`) : ok(`${w} /${pg || 'index'}: clean`);
  }
  // the confirmation screen only exists after the flow is walked, and it broke here
  // before: a slider, and different dimensions than the steps ahead of it
  await p.goto(`${B}/book/?car=hyundai-santa-fe-2016`, { waitUntil: 'networkidle' });
  await p.evaluate(() => localStorage.clear());
  await p.goto(`${B}/book/?car=hyundai-santa-fe-2016`, { waitUntil: 'networkidle' });
  await p.click('.loc[data-loc="tia"]');
  const from = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  await p.fill('#d-from', from); await p.$eval('#d-from', e => e.dispatchEvent(new Event('change')));
  await p.fill('#d-to', to); await p.$eval('#d-to', e => e.dispatchEvent(new Event('change')));
  await p.click('#next');
  await p.click('#next');
  await p.fill('#drv-name', 'Michael Florian');
  await p.fill('#drv-mail', 'michael@example.com');
  await p.fill('#drv-tel', '+420777123456');
  await p.click('#next');
  await p.waitForSelector('#done-ref');
  const doneW = await p.$eval('.step.done', e => e.getBoundingClientRect().width);
  const stepW = await p.$eval('.bookgrid', e => e.getBoundingClientRect().width);
  const rd = await p.evaluate(probe);
  const badDone = [];
  if (rd.over) badDone.push(`${rd.over}px sideways scroll`);
  if (rd.tiny.length) badDone.push(`tap targets under 38px: ${rd.tiny.join(', ')}`);
  if (rd.small.length) badDone.push(`text under 12.5px: ${rd.small.join(', ')}`);
  if (Math.abs(doneW - stepW) > 2) badDone.push(`confirmation is ${doneW}px wide, the steps before it are ${stepW}px`);
  badDone.length ? fail(`${w} /book/ confirmation: ${badDone.join(' | ')}`) : ok(`${w} /book/ confirmation: full width, clean`);

  await p.goto(`${ROOT404}/404.html`, { waitUntil: 'networkidle' });
  const r404 = await p.evaluate(probe);
  r404.styled && !r404.over && !r404.tiny.length
    ? ok(`${w} /404: styled, clean`)
    : fail(`${w} /404: styled ${r404.styled}, over ${r404.over}, tiny ${r404.tiny.join(', ')}`);
  await ctx.close();
}
await b.close();
console.log(process.exitCode ? 'MOBILE: FAILURES' : 'MOBILE CLEAN');
