// Draws the Induku icon (two crossed fighting sticks over an ochre sun, with a beadwork band)
// and writes every app icon and splash screen Android, iOS and the web build need.
// Run: npm run icons   (after "npx cap add android" / "npx cap add ios")
import sharp from 'sharp';
import { readdir, mkdir, writeFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BG = '#120d0a';
const BEADS = ['#b5462f', '#f3ead8', '#23a6a0', '#0b0907', '#d9822b', '#f3ead8'];

function emblem() {
  let band = '';
  const n = 10, w = 50, x0 = 512 - (n * w) / 2, y = 712, h = 48;
  for (let i = 0; i < n; i++) {
    const x = x0 + i * w, c = BEADS[i % BEADS.length];
    band += i % 2
      ? `<path d="M${x} ${y}h${w}l-${w / 2} ${h}z" fill="${c}"/>`
      : `<path d="M${x} ${y + h}h${w}l-${w / 2} -${h}z" fill="${c}"/>`;
  }
  // attack stick raised on a diagonal, defence stick held level above it: the fighting stance
  const stick = (deg, cx, cy, len) => `<g transform="rotate(${deg} ${cx} ${cy})">
    <rect x="${cx - 23}" y="${cy - len / 2}" width="46" height="${len}" rx="23" fill="url(#wood)"/>
    <rect x="${cx - 10}" y="${cy - len / 2 + 40}" width="9" height="${len - 80}" rx="4.5" fill="#c08a52" opacity=".55"/></g>`;
  return `<circle cx="512" cy="470" r="250" fill="url(#sun)"/>
    <circle cx="512" cy="470" r="250" fill="none" stroke="#0b0907" stroke-opacity=".25" stroke-width="10"/>
    ${band}${stick(22, 530, 480, 720)}${stick(-66, 500, 410, 540)}`;
}
const defs = `<defs>
  <radialGradient id="bg" cx="50%" cy="44%" r="72%"><stop offset="0" stop-color="#3a2216"/><stop offset="1" stop-color="${BG}"/></radialGradient>
  <linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd27a"/><stop offset="1" stop-color="#d9822b"/></linearGradient>
  <linearGradient id="wood" x1="0" x2="1"><stop offset="0" stop-color="#3f230f"/><stop offset=".5" stop-color="#8a5a2e"/><stop offset="1" stop-color="#3f230f"/></linearGradient></defs>`;

// Square art. scale shrinks the emblem (adaptive and maskable icons need a safe zone).
function iconSvg({ background = true, scale = 1.12, round = false } = {}) {
  const body = `${background ? '<rect width="1024" height="1024" fill="url(#bg)"/>' : ''}
    <g transform="translate(512 512) scale(${scale}) translate(-512 -512)">${emblem()}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${defs}
    ${round ? `<clipPath id="r"><circle cx="512" cy="512" r="512"/></clipPath><g clip-path="url(#r)">${body}</g>` : body}</svg>`;
}
function splashSvg(w, h) {
  const size = Math.min(w, h) * 0.42, s = size / 1024;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs}
    <rect width="${w}" height="${h}" fill="${BG}"/>
    <g transform="translate(${(w - size) / 2} ${(h - size) / 2}) scale(${s})">${emblem()}</g></svg>`;
}
const png = (svg, w, h = w) => sharp(Buffer.from(svg)).resize(w, h).png().toBuffer();
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
const exists = p => stat(p).then(() => true, () => false);
let count = 0;
const write = async (file, buf) => { await writeFile(file, buf); count++; };

// Web build icons
const webDir = join(ROOT, 'assets', 'web-icons');
await mkdir(webDir, { recursive: true });
for (const n of [180, 192, 512]) await write(join(webDir, `icon-${n}.png`), await png(iconSvg(), n));
await write(join(webDir, 'icon-maskable-512.png'), await png(iconSvg({ scale: 0.78 }), 512));
await write(join(ROOT, 'assets', 'icon-1024.png'), await png(iconSvg(), 1024));

// Android: regenerate each existing launcher and splash PNG at its current size
const res = join(ROOT, 'android', 'app', 'src', 'main', 'res');
if (await exists(res)) {
  for (const f of await walk(res)) {
    if (!f.endsWith('.png')) continue;
    const { width, height } = await sharp(f).metadata();
    const name = f.split(/[\\/]/).pop();
    if (name === 'ic_launcher.png') await write(f, await png(iconSvg(), width));
    else if (name === 'ic_launcher_round.png') await write(f, await png(iconSvg({ round: true }), width));
    else if (name === 'ic_launcher_foreground.png') await write(f, await png(iconSvg({ background: false, scale: 0.62 }), width));
    else if (name === 'splash.png') await write(f, await png(splashSvg(width, height), width, height));
  }
  await writeFile(join(res, 'values', 'ic_launcher_background.xml'),
    `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${BG}</color>\n</resources>\n`);
}

// iOS: one 1024 icon (no transparency allowed) and the 2732 splash images
const xc = join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets');
if (await exists(xc)) {
  await write(join(xc, 'AppIcon.appiconset', 'AppIcon-512@2x.png'),
    await sharp(Buffer.from(iconSvg())).resize(1024, 1024).flatten({ background: BG }).png().toBuffer());
  const splash = await png(splashSvg(2732, 2732), 2732);
  for (const n of ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'])
    await write(join(xc, 'Splash.imageset', n), splash);
}
console.log(`Wrote ${count} images`);
