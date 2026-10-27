/* ---------- Book or Buy: Mindbody, or reserve and pay at the gym ----------
   One sheet behind every Book and Buy button. A class or a pass is picked, then the visitor chooses
   Mindbody (pay online, opens in a new tab) or a reservation the front desk sees at /admin and takes payment for in person. */
const PASS_CHOICES = [['have', 'I already have a pass or membership'], ['intro', 'New client intro: 3 classes for $30'], ['single', 'Single class, $30'], ['unsure', 'Not sure yet, I will decide at the desk']];
const CLASS_ITEMS = ['intro', 'single', 'pack10', 'unlimited', 'plus', 'hammer', 'hammerplus']; // passes that come with a first class to pick
const Reserve = { mode: 'class', step: 'pick', key: null, dayN: 0, item: null, pass: 'unsure', first: false, rental: false, firstClass: '', form: { first: '', last: '', email: '', phone: '', note: '' }, errors: {}, sending: false, failed: false, done: null };

/* what a Buy button refers to: a pass, a membership or a one-on-one package */
function itemInfo(id) {
  if (!id) return null;
  if (PASSES[id]) { const p = PASSES[id]; return { id, name: p.name, price: money(p.price) + (p.per ? ' a month' : ''), note: p.note, kind: 'pass' }; }
  const m = /^pack-(boxing|pt)-(\d+)$/.exec(id);
  if (m) { const o = ONE_ON_ONE[m[1]]; const tier = o.tiers.find((t) => t[0] === +m[2]); if (!tier) return null; return { id, name: `${o.name}, ${tier[0] === 1 ? 'single session' : tier[0] + ' sessions'}`, price: money(tier[1]), note: 'Packages expire after 90 days. 24-hour notice to cancel or move a session.', kind: 'pack' }; }
  return null;
}
const reserveClass = () => (Reserve.key ? findClass(Reserve.key) : null);
const classWith = (c) => `${c.type.name}${c.coach ? ' with ' + c.coach.name : ''}`;

function gcalLink(c) {
  const start = `${ymd(c.date)}T${pad2(Math.floor(c.t / 60))}${pad2(c.t % 60)}00`; const endM = c.t + c.type.mins;
  const end = `${ymd(c.date)}T${pad2(Math.floor(endM / 60))}${pad2(endM % 60)}00`;
  return 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    + '&text=' + encodeURIComponent(`${c.type.name} at ${GYM.name}`) + '&dates=' + start + '/' + end + '&ctz=' + encodeURIComponent(GYM.tz)
    + '&details=' + encodeURIComponent(`${c.coach ? 'With ' + stop(c.coach.name) + ' ' : ''}Wear comfortable workout clothes and supportive shoes. Bring a towel and a water bottle. Gloves and wraps rent for $5.`)
    + '&location=' + encodeURIComponent(`${GYM.name}, ${GYM.street}, ${GYM.city}`);
}

