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

await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });
await writeFile(new URL('index.html', www), html);
await writeFile(new URL('manifest.webmanifest', www), JSON.stringify(manifest, null, 2));
await writeFile(new URL('sw.js', www), sw);
await cp(new URL('assets/fonts/', root), new URL('fonts/', www), { recursive: true });
await cp(new URL('assets/web-icons/', root), new URL('icons/', www), { recursive: true }).catch(() => {
  console.warn('No web icons yet: run "npm run icons" first.');
});
console.log(`Built www/ (v${pkg.version})`);
