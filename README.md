# gymloggerapp.com

The website for Routine, the gym logger. Static HTML and CSS, no build step, hosted on
GitHub Pages at https://gymloggerapp.com.

Still static, including `/admin/`: that page is HTML and JavaScript that runs in
the browser and calls the Parse server's API. Nothing here renders on a server,
there is no build output, and the files in this repo are exactly what gets
deployed. `npm run dev` is a convenience for local work, not a build step.

## Pages

| File           | Purpose                                                   |
| -------------- | --------------------------------------------------------- |
| `index.html`   | Landing page                                              |
| `privacy.html` | Privacy policy — the URL App Store Connect asks for       |
| `terms.html`   | Terms of use — replaces Apple's standard EULA in the app  |
| `support.html` | Support contact and common questions — also for App Store |
| `admin/`       | Internal feedback tool — see below                         |
| `styles.css`   | The one stylesheet                                        |
| `assets/`      | Icons, derived from the app's `AppIcon.png`               |
| `scripts/`     | The dev server. Not deployed — see Running it locally      |

## Running it locally

```
npm run dev
```

Serves the repo at `http://localhost:8000`, with the admin tool at
`http://localhost:8000/admin/`. Live reload is built in, so saving a file
refreshes every open tab.

**No `npm install` needed** — `scripts/dev.js` is sixty lines of `node:http`
with zero dependencies. `live-server` was the obvious choice and wanted 191
packages, which is the wrong trade for a site that otherwise has none.

Use this rather than opening the HTML files directly. A `file://` page has a
null origin, so the admin tool's requests to the Parse server fail CORS and it
cannot be tested that way. The rest of the site opens fine as plain files.

## Deploying

1. Push to `main`.
2. In the repo's **Settings → Pages**, set the source to **Deploy from a
   branch**, branch `main`, folder `/ (root)`.
3. `CNAME` already names `gymloggerapp.com`. At your DNS provider, point the
   apex at GitHub Pages' A records (`185.199.108.153`, `.109.153`, `.110.153`,
   `.111.153`) and add a `CNAME` for `www` → `<your-github-username>.github.io`.
4. Back in **Settings → Pages**, enter the custom domain and tick
   **Enforce HTTPS** once the certificate has been issued.

## Before launch

- [ ] Replace the two `apps.apple.com/app/id0000000000` placeholders in
      `index.html` with the real App Store URL.
- [ ] Make sure `support@gymloggerapp.com` actually delivers somewhere.
- [ ] Confirm "EOTT Tech" is the legal entity you want named in the privacy
      policy and terms, or change it.
- [ ] Have the privacy policy and terms read by someone qualified to. They're
      written to match what the app actually does today (Sign in with Apple,
      Amplitude, RevenueCat, Anthropic, YouTube, MongoDB Atlas) — if the app's
      providers change, these pages have to change with them.
- [ ] Update the app: `LegalConfig.privacyURL` → `https://gymloggerapp.com/privacy.html`,
      `LegalConfig.termsURL` → `https://gymloggerapp.com/terms.html`, and set the
      same URLs in App Store Connect.

## Exercise animations

`assets/exercises/` holds six of the app's Lottie files, light and dark, for the
reel on the home page. They are copies of
`LiftPlan/Resources/ExerciseAnimations{,Dark}` — re-copy rather than edit if the
art is ever replaced, or the site and the app will show different drawings of
the same movement.

**Licensing is unresolved.** The pack is licensed from VFE for use *in the app*;
nothing shipped with it says whether a public marketing site is covered. Confirm
before this goes live.

## The hero preview and the exercise reel

`assets/preview.mp4` is the App Store preview recording, and it is markup for a
*picture*, not a player: no `controls`, `pointer-events: none`, PiP and AirPlay
disabled, and Safari's own start-playback overlay hidden in CSS. If autoplay is
declined the fallback is the poster frame, never a play button. The script
retries on every readiness event, on the first real gesture, on `pageshow`, and
on a 12-second watchdog for the level-triggered states that fire nothing.

