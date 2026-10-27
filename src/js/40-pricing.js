/* ---------- pricing: the cost-per-class calculator and the full price list ---------- */
const MONTH = 52 / 12; // weeks in an average month

function calcRows() {
  const freq = state.freq, first = state.firstTime, perMonth = freq * MONTH;
  const pack = passPrice('pack10', first), weeks = 10 / freq;
  const rows = [
    { id: 'single', name: 'Single classes', sub: 'Pay as you go, $30 each. No commitment.', per: 30, month: 30 * perMonth },
    { id: 'pack10', name: '10-class pack', sub: `${money(pack)} for ten boxing classes${first ? ', with 25% off for first-time clients' : ''}. One pack lasts about ${Math.round(weeks)} weeks at this pace.`, per: pack / 10, month: (pack / 10) * perMonth },
    { id: 'unlimited', name: 'Group Boxing Unlimited', sub: '$150 a month for every boxing class on the schedule.', per: 150 / perMonth, month: 150 },
  ];
  const max = Math.max.apply(null, rows.map((r) => r.month));
  const best = rows.slice().sort((a, b) => a.month - b.month)[0];
  rows.forEach((r) => { r.w = Math.round((r.month / max) * 100); r.best = r === best; });
  const second = rows.slice().sort((a, b) => a.month - b.month)[1];
  return { rows, best, saves: Math.round(second.month - best.month), perMonth };
}
function calcPlans() {
  const c = calcRows();
  const intro = state.firstTime ? `<div class="plan plan--intro"><div class="plan__head"><h3 class="plan__name">Start with the intro <span class="pill pill--red">New clients</span></h3>
      <p class="plan__sub">Your first three classes for $30, before you pick a plan.</p></div>
      <p class="plan__price">$10<small>a class</small></p>
      <div class="plan__foot"><span>The gym's offer for new clients.</span><button class="btn btn--primary btn--sm" type="button" data-action="buy" data-item="intro">Claim it</button></div></div>` : '';
  const rows = c.rows.map((r) => `<div class="plan ${r.best ? 'is-best' : ''}">
      <div class="plan__head"><h3 class="plan__name">${r.name}${r.best ? ' <span class="pill pill--red">Best value</span>' : ''}</h3><p class="plan__sub">${r.sub}</p></div>
      <p class="plan__price">${money(Math.round(r.per * 100) / 100)}<small>a class</small></p>
      <div class="plan__bar" role="img" aria-label="About ${money(Math.round(r.month))} a month"><i style="--w:${r.w}%"></i></div>
      <div class="plan__foot"><span>About <b>${money(Math.round(r.month))}</b> a month</span>
        ${r.id === 'single' ? `<button class="btn btn--ghost btn--sm" type="button" data-action="book">Book a class</button>` : `<button class="btn ${r.best ? 'btn--primary' : 'btn--ghost'} btn--sm" type="button" data-action="buy" data-item="${r.id}">Get it</button>`}</div>
    </div>`).join('');
  const line = `At ${state.freq} ${state.freq === 1 ? 'class' : 'classes'} a week, ${c.best.id === 'unlimited' ? 'Unlimited' : c.best.id === 'pack10' ? 'the 10-class pack' : 'paying per class'} saves you about ${money(c.saves)} a month over the next best option.`;
  return intro + rows + `<p class="small calc__note"><b>${line}</b> <span class="muted">Months are averaged at 4.33 weeks.</span></p>`;
}
function renderCalc() {
  $$('[data-calc]').forEach((host) => {
    const scope = host.dataset.calc;
    if (!host.dataset.built) {
      host.dataset.built = '1';
      host.innerHTML = `<div class="calc__ctrl">
          <label class="label" for="calc-range-${scope}">How often will you train?</label>
          <div class="calc__freq"><output class="calc__n" for="calc-range-${scope}"></output><span>classes<br>a week</span></div>
          <input class="range" type="range" min="1" max="6" step="1" id="calc-range-${scope}" data-calc-range>
          <div class="range__ticks" aria-hidden="true"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div>
          <p class="small muted" data-calc-month></p>
          <label class="check"><input type="checkbox" id="calc-first-${scope}" data-calc-first><span><b>I am a first-time client</b><br><span class="muted">Shows the intro offer and 25% off packages.</span></span></label>
        </div>
        <div class="calc__plans" data-calc-plans aria-live="polite"></div>`;
    }
    const range = $('[data-calc-range]', host);
    range.value = state.freq; range.style.setProperty('--p', ((state.freq - 1) / 5) * 100 + '%');
    $('.calc__n', host).textContent = state.freq;
    $('.calc__freq span', host).innerHTML = (state.freq === 1 ? 'class' : 'classes') + '<br>a week';
    $('[data-calc-month]', host).textContent = `About ${Math.round(state.freq * MONTH)} classes a month.`;
    $('[data-calc-first]', host).checked = state.firstTime;
    $('[data-calc-plans]', host).innerHTML = calcPlans();
  });
}
document.addEventListener('input', (e) => {
  if (e.target.matches('[data-calc-range]')) { state.freq = clamp(+e.target.value, 1, 6); renderCalc(); }
});
document.addEventListener('change', (e) => {
  if (e.target.matches('[data-calc-first], [data-first-toggle]')) { state.firstTime = e.target.checked; renderCalc(); renderPricing(); }
});

