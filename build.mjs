#!/usr/bin/env node
// AUTOSOLE static build. Zero dependencies. JSON in, HTML out, docs/ is the site.
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const fleet = JSON.parse(readFileSync(join(ROOT, 'data/fleet.json'), 'utf8'));
const site  = JSON.parse(readFileSync(join(ROOT, 'data/site.json'), 'utf8'));
const D = join(ROOT, 'docs');
mkdirSync(join(D, 'fonts'), { recursive: true });
cpSync(join(ROOT, 'assets/fonts/archivo-var.woff2'), join(D, 'fonts/archivo-var.woff2'));
cpSync(join(ROOT, 'assets/fonts/martian-var.woff2'), join(D, 'fonts/martian-var.woff2'));

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
<link rel="preload" href="fonts/archivo-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/martian-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="css/app.css">
${schema ? `<script type="application/ld+json">${schema}</script>` : ''}
</head>
<body data-page="${path.replace('.html','') || 'index'}">`;

const nav = (active = '') => `
<div class="navsentinel" aria-hidden="true"></div>
<nav class="pillnav" id="pillnav" aria-label="Main">
  <a class="brand" href="index.html" aria-label="24/7 Car Rental, home">
    <img class="brand-logo" src="img/logo-s.webp" alt="" width="280" height="145" fetchpriority="high">
  </a>
  <div class="pillnav-links">
    <a href="how.html"${active === 'how' ? ' aria-current="page"' : ''}>How it works</a>
    <a href="fleet.html"${active === 'fleet' ? ' aria-current="page"' : ''}>Fleet</a>
    <a href="roads.html"${active === 'roads' ? ' aria-current="page"' : ''}>Roads</a>
    <a href="faq.html"${active === 'faq' ? ' aria-current="page"' : ''}>FAQ</a>
    <a href="company.html"${active === 'company' ? ' aria-current="page"' : ''}>About</a>
  </div>
  <div class="pillnav-tools">
    <a class="nav-call" href="tel:${TEL}" aria-label="Call ${site.phone}" title="${site.phone}">
      <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .8-.2 1l-2.3 2.2Z"/></svg>
    </a>
    ${waLink(WA_GENERIC, 'nav-wa', 'WhatsApp')}
    <a class="reserve-cta" href="book.html">Book</a>
    <button class="burger" id="burger" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
  </div>
</nav>
<div class="sheet" id="sheet" hidden>
  <a href="how.html">How it works</a><a href="fleet.html">Fleet</a><a href="roads.html">Roads</a><a href="faq.html">FAQ</a><a href="company.html">About</a>
  <a href="book.html" class="sheet-go">Book a car →</a>
  ${waLink(WA_GENERIC, 'sheet-wa', 'Ask on WhatsApp')}
