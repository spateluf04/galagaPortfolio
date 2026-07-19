const ENTRY_SELECTOR = [
  ".section-heading",
  ".about__grid",
  ".project-card",
  ".skill-group",
  ".contact__action",
].join(", ");

const HEADING_TRAVEL = 32;
const RISE_TRAVEL = 28;
const STAGGER_STEP = 0.08;
const ENTRY_SPAN = 0.35;

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

interface EntryTarget {
  el: HTMLElement;
  axis: "x" | "y";
  offset: number;
  saturated: boolean;
}

interface HeroChild {
  el: HTMLElement;
  rate: number;
}

// Scroll-driven content effects: a subtle velocity "smear" (skewY) on
// sections while scrolling fast, scroll-scrubbed entry for below-fold
// content (scrubs back out if you scroll back up, until it's fully entered
// once — then it saturates and stays, like a one-shot reveal), and a hero
// parallax exit. Progressive enhancement only — every offset here is an
// inline style applied from JS, so with JS disabled all content renders
// fully visible in its normal position.
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
    const axis: "x" | "y" = el.classList.contains("section-heading") ? "x" : "y";
    return { el, axis, offset: count * STAGGER_STEP, saturated: false };
  });
}

function applyEntry(target: EntryTarget, vh: number): void {
  if (target.saturated) return;

  const rect = target.el.getBoundingClientRect();
  const raw = (vh - rect.top) / (ENTRY_SPAN * vh) - target.offset;
  const progress = Math.min(Math.max(raw, 0), 1);

  if (progress >= 1) {
    target.el.style.opacity = "";
    target.el.style.transform = "";
    target.saturated = true;
    return;
  }

  const travel = (1 - progress) * (target.axis === "x" ? HEADING_TRAVEL : RISE_TRAVEL);
  target.el.style.opacity = progress.toFixed(2);
  target.el.style.transform =
    target.axis === "x" ? `translateX(${-travel}px)` : `translateY(${travel}px)`;
}

function applyHeroParallax(children: HeroChild[], scrollY: number, heroHeight: number): void {
  const progress = heroHeight > 0 ? Math.min(scrollY / heroHeight, 1) : 1;
  const fade = (1 - progress).toFixed(2);
  for (const { el, rate } of children) {
    el.style.transform = `translateY(${(-rate * scrollY).toFixed(1)}px)`;
    el.style.opacity = fade;
  }
}
