#!/usr/bin/env node
/* Functional walk for the 24/7 proposal. Exits 1 on any failure. */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
const req = createRequire(import.meta.url);
let chromium;
for (const p of [
  resolve(homedir(), 'Claude Helpers/Mission Control/node_modules/playwright/index.js'),
  resolve(homedir(), 'Claude Helpers/maps-leads/node_modules/playwright/index.js'),
]) { try { chromium = req(p).chromium; break; } catch {} }

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const FLEET = JSON.parse(readFileSync(resolve(fileURLToPath(import.meta.url), '../../data/fleet.json'), 'utf8'));
const FLEET_N = FLEET.length, FLEET_AUTO = FLEET.filter(c => c.gear === 'automatic').length;
const BASE = (process.argv[2] || 'http://localhost:8472/docs').replace(/\/$/, '');
const SHOTDIR = process.argv[3];
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);
const snap = async n => { if (!SHOTDIR) return; const { mkdirSync } = await import('node:fs'); mkdirSync(SHOTDIR, { recursive: true }); await page.screenshot({ path: `${SHOTDIR}/${n}.png` }); };
const reset = async u => { await page.goto(u, { waitUntil: 'networkidle' }); await page.evaluate(() => localStorage.clear()); await page.goto(u, { waitUntil: 'networkidle' }); };

/* ---- fleet ---- */
await reset(`${BASE}/fleet/`);
// the sticky preview panel is gone; the list is the page. tools/fleet-test.mjs covers
// the list and grid views, so what belongs here is sorting, filtering and pricing.
await page.selectOption('#sort', 'price-asc');
let first = await page.$eval('.row:not([hidden])', e => e.dataset.slug);
first === 'golf-5' ? ok('cheapest first is Golf 5 at 30 €') : fail(`asc first: ${first}`);
await page.selectOption('#sort', 'price-desc');
first = await page.$eval('.row:not([hidden])', e => e.dataset.slug);
first === 'jaguar-xf' ? ok('dearest first is Jaguar XF at 65 €') : fail(`desc first: ${first}`);
const total = await page.$$eval('.row', e => e.length);
total === FLEET_N ? ok(`${FLEET_N} cars listed, matching their live site`) : fail(`row count ${total}, expected ${FLEET_N}`);
await page.click('.chip[data-cls="suv"]');
const suvs = await page.$$eval('.row:not([hidden])', e => e.length);
suvs === 3 ? ok('SUV filter shows 3') : fail(`SUV filter ${suvs}`);
await page.click('.tog input#f-auto'); await page.click('.chip[data-cls="all"]');
const autos = await page.$$eval('.row:not([hidden])', e => e.length);
autos === FLEET_AUTO ? ok(`automatic filter shows ${FLEET_AUTO} of ${FLEET_N}`) : fail(`automatic ${autos}, expected ${FLEET_AUTO}`);

/* ---- enquiry flow ---- */
await reset(`${BASE}/book/?car=hyundai-santa-fe-2016`);
const next = () => page.click('#next');
const disabled = () => page.$eval('#next', b => b.disabled);
(await disabled()) ? ok('step 1 gated until a location is chosen') : fail('continue enabled with no location');
await page.click('.loc[data-loc="tia"]');
const flightShown = await page.$eval('#flight-wrap', e => !e.hidden);
flightShown ? ok('airport pickup reveals the flight-number field') : fail('flight field hidden at airport');
await page.fill('#flight', 'W6 3021');
// where and when are one screen, so Continue must stay gated until the dates are in
(await disabled()) ? ok('step 1 still gated with a location but no dates') : fail('continue enabled with no dates');

const from = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
const to = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
await page.fill('#d-from', from); await page.$eval('#d-from', e => e.dispatchEvent(new Event('change')));
await page.fill('#d-to', to); await page.$eval('#d-to', e => e.dispatchEvent(new Event('change')));
const chip = await page.textContent('#days-chip');
chip.includes('5') ? ok('5 days computed') : fail(`days: ${chip}`);
(await disabled()) ? fail('continue still disabled with location and dates set') : ok('step 1 opens once both are set');
await snap('1-where-and-when'); await next();

