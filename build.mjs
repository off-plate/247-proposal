#!/usr/bin/env node
// AUTOSOLE static build. Zero dependencies. JSON in, HTML out, docs/ is the site.
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const fleet = JSON.parse(readFileSync(join(ROOT, 'data/fleet.json'), 'utf8'));
const site  = JSON.parse(readFileSync(join(ROOT, 'data/site.json'), 'utf8'));
const D = join(ROOT, 'docs');
mkdirSync(join(D, 'fonts'), { recursive: true });
cpSync(join(ROOT, 'assets/fonts/switzer-var.woff2'), join(D, 'fonts/switzer-var.woff2'));

// Cache-bust every asset that is edited by hand. Without this the browser keeps serving
// yesterday's stylesheet and a deployed change looks like a change that never shipped.
const stamp = f => createHash('sha1').update(readFileSync(join(D, f))).digest('hex').slice(0, 8);
const V_CSS = stamp('css/app.css');
const V_JS  = stamp('js/app.js');

const eur = n => `${n.toLocaleString('en-IE')} €`;
const TEL = site.tel, WA = site.wa;
const FLAG = fleet.find(c => c.flagship);
const CHEAP = fleet.reduce((m, c) => c.price < m.price ? c : m);
const classes = [...new Set(fleet.map(c => c.cls))];

// ---------- shared shell ----------
const head = (title, desc, path, ogImg = 'img/cars/jaguar-xf.webp', schema = '') => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${site.base}/${path}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${site.base}/img/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="img/icon.png" sizes="any">
<link rel="apple-touch-icon" href="img/icon.png">
<link rel="preload" href="fonts/switzer-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/app.css?v=${V_CSS}">
${schema ? `<script type="application/ld+json">${schema}</script>` : ''}
</head>
<body data-page="${path.replace('.html','') || 'index'}">`;

const nav = (active = '') => `
<div class="navsentinel" aria-hidden="true"></div>
<nav class="pillnav" id="pillnav" aria-label="Main">
  <a class="brand" href="index.html" aria-label="24/7 Car Rental, home">
    <img class="brand-logo" src="img/logo-s.webp" alt="" width="280" height="145" fetchpriority="high">
    <img class="brand-logo brand-rev" src="img/logo-dark.webp" alt="" width="280" height="145">
  </a>
  <div class="pillnav-links">
    <a href="how.html"${active === 'how' ? ' aria-current="page"' : ''}>How it works</a>
    <a href="fleet.html"${active === 'fleet' ? ' aria-current="page"' : ''}>Fleet</a>
    <a href="roads.html"${active === 'roads' ? ' aria-current="page"' : ''}>Roads</a>
    <a href="faq.html"${active === 'faq' ? ' aria-current="page"' : ''}>FAQ</a>
    <a href="company.html"${active === 'company' ? ' aria-current="page"' : ''}>About</a>
  </div>
  <div class="pillnav-tools">
    <a class="nav-call" href="tel:${TEL}" title="${site.phone}">
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2Z"/></svg>
      <span class="nav-num">${site.phone}</span>
    </a>
    ${waLink(WA_GENERIC, 'nav-wa', 'WhatsApp')}
    <a class="reserve-cta" href="book.html">Book a car</a>
    <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
  </div>
</nav>
<div class="sheet" id="sheet" hidden>
  <a href="how.html">How it works</a><a href="fleet.html">Fleet</a><a href="roads.html">Roads</a><a href="faq.html">FAQ</a><a href="company.html">About</a>
  <a href="book.html" class="sheet-go">Book a car →</a>
  ${waLink(WA_GENERIC, 'sheet-wa', 'Ask on WhatsApp')}
</div>`;

// Dark rounded footer, the reference's shape. Newsletter slot carries contact instead:
// they have no mailing list and an input that discards what you type is worse than none.
const IG_ICON = `<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="currentColor" d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.05 1.8.25 2.2.42.6.22 1 .48 1.4.9.43.42.7.83.92 1.4.17.44.37 1.1.42 2.3.06 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.05 1.2-.25 1.8-.42 2.3-.22.6-.5 1-.92 1.4-.42.43-.83.7-1.4.92-.44.17-1.1.37-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.05-1.8-.25-2.3-.42-.6-.22-1-.5-1.4-.92-.42-.42-.7-.83-.9-1.4-.18-.44-.38-1.1-.43-2.3C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.9c.05-1.2.25-1.8.42-2.3.22-.6.5-1 .91-1.4.42-.42.83-.7 1.4-.9.44-.18 1.1-.38 2.3-.43C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-1.1.05-1.7.24-2.1.4-.5.2-.9.44-1.3.83-.4.4-.63.78-.83 1.3-.16.4-.35 1-.4 2.1C2.6 9.9 2.6 10.3 2.6 12s0 2.1.07 3.3c.05 1.1.24 1.7.4 2.1.2.5.44.9.83 1.3.4.4.78.63 1.3.83.4.16 1 .35 2.1.4 1.2.06 1.6.07 4.7.07s3.5 0 4.7-.07c1.1-.05 1.7-.24 2.1-.4.5-.2.9-.44 1.3-.83.4-.4.63-.78.83-1.3.16-.4.35-1 .4-2.1.06-1.2.07-1.6.07-3.3s0-2.1-.07-3.3c-.05-1.1-.24-1.7-.4-2.1-.2-.5-.44-.9-.83-1.3-.4-.4-.78-.63-1.3-.83-.4-.16-1-.35-2.1-.4C15.5 4 15.1 4 12 4Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm6.3-8.3a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z"/></svg>`;
const GLOBE_ICON = `<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3Z"/></svg>`;

