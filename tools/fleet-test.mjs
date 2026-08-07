#!/usr/bin/env node
/* The fleet page is one layout: a grid of cards. Exact values, never truthiness. */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const r = createRequire(import.meta.url);
const { chromium } = r(resolve(homedir(), 'Claude Helpers/Mission Control/node_modules/playwright/index.js'));
const FLEET = JSON.parse(readFileSync(resolve(fileURLToPath(import.meta.url), '../../data/fleet.json'), 'utf8'));
const B = (process.argv[2] || 'http://localhost:8472/docs').replace(/\/$/, '');
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);
const b = await chromium.launch();

for (const [w, want] of [[2560, 4], [1600, 3], [1000, 2], [390, 1]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 1000 } })).newPage();
  await p.goto(`${B}/fleet.html`, { waitUntil: 'networkidle' });
  const cols = await p.$eval('#rows', e => getComputedStyle(e).gridTemplateColumns.split(' ').length);
  cols === want ? ok(`${w}px: ${cols} columns`) : fail(`${w}px: ${cols} columns, expected ${want}`);
  if (w === 1600) {
    const noStage = await p.$$eval('.stage, .viewswitch', e => e.length);
    noStage === 0 ? ok('no preview panel and no view switch') : fail(`${noStage} removed components still present`);
    const lw = await p.$eval('.list', e => Math.round(e.getBoundingClientRect().width));
    lw > 1300 ? ok(`the grid runs full width (${lw}px of 1600)`) : fail(`list only ${lw}px wide`);
    const n = await p.$$eval('.row:not([hidden])', e => e.length);
    n === FLEET.length ? ok(`${n} cars shown`) : fail(`${n} rows, expected ${FLEET.length}`);
    // every card carries a photo, a name, a class and a price
    const bad = await p.$$eval('.row:not([hidden])', els => els.filter(el =>
      !el.querySelector('img[src$=".webp"]') || !el.querySelector('.row-nm') ||
      !el.querySelector('.row-tag') || !/\d/.test(el.querySelector('.row-price')?.textContent || '')).length);
    bad === 0 ? ok('every card has a photo, a name, a class and a price') : fail(`${bad} incomplete cards`);
    // the whole card is the link, not just an arrow
    const links = await p.$$eval('.row:not([hidden]) > a.row-link[href^="car-"]', e => e.length);
    links === FLEET.length ? ok('the whole card is the link') : fail(`${links} card links, expected ${FLEET.length}`);
    await p.selectOption('#sort', 'price-desc');
    const first = await p.$eval('.row:not([hidden])', e => e.dataset.slug);
    first === 'jaguar-xf' ? ok('sorting by price puts the Jaguar XF first at 65 €') : fail(`desc first: ${first}`);
    await p.click('.chip[data-cls="suv"]');
    const suv = await p.$$eval('.row:not([hidden])', e => e.length);
    suv === 3 ? ok('the SUV filter returns exactly 3') : fail(`SUV shows ${suv}, expected 3`);
  }
  await p.close();
}
await b.close();
console.log(process.exitCode ? 'FLEET: FAILURES' : 'FLEET CLEAN');
