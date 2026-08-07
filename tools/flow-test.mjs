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
await reset(`${BASE}/fleet.html`);
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
await reset(`${BASE}/book.html?car=hyundai-santa-fe-2016`);
const next = () => page.click('#next');
const disabled = () => page.$eval('#next', b => b.disabled);
(await disabled()) ? ok('step 1 gated until a location is chosen') : fail('continue enabled with no location');
await page.click('.loc[data-loc="tia"]');
const flightShown = await page.$eval('#flight-wrap', e => !e.hidden);
flightShown ? ok('airport pickup reveals the flight-number field') : fail('flight field hidden at airport');
await page.fill('#flight', 'W6 3021');
await snap('1-where'); await next();

const from = new Date(Date.now() + 9 * 864e5).toISOString().slice(0, 10);
const to = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
await page.fill('#d-from', from); await page.$eval('#d-from', e => e.dispatchEvent(new Event('change')));
await page.fill('#d-to', to); await page.$eval('#d-to', e => e.dispatchEvent(new Event('change')));
const chip = await page.textContent('#days-chip');
chip.includes('5') ? ok('5 days computed') : fail(`days: ${chip}`);
await snap('2-when'); await next();

const picked = await page.$eval('.pick.is-on', e => e.dataset.slug).catch(() => null);
picked === 'hyundai-santa-fe-2016' ? ok('car preselected from the query string') : fail(`preselected ${picked}`);
const tile = await page.textContent('.pick[data-slug="golf-5"] .pick-total');
tile.includes('150') ? ok('Golf 5 shows 150 € for 5 days (30 x 5, no invented uplift)') : fail(`golf tile: ${tile}`);
await snap('3-car'); await next();

(await disabled()) ? ok('contact step gated') : fail('contact step not gated');
await page.fill('#drv-name', 'Michael Florian');
await page.fill('#drv-mail', 'michael@example.com');
await page.fill('#drv-tel', '+420777123456');
await page.fill('#drv-note', 'Child seat please');
(await disabled()) ? fail('still disabled after valid contact') : ok('contact validates');
await snap('4-you'); await next();

await page.waitForSelector('#done-ref');
const board = await page.textContent('#done-t');
board.includes('300') ? ok('estimate is exactly 300 € (60 x 5)') : fail(`estimate wrong: ${board.slice(0,300)}`);
board.includes('W6 3021') ? ok('flight number carried to the request') : fail('flight missing');
board.includes('CHILD SEAT') ? ok('free-text note carried') : fail('note missing');
const wa = await page.getAttribute('#send-wa', 'href');
wa && wa.startsWith('https://wa.me/355685000700?text=') ? ok('WhatsApp deep link targets their real number') : fail(`wa href: ${wa}`);
const msg = decodeURIComponent((wa || '').split('text=')[1] || '');
msg.includes('Hyundai Santa Fe 2016') && msg.includes('300 EUR') ? ok('message body carries car and total') : fail(`msg: ${msg.slice(0,160)}`);
await snap('5-send');

errors.length ? fail('JS errors: ' + errors.join(' | ')) : ok('zero console/page errors across the walk');
await browser.close();
console.log(process.exitCode ? 'FLOW: FAILURES' : 'FLOW CLEAN');
