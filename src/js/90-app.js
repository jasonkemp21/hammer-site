/* ---------- page pieces that only need drawing once ---------- */
function renderProgs() {
  const host = $('[data-progs]'); if (!host) return;
  host.innerHTML = `<div class="progs__stage" aria-hidden="true">${PROGRAMS.map((p, i) => `<img src="${p.img}" alt="" loading="lazy" data-prog-img="${p.id}" class="${i === 0 ? 'is-on' : ''}">`).join('')}<span class="progs__cap" data-prog-cap>${esc(PROGRAMS[0].when)}</span></div>
    <ul class="progs__list">${PROGRAMS.map((p, i) => `<li class="prog ${i === 0 ? 'is-on' : ''}" data-prog="${p.id}">
        <a class="prog__btn" href="#programs" data-route="programs" data-scroll="prog-${p.id}">
          <img class="prog__thumb" src="${p.img}" alt="" loading="lazy" width="104" height="130">
          <span class="prog__name">${esc(p.name)}</span>
          <span class="prog__desc">${esc(p.line)}</span>
          <span class="prog__meta"><span>${icon('clock')}${esc(p.when)}</span><span>${esc(p.price)}</span></span>
          <span class="prog__go" aria-hidden="true">${icon('go')}</span>
        </a></li>`).join('')}</ul>`;
  const activate = (li) => {
    if (!li || li.classList.contains('is-on')) return;
    $$('.prog', host).forEach((x) => x.classList.toggle('is-on', x === li));
    $$('[data-prog-img]', host).forEach((img) => img.classList.toggle('is-on', img.dataset.progImg === li.dataset.prog));
    const p = PROGRAMS.find((x) => x.id === li.dataset.prog); $('[data-prog-cap]', host).textContent = p.when;
  };
  host.addEventListener('mouseover', (e) => activate(e.target.closest('.prog')));
  host.addEventListener('focusin', (e) => activate(e.target.closest('.prog')));
}

function programCta(p) {
  const c = p.cta;
  const attrs = c.action === 'book' ? `data-action="book" data-type="${c.type}"` : c.action === 'inquire' ? `data-action="inquire" data-kind="${c.kind}"` : `data-action="buy"`;
  return `<button class="btn btn--primary" type="button" ${attrs}>${esc(c.label)} ${icon('go', 'i--go')}</button>`;
}
function renderProgramsPage() {
  const host = $('[data-programs]'); if (!host) return;
  const jump = $('[data-programs-jump]');
  if (jump) jump.innerHTML = PROGRAMS.map((p) => `<button class="chip" type="button" data-scrollto="prog-${p.id}">${esc(p.name)}</button>`).join('');
  host.innerHTML = PROGRAMS.map((p, i) => {
    const nx = p.classType ? nextClass(WEEKVIEW, (c) => c.type.id === p.classType) : null;
    return `<article class="program ${i % 2 ? 'program--flip' : ''}" id="prog-${p.id}">
        <div class="program__media"><img src="${p.img}" loading="lazy" alt="${esc(p.alt)}"></div>
        <div class="program__body">
          <p class="label">${icon('clock')} ${esc(p.when)}</p>
          <h2 class="h-l">${esc(p.name)}</h2>
          <div class="prose">${p.body.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
          ${p.quote ? `<blockquote class="tapecard__quote">“${esc(p.quote.text)}”<cite>${esc(p.quote.by)}</cite></blockquote>` : ''}
          <ul class="ticks">${p.points.map((t) => `<li>${star()}<span>${esc(t)}</span></li>`).join('')}</ul>
          <dl class="summary">
            <div><dt>Price</dt><dd>${esc(p.price)}</dd></div>
            ${nx ? `<div><dt>Next one</dt><dd>${esc(classLine(nx))} with ${esc(nx.coach.name)}</dd></div>` : ''}
          </dl>
          <div class="btn-row">${programCta(p)}<a class="link" href="#pricing" data-route="pricing">See pricing</a></div>
        </div>
      </article>`;
  }).join('');
}