const footer = () => `
<footer class="foot">
  <div class="foot-card">
    <div class="foot-top">

      <div class="foot-brand">
        <img class="foot-logo" src="img/logo-dark.webp" alt="24/7 Car Rental" width="560" height="289" loading="lazy">
        <p class="foot-mission">Car rental in Tirana, open at every hour. Two offices, ${fleet.length} cars.</p>
        <div class="foot-social">
          ${site.instagram.map(i => `<a href="https://instagram.com/${i}" rel="noopener" target="_blank" aria-label="Instagram, ${i}" title="@${i}">${IG_ICON}</a>`).join('')}
          <a href="https://24-7rentalcar.com/" rel="noopener" target="_blank" aria-label="24-7rentalcar.com" title="24-7rentalcar.com">${GLOBE_ICON}</a>
        </div>
      </div>

      <nav class="foot-col" aria-label="Pages">
        <h2>Pages</h2>
        <ul>
          <li><a href="fleet.html">Fleet</a></li>
          <li><a href="roads.html">Roads</a></li>
          <li><a href="how.html">How it works</a></li>
          <li><a href="faq.html">FAQ</a></li>
          <li><a href="company.html">About us</a></li>
        </ul>
      </nav>

      <nav class="foot-col" aria-label="Where to find us">
        <h2>Where to find us</h2>
        <ul>
          <li><span class="foot-place"><span class="openlight">Open now</span>Tirana International Airport<em>N&euml;n&euml; Tereza, arrivals hall</em></span></li>
          <li><span class="foot-place"><span class="openlight">Open now</span>Rruga Njazi Meka, Tiran&euml;<em>City office</em></span></li>
        </ul>
      </nav>

      <div class="foot-col foot-contact">
        <h2>Talk to a person</h2>
        <a class="foot-call" href="tel:${TEL}">${site.phone}</a>
        <a class="foot-mail" href="mailto:${site.email}">${site.email}</a>
        ${waLink(WA_GENERIC, 'btn-wa foot-wa', 'Ask on WhatsApp')}
      </div>

    </div>

    <div class="foot-legal">
      <p>&copy; 2026 24/7 Car Rental, Tiran&euml;, Albania.</p>
      <p><a href="faq.html">Good to know</a> <a href="book.html">Book a car</a></p>
    </div>
  </div>
</footer>
<script src="js/fleet-data.js" defer></script>
<script src="js/app.js?v=${V_JS}" defer></script>
</body></html>`;

const gantryChip = t => `<span class="gchip">${t}</span>`;
const WA_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04 0 1.2.87 2.36.99 2.53.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>`;
const waLink = (msg, cls = 'btn-wa', label = 'WhatsApp') =>
  `<a class="${cls}" href="https://wa.me/${WA}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${WA_ICON}<span>${label}</span></a>`;
const WA_GENERIC = 'Hello 24/7 Car Rental, I would like to ask about renting a car in Tirana.';
const TIMES = [];
for (let h = 0; h < 24; h++) for (const m of ['00', '30']) TIMES.push(`${String(h).padStart(2, '0')}:${m}`);

// ---------- index ----------
// Structure follows the reference Michael supplied. Every figure in it comes from data/.
const G_GEAR = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M6 5v14M12 5v14M18 5v9"/><path d="M6 5h12"/><circle cx="6" cy="19.5" r="1.6" fill="currentColor" stroke="none"/></svg>`;
const G_SEAT = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M7 4h3.2a2 2 0 0 1 2 1.7l1 7.3H8.5A2.5 2.5 0 0 1 6 10.4V5a1 1 0 0 1 1-1Z"/><path d="M13.2 13h3.3a2.5 2.5 0 0 1 2.5 2.5V20H10"/></svg>`;
const G_DOOR = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"><path d="M4 19V8.6a2 2 0 0 1 .9-1.7l6.4-4.2A2 2 0 0 1 14.4 4v15Z"/><path d="M14.4 19H20"/><path d="M8 12.5h2.2"/></svg>`;

// One car from every corner of the fleet: both city cars, both ends of the price range,
// each class represented once. Not "top picks" — they publish no booking figures.
const PICKS = ['golf-5', 'hyundai-accent', 'audi-a3-2015', 'volkswagen-passat',
               'volkswagen-golf-7', 'hyundai-tucson', 'hyundai-santa-fe-2016', 'jaguar-xf'];

const carCard = c => `<a class="pcard" href="car-${c.slug}.html">
  <span class="pcard-bed">
    <span class="pcard-tag">${c.clsLabel}</span>
    <img src="img/cars/${c.slug}-s.webp" alt="${c.name}" loading="lazy" width="640" height="337">
  </span>
  <span class="pcard-nm">${c.name}</span>
  <span class="pcard-gear">${G_GEAR}${c.gear === 'automatic' ? 'Automatic' : 'Manual'}</span>
  <span class="pcard-specs">
    <span>${G_SEAT}${c.seats}</span>
    <span>${G_DOOR}${c.doors}</span>
    <span class="pcard-yr">${c.year}</span>
  </span>
  <span class="pcard-price"><strong>${eur(c.price)}</strong><em>/ day</em></span>
</a>`;

