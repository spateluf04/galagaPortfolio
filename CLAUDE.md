# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A single-page portfolio site (Samir Patel) with a retro arcade fixed-shooter aesthetic — HUD score/stage bar, scrolling starfield, pixel-art icons, an "insert coin" mini-game easter egg. Built with Vite + vanilla TypeScript. **No frameworks, no UI libraries, zero runtime dependencies** — only `typescript` and `vite` as devDependencies. Keep it that way; don't introduce a framework or npm package to solve something plain DOM/Canvas/CSS can do.

## Commands

```bash
npm run dev       # vite dev server, http://localhost:5173
npm run build     # tsc (type-check only, noEmit) && vite build -> dist/
npm run preview   # serve the production build locally
```

There is no test suite and no linter configured. Verification is manual/Playwright-driven (see below) plus `npm run build` for type-checking.

### Verifying changes

There's no committed test script. The pattern used throughout this project's history: write a throwaway Playwright script into the scratchpad/temp directory, run it against `npm run dev`, then discard it. Useful patterns already proven in this codebase:
- `page.mouse.wheel()` for realistic scroll simulation — prefer this over instant `scrollTo` jumps, which can mask bugs in scroll-velocity-driven effects.
- `devices['iPhone 12']` (real Playwright device preset) for mobile checks — a hand-rolled `{ width: 360, isMobile: true }` context has been shown to **not** reproduce real overflow bugs that the real preset catches (see the Grid `min-width: 0` gotcha below).
- `browser.newContext({ reducedMotion: "reduce" })` to verify the `prefers-reduced-motion` path.
- Check `document.documentElement.scrollWidth === clientWidth` after scrolling through the whole page on mobile — zero horizontal overflow is a hard constraint (see below).

## Hard constraints (apply to all changes)

These are established project rules, not suggestions:
- **Vanilla TS + Vite only** — no frameworks, no animation/UI libraries, no new npm dependencies without explicit user approval.
- **Animate via `transform`/`opacity` only** (or native CSS like `scroll-behavior: smooth`) — never animate layout properties. The project-card "MISSION BRIEF" dialog (`src/project-modal.ts`) is a good example of staying inside this rule for something that looks like a layout animation: it's a hand-rolled FLIP transition (invert via `transform`, then release under a CSS transition) computed from `getBoundingClientRect()` deltas, not an animated width/height.
- **Respect `prefers-reduced-motion` everywhere** — every scroll/animation module must early-return or degrade under it. Two layers of enforcement exist: a global CSS kill in `src/styles/base.css` (`animation-duration`/`transition-duration` forced to ~0) and per-module JS guards (`if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;`) at the top of each `init*()` function. New scroll-effect modules must add both.
- **Zero horizontal overflow at any viewport.** Known trap: a CSS Grid/flex *item* that contains a horizontally-scrolling child (like `.skill-scroll`) needs `min-width: 0` on the grid item itself — grid/flex items default to `min-width: auto`, which lets the scrollable child's full unscrolled width push the whole page wider. Verify with the real `devices['iPhone 12']` Playwright preset, not a synthetic narrow viewport.
- **WCAG AA / keyboard accessibility** — visible focus outlines (`:focus-visible`), ≥44×44px touch targets, skip link, `aria-live` status regions for async UI (contact form).
- **Original art only** — all visuals (ship, enemy icons, skill icons) are hand-authored pixel-grid glyphs in `src/pixel-icons.ts`, not reproductions of any existing game's sprites or any company's brand logos. Keep new art in that same style/file.

## Architecture

### Rendering model
There's no virtual DOM or reactive framework. `src/main.ts` is the sole orchestrator:
1. Static HTML shell lives in `index.html` (HUD, section scaffolding with empty containers like `#projects-grid`, `#skills-grid`, the contact form).
2. `src/main.ts`'s `render*()` functions (`renderFormation`, `renderAbout`, `renderProjects`, `renderSkills`, `renderContact`) read from `src/content.ts` and inject HTML via template-string `innerHTML` assignment into those containers.
3. `src/content.ts` is the **single source of truth for all copy** — name, bio, project list, skill groups, links, nav. When asked to change site content/text, edit only this file; don't hand-edit rendered HTML in `main.ts`.
4. After rendering, `main.ts`'s `init()` wires up the interactive/animated subsystems (see below), each of which owns its own DOM/listeners independently.

### The scroll-driven subsystems, and how they talk to each other
Several independent modules all react to `window.scroll`, each with its own rAF loop and **idle-shutdown pattern**: a passive `scroll` listener sets a `ticking`/`running` flag and restarts `requestAnimationFrame`, and the loop cancels itself once velocity/state has settled back to rest (rather than running an rAF loop forever). Follow this pattern for any new scroll effect — don't add an unconditional `requestAnimationFrame` loop.

