#!/usr/bin/env node
/* Structural guard on the stylesheet. Every rule listed here is load-bearing:
   if an edit deletes one, the page silently collapses and no colour or overflow
   check will notice. This exists because two regex edits quietly removed 206 and
   then 45 lines of layout in a single session. */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const css = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../docs/css/app.css'), 'utf8');

const REQUIRED = [
  // the reference rebuild, 2026-08-07. Homepage layout lives entirely in these.
  '.hz-hero {', '.hz-hero-img {', '.hz-bar {', '.hz-bar-fields {', '.hz-bar-foot {',
  '.hz-head {', '.pgrid {', '.pcard {', '.pcard-bed {', '.pcard-price {',
  '.taglist {', '.tag {', '.rangegrid {', '.rcard {', '.rcard-fig {',
  '.hz-mosaic {', '.mo-cta {', '.mo-stat {', '.mo-tall {', '.foot-card {',
  '.pillnav {', '.brand {', '.burger {', '.sheet {',
  '.gantry {', '.gantry-go {',
  '.split {', '.stage {', '.list {', '.row {', '.chip {',
  '.lane {', '.lanes {', '.exitrail {', '.flagstrip {',
  '.dests {', '.dest {', '.road-a1 {', '.road-amalfi {', '.road-stelvio {',
  '.faq-list {', '.qa-item {', '.faq-group {',
  '.steps {', '.step-row {', '.bring-grid {',
  '.foot {', '.foot-top {', '.foot-desks {', '.foot-col h2 {', '.foot-legal {', '.foot-contact {',
  '.btn-verde {', '.btn-wa {', '.reservebar {',
];
// breakpoints that carry the entire mobile layout
const REQUIRED_MEDIA = ['@media (max-width: 1100px)', '@media (max-width: 780px)', '@media (max-width: 560px)'];

let bad = 0;
for (const r of REQUIRED) {
  if (!css.includes(r)) { console.log(`MISSING RULE: ${r}`); bad++; }
}
for (const m of REQUIRED_MEDIA) {
  if (!css.includes(m)) { console.log(`MISSING BREAKPOINT: ${m}`); bad++; }
}
const open = (css.match(/\{/g) || []).length, close = (css.match(/\}/g) || []).length;
if (open !== close) { console.log(`UNBALANCED BRACES: ${open} open, ${close} close`); bad++; }

// things that must never come back
for (const [needle, why] of [['MartianMono', 'the mono typeface was removed'],
                             ['Archivo', 'the type system is Switzer now, one family, one file'],
                             ['@keyframes pulse', 'the pulsing dot was removed'],
                             ['backdrop-filter', 'glassmorphism is banned']]) {
  if (css.includes(needle)) { console.log(`FORBIDDEN: ${needle} (${why})`); bad++; }
}

console.log(bad === 0 ? `CSS GUARD CLEAN (${REQUIRED.length} rules, ${REQUIRED_MEDIA.length} breakpoints, braces balanced)` : `CSS GUARD: ${bad} problems`);
process.exit(bad ? 1 : 0);