/* ----- one-on-one package picker ----- */
const packPick = { boxing: 10, pt: 10 };
function packMath(kind, n) {
  const tiers = ONE_ON_ONE[kind].tiers; const single = tiers[0][1];
  const list = tiers.find((t) => t[0] === n)[1];
  const total = n > 1 && state.firstTime ? list * (1 - FIRST_TIME_OFF) : list;
  return { n, list, total, per: total / n, saves: n * single - total, single };
}
function packPicker(kind) {
  const o = ONE_ON_ONE[kind]; const n = packPick[kind]; const m = packMath(kind, n);
  const chips = o.tiers.map(([k]) => `<button class="chip" type="button" aria-pressed="${k === n}" data-action="pack-pick" data-kind="${kind}" data-n="${k}">${k === 1 ? 'Single' : k}</button>`).join('');
  const maxPer = o.tiers[0][1];
  const bars = o.tiers.map(([k]) => { const x = packMath(kind, k); return `<div class="perbar ${k === n ? 'is-on' : ''}"><i style="--h:${Math.round((x.per / maxPer) * 100)}%"></i><span>${k}</span></div>`; }).join('');
  return `<article class="packer">
      <header><h3 class="h-m">${o.name}</h3><p class="small muted">${kind === 'boxing' ? 'One-on-one with active fighters. Private Muay Thai is available too.' : 'One-on-one with a NASM-certified trainer.'}</p></header>
      <div class="field"><span class="field__label">Sessions</span><div class="chips">${chips}</div></div>
      <div class="packer__out">
        <div class="packer__per"><b>${money(Math.round(m.per * 100) / 100)}</b><span>a session</span></div>
        <div class="perbars" role="img" aria-label="Price per session falls from ${money(maxPer)} for a single session to ${money(packMath(kind, 40).per)} in a 40 pack">${bars}</div>
      </div>
      <dl class="summary">
        <div><dt>${n === 1 ? 'Single session' : n + ' sessions'}</dt><dd>${m.total !== m.list ? `<s>${money(m.list)}</s> ` : ''}${money(m.total)}</dd></div>
        <div><dt>You save</dt><dd>${m.saves > 0 ? money(m.saves) + ' against single sessions' : 'Buy a pack to save'}</dd></div>
      </dl>
      <div class="btn-row"><button class="btn btn--primary" type="button" data-action="inquire" data-kind="${kind}">Request a session</button>
        <button class="btn btn--ghost" type="button" data-action="buy" data-item="pack-${kind}-${n}">Get this pack</button></div>
    </article>`;
}