function renderReserve() {
  const host = $('[data-reserve]'); if (!host) return; const r = Reserve; const c = reserveClass(); const item = itemInfo(r.item);
  const week = WEEKVIEW; let html = '';

  if (r.step === 'pick') {
    const days = week.days.filter((d) => d.classes.some((x) => x.type.bookable && x.startsIn > 0));
    if (!days.some((d) => d.n === r.dayN)) r.dayN = days.length ? days[0].n : 0;
    const chips = days.map((d) => `<button class="chip" type="button" aria-pressed="${d.n === r.dayN}" data-action="rv-day" data-n="${d.n}">${d.n === 0 ? 'Today' : d.n === 1 ? 'Tomorrow' : DAYS3[d.day] + ' ' + fmtMonthDay.format(d.date)}</button>`).join('');
    const day = week.days[r.dayN];
    const rows = day.classes.filter((x) => x.type.bookable && x.startsIn > 0).map((x) => `<label class="opt">
        <input type="radio" name="rv-class" value="${x.key}" ${x.key === r.key ? 'checked' : ''}>
        <span class="opt__time data">${clock(x.t).text}</span>
        <span class="opt__main"><b>${esc(x.type.name)}</b><small>${x.coach ? 'with ' + esc(x.coach.name) + ' · ' : ''}${x.type.mins} min · ${esc(x.type.level)}</small></span>
        <span class="tag tag--${x.type.tag}">${TAG_LABEL[x.type.tag]}</span></label>`).join('');
    html = sheetHead('Book a class', 'Pick your class', 'book-title') + `<div class="sheet__body">
        <div class="chips">${chips}</div>
        <div class="opts" role="radiogroup" aria-label="Classes on this day">${rows || '<p class="muted">No classes left on this day.</p>'}</div>
      </div>
      <footer class="sheet__foot"><span class="small muted">${c ? esc(classLine(c)) : 'Choose a class to continue.'}</span>
        <button class="btn btn--primary" type="button" data-action="rv-how" ${c ? '' : 'disabled'}>Continue ${icon('go', 'i--go')}</button></footer>`;
  }

  if (r.step === 'how') {
    const recap = r.mode === 'class' && c
      ? `<div class="recap"><span class="tag tag--${c.type.tag}">${TAG_LABEL[c.type.tag]}</span><b>${esc(c.type.name)}</b><span>${esc(classLine(c))}${c.coach ? ' · ' + esc(c.coach.name) : ''}</span><button class="link small" type="button" data-action="rv-pick">Change</button></div>`
      : item ? `<div class="recap"><b>${esc(item.name)}</b><span>${esc(item.price)}</span></div>` : '';
    html = sheetHead(r.mode === 'class' ? 'Book a class' : 'Get a pass', 'How would you like to do it?', 'book-title') + `<div class="sheet__body">
        ${recap}
        <div class="ways">
          <button class="way" type="button" data-action="rv-mindbody">
            <b>${r.mode === 'class' ? 'Book on Mindbody' : 'Buy on Mindbody'}</b>
            <span>Pay online and ${r.mode === 'class' ? 'lock in your spot' : 'have it on your account'} right now. Opens the gym's Mindbody page in a new tab.</span>
            <small>${icon('out')} clients.mindbodyonline.com</small>
          </button>
          <button class="way" type="button" data-action="rv-form">
            <b>Reserve and pay at the gym</b>
            <span>Leave your name and number here. The front desk ${r.mode === 'class' ? 'holds your spot' : 'has it ready'}, and you pay when you come in.</span>
            <small>${icon('pin')} Cash or card at the desk</small>
          </button>
        </div>
      </div>
      <footer class="sheet__foot"><span class="small muted">Questions? Call ${GYM.phone}</span></footer>`;
  }

  if (r.step === 'form') {
    const e = r.errors; const f = r.form;
    const upcoming = allUpcoming(week).filter((x) => x.type.bookable).slice(0, 24);
    const firstClass = r.mode === 'item' && item && CLASS_ITEMS.indexOf(item.id) >= 0
      ? `<div class="field field--full"><label for="rv-first-class">Your first class <span class="muted">(optional)</span></label><select class="select" id="rv-first-class"><option value="">I will pick one later</option>${upcoming.map((x) => `<option value="${x.key}" ${x.key === r.firstClass ? 'selected' : ''}>${esc(classWith(x))}, ${esc(classLine(x))}</option>`).join('')}</select></div>` : '';
    const passPick = r.mode === 'class' ? `<div class="field field--full"><label for="rv-pass">What will you use for this class?</label><select class="select" id="rv-pass">${PASS_CHOICES.map(([id, label]) => `<option value="${id}" ${r.pass === id ? 'selected' : ''}>${label}</option>`).join('')}</select></div>` : '';
    html = sheetHead('Pay at the gym', r.mode === 'class' ? 'Reserve your spot' : 'Reserve your pass', 'book-title') + `<form class="sheet__body" data-form="reserve" novalidate>
        ${r.mode === 'class' && c ? `<div class="recap"><span class="tag tag--${c.type.tag}">${TAG_LABEL[c.type.tag]}</span><b>${esc(c.type.name)}</b><span>${esc(classLine(c))}${c.coach ? ' · ' + esc(c.coach.name) : ''}</span></div>` : item ? `<div class="recap"><b>${esc(item.name)}</b><span>${esc(item.price)}</span></div>` : ''}
        <div class="form-grid">
          ${field('rv-fn', 'First name', f.first, { auto: 'given-name', error: e.first })}
          ${field('rv-ln', 'Last name', f.last, { auto: 'family-name', error: e.last })}
          ${field('rv-em', 'Email', f.email, { type: 'email', auto: 'email', inputmode: 'email', error: e.email })}
          ${field('rv-ph', 'Mobile', f.phone, { type: 'tel', auto: 'tel', inputmode: 'tel', error: e.phone })}
          ${passPick}${firstClass}
          <label class="check field--full"><input type="checkbox" id="rv-first" ${r.first ? 'checked' : ''}><span><b>This is my first time at Hammer</b><br><span class="muted">New clients get 3 classes for $30 and 25% off packages.</span></span></label>
          ${r.mode === 'class' ? `<label class="check field--full"><input type="checkbox" id="rv-rental" ${r.rental ? 'checked' : ''}><span><b>I need gloves and wraps</b><br><span class="muted">The gym rents them for $5.</span></span></label>` : ''}
          <div class="field field--full"><label for="rv-note">Anything we should know? <span class="muted">(optional)</span></label><textarea class="textarea" id="rv-note" maxlength="4000">${esc(f.note)}</textarea></div>
        </div>
        ${honeypot()}
        <p class="small muted">The front desk will have your reservation. Pay when you arrive, by cash or card.</p>
        ${r.failed ? sendFailed() : ''}
      </form>
      <footer class="sheet__foot"><button class="btn btn--ghost" type="button" data-action="rv-how">${icon('back')} Back</button>
        <button class="btn btn--primary" type="button" data-action="rv-send" ${r.sending ? 'disabled' : ''}>${r.sending ? 'Sending…' : (r.mode === 'class' ? 'Reserve my spot' : 'Reserve it')}</button></footer>`;
  }

  if (r.step === 'done' && r.done) {
    const d = r.done; const cls = d.cls; const s = cls ? clock(cls.t) : null;
    html = `<header class="sheet__head sheet__head--done on-red"><div><p class="label">Reserved · pay at the gym</p><h2 class="h-l" id="book-title">${cls ? "You're on the card" : 'It is set aside for you'}${d.first ? ', ' + esc(d.first) : ''}.</h2></div>
        <button class="iconbtn" type="button" data-action="overlay-close" aria-label="Close">${icon('x')}</button></header>
      <div class="sheet__body">
        ${cls ? `<div class="stub">
          <div class="stub__time"><b>${s.h}:${pad2(s.m)}</b><span>${s.ap}</span></div>
          <div class="stub__what"><b>${esc(cls.type.name)}</b><span>${esc(classLine(cls))}</span><span>${cls.coach ? 'with ' + esc(cls.coach.name) + ' · ' : ''}${cls.type.mins} min</span></div>
          <div class="stub__pass"><span class="label">Pay</span><b>At the desk</b></div>
        </div>` : `<div class="recap"><b>${esc(d.item.name)}</b><span>${esc(d.item.price)} · pay at the desk</span></div>`}
        <div class="bring">
          <p class="label">${cls ? 'Before you come' : 'Next'}</p>
          <ul>
            <li>${icon('check')}<span>${cls ? 'Come a few minutes early to pay and check in at the front desk.' : 'Come to the front desk, pay, and your pass is ready to use.'}</span></li>
            <li>${icon('check')}<span>Wear comfortable workout clothes and supportive athletic shoes.</span></li>
            <li>${icon('check')}<span>${d.rental ? 'Rental gloves and wraps are on your reservation, $5 when you arrive.' : 'Bring gloves and wraps, or rent them at the gym for $5.'}</span></li>
            <li>${icon('check')}<span>We are at North and Mohawk, a few minutes from the Sedgwick Brown Line stop.</span></li>
          </ul>
        </div>
        <div class="btn-row">
          ${cls ? `<a class="btn btn--solid" href="${gcalLink(cls)}" target="_blank" rel="noopener">${icon('cal')} Add to Google Calendar</a>` : ''}
          <a class="btn btn--ghost" href="${GYM.maps}" target="_blank" rel="noopener">${icon('pin')} Directions</a>
        </div>
        <p class="small muted">Plans change? Call <a class="link" href="${GYM.tel}">${GYM.phone}</a> and we will move it.</p>
      </div>
      <footer class="sheet__foot"><span></span><button class="btn btn--primary" type="button" data-action="overlay-close">Done</button></footer>`;
  }
  host.innerHTML = html;
  if (r.step === 'form') formOpened.reserve = formOpened.reserve || Date.now();
}
function readReserve() {
  const g = (id) => { const el = $('#' + id); return el ? el.value : ''; };
  if ($('#rv-fn')) Reserve.form = { first: g('rv-fn'), last: g('rv-ln'), email: g('rv-em'), phone: g('rv-ph'), note: g('rv-note') };
  if ($('#rv-pass')) Reserve.pass = g('rv-pass');
  if ($('#rv-first-class')) Reserve.firstClass = g('rv-first-class');
  if ($('#rv-first')) Reserve.first = $('#rv-first').checked;
  if ($('#rv-rental')) Reserve.rental = $('#rv-rental').checked;
}
function openReserve(mode, opts) {
  const r = Reserve; r.mode = mode; r.errors = {}; r.sending = false; r.failed = false; r.done = null;
  WEEKVIEW = buildWeek();
  if (mode === 'class') {
    let c = opts.key ? findClass(opts.key) : null;
    if ((!c || c.startsIn <= 0) && opts.type) c = nextClass(WEEKVIEW, (x) => x.type.id === opts.type);
    if (c && c.startsIn <= 0) c = null;
    r.key = c ? c.key : null; r.dayN = c ? c.n : 0; r.item = null;
    r.step = c ? 'how' : 'pick';
  } else {
    r.item = opts.item; r.key = null; r.step = 'how';
    if (!itemInfo(r.item)) { openOut(GYM.store); return; }
  }
  if ($('#menu') && !$('#menu').hidden) actions['menu-close'](true);
  renderReserve(); Overlay.open('book');
}
Object.assign(actions, {
  'book': (el) => openReserve('class', { key: el && el.dataset.class, type: el && el.dataset.type }),
  'buy': (el) => openReserve('item', { item: (el && el.dataset.item) || 'single' }),
  'rv-day': (el) => { Reserve.dayN = +el.dataset.n; const d = WEEKVIEW.days[Reserve.dayN]; const first = d.classes.find((x) => x.type.bookable && x.startsIn > 0); Reserve.key = first ? first.key : null; renderReserve(); },
  'rv-pick': () => { Reserve.step = 'pick'; renderReserve(); },
  'rv-how': () => { readReserve(); if (Reserve.mode === 'class' && !Reserve.key) return; Reserve.step = 'how'; Reserve.failed = false; renderReserve(); const h = $('[data-ov="book"] h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } },
  'rv-form': () => { Reserve.step = 'form'; renderReserve(); const i = $('#rv-fn'); if (i) i.focus(); },
  'rv-mindbody': () => { const c = reserveClass(); Overlay.close(true); openOut(Reserve.mode === 'class' ? mindbodySchedule(c ? c.date : null) : GYM.store); },
  'rv-send': async () => {
    const r = Reserve; if (r.sending) return; readReserve();
    const ok1 = validateContact(r.form, r);
    if (!/\d{7,}/.test(r.form.phone.replace(/\D/g, ''))) r.errors.phone = 'Enter a mobile number so the desk can reach you.';
    if (!ok1 || r.errors.phone) { renderReserve(); const bad = $('[data-ov="book"] .has-error input'); if (bad) bad.focus(); return; }
    const c = reserveClass(); const item = itemInfo(r.item); const f = r.form;
    if (r.mode === 'class' && !c) { r.step = 'pick'; renderReserve(); return; }
    const details = { pay: 'At the gym' };
    if (r.mode === 'class') {
      details.class = c.type.name; details.when = classLine(c); if (c.coach) details.coach = c.coach.name;
      details.pass = (PASS_CHOICES.find((p) => p[0] === r.pass) || PASS_CHOICES[3])[1];
    } else {
      details.item = item.name; details.price = item.price;
      const fc = r.firstClass ? findClass(r.firstClass) : null; if (fc) details.first_class = `${classWith(fc)}, ${classLine(fc)}`;
    }
    details.first_time = r.first ? 'Yes' : 'No';
    if (r.mode === 'class') details.rental = r.rental ? 'Yes, gloves and wraps ($5)' : 'No';
    const trap = trapValue('[data-ov="book"]');
    r.sending = true; r.failed = false; renderReserve();
    const ok = await sendRequest(r.mode === 'class' ? 'booking' : 'purchase', { name: `${f.first.trim()} ${f.last.trim()}`, email: f.email, phone: f.phone, message: f.note }, details, trap);
    r.sending = false;
    if (ok) { r.done = { cls: c, item, first: f.first.trim(), rental: r.rental }; r.step = 'done'; r.form = { first: '', last: '', email: '', phone: '', note: '' }; r.firstClass = ''; r.rental = false; }
    else r.failed = true;
    renderReserve();
  },
});
document.addEventListener('change', (e) => {
  const t = e.target;
  if (t.name === 'rv-class') { Reserve.key = t.value; renderReserve(); const again = $(`input[name="rv-class"][value="${t.value}"]`); if (again) again.focus(); }
});
