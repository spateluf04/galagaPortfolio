import { shipSvg } from "./pixel-icons";

const SHIP_SIZE = 32;
const DASH_DURATION = 700;
const FADE_SPEED = 0.15;
const GHOSTS = [
  { alpha: 0.3, opacity: 0.4 },
  { alpha: 0.18, opacity: 0.24 },
  { alpha: 0.1, opacity: 0.12 },
];

interface Dash {
  startTime: number;
  fromX: number;
  toX: number;
  y: number;
  rotation: number;
}

function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

// A ship that zips across the screen whenever the HUD stage changes (see
// hud.ts's "stagechange" event) — invisible at rest, visible only mid-dash.
// Progressive enhancement only — the whole layer is built here, so with JS
// disabled nothing is added to the DOM.
export function initFlight(): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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

  let currentX = 0;
  let currentY = window.innerHeight * 0.5;
  let currentRotation = 0;
  let currentOpacity = 0;
  let dash: Dash | null = null;
  let dashDirection = 1;
  let running = false;

  function ensureRunning() {
    if (running) return;
    running = true;
    requestAnimationFrame(frame);
  }

  function frame(now: number) {
    if (dash) {
      const t = Math.min((now - dash.startTime) / DASH_DURATION, 1);
      currentX = dash.fromX + (dash.toX - dash.fromX) * easeInOutQuad(t);
      currentY = dash.y;
      currentRotation = dash.rotation;
      group.style.setProperty("--flame-scale", String(1 + 2.2 * Math.sin(Math.PI * t)));
      if (t >= 1) dash = null;
    }

    if (!dash) {
      group.style.setProperty("--flame-scale", "1");
    }

    const target = dash ? 1 : 0;
    currentOpacity += (target - currentOpacity) * FADE_SPEED;

    mainEl.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${currentRotation}deg)`;

    for (const ghost of ghostEls) {
      ghost.x += (currentX - ghost.x) * ghost.alpha;
      ghost.y += (currentY - ghost.y) * ghost.alpha;
      ghost.el.style.transform = `translate(${ghost.x}px, ${ghost.y}px) rotate(${currentRotation}deg)`;
    }

    group.style.opacity = currentOpacity.toFixed(2);

    if (!dash && currentOpacity < 0.01) {
      group.style.opacity = "0";
      running = false;
      return;
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("stagechange", () => {
    if (dash) return; // debounce — let the current dash finish first

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    const y = vh * (0.3 + progress * 0.3);
    const goingRight = dashDirection > 0;

    dash = {
      startTime: performance.now(),
      fromX: goingRight ? -SHIP_SIZE * 2 : vw + SHIP_SIZE,
      toX: goingRight ? vw + SHIP_SIZE : -SHIP_SIZE * 2,
      y,
      rotation: goingRight ? 90 : -90,
    };
    dashDirection *= -1;

    for (const ghost of ghostEls) {
      ghost.x = dash.fromX;
      ghost.y = dash.y;
    }

    ensureRunning();
  });
}