/* the map is drawn, not embedded: stations and streets placed to the city grid (800 address numbers to the mile) */
function mapSvg() {
  return `<svg viewBox="0 0 760 430" role="img" aria-label="Map: Hammer is on the south side of North Avenue at Mohawk Street, between the North and Clybourn Red Line station to the west and the Sedgwick Brown Line station to the east.">
    <rect class="map-bg" width="760" height="430"/>
    <g class="map-minor"><path d="M0 120H760M0 320H760M175 0V430M415 0V430M586 0V430"/></g>
    <path class="map-road" d="M-10 140L250 400"/>
    <g class="map-road"><path d="M70 0V430"/><path d="M277 0V430"/><path d="M347 0V430"/><path d="M483 0V430"/><path d="M690 0V430"/></g>
    <path class="map-road map-road--main" d="M0 220H760"/>
    <path class="map-brown" d="M440 0C446 110 468 170 492 232S524 360 530 430"/>
    <path class="map-red" d="M-4 146L246 396"/>
    <g class="map-label">
      <text x="62" y="20" transform="rotate(-90 62 20)" text-anchor="end">HALSTED</text>
      <text x="269" y="20" transform="rotate(-90 269 20)" text-anchor="end">LARRABEE</text>
      <text x="339" y="20" transform="rotate(-90 339 20)" text-anchor="end">MOHAWK</text>
      <text x="475" y="20" transform="rotate(-90 475 20)" text-anchor="end">SEDGWICK</text>
      <text x="682" y="20" transform="rotate(-90 682 20)" text-anchor="end">WELLS</text>
      <text x="512" y="207">W NORTH AVE</text>
      <text x="196" y="372" transform="rotate(45 196 372)">CLYBOURN</text>
    </g>
    <g class="map-area"><text x="592" y="140">OLD TOWN</text><text x="92" y="92">LINCOLN PARK</text></g>
    <g class="map-walk"><path d="M92 238H330"/><path d="M476 238H376"/></g>
    <g class="map-walklabel"><rect x="158" y="246" width="100" height="24"/><text x="208" y="263" text-anchor="middle">8 MIN WALK</text><rect x="378" y="246" width="96" height="24"/><text x="426" y="263" text-anchor="middle">4 MIN WALK</text></g>
    <g class="map-stop map-stop--red"><circle cx="70" cy="220" r="10"/><text x="88" y="196">North/Clybourn</text><text class="map-sub" x="88" y="180">RED LINE</text></g>
    <g class="map-stop map-stop--brown"><circle cx="492" cy="234" r="10"/><text x="524" y="262">Sedgwick</text><text class="map-sub" x="524" y="280">BROWN · PURPLE</text></g>
    <g class="map-bus"><rect x="602" y="208" width="62" height="24"/><text x="633" y="225" text-anchor="middle">72 BUS</text></g>
    <g class="map-pin"><rect x="336" y="226" width="36" height="36"/><polygon points="354,232 356.2,240.2 364.4,238 358.4,244 364.4,250 356.2,247.8 354,256 351.8,247.8 343.6,250 349.6,244 343.6,238 351.8,240.2"/>
      <text class="map-pin__name" x="354" y="292" text-anchor="middle">HAMMER</text><text class="map-pin__addr" x="354" y="310" text-anchor="middle">525 W. North Ave.</text></g>
    <g class="map-n"><path d="M724 58V28M717 36l7-9 7 9"/><text x="724" y="76" text-anchor="middle">N</text></g>
  </svg>`;
}
function visitMarkup(full) {
  const addr = `${GYM.street}, ${GYM.city}`;
  return `<div class="visit__map">${mapSvg()}<a class="btn btn--solid btn--sm visit__dir" href="${GYM.maps}" target="_blank" rel="noopener">${icon('pin')} Get directions</a></div>
    <div class="visit__info">
      <div class="visit__block">
        <p class="label">Address</p>
        <p class="visit__addr">${esc(GYM.street)}</p>
        <p class="muted">${esc(GYM.cross)} · ${esc(GYM.city)}</p>
        <div class="copyrow"><span class="vh" data-copy-src>${esc(addr)}</span><button class="copybtn" type="button" data-action="copy" data-copy="${esc(addr)}">${icon('copy')} Copy address</button></div>
      </div>
      <div class="visit__block"><p class="label">Hours</p><div class="hours" data-hours></div></div>
      <div class="visit__block"><p class="label">Getting here</p>
        <ul class="transit">
          <li>${icon('train')}<div><b><span class="line-dot" style="background:#B8774A"></span>Sedgwick, Brown and Purple lines</b><span>About a 4-minute walk west on North Ave.</span></div></li>
          <li>${icon('train')}<div><b><span class="line-dot" style="background:#E0343C"></span>North/Clybourn, Red Line</b><span>About an 8-minute walk east on North Ave.</span></div></li>
          <li>${icon('bus')}<div><b>#72 North</b><span>Runs along North Ave. past the door.</span></div></li>
        </ul></div>
      ${full ? `<div class="visit__block"><p class="label">Call or write</p>
        <div class="copyrow"><a class="link" href="${GYM.tel}" data-copy-src>${GYM.phone}</a><button class="copybtn" type="button" data-action="copy" data-copy="${GYM.phone}">${icon('copy')} Copy</button></div>
        <div class="copyrow"><a class="link" href="mailto:${GYM.email}" data-copy-src>${GYM.email}</a><button class="copybtn" type="button" data-action="copy" data-copy="${GYM.email}">${icon('copy')} Copy</button></div>
        <p class="small muted">Training questions go straight to Johnny: ${GYM.emailTraining}</p></div>` : ''}
    </div>`;
}
function renderVisit() { $$('[data-visit]').forEach((host) => { host.innerHTML = visitMarkup(host.dataset.visit === 'full'); }); }
function renderFaq() {
  const host = $('[data-faq]'); if (!host) return;
  host.innerHTML = FAQ.map((f) => `<details class="faq__item" id="faq-${f.id}"><summary><span>${esc(f.q)}</span>${icon('plus')}</summary><p>${esc(f.a)}</p></details>`).join('');
}
function renderWalls() { $$('[data-wall]').forEach((host) => { host.innerHTML = wallMarkup(host.dataset.wall !== 'plain'); }); }

