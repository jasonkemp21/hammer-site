/* ---------- tiny helpers ---------- */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (id, cls) => `<svg class="i ${cls || ''}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const star = () => '<svg class="star" aria-hidden="true"><use href="#i-star"/></svg>';
const money = (n) => '$' + (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
const pad2 = (n) => String(n).padStart(2, '0');
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* end a sentence without doubling the full stop after "Jr." */
const stop = (t) => (/\.$/.test(t) ? t : t + '.');

/* per-visitor conveniences only (timer settings); the page works without it */
const store = {
  get(key, fallback) { try { const v = localStorage.getItem('hbf:' + key); return v == null ? fallback : JSON.parse(v); } catch (e) { return fallback; } },
  set(key, value) { try { localStorage.setItem('hbf:' + key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ } },
};

/* ---------- time: everything runs on the gym's clock, wherever the visitor is ---------- */
const clockParts = new Intl.DateTimeFormat('en-US', { timeZone: GYM.tz, weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' });
function gymNow() {
  const p = {};
  clockParts.formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; });
  const hour = Number(p.hour) % 24;
  return { y: +p.year, m: +p.month, d: +p.day, day: DAYS3.indexOf(p.weekday), mins: hour * 60 + (+p.minute), secs: +p.second };
}
/* calendar date n days after the gym's today, as a UTC-noon Date used only for labels and ids */
function dateAfter(now, n) { return new Date(Date.UTC(now.y, now.m - 1, now.d + n, 12)); }
const fmtMonthDay = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' });
const fmtLong = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
const ymd = (d) => `${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}`;
function clock(mins) { const h = Math.floor(mins / 60), m = mins % 60; const h12 = ((h + 11) % 12) + 1; return { h: h12, m, ap: h < 12 ? 'AM' : 'PM', text: `${h12}:${pad2(m)} ${h < 12 ? 'AM' : 'PM'}`, short: m ? `${h12}:${pad2(m)} ${h < 12 ? 'AM' : 'PM'}` : `${h12} ${h < 12 ? 'AM' : 'PM'}` }; }
function duration(totalSecs) {
  const s = Math.max(0, Math.floor(totalSecs));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return { d, h, m, s: sec, hms: `${pad2(d * 24 + h)}:${pad2(m)}:${pad2(sec)}`, words: d ? `${d}d ${h}h` : h ? `${h}h ${pad2(m)}m` : m ? `${m} min` : `${sec} sec` };
}

/* ---------- the week ahead: 7 days of class occurrences starting today ---------- */
function buildWeek() {
  const now = gymNow();
  const days = [];
  for (let n = 0; n < 7; n++) {
    const date = dateAfter(now, n);
    const day = (now.day + n) % 7;
    const classes = WEEK.filter((c) => c.day === day).map((c) => {
      const type = CLASS_TYPES[c.type];
      const startsIn = (n * 1440 + c.t - now.mins) * 60 - now.secs;
      return { key: `${ymd(date)}-${c.t}-${c.type}`, n, day, date, t: c.t, type, coach: c.coach ? COACHES[c.coach] : null, startsIn, past: startsIn <= -type.mins * 60 ? true : startsIn <= 0 ? 'live' : false };
    }).sort((a, b) => a.t - b.t || (a.type.id === 'boxing' ? -1 : 1));
    days.push({ n, day, date, classes, hours: GYM.hours[day] });
  }
  return { now, days };
}
function allUpcoming(week) { return week.days.flatMap((d) => d.classes).filter((c) => c.startsIn > 0); }
function nextClass(week, filter) { return allUpcoming(week).filter((c) => c.type.bookable && (!filter || filter(c)))[0] || null; }
function findClass(key) { const w = buildWeek(); return w.days.flatMap((d) => d.classes).find((c) => c.key === key) || null; }

/* open or closed right now, and when that changes */
function openStatus(now) {
  now = now || gymNow();
  const today = GYM.hours[now.day];
  if (today && now.mins >= today[0] && now.mins < today[1]) return { open: true, label: 'Open now', detail: `Closes ${clock(today[1]).short}`, until: today[1] };
  if (today && now.mins < today[0]) return { open: false, label: 'Closed', detail: `Opens ${clock(today[0]).short}` };
  for (let n = 1; n <= 7; n++) {
    const d = (now.day + n) % 7, h = GYM.hours[d];
    if (h) return { open: false, label: 'Closed', detail: `Opens ${n === 1 ? 'tomorrow' : DAYS[d]} ${clock(h[0]).short}` };
  }
  return { open: false, label: 'Closed', detail: '' };
}

/* ---------- app state ---------- */
const state = {
  route: 'home',
  homeDay: 0,            // offset from today for the home card
  sched: { type: 'all', coach: 'all', day: 0 },
  freq: 2,               // classes per week in the calculator
  firstTime: false,
  bookings: {},          // unused on the live site: booking happens on Mindbody
};
const listeners = {};
function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
function emit(evt, data) { (listeners[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); }

/* ---------- toasts ---------- */
function toast(msg) {
  const host = $('#toasts'); if (!host) return;
  const el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); el.textContent = msg;
  host.appendChild(el);
  while (host.children.length > 3) host.firstElementChild.remove();
  setTimeout(() => { el.remove(); }, 3600);
}

/* ---------- clipboard, with a select-the-text fallback ---------- */
function copyText(text, btn) {
  const ok = () => { toast('Copied: ' + text); if (btn) { const old = btn.innerHTML; btn.innerHTML = icon('check') + ' Copied'; setTimeout(() => { btn.innerHTML = old; }, 1600); } };
  const fallback = () => {
    const target = btn && btn.closest('.copyrow') && btn.closest('.copyrow').querySelector('[data-copy-src]');
    if (target) { const r = document.createRange(); r.selectNodeContents(target); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); toast('Selected. Press copy on your keyboard.'); }
  };
  try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (e) { fallback(); }
}

/* ---------- overlays: one at a time, focus kept inside, Esc closes ---------- */
const Overlay = {
  current: null, lastFocus: null,
  open(name) {
    if (this.current) this.close(true);
    const el = $(`[data-ov="${name}"]`); if (!el) return;
    this.lastFocus = this.lastFocus || document.activeElement;
    this.current = el;
    $('#scrim').hidden = false; el.hidden = false;
    document.documentElement.classList.add('is-locked');
    const first = el.querySelector('[data-autofocus]') || el.querySelector('button, [href], input, select, textarea');
    if (first) setTimeout(() => { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, 30);
    emit('overlay', name);
  },
  close(keepFocus) {
    if (!this.current) return;
    const name = this.current.dataset.ov;
    this.current.hidden = true; this.current = null;
    $('#scrim').hidden = true;
    document.documentElement.classList.remove('is-locked');
    if (!keepFocus && this.lastFocus && this.lastFocus.focus) { try { this.lastFocus.focus({ preventScroll: true }); } catch (e) { /* element gone */ } }
    if (!keepFocus) this.lastFocus = null;
    emit('overlay-close', name);
  },
  trap(e) {
    if (!this.current || e.key !== 'Tab') return;
    const f = $$('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])', this.current).filter((n) => n.offsetParent !== null);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  },
};

/* ---------- actions: every clickable thing declares data-action="name" ---------- */
const actions = {
  'overlay-close': () => Overlay.close(),
  'copy': (el) => copyText(el.dataset.copy, el),
};
