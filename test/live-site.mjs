// End-to-end checks for the live build in docs/, with stand-ins for Supabase and Mindbody.
// Usage: node test/live-site.mjs <outDir>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch (e) { ({ chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright')); }
const out = process.argv[2] || 'test/out'; fs.mkdirSync(out, { recursive: true });
const dist = path.resolve('docs');
const ORIGIN = 'https://hammer.test'; const SB = 'https://sb.test';
const types = { '.html': 'text/html', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.js': 'text/javascript', '.txt': 'text/plain', '.xml': 'application/xml' };
const problems = []; const fail = (m) => { problems.push(m); console.log('FAIL ' + m); }; const pass = (m) => console.log('PASS ' + m);
const check = (ok, m, extra) => ok ? pass(m) : fail(m + (extra ? '  ' + extra : ''));

// ---- stand-in Supabase ----
const db = { rows: [], inserts: [], patches: [], mode: 'ok' };
const STAFF = { email: 'staff@hammer.test', password: 'right-pass' };
async function supabase(route) {
  const req = route.request(); const u = new URL(req.url()); const m = req.method();
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' };
  if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  if (u.pathname === '/rest/v1/requests' && m === 'POST') {
    if (req.headers().apikey !== 'anon-test') return route.fulfill({ status: 401, headers: cors, body: '{}' });
    if (db.mode === 'down') return route.fulfill({ status: 500, headers: cors, body: '{}' });
    const row = JSON.parse(req.postData()); db.inserts.push(row);
    db.rows.unshift(Object.assign({ id: 'id-' + db.rows.length, created_at: new Date().toISOString(), status: 'new', handled_at: null }, row));
    return route.fulfill({ status: 201, headers: cors, contentType: 'application/json', body: '{}' });
  }
  if (u.pathname === '/auth/v1/token') {
    const body = JSON.parse(req.postData() || '{}');
    if (u.searchParams.get('grant_type') === 'password' && body.email === STAFF.email && body.password === STAFF.password)
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ access_token: 'tok', refresh_token: 'ref', expires_in: 3600, user: { email: STAFF.email } }) });
    return route.fulfill({ status: 400, headers: cors, contentType: 'application/json', body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }) });
  }
  if (u.pathname === '/auth/v1/logout') return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: '{}' });
  if (u.pathname === '/rest/v1/requests' && m === 'GET') {
    if (req.headers().authorization !== 'Bearer tok') return route.fulfill({ status: 401, headers: cors, body: '{}' });
    return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify(db.rows) });
  }
  if (u.pathname === '/rest/v1/requests' && m === 'PATCH') {
    const id = u.searchParams.get('id').replace('eq.', ''); const patch = JSON.parse(req.postData()); db.patches.push({ id, patch });
    const r = db.rows.find((x) => x.id === id); Object.assign(r, patch);
    return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify([r]) });
  }
  return route.fulfill({ status: 404, headers: cors, body: '{}' });
}
let configMode = 'set';
async function site(route) {
  const u = new URL(route.request().url());
  let p = decodeURIComponent(u.pathname); if (p.endsWith('/')) p += 'index.html';
  if (p === '/config.js') {
    // never the real docs/config.js: tests must not reach the live database
    const body = configMode === 'set' ? `window.HBF_CONFIG = { supabaseUrl: '${SB}/', supabaseAnonKey: 'anon-test' };` : `window.HBF_CONFIG = { supabaseUrl: '', supabaseAnonKey: '' };`;
    return route.fulfill({ status: 200, contentType: 'text/javascript', body });
  }
  const file = path.join(dist, p);
  if (file.startsWith(dist) && fs.existsSync(file) && fs.statSync(file).isFile()) return route.fulfill({ status: 200, contentType: types[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  return route.fulfill({ status: 404, contentType: 'text/html', body: fs.readFileSync(path.join(dist, '404.html')) });
}
const opened = [];
async function setup(ctx) {
  await ctx.route(ORIGIN + '/**', site);
  await ctx.route(SB + '/**', supabase);
  await ctx.route('https://*.supabase.co/**', (r) => { errors.push('test reached a real Supabase project: ' + r.request().url()); return r.abort(); });
  await ctx.route('https://clients.mindbodyonline.com/**', (r) => { opened.push(r.request().url()); return r.fulfill({ status: 200, contentType: 'text/html', body: '<p>Mindbody stand-in</p>' }); });
}

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const browser = await chromium.launch({ proxy });
const errors = [];
const watch = (page, tag) => {
  page.on('pageerror', (e) => errors.push(`${tag} pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push(`${tag} console: ${m.text()}`); });
  page.on('requestfailed', (r) => { if (!/fonts\.g/.test(r.url())) errors.push(`${tag} failed: ${r.method()} ${r.url()} ${(r.failure() || {}).errorText}`); });
};

// ================= public site =================
for (const [vw, vh, tag] of [[1440, 900, 'desk'], [390, 844, 'phone']]) {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh } }); await setup(ctx);
  await ctx.addInitScript(() => { const t = new Date('2026-10-26T15:00:00-05:00').getTime(); const D = Date; const off = t - D.now(); class FD extends D { constructor(...a) { super(...(a.length ? a : [D.now() + off])); } static now() { return D.now() + off; } } window.Date = FD; });
  const page = await ctx.newPage(); watch(page, tag);
  await page.goto(ORIGIN + '/', { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(400);
  const body = (await page.evaluate(() => document.body.innerText)).toLowerCase();
  check(!/concept|pitch notes|demo|simulat|add to cart|your cart/.test(body), `${tag}: no concept, demo or cart wording on the page`, (body.match(/.{20}(concept|pitch notes|demo|simulat|add to cart|your cart).{20}/) || [''])[0]);
  check(await page.title() === 'Hammer Boxing & Fitness | Boxing Gym in Old Town, Chicago', `${tag}: home title`);
  const ld = await page.evaluate(() => { const s = document.querySelector('script[type="application/ld+json"]'); try { return JSON.parse(s.textContent); } catch (e) { return null; } });
  check(ld && ld['@type'] === 'ExerciseGym' && ld.openingHoursSpecification.length === 6, `${tag}: structured data with 6 open days`);
  check(await page.locator('meta[name=robots]').count() === 0, `${tag}: page is indexable (no noindex)`);
  for (const r of ['schedule', 'programs', 'pricing', 'coaches', 'train', 'shop', 'haven', 'visit', 'privacy', 'home']) {
    await page.evaluate((x) => { location.hash = x; }, r); await page.waitForTimeout(250);
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (over > 1) fail(`${tag}: ${r} overflows by ${over}px`);
    const vis = await page.locator(`[data-view="${r}"]:not([hidden])`).count(); if (!vis) fail(`${tag}: ${r} view did not show`);
  }
  pass(`${tag}: all 10 views render without sideways scroll`);
  await page.screenshot({ path: `${out}/${tag}-home.png` });

  // Book a class -> Mindbody on that class's date
  await page.evaluate(() => { location.hash = 'schedule'; }); await page.waitForTimeout(300);
  const bookSel = tag === 'desk' ? '.week button.slot[data-action="book"]' : '.weeklist .bout button[data-action="book"]';
  const [pop] = await Promise.all([ctx.waitForEvent('page'), page.locator(bookSel).first().click()]);
  await pop.waitForLoadState().catch(() => {});
  check(/clients\.mindbodyonline\.com\/classic\/ws\?studioid=744102&stype=-7&sView=week&sDate=10\/2[67]\/2026$/.test(pop.url()), `${tag}: Book opens the Mindbody schedule on the class date`, pop.url());
  await pop.close();
  await page.screenshot({ path: `${out}/${tag}-schedule.png` });
  // Buy on pricing -> Mindbody store
  await page.evaluate(() => { location.hash = 'pricing'; }); await page.waitForTimeout(300);
  const [pop2] = await Promise.all([ctx.waitForEvent('page'), page.locator('.pass button[data-action="buy"]').nth(1).click()]);
  check(/stype=40/.test(pop2.url()), `${tag}: Buy opens the Mindbody online store`, pop2.url()); await pop2.close();
  await page.screenshot({ path: `${out}/${tag}-pricing.png`, fullPage: false });
  // shop is a catalog
  await page.evaluate(() => { location.hash = 'shop'; }); await page.waitForTimeout(300);
  check(await page.locator('.product').count() === 12 && await page.locator('.product button').count() === 0, `${tag}: shop shows 12 items with no buy buttons`);
  await page.screenshot({ path: `${out}/${tag}-shop.png` });

  if (tag === 'desk') {
    // contact form, success
    await page.evaluate(() => { location.hash = 'visit'; }); await page.waitForTimeout(300);
    await page.fill('#ct-name', 'Pat Lee'); await page.fill('#ct-email', 'pat@example.com'); await page.fill('#ct-phone', '312 555 0101');
    await page.selectOption('#ct-topic', 'Kids Boxing'); await page.fill('#ct-msg', 'Is there room for my 9 year old on Wednesdays?');
    await page.waitForTimeout(2600);
    await page.click('[data-contact] button[type=submit]'); await page.waitForTimeout(500);
    const ins = db.inserts[db.inserts.length - 1];
    check(ins && ins.kind === 'contact' && ins.name === 'Pat Lee' && ins.details.topic === 'Kids Boxing' && ins.phone === '312 555 0101', 'contact form saves the message to the database', JSON.stringify(ins));
    check(await page.locator('[data-contact] .sent').count() === 1, 'contact form says received only after the save');
    await page.locator('[data-contact]').screenshot({ path: `${out}/contact-sent.png` });
    // contact form, database down
    await page.click('[data-action="contact-reset"]'); db.mode = 'down';
    await page.fill('#ct-name', 'Sam'); await page.fill('#ct-email', 'sam@example.com'); await page.fill('#ct-msg', 'Do you have parking?');
    await page.click('[data-contact] button[type=submit]'); await page.waitForTimeout(500);
    check(await page.locator('[data-contact] .form-fail').count() === 1 && await page.locator('[data-contact] .sent').count() === 0, 'a failed save shows the phone and email, not a false confirmation');
    check(await page.inputValue('#ct-msg') === 'Do you have parking?', 'a failed save keeps what the visitor typed');
    await page.locator('[data-contact]').screenshot({ path: `${out}/contact-failed.png` });
    db.mode = 'ok';
    // honeypot: a bot filling the hidden field sends nothing
    const before = db.inserts.length;
    await page.evaluate(() => { document.querySelector('[data-contact] [data-hp]').value = 'spam'; });
    await page.click('[data-contact] button[type=submit]'); await page.waitForTimeout(400);
    check(db.inserts.length === before, 'the spam trap blocks bot submissions');
    // Kids Boxing request from the schedule
    await page.evaluate(() => { location.hash = 'schedule'; }); await page.waitForTimeout(300);
    await page.locator('.week .slot--kids').first().click(); await page.waitForTimeout(300);
    check(/Kids Boxing/i.test(await page.locator('#inq-title').innerText()), 'Kids Boxing opens its own request form');
    await page.fill('#inq-fn', 'Dana'); await page.fill('#inq-ln', 'Ruiz'); await page.fill('#inq-em', 'dana@example.com'); await page.fill('#inq-note', 'Son is 10, never boxed.');
    await page.click('[data-action="inq-send"]'); await page.waitForTimeout(500);
    const k = db.inserts[db.inserts.length - 1];
    check(k && k.kind === 'kids' && k.name === 'Dana Ruiz' && k.message === 'Son is 10, never boxed.', 'Kids Boxing request is saved', JSON.stringify(k));
    check(/Request received/i.test(await page.locator('#inq-title').innerText()), 'Kids request confirms after the save');
    await page.screenshot({ path: `${out}/kids-sent.png` });
    await page.click('[data-ov="inquire"] [data-action="overlay-close"]');
    // private boxing request with coach and pack
    await page.evaluate(() => { location.hash = 'pricing'; }); await page.waitForTimeout(300);
    await page.locator('[data-view="pricing"] [data-action="inquire"][data-kind="boxing"]').first().click(); await page.waitForTimeout(300);
    await page.selectOption('#inq-coach', 'johnny'); await page.click('[data-action="inq-time"][data-id="Evenings"]');
    await page.fill('#inq-fn', 'Chris'); await page.fill('#inq-ln', 'Ng'); await page.fill('#inq-em', 'chris@example.com');
    await page.click('[data-action="inq-send"]'); await page.waitForTimeout(500);
    const pv = db.inserts[db.inserts.length - 1];
    check(pv && pv.kind === 'boxing' && pv.details.coach === 'Johnny Higgins Jr.' && pv.details.best_times === 'Evenings' && /sessions|Single/.test(pv.details.sessions), 'private boxing request carries coach, times and pack', JSON.stringify(pv && pv.details));
    await page.click('[data-ov="inquire"] [data-action="overlay-close"]');
  }
  await ctx.close();
}

// ================= not configured yet: honest failure, no network =================
{
  configMode = 'empty';
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } }); await setup(ctx);
  const page = await ctx.newPage(); const sent = []; page.on('request', (r) => { if (r.url().startsWith(SB)) sent.push(r.url()); });
  page.on('pageerror', (e) => errors.push('unconfigured pageerror: ' + e.message));
  await page.goto(ORIGIN + '/#visit'); await page.waitForTimeout(2700);
  await page.fill('#ct-name', 'Al'); await page.fill('#ct-email', 'al@example.com'); await page.fill('#ct-msg', 'Hello there');
  await page.click('[data-contact] button[type=submit]'); await page.waitForTimeout(300);
  check(sent.length === 0 && await page.locator('[data-contact] .form-fail').count() === 1, 'before Supabase is set up, forms say to call or email and send nothing');
  const ap = await ctx.newPage(); await ap.goto(ORIGIN + '/admin/'); await ap.waitForTimeout(300);
  check(await ap.locator('[data-setup]:not([hidden])').count() === 1, 'admin page explains it is not set up yet');
  await ctx.close(); configMode = 'set';
}

// ================= admin =================
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } }); await setup(ctx);
  const page = await ctx.newPage(); watch(page, 'admin');
  await page.goto(ORIGIN + '/admin/'); await page.waitForTimeout(400);
  check(await page.locator('meta[name=robots][content*=noindex]').count() === 1, 'admin page is hidden from search engines');
  await page.fill('#em', STAFF.email); await page.fill('#pw', 'wrong'); await page.click('[data-login-btn]'); await page.waitForTimeout(300);
  check(/do not match/.test(await page.locator('[data-login-error]').innerText()), 'wrong password is refused with a clear message');
  await page.fill('#pw', STAFF.password); await page.click('[data-login-btn]'); await page.waitForTimeout(600);
  const cards = await page.locator('.req').count();
  check(cards === db.rows.filter((r) => r.status === 'new').length && cards >= 3, `admin lists the new requests (${cards})`);
  check(await page.locator('.req', { hasText: 'Dana Ruiz' }).locator('.pill--kids').count() === 1, 'Kids Boxing requests are labelled');
  await page.screenshot({ path: `${out}/admin-list.png`, fullPage: true });
  await page.locator('.req', { hasText: 'Pat Lee' }).locator('[data-toggle]').click(); await page.waitForTimeout(400);
  check(db.patches.length === 1 && db.patches[0].patch.status === 'handled', 'Mark handled saves to the database');
  check(await page.locator('.req', { hasText: 'Pat Lee' }).count() === 0 && (await page.locator('[data-count="handled"]').innerText()) === '1', 'handled request leaves the New list');
  await page.fill('[data-search]', 'chris'); await page.click('[data-filter="all"]'); await page.waitForTimeout(150);
  check(await page.locator('.req').count() === 1, 'search finds a request by name');
  await page.reload(); await page.waitForTimeout(500);
  check(await page.locator('[data-app]:not([hidden])').count() === 1, 'staying signed in after a reload in the same tab');
  await page.click('[data-signout]'); await page.waitForTimeout(200);
  check(await page.locator('[data-login]:not([hidden])').count() === 1, 'sign out returns to the login');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.fill('#em', STAFF.email); await page.fill('#pw', STAFF.password); await page.click('[data-login-btn]'); await page.waitForTimeout(500);
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(over <= 1, 'admin fits a phone screen');
  await page.screenshot({ path: `${out}/admin-phone.png`, fullPage: true });
  await ctx.close();
}

// ================= old addresses forward =================
{
  const ctx = await browser.newContext(); await setup(ctx); const page = await ctx.newPage();
  for (const [from, to] of [['/boxing-classes', '#schedule'], ['/store/hoodies', '#shop'], ['/privacy-policy', '#privacy'], ['/our-team', '#coaches'], ['/home', '']]) {
    await page.goto(ORIGIN + from); await page.waitForTimeout(400);
    const u = new URL(page.url());
    check(u.pathname === '/' && u.hash === to, `${from} forwards to /${to}`, page.url());
  }
  await page.goto(ORIGIN + '/no-such-page'); await page.waitForTimeout(200);
  check(/not here/.test(await page.locator('body').innerText()), 'unknown address shows the not-found page');
  await ctx.close();
}

await browser.close();
if (errors.length) { console.log('\nERRORS\n' + errors.join('\n')); }
console.log(problems.length || errors.length ? `\n${problems.length} failed checks, ${errors.length} errors` : '\nall live-site checks passed, no console errors');
