import { shipSvg } from "./pixel-icons";

const SHIP_SIZE = 32;
const EDGE_MARGIN = 24;
const ESCORT_SPRING = 0.08;
const VELOCITY_SMOOTH = 0.2;
const DASH_DURATION = 700;
const GHOSTS = [
  { alpha: 0.3, opacity: 0.4 },
  { alpha: 0.18, opacity: 0.24 },
  { alpha: 0.1, opacity: 0.12 },
];

interface Dash {
  startTime: number;
  fromX: number;
  toX: number;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// A small companion ship that escorts the page: it trails scroll position
// with spring easing, banks with scroll velocity, and dashes across the
// screen whenever the HUD stage changes (see hud.ts's "stagechange" event).
// Progressive enhancement only — the whole layer is built here, so with JS
// disabled nothing is added to the DOM.
export function initFlight(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const hero = document.getElementById("hero");
  if (!hero) return;

  const isMobile = window.matchMedia("(max-width: 639px)").matches;

  const layer = document.createElement("div");
  layer.className = "flight-layer";
  layer.setAttribute("aria-hidden", "true");

  const group = document.createElement("div");
  group.className = "flight-ship-group";

  const ghostEls = GHOSTS.map((cfg) => {
    const el = document.createElement("div");
    el.className = "flight-ship flight-ship--ghost";
    el.style.opacity = String(cfg.opacity);
    el.innerHTML = shipSvg(SHIP_SIZE * 0.85);
    group.appendChild(el);
    return { el, x: 0, y: 0, alpha: cfg.alpha };
  });

  const mainEl = document.createElement("div");
  mainEl.className = "flight-ship flight-ship--main";
  mainEl.innerHTML = shipSvg(SHIP_SIZE);
  group.appendChild(mainEl);

  layer.appendChild(group);
  document.body.appendChild(layer);

  let heroPassed = false;
  let currentX = window.innerWidth - EDGE_MARGIN - SHIP_SIZE;
  let currentY = window.innerHeight * 0.5;
  let currentOpacity = 0;
  let velocity = 0;
  let lastScrollY = window.scrollY;
  let dash: Dash | null = null;
  let dashDirection = 1;
  let running = false;

  function targetOpacity(): number {
    if (!heroPassed) return 0;
    if (isMobile && !dash) return 0;
    return 1;
  }

  function ensureRunning() {
    if (running) return;
    running = true;
    lastScrollY = window.scrollY;
    requestAnimationFrame(frame);
  }

  function frame(now: number) {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const escortX = vw - EDGE_MARGIN - SHIP_SIZE;
    const escortY = vh * (0.18 + progress * 0.64);

    const scrollDelta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    velocity += (scrollDelta - velocity) * VELOCITY_SMOOTH;

    if (dash) {
      const t = Math.min((now - dash.startTime) / DASH_DURATION, 1);
      currentX = dash.fromX + (dash.toX - dash.fromX) * easeInOutQuad(t);
      if (t >= 1) dash = null;
    } else {
      currentX += (escortX - currentX) * ESCORT_SPRING;
      currentY += (escortY - currentY) * ESCORT_SPRING;
    }

    currentOpacity += (targetOpacity() - currentOpacity) * 0.12;

    const bank = Math.max(-22, Math.min(22, velocity * 2.5));
    const flame = 1 + Math.min(Math.abs(velocity) * 0.3, 1.5);

    mainEl.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${bank.toFixed(1)}deg)`;
    mainEl.style.setProperty("--flame-scale", flame.toFixed(2));

    for (const ghost of ghostEls) {
      ghost.x += (currentX - ghost.x) * ghost.alpha;
      ghost.y += (currentY - ghost.y) * ghost.alpha;
      ghost.el.style.transform = `translate(${ghost.x}px, ${ghost.y}px)`;
    }

    group.style.opacity = currentOpacity.toFixed(2);

    const settled =
      !dash &&
      Math.abs(velocity) < 0.05 &&
      Math.abs(currentX - escortX) < 0.5 &&
      Math.abs(currentY - escortY) < 0.5 &&
      Math.abs(currentOpacity - targetOpacity()) < 0.01;

    if (settled) {
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }

  const heroObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      heroPassed = entry.intersectionRatio < 0.2;
      ensureRunning();
    },
    { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  );
  heroObserver.observe(hero);

  window.addEventListener("scroll", ensureRunning, { passive: true });

  window.addEventListener("stagechange", () => {
    if (dash || !heroPassed) return;
    const vw = window.innerWidth;
    dash = {
      startTime: performance.now(),
      fromX: currentX,
      toX: dashDirection > 0 ? vw + SHIP_SIZE : -SHIP_SIZE * 2,
    };
    dashDirection *= -1;
    ensureRunning();
  });
}
