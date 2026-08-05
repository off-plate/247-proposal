#!/usr/bin/env node
/* Header morph: full-width at rest, pill once scrolled, back again on return. */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
const r = createRequire(import.meta.url);
const { chromium } = r(resolve(homedir(), 'Claude Helpers/Mission Control/node_modules/playwright/index.js'));
const BASE = (process.argv[2] || 'http://localhost:8472/docs').replace(/\/$/, '');
const b = await chromium.launch();
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);

for (const w of [1440, 390]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 } })).newPage();
  await p.goto(`${BASE}/index.html`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);

  const rest = await p.$eval('#pillnav', e => ({ w: e.getBoundingClientRect().width, pinned: e.classList.contains('is-pinned') }));
  Math.round(rest.w) === w && !rest.pinned
    ? ok(`${w}: full width at rest (${Math.round(rest.w)}px)`)
    : fail(`${w}: at rest width ${Math.round(rest.w)} pinned=${rest.pinned}`);

  await p.evaluate(() => scrollTo(0, 600));
  await p.waitForFunction(() => document.getElementById('pillnav').classList.contains('is-pinned'), null, { timeout: 3000 })
    .then(() => ok(`${w}: compacts to a pill on scroll`)).catch(() => fail(`${w}: never pinned`));
  await p.waitForTimeout(800);   // the morph is a 620ms transition
  const pin = await p.$eval('#pillnav', e => e.getBoundingClientRect().width);
  pin < rest.w - 20 ? ok(`${w}: pill is narrower (${Math.round(pin)}px)`) : fail(`${w}: pill ${Math.round(pin)}px vs rest ${Math.round(rest.w)}px`);

  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForFunction(() => !document.getElementById('pillnav').classList.contains('is-pinned'), null, { timeout: 3000 })
    .then(() => ok(`${w}: returns to full width at the top`)).catch(() => fail(`${w}: stuck as a pill`));
  await p.close();
}
await b.close();
console.log(process.exitCode ? 'NAV: FAILURES' : 'NAV CLEAN');
