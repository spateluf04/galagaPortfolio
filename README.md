# Samir Patel — Portfolio

Single-page portfolio with a retro arcade fixed-shooter aesthetic. Vite +
vanilla TypeScript, no frameworks or UI libraries. All pixel art is
original — no assets from any existing game are reproduced.

## Local dev

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-checks then builds to dist/
npm run preview   # serves the production build locally
```

## Editing content

All copy — name, tagline, bio, project list, skills, links — lives in
[`src/content.ts`](src/content.ts). Edit that file only; the sections
render from it automatically. Things you'll likely want to fill in:

- `profile.links.linkedin` — currently empty, hides the LinkedIn button
  in Contact until set.
- `profile.links.resume` — points at `./resume.pdf` (relative on
  purpose, so it resolves under a GitHub Pages project subpath too — do
  not change it back to a leading-slash absolute path). **Drop your
  résumé at `public/resume.pdf`; until you do, the DOWNLOAD RESUME
  button 404s.**
- Each `projects[].github` — all four are filled in. If you ever blank
  one, the card falls back to a disabled-looking link rather than
  erroring; that fallback is intentional.
- `profile.taglines[]` — three alternatives are included; `activeTagline`
  picks which one renders.
- `skillGroups` — Languages/Frameworks/Tools render as a horizontally
  scrollable strip with a pixel-art icon per item; Coursework stays a
  plain list. Adding a new Languages/Frameworks/Tools item needs a
  matching entry in `SKILL_GRIDS` in
  [`src/pixel-icons.ts`](src/pixel-icons.ts) (keyed by the exact item
  string) or it falls back to a generic square glyph.

## Deployment

**Netlify is the primary target** — `netlify.toml` sets the build
command and publish directory, and the contact form only works here
(see below). Import the repo at app.netlify.com; no other config
needed.

`.github/workflows/deploy.yml` also builds and deploys `dist/` to GitHub
Pages on every push to `main` (or manually via workflow_dispatch). To
enable it: repo **Settings → Pages → Source → GitHub Actions**. No
repo-name-specific config is needed — `vite.config.ts` uses a relative
`base: "./"` so the build works whether it's served from a project page
(`user.github.io/repo/`) or a custom domain root.

To deploy to Vercel instead: import the repo, framework preset "Vite",
no other configuration required.

**Contact form requires Netlify hosting to actually deliver messages.**
The form in the Contact section uses [Netlify
Forms](https://docs.netlify.com/manage/forms/setup/) (`data-netlify="true"`
on the `<form>`) — Netlify's build bot detects that attribute and
auto-provisions a submission endpoint + dashboard, no backend code or
API keys needed. This **only works when the site is actually deployed
on Netlify**; it does nothing on GitHub Pages, Vercel, or localhost.
If you deploy elsewhere, the form still degrades gracefully: the JS
tries to POST to itself, gets a non-2xx response, and falls back to
showing your email address instead of silently failing.

To make the form actually work: deploy to Netlify instead of (or in
addition to) GitHub Pages — import the repo at app.netlify.com, build
command `npm run build`, publish directory `dist`. Once deployed,
enable email notifications for the "contact" form under **Site
settings → Forms → Form notifications** so submissions land in your
inbox.

## Notable decisions

- **Tagline**: defaulted to "CS student · I build software"; two
  alternates are in `content.ts` if you'd rather use one of those.
- **Contact**: a real form (name/email/message) instead of a `mailto:`
  button, using Netlify Forms — see Deployment above for the hosting
  requirement and graceful-degradation behavior. Includes a visually-hidden
  honeypot field (`_gotcha`) for basic spam filtering.
- **Skill icons**: hand-drawn pixel-grid glyphs (`src/pixel-icons.ts`),
  not official brand logos — keeps every asset on the site originally
  authored, consistent with the "no reproduced assets" rule applied to
  the arcade theme itself.
- **Fonts**: "Press Start 2P" (headings/HUD/buttons, never below 12px)
  and "JetBrains Mono" (body, 16px+) loaded from Google Fonts with
  `preconnect` + `preload` + `font-display: swap`.
- **Easter-egg game**: code-split and only fetched when INSERT COIN is
  actually pressed/tapped — it does not add to the initial JS payload.
  It's a single wave of 12 enemies (score-attack style); there's no
  lose condition since the spec only asked for shoot-for-score, not a
  full game loop with lives.
- **CRT scanline overlay**: kept at ~1–1.5% effective opacity (0.03
  alpha × 0.35 layer opacity) and is fully disabled under
  `prefers-reduced-motion: reduce`.

## QA results

**Lighthouse** (production build, `npm run preview`):
Performance 97 · Accessibility 100 · Best Practices 100 · SEO 100.

**Bundle size** (gzipped): ~4.5 KB main JS + ~2.1 KB CSS; the game
module is a separate ~1.4 KB lazy chunk, well under the 50 KB budget
(excluding the game).

**Mobile matrix** — checked with real viewport emulation at 360×800,
390×844, 768×1024, and 1440×900 desktop:

- No horizontal scroll at any breakpoint.
- HUD collapses to a slim bar under 640px (HI-SCORE hidden), stays
  under 48px tall.
- Nav formation wraps to a 2×2 grid on mobile, 4-across from 640px up.
- All interactive elements verified ≥44×44px.
- Insert-coin/game text wraps without overlapping (fixed via
  `clamp()` font-size + `line-height: 1.8` on that button).

**Keyboard/a11y** — tab order verified: skip-link → 4 nav links →
insert-coin → page sections → contact actions, each with a visible
2px amber focus outline. `prefers-reduced-motion` confirmed to disable
both the scanline overlay and CSS transitions/animations.

**Easter-egg game** — verified end-to-end: launches on Space press or
tap, ship moves, holding fire spawns bullets that register AABB hits
on enemies, HUD score updates live, Escape and the on-screen × both
close the overlay cleanly.

**Known tradeoff**: Lighthouse flags ~590ms of render-blocking time
from the Google Fonts stylesheet request under simulated throttling.
Preconnect + preload are already in place; self-hosting the fonts
would close the remaining gap but wasn't necessary to hit the 95+
target (currently 97).

**Gotcha for future CSS edits**: any element inside `.skills__grid`
that itself scrolls horizontally (like `.skill-scroll`) needs
`min-width: 0` on its CSS Grid *item* ancestor (`.skill-group`). Grid
(and flex) items default to `min-width: auto`, which lets a scrollable
child's full unscrolled content width propagate up through the grid
and force the whole page to overflow horizontally — this was caught
and fixed during development by testing against real Playwright device
presets (`devices['iPhone 12']`), which reproduce this correctly;
a hand-rolled `{ width: 360, isMobile: true }` context did not.