const deck = () => `${head('24/7 Car Rental Tirana. Open at every hour, including yours', 'Car rental in Tirana, open 24 hours at the airport and in the city. ' + fleet.length + ' cars from ' + eur(CHEAP.price) + ' a day, ' + fleet.filter(c => c.gear === 'automatic').length + ' of them automatic.', '')}
${nav()}
<main class="home">

<section class="hz-top" aria-label="Car rental in Tirana">
  <div class="hz-hero">
    <img class="hz-hero-img" src="img/road-riviera.webp" alt="The coast road over the Llogara pass, Albanian Riviera" width="2400" height="1051" fetchpriority="high">
    <div class="hz-hero-copy">
      <h1>A car at the hour you land</h1>
    </div>
  </div>

  <form class="hz-bar" action="book.html" method="get">
    <div class="hz-bar-fields">
      <label class="hz-f hz-sel">
        <span class="hz-f-k">Collect at</span>
        <select name="loc">${site.locations.map(l => `<option value="${l.id}">${l.label}</option>`).join('')}</select>
      </label>
      <label class="hz-f hz-sel">
        <span class="hz-f-k">Return to</span>
        <select name="ret">${site.locations.map((l, i) => `<option value="${l.id}"${i === 0 ? ' selected' : ''}>${l.label}</option>`).join('')}</select>
      </label>
      <label class="hz-f">
        <span class="hz-f-k">Pick-up</span>
        <span class="hz-f-in"><input type="date" name="from" aria-label="Pick-up date"><select name="tfrom" aria-label="Pick-up time">${TIMES.map(t => `<option${t === '10:00' ? ' selected' : ''}>${t}</option>`).join('')}</select></span>
      </label>
      <label class="hz-f">
        <span class="hz-f-k">Return</span>
        <span class="hz-f-in"><input type="date" name="to" aria-label="Return date"><select name="tto" aria-label="Return time">${TIMES.map(t => `<option${t === '10:00' ? ' selected' : ''}>${t}</option>`).join('')}</select></span>
      </label>
    </div>
    <div class="hz-bar-foot">
      <span class="hz-open"><span class="openlight">Open now</span> Both desks, every hour of every day</span>
      <span class="hz-chips">
        <span class="hz-chips-k">Gearbox</span>
        <label class="hz-chip"><input type="radio" name="gear" value="any" checked><span>Any</span></label>
        <label class="hz-chip"><input type="radio" name="gear" value="automatic"><span>Automatic (${fleet.filter(c => c.gear === 'automatic').length})</span></label>
        <label class="hz-chip"><input type="radio" name="gear" value="manual"><span>Manual (${fleet.filter(c => c.gear === 'manual').length})</span></label>
      </span>
      <span class="hz-bar-go">
        ${waLink(WA_GENERIC, 'btn-wa hz-bar-wa', 'WhatsApp')}
        <button class="hz-search" type="submit">See cars <span class="x-arrow" aria-hidden="true">&rarr;</span></button>
      </span>
    </div>
  </form>
</section>

<section class="hz-picks" aria-label="Cars">
  <div class="hz-head">
    <h2>A car from every corner of the fleet</h2>
    <a class="hz-pill" href="fleet.html">All ${fleet.length} cars <span class="x-arrow" aria-hidden="true">&rarr;</span></a>
  </div>
  <div class="pgrid">
    ${PICKS.map(s => carCard(fleet.find(c => c.slug === s))).join('\n    ')}
  </div>
</section>

<section class="hz-tags" aria-label="Where to drive">
  <div class="hz-head">
    <h2>Where people drive to</h2>
    <a class="hz-pill" href="roads.html">All routes and places <span class="x-arrow" aria-hidden="true">&rarr;</span></a>
  </div>
  <div class="taglist">
    ${site.roads.map(r => `<a class="tag tag-road" href="roads.html#${r.id}">${r.name}<em>${r.km} km</em></a>`).join('')}
    ${site.destinations.map(d => `<a class="tag" href="roads.html#${d.id}">${d.name}<em>${d.hours}</em></a>`).join('')}
  </div>
</section>

<section class="hz-range" aria-label="What it costs">
  <div class="hz-head">
    <h2>Thirty euro to sixty-five</h2>
    <a class="hz-pill" href="fleet.html">Every car and its price <span class="x-arrow" aria-hidden="true">&rarr;</span></a>
  </div>
  <div class="rangegrid">
    ${[
      { c: CHEAP, k: 'The floor', why: 'The cheapest key on the board, and the only manual left in the fleet.' },
      { c: FLAG, k: 'The ceiling', why: 'The whole fleet fits between these two, and nothing above it costs more.' },
    ].map(x => `<a class="rcard" href="car-${x.c.slug}.html">
      <span class="rcard-body">
        <span class="rcard-k">${x.k}</span>
        <span class="rcard-nm">${x.c.name}</span>
        <strong class="rcard-fig">${eur(x.c.price)}<em>a day</em></strong>
        <span class="rcard-why">${x.why}</span>
        <span class="rcard-when">${x.c.year} &middot; ${x.c.gear} &middot; ${x.c.seats} seats &middot; ${x.c.engine.toFixed(1)} L ${x.c.fuel}</span>
      </span>
      <span class="rcard-bed"><img src="img/cars/${x.c.slug}-s.webp" alt="${x.c.name}" loading="lazy" width="640" height="337"></span>
    </a>`).join('')}
  </div>
</section>

<section class="hz-mosaic" aria-label="How it works">
  <div class="mo-cta">
    <span class="mo-mark" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="8.5" cy="12" r="4.5"/><path d="M13 12h8M18 12v3.5M15.5 12v2.5"/></svg></span>
    <h2>Five steps, then you drive</h2>
    <p>Send the dates and the car. You get the total, the meeting point and the name of the person who will be there, in writing the same day and usually inside the hour.</p>
    <a class="mo-go" href="how.html">How it works <span class="x-arrow" aria-hidden="true">&rarr;</span></a>
  </div>

  <div class="mo-stat">
    <img src="img/road-north.webp" alt="The valley road into Theth, northern Albania" loading="lazy" width="2400" height="1600">
    <span class="mo-stat-body"><strong>Both desks, 24 hours</strong></span>
  </div>

  <div class="mo-tall">
    <img src="img/dest-ksamil.webp" alt="Ksamil, on the far south coast of Albania" loading="lazy" width="1600" height="1000">
    <p>The good parts of Albania are down roads no bus takes.</p>
  </div>
</section>

</main>
${footer()}`;