function passCard(id) {
  const p = PASSES[id]; const price = passPrice(id, state.firstTime); const cut = price !== p.price;
  const punch = id === 'pack10' ? `<div class="punch" role="img" aria-label="Ten classes">${Array.from({ length: 10 }, (_, i) => `<i>${i + 1}</i>`).join('')}</div>` : '';
  return `<article class="pass ${id === 'unlimited' ? 'pass--feature' : ''}">
      <header><h3 class="h-s">${esc(p.name)}</h3>${id === 'unlimited' ? '<span class="pill pill--red">Best at 2+ classes a week</span>' : id === 'intro' ? '<span class="pill pill--ink">Start here</span>' : ''}</header>
      <p class="pass__price">${cut ? `<s>${money(p.price)}</s>` : ''}<b>${money(price)}</b><span>${p.per ? 'a month' : p.classes > 1 ? `${p.classes} classes` : 'one class'}</span></p>
      ${punch}
      <p class="small muted">${esc(p.note)}${cut ? ' First-time price.' : ''}</p>
      ${id === 'single' ? `<button class="btn btn--ghost btn--sm" type="button" data-action="book">Book a class</button>` : `<button class="btn ${id === 'unlimited' ? 'btn--primary' : 'btn--ghost'} btn--sm" type="button" data-action="buy" data-item="${id}">${id === 'intro' ? 'Claim the offer' : 'Get it'}</button>`}
    </article>`;
}

function renderPricing() {
  const host = $('[data-pricing]'); if (!host) return;
  host.innerHTML = `<div class="band band--paper"><div class="wrap">
      <div class="sec-head"><div><p class="label">Group classes</p><h2 class="h-l">Classes and <em>memberships</em></h2></div>
        <div class="sec-head__aside"><label class="check"><input type="checkbox" data-first-toggle ${state.firstTime ? 'checked' : ''}><span><b>I am a first-time client</b><br><span class="muted">Apply 25% off packages.</span></span></label></div></div>
      <div class="passes">${['intro', 'single', 'pack10', 'unlimited', 'plus', 'hammer', 'hammerplus', 'access'].map(passCard).join('')}</div>
      <p class="micro muted passes__fine">Prices are subject to change. The 10-class pack covers boxing classes and expires 12 weeks after purchase. Memberships are priced per month.</p>
    </div></div>
    <div class="band band--ink"><div class="wrap">
      <div class="sec-head"><div><p class="label">Do the math</p><h2 class="h-l">What a class <em>works out to</em></h2></div>
        <div class="sec-head__aside"><p class="small muted">Set how often you will train. The cheapest way to do it lights up.</p></div></div>
      <div class="calc" data-calc="page"></div>
    </div></div>
    <div class="band band--paper"><div class="wrap">
      <div class="sec-head"><div><p class="label">One-on-one</p><h2 class="h-l">Private boxing and <em>personal training</em></h2></div>
        <div class="sec-head__aside"><p class="small muted">The more sessions in a pack, the less each one costs. Pick a size to see it.</p></div></div>
      <div class="packers">${packPicker('boxing')}${packPicker('pt')}</div>
      <ul class="fine">
        <li>${icon('clock')}<span><b>24-hour notice</b> to cancel or move a session.</span></li>
        <li>${icon('cal')}<span><b>90 days</b> to use a package.</span></li>
        <li>${icon('bolt')}<span><b>First-time clients</b> get 25% off packages: private boxing, private Muay Thai, personal training and group class packs.</span></li>
      </ul>
    </div></div>`;
  renderCalc();
}
Object.assign(actions, {
  'pack-pick': (el) => { packPick[el.dataset.kind] = +el.dataset.n; renderPricing(); const again = $(`[data-action="pack-pick"][data-kind="${el.dataset.kind}"][data-n="${el.dataset.n}"]`); if (again) again.focus(); },
});
