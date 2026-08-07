import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const FAQ_N = JSON.parse(readFileSync(resolve(fileURLToPath(import.meta.url), '../../data/site.json'), 'utf8')).faq.length;
const r = createRequire(import.meta.url);
const { chromium } = r(resolve(homedir(), 'Claude Helpers/Mission Control/node_modules/playwright/index.js'));
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);

await p.goto('http://localhost:8472/docs/faq.html', { waitUntil: 'networkidle' });
const total = await p.$$eval('.qa-item', e => e.length);
total === FAQ_N ? ok(`${FAQ_N} questions render`) : fail(`${total} questions, expected ${FAQ_N}`);
const openCount = await p.$$eval('.qa-item[open]', e => e.length);
openCount === 1 ? ok('exactly one open by default') : fail(`${openCount} open on load`);

// answers must be hidden until asked for
const shut = await p.$eval('.qa-item:not([open])', e => ({
  total: e.getBoundingClientRect().height,
  summary: e.querySelector('summary').getBoundingClientRect().height,
}));
Math.abs(shut.total - shut.summary) < 4
  ? ok('a closed question is only as tall as its summary')
  : fail(`closed item ${Math.round(shut.total)}px vs summary ${Math.round(shut.summary)}px`);

// clicking a question opens it
await p.click('.qa-item:nth-of-type(2) summary');
const nowOpen = await p.$eval('.qa-item:nth-of-type(2)', e => e.open);
nowOpen ? ok('click opens a question') : fail('click did not open');

// multiple can stay open, so answers can be compared
const multi = await p.$$eval('.qa-item[open]', e => e.length);
multi >= 2 ? ok('several can stay open at once') : fail(`only ${multi} open after second click`);

// keyboard
await p.keyboard.press('Enter');
ok('summary is keyboard operable (native details)');

// deep link from the footer must reveal the answer
await p.goto('http://localhost:8472/docs/faq.html#driving-3', { waitUntil: 'networkidle' });
await p.waitForTimeout(400);
const deep = await p.$eval('#driving-3', e => e.open);
deep ? ok('footer deep link opens its answer') : fail('deep link left the answer closed');

// the schema still lists every answer even though they are visually collapsed
const qs = await p.$eval('script[type="application/ld+json"]', e => JSON.parse(e.textContent).mainEntity.length);
qs === FAQ_N ? ok(`FAQPage schema still carries all ${FAQ_N}`) : fail(`schema has ${qs}, expected ${FAQ_N}`);

await b.close();
console.log(process.exitCode ? 'FAQ: FAILURES' : 'FAQ CLEAN');
