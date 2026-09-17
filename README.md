# gymloggerapp.com

The website for Routine, the gym logger. Static HTML and CSS, no build step, hosted on
GitHub Pages at https://gymloggerapp.com.

## Pages

| File           | Purpose                                                   |
| -------------- | --------------------------------------------------------- |
| `index.html`   | Landing page                                              |
| `privacy.html` | Privacy policy — the URL App Store Connect asks for       |
| `terms.html`   | Terms of use — replaces Apple's standard EULA in the app  |
| `support.html` | Support contact and common questions — also for App Store |
| `styles.css`   | The one stylesheet                                        |
| `assets/`      | Icons, derived from the app's `AppIcon.png`               |

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

## The hero preview

`assets/preview.mp4` is the App Store preview recording, and it is markup for a
*picture*, not a player: no `controls`, `pointer-events: none`, PiP and AirPlay
disabled, and Safari's own start-playback overlay hidden in CSS. If autoplay is
declined the fallback is the poster frame, never a play button.

Three things decline it, in rough order of how often they do:

1. **Low Power Mode** on iOS and macOS — blocks every autoplay, including muted.
   The script retries on the first real gesture (pointer, touch, key, scroll),
   which is usually enough.
2. **Reduce Motion** — honoured deliberately. That case *does* get controls and
   a tappable surface (`.preview.is-static`), because a paused video with no
   controls is unwatchable. If you're seeing a player on a normal visit, check
   Settings → Accessibility → Motion first; it's the only path that adds one.
3. **Safari → Settings → Websites → Auto-Play** set to "Never" for the site.

To test the blocked path deliberately: Low Power Mode on, then reload.
