// Build the live site into docs/, the folder GitHub Pages publishes. Run: node build.mjs
//   docs/index.html        the whole site, one page
//   docs/admin/index.html  the staff page for website requests
//   docs/config.js         Supabase settings, edited after deploy without a rebuild
//   plus 404 forwarding, robots.txt, sitemap.xml, icons and only the images the site uses
import fs from 'node:fs';
import path from 'node:path';

const root = path.dirname(new URL(import.meta.url).pathname);
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const list = (dir, ext) => fs.readdirSync(path.join(root, dir)).filter((f) => f.endsWith(ext)).sort().map((f) => path.join(dir, f));

const head = read('src/head.html').trim();
const css = list('src/css', '.css').map((f) => read(f).trim()).join('\n\n');
const html = list('src/html', '.html').map((f) => read(f).trim()).join('\n\n');
const js = list('src/js', '.js').map((f) => `// ---- ${path.basename(f)} ----\n${read(f).trim()}`).join('\n\n');
const reset = ':root{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}';

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
${head}
<style>${reset}</style>
<style>
${css}
</style>
</head>
<body>
${html}
<script src="config.js"></script>
<script>
(function () {
'use strict';
${js}
})();
</script>
</body>
</html>
`;

const dist = path.join(root, 'docs');
// keep Supabase settings already pasted into docs/config.js across rebuilds
const liveConfig = path.join(dist, 'config.js');
const keptConfig = fs.existsSync(liveConfig) && /supabaseUrl:\s*'https?:/.test(fs.readFileSync(liveConfig, 'utf8')) ? fs.readFileSync(liveConfig, 'utf8') : null;
// keep the custom domain GitHub writes to docs/CNAME when it is set in Settings > Pages
const cnameFile = path.join(dist, 'CNAME');
const keptCname = fs.existsSync(cnameFile) ? fs.readFileSync(cnameFile, 'utf8') : null;
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'img'), { recursive: true });
fs.mkdirSync(path.join(dist, 'admin'), { recursive: true });
fs.writeFileSync(path.join(dist, 'index.html'), page);
fs.copyFileSync(path.join(root, 'src/admin.html'), path.join(dist, 'admin/index.html'));
for (const f of fs.readdirSync(path.join(root, 'static'))) fs.copyFileSync(path.join(root, 'static', f), path.join(dist, f));
if (keptConfig) fs.writeFileSync(liveConfig, keptConfig);
if (keptCname) fs.writeFileSync(cnameFile, keptCname);
for (const f of ['favicon.png', 'apple-touch-icon.png']) fs.copyFileSync(path.join(root, 'assets', f), path.join(dist, f));
fs.copyFileSync(path.join(root, 'assets/og.jpg'), path.join(dist, 'img/og.jpg'));
// only images the page actually names
const used = new Set();
for (const m of (html + js + css).matchAll(/img\/([a-z0-9-]+\.webp)/g)) used.add(m[1]);
for (const f of used) {
  const src = path.join(root, 'images', f);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dist, 'img', f)); else console.warn('missing image', f);
}
const kb = (n) => (n / 1024).toFixed(1) + ' KB';
const imgBytes = fs.readdirSync(path.join(dist, 'img')).reduce((n, f) => n + fs.statSync(path.join(dist, 'img', f)).size, 0);
console.log(`docs/index.html ${kb(Buffer.byteLength(page))} · ${used.size + 1} images ${kb(imgBytes)}`);
