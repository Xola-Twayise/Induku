// Downloads the two Google Fonts the game uses (both SIL Open Font License) into assets/fonts,
// so the mobile app works offline. Run once: npm run fonts
import { mkdir, writeFile } from 'node:fs/promises';

const CSS_URL = 'https://fonts.googleapis.com/css2?family=Bowlby+One+SC&family=Barlow+Semi+Condensed:ital,wght@0,500;0,700;0,800;1,500&display=swap';
// A modern browser user agent makes Google serve woff2 files.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const OUT = new URL('../assets/fonts/', import.meta.url);

await mkdir(OUT, { recursive: true });
const css = await (await fetch(CSS_URL, { headers: { 'User-Agent': UA } })).text();

// Keep only the latin subset blocks: that covers isiXhosa and English text.
const blocks = css.split('/* ').slice(1).filter(b => b.startsWith('latin */'));
let out = '/* Bowlby One SC and Barlow Semi Condensed, SIL Open Font License 1.1 */\n';
let n = 0;
for (const block of blocks) {
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)[1];
  const family = block.match(/font-family: '([^']+)'/)[1].replace(/\s+/g, '');
  const weight = block.match(/font-weight: (\d+)/)[1];
  const style = block.match(/font-style: (\w+)/)[1];
  const file = `${family}-${weight}${style === 'italic' ? 'i' : ''}.woff2`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  await writeFile(new URL(file, OUT), buf);
  out += '@font-face{' + block.slice(block.indexOf('{') + 1, block.lastIndexOf('}')).replace(url, file).replace(/\s+/g, ' ') + '}\n';
  n++;
}
await writeFile(new URL('fonts.css', OUT), out);
console.log(`Saved ${n} font files to assets/fonts`);
