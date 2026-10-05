# Publishing Induku to Google Play and the App Store

The game code, the native Android and iOS projects, the icons, the splash screens and the privacy policy are all ready. The steps below are the ones only you can do, because they need your accounts, payments and signing keys.

> **Decide the app ID before your first upload.** It is `com.xolatwayise.induku`, set in `capacitor.config.json`. Once an app is published under an ID, that ID can never change. If you want a different one, change it now in `capacitor.config.json`, `android/app/build.gradle` (`namespace` and `applicationId`) and the Java package folder, or ask Claude to do it.

## Costs

| Store | Cost | What you need |
|---|---|---|
| Google Play | US$25, paid once | A Google account and ID verification |
| Apple App Store | US$99 per year | An Apple ID, the Apple Developer Program, and a **Mac with Xcode** (Apple only allows iOS builds on macOS) |

---

## Android (Google Play)

### 1. Set up your computer (once)
1. Install **Android Studio** from https://developer.android.com/studio. It includes the Java JDK and the Android SDK that the build needs.
2. Open Android Studio once and let it finish downloading the SDK.

### 2. Run the game on your phone
1. On your phone, open **Settings → About phone** and tap **Build number** 7 times. Then go to **Developer options** and turn on **USB debugging**.
2. Connect the phone with a USB cable.
3. In this folder, run:
   ```bash
   npm install
   npm run android
   ```
4. Android Studio opens. Pick your phone in the device list and press **Run ▶**.

### 3. Build the release file (Android App Bundle)
1. In Android Studio, choose **Build → Generate Signed App Bundle / APK → Android App Bundle**.
2. Choose **Create new…** to make an **upload key** (a `.jks` file) and pick a strong password.
   **Back up this file and its password somewhere safe.** You need them for every future update. This repo's `.gitignore` already stops them being committed.
3. Choose the **release** build. The output is `android/app/release/app-release.aab`.

### 4. Create the Play Store listing
1. Sign up at https://play.google.com/console and pay the US$25 fee.
2. Choose **Create app**: name **Induku**, type **Game**, **Free**.
3. Fill in the store listing:
   - **Short description** (80 characters max). For example: *Xhosa stick fighting. Four fighters, two Eastern Cape arenas.*
   - **Full description:** the fighters, arenas and controls.
   - **App icon:** `assets/web-icons/icon-512.png`
   - **Feature graphic:** 1024 × 500 PNG (ask Claude to generate one)
   - **Screenshots:** at least 2 phone screenshots. Take them from the game running on your phone.
4. Complete the **App content** forms:
   - **Privacy policy:** a public web link to `PRIVACY.md` (see "Hosting the privacy policy" below)
   - **Ads:** no ads
   - **Data safety:** no data collected or shared
   - **Content rating:** answer the questionnaire. The game has cartoon fighting with no blood.
   - **Target audience:** pick the age groups you want.
5. **Testing before launch.** New personal developer accounts must run a **closed test with at least 12 testers for 14 days** before Google allows a public release. Upload the `.aab` to **Testing → Closed testing**, add your testers' email addresses and send them the opt-in link.
6. After the test period, choose **Production → Create release**, upload the `.aab` and send it for review.

### 5. Updating later
1. Edit the game.
2. In `android/app/build.gradle`, increase `versionCode` by 1 (it must go up on every upload) and set `versionName`, for example `"1.1"`.
3. Run `npm run android`, build a new signed bundle with the **same** upload key, and upload it.

---

## iOS (App Store)

iOS apps can only be built on a Mac with Xcode. Your options:
- **Your own Mac, or one you can borrow.** This is the simplest.
- **A cloud Mac.** Services such as Codemagic (free tier available) or a GitHub Actions macOS runner can build and upload the app. Signing still needs your Apple Developer account.

### Steps on the Mac
1. Join the Apple Developer Program at https://developer.apple.com/programs (US$99 per year).
2. Install **Xcode** from the Mac App Store, then copy this project to the Mac (for example with git).
3. Run:
   ```bash
   npm install
   npm run ios
   ```
4. In Xcode, select the **App** target, open **Signing & Capabilities** and choose your **Team**. Keep the bundle ID `com.xolatwayise.induku`.
5. Connect your iPhone and press **Run ▶** to test.
6. At https://appstoreconnect.apple.com choose **My Apps → + → New App** and use the same bundle ID.
7. In Xcode, choose **Product → Archive**, then **Distribute App → App Store Connect**.
8. Test the build with **TestFlight**. You can invite up to 10,000 testers by email.
9. Fill in the listing:
   - screenshots for a 6.9" iPhone and a 13" iPad (the game runs on iPad too)
   - description
   - privacy policy URL
   - age rating questionnaire
   - **App Privacy:** "Data Not Collected"
10. **Submit for review.** Apple usually replies within 1 to 3 days.

> Apple sometimes rejects apps that are "just a website in a wrapper". Induku is a complete game that works offline with every file bundled, so it should pass. If a reviewer asks, describe it as an HTML5 game that runs locally.

---

## Hosting the privacy policy (free)
Both stores need a public web link to your privacy policy. The quickest free option is to push this repo to GitHub and turn on **GitHub Pages**. The link will look like `https://<your-username>.github.io/induku/PRIVACY`. You can also host the web build (`www/`) there, so people can play in a browser and add the game to their home screen.

**Before publishing,** change the contact email in `PRIVACY.md` to the address you want the public to see.

## Checklist
- [ ] App ID decided (`com.xolatwayise.induku` or your own)
- [ ] isiXhosa wording checked by a fluent speaker
- [ ] Tested on a real Android phone
- [ ] Upload key created and backed up
- [ ] Privacy policy online
- [ ] Screenshots and feature graphic made
- [ ] Closed test run (12 testers, 14 days)
- [ ] iOS: Mac access, Apple Developer account, TestFlight test
