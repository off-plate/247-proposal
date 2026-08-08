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
    month: document.querySelector('#cal-m')?.textContent,
    free: document.querySelectorAll('.cal-d.is-free').length,
    busy: document.querySelectorAll('.cal-d.is-busy').length,
    note: !!document.querySelector('.cal-note'),
    prevDisabled: document.querySelector('#cal-prev')?.disabled,
  }));
  cal.month && cal.free > 0 && cal.note && cal.prevDisabled
    ? ok(`calendar opens on ${cal.month} with ${cal.free} free days, cannot go back past this month`)
    : fail(`calendar: ${JSON.stringify(cal)}`);

  // the months are navigable and the availability changes with them
  const first = await p.$eval('#cal-m', e => e.textContent);
  await p.click('#cal-next'); await p.waitForTimeout(150);
  const second = await p.$eval('#cal-m', e => e.textContent);
  second !== first ? ok(`month navigation: ${first} to ${second}`) : fail('month did not change');
  await p.click('#cal-prev'); await p.waitForTimeout(150);

  // the calendar is the booking control, so picking a range has to produce the same
  // number of days and the same total the booking page then shows
  // a run of consecutive free days: picking across a booked night correctly refuses,
  // so the test has to choose a range the car is actually free for
  const run = await p.$$eval('button.cal-d.is-free', els => {
    const days = els.map(x => x.dataset.d).sort();
    for (let i = 0; i < days.length - 2; i++) {
      const a = new Date(days[i]), c = new Date(days[i + 2]);
      if (Math.round((c - a) / 864e5) === 2) return [days[i], days[i + 2]];
    }
    return null;
  });
  if (!run) fail('no run of three consecutive free days to test with');
  await p.click(`button.cal-d[data-d="${run[0]}"]`);
  await p.click(`button.cal-d[data-d="${run[1]}"]`);
  await p.waitForTimeout(150);
  const picked = await p.evaluate(() => ({
    line: document.querySelector('#rb-total').textContent,
    href: document.querySelector('.reservebar .btn-verde').getAttribute('href'),
    range: document.querySelectorAll('.cal-d.is-in').length,
    enabled: !!document.querySelector('#rb-total').textContent.trim(),
  }));
  picked.enabled && /\d+ days?/.test(picked.line) && picked.href.includes('book/?car=jaguar-xf&from=')
    ? ok(`calendar picks a range and the sticky bar carries it: "${picked.line}"`)
    : fail(`calendar pick: ${JSON.stringify(picked)}`);
  // a range that would cross a booked night starts a new range instead of spanning it
  const across = await p.evaluate(() => {
    const free = [...document.querySelectorAll('button.cal-d.is-free')].map(x => x.dataset.d).sort();
    const busy = [...document.querySelectorAll('.cal-d.is-busy')].map(x => x.textContent.trim());
    if (!busy.length) return null;
    const before = free.filter(d => +d.slice(-2) < +busy[0]).pop();
    const after = free.filter(d => +d.slice(-2) > +busy[busy.length - 1]).shift();
    return before && after ? [before, after] : null;
  });
  if (across) {
    await p.click(`button.cal-d[data-d="${across[0]}"]`);
    await p.click(`button.cal-d[data-d="${across[1]}"]`);
    await p.waitForTimeout(150);
    const spanned = await p.$$eval('.cal-d.is-in', e => e.length);
    spanned === 0 ? ok('a range across a booked night is refused, not spanned') : fail(`${spanned} days spanned a booked night`);
    await p.click('#cal-reset');
  }

  // booked days are not selectable at all
  const busyClickable = await p.$$eval('.cal-d.is-busy', e => e.filter(x => x.tagName === 'BUTTON').length);
  busyClickable === 0 ? ok('booked days cannot be selected') : fail(`${busyClickable} booked days are clickable`);
  // and the two pages agree on the number
  const calDays = picked.line.match(/(\d+) days?/)[1];
  await p.goto(picked.href.startsWith('http') ? picked.href : `${B}/${picked.href.replace(/^(\.\.\/)+/, '')}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(300);
  const bookDays = await p.evaluate(() => {
    const r = [...document.querySelectorAll('#sum-t tr')].find(x => x.dataset.k === 'days');
    return (r?.textContent || '').match(/(\d+)/)?.[1];
  });
  bookDays === calDays
    ? ok(`the calendar and the booking agree: ${calDays} days`)
    : fail(`calendar says ${calDays} days, booking says ${bookDays}`);
  await p.goto(`${B}/cars/jaguar-xf/`, { waitUntil: 'networkidle' });

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
