/* ---------- the live site's two outside services ----------
   Mindbody: booking, accounts and payments. Every Book and Buy button opens the gym's Mindbody pages.
   Supabase: messages and session requests from the forms, read by staff at /admin.
   Keys come from config.js (window.HBF_CONFIG), so they can change without a rebuild. */

/* the Mindbody week view, opened on the date of the class when there is one */
function mindbodySchedule(date) {
  const d = date || dateAfter(gymNow(), 0);
  const mdy = `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
  return `${GYM.mindbody}&date=${encodeURIComponent(mdy)}`;
}
/* open in a new tab; if the browser blocks it, go there in this one */
function openOut(url) {
  let w = null;
  try { w = window.open(url, '_blank'); } catch (e) { w = null; }
  if (w) { try { w.opener = null; } catch (e) { /* cross-origin */ } } else { location.href = url; }
}

Object.assign(actions, {
  /* Book: the class's day on Mindbody, or this week when no class was picked */
  'book': (el) => {
    const key = el && el.dataset.class; const type = el && el.dataset.type;
    let c = key ? findClass(key) : null;
    if (!c && type) c = nextClass(buildWeek(), (x) => x.type.id === type);
    if ($('#menu') && !$('#menu').hidden) actions['menu-close'](true);
    openOut(mindbodySchedule(c ? c.date : null));
  },
  /* Buy a pass, membership or package: the gym's Mindbody online store */
  'buy': () => {
    if ($('#menu') && !$('#menu').hidden) actions['menu-close'](true);
    if (Overlay.current) Overlay.close(true);
    openOut(GYM.store);
  },
});

/* ---------- requests: save to Supabase, or say plainly that it did not go ---------- */
const LIVE = (() => { const c = window.HBF_CONFIG || {}; return { url: (c.supabaseUrl || '').replace(/\/+$/, ''), key: c.supabaseAnonKey || '' }; })();
const formOpened = {}; // when each form was first drawn, for the spam check

/* resolves true only when the database confirms it stored the request */
async function sendRequest(kind, fields, details, trap) {
  if (trap) return true; // a bot filled the hidden field: drop it quietly
  if (formOpened[kind] && Date.now() - formOpened[kind] < 2500) return true; // filled faster than a person can
  if (!LIVE.url || !LIVE.key) { console.warn('Requests are not configured: set supabaseUrl and supabaseAnonKey in config.js'); return false; }
  const row = {
    kind,
    name: (fields.name || '').trim().slice(0, 200),
    email: (fields.email || '').trim().slice(0, 320),
    phone: (fields.phone || '').trim().slice(0, 40) || null,
    message: (fields.message || '').trim().slice(0, 4000) || null,
    details: details || {},
  };
  try {
    const res = await fetch(`${LIVE.url}/rest/v1/requests`, {
      method: 'POST',
      // legacy anon keys are JWTs and go in both headers; newer publishable keys go in apikey only
      headers: Object.assign({ apikey: LIVE.key, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, /^eyJ/.test(LIVE.key) ? { Authorization: `Bearer ${LIVE.key}` } : {}),
      body: JSON.stringify(row),
    });
    return res.ok;
  } catch (e) { return false; }
}
/* read the trap before the form redraws, or the redraw empties it */
const trapValue = (scope) => { const el = $(scope + ' [data-hp]'); return el ? el.value : ''; };
const honeypot = () => '<div class="hp" aria-hidden="true"><label>Leave this empty<input type="text" tabindex="-1" autocomplete="off" data-hp></label></div>';
const sendFailed = () => `<p class="form-fail" role="alert">${icon('info')}<span>Your message did not go through. Please call <a class="link" href="${GYM.tel}">${GYM.phone}</a> or email <a class="link" href="mailto:${GYM.email}">${GYM.email}</a>.</span></p>`;