- **`src/hud.ts`** (`initHud`) — drives the `1UP` score readout (derived from scroll progress, purely cosmetic) and the `STAGE n/4` readout. Stage detection = the deepest of the four main `<section>`s whose top has crossed the viewport's vertical center, computed via `getBoundingClientRect()` each frame. (Previously used IntersectionObserver ratio comparison — that approach was buggy because it favored short sections over tall ones near a shared boundary; don't reintroduce it.) On stage change it dispatches a custom `window` event, `stagechange`, with `{ detail: { index } }` — this is the sole coupling point to `flight.ts`.
- **`src/flight.ts`** (`initFlight`) — a small ship that listens for `stagechange` and dashes across the screen (with a fading ghost trail), invisible at rest. This is intentionally *not* an escort/companion ship riding the viewport edge — that design was tried and explicitly rejected in favor of content-level effects (see `scrollfx.ts`). Keep fly-bys decoupled from content transforms; it only reacts to the `stagechange` event, never to raw scroll position directly (except to pick its dash height band).
- **`src/scrollfx.ts`** (`initScrollFx`) — the primary "content responds to scroll" system (replaced an earlier one-shot `reveal.ts`, which is deleted). Three effects, all inline-style-driven so no-JS users see fully visible, untransformed content:
  1. Velocity "smear": a small `skewY` on every `<section>` proportional to smoothed scroll velocity, relaxing upright at rest.
  2. Scroll-scrubbed entry: below-fold elements (`.section-heading`, `.about__grid`, `.project-card`, `.skill-group`, `.contact__action`) animate in/out proportionally to scroll position — reversible until they fully enter once, at which point they "saturate" (inline styles cleared permanently, matching a one-shot reveal) so hover states etc. keep working cleanly.
  3. Hero parallax exit: hero children move at different rates while scrolling away from the hero, using the `fade-in-up` class only for the initial load-in (stripped on first scroll so inline transforms can take over without a jump).
- **`src/starfield.ts`** (`initStarfield`) — Canvas-based background starfield, independent of the above; also does a scroll-velocity "warp" (streaking stars) using the same smoothed-velocity technique as `scrollfx.ts`, but is otherwise self-contained (own rAF loop, pauses via `visibilitychange` when the tab is hidden).

If you touch scroll behavior, be aware all of these run concurrently off the same native `scroll` event and are order-independent — they don't need to coordinate beyond the `stagechange` event.

### The mini-game
`src/game/index.ts` (`mountGame`) is a self-contained Canvas game (single wave, score-attack, no lose condition) and is **code-split** — dynamically `import()`-ed from `main.ts` only when INSERT COIN is actually triggered (space bar or tap), so it never adds to the initial JS payload. If you modify it, preserve the dynamic import in `main.ts`'s `launch()` — don't hoist it to a static import.

### Social preview image

`public/og-image.png` (1200×630) is a generated asset, not hand-placed:
it was produced by a throwaway Node script that writes a raw RGBA buffer
through `zlib.deflateSync` into hand-assembled PNG chunks, using an
original 5×7 bitmap font — no image library, consistent with the
zero-dependency rule. To change it, rewrite that script rather than
editing the PNG. The `og:*`/`twitter:*` tags in `index.html` carry an
absolute placeholder origin that **must** be replaced with the real
deployed URL, or link previews will not render.

### Pixel art
`src/pixel-icons.ts` renders all icons (ship, enemy glyphs, skill glyphs) from ASCII grids (`X` = filled pixel) into inline SVG via `gridToSvg()`. `avatarSvg()` renders the About-section portrait — a hand-authored pixel likeness of Samir, drawn from a reference photo the way an artist works from one. It uses `shadeGridToSvg()`, a multi-tone sibling of `gridToSvg()` where each grid character keys into `PORTRAIT_PALETTE` ("." is transparent), because a portrait needs more than one colour. Note a straight luminance downsample of the source photo was tried first and rejected: at 32×32 the cast shadow in the photo is the same luminance as the hair, so no threshold separates them and the result is mush. Every row must be exactly 32 characters. The About section shows this, not a photo, by design. To add a new skill icon, add an entry to `SKILL_GRIDS` keyed by the *exact* item string used in `content.ts`'s `skillGroups`; unmatched items fall back to a generic square glyph (`FALLBACK_GRID`) rather than erroring.

### Project "mission briefing" dialog
`src/project-modal.ts` (`initProjectModal`) expands a clicked project poster (`.project-card__poster` in `renderProjects()`, `main.ts`) into a full dialog with a hand-rolled FLIP shared-element transition — see the note under "Animate via transform/opacity only" above. It shares a single `#project-modal-root` in `index.html`, rebuilt fresh on each open (same pattern as `#game-root`/`mountGame`). Focus is trapped inside the dialog and restored to the trigger button on close (Escape, backdrop click, or the close button).

## Editing content vs. editing behavior

- Copy/links/projects/skills → `src/content.ts` only.
- New skill items in the `Languages`/`Frameworks`/`Tools` groups (which render as a horizontally-scrollable icon strip, see `SCROLL_GROUPS` in `main.ts`) need a matching `SKILL_GRIDS` entry or they'll render the fallback glyph.
- `profile.links.linkedin` and each `projects[].github` are intentionally-empty placeholders (`main.ts` renders a disabled-looking link/hides the button when empty) — don't "fix" these by removing the fallback rendering logic; they're meant to degrade gracefully until filled in.

## Deployment notes (relevant if asked about hosting/forms)

- GitHub Pages: `.github/workflows/deploy.yml` builds and deploys `dist/` on push to `main`. `vite.config.ts` uses `base: "./"` (relative) specifically so it works on both a GitHub Pages project subpath and a custom domain root — don't change this to an absolute base without checking both deploy targets.
- Contact form uses Netlify Forms (`data-netlify="true"`, honeypot field `_gotcha`) — **only functions when deployed on Netlify**; on GitHub Pages/Vercel/localhost it degrades to showing the user's email address instead of silently failing (see the `catch` block in `initContactForm` in `main.ts`). This is intentional, not a bug to fix.