</div>`;

// departure-board footer. every status is a real fact.
const footer = () => `
<footer class="foot">
  <div class="foot-top">
    <div class="foot-act">
      <p class="foot-h">Talk to a person, any hour</p>
      <p class="foot-sub">Two offices in Tirana, both staffed around the clock. Send the dates and the car, get a written answer the same day.</p>
      <div class="foot-btns">
        ${waLink(WA_GENERIC, 'btn-wa', 'WhatsApp us')}
        <a class="foot-call" href="tel:${TEL}">${site.phone}</a>
      </div>
      <a class="foot-mail" href="mailto:${site.email}">${site.email}</a>
    </div>

    <div class="foot-desks">
      ${site.locations.map(l => `<div class="foot-desk">
        <span class="openlight">Open now</span>
        <strong>${l.label}</strong>
        <em>${l.sub}</em>
        <span class="mono">${site.hours}</span>
      </div>`).join('')}
    </div>
  </div>

  <div class="foot-cols">
    <nav class="foot-col" aria-label="Cars by price">
      <h2>Cars by price</h2>
      <ul>
        ${[...fleet].sort((a, z) => a.price - z.price).slice(0, 6).map(c => `<li><a href="car-${c.slug}.html">${c.name}<span class="mono">${eur(c.price)}</span></a></li>`).join('')}
        <li><a href="fleet.html" class="foot-more">All ${fleet.length} cars <span aria-hidden="true">→</span></a></li>
      </ul>
    </nav>

    <nav class="foot-col" aria-label="Where to go">
      <h2>Where to go</h2>
      <ul>
        ${site.destinations.slice(0, 6).map(d => `<li><a href="roads.html#${d.id}">${d.name}<span class="mono">${d.km} km</span></a></li>`).join('')}
        <li><a href="roads.html" class="foot-more">All routes and places <span aria-hidden="true">→</span></a></li>
      </ul>
    </nav>

    <nav class="foot-col" aria-label="Good to know">
      <h2>Good to know</h2>
      <ul>
        ${site.faq.slice(0, 5).map(f => `<li><a href="faq.html">${f.q}</a></li>`).join('')}
        <li><a href="faq.html" class="foot-more">All ${site.faq.length} answers <span aria-hidden="true">→</span></a></li>
      </ul>
    </nav>

    <nav class="foot-col" aria-label="Before you book">
      <h2>Before you book</h2>
      <p class="foot-claim">No online payment. No card charged in advance. You pay at pickup.</p>
      <ul>
        <li><a href="how.html">How renting works, step by step</a></li>
        <li><a href="faq.html#booking-3">What the daily price includes</a></li>
        <li><a href="faq.html#driving-1">Licence and driver rules</a></li>
        <li><a href="faq.html#driving-3">Taking the car across a border</a></li>
        <li><a href="faq.html#pickup-5">How fuel works</a></li>
        <li><a href="faq.html#pickup-4">Delivery to your hotel</a></li>
      </ul>
    </nav>

    <div class="foot-col">
      <h2>Follow</h2>
      <ul>
        ${site.instagram.map(i => `<li><a href="https://instagram.com/${i}" rel="noopener" target="_blank">Instagram @${i}</a></li>`).join('')}
        <li><a href="https://24-7rentalcar.com/" rel="noopener" target="_blank">24-7rentalcar.com</a></li>
      </ul>
      <img class="foot-logo" src="img/logo.webp" alt="24/7 Car Rental" width="560" height="289" loading="lazy">
    </div>
  </div>

  <div class="foot-legal">
    <p>24/7 Car Rental, Rruga Njazi Meka, Tiranë and Tirana International Airport. Rates in euro, per day, as published.</p>
    <p><a href="company.html#colophon">Redesign proposal by Off-Plate</a>. Cars, prices and contact details are the real ones from 24-7rentalcar.com.</p>
  </div>
