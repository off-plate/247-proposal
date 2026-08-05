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
      if (note) note.innerHTML = `Totals are the published daily rate multiplied by your ${nDays} days, starting ${new Date(bk.from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}. Longer rentals are usually cheaper per day, so the office may quote you less. <a href="book.html">Change dates</a>.`;
    }
    const stageImg = $('#stage-img'), stageName = $('#stage-name'), stageMeta = $('#stage-meta'), stageView = $('#stage-view');
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
      items.forEach(el => {
        const ok = (laneSet ? laneSet.includes(el.dataset.slug) : (cls === 'all' || el.dataset.cls === cls)) &&
          (!wantAuto || el.dataset.trans === 'automatic') &&
          (!want5 || +el.dataset.seats >= 5);
        el.hidden = !ok;
        rows.appendChild(el);
      });
      const sel = $('.row.is-sel', rows);
      if (!sel || sel.hidden) {
        const flag = items.find(el => !el.hidden && el.dataset.slug === 'jaguar-xf');
        const first = flag || items.find(el => !el.hidden);
        if (first) select(first, false);
      }
    };
    const select = (row, scroll = true) => {
      $$('.row', rows).forEach(r => r.classList.remove('is-sel'));
      row.classList.add('is-sel');
      const slug = row.dataset.slug;
      stageImg.src = `img/cars/${slug}.webp`;
      stageImg.alt = row.dataset.name;
      stageName.textContent = row.dataset.name;
      const bk2 = readBook(), n2 = days(bk2);
      stageMeta.innerHTML = n2 > 0
        ? `<span class="mono">${eur(tripTotal(+row.dataset.price, n2))} / ${n2} day${n2 > 1 ? 's' : ''}</span> · ${row.dataset.meta}`
        : `<span class="mono">${eur(+row.dataset.price)}/day</span> · ${row.dataset.meta}`;
      stageView.href = `car-${slug}.html`;
      if (scroll && matchMedia('(max-width:1100px)').matches) window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    rows.addEventListener('click', e => {
      if (e.target.closest('.row-go')) return;
      const row = e.target.closest('.row');
      if (row) select(row);
    });
    rows.addEventListener('keydown', e => {
      if (e.key === 'Enter') { const row = e.target.closest('.row'); if (row) select(row); }
    });
    $('#chips').addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      laneSet = null; cls = c.dataset.cls; apply();
    });
    ['#sort', '#f-auto', '#f-5seats'].forEach(s => $(s).addEventListener('change', apply));
    // preload full-size images once idle so stage swaps are instant
    (window.requestIdleCallback || setTimeout)(() => {
      $$('.row', rows).forEach(r => { const i = new Image(); i.src = `img/cars/${r.dataset.slug}.webp`; });
    });
    apply();
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
      set('total', p.total ? eur(p.total) : '0 €');
    };
    const fmt = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase();

    const valid = () => {
      switch (step) {
        case 0: return !!b.loc && (!$('#oneway').checked || !!b.loc2);
        case 1: return days(b) > 0;
        case 2: return !!carOf();
        case 3: return $('#drv-name').value.trim().length > 2 && $('#drv-mail').validity.valid && !!$('#drv-mail').value && $('#drv-tel').value.trim().length > 5;
        default: return false;
      }
    };
    const paint = () => {
      $$('.step').forEach(s => { s.hidden = +s.dataset.step !== step; });
      const sb = $('.sumboard'); if (sb) sb.hidden = step === 4;
      $$('.pchip').forEach(c => {
        c.classList.toggle('is-now', +c.dataset.step === step);
        c.classList.toggle('is-done', +c.dataset.step < step);
      });
      $('#back').hidden = step === 0;
      const next = $('#next');
      next.hidden = step === 4;
      next.disabled = !valid();
      next.innerHTML = step === 3 ? 'Review request <span aria-hidden="true">→</span>' : 'Continue <span aria-hidden="true">→</span>';
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

    /* step 2: cars */
    const paintPicks = () => {
      const n = days(b);
      $$('.pick').forEach(p => {
        p.classList.toggle('is-on', p.dataset.slug === b.car);
        const el = $('.pick-total', p);
        if (n > 0) {
          const perDay = +p.dataset.price;
          const total = n >= 7 ? perDay * SITE.week * Math.floor(n / 7) + perDay * (n % 7) : perDay * n;
          el.textContent = `${eur(total)} for ${n} day${n > 1 ? 's' : ''}${n >= 7 ? ', 7th day free' : ''}`;
        } else el.textContent = `${eur(+p.dataset.price)}/day`;
      });
    };
    $('#pickrail').addEventListener('click', e => {
      const p = e.target.closest('.pick'); if (!p) return;
      b.car = p.dataset.slug; paintPicks(); paint();
    });

    $('#pickrail').addEventListener('click', e => {
      const p = e.target.closest('.pick'); if (!p) return;
      b.car = p.dataset.slug; paintPicks(); paint();
    });

    /* step 3: extras */
    /* nav */
    $('#back').addEventListener('click', () => { step = Math.max(0, step - 1); paint(); });
    $('#next').addEventListener('click', () => {
      if (!valid()) return;
      if (step === 3) return confirmBooking();
      step += 1; paint();
    });
    ['drv-name', 'drv-mail', 'drv-tel'].forEach(id => $('#' + id).addEventListener('input', paint));

    const confirmBooking = () => {
      if (!carOf()) { step = 2; paint(); return; }
      const p = price(), c = carOf(), nd = days(b);
      const ref = 'REQ-' + String(Date.now()).slice(-5);
      b.ref = ref; writeBook(b);
      step = 4; paint();
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
