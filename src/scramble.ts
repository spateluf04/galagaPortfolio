const SCRAMBLE_GLYPHS = "░▒▓█▖▘▝▗<>/#*+=";

export function randomGlyphs(n: number): string {
  let out = "";
  for (let i = 0; i < n; i++) {
    out += SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
  }
  return out;
}

// One-shot, page-load reveal: scrambles el's text into 8-bit-style noise
// glyphs, then resolves left-to-right into the real characters over
// durationMs. Not scroll-driven — see scrollfx.ts's applyHeadingEntry for
// the scroll-scrubbed sibling of this effect.
export function scrambleIn(el: HTMLElement, durationMs: number): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const text = el.textContent ?? "";
  el.setAttribute("aria-label", text);

  const start = performance.now();

  function frame(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / durationMs, 1);

    if (progress >= 1) {
      el.textContent = text;
      el.removeAttribute("aria-label");
      return;
    }

    const resolvedCount = Math.floor(progress * text.length);
    let out = "";
    for (let i = 0; i < text.length; i++) {
      if (text[i] === " ") {
        out += " ";
      } else if (i < resolvedCount) {
        out += text[i];
      } else {
        out += randomGlyphs(1);
      }
    }
    el.textContent = out;

    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
