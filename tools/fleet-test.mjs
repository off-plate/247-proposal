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

for (const [w, want] of [[2560, 4], [1600, 4], [1300, 3], [1000, 2], [390, 1]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 1000 } })).newPage();
  await p.goto(`${B}/fleet/`, { waitUntil: 'networkidle' });
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
    const links = await p.$$eval('.row:not([hidden]) > a.row-link[href*="cars/"]', e => e.length);
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

/* availability: the calendar on a car page, the date filter on the fleet, and the
   handoff from the homepage search. The dates are demo data, but the filtering is
   real arithmetic and has to be right. */
{
  const AV = JSON.parse(readFileSync(resolve(fileURLToPath(import.meta.url), '../../data/availability.json'), 'utf8')).booked;
  const p = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();

  await p.goto(`${B}/cars/jaguar-xf/`, { waitUntil: 'networkidle' });
  const cal = await p.evaluate(() => ({
    months: document.querySelectorAll('.cal-month').length,
    free: document.querySelectorAll('.cal-d.is-free').length,
    busy: document.querySelectorAll('.cal-d.is-busy').length,
    note: !!document.querySelector('.cal-note'),
  }));
  cal.months === 3 && cal.free > 0 && cal.busy > 0 && cal.note
    ? ok(`calendar: 3 months, ${cal.free} free and ${cal.busy} booked days, labelled as demo data`)
    : fail(`calendar: ${JSON.stringify(cal)}`);

  // a car booked across a range must disappear from the fleet for that range
  const [bFrom, bTo] = AV['golf-5'][0];
  await p.goto(`${B}/fleet/`, { waitUntil: 'networkidle' });
  const all = await p.$$eval('.row:not([hidden])', e => e.length);
  await p.fill('#f-from', bFrom); await p.$eval('#f-from', e => e.dispatchEvent(new Event('change')));
  await p.fill('#f-to', bTo); await p.$eval('#f-to', e => e.dispatchEvent(new Event('change')));
  await p.waitForTimeout(200);
  const filtered = await p.$$eval('.row:not([hidden])', e => e.length);
  const golfGone = await p.$eval('.row[data-slug="golf-5"]', e => e.hidden);
  golfGone && filtered < all
    ? ok(`date filter: ${all} cars down to ${filtered} for ${bFrom} to ${bTo}, and the booked Golf 5 is gone`)
    : fail(`date filter: ${all} -> ${filtered}, golf hidden ${golfGone}`);

  // every car still listed must genuinely be free for every night in the range
  const wrong = await p.evaluate(([from, to]) => {
    const busy = (slug, day) => (window.AVAIL[slug] || []).some(([a, z]) => day >= a && day <= z);
    return [...document.querySelectorAll('.row:not([hidden])')].filter(el => {
      const d = new Date(from + 'T00:00:00'), end = new Date(to + 'T00:00:00');
      while (d <= end) { if (busy(el.dataset.slug, d.toISOString().slice(0, 10))) return true; d.setDate(d.getDate() + 1); }
      return false;
    }).length;
  }, [bFrom, bTo]);
  wrong === 0 ? ok('every car still listed is free on every night of the range') : fail(`${wrong} listed cars are booked in the range`);

  // and the homepage search lands on exactly that result
  await p.goto(`${B}/fleet/?from=${bFrom}&to=${bTo}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(200);
  const viaUrl = await p.$$eval('.row:not([hidden])', e => e.length);
  const prefilled = await p.evaluate(() => [document.getElementById('f-from').value, document.getElementById('f-to').value]);
  viaUrl === filtered && prefilled[0] === bFrom && prefilled[1] === bTo
    ? ok('the homepage search arrives with its dates applied and the same result')
    : fail(`via url ${viaUrl} against ${filtered}, fields ${prefilled.join(' ')}`);
  await p.close();
}

await b.close();
console.log(process.exitCode ? 'FLEET: FAILURES' : 'FLEET CLEAN');