**There is no `prefers-reduced-motion` branch, and that is deliberate.** There
used to be: it paused the video on frame 0 with controls, and froze the six
Lottie tiles on a midpoint pose. It made the whole page look broken to anyone
whose browser reported the preference — which includes people who set it for
reasons unrelated to a silent, slow, flash-free 26-second loop, and several
embedded and headless renderers that report it by default. If the preference is
ever honoured again, honour it with something that still moves.

**The reel is not lazy any more either.** It mounted on an IntersectionObserver,
whose root is the viewport — so anything reporting a zero-area viewport (a
background tab at first paint, an embedded renderer) never got an intersection
and the tiles stayed empty forever, silently. Six files, ~46KB gzipped, below
the fold: mounted outright.

Three things still decline autoplay, in rough order of how often:

1. **Low Power Mode** on iOS and macOS — blocks every autoplay, muted included.
   The gesture retry usually catches it.
2. **Safari → Settings → Websites → Auto-Play** set to "Never" for the site.
3. A data-saver or strict-autoplay setting in a non-Safari browser.

To test the blocked path deliberately: Low Power Mode on, then reload.

## The admin tool

`/admin/` lists everything users have sent through the app's feedback form and
Contact us row, and lets you reply by email.

**It is a public URL, and that is fine.** The page is static HTML on GitHub
Pages, so it can keep no secrets and enforce nothing. The access control lives
in the `listFeedback` and `replyToFeedback` cloud functions on the Parse server,
which require a signed-in user whose email is `ADMIN_EMAIL`
(`support+admin@gymloggerapp.com`) **and** whose address is verified. Loading
the page without that session gets you a login form and nothing else.

The `emailVerified` check is the part worth not removing. Without it, anyone
could sign up claiming the admin address and read every message in the system.

On this server it means something slightly different from the usual, and
stronger: since Parse forbids clients from writing `emailVerified` and nothing
here sends verification mail, the flag can only mean "an operator with the
master key created this account deliberately".

### Setup, once

Signing up through the app does **not** produce a usable admin: `emailVerified`
is master-key-only in Parse, `masterKeyIps` blocks the master key from anywhere
but the server itself, and this server has no email adapter so no verification
link is ever sent. The `createAdminUser` cloud function exists for exactly this,
guarded by `X-Admin-Key` rather than by a session — because there is no admin
yet when you need it.

1. Set `FEEDBACK_ADMIN_KEY` on the server to a long random string, if it is not
   already set. An unset value grants nothing, so this is required.
2. Call it, substituting your own password:

   ```
   curl -X POST https://liftplan-server.onrender.com/parse/functions/createAdminUser \
     -H 'X-Parse-Application-Id: liftplan' \
     -H 'X-Parse-Client-Key: 73d811b372f412119fb0a28b4c54185c53d66b1fb4accf45' \
     -H 'X-Admin-Key: <FEEDBACK_ADMIN_KEY>' \
     -H 'Content-Type: application/json' \
     -d '{"password":"<a long password>"}'
   ```

   It is idempotent: run it again and it resets the password rather than
   failing, which is what you want from the thing you reach for when locked
   out. It will only ever touch `ADMIN_EMAIL`.
3. Sign in at `/admin/` with that email and password.

`ADMIN_EMAIL` defaults to `support+admin@gymloggerapp.com`; set it on the server
to use a different address.

Nothing to configure in the page. The three Parse values in it are the same ones
in the iOS app's `Config.swift`, and the client key is not a secret — it ships
inside every copy of the app on the App Store.

### Reading the table

Each row shows the sentiment, the reason, when it arrived, the app version, the
sender, and whether the notification to `support@` actually sent. That last one
matters: a row marked **notification not sent** is a message nobody was told
about, which from an inbox is indistinguishable from a message nobody wrote.
