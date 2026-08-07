#!/usr/bin/env node
/* No visitor-facing URL ends in .html, and every internal link resolves. */
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve, normalize } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const DOCS = resolve(fileURLToPath(import.meta.url), '../../docs');
const fail = m => { console.log('FAIL: ' + m); process.exitCode = 1; };
const ok = m => console.log('ok: ' + m);
const walk = d => readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(join(d, e.name)) : (e.name.endsWith('.html') ? [join(d, e.name)] : []));

const files = walk(DOCS);
let dotHtml = 0, broken = 0, checked = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  for (const m of html.matchAll(/(?:href|src|action)="([^"]+)"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|#|data:)/.test(u)) continue;
    const [path] = u.split(/[?#]/);
    if (!path) continue;
    if (/\.html$/.test(path) && !/404\.html$/.test(path)) { dotHtml++; if (dotHtml < 4) fail(`${f.slice(DOCS.length+1)} still links to ${u}`); }
    // the 404 is served from any depth so it uses site-absolute paths; resolve those
    // against the site root rather than the filesystem root
    const SITE_ROOT = '/247-proposal/';
    const target = path.startsWith('/')
      ? normalize(join(DOCS, path.startsWith(SITE_ROOT) ? path.slice(SITE_ROOT.length) : path.slice(1)))
      : normalize(join(dirname(f), path));
    const candidates = [target, join(target, 'index.html')];
    checked++;
    if (!candidates.some(existsSync)) { broken++; if (broken < 6) fail(`${f.slice(DOCS.length+1)} -> ${u} does not exist`); }
  }
}
dotHtml === 0 ? ok(`no visitor-facing .html across ${files.length} pages`) : fail(`${dotHtml} links still end in .html`);
broken === 0 ? ok(`all ${checked} internal links resolve`) : fail(`${broken} broken links`);
console.log(process.exitCode ? 'LINKS: FAILURES' : 'LINKS CLEAN');
