# gymloggerapp.com

The website for Gym Logger. Static HTML and CSS, no build step, hosted on
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
