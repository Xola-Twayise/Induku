// Builds www/ (the folder Capacitor packs into the Android and iOS apps, and a web build you can host).
// induku.html stays the single source of the game; this script wraps it in a full document,
// swaps Google Fonts for the bundled copies and adds the web-app manifest and offline cache.
import { readFile, writeFile, mkdir, cp, rm } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const www = new URL('www/', root);
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

let game = await readFile(new URL('induku.html', root), 'utf8');
const fontLinks = /<link rel="preconnect"[^>]*>\s*<link rel="preconnect"[^>]*>\s*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/;
if (!fontLinks.test(game)) throw new Error('Google Fonts links not found in induku.html');
game = game.replace(fontLinks, '<link rel="stylesheet" href="fonts/fonts.css">');

const html = `<!doctype html>
<html lang="xh">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#120d0a">
<meta name="description" content="Induku: Xhosa stick fighting. Four fighters, two Eastern Cape arenas.">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<style>body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>
</head>
<body>
${game}
<script>
// Offline cache for the hosted web version only; the native apps already ship every file.
if ('serviceWorker' in navigator && location.protocol === 'https:' && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
</script>
</body>
</html>
`;

const manifest = {
  name: 'Induku',
  short_name: 'Induku',
  description: 'Xhosa stick fighting',
  start_url: './',
  scope: './',
  display: 'fullscreen',
  orientation: 'landscape',
  background_color: '#120d0a',
  theme_color: '#120d0a',
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

const files = ['./', 'index.html', 'manifest.webmanifest', 'fonts/fonts.css', 'icons/icon-192.png', 'icons/icon-512.png'];
const sw = `const CACHE='induku-${pkg.version}';
const FILES=${JSON.stringify(files)};
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return res})))});
`;

// Privacy policy page (the stores need a public link to it), rendered from PRIVACY.md
const md = await readFile(new URL('PRIVACY.md', root), 'utf8');
const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/_(.+?)_/g, '<em>$1</em>')
  .replace(/([\w.+-]+@[\w-]+\.[\w.]+)/g, '<a href="mailto:$1">$1</a>');
let body = '', list = false;
for (const line of md.split(/\r?\n/)) {
  if (line.startsWith('- ')) { if (!list) { body += '<ul>'; list = true } body += `<li>${inline(line.slice(2))}</li>`; continue }
  if (list) { body += '</ul>'; list = false }
  if (line.startsWith('# ')) body += `<h1>${inline(line.slice(2))}</h1>`;
  else if (line.trim()) body += `<p>${inline(line)}</p>`;
}
if (list) body += '</ul>';
const privacy = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Induku privacy policy</title><link rel="icon" href="icons/icon-192.png"><link rel="stylesheet" href="fonts/fonts.css">
<style>
:root{--earth:#120d0a;--bone:#f3ead8;--ochre:#d9822b;--muted:#b9a88f;color-scheme:dark}
body{margin:0;background:var(--earth);color:var(--bone);font:17px/1.6 "Barlow Semi Condensed","Arial Narrow",system-ui,sans-serif;padding:32px 16px}
main{max-width:40em;margin:0 auto}
h1{font-family:"Bowlby One SC",Impact,sans-serif;font-weight:400;font-size:clamp(28px,6vw,44px);line-height:1.1;margin:0 0 .4em}
p:first-of-type{color:var(--muted)}li{margin:.4em 0}b{color:#fff}a{color:var(--ochre)}
.beads{height:8px;margin:0 0 28px;background:repeating-linear-gradient(90deg,#b5462f 0 12px,#f3ead8 12px 24px,#23a6a0 24px 36px,#0b0907 36px 48px,#d9822b 48px 60px)}
.back{display:inline-block;margin-top:24px}
</style></head>
<body><main><div class="beads"></div>${body}<a class="back" href="./">Play Induku</a></main></body></html>
`;

await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });
await writeFile(new URL('index.html', www), html);
await writeFile(new URL('manifest.webmanifest', www), JSON.stringify(manifest, null, 2));
await writeFile(new URL('sw.js', www), sw);
await writeFile(new URL('privacy.html', www), privacy);
await cp(new URL('assets/fonts/', root), new URL('fonts/', www), { recursive: true });
await cp(new URL('assets/web-icons/', root), new URL('icons/', www), { recursive: true }).catch(() => {
  console.warn('No web icons yet: run "npm run icons" first.');
});
console.log(`Built www/ (v${pkg.version})`);