</footer>
<script src="js/fleet-data.js" defer></script>
<script src="js/app.js" defer></script>
</body></html>`;

const gantryChip = t => `<span class="gchip">${t}</span>`;
const WA_ICON = `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.84-.85 2.04 0 1.2.87 2.36.99 2.53.12.16 1.71 2.61 4.14 3.66.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>`;
const waLink = (msg, cls = 'btn-wa', label = 'WhatsApp') =>
  `<a class="${cls}" href="https://wa.me/${WA}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">${WA_ICON}<span>${label}</span></a>`;
const WA_GENERIC = 'Hello 24/7 Car Rental, I would like to ask about renting a car in Tirana.';
const TIMES = [];
for (let h = 6; h < 24; h++) for (const m of ['00', '30']) TIMES.push(`${String(h).padStart(2, '0')}:${m}`);

// ---------- index (Deck) ----------
const deck = () => `${head('24/7 Car Rental Tirana. Open at every hour, including yours', 'Car rental in Tirana, open 24 hours at the airport and in the city. ' + fleet.length + ' cars from ' + eur(CHEAP.price) + ' a day, ' + fleet.filter(c => c.gear === 'automatic').length + ' of them automatic.', '')}
${nav()}
<main>
<section class="deck">
  <h1 class="deck-h1"><span>Albania</span> <span>at any</span> <span>hour</span></h1>
  <div class="deck-car"><img src="img/cars/${FLAG.slug}.webp" alt="${FLAG.name}, the top of the fleet" width="1400" height="700" fetchpriority="high"></div>
  <aside class="gantry deck-book" aria-label="Start a booking">
    <p class="gantry-top">${gantryChip('24/7')}<span class="openlight">Open now</span></p>
    <form action="book.html" method="get" class="gantry-form">
      <label class="gfield"><span class="sign">Where</span>
        <select name="loc" required>${site.locations.map(l => `<option value="${l.id}">${l.label}</option>`).join('')}</select>
      </label>
      <div class="gfield gdates"><span class="sign">When</span>
        <span class="gdates-in"><input type="date" name="from" aria-label="Pickup date"><span class="garrow" aria-hidden="true">→</span><input type="date" name="to" aria-label="Return date"></span>
      </div>
      <button class="gantry-go" type="submit">Show ${fleet.length} cars <span aria-hidden="true">→</span></button>
      <div class="gantry-alt">
        <span>or skip the form</span>
        ${waLink(WA_GENERIC, 'gantry-wa', 'WhatsApp us')}
        <a class="gantry-call" href="tel:${TEL}">Call ${site.phone}</a>
      </div>
    </form>
  </aside>
  <nav class="exitrail" aria-label="Sections">
    <a href="how.html"><em>5 steps</em><strong>How it works</strong><span class="x-arrow" aria-hidden="true">→</span></a>
    <a href="fleet.html"><em>${fleet.length} cars</em><strong>The fleet</strong><span class="x-arrow" aria-hidden="true">→</span></a>
    <a href="roads.html"><em>3 routes</em><strong>Where to drive</strong><span class="x-arrow" aria-hidden="true">→</span></a>
    <a href="faq.html"><em>${site.faq.length} answers</em><strong>Straight answers</strong><span class="x-arrow" aria-hidden="true">→</span></a>
  </nav>
</section>

<section class="flagstrip" aria-label="The flagship">
  <div class="flag-copy">
    <p class="flag-name">The 03:40 arrival</p>
    <p class="flag-note">Most Tirana flights land at hours other desks are shut. That is the whole point of the name: a car, a person, and a key, at any hour on the clock.</p>
    <div class="flag-stats">
      <div><strong>24/7</strong><span class="sign">Both offices</span></div>
      <div><strong>${fleet.filter(c => c.gear === 'automatic').length}/${fleet.length}</strong><span class="sign">Automatic</span></div>
      <div><strong>${eur(CHEAP.price)}</strong><span class="sign">From, per day</span></div>
    </div>
    <a class="flag-cta" href="fleet.html">See all ${fleet.length} cars <span aria-hidden="true">→</span></a>
  </div>
  <img class="flag-img" src="img/cars/mercedes-benz-c220.webp" alt="Mercedes-Benz C220, one of the airport cars" loading="lazy" width="1400" height="700">
</section>

<section class="lanes" aria-label="Fleet by lane">
  <h2 class="sec-h">Every key on the board</h2>
  ${[
    { cls: 'city', label: 'Cheapest keys', cars: ['golf-5', 'hyundai-accent', 'audi-a4'] },
    { cls: 'sedan', label: 'Sedans', cars: ['volkswagen-passat', 'mercedes-benz-c220', 'audi-a6'] },
    { cls: 'suv', label: 'Seven seats and high up', cars: ['hyundai-tucson', 'hyundai-santa-fe', 'hyundai-santa-fe-2016'] },
    { cls: 'coupe', label: 'Coupé and cabrio', cars: ['audi-a5-2014', 'volkswagen-passat-cc', 'volkswagen-passat-cc-2014'] },
    { cls: 'premium', label: 'The good one', cars: ['jaguar-xf'] },
  ].map((lane, i) => {
    const cars = lane.cars.map(s => fleet.find(c => c.slug === s));
    const lo = Math.min(...cars.map(c => c.price));
    return `<a class="lane" href="fleet.html#${lane.cls}" style="--i:${i}">
    <span class="lane-head"><span class="lane-no mono">${String(i + 1).padStart(2, '0')}</span><strong class="lane-label">${lane.label}</strong></span>
    <span class="lane-cars">${cars.map(c => `<img src="img/cars/${c.slug}-s.webp" alt="${c.name}" loading="lazy" width="640" height="${Math.round(640 / 1.9)}">`).join('')}</span>
    <span class="lane-tail"><span class="lane-price mono">from ${eur(lo)}/day</span><span class="x-arrow" aria-hidden="true">→</span></span></a>`;
  }).join('\n')}
