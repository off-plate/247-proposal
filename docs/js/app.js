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

  /* ---------- availability: shared by the car calendar and the fleet filter ---------- */
  const AV = window.AVAIL || {};
  const iso = d => d.toISOString().slice(0, 10);
  const busyOn = (slug, day) => (AV[slug] || []).some(([a, z]) => day >= a && day <= z);
  // a car is free for a stay only if every night in it is free
  const freeBetween = (slug, from, to) => {
    if (!from || !to || from > to) return true;
    const d = new Date(from + 'T00:00:00'), end = new Date(to + 'T00:00:00');
    while (d <= end) { if (busyOn(slug, iso(d))) return false; d.setDate(d.getDate() + 1); }
    return true;
  };

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
      const dFrom = $('#f-from')?.value || '', dTo = $('#f-to')?.value || '';
      const dated = !!(dFrom && dTo && dFrom <= dTo);
      const clearBtn = $('#f-dates-clear');
      if (clearBtn) clearBtn.hidden = !(dFrom || dTo);
      const [key, dir] = $('#sort').value.split('-');
      const items = $$('.row', rows);
      items.sort((a, z) => (dir === 'asc' ? 1 : -1) * (+a.dataset[key] - +z.dataset[key]));
      let shown = 0;
      items.forEach(el => {
        const ok = (laneSet ? laneSet.includes(el.dataset.slug) : (cls === 'all' || el.dataset.cls === cls)) &&
          (!wantAuto || el.dataset.trans === 'automatic') &&
          (!want5 || +el.dataset.seats >= 5) &&
          (!dated || freeBetween(el.dataset.slug, dFrom, dTo));
        el.hidden = !ok;
        if (ok) shown++;
        rows.appendChild(el);
      });
      const empty = $('#rows-empty');
      if (empty) {
        empty.hidden = shown > 0;
        const line = $('#rows-empty-line');
        if (line) line.textContent = dated
          ? `No car is free for ${dFrom} to ${dTo} with those filters.`
          : 'No car matches those filters.';
      }
    };
    $('#chips').addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      laneSet = null; cls = c.dataset.cls; apply();
    });
    ['#sort', '#f-auto', '#f-5seats', '#f-from', '#f-to'].forEach(sel => { const e = $(sel); if (e) e.addEventListener('change', apply); });
    // dates arriving from the homepage search
    const q = new URLSearchParams(location.search);
    if (q.get('from') && $('#f-from')) $('#f-from').value = q.get('from');
    if (q.get('to') && $('#f-to')) $('#f-to').value = q.get('to');
    if (q.get('gear') === 'automatic' && $('#f-auto')) $('#f-auto').checked = true;
    const dc = $('#f-dates-clear');
    if (dc) dc.addEventListener('click', () => { $('#f-from').value = ''; $('#f-to').value = ''; apply(); });
    const clear = $('#rows-clear');
    if (clear) clear.addEventListener('click', () => {
      laneSet = null; cls = 'all'; $('#f-auto').checked = false; $('#f-5seats').checked = false;
      if ($('#f-from')) $('#f-from').value = ''; if ($('#f-to')) $('#f-to').value = ''; apply();
    });

    apply();
  }

  /* ---------- car page calendar: the booking control, not a picture of one ---------- */
  const calEl = $('#cal');
  if (calEl) {
    const slug = calEl.dataset.slug, rate = +calEl.dataset.price;
    const MONTHS = 3;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let from = null, to = null;
    const pickEl = $('#cal-pick'), bookEl = $('#cal-book'), resetEl = $('#cal-reset');

    // the same arithmetic the booking uses, so the calendar and the request never
    // disagree about how many days a stay is
    const rentalDays = (a, z) => Math.max(Math.round((new Date(z) - new Date(a)) / 864e5), 0);
    // a range is only offerable if every night in it is free
    const clearBetween = (a, z) => {
      const d = new Date(a + 'T00:00:00'), end = new Date(z + 'T00:00:00');
      while (d <= end) { if (busyOn(slug, iso(d))) return false; d.setDate(d.getDate() + 1); }
      return true;
    };

    const render = () => {
      let html = '';
      for (let m = 0; m < MONTHS; m++) {
        const first = new Date(today.getFullYear(), today.getMonth() + m, 1);
        const last = new Date(today.getFullYear(), today.getMonth() + m + 1, 0);
        const lead = (first.getDay() + 6) % 7;
        html += `<div class="cal-month"><p class="cal-m">${first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>`
          + `<div class="cal-dow">${['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => `<span>${d}</span>`).join('')}</div><div class="cal-grid">`
          + '<span class="cal-pad"></span>'.repeat(lead);
        for (let day = 1; day <= last.getDate(); day++) {
          const d = new Date(first.getFullYear(), first.getMonth(), day);
          const k = iso(d);
          const past = d < today, busy = busyOn(slug, k);
          const isFrom = from === k, isTo = to === k;
          const inRange = from && to && k > from && k < to;
          const cls = ['cal-d',
            past ? 'is-past' : busy ? 'is-busy' : 'is-free',
            isFrom ? 'is-from' : '', isTo ? 'is-to' : '', inRange ? 'is-in' : ''].filter(Boolean).join(' ');
          const label = `${d.toLocaleDateString('en-GB')}: ${past ? 'in the past' : busy ? 'booked' : 'available'}`;
          html += past || busy
            ? `<span class="${cls}" title="${label}"><b>${day}</b></span>`
            : `<button type="button" class="${cls}" data-d="${k}" title="${label}"><b>${day}</b></button>`;
        }
        html += '</div></div>';
      }
      calEl.innerHTML = html;

      if (from && to) {
        const n = rentalDays(from, to);
        const fmt = x => new Date(x + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        pickEl.textContent = n > 0
          ? `${fmt(from)} to ${fmt(to)}, ${n} day${n > 1 ? 's' : ''}, ${eur(rate * n)}`
          : 'Pick a last day after the first.';
        bookEl.href = `${window.BASE || ''}book/?car=${slug}&from=${from}&to=${to}`;
        bookEl.removeAttribute('aria-disabled');
      } else if (from) {
        pickEl.textContent = 'Now pick your last day.';
        bookEl.setAttribute('aria-disabled', 'true');
      } else {
        pickEl.textContent = 'Pick your first day, then your last.';
        bookEl.setAttribute('aria-disabled', 'true');
      }
      resetEl.hidden = !from;
    };

    calEl.addEventListener('click', e => {
      const btn = e.target.closest('.cal-d[data-d]'); if (!btn) return;
      const k = btn.dataset.d;
      if (!from || (from && to)) { from = k; to = null; }
      else if (k === from) { from = null; to = null; }
      else if (k < from) { from = k; to = null; }
      else if (!clearBetween(from, k)) { from = k; to = null; }   // a booked night sits in between
      else { to = k; }
      render();
    });
    resetEl.addEventListener('click', () => { from = null; to = null; render(); });
    render();
  }

  /* ---------- reviews rail ---------- */
  const rail = $('#revrail');
  if (rail) {
    const step = () => rail.querySelector('.rev')?.getBoundingClientRect().width + 20 || 320;
    const prev = $('#rev-prev'), next = $('#rev-next');
    const sync = () => {
      const max = rail.scrollWidth - rail.clientWidth - 2;
      prev.disabled = rail.scrollLeft <= 2;
      next.disabled = rail.scrollLeft >= max;
    };
    prev.addEventListener('click', () => rail.scrollBy({ left: -step() * 2, behavior: 'smooth' }));
    next.addEventListener('click', () => rail.scrollBy({ left: step() * 2, behavior: 'smooth' }));
    rail.addEventListener('scroll', sync, { passive: true });
    addEventListener('resize', sync);
    // after layout, or the widths are still zero and both arrows read as enabled
    requestAnimationFrame(sync);
  }

  /* ---------- language switcher ---------- */
  const langBtn = $('#lang-btn'), langMenu = $('#lang-menu');
  if (langBtn && langMenu) {
    const close = () => { langMenu.hidden = true; langBtn.setAttribute('aria-expanded', 'false'); };
    langBtn.addEventListener('click', e => {
      e.stopPropagation();
      const open = langMenu.hidden;
      langMenu.hidden = !open;
      langBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', e => { if (!e.target.closest('#lang')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
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
    // The offer is made once, against the car the visitor arrived with. Taking it must
    // not produce a fresh offer against the car they just accepted: that is a ladder,
    // not a suggestion, and nobody trusts the second rung.
    let offer = null, offerSettled = false;
    const paintPicks = () => {
      const cur = carOf(), n = days(b), wrap = $('#upgrade');
      if (!wrap) return;
      if (offer === null && cur) offer = upsellFor(cur) || false;
      const up = offerSettled ? null : (offer || null);
      const hint = $('#up-hint'), keep = $('#up-keep');
      if (!cur || !up) {
        // show the choice rather than an empty panel: the offer is over, the car is not
        wrap.hidden = !cur;
        wrap.classList.toggle('is-settled', true);
        if (cur) {
          $('#up-cur-img').src = `${window.BASE || ''}img/cars/${cur.slug}-s.webp`;
          $('#up-cur-img').alt = cur.name;
          const e = $('#up-cur-nm'); if (e) e.textContent = cur.name;
          const sp = $('#up-cur-spec');
          if (sp) sp.textContent = `${cur.gear === 'automatic' ? 'Automatic' : 'Manual'}, ${cur.seats} seats, ${cur.clsLabel || cur.cls}`;
          const fg = $('#up-cur-fig');
          if (fg) fg.textContent = n > 0 ? `${eur(cur.price * n)} for ${n} day${n > 1 ? 's' : ''}` : `${eur(cur.price)} a day`;
          const role = $('#up-current .up-role'); if (role) role.textContent = 'Your car';
        }
        if (hint) hint.textContent = !cur ? 'Choose a car from the fleet first.'
          : offerSettled ? `You are booking the ${cur.name}.`
          : `Nothing in the fleet costs more than the ${cur.name}. Carry on.`;
        if (keep) keep.textContent = 'Continue';
        return;
      }
      wrap.hidden = false;
      wrap.classList.remove('is-settled');
      const roleEl = $('#up-current .up-role'); if (roleEl) roleEl.textContent = 'Your choice';
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
      // one offer, and this was it
      if (slug) {
        b.car = slug; offerSettled = true; writeBook(b); paintPicks();
        // a decision was made, so do not leave them looking at a settled panel
        if (valid()) { step += 1; }
        paint(); toStepTop();
      }
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