/* ---------- contact form on the Visit page: saved for staff at /admin ---------- */
const Contact = { errors: {}, sent: false, sending: false, failed: false };
function renderContact() {
  const host = $('[data-contact]'); if (!host) return;
  if (Contact.sent) { host.innerHTML = `<div class="sent" role="status"><h3 class="h-m">Message received.</h3><p class="muted">The front desk will reply by email. Need us sooner? Call <a class="link" href="${GYM.tel}">${GYM.phone}</a>.</p><button class="btn btn--ghost btn--sm" type="button" data-action="contact-reset">Write another</button></div>`; return; }
  formOpened.contact = formOpened.contact || Date.now();
  const e = Contact.errors; const v = Contact.values || { name: '', email: '', phone: '', topic: 'Classes', msg: '' };
  host.innerHTML = `<form class="form-grid" data-form="contact" novalidate>
      ${field('ct-name', 'Name', v.name, { auto: 'name', error: e.name })}
      ${field('ct-email', 'Email', v.email, { type: 'email', auto: 'email', inputmode: 'email', error: e.email })}
      ${field('ct-phone', 'Phone', v.phone, { type: 'tel', auto: 'tel', inputmode: 'tel', optional: true })}
      <div class="field"><label for="ct-topic">Topic</label><select class="select" id="ct-topic">${['Classes', 'Kids Boxing', 'Private boxing or personal training', 'Memberships', 'Competing', 'Hammer’s Haven', 'Something else'].map((t) => `<option ${t === v.topic ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="field field--full ${e.msg ? 'has-error' : ''}"><label for="ct-msg">Message</label><textarea class="textarea" id="ct-msg" maxlength="4000" ${e.msg ? 'aria-invalid="true"' : ''}>${esc(v.msg)}</textarea>${e.msg ? `<span class="field__error">${esc(e.msg)}</span>` : ''}</div>
      ${honeypot()}
      ${Contact.failed ? `<div class="field--full">${sendFailed()}</div>` : ''}
      <div class="field--full btn-row"><button class="btn btn--primary" type="submit" ${Contact.sending ? 'disabled' : ''}>${Contact.sending ? 'Sending…' : 'Send message'}</button><span class="small muted">We reply by email, usually within a day.</span></div>
    </form>`;
}
Object.assign(actions, {
  'contact-send': async () => {
    if (Contact.sending) return;
    const v = { name: $('#ct-name').value, email: $('#ct-email').value, phone: $('#ct-phone').value, topic: $('#ct-topic').value, msg: $('#ct-msg').value }; const e = {};
    if (!v.name.trim()) e.name = 'Enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email.trim())) e.email = 'Enter an email address like name@example.com.';
    if (v.msg.trim().length < 5) e.msg = 'Write a short message so the desk knows how to help.';
    Contact.values = v; Contact.errors = e;
    if (Object.keys(e).length) { renderContact(); const bad = $('[data-contact] .has-error input, [data-contact] .has-error textarea'); if (bad) bad.focus(); return; }
    const trap = trapValue('[data-contact]');
    Contact.sending = true; Contact.failed = false; renderContact();
    const ok = await sendRequest('contact', { name: v.name, email: v.email, phone: v.phone, message: v.msg }, { topic: v.topic }, trap);
    Contact.sending = false;
    if (ok) { Contact.sent = true; Contact.values = null; } else Contact.failed = true;
    renderContact();
  },
  'contact-reset': () => { Contact.sent = false; Contact.failed = false; Contact.errors = {}; renderContact(); },
});

/* ---------- router: one page, nine views, plain #tokens so links can be shared ---------- */
const ROUTES = ['home', 'schedule', 'programs', 'pricing', 'coaches', 'train', 'shop', 'haven', 'visit', 'privacy'];
const TITLES = {
  home: 'Hammer Boxing & Fitness | Boxing Gym in Old Town, Chicago',
  schedule: 'Class Schedule | Hammer Boxing & Fitness, Chicago',
  programs: 'Boxing Classes, Private Boxing and Muay Thai | Hammer Boxing & Fitness',
  pricing: 'Prices and Memberships | Hammer Boxing & Fitness, Chicago',
  coaches: 'Coaches | Hammer Boxing & Fitness, Chicago',
  train: 'Free Boxing Round Timer | Hammer Boxing & Fitness',
  shop: 'Gear and Merch | Hammer Boxing & Fitness',
  haven: "Hammer's Haven Youth Boxing | Hammer Boxing & Fitness",
  visit: 'Hours, Directions and FAQ | Hammer Boxing & Fitness, Chicago',
  privacy: 'Privacy Policy | Hammer Boxing & Fitness',
};
function jumpTo(id, smooth) {
  const el = id && document.getElementById(id); if (!el) return false;
  if (el.tagName === 'DETAILS') el.open = true;
  const top = el.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--head-h'), 10) || 68) - 12;
  window.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduceMotion() ? 'smooth' : 'auto' });
  return true;
}
function go(route, scrollId, fromHistory) {
  if (ROUTES.indexOf(route) < 0) route = 'home';
  const changed = state.route !== route; state.route = route;
  $$('.view').forEach((v) => { v.hidden = v.dataset.view !== route; });
  $$('.nav [data-route], .menu__links [data-route]').forEach((a) => { if (a.dataset.route === route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (!$('#menu').hidden) actions['menu-close'](true);
  if (!fromHistory) { try { if (location.hash.slice(1) !== route) history.pushState(null, '', '#' + route); } catch (e) { try { location.hash = route; } catch (e2) { /* hash unavailable */ } } }
  document.title = TITLES[route] || TITLES.home;
  if (route === 'schedule') renderSchedule();
  if (scrollId && jumpTo(scrollId, !changed)) return;
  if (changed || !scrollId) window.scrollTo({ top: 0, behavior: 'auto' });
}
function routeFromHash() { const h = (location.hash || '').replace('#', ''); return ROUTES.indexOf(h) >= 0 ? h : 'home'; }
window.addEventListener('popstate', () => go(routeFromHash(), null, true));
window.addEventListener('hashchange', () => { if (routeFromHash() !== state.route) go(routeFromHash(), null, true); });

Object.assign(actions, {
  'menu-open': () => { const m = $('#menu'); m.hidden = false; document.documentElement.classList.add('is-locked'); const c = $('[data-action="menu-close"]', m); if (c) c.focus(); },
  'menu-close': (silent) => { const m = $('#menu'); if (m.hidden) return; m.hidden = true; if (!Overlay.current) document.documentElement.classList.remove('is-locked'); if (silent !== true) { const b = $('.head__menu'); if (b) b.focus(); } },
});

/* ---------- one listener for every click ---------- */
document.addEventListener('click', (e) => {
  const sc = e.target.closest('[data-scrollto]'); if (sc) { e.preventDefault(); jumpTo(sc.dataset.scrollto, true); return; }
  const r = e.target.closest('[data-route]');
  if (r) { e.preventDefault(); if (Overlay.current) Overlay.close(true); go(r.dataset.route, r.dataset.scroll); return; }
  const a = e.target.closest('[data-action]'); if (!a) return;
  const fn = actions[a.dataset.action]; if (!fn) return;
  if (a.tagName === 'A' || a.tagName === 'BUTTON') e.preventDefault();
  fn(a, e);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (Overlay.current) Overlay.close(); else if (!$('#menu').hidden) actions['menu-close'](); }
  Overlay.trap(e);
});
on('overlay-close', (name) => { if (name === 'book' || name === 'quiz') renderAllSchedule(); });
on('week', () => { renderProgramsPage(); });

/* ---------- boot ---------- */
/* search engines read the gym's details from this block, built from the same data as the page */
function addStructuredData() {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hhmm = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
  const hours = GYM.hours.map((h, i) => h ? { '@type': 'OpeningHoursSpecification', dayOfWeek: dayNames[i], opens: hhmm(h[0]), closes: hhmm(h[1]) } : null).filter(Boolean);
  const data = {
    '@context': 'https://schema.org', '@type': 'ExerciseGym', name: GYM.name, alternateName: GYM.legal, url: GYM.site + '/',
    telephone: '+1-312-573-1950', email: GYM.email, image: GYM.site + '/img/og.jpg', logo: GYM.site + '/img/logo-full-black.webp',
    address: { '@type': 'PostalAddress', streetAddress: '525 W. North Ave.', addressLocality: 'Chicago', addressRegion: 'IL', postalCode: '60610', addressCountry: 'US' },
    openingHoursSpecification: hours, sameAs: [GYM.instagram, GYM.facebook],
  };
  const el = document.createElement('script'); el.type = 'application/ld+json'; el.textContent = JSON.stringify(data);
  document.head.appendChild(el);
}
function start() {
  const saved = {};
  buildTimers(); paintTimer();
  renderProgs(); renderWalls(); renderCoachesPage(); renderVisit(); renderFaq(); renderContact();
  renderAllSchedule();
  renderCalc(); renderPricing(); renderShop();
  $$('[data-year]').forEach((el) => { el.textContent = String(gymNow().y); });
  addStructuredData();
  go(saved.route || routeFromHash(), null, true);
  setInterval(tick, 1000);
}
start();
