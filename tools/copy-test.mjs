#!/usr/bin/env node
/* COPY RULES, checked on the built pages rather than trusted.
   The banned construction is the "X, not Y" / "not this, this" contrast. It is a
   tic, it reads as trying to be clever, and it was all over this site. */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const DOCS = resolve(fileURLToPath(import.meta.url), '../../docs');
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(d, e.name)) : (e.name.endsWith('.html') ? [join(d, e.name)] : []));

const BANNED = [
  [/,\s*not\s+(a|an|the|one|another|just)\b/i, 'the "X, not Y" contrast'],
  [/\bit is not\b[^.]{0,40}\bit is\b/i, 'the "it is not X, it is Y" contrast'],
  [/\bnot just\b[^.]{0,40}\bbut\b/i, 'the "not just X but Y" contrast'],
  [/\b\w+ instead\.$/im, 'the "X instead." contrast ending'],
  [/—/, 'an em dash'],
  [/\b(seamless|cutting-edge|world-class|best-in-class|streamline|supercharge|empower)\b/i, 'a marketing formula word'],
  [/\b(same day|within the hour|inside the hour)\b/i, 'an unpublished response time'],
];
// the About page reproduces the client's own wording verbatim, on request
const EXEMPT = ['about/index.html'];

const files = walk(DOCS);
let hits = 0;
for (const f of files) {
  const rel = f.slice(DOCS.length + 1);
  if (EXEMPT.some(e => rel.endsWith(e))) continue;
  const text = readFileSync(f, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ');
  for (const [re, what] of BANNED) {
    const m = text.match(re);
    if (m) { hits++; if (hits < 8) fail(`${rel}: ${what} -> "${text.slice(Math.max(0, m.index - 45), m.index + 55).trim()}"`); }
  }
}
hits === 0 ? ok(`no banned construction across ${files.length} pages`) : fail(`${hits} banned constructions`);
console.log(process.exitCode ? 'COPY: FAILURES' : 'COPY CLEAN');
