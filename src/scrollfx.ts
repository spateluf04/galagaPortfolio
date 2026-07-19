import { buildScrambledText } from "./scramble";

const ENTRY_SELECTOR = [
  ".section-heading",
  ".about__grid",
  ".project-card",
  ".skill-group",
  ".contact__action",
].join(", ");

const RISE_TRAVEL = 28;
const FLAME_SCALE_MAX = 5;
const STAGGER_STEP = 0.08;
const ENTRY_SPAN = 0.35;
const HEADING_SCRAMBLE_MS = 1500;

const SKEW_MAX_DESKTOP = 1.2;
const SKEW_MAX_MOBILE = 0.6;
const SKEW_K = 0.05;
const VELOCITY_SMOOTH = 0.2;

const HERO_CHILDREN: { selector: string; rate: number }[] = [
  { selector: ".hero__ship", rate: 0.5 },
  { selector: ".hero__name", rate: 0.35 },
  { selector: ".hero__tagline", rate: 0.25 },
  { selector: ".formation", rate: 0.15 },
  { selector: ".insert-coin", rate: 0.1 },
];

interface HeadingTarget {
  kind: "heading";
  el: HTMLElement;
  span: HTMLElement;
  text: string;
  textLength: number;
  offset: number;
  saturated: boolean;
}

interface RiseTarget {
  kind: "rise";
  el: HTMLElement;
  offset: number;
  saturated: boolean;
}

type EntryTarget = HeadingTarget | RiseTarget;

interface HeroChild {
  el: HTMLElement;
  rate: number;
}

// Scroll-driven content effects: a subtle velocity "smear" (skewY) on
// sections while scrolling fast, scroll-scrubbed entry for below-fold
// content (scrubs back out if you scroll back up, until it's fully entered
// once — then it saturates and stays, like a one-shot reveal) — section
// headings type themselves out via a glyph-scramble reveal, everything else
// rises + fades — and a hero parallax exit. Progressive enhancement only —
// every offset here is an inline style applied from JS, so with JS disabled
// all content renders fully visible in its normal position.
export function initScrollFx(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const sections = Array.from(document.querySelectorAll<HTMLElement>("main > section"));
  const entryTargets = buildEntryTargets();
  const heroChildren = HERO_CHILDREN.map(({ selector, rate }) => ({
    el: document.querySelector<HTMLElement>(selector),
    rate,
  })).filter((c): c is HeroChild => c.el !== null);
  const hero = document.getElementById("hero");

  const isMobile = window.matchMedia("(max-width: 639px)").matches;
  const skewMax = isMobile ? SKEW_MAX_MOBILE : SKEW_MAX_DESKTOP;

  let velocity = 0;
  let lastScrollY = window.scrollY;
  let running = false;
  let heroClassesStripped = false;

  function ensureRunning() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function frame() {
    // Deferred until the first scroll so the CSS load-in animation
    // (animation-fill-mode: both) has already finished — stripping the
    // class earlier would snap hero children back to their un-animated
    // state and cause a visible jump.
    if (!heroClassesStripped) {
      for (const { el } of heroChildren) el.classList.remove("fade-in-up");
      heroClassesStripped = true;
    }

    const vh = window.innerHeight;
    const scrollY = window.scrollY;

    const scrollDelta = scrollY - lastScrollY;
    lastScrollY = scrollY;
    velocity += (scrollDelta - velocity) * VELOCITY_SMOOTH;

    const skew = Math.max(-skewMax, Math.min(skewMax, velocity * SKEW_K));
    const skewStr = Math.abs(skew) < 0.02 ? "" : `skewY(${skew.toFixed(2)}deg)`;
    for (const section of sections) section.style.transform = skewStr;

    for (const target of entryTargets) applyEntry(target, vh);

    if (hero) applyHeroParallax(heroChildren, scrollY, hero.offsetHeight);

    if (Math.abs(velocity) < 0.02) {
      velocity = 0;
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("scroll", ensureRunning, { passive: true });
  ensureRunning();
}

function buildEntryTargets(): EntryTarget[] {
  const els = Array.from(document.querySelectorAll<HTMLElement>(ENTRY_SELECTOR));
  const indexInParent = new Map<Element | null, number>();
  return els.map((el) => {
    const parent = el.parentElement;
    const count = indexInParent.get(parent) ?? 0;
    indexInParent.set(parent, count + 1);
    const offset = count * STAGGER_STEP;

    if (el.classList.contains("section-heading")) {
      // Headings are plain text today (see index.html) — wrap that text in
      // a span so the scramble reveal below doesn't disturb the heading's
      // own full-width border-bottom. The span's visible text flickers
      // through scramble glyphs mid-reveal, so it's hidden from assistive
      // tech in favor of a stable aria-label on the heading itself.
      const text = el.textContent ?? "";
      el.textContent = "";
      el.setAttribute("aria-label", text);
      const span = document.createElement("span");
      span.className = "heading-type";
      span.setAttribute("aria-hidden", "true");
      span.textContent = text;
      el.appendChild(span);
      return {
        kind: "heading",
        el,
        span,
        text,
        textLength: text.length,
        offset,
        saturated: false,
      };
    }

    return { kind: "rise", el, offset, saturated: false };
  });
}

function applyEntry(target: EntryTarget, vh: number): void {
  if (target.saturated) return;

  const rect = target.el.getBoundingClientRect();
  const raw = (vh - rect.top) / (ENTRY_SPAN * vh) - target.offset;
  const progress = Math.min(Math.max(raw, 0), 1);

  if (target.kind === "heading") {
    if (progress > 0) startHeadingScramble(target);
    return;
  }

  if (progress >= 1) {
    target.el.style.opacity = "";
    target.el.style.transform = "";
    target.saturated = true;
    return;
  }

  const travel = (1 - progress) * RISE_TRAVEL;
  target.el.style.opacity = progress.toFixed(2);
  target.el.style.transform = `translateY(${travel}px)`;
}

// Triggered once when a heading first enters its scroll-entry window. From
// here the reveal runs on its own clock (HEADING_SCRAMBLE_MS), independent
// of further scroll — a fast scroll that jumps a heading straight into view
// still gets the full scramble, rather than skipping straight to the
// resolved text (see applyEntry, which already sets target.saturated so
// this never fires twice).
function startHeadingScramble(target: HeadingTarget): void {
  target.saturated = true;
  target.span.classList.add("heading-type--typing");

  const start = performance.now();

  function frame(now: number) {
    const progress = Math.min((now - start) / HEADING_SCRAMBLE_MS, 1);

    if (progress >= 1) {
      target.span.textContent = target.text;
      target.span.classList.remove("heading-type--typing");
      return;
    }

    target.span.textContent = buildScrambledText(
      target.text,
      Math.floor(progress * target.textLength),
    );
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function applyHeroParallax(children: HeroChild[], scrollY: number, heroHeight: number): void {
  const progress = heroHeight > 0 ? Math.min(scrollY / heroHeight, 1) : 1;
  const fade = (1 - progress).toFixed(2);
  // The ship's thruster flame grows as it "takes off" during the exit —
  // driven via the --flame-scale custom property, which cascades from this
  // wrapper div down to the .flight-ship__flame rects inside its SVG.
  const flameScale = (1 + progress * (FLAME_SCALE_MAX - 1)).toFixed(2);
  for (const { el, rate } of children) {
    el.style.transform = `translateY(${(-rate * scrollY).toFixed(1)}px)`;
    el.style.opacity = fade;
    if (el.classList.contains("hero__ship")) el.style.setProperty("--flame-scale", flameScale);
  }
}
