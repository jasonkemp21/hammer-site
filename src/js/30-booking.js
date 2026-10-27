/* ---------- shared sheet and form pieces ---------- */
function passPrice(id, first) {
  const p = PASSES[id];
  return p.firstTime && first ? p.price * (1 - FIRST_TIME_OFF) : p.price;
}
function sheetHead(label, title, id) {
  return `<header class="sheet__head"><div><p class="label">${label}</p><h2 class="h-m" id="${id}">${title}</h2></div>
    <button class="iconbtn" type="button" data-action="overlay-close" aria-label="Close">${icon('x')}</button></header>`;
}
function stepDots(n, total) { let h = ''; for (let i = 1; i <= total; i++) h += `<i class="${i <= n ? 'is-on' : ''}"></i>`; return `<div class="sheet__steps" aria-hidden="true">${h}</div>`; }
function field(id, label, value, opts) {
  opts = opts || {};
  const err = opts.error ? `<span class="field__error" id="${id}-err">${esc(opts.error)}</span>` : '';
  return `<div class="field ${opts.full ? 'field--full' : ''} ${opts.error ? 'has-error' : ''}"><label for="${id}">${label}${opts.optional ? ' <span class="muted">(optional)</span>' : ''}</label>
    <input class="input" id="${id}" name="${id}" type="${opts.type || 'text'}" value="${esc(value)}" autocomplete="${opts.auto || 'off'}" ${opts.inputmode ? `inputmode="${opts.inputmode}"` : ''} ${opts.placeholder ? `placeholder="${esc(opts.placeholder)}"` : ''} ${opts.error ? `aria-invalid="true" aria-describedby="${id}-err"` : ''}>${err}</div>`;
}
function classLine(c) { return `${DAYS[c.day]}, ${fmtMonthDay.format(c.date)} at ${clock(c.t).text}`; }
function validateContact(form, target) {
  const errors = {};
  if (!form.first.trim()) errors.first = 'Enter your first name.';
  if (!form.last.trim()) errors.last = 'Enter your last name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = 'Enter an email address like name@example.com.';
  target.errors = errors;
  return !Object.keys(errors).length;
}

/* ---------- request a private session, personal training, Kids Boxing, or a talk about competing ---------- */
const INQ_KINDS = { boxing: 'Private boxing', muaythai: 'Private Muay Thai', pt: 'Personal training', compete: 'Sparring and competing', kids: 'Kids boxing' };
const Inquiry = { kind: 'boxing', coach: 'any', pack: 5, times: [], form: { first: '', last: '', email: '', phone: '', note: '' }, errors: {}, done: false, sending: false, failed: false };