// step 2 is the upgrade, not a picker: nobody reaches this page without a car
const upHint = await page.textContent('#up-hint');
upHint.includes('Hyundai Santa Fe 2016') ? ok('the chosen car carried into the flow') : fail(`hint: ${upHint}`);
const upOffer = await page.textContent('#up-off-nm');
const upShown = await page.$eval('#upgrade', e => !e.hidden);
upShown && upOffer === 'Jaguar XF 2015'
  ? ok('the 60 € Santa Fe is offered the 65 € Jaguar, the next car up')
  : fail(`offer: ${upOffer}, shown ${upShown}`);
const upDiff = await page.textContent('#up-diff');
upDiff.includes('5 €') && upDiff.includes('25 €')
  ? ok('both numbers stated: 5 € a day and 25 € across 5 days')
  : fail(`diff: ${upDiff}`);
await snap('2-upgrade');
await page.click('#up-take');
const afterTake = await page.textContent('#up-cur-nm');
afterTake === 'Jaguar XF 2015' ? ok('taking the upgrade swaps the car') : fail(`after take: ${afterTake}`);
// one offer, not a ladder: accepting it must not produce a fresh offer against the
// car just accepted, and coming back to the step must not either
const stillShown = await page.$eval('#upgrade', e => !e.hidden);
!stillShown ? ok('accepting the offer ends it, no second rung') : fail('a second upgrade was offered after the first');
await page.click('#back');
await page.click('#next');
const onReturn = await page.$eval('#upgrade', e => !e.hidden);
!onReturn ? ok('returning to the step does not re-offer') : fail('the offer came back on return');
await page.click('#up-keep');

(await disabled()) ? ok('contact step gated') : fail('contact step not gated');
await page.fill('#drv-name', 'Michael Florian');
await page.fill('#drv-mail', 'michael@example.com');
await page.fill('#drv-tel', '+420777123456');
await page.fill('#drv-note', 'Child seat please');
(await disabled()) ? fail('still disabled after valid contact') : ok('contact validates');
await snap('4-you'); await next();

await page.waitForSelector('#done-ref');
const board = await page.textContent('#done-t');
board.includes('325') ? ok('estimate is exactly 325 € (65 x 5, the upgrade taken)') : fail(`estimate wrong: ${board.slice(0,300)}`);
board.includes('W6 3021') ? ok('flight number carried to the request') : fail('flight missing');
board.includes('CHILD SEAT') ? ok('free-text note carried') : fail('note missing');
const wa = await page.getAttribute('#send-wa', 'href');
wa && wa.startsWith('https://wa.me/355685000700?text=') ? ok('WhatsApp deep link targets their real number') : fail(`wa href: ${wa}`);
const msg = decodeURIComponent((wa || '').split('text=')[1] || '');
msg.includes('Jaguar XF 2015') && msg.includes('325 EUR') ? ok('message body carries the upgraded car and its total') : fail(`msg: ${msg.slice(0,160)}`);
await snap('5-send');

errors.length ? fail('JS errors: ' + errors.join(' | ')) : ok('zero console/page errors across the walk');
/* the hero search collects four values; the booking page must not ask for them again */
await page.goto(`${BASE}/book/?loc=cty&ret=tia&from=2026-09-10&to=2026-09-15&tfrom=23:30&tto=10:00`, { waitUntil: 'networkidle' });
const carried = await page.evaluate(() => ({
  loc: document.querySelector('.loc.is-on')?.dataset.loc,
  oneway: document.getElementById('oneway')?.checked,
  from: document.getElementById('d-from')?.value,
  to: document.getElementById('d-to')?.value,
  tfrom: document.getElementById('t-from')?.value,
}));
carried.loc === 'cty' ? ok('hero collect location carried into booking') : fail(`loc carried as ${carried.loc}`);
carried.oneway === true ? ok('a different return office ticks the one-way box') : fail('one-way not ticked');
carried.from === '2026-09-10' && carried.to === '2026-09-15' ? ok('hero dates carried into booking') : fail(`dates ${carried.from} to ${carried.to}`);
carried.tfrom === '23:30' ? ok('a 23:30 pickup survives the handoff') : fail(`tfrom ${carried.tfrom}`);

await browser.close();
console.log(process.exitCode ? 'FLOW: FAILURES' : 'FLOW CLEAN');
