const MAX_SCORE = 999990;
const STAGE_SECTION_IDS = ["about", "projects", "skills", "contact"];

export function initHud(scoreEl: HTMLElement, stageEl: HTMLElement): void {
  let ticking = false;

  const sections = STAGE_SECTION_IDS.map((id) => document.getElementById(id)).filter(
    (el): el is HTMLElement => el !== null,
  );

  const progressFill = document.getElementById("hud-progress-fill");
  const returnBase = document.getElementById("return-base");

  let lastIndex = -1;

  function update() {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    const score = Math.round((progress * MAX_SCORE) / 10) * 10;
    scoreEl.textContent = score.toString().padStart(6, "0");

    if (progressFill) progressFill.style.transform = `scaleX(${progress.toFixed(4)})`;
    if (returnBase) returnBase.classList.toggle("return-base--visible", window.scrollY > window.innerHeight * 0.8);

    // Current stage = the deepest section whose top has crossed the
    // viewport's vertical center. Comparing intersection *ratios* here
    // instead would favor short sections unfairly (a small overlap is a
    // much bigger fraction of a short section than of a tall one).
    const center = window.innerHeight / 2;
    let index = -1;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top <= center) index = i;
    }

    if (index !== -1) {
      stageEl.textContent = `${index + 1}/${sections.length}`;
      if (index !== lastIndex) {
        lastIndex = index;
        window.dispatchEvent(new CustomEvent("stagechange", { detail: { index } }));
      }
    }

    ticking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );

  update();
}
