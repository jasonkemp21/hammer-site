// Read the gym's public Mindbody class schedule and save it as docs/schedule.json.
// Runs daily on GitHub (see .github/workflows/schedule.yml). Usage: node scripts/fetch-schedule.mjs [out.json]
// It reads two calendar weeks starting today, so the site always has at least the next 7 days.
// If the page cannot be read or parses to nothing, the existing file is left alone and the script exits 1.
import fs from 'node:fs';
import { createRequire } from 'node:module';
let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch (e) { ({ chromium } = createRequire('/opt/npm-tools/node_modules/')('playwright')); }

const STUDIO = 744102; const TZ = 'America/Chicago';
const out = process.argv[2] || 'docs/schedule.json';
const chicagoToday = () => { const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date()).forEach((x) => { p[x.type] = x.value; }); return new Date(Date.UTC(+p.year, +p.month - 1, +p.day)); };
const mdy = (d) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}/${d.getUTCFullYear()}`;
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function parseRows(rows) {
  const classes = []; let date = null;
  for (const r of rows) {
    if (r.header) {
      const m = /([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(r.header); if (!m) continue;
      const mo = MONTHS.indexOf(m[1].toLowerCase()); if (mo < 0) continue;
      date = `${m[3]}-${String(mo + 1).padStart(2, '0')}-${String(+m[2]).padStart(2, '0')}`; continue;
    }
    if (!date || !r.time || !r.name) continue;
    const t = /(\d{1,2}):(\d{2})\s*(am|pm)/i.exec(r.time); if (!t) continue;
    let h = +t[1] % 12; if (/pm/i.test(t[3])) h += 12;
    const start = `${String(h).padStart(2, '0')}:${t[2]}`;
    let mins = 0; const hm = /(\d+)\s*hour/.exec(r.duration || ''); const mm = /(\d+)\s*min/.exec(r.duration || '');
    if (hm) mins += +hm[1] * 60; if (mm) mins += +mm[1]; if (!mins) mins = 60;
    const coach = (r.coach || '').replace(/\(\d+\)/g, '').replace(/\s+/g, ' ').trim();
    classes.push({ date, start, mins, name: r.name.trim(), coach: coach || null, regular: r.regular || null, cancelled: /cancel/i.test(r.flags || '') });
  }
  return classes;
}

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined;
const browser = await chromium.launch({ proxy, args: ['--disable-blink-features=AutomationControlled'] });
const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, locale: 'en-US', timezoneId: TZ,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36' });
const page = await ctx.newPage();
let all = []; const today = chicagoToday(); let failed = null;
for (const offset of [0, 7]) {
  const d = new Date(today.getTime() + offset * 86400000);
  const url = `https://clients.mindbodyonline.com/classic/ws?studioid=${STUDIO}&stype=-7&sView=week&sDate=${encodeURIComponent(mdy(d))}`;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    let rows = null;
    for (let i = 0; i < 12 && !rows; i++) {
      await page.waitForTimeout(2500);
      rows = await page.evaluate(() => {
        const mt = document.querySelector('#classSchedule-mainTable'); if (!mt || !mt.children.length) return null;
        const outRows = [];
        for (const el of mt.children) {
          if (el.classList.contains('header')) { outRows.push({ header: el.innerText.replace(/\s+/g, ' ').trim() }); continue; }
          if (!el.classList.contains('row')) continue;
          const cols = [...el.querySelectorAll('.col-2 > .col')]; const first = el.querySelector('.col-first');
          const coachCol = cols[1]; const reg = coachCol && coachCol.querySelector('a[title]');
          outRows.push({ time: first ? first.innerText.replace(/\s+/g, ' ').trim() : '', name: cols[0] ? cols[0].innerText.replace(/\s+/g, ' ').trim() : '',
            coach: coachCol ? coachCol.innerText.replace(/\s+/g, ' ').trim() : '', duration: cols[2] ? cols[2].innerText.trim() : '',
            regular: reg ? (reg.getAttribute('title') || '').replace(/^Regularly Scheduled/i, '').trim() : null, flags: el.innerText });
        }
        return outRows;
      });
    }
    if (!rows) { failed = 'schedule table did not load for ' + mdy(d); break; }
    all = all.concat(parseRows(rows));
    console.log(`week of ${mdy(d)}: ${rows.length} rows`);
  } catch (e) { failed = `${mdy(d)}: ${String(e).slice(0, 160)}`; break; }
}
await browser.close();

if (failed || !all.length) { console.error('schedule not updated:', failed || 'no classes parsed'); process.exit(1); }
const seen = new Set(); const classes = all.filter((c) => { const k = `${c.date}|${c.start}|${c.name}|${c.coach}`; if (seen.has(k)) return false; seen.add(k); return true; })
  .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
const result = { source: 'mindbody', studio: STUDIO, fetched: new Date().toISOString(), from: classes[0].date, to: classes[classes.length - 1].date, classes };
const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
const next = JSON.stringify(result, null, 1) + '\n';
// unchanged classes: keep the old file so the daily run does not make an empty commit
if (prev && JSON.stringify(JSON.parse(prev).classes) === JSON.stringify(classes)) { console.log(`no change: ${classes.length} classes, ${result.from} to ${result.to}`); process.exit(0); }
fs.writeFileSync(out, next);
console.log(`saved ${classes.length} classes, ${result.from} to ${result.to}`);