// ---------- fleet ----------
const fleetPage = () => `${head('The fleet. ' + fleet.length + ' cars from ' + eur(CHEAP.price) + ' a day', 'Every car we own, photographed and priced. ' + fleet.filter(c => c.gear === 'automatic').length + ' of ' + fleet.length + ' are automatic. Book the exact car, not a category.', 'fleet.html')}
${nav('fleet')}
<main class="fleetwrap">
  <section class="list">
    <div class="list-head">
      <div class="list-topline">
        <h1 class="list-title">Every car</h1>
        <div class="list-ask">
          <span>Cannot decide?</span>
          ${waLink('Hello 24/7 Car Rental, I am not sure which car suits my trip. Can you help me choose?', 'btn-wa sm', 'Ask us on WhatsApp')}
        </div>
      </div>
      <div class="chips" id="chips" role="group" aria-label="Filter by class">
        <button class="chip is-on" data-cls="all">All <b>${fleet.length}</b></button>
        ${classes.map(c => `<button class="chip" data-cls="${c}">${fleet.find(x => x.cls === c).clsLabel.split(' ·')[0]} <b>${fleet.filter(x => x.cls === c).length}</b></button>`).join('')}
      </div>
      <div class="list-tools">
        <label class="tog"><input type="checkbox" id="f-auto"><span>Automatic</span></label>
        <label class="tog"><input type="checkbox" id="f-5seats"><span>5 seats or more</span></label>
        <label class="sort">Sort <select id="sort">
          <option value="price-desc">price, high to low</option>
          <option value="price-asc">price, low to high</option>
          <option value="year-desc">newest first</option>
        </select></label>
      </div>
    </div>
    <p class="rows-empty" id="rows-empty" hidden>No car matches those filters. <button type="button" class="rows-clear" id="rows-clear">Clear them</button></p>
    <ol class="rows" id="rows">
      ${fleet.map(c => `<li class="row${c.flagship ? ' is-flag' : ''}" data-slug="${c.slug}" data-cls="${c.cls}" data-price="${c.price}" data-year="${c.year}" data-trans="${c.gear}" data-seats="${c.seats}" data-name="${c.name}" data-meta="${c.year} · ${c.gear} · ${c.engine.toFixed(1)}&nbsp;L ${c.fuel} · ${c.seats}&nbsp;seats">
        <a class="row-link" href="car-${c.slug}.html" aria-label="Open ${c.name}">
          <img src="img/cars/${c.slug}-s.webp" alt="${c.name}" loading="lazy" width="900" height="506">
          <span class="row-tag">${c.clsLabel}</span>
          <span class="row-nm">${c.name}</span>
          <span class="row-spec">
            <b>${c.gear === 'automatic' ? 'Automatic' : 'Manual'}</b>
            <b>${c.seats} seats</b>
            <b>${c.engine.toFixed(1)} L ${c.fuel}</b>
          </span>
          <span class="row-price mono">${eur(c.price)}<em>per day</em></span>
        </a>
      </li>`).join('\n')}
    </ol>
    <p class="list-note" id="list-note">Daily rates as published by 24/7 Car Rental, covering the car, basic insurance and unlimited kilometres inside Albania. Longer rentals cost less per day, so ask for the total. Set dates in <a href="book.html">Book</a> to see the total for your stay.</p>
  </section>
</main>
${footer()}`;

