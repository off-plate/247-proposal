/* AUTOSOLE runtime. No dependencies. State: localStorage 'as-theme', 'as-book'. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const eur = n => `${Math.round(n).toLocaleString('en-IE')} €`;

  /* ---------- FAQ deep links: open the accordion the hash points at ---------- */
  const openFromHash = () => {
    const id = location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS' && !el.open) {
      el.open = true;
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  };
  if (document.querySelector('.qa-item')) {
    openFromHash();
    addEventListener('hashchange', openFromHash);
  }

  /* ---------- header: full width at rest, pill once scrolled ---------- */
  const pillnav = $('#pillnav'), sentinel = $('.navsentinel');
  if (pillnav && sentinel && 'IntersectionObserver' in window) {
    new IntersectionObserver(
      ([e]) => pillnav.classList.toggle('is-pinned', !e.isIntersecting),
      { threshold: 0 },
    ).observe(sentinel);
  }

  /* ---------- mobile sheet ---------- */
  const burger = $('#burger'), sheet = $('#sheet');
  if (burger) burger.addEventListener('click', () => {
    const open = sheet.hidden;
    sheet.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
  });

  /* ---------- booking state ---------- */
  const readBook = () => { try { return JSON.parse(localStorage.getItem('t247-book')) || {}; } catch { return {}; } };
  const writeBook = b => { try { localStorage.setItem('t247-book', JSON.stringify(b)); } catch {} };
  const days = b => {
    if (!b.from || !b.to) return 0;
    const d = Math.round((new Date(b.to) - new Date(b.from)) / 864e5);
    return d > 0 ? d : 0;
  };
  const seasonMult = () => 1;  // their published daily rate is the rate

  /* footer board reflects real booking state */
  const bb = $('#board-book');
  if (bb) {
    const b = readBook();
    if (b.ref) { bb.textContent = b.ref; }
    else if (b.car || b.from) { bb.textContent = 'IN PROGRESS'; }
  }

  const tripTotal = (perDay, n) => perDay * n;  // no weekly formula invented; longer stays are negotiated

  /* ---------- fleet page ---------- */
  const rows = $('#rows');
  if (rows) {
    const bk = readBook(), nDays = days(bk);
    if (nDays > 0 && window.SITE) {
      $$('.row', rows).forEach(r => {
        const total = tripTotal(+r.dataset.price, nDays);
        const el = $('.row-price', r);
        el.innerHTML = `${eur(total)}<em> / ${nDays} day${nDays > 1 ? 's' : ''}</em>`;
      });
      const note = $('#list-note');
      if (note) note.innerHTML = `Totals are the published daily rate multiplied by your ${nDays} days, starting ${new Date(bk.from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. Rates are per day, as published. <a href="${window.BASE || ''}book/">Change dates</a>.`;
    }
    const LANES = {
      city: ['golf-5', 'hyundai-accent', 'audi-a4'],
      sedan: ['volkswagen-passat', 'mercedes-benz-c220', 'audi-a6'],
      suv: ['hyundai-tucson', 'hyundai-santa-fe', 'hyundai-santa-fe-2016'],
      coupe: ['audi-a5-2014', 'volkswagen-passat-cc', 'volkswagen-passat-cc-2014'],
      premium: ['jaguar-xf'],
    };
    let cls = 'all', laneSet = null;
    if (location.hash) {
      const h = location.hash.slice(1);
      if (LANES[h]) laneSet = LANES[h];
      else if ($$('#chips .chip').some(c => c.dataset.cls === h)) cls = h;
    }
    const apply = () => {
      $$('#chips .chip').forEach(c => c.classList.toggle('is-on', c.dataset.cls === cls));
      const wantAuto = $('#f-auto').checked, want5 = $('#f-5seats').checked;
      const [key, dir] = $('#sort').value.split('-');
      const items = $$('.row', rows);
      items.sort((a, z) => (dir === 'asc' ? 1 : -1) * (+a.dataset[key] - +z.dataset[key]));
      let shown = 0;
      items.forEach(el => {
        const ok = (laneSet ? laneSet.includes(el.dataset.slug) : (cls === 'all' || el.dataset.cls === cls)) &&
          (!wantAuto || el.dataset.trans === 'automatic') &&
          (!want5 || +el.dataset.seats >= 5);
        el.hidden = !ok;
        if (ok) shown++;
        rows.appendChild(el);
      });
      const empty = $('#rows-empty');
      if (empty) empty.hidden = shown > 0;
    };
    $('#chips').addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      laneSet = null; cls = c.dataset.cls; apply();
    });
    ['#sort', '#f-auto', '#f-5seats'].forEach(s => $(s).addEventListener('change', apply));
    const clear = $('#rows-clear');
    if (clear) clear.addEventListener('click', () => {
      laneSet = null; cls = 'all'; $('#f-auto').checked = false; $('#f-5seats').checked = false; apply();
    });

    apply();
  }

  /* ---------- car page gallery ---------- */
  const gal = $('#cargal');
  if (gal) {
    const main = $('#cargal-main');
    gal.addEventListener('click', e => {
      const t = e.target.closest('.cargal-t'); if (!t) return;
      main.src = t.dataset.img;
      $$('.cargal-t', gal).forEach(x => x.classList.toggle('is-on', x === t));
    });
  }

  /* ---------- car page reserve bar: total for stored dates ---------- */
  const rb = $('.reservebar');
  if (rb) {
    const b = readBook(), n = days(b);
    if (n > 0) {
      const total = tripTotal(+rb.dataset.price, n);
      $('#rb-total').textContent = `${n} day${n > 1 ? 's' : ''} → ${eur(total)} total`;
    }
  }

  /* ---------- deck form seeds booking state ---------- */
  const deckForm = $('.gantry-form');
  if (deckForm) {
    const d1 = new Date(Date.now() + 864e5), d2 = new Date(Date.now() + 4 * 864e5);
    if (!deckForm.from.value) deckForm.from.value = d1.toISOString().slice(0, 10);
    if (!deckForm.to.value) deckForm.to.value = d2.toISOString().slice(0, 10);
    deckForm.from.min = d1.toISOString().slice(0, 10);
  }
  if (deckForm) deckForm.addEventListener('submit', () => {
    const b = readBook();
    b.loc = deckForm.loc.value;
    if (deckForm.from.value) b.from = deckForm.from.value;
    if (deckForm.to.value) b.to = deckForm.to.value;
    delete b.ref;
    writeBook(b);
  });

  /* ---------- booking flow ---------- */
  const chiprail = $('#chiprail');
  if (chiprail && window.FLEET) {
    const b = readBook();
    delete b.ref;
    const qs = new URLSearchParams(location.search);
    if (qs.get('car') && FLEET.some(c => c.slug === qs.get('car'))) b.car = qs.get('car');
    if (qs.get('loc')) b.loc = qs.get('loc');
    if (qs.get('from')) b.from = qs.get('from');
    if (qs.get('to')) b.to = qs.get('to');
    b.extras = b.extras || [];
    let step = 0;

    const carOf = () => FLEET.find(c => c.slug === b.car);
    const locOf = id => SITE.locations.find(l => l.id === id);

    const price = () => {
      const c = carOf(), n = days(b);
      if (!c || !n) return { total: 0, lines: [] };
      const total = c.price * n;
      return { total, lines: [[`${c.name}, ${n} day${n > 1 ? 's' : ''} x ${c.price} €`, total]] };
    };

    const board = () => {
      const t = $('#sum-t');
      const set = (k, v) => { $(`tr[data-k="${k}"] td:last-child`, t).textContent = v; };
      set('loc', b.loc ? (locOf(b.loc)?.label || '–') + (b.loc2 && b.loc2 !== b.loc ? ' → ' + locOf(b.loc2).label : '') : 'choose');
      set('dates', b.from && b.to ? `${fmt(b.from)} ${b.tf || ''} → ${fmt(b.to)} ${b.tt || ''}`.replace(/\s+/g, ' ').trim() : 'not set');
      set('car', carOf()?.name || 'not set');
      const nd = days(b);
      set('days', nd > 0 ? `${nd} day${nd > 1 ? 's' : ''}` : 'not set');
      const p = price();
      // a zero total on a rental page reads as free or broken. Say what is missing instead.
      const tot = $$('#sum-t tr').find(r => r.dataset.k === 'total');
      if (tot) tot.classList.toggle('is-pending', !p.total);
      set('total', p.total ? eur(p.total) : 'after dates and car');
      // the panel shows the car, not just its name in a table row
      const c2 = carOf(), fig = $('#sum-car');
      if (fig) {
        fig.hidden = !c2;
        if (c2) {
          $('#sum-car-img').src = `${window.BASE || ''}img/cars/${c2.slug}-s.webp`;
          $('#sum-car-img').alt = c2.name;
          $('#sum-car-nm').textContent = c2.name;
          $('#sum-car-spec').textContent = `${c2.gear === 'automatic' ? 'Automatic' : 'Manual'}, ${c2.seats} seats, ${eur(c2.price)} a day`;
        }
      }
    };
    const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();

    const valid = () => {
      switch (step) {
        // where and when are one screen now, so step 0 needs both
        case 0: return !!b.loc && (!$('#oneway').checked || !!b.loc2) && days(b) > 0;
        case 1: return !!carOf();   // always true when arriving from a car page
        case 2: return $('#drv-name').value.trim().length > 2 && $('#drv-mail').validity.valid && !!$('#drv-mail').value && $('#drv-tel').value.trim().length > 5;
        default: return false;
      }
    };
    // the hero search collects where, when and gearbox. Carry them in instead of
    // making the visitor type the same four things twice.
    const heroParams = () => {
      const q = new URLSearchParams(location.search);
      if (!q.size) return;
      const loc = q.get('loc'), ret = q.get('ret'), from = q.get('from'), to = q.get('to');
      if (loc) b.loc = loc;
      if (ret && ret !== loc) { b.loc2 = ret; const ow = $('#oneway'); if (ow) ow.checked = true; }
      if (from) { b.from = from; const el = $('#d-from'); if (el) el.value = from; }
      if (to) { b.to = to; const el = $('#d-to'); if (el) el.value = to; }
      const tf = q.get('tfrom'), tt = q.get('tto');
      if (tf) { b.tfrom = tf; const el = $('#t-from'); if (el) el.value = tf; }
      if (tt) { b.tto = tt; const el = $('#t-to'); if (el) el.value = tt; }
      writeBook(b);
    };
    heroParams();

    const paint = () => {
      $$('.step').forEach(s => { s.hidden = +s.dataset.step !== step; });
      const sb = $('.sumboard'); if (sb) sb.hidden = step === 3;
      $$('.pchip').forEach(c => {
        c.classList.toggle('is-now', +c.dataset.step === step);
        c.classList.toggle('is-done', +c.dataset.step < step);
      });
      $('#back').hidden = step === 0;
      const next = $('#next');
      next.hidden = step === 3;
      next.disabled = !valid();
      next.innerHTML = step === 2 ? 'Review request <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>';
      board();
      writeBook(b);
    };

    /* step 0: locations */
    const paintLocs = () => {
      $$('#locgrid .loc').forEach(l => l.classList.toggle('is-on', l.dataset.loc === b.loc));
      $$('#locgrid2 .loc').forEach(l => l.classList.toggle('is-on', l.dataset.loc === b.loc2));
    };
    const flightWrap = $('#flight-wrap'), flightIn = $('#flight');
    const paintFlight = () => { if (flightWrap) flightWrap.hidden = !(b.loc && locOf(b.loc)?.airport); };
    if (flightIn) { flightIn.value = b.flight || ''; flightIn.addEventListener('input', () => { b.flight = flightIn.value.trim(); writeBook(b); }); }
    $('#locgrid').addEventListener('click', e => {
      const l = e.target.closest('.loc'); if (!l) return;
      b.loc = l.dataset.loc; paintLocs(); paintFlight(); paint();
    });
    paintFlight();
    const ow = $('#oneway');
    const g2 = $('#locgrid2');
    g2.innerHTML = $('#locgrid').innerHTML;
    ow.addEventListener('change', () => {
      g2.hidden = !ow.checked; $('#oneway-note').hidden = !ow.checked;
      if (!ow.checked) delete b.loc2;
      paint();
    });
    g2.addEventListener('click', e => {
      const l = e.target.closest('.loc'); if (!l) return;
      b.loc2 = l.dataset.loc; paintLocs(); paint();
    });

    /* step 1: dates */
    const df = $('#d-from'), dt = $('#d-to');
    const today = new Date(); today.setDate(today.getDate() + 1);
    df.min = today.toISOString().slice(0, 10);
    if (b.from) df.value = b.from;
    if (b.to) dt.value = b.to;
    const dateChange = () => {
      b.from = df.value; b.to = dt.value;
      b.tf = $('#t-from').value; b.tt = $('#t-to').value;
      dt.min = df.value || df.min;
      const n = days(b);
      $('#days-chip').textContent = n > 0 ? `${n} day${n > 1 ? 's' : ''}` : '–';
      const note = $('#season-note');
      if (note && n > 0) note.textContent = n >= 7
        ? 'Rentals of a week or more are usually quoted below the daily rate. Ask the office.'
        : 'Estimate is the published daily rate multiplied by your days.';
      paintPicks(); paint();
    };
    df.addEventListener('change', dateChange); dt.addEventListener('change', dateChange);
    $('#t-from').addEventListener('change', dateChange); $('#t-to').addEventListener('change', dateChange);

    /* step 2: the one place a better car is offered, and it says both numbers */
    // The nearest car above the current one in price. Class first so an SUV is not
    // offered a coupe, then the smallest step up. Null when nothing is dearer.
    const upsellFor = c => {
      if (!c) return null;
      const dearer = (window.FLEET || []).filter(x => x.price > c.price);
      if (!dearer.length) return null;
      const sameCls = dearer.filter(x => x.cls === c.cls);
      const pool = sameCls.length ? sameCls : dearer;
      return pool.sort((a, z) => (a.price - c.price) - (z.price - c.price))[0];
    };
    const paintPicks = () => {
      const cur = carOf(), n = days(b), wrap = $('#upgrade');
      if (!wrap) return;
      const up = upsellFor(cur);
      const hint = $('#up-hint'), keep = $('#up-keep');
      if (!cur || !up) {
        wrap.hidden = true;
        // keep the current name true even when there is nothing to offer against it
        if (cur) { const e = $('#up-cur-nm'); if (e) e.textContent = cur.name; }
        if (hint) hint.textContent = cur
          ? `Nothing in the fleet costs more than the ${cur.name}. Carry on.`
          : 'Choose a car from the fleet first.';
        if (keep) keep.textContent = 'Continue';
        return;
      }
      wrap.hidden = false;
      const perDay = up.price - cur.price;
      const total = n > 0 ? perDay * n : 0;
      const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
      $('#up-cur-img').src = `${window.BASE || ''}img/cars/${cur.slug}-s.webp`;
      $('#up-cur-img').alt = cur.name;
      $('#up-off-img').src = `${window.BASE || ''}img/cars/${up.slug}-s.webp`;
      $('#up-off-img').alt = up.name;
      set('#up-cur-nm', cur.name); set('#up-off-nm', up.name);
      const spec = c => `${c.gear === 'automatic' ? 'Automatic' : 'Manual'}, ${c.seats} seats, ${c.clsLabel || c.cls}`;
      set('#up-cur-spec', spec(cur)); set('#up-off-spec', spec(up));
      set('#up-cur-fig', n > 0 ? `${eur(cur.price * n)} for ${n} day${n > 1 ? 's' : ''}` : `${eur(cur.price)} a day`);
      set('#up-off-fig', n > 0 ? `${eur(up.price * n)} for ${n} day${n > 1 ? 's' : ''}` : `${eur(up.price)} a day`);
      set('#up-hint', `You picked the ${cur.name}. The ${up.name} is the next car up.`);
      // both numbers, always. The daily one flatters the offer and the total does not,
      // so a visitor who is told only the first has been sold something.
      set('#up-diff', n > 0
        ? `${eur(perDay)} more a day, ${eur(total)} more across your ${n} days.`
        : `${eur(perDay)} more a day.`);
      set('#up-take', `Take the ${up.name}`);
      if (keep) keep.textContent = `Keep the ${cur.name}`;
      wrap.dataset.up = up.slug;
    };
    const upTake = $('#up-take'), upKeep = $('#up-keep');
    if (upTake) upTake.addEventListener('click', () => {
      const slug = $('#upgrade').dataset.up;
      if (slug) { b.car = slug; writeBook(b); paintPicks(); paint(); }
    });
    if (upKeep) upKeep.addEventListener('click', () => { if (valid()) { step += 1; paint(); toStepTop(); } });

    /* step 3: extras */
    /* nav */
    $('#back').addEventListener('click', () => { toStepTop(); step = Math.max(0, step - 1); paint(); });
    const toStepTop = () => {
      const el = $('.step.is-now') || $('.bookgrid');
      if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    };
    $('#next').addEventListener('click', () => { toStepTop();
      if (!valid()) return;
      if (step === 2) return confirmBooking();
      step += 1; paint();
    });
    ['drv-name', 'drv-mail', 'drv-tel'].forEach(id => $('#' + id).addEventListener('input', paint));

    const confirmBooking = () => {
      if (!carOf()) { step = 1; paint(); return; }
      const p = price(), c = carOf(), nd = days(b);
      const ref = 'REQ-' + String(Date.now()).slice(-5);
      b.ref = ref; writeBook(b);
      step = 3; paint();
      $('#next').hidden = true;
      $('#done-ref').textContent = ref;
      const pickup = locOf(b.loc)?.label || '';
      const dropoff = b.loc2 && b.loc2 !== b.loc ? locOf(b.loc2).label : pickup;
      const rows = [
        ['COLLECT', pickup],
        ['RETURN', dropoff],
        ['DATES', `${fmt(b.from)} ${b.tf || ''} → ${fmt(b.to)} ${b.tt || ''}`.replace(/\s+/g, ' ').trim()],
        ...(b.flight ? [['FLIGHT', b.flight.toUpperCase()]] : []),
        ['CAR', c.name],
        ['DAYS', `${nd} x ${c.price} €`],
        ['ESTIMATE', eur(p.total)],
        ['NAME', ($('#drv-name').value || '').trim().toUpperCase()],
      ];
      const note = ($('#drv-note')?.value || '').trim();
      if (note) rows.push(['NOTE', note.toUpperCase()]);
      $('#done-t').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
      const msg = [
        `Hello 24/7 Car Rental, I would like to book a car. (${ref})`,
        `Car: ${c.name} at ${c.price} EUR/day`,
        `Collect: ${pickup}`,
        `Return: ${dropoff}`,
        `Dates: ${fmt(b.from)} ${b.tf || ''} to ${fmt(b.to)} ${b.tt || ''}`.replace(/\s+/g, ' '),
        b.flight ? `Flight: ${b.flight}` : '',
        `${nd} days, about ${p.total} EUR`,
        `Name: ${($('#drv-name').value || '').trim()}`,
        `Email: ${($('#drv-mail').value || '').trim()}`,
        note ? `Note: ${note}` : '',
      ].filter(Boolean).join('\n');
      const wa = $('#send-wa');
      if (wa) wa.href = `https://wa.me/${SITE.wa}?text=${encodeURIComponent(msg)}`;
    };

    paintLocs();
    if (b.from) dateChange(); else { paintPicks(); paint(); }
  }
})();