function renderInquiry() {
  const host = $('[data-inquire]'); if (!host) return; const q = Inquiry;
  if (q.done) {
    host.innerHTML = `<header class="sheet__head sheet__head--done on-red"><div><p class="label">Sent</p><h2 class="h-l" id="inq-title">Request received.</h2></div>
        <button class="iconbtn" type="button" data-action="overlay-close" aria-label="Close">${icon('x')}</button></header>
      <div class="sheet__body"><p class="lede">${q.kind === 'compete' ? 'Johnny will reach out to talk through where you are and what it takes.' : q.kind === 'kids' ? 'The front desk will reach out about Kids Boxing and enrollment.' : 'A coach will reach out to set your first session.'}</p>
        <p class="muted">Need us sooner? Call <a class="link" href="${GYM.tel}">${GYM.phone}</a>.</p></div>
      <footer class="sheet__foot"><span></span><button class="btn btn--primary" type="button" data-action="overlay-close">Done</button></footer>`;
    return;
  }
  const kinds = Object.keys(INQ_KINDS).map((k) => `<button class="chip" type="button" aria-pressed="${q.kind === k}" data-action="inq-kind" data-id="${k}">${INQ_KINDS[k]}</button>`).join('');
  const who = COACH_ORDER.filter((id) => q.kind === 'compete' ? id === 'johnny' : COACHES[id].privates.includes(q.kind));
  if (q.coach !== 'any' && !who.includes(q.coach)) q.coach = 'any';
  const coachOpts = `<option value="any" ${q.coach === 'any' ? 'selected' : ''}>No preference</option>` + who.map((id) => `<option value="${id}" ${q.coach === id ? 'selected' : ''}>${esc(COACHES[id].name)}</option>`).join('');
  const table = q.kind === 'pt' ? ONE_ON_ONE.pt : ONE_ON_ONE.boxing;
  const groupAsk = q.kind === 'compete' || q.kind === 'kids';
  const packs = groupAsk ? '' : `<div class="field field--full"><span class="field__label">Sessions you are thinking about</span><div class="chips">${table.tiers.map(([n, total]) =>
    `<button class="chip" type="button" aria-pressed="${q.pack === n}" data-action="inq-pack" data-n="${n}">${n === 1 ? 'Single' : n + ' pack'} · ${money(total)}</button>`).join('')}</div>
    ${q.kind === 'muaythai' ? '<span class="small muted">Private boxing rates shown. Ask the desk for Muay Thai rates.</span>' : ''}</div>`;
  const times = ['Mornings', 'Midday', 'Evenings', 'Saturday'].map((t) => `<button class="chip" type="button" aria-pressed="${q.times.includes(t)}" data-action="inq-time" data-id="${t}">${t}</button>`).join('');
  const e = q.errors;
  host.innerHTML = sheetHead(q.kind === 'kids' ? 'Kids Boxing' : 'One-on-one', q.kind === 'compete' ? 'Talk to Johnny' : q.kind === 'kids' ? 'Ask about Kids Boxing' : 'Request a session', 'inq-title') + `<form class="sheet__body" data-form="inquiry" novalidate>
      <div class="field"><span class="field__label">What are you after?</span><div class="chips">${kinds}</div></div>
      <div class="form-grid">
        ${q.kind === 'kids' ? '' : `<div class="field"><label for="inq-coach">Coach</label><select class="select" id="inq-coach">${coachOpts}</select></div>
        <div class="field"><span class="field__label">Best times</span><div class="chips">${times}</div></div>`}
        ${packs}
        ${field('inq-fn', q.kind === 'kids' ? 'Parent first name' : 'First name', q.form.first, { auto: 'given-name', error: e.first })}
        ${field('inq-ln', q.kind === 'kids' ? 'Parent last name' : 'Last name', q.form.last, { auto: 'family-name', error: e.last })}
        ${field('inq-em', 'Email', q.form.email, { type: 'email', auto: 'email', inputmode: 'email', error: e.email })}
        ${field('inq-ph', 'Mobile', q.form.phone, { type: 'tel', auto: 'tel', inputmode: 'tel', optional: true })}
        <div class="field field--full"><label for="inq-note">Anything we should know? <span class="muted">(optional)</span></label><textarea class="textarea" id="inq-note" maxlength="4000" placeholder="${q.kind === 'kids' ? 'Your child’s age and any boxing experience' : 'Goals, experience, schedule'}">${esc(q.form.note)}</textarea></div>
      </div>
      ${honeypot()}
      ${q.kind === 'kids' ? '<p class="small muted">Kids Boxing runs Monday, Wednesday and Friday at 5 PM.</p>' : '<p class="small muted">24-hour notice to cancel or move a session. Packages expire after 90 days. First-time clients get 25% off packages.</p>'}
      ${q.failed ? sendFailed() : ''}
    </form>
    <footer class="sheet__foot"><span class="small muted">Prefer to talk? ${GYM.phone}</span><button class="btn btn--primary" type="button" data-action="inq-send" ${q.sending ? 'disabled' : ''}>${q.sending ? 'Sending…' : 'Send request'}</button></footer>`;
}
function readInquiry() {
  const g = (id) => { const el = $('#' + id); return el ? el.value : ''; };
  if ($('#inq-fn')) Inquiry.form = { first: g('inq-fn'), last: g('inq-ln'), email: g('inq-em'), phone: g('inq-ph'), note: g('inq-note') };
  if ($('#inq-coach')) Inquiry.coach = g('inq-coach');
}
Object.assign(actions, {
  'inquire': (el) => {
    const q = Inquiry; q.done = false; q.failed = false; q.sending = false; q.errors = {};
    if (el && el.dataset.kind) q.kind = el.dataset.kind;
    q.coach = (el && el.dataset.coach) || 'any';
    if ($('#menu') && !$('#menu').hidden) actions['menu-close']();
    formOpened.inquiry = formOpened.inquiry || Date.now();
    renderInquiry(); Overlay.open('inquire');
  },
  'inq-kind': (el) => { readInquiry(); Inquiry.kind = el.dataset.id; renderInquiry(); },
  'inq-pack': (el) => { readInquiry(); Inquiry.pack = +el.dataset.n; renderInquiry(); },
  'inq-time': (el) => { readInquiry(); const t = el.dataset.id; const i = Inquiry.times.indexOf(t); if (i < 0) Inquiry.times.push(t); else Inquiry.times.splice(i, 1); renderInquiry(); },
  'inq-send': async () => {
    const q = Inquiry; if (q.sending) return; readInquiry();
    if (!validateContact(q.form, q)) { renderInquiry(); const bad = $('[data-ov="inquire"] .has-error input'); if (bad) bad.focus(); return; }
    const f = q.form; const group = q.kind === 'compete' || q.kind === 'kids';
    const details = { request: INQ_KINDS[q.kind] };
    if (q.kind !== 'kids') { details.coach = q.coach === 'any' ? 'No preference' : COACHES[q.coach].name; details.best_times = q.times.length ? q.times.join(', ') : 'Not given'; }
    if (!group) details.sessions = q.pack === 1 ? 'Single session' : q.pack + ' sessions';
    const trap = trapValue('[data-ov="inquire"]');
    q.sending = true; q.failed = false; renderInquiry();
    const ok = await sendRequest(q.kind, { name: `${f.first.trim()} ${f.last.trim()}`, email: f.email, phone: f.phone, message: f.note }, details, trap);
    q.sending = false;
    if (ok) { q.done = true; q.form = { first: '', last: '', email: '', phone: '', note: '' }; q.times = []; } else q.failed = true;
    renderInquiry();
  },
});