// ---------- car detail ----------
const carPage = c => {
  // class first, then nearest price, and never two of the same model side by side
  const seenModel = new Set([c.name.replace(/\s+\d{4}$/, '')]);
  const uniq = list => list.filter(x => {
    const model = x.name.replace(/\s+\d{4}$/, '');
    if (seenModel.has(model)) return false;
    seenModel.add(model); return true;
  });
  const sameCls = uniq(fleet.filter(x => x.cls === c.cls && x.slug !== c.slug)
    .sort((a, z) => Math.abs(a.price - c.price) - Math.abs(z.price - c.price)));
  const byPrice = uniq(fleet.filter(x => x.slug !== c.slug && x.cls !== c.cls)
    .sort((a, z) => Math.abs(a.price - c.price) - Math.abs(z.price - c.price)));
  const similar = [...sameCls, ...byPrice].slice(0, 3);
  return `${head(`${c.name}, ${eur(c.price)} a day in Tirana`, `${c.note} ${c.year}, ${c.engine.toFixed(1)} L ${c.fuel}, ${c.gear}, ${c.seats} seats. Collect at Tirana airport or the city office, any hour.`, `car-${c.slug}.html`, `img/cars/${c.slug}.webp`)}
${nav('fleet')}
<main>
<section class="hero-car">
  <h1 class="hero-nm">${c.name}</h1>
  <img class="hero-img" src="img/cars/${c.slug}.webp" alt="${c.name}" width="1600" height="800" fetchpriority="high">
  <p class="hero-tag">${c.note}</p>
</section>

<section class="specsheet" aria-label="Specification">
  <table class="spec-t mono">
    <tr><td>Year</td><td>${c.year}</td><td>Fuel</td><td>${c.fuel}</td></tr>
    <tr><td>Engine</td><td>${c.engine.toFixed(1)} L ${c.fuel}</td><td>Gearbox</td><td>${c.gear}</td></tr>
    <tr><td>Seats</td><td>${c.seats}</td><td>Class</td><td>${c.clsLabel}</td></tr>
    <tr><td>Rate</td><td>${eur(c.price)} per day</td><td>Seats</td><td>${c.seats}</td></tr>
  </table>
</section>

<div class="incwrap"><section class="gantry included" aria-label="Included">
  <p class="gantry-top">${gantryChip('24/7')}<span class="sign">Every rental includes</span></p>
  <ul class="inc-list">
    <li>This car, photographed above, not a category with 'or similar' beside it</li>
    <li>Basic insurance and unlimited kilometres inside Albania</li>
    <li>Collection at Tirana airport or the city office, at any hour</li>
    <li>Delivery inside Tirana on request, cost confirmed before you book</li>
    <li>${c.gear === 'automatic' ? 'Automatic gearbox, which the mountain roads reward' : 'Manual gearbox, the only one in the fleet'}</li>
  </ul>
</section></div>

${similar.length ? `<section class="similar"><h2 class="sec-h">Nearby in the fleet</h2><div class="sim-rail">${similar.map(s => `<a class="sim-card" href="car-${s.slug}.html"><img src="img/cars/${s.slug}-s.webp" alt="" loading="lazy"><strong>${s.name}</strong><span class="mono">${eur(s.price)}/day</span></a>`).join('')}</div></section>` : ''}
</main>

<div class="reservebar" data-slug="${c.slug}" data-price="${c.price}" data-prestige="0">
  <span class="rb-cluster"><span class="rb-price"><strong class="mono">${eur(c.price)}</strong>/day</span><span class="rb-total mono" id="rb-total"></span></span>
  ${waLink(`Hello 24/7 Car Rental, is the ${c.name} available? ${c.year}, ${c.gear}, ${eur(c.price)} per day. ${site.base}/car-${c.slug}.html`, 'btn-wa rb-wa', 'WhatsApp')}
  <a class="btn-paper rb-call" href="tel:${TEL}" aria-label="Call ${site.phone}">Call</a>
  <a class="btn-verde" href="book.html?car=${c.slug}">Book this car <span aria-hidden="true">→</span></a>
</div>
${footer()}`;
};