</section>

<section class="desks" aria-label="Where to collect">
  ${site.locations.map(l => `<div class="desk"><span class="openlight">Open now</span><strong>${l.label}</strong><em>${l.sub}</em></div>`).join('')}
</section>

<section class="roadstease" aria-label="Roads">
  <img src="img/road-riviera.webp" alt="The Albanian Riviera coast road" loading="lazy">
  <div class="roadstease-copy">
    <h2>Three drives worth the rental</h2>
    <p>The Riviera over Llogara, the mountain road to Theth, and the Ottoman towns in the south. Timed, and matched to a car that can do it.</p>
    <a class="btn-paper" href="roads.html">See the routes <span aria-hidden="true">→</span></a>
  </div>
</section>
</main>
${footer()}`;

// ---------- fleet ----------
const fleetPage = () => `${head('The fleet. ' + fleet.length + ' cars from ' + eur(CHEAP.price) + ' a day', 'Every car we own, photographed and priced. ' + fleet.filter(c => c.gear === 'automatic').length + ' of ' + fleet.length + ' are automatic. Book the exact car, not a category.', 'fleet.html')}
${nav('fleet')}
<main class="split">
  <section class="stage" aria-live="polite">
    <div class="stage-floor"></div>
    <img class="stage-img" id="stage-img" src="img/cars/${FLAG.slug}.webp" alt="${FLAG.name}" width="1600" height="752">
    <div class="stage-info">
      <h1 class="stage-name" id="stage-name">${FLAG.name}</h1>
      <p class="stage-meta" id="stage-meta"><span class="mono">${eur(FLAG.price)}/day</span> · ${FLAG.year} · ${FLAG.gear} · ${FLAG.engine.toFixed(1)}&nbsp;L ${FLAG.fuel} · ${FLAG.seats}&nbsp;seats</p>
      <div class="stage-ctas">
        <a class="btn-verde" id="stage-view" href="car-${FLAG.slug}.html">This car <span aria-hidden="true">→</span></a>
      </div>
    </div>
  </section>
  <section class="list">
    <div class="list-head">
      <h2 class="list-title">Every car</h2>
      <div class="chips" id="chips" role="group" aria-label="Filter by class">
        <button class="chip is-on" data-cls="all">All ${fleet.length}</button>
        ${classes.map(c => `<button class="chip" data-cls="${c}">${fleet.find(x => x.cls === c).clsLabel.split(' ·')[0]}</button>`).join('')}
      </div>
      <div class="list-ask">
        <span>Cannot decide?</span>
        ${waLink('Hello 24/7 Car Rental, I am not sure which car suits my trip. Can you help me choose?', 'btn-wa sm', 'Ask us on WhatsApp')}
      </div>
      <div class="list-tools">
        <label class="sort">Sort <select id="sort">
          <option value="price-asc">price, low to high</option>
          <option value="price-desc">price, high to low</option>
          <option value="year-desc">newest first</option>
        </select></label>
        <label class="tog"><input type="checkbox" id="f-auto"> automatic</label>
        <label class="tog"><input type="checkbox" id="f-5seats"> 5+ seats</label>
      </div>
    </div>
    <ol class="rows" id="rows">
      ${fleet.map(c => `<li class="row${c.flagship ? ' is-flag' : ''}" data-slug="${c.slug}" data-cls="${c.cls}" data-price="${c.price}" data-year="${c.year}" data-trans="${c.gear}" data-seats="${c.seats}" data-name="${c.name}" data-meta="${c.year} · ${c.gear} · ${c.engine.toFixed(1)}&nbsp;L ${c.fuel} · ${c.seats}&nbsp;seats">
        <img src="img/cars/${c.slug}-s.webp" alt="" loading="lazy" width="640" height="337">
        <span class="row-nm">${c.name}<em>${c.year} · ${c.gear} · ${c.engine.toFixed(1)}&nbsp;L ${c.fuel} · ${c.seats}&nbsp;seats</em></span>
        <span class="row-price mono">${eur(c.price)}<em>/day</em></span>
        <a class="row-go" href="car-${c.slug}.html" aria-label="Open ${c.name}"><span class="x-arrow" aria-hidden="true">→</span></a>
      </li>`).join('\n')}
    </ol>
    <p class="list-note" id="list-note">Daily rates as published by 24/7 Car Rental, covering the car, basic insurance and unlimited kilometres inside Albania. Longer rentals cost less per day, so ask for the total. Every car here is a specific car with its own photo, not a category. Set dates in <a href="book.html">Book</a> to see the total for your stay.</p>
  </section>
