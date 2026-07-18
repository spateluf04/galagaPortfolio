const REVEAL_SELECTOR = [
  ".section-heading",
  ".about__grid",
  ".project-card",
  ".skill-group",
  ".contact__action",
].join(", ");

const STAGGER_STEP_MS = 70;
const STAGGER_CAP_MS = 350;

export function initReveal(): void {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;

  const targets = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
  if (targets.length === 0) return;

  const indexInParent = new Map<Element | null, number>();
  targets.forEach((el) => {
    const parent = el.parentElement;
    const count = indexInParent.get(parent) ?? 0;
    el.style.transitionDelay = `${Math.min(count * STAGGER_STEP_MS, STAGGER_CAP_MS)}ms`;
    indexInParent.set(parent, count + 1);
    el.classList.add("reveal");
  });

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal--visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
  );

  for (const el of targets) observer.observe(el);
}
