# Induku

A Street Fighter-style game built around Xhosa stick fighting (*ukulwa ngeentonga*), for Android, iOS and the web.

Four fighters with isiXhosa names (Lwazi, Nomvula, Mandla and Zola) fight in two Eastern Cape arenas: the hills at sunset and Hole in the Wall (eSikhaleni) on the Wild Coast. The game has a CPU opponent with three difficulty levels, 2-player play on one keyboard and touch controls for phones.

**Play it in your browser:** https://xola-twayise.github.io/Induku/ (on a phone, use **Add to Home Screen** to install it)

The whole game is one HTML file of plain JavaScript and Canvas 2D, with no game engine. Every fighter, stage, effect and sound is generated in code. [Capacitor](https://capacitorjs.com) packages it as native Android and iOS apps.

## Project layout

| Path | What it is |
|---|---|
| `induku.html` | The game itself: the only file you edit for gameplay |
| `scripts/build.mjs` | Wraps the game into `www/` for the apps and the web, adding the bundled fonts, manifest and offline cache |
| `scripts/make-icons.mjs` | Draws the app icon and splash screens for every Android and iOS size |
| `scripts/fetch-fonts.mjs` | Downloads the two Google Fonts into `assets/fonts` (SIL Open Font License) |
| `scripts/serve.mjs` | Serves the web build at http://localhost:5190 |
| `android/`, `ios/` | Native projects created by Capacitor (landscape-only, full screen) |
| `capacitor.config.json` | App ID, name, splash screen and status bar settings |

## Commands

```bash
npm install          # once
npm run serve        # build and play in a browser at http://localhost:5190
npm run android      # build, sync and open the Android project in Android Studio
npm run ios          # build, sync and open the iOS project in Xcode (macOS only)
npm run icons        # regenerate icons and splash screens after changing the design
```

After you edit `induku.html`, run `npm run sync` (or `npm run android` / `npm run ios`) so the apps pick up the change.

## Controls

- **Phone:** drag on the left half of the screen to move. Up jumps, down crouches, and pushing away from your opponent blocks. Tap **L** (light), **H** (heavy) and **SP** (special, glows when ready).
- **Keyboard, player 1:** WASD to move, F light, G heavy, H special.
- **Keyboard, player 2:** arrow keys to move, numpad 1/2/3 or `,` `.` `/` to attack.
- Esc pauses and M mutes. On Android the back button pauses.

Publishing to Google Play and the App Store is covered step by step in [PUBLISHING.md](PUBLISHING.md).