// ---------- booking ----------
const bookPage = () => `${head('Book a car. Four questions, then a human', 'Pick up at Tirana airport or the city office, choose your car and dates, and send it. You get a written confirmation the same day, usually within the hour.', 'book.html')}
${nav()}
<main class="bookwrap">
  <ol class="chiprail" id="chiprail" aria-label="Progress">
    ${['Where and when', 'Car', 'You', 'Send'].map((s, i) => `<li class="pchip${i === 0 ? ' is-now' : ''}" data-step="${i}"><span class="gchip">${i + 1}</span>${s}</li>`).join('')}
  </ol>
  <div class="bookgrid">
    <section class="step is-now" data-step="0" aria-label="Where">
      <h1 class="step-h">Where and when?</h1>
      <p class="step-hint" id="loc-hint">Pick one to continue.</p>
      <div class="locgrid" id="locgrid">
        ${site.locations.map((l, i) => `<button class="loc" data-loc="${l.id}" aria-pressed="false"><span class="loc-tick" aria-hidden="true"></span><strong>${l.label}</strong><span class="sign">${l.sub}</span><span class="openlight">Open now</span></button>`).join('')}
      </div>
      <label class="dfield flight" id="flight-wrap" hidden><span class="sign">Flight number, so the car waits if you land late</span><input type="text" id="flight" placeholder="W6 3021" autocomplete="off"></label>
      <label class="tog oneway"><input type="checkbox" id="oneway"> Return to the other location <em id="oneway-note" hidden>no extra charge, they are ten minutes apart</em></label>
      <div class="locgrid" id="locgrid2" hidden></div>

      <h2 class="step-sub">When?</h2>
      <div class="dategrid">
        <label class="dfield"><span class="sign">Pickup</span><input type="date" id="d-from"><select id="t-from">${TIMES.map(t => `<option${t === '10:00' ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <span class="garrow big" aria-hidden="true">→</span>
        <label class="dfield"><span class="sign">Return</span><input type="date" id="d-to"><select id="t-to">${TIMES.map(t => `<option${t === '10:00' ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      </div>
      <p class="daysline"><span class="mono" id="days-chip">–</span><span id="season-note"></span></p>
    </section>

    <section class="step" data-step="1" aria-label="Car" hidden>
      <h1 class="step-h">Which car exactly?</h1>
      <div class="pickrail" id="pickrail">
        ${fleet.map(c => `<button class="pick" data-slug="${c.slug}" data-price="${c.price}" data-cls="${c.cls}" data-name="${c.name}">
          <img src="img/cars/${c.slug}-s.webp" alt="" loading="lazy"><strong>${c.name}</strong>
          <span class="pick-spec">${c.gear === 'automatic' ? 'Automatic' : 'Manual'} · ${c.seats} seats · ${c.clsLabel}</span>
          <span class="mono pick-total" data-base="${c.price}">${eur(c.price)}/day</span></button>`).join('')}
      </div>
    </section>

    <section class="step" data-step="2" aria-label="You" hidden>
      <h1 class="step-h">Who is driving?</h1>
      <div class="drv">
        <label class="dfield full"><span class="sign">Name</span><input type="text" id="drv-name" autocomplete="name" placeholder="As printed on the licence"></label>
        <label class="dfield"><span class="sign">Email</span><input type="email" id="drv-mail" autocomplete="email" placeholder="you@somewhere.com"></label>
        <label class="dfield"><span class="sign">Phone or WhatsApp</span><input type="tel" id="drv-tel" autocomplete="tel" placeholder="+44"></label>
        <label class="dfield full"><span class="sign">Anything we should know</span><input type="text" id="drv-note" placeholder="Child seat, second driver, crossing a border"></label>
        <p class="drv-note">No card, no deposit taken online. This sends your request to the office and a person confirms it, in writing, the same day.</p>
      </div>
    </section>

    <section class="step" data-step="3" aria-label="Send" hidden>
      <div class="gantry doneboard" id="doneboard">
        <p class="gantry-top">${gantryChip('24/7')}<span class="openlight">Request ready</span></p>
        <p class="done-ref mono" id="done-ref"></p>
        <table class="done-t mono" id="done-t"></table>
        <div class="done-send">
          <a class="gantry-go" id="send-wa" href="#" target="_blank" rel="noopener">Send on WhatsApp <span aria-hidden="true">→</span></a>
          <a class="btn-paper" id="send-call" href="tel:${TEL}">Or call now</a>
        </div>
        
      </div>
    </section>

    <aside class="gantry sumboard" aria-label="Your reservation so far">
      <p class="gantry-top">${gantryChip('Σ')}<span class="sign">Your request</span></p>
      <table class="sum-t mono" id="sum-t">
        <tr data-k="loc"><td>Route</td><td>choose</td></tr>
        <tr data-k="dates"><td>Dates</td><td>not set</td></tr>
        <tr data-k="car"><td>Car</td><td>not set</td></tr>
        <tr data-k="days"><td>Days</td><td>not set</td></tr>
        <tr data-k="total" class="sum-total"><td>Estimate</td><td>after dates and car</td></tr>
      </table>
    </aside>
  </div>
  <div class="stepnav">
    <button class="btn-paper" id="back" hidden>← Back</button>
    <button class="btn-verde" id="next" disabled>Continue <span aria-hidden="true">→</span></button>
  </div>
</main>
${footer()}`;

// ---------- roads ----------
const roadsPage = () => {
  const carOf = id => fleet.find(c => c.slug === id);
  // one component, eleven times. Routes and places differ in their facts, not their shape.
  const place = (x, i, img, facts, cta) => `
  <article class="rd" id="${x.id}">
    <div class="rd-body">
      <h2 class="rd-h">${x.name}</h2>
      <p class="rd-story">${x.story || x.note}</p>
      <dl class="rd-facts">${facts.map(f => `<dt>${f[0]}</dt><dd>${f[1]}</dd>`).join('')}</dl>
      <a class="roadcar" href="car-${x.car}.html"><img src="img/cars/${x.car}-s.webp" alt=""><span><strong>${carOf(x.car).name}</strong><em>${x.carWhy}</em></span><span class="mono">${eur(carOf(x.car).price)}/day</span></a>
      <div class="road-cta">${waLink(cta, 'btn-wa sm', 'Ask about this')}</div>
    </div>
    <img class="rd-img" src="img/${img}.webp" alt="${x.name}, Albania"${i < 2 ? '' : ' loading="lazy"'} width="1600" height="1000">
  </article>`;

  return `${head('Where to drive in Albania', 'Three routes worth the rental and eight places people go, each with the road time from Tirana and a car that can do it.', 'roads.html')}
${nav('roads')}
<main class="roadswrap">
<section class="roads-head">
  <h1>Where to drive</h1>
  <p>Three routes worth the rental, then eight places people go. Road times are from Tirana one way unless the card says otherwise.</p>
</section>

<section class="rd-list" aria-label="Routes and places">
  ${site.roads.map((r, i) => place(r, i, 'road-' + r.id,
      [['Route', r.route], ['Length', r.km + ' km'], ['Time', r.hours], ['Best', r.best]],
      `Hello, I want to drive ${r.name} (${r.route}). Which car do you recommend and is it free?`)).join('')}
  ${site.destinations.map((d, i) => place(d, i + 3, d.img,
      [['Where', d.region], ['Distance', d.km + ' km'], ['Road time', d.hours]],
      `Hello, I want to visit ${d.name} in Albania. Which car do you recommend and is it free?`)).join('')}
</section>
</main>
${footer()}`;
};

// ---------- company ----------
const companyPage = () => `${head('About us. 24/7 Car Rental, Tirana', 'Welcome to 24/7 Car Rental, your premier choice for convenient and reliable car rental services in Tirana, Albania.', 'company.html')}
${nav('company')}
<main class="companywrap">

<section class="manifesto">
  <h1 class="man-h">We make finding the right car simple</h1>
  <div class="man-body">
    <p>Welcome to 24/7 Car Rental, your premier choice for convenient and reliable car rental services in Tirana, Albania. Whether you are exploring the vibrant streets of Tirana city or embarking on an Albanian adventure, we are here to ensure you have the perfect vehicle for your journey.</p>
  </div>
</section>

<figure class="about-shot">
  <img src="img/road-riviera.webp" alt="The coast road over the Llogara pass, Albania" width="2400" height="1051" loading="lazy">
</figure>

<section class="abouttext">
  <!-- slop-lint-ignore their own About Us paragraphs, verbatim on request --><article class="about-b">
    <h2>Our mission</h2>
    <p>At 24/7 Car Rental, our mission is simple: to provide our customers with top-notch service, quality vehicles, and unbeatable convenience. We understand that your travel needs are unique, which is why we offer a diverse fleet of well-maintained cars to suit every occasion and budget.</p>
  </article>
  <article class="about-b">
    <h2>Explore Albania with ease</h2>
    <p>Albania is a country of rich history, stunning landscapes, and warm hospitality. With your rental car from 24/7 Car Rental, you have the freedom to explore its hidden gems at your own pace. From the bustling city life of Tirana to the breathtaking beaches of the Albanian Riviera, the possibilities are endless.</p>
  </article>
  <article class="about-b">
    <h2>Contact us</h2>
    <p>Ready to start your Albanian adventure? Get in touch with us today to book your rental car or to learn more about our services. Whether you are a visitor or a local in need of temporary wheels, 24/7 Car Rental is here to make your journey unforgettable.</p>
    <p class="about-thanks">Thank you for choosing 24/7 Car Rental for your car rental needs in Tirana, Albania.</p>
  </article>
</section>

<section class="promises" aria-label="Why choose us">
  <h2 class="sec-h">Why choose us?</h2>
  <ol class="prom-list">
    <!-- slop-lint-ignore 24/7 Car Rental's own About Us wording, verbatim on request -->${[
      { t: 'Convenience', d: 'With two convenient locations, including Tirana city and Tirana International Airport (Rinas), picking up and dropping off your rental car has never been easier.' },
      { t: 'Variety', d: 'Whether you need a compact car for zipping around the city, a spacious SUV for family vacations, or a luxurious sedan for business trips, we have the perfect vehicle for you.' },
      { t: 'Quality', d: 'Your safety and comfort are our top priorities. Our fleet consists of modern, well-maintained cars from trusted brands, ensuring a smooth and reliable ride every time.' },
      { t: 'Exceptional service', d: 'Our friendly and knowledgeable staff are dedicated to providing you with a seamless rental experience. From reservation to return, we are here to assist you every step of the way.' },
    ].map((p, i) => `<li class="prom"><div><strong>${p.t}</strong><p>${p.d}</p></div></li>`).join('')}
  </ol>
</section>

<section class="aboutcta">
  <div class="aboutcta-card">
    <h2>Contact us today to book your rental car</h2>
    <p>Get in touch now and let us get you on the road with 24/7 Car Rental. Your next adventure awaits.</p>
    <div class="aboutcta-btns">
      ${waLink('Hello 24/7 Car Rental, I would like to ask about renting a car in Tirana.', 'btn-wa', 'Message us on WhatsApp')}
      <a class="foot-call" href="tel:${TEL}">${site.phone}</a>
    </div>
    <a class="aboutcta-mail" href="mailto:${site.email}">${site.email}</a>
  </div>
  <div class="aboutcta-desks">
    ${site.locations.map(l => `<div class="foot-desk"><span class="openlight">Open now</span><strong>${l.label}</strong><em>${l.sub}</em></div>`).join('')}
  </div>
</section>

</main>
${footer()}`;

// ---------- FAQ ----------
const faqSchema = () => JSON.stringify({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: site.faq.map(f => ({
    '@type': 'Question', name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

const faqPage = () => `${head('Questions about renting a car in Tirana', 'Licences, borders, deposits, night pickups, mountain roads and what the daily price covers. ' + site.faq.length + ' straight answers from a rental company in Tirana that is open at every hour.', 'faq.html', 'img/cars/jaguar-xf.webp', faqSchema())}
${nav('faq')}
<main class="faqwrap">
  <section class="faq-hero">
    <h1 class="faq-h1">Questions,<br>answered straight</h1>
    

  </section>

  ${site.faqGroups.map((g, gi) => `
  <section class="faq-group" id="${g.id}">
    <h2 class="faq-gh">${g.g}</h2>
    <div class="faq-cols">
      ${[0, 1].map(col => `<div class="faq-list">
        ${g.q.map((f, i) => ({ f, i })).filter(({ i }) => (i < Math.ceil(g.q.length / 2)) === (col === 0)).map(({ f, i }) => `<details class="qa-item" id="${g.id}-${i + 1}"${gi === 0 && i === 0 ? ' open' : ''}>
          <summary><span class="qa-q">${f.q}</span><span class="qa-mark" aria-hidden="true"></span></summary>
          <div class="qa-a"><p>${f.a}</p></div>
        </details>`).join('')}
      </div>`).join('')}
    </div>
  </section>`).join('')}

  <section class="faq-ask">
    <div class="gantry">
      
      <div>
        <p class="faq-ask-h">Not answered here?</p>
        <p class="faq-ask-p">Ask it directly. Both offices are staffed around the clock, and questions about dates, borders or which car suits a route get answered the same day.</p>
      </div>
      <div class="faq-ask-btns">
        ${waLink('Hello 24/7 Car Rental, I have a question about renting a car in Albania:', 'gantry-wa', 'Ask on WhatsApp')}
        <a class="gantry-call" href="tel:${TEL}">Call ${site.phone}</a>
      </div>
    </div>
  </section>
</main>
${footer()}`;

// ---------- how it works ----------
const howPage = () => `${head('How renting from us works', 'No online checkout. Send the dates and the car by WhatsApp or phone, get the total in writing the same day, collect at Tirana airport or the city office at any hour.', 'how.html')}
${nav('how')}
<main class="howwrap">
  <section class="how-hero">
    <h1 class="how-h1">Book it in two lines on WhatsApp</h1>
    <p class="how-lede">You send two lines, the office answers with the real total, and the car is waiting when you land.</p>
    <div class="how-cta">
      ${waLink(WA_GENERIC, 'btn-wa', 'Start on WhatsApp')}
      <a class="btn-paper" href="tel:${TEL}">Call ${site.phone}</a>
    </div>
  </section>

  <ol class="steps">
    ${site.steps.map(s => `<li class="step-row">
      <span class="step-n mono">${s.n}</span>
      <div class="step-body">
        <h2>${s.t}</h2>
        <p>${s.d}</p>
      </div>
      <span class="step-aside mono">${s.aside}</span>
    </li>`).join('')}
  </ol>

  <section class="bring">
    <h2 class="sec-h">What to bring</h2>
    <div class="bring-grid">
      ${site.bring.map(x => `<article class="bring-card">
        <h3>${x.t}</h3>
        <p>${x.d}</p>
      </article>`).join('')}
    </div>
  </section>

  <section class="how-ask">
    <div class="gantry">
      
      <div>
        <p class="faq-ask-h">Ready when you are</p>
        <p class="faq-ask-p">Send the dates and the car and you will have the total back today. If you would rather ask a question first, that is what the number is for.</p>
      </div>
      <div class="faq-ask-btns">
        ${waLink('Hello 24/7 Car Rental, I would like to book a car. My dates are:', 'gantry-wa', 'Send my dates')}
        <a class="gantry-call" href="tel:${TEL}">Call ${site.phone}</a>
      </div>
    </div>
  </section>
</main>
${footer()}`;

// ---------- 404 ----------
const notFound = () => `${head('Wrong turn', 'This page is not here. The desk is still open though.', '404.html')}
${nav()}
<main class="wrap404">
  <div class="gantry g404">
    <p class="gantry-top">${gantryChip('404')}<span class="openlight">Still open</span></p>
    <p class="e404">Wrong turn</p>
    <a class="gantry-go" href="index.html">Back to the cars <span aria-hidden="true">→</span></a>
  </div>
</main>
${footer()}`;

// ---------- emit ----------
const pages = {
  'index.html': deck(),
  'fleet.html': fleetPage(),
  'book.html': bookPage(),
  'roads.html': roadsPage(),
  'company.html': companyPage(),
  'faq.html': faqPage(),
  'how.html': howPage(),
  '404.html': notFound(),
};
for (const c of fleet) pages[`car-${c.slug}.html`] = carPage(c);
for (const [name, html] of Object.entries(pages)) writeFileSync(join(D, name), html);
writeFileSync(join(D, 'js/fleet-data.js'), 'window.FLEET=' + JSON.stringify(fleet.map(({ slug, name, price, cls }) => ({ slug, name, price, cls }))) + ';window.SITE=' + JSON.stringify({ locations: site.locations, wa: site.wa, tel: site.tel, phone: site.phone }) + ';');
console.log(`built ${Object.keys(pages).length} pages`);
