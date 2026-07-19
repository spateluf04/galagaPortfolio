const MAX_SCORE = 999990;
const STAGE_SECTION_IDS = ["about", "projects", "skills", "contact"];

export function initHud(scoreEl: HTMLElement, stageEl: HTMLElement): void {
  let ticking = false;

  function updateScore() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    const score = Math.round((progress * MAX_SCORE) / 10) * 10;
    scoreEl.textContent = score.toString().padStart(6, "0");
    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(updateScore);
        ticking = true;
      }
    },
    { passive: true },
  );

  updateScore();

  const sections = STAGE_SECTION_IDS.map((id) => document.getElementById(id)).filter(
    (el): el is HTMLElement => el !== null,
  );

  let lastIndex = -1;

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      const index = sections.indexOf(visible.target as HTMLElement);
      if (index !== -1) {
        stageEl.textContent = `${index + 1}/${sections.length}`;
        if (index !== lastIndex) {
          lastIndex = index;
          window.dispatchEvent(new CustomEvent("stagechange", { detail: { index } }));
        }
      }
    },
    { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] },
  );

  for (const section of sections) {
    observer.observe(section);
  }
}
