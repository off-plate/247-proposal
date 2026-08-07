#!/usr/bin/env node
/* THE RADIUS RULE.
   Four values, declared once, and nothing may exceed the largest of them.
     --r-lg  8px   page-size blocks: hero, footer, big photo panels
     --r     6px   cards and panels
     --r-sm  4px   inputs, thumbnails, small tokens
     --r-pill 4px  buttons and chips. They are not pills.
   A corner is a hint that two edges meet, not a shape of its own. Anything
   rounder than 8px, any percentage radius, and any literal px in the stylesheet
   is a failure, not a judgement call. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const r = createRequire(import.meta.url);
const { chromium } = r(resolve(homedir(), 'Claude Helpers/Mission Control/node_modules/playwright/index.js'));

const MAX = 8;
const CSS = readFileSync(resolve(fileURLToPath(import.meta.url), '../../docs/css/app.css'), 'utf8');
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);

// The one exception, by name: the header morphs from a bar into a pill, and a pill
// with 4px corners is neither. Nothing else may borrow --r-nav.
const NAV_EXEMPT = ['.pillnav', '.reserve-cta', '.nav-wa', '.nav-call'];

// 1. the stylesheet declares radius only through the four tokens, plus --r-nav
const decls = [...CSS.matchAll(/border-radius:\s*([^;]+)/g)].map(m => m[1].trim());
const literals = decls.filter(v => /\d+(px|%|em|rem)/.test(v.replace(/var\(--[a-z-]+\)/g, '')));
literals.length === 0
  ? ok(`all ${decls.length} radius declarations go through the scale`)
  : fail(`${literals.length} literal radii in the stylesheet: ${[...new Set(literals)].slice(0, 5).join(' | ')}`);

// 2. the tokens themselves stay inside the ceiling
for (const [name, val] of [...CSS.matchAll(/--(r|r-sm|r-lg|r-pill):\s*(\d+)px/g)].map(m => [m[1], +m[2]])) {
  val <= MAX ? ok(`--${name} is ${val}px`) : fail(`--${name} is ${val}px, over the ${MAX}px ceiling`);
}

// 3. nothing renders rounder than the ceiling, whatever the source
const B = (process.argv[2] || 'http://localhost:8472/docs').replace(/\/$/, '');
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
let worst = 0, offender = '';
for (const page of ['', 'fleet/', 'roads/', 'faq/', 'how-it-works/', 'about/', 'book/', 'cars/jaguar-xf/', '404.html']) {
  await p.goto(`${B}/${page}`, { waitUntil: 'networkidle' });
  const found = await p.evaluate(([max, exempt]) => {
    const out = [];
    for (const el of document.querySelectorAll('*')) {
      if (exempt.some(sel => el.matches(sel) || el.closest(sel))) continue;
      const cs = getComputedStyle(el);
      for (const corner of ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius']) {
        const v = parseFloat(cs[corner]);
        if (v > max) out.push([el.tagName + '.' + String(el.className).split(' ')[0], Math.round(v)]);
      }
    }
    return out.sort((a, z) => z[1] - a[1]).slice(0, 3);
  }, [MAX, NAV_EXEMPT]);
  for (const [sel, v] of found) if (v > worst) { worst = v; offender = `${page || 'index'} ${sel}`; }
}
worst === 0 ? ok(`nothing outside the header renders rounder than ${MAX}px`)
            : fail(`${offender} renders at ${worst}px, over the ${MAX}px ceiling`);
// the exception has to hold up too: the pinned header is a pill or the rule is a lie
await p.goto(`${B}/`, { waitUntil: 'networkidle' });
await p.evaluate(() => scrollTo(0, 800));
await p.waitForTimeout(900);
const navR = await p.$eval('#pillnav', e => parseFloat(getComputedStyle(e).borderTopLeftRadius));
navR > 20 ? ok(`the pinned header is a pill (${Math.round(navR)}px)`) : fail(`pinned header radius ${navR}px, expected a pill`);
await b.close();
console.log(process.exitCode ? 'RADIUS: FAILURES' : 'RADIUS CLEAN');