</main>
${footer()}`;

// ---------- car detail ----------
const carPage = c => {
  const sameCls = fleet.filter(x => x.cls === c.cls && x.slug !== c.slug);
  const byPrice = fleet.filter(x => x.slug !== c.slug && !sameCls.includes(x))
    .sort((a, z) => Math.abs(a.price - c.price) - Math.abs(z.price - c.price));
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
    <tr><td>Class</td><td>${c.clsLabel}</td><td>Year</td><td>${c.year}</td></tr>
    <tr><td>Engine</td><td>${c.engine.toFixed(1)} L ${c.fuel}</td><td>Gearbox</td><td>${c.gear}</td></tr>
    <tr><td>Seats</td><td>${c.seats}</td><td>Doors</td><td>${c.doors}</td></tr>
    <tr><td>Rate</td><td>${eur(c.price)} per day</td><td>Trim</td><td>${c.fullOption ? 'Full option' : 'Standard'}</td></tr>
  </table>
</section>

<div class="incwrap"><section class="gantry included" aria-label="Included">
  <p class="gantry-top">${gantryChip('24/7')}<span class="sign">Every rental includes</span></p>
  <ul class="inc-list">
    <li>This exact car, photographed above, not a category</li>
    <li>Basic insurance and unlimited kilometres inside Albania</li>
    <li>Collection at Tirana airport or the city office, at any hour</li>
    <li>Free delivery anywhere inside Tirana</li>
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
    ${['Where', 'When', 'Car', 'You', 'Send'].map((s, i) => `<li class="pchip${i === 0 ? ' is-now' : ''}" data-step="${i}"><span class="gchip">A${i + 1}</span>${s}</li>`).join('')}
  </ol>
  <div class="bookgrid">
    <section class="step is-now" data-step="0" aria-label="Where">
      <h1 class="step-h">Where do you collect?</h1>
      <div class="locgrid" id="locgrid">
        ${site.locations.map(l => `<button class="loc" data-loc="${l.id}"><strong>${l.label}</strong><span class="sign">${l.sub}</span><span class="openlight">Open now</span></button>`).join('')}
      </div>
      <label class="dfield flight" id="flight-wrap" hidden><span class="sign">Flight number, so the car waits if you land late</span><input type="text" id="flight" placeholder="W6 3021" autocomplete="off"></label>
      <label class="tog oneway"><input type="checkbox" id="oneway"> Return to the other location <em id="oneway-note" hidden>no extra charge, they are ten minutes apart</em></label>
      <div class="locgrid" id="locgrid2" hidden></div>
    </section>

    <section class="step" data-step="1" aria-label="Dates" hidden>
      <h1 class="step-h">Which dates?</h1>
      <div class="dategrid">
        <label class="dfield"><span class="sign">Pickup</span><input type="date" id="d-from"><select id="t-from">${TIMES.map(t => `<option${t === '10:00' ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <span class="garrow big" aria-hidden="true">→</span>
        <label class="dfield"><span class="sign">Return</span><input type="date" id="d-to"><select id="t-to">${TIMES.map(t => `<option${t === '10:00' ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
      </div>
      <p class="daysline"><span class="mono" id="days-chip">–</span><span id="season-note"></span></p>
    </section>

    <section class="step" data-step="2" aria-label="Car" hidden>
      <h1 class="step-h">Which car exactly?</h1>
      <div class="pickrail" id="pickrail">
        ${fleet.map(c => `<button class="pick" data-slug="${c.slug}" data-price="${c.price}" data-cls="${c.cls}" data-name="${c.name}">
          <img src="img/cars/${c.slug}-s.webp" alt="" loading="lazy"><strong>${c.name}</strong>
          <span class="mono pick-total" data-base="${c.price}">${eur(c.price)}/day</span></button>`).join('')}
      </div>
    </section>

    <section class="step" data-step="3" aria-label="You" hidden>
      <h1 class="step-h">Who is driving?</h1>
      <div class="drv">
        <label class="dfield full"><span class="sign">Name</span><input type="text" id="drv-name" autocomplete="name" placeholder="As printed on the licence"></label>
        <label class="dfield"><span class="sign">Email</span><input type="email" id="drv-mail" autocomplete="email" placeholder="you@somewhere.com"></label>
        <label class="dfield"><span class="sign">Phone or WhatsApp</span><input type="tel" id="drv-tel" autocomplete="tel" placeholder="+44"></label>
        <label class="dfield full"><span class="sign">Anything we should know</span><input type="text" id="drv-note" placeholder="Child seat, second driver, crossing a border"></label>
        <p class="drv-note">No card, no deposit taken online. This sends your request to the office and a person confirms it, in writing, the same day.</p>
      </div>
    </section>

    <section class="step" data-step="4" aria-label="Send" hidden>
      <div class="gantry doneboard" id="doneboard">
        <p class="gantry-top">${gantryChip('24/7')}<span class="openlight">Request ready</span></p>
        <p class="done-ref mono" id="done-ref"></p>
        <table class="done-t mono" id="done-t"></table>
        <div class="done-send">
          <a class="gantry-go" id="send-wa" href="#" target="_blank" rel="noopener">Send on WhatsApp <span aria-hidden="true">→</span></a>
          <a class="btn-paper" id="send-call" href="tel:${TEL}">Or call now</a>
        </div>
        <p class="done-note">This demo opens WhatsApp with the details filled in. Nothing is charged and no card is taken. On the live site this would also drop an email into the office inbox.</p>
      </div>
    </section>

    <aside class="gantry sumboard" aria-label="Your reservation so far">
      <p class="gantry-top">${gantryChip('Σ')}<span class="sign">Your request</span></p>
      <table class="sum-t mono" id="sum-t">
        <tr data-k="loc"><td>ROUTE</td><td>choose</td></tr>
        <tr data-k="dates"><td>DATES</td><td>–</td></tr>
        <tr data-k="car"><td>CAR</td><td>–</td></tr>
        <tr data-k="days"><td>DAYS</td><td>not set</td></tr>
        <tr data-k="total" class="sum-total"><td>ESTIMATE</td><td>0 €</td></tr>
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
  const [a1, am, st] = site.roads;
  const carOf = id => fleet.find(c => c.slug === id);
  return `${head('Three drives worth the rental', 'The Albanian Riviera over Llogara, the mountain road north to Theth, and the Ottoman towns of Berat and Gjirokastër. Timed, and matched to a car that can do it.', 'roads.html')}
${nav('roads')}
<main>
<section class="road-a1">
  <img class="ra1-img" src="img/road-${a1.id}.webp" alt="${a1.name}" fetchpriority="high">
  <div class="ra1-panel">
    <h1 class="ra1-h">${a1.name}</h1>
    <p class="road-story">${a1.story}</p>
    <table class="facts mono"><tr><td>${a1.route}</td><td>${a1.km} km</td><td>${a1.hours}</td><td>best ${a1.best}</td></tr></table>
    <a class="roadcar" href="car-${a1.car}.html"><img src="img/cars/${a1.car}-s.webp" alt=""><span><strong>${carOf(a1.car).name}</strong><em>${a1.carWhy}</em></span><span class="mono">${eur(carOf(a1.car).price)}/day</span></a>
    <div class="road-cta">${waLink(`Hello, I want to drive ${a1.name} (${a1.route}). Which car do you recommend and is it free?`, 'btn-wa sm', 'Ask about this route')}</div>
  </div>
</section>

<section class="road-amalfi">
  <div class="ram-facts">
    <h2 class="ram-h">${am.name}</h2>
    <p class="road-story">${am.story}</p>
    <dl class="facts-col mono"><dt>Route</dt><dd>${am.route}</dd><dt>Length</dt><dd>${am.km} km</dd><dt>Time</dt><dd>${am.hours}</dd><dt>Best</dt><dd>${am.best}</dd></dl>
    <a class="roadcar" href="car-${am.car}.html"><img src="img/cars/${am.car}-s.webp" alt=""><span><strong>${carOf(am.car).name}</strong><em>${am.carWhy}</em></span><span class="mono">${eur(carOf(am.car).price)}/day</span></a>
    <div class="road-cta">${waLink(`Hello, I want to drive ${am.name} (${am.route}). Which car do you recommend and is it free?`, 'btn-wa sm', 'Ask about this route')}</div>
  </div>
  <img class="ram-img" src="img/road-${am.id}.webp" alt="${am.name}" loading="lazy">
</section>

<section class="road-stelvio">
  <div class="rst-type">
    <p class="rst-big" aria-hidden="true">${st.km}</p>
    <div class="rst-copy">
      <h2 class="rst-h">${st.name}</h2>
      <p class="road-story">${st.story}</p>
      <table class="facts mono"><tr><td>${st.route}</td><td>${st.km} km</td><td>${st.hours}</td><td>${st.best}</td></tr></table>
      <a class="roadcar" href="car-${st.car}.html"><img src="img/cars/${st.car}-s.webp" alt=""><span><strong>${carOf(st.car).name}</strong><em>${st.carWhy}</em></span><span class="mono">${eur(carOf(st.car).price)}/day</span></a>
      <div class="road-cta">${waLink(`Hello, I want to drive ${st.name} (${st.route}). Which car do you recommend and is it free?`, 'btn-wa sm', 'Ask about this route')}</div>
    </div>
  </div>
  <img class="rst-img" src="img/road-${st.id}.webp" alt="${st.name}" loading="lazy">
</section>
<section class="dests" aria-label="Where to go in Albania">
  <div class="dests-head">
    <h2 class="sec-h">Where people actually go</h2>
    <p>Eight places worth the drive, with the road time from Tirana and a car that can do it. Distances are one way.</p>
  </div>
  ${site.destinations.map((d, i) => `
  <article class="dest" id="${d.id}" style="--i:${i}">
    <img src="img/${d.img}.webp" alt="${d.name}, Albania" loading="lazy" width="1600" height="1000">
    <div class="dest-body">
      <h3 class="dest-name">${d.name}</h3>
      <p class="dest-region mono">${d.region}</p>
      <p class="dest-note">${d.note}</p>
      <table class="dest-facts mono"><tr><td>${d.km} km</td><td>${d.hours}</td></tr></table>
      <a class="roadcar" href="car-${d.car}.html"><img src="img/cars/${d.car}-s.webp" alt=""><span><strong>${carOf(d.car).name}</strong><em>${d.carWhy}</em></span><span class="mono">${eur(carOf(d.car).price)}/day</span></a>
      <div class="road-cta">${waLink(`Hello, I want to visit ${d.name} in Albania. Which car do you recommend and is it free?`, 'btn-wa sm', 'Ask about ' + d.name)}</div>
    </div>
  </article>`).join('')}
</section>
</main>
${footer()}`;
};

// ---------- company ----------
const companyPage = () => `${head('About 24/7 Car Rental Tirana', 'Two locations in Tirana, open every hour of every day, ' + fleet.length + ' cars that are photographed and priced individually. The straight answers to the questions renters actually ask.', 'company.html')}
${nav('company')}
<main class="companywrap">
<section class="manifesto">
  <h1 class="man-h">Open when you land</h1>
  <div class="man-body">
    <p>Most flights into Tirana arrive at hours no rental desk wants to work. Ours does. That is the whole reason the company is called what it is, and it is the one promise everything else here is built around.</p>
    <p>We are a Tirana company with two offices ten minutes apart: one at the airport, one on Rruga Njazi Meka in the city. ${fleet.length} cars, ${fleet.filter(c => c.gear === 'automatic').length} of them automatic, each photographed and priced on its own page so you know which car you are getting before you arrive.</p>
    <p>Albania rewards a car more than almost anywhere in Europe. The Riviera, the mountains in the north, the Ottoman towns in the south: none of them are a bus ride. That is what we are actually renting.</p>
  </div>
</section>

<section class="promises" aria-label="The five promises">
  <h2 class="sec-h">What you get</h2>
  <ol class="prom-list">
    ${site.promises.map((p, i) => `<li class="prom"><span class="gchip">${String(i + 1).padStart(2, '0')}</span><div><strong>${p.t}</strong><p>${p.d}</p></div></li>`).join('')}
  </ol>
</section>

<section class="faq-teaser">
  <div>
    <h2 class="sec-h">Questions get straight answers</h2>
    <p>Licences, borders, night pickups, which car survives the road to Theth, and what the daily price actually covers. ${site.faq.length} of them, grouped and written plainly.</p>
    <a class="btn-verde" href="faq.html">Read the answers <span aria-hidden="true">→</span></a>
  </div>
  <ul class="faq-teaser-list">
    ${site.faq.slice(0, 4).map(f => `<li><a href="faq.html">${f.q}</a></li>`).join('')}
  </ul>
</section>

<section class="colophon" id="colophon">
  <h2 class="sec-h">Colophon</h2>
  <p>This is an unsolicited redesign proposal for <a href="https://24-7rentalcar.com/">24-7rentalcar.com</a>, built by <a href="https://off-plate.com">Off-Plate</a>. Every car, price, specification, phone number and location on this site was taken from their live website on 5 August 2026. The car photographs are theirs. Nothing here is invented: where a fact was missing, the question is listed rather than answered.</p>
  <p>Type is Archivo and Martian Mono, both variable and open licensed. No framework, no tracker, no analytics, no cookie banner because there are no cookies to consent to. The whole site is hand-built static HTML, CSS and one file of JavaScript.</p>
  <details class="credits"><summary>Photography credits</summary><ul id="credit-list">
    <li>All ${fleet.length} car photographs belong to 24/7 Car Rental and were taken from 24-7rentalcar.com. They are shown here only to demonstrate the redesign.</li>
    ${JSON.parse(readFileSync(join(ROOT, 'sourcing/credits-roads.json'))).concat(JSON.parse(readFileSync(join(ROOT, 'sourcing/credits-dest.json')))).map(cr => `<li>${cr.slug}: ${cr.author.replace(/<[^>]+>/g, '')}, ${cr.license}, via <a href="${cr.source_url}" rel="license external">Wikimedia Commons</a></li>`).join('')}
  </ul></details>
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
    <p class="faq-lede">Everything renters ask us before they land, and the things they wish they had asked. If your question is not here, send it and a person in Tirana will answer it today.</p>
    <div class="faq-jump">
      ${site.faqGroups.map(g => `<a href="#${g.id}">${g.g}</a>`).join('')}
    </div>
  </section>

  ${site.faqGroups.map((g, gi) => `
  <section class="faq-group" id="${g.id}">
    <h2 class="faq-gh"><span class="mono">${String(gi + 1).padStart(2, '0')}</span>${g.g}</h2>
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
      <p class="gantry-top">${gantryChip('24/7')}<span class="openlight">Someone is awake</span></p>
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
const howPage = () => `${head('How renting from us actually works', 'No online checkout. Send the dates and the car by WhatsApp or phone, get the total in writing the same day, collect at Tirana airport or the city office at any hour.', 'how.html')}
${nav('how')}
<main class="howwrap">
  <section class="how-hero">
    <h1 class="how-h1">No checkout.<br>A person instead.</h1>
    <p class="how-lede">There is no payment form on this website and that is deliberate. You send two lines, a person in Tirana answers with the real total, and the car is waiting when you land. Here is the whole thing, start to finish.</p>
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
      <p class="gantry-top">${gantryChip('24/7')}<span class="openlight">Someone is awake</span></p>
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
