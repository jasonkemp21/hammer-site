// Read the gym's Mindbody schedule widget and save it as docs/schedule.json.
// Runs every morning on GitHub (.github/workflows/schedule.yml). Usage: node scripts/fetch-schedule.mjs [out.json]
//
// Source: the same Mindbody "Branded Web" schedule widget the gym embeds on its site. Its page carries the
// current calendar week (Monday to Sunday) of classes as data, and only the class types the gym chose for
// the widget. To change which classes appear, the gym edits the widget in Mindbody (Branded Web manager),
// or makes a new widget and puts its id below.
// If the page cannot be read or has no classes, the existing file is left alone and the script exits 1.
import fs from 'node:fs';

const WIDGET_ID = 'b667859216f';
const TZ = 'America/Chicago';
const out = process.argv[2] || 'docs/schedule.json';
const url = `https://go.mindbodyonline.com/book/widgets/schedules/view/${WIDGET_ID}/schedule`;

const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', Accept: 'text/html' } });
if (!res.ok) { console.error('schedule not updated: widget page answered', res.status); process.exit(1); }
const html = await res.text();

// The page embeds its data as React Server Component rows: self.__next_f.push([1,"<row id>:<json>\n..."])
const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g)].map((m) => JSON.parse('"' + m[1] + '"'));
const payload = chunks.join('');
const rows = {};
for (const line of payload.split('\n')) { const m = /^([0-9a-f]+):(.*)$/.exec(line); if (m) rows[m[1]] = m[2]; }
const deref = (v) => { // "$2d" points at row 2d
  if (typeof v === 'string' && /^\$[0-9a-f]+$/.test(v)) { try { return JSON.parse(rows[v.slice(1)]); } catch (e) { return null; } }
  return v;
};
const i = payload.indexOf('"initialClasses":');
if (i < 0) { console.error('schedule not updated: no class data in the widget page'); process.exit(1); }
let depth = 0, k = i + '"initialClasses":'.length, start = k;
for (; k < payload.length; k++) { const ch = payload[k]; if (ch === '{') depth++; else if (ch === '}') { depth--; if (!depth) { k++; break; } } }
const data = JSON.parse(payload.slice(start, k));

const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const local = (iso) => { const p = {}; parts.formatToParts(new Date(iso)).forEach((x) => { p[x.type] = x.value; }); return { date: `${p.year}-${p.month}-${p.day}`, start: `${p.hour === '24' ? '00' : p.hour}:${p.minute}` }; };
const classes = (data.classes || []).map((c) => {
  const when = local(c.startDateTime);
  const staff = (c.staff || []).map(deref).filter(Boolean).map((s) => s.displayLabel).filter(Boolean);
  const cap = typeof c.capacity === 'number' ? c.capacity : null; const reg = typeof c.numberRegistered === 'number' ? c.numberRegistered : null;
  return { date: when.date, start: when.start, mins: c.duration || 60, name: (c.name || 'Class').trim(), coach: staff[0] || null, regular: null,
    cancelled: !!c.cancelled, spots: cap != null && reg != null ? Math.max(0, cap - reg) : null, bookable: c.bookable !== false };
}).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
if (!classes.length) { console.error('schedule not updated: the widget lists no classes'); process.exit(1); }

const day = (iso) => local(iso).date;
const result = { source: 'mindbody-widget', widget: WIDGET_ID, fetched: new Date().toISOString(), from: data.fromDate ? day(data.fromDate) : classes[0].date, to: data.toDate ? day(data.toDate) : classes[classes.length - 1].date,
  types: [...new Set(classes.map((c) => c.name))], classes };
const prev = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
const same = (() => { try { const p = JSON.parse(prev); return JSON.stringify(p.classes) === JSON.stringify(classes) && p.from === result.from && p.to === result.to; } catch (e) { return false; } })();
if (same) { console.log(`no change: ${classes.length} classes, ${result.from} to ${result.to}`); process.exit(0); }
fs.writeFileSync(out, JSON.stringify(result, null, 1) + '\n');
console.log(`saved ${classes.length} classes, ${result.from} to ${result.to}: ${result.types.join(', ')}`);
