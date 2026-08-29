import { projects } from "./content";

// Expands a project poster into a full "mission briefing" dialog using a
// hand-rolled FLIP (First-Last-Invert-Play) transition: the poster's visual
// box is cloned into the dialog, instantly transformed back to look like it
// never left its collapsed position/size (no transition), then released
// under a transition so it animates forward — transform/opacity only, per
// CLAUDE.md, computed purely from getBoundingClientRect deltas rather than
// animating width/height/top/left directly.

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

let activeTrigger: HTMLButtonElement | null = null;
let activeCleanup: (() => void) | null = null;

function modalRoot(): HTMLElement {
  return document.getElementById("project-modal-root") as HTMLElement;
}

export function initProjectModal(): void {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const trigger = (e.target as HTMLElement).closest<HTMLButtonElement>(".project-card__poster");
    // Ignore new triggers while a briefing is already open/animating —
    // only the close button, backdrop, or Escape should close one.
    if (!trigger || activeTrigger) return;
    openModal(trigger);
  });
}

function openModal(trigger: HTMLButtonElement): void {
  const index = Number(trigger.dataset.projectIndex);
  const project = projects[index];
  const visualSource = trigger.querySelector<HTMLElement>(".project-card__poster-visual");
  if (!project || !visualSource) return;

  const startRect = visualSource.getBoundingClientRect();
  const accent = trigger.style.getPropertyValue("--poster-accent") || "var(--accent-amber)";
  const kicker = trigger.querySelector(".project-card__kicker")?.textContent ?? "";

  const githubLink = project.github
    ? `<a href="${project.github}" target="_blank" rel="noreferrer">GITHUB</a>`
    : `<a href="#" aria-disabled="true" title="Repo link coming soon">GITHUB</a>`;
  const demoLink = project.demo
    ? `<a href="${project.demo}" target="_blank" rel="noreferrer">LIVE DEMO</a>`
    : "";

  const root = modalRoot();
  root.innerHTML = `
    <div class="project-modal__backdrop"></div>
    <div class="project-modal__dialog bracketed" role="dialog" aria-modal="true" aria-labelledby="project-modal-title" style="--poster-accent: ${accent}">
      <button type="button" class="project-modal__close" aria-label="Close mission briefing">&times;</button>
      <div class="project-modal__visual"></div>
      <div class="project-modal__content">
        <p class="project-modal__kicker">${kicker}</p>
        <h2 id="project-modal-title" class="project-modal__title">${project.title}</h2>
        <p class="project-modal__detail">${project.detail}</p>
        <ul class="project-modal__tags">
          ${project.tech.map((tech) => `<li>${tech}</li>`).join("")}
        </ul>
        <div class="project-modal__links">
          ${githubLink}
          ${demoLink}
        </div>
      </div>
    </div>
  `;
  root.hidden = false;

  const backdrop = root.querySelector<HTMLElement>(".project-modal__backdrop")!;
  const dialog = root.querySelector<HTMLElement>(".project-modal__dialog")!;
  const closeBtn = root.querySelector<HTMLButtonElement>(".project-modal__close")!;
  const visualSlot = root.querySelector<HTMLElement>(".project-modal__visual")!;
  const content = root.querySelector<HTMLElement>(".project-modal__content")!;

  const clone = visualSource.cloneNode(true) as HTMLElement;
  clone.classList.add("project-card__poster-visual--clone");
  visualSlot.appendChild(clone);

  // First/Invert, synchronously — set before the browser gets a chance to
  // paint the natural (final) layout, so nothing flashes at full size.
  const endRect = clone.getBoundingClientRect();
  const dx = startRect.left - endRect.left;
  const dy = startRect.top - endRect.top;
  const sx = startRect.width / endRect.width;
  const sy = startRect.height / endRect.height;
  clone.style.transformOrigin = "top left";
  clone.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;
  backdrop.style.opacity = "0";
  dialog.style.opacity = "0";
  content.style.opacity = "0";
  content.style.transform = "translateY(10px)";

  document.body.classList.add("project-modal-open");
  activeTrigger = trigger;

  // Play — deferred a frame so the invert above has actually painted once;
  // otherwise the browser can coalesce both writes into a single frame and
  // the "grow" never becomes visible.
  requestAnimationFrame(() => {
    clone.style.transition = "transform 0.38s cubic-bezier(0.2, 0.8, 0.2, 1)";
    clone.style.transform = "none";
    backdrop.style.transition = "opacity 0.25s ease";
    backdrop.style.opacity = "1";
    dialog.style.transition = "opacity 0.25s ease";
    dialog.style.opacity = "1";

    window.setTimeout(() => {
      content.style.transition = "opacity 0.25s ease, transform 0.25s ease";
      content.style.opacity = "1";
      content.style.transform = "translateY(0)";
    }, 140);
  });

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key !== "Tab") return;
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onBackdropClick() {
    closeModal();
  }

  document.addEventListener("keydown", onKeydown);
  backdrop.addEventListener("click", onBackdropClick);
  closeBtn.addEventListener("click", () => closeModal());
  closeBtn.focus();

  activeCleanup = () => {
    document.removeEventListener("keydown", onKeydown);
    backdrop.removeEventListener("click", onBackdropClick);
  };
}

function closeModal(): void {
  const trigger = activeTrigger;
  if (!trigger) return;

  const root = modalRoot();
  const clone = root.querySelector<HTMLElement>(".project-card__poster-visual--clone");
  const backdrop = root.querySelector<HTMLElement>(".project-modal__backdrop");
  const dialog = root.querySelector<HTMLElement>(".project-modal__dialog");
  const content = root.querySelector<HTMLElement>(".project-modal__content");
  const targetVisual = trigger.querySelector<HTMLElement>(".project-card__poster-visual");

  activeCleanup?.();
  activeCleanup = null;
  activeTrigger = null;
  document.body.classList.remove("project-modal-open");

  const finish = () => {
    root.hidden = true;
    root.innerHTML = "";
    trigger.focus();
  };

  if (!clone || !targetVisual) {
    finish();
    return;
  }

  const targetRect = targetVisual.getBoundingClientRect();
  const currentRect = clone.getBoundingClientRect();
  const dx = targetRect.left - currentRect.left;
  const dy = targetRect.top - currentRect.top;
  const sx = targetRect.width / currentRect.width;
  const sy = targetRect.height / currentRect.height;

  if (backdrop) {
    backdrop.style.transition = "opacity 0.2s ease";
    backdrop.style.opacity = "0";
  }
  if (dialog) {
    dialog.style.transition = "opacity 0.2s ease";
    dialog.style.opacity = "0";
  }
  if (content) {
    content.style.transition = "opacity 0.15s ease";
    content.style.opacity = "0";
  }
  clone.style.transition = "transform 0.3s ease-in";
  clone.style.transform = `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`;

  let done = false;
  const onEnd = () => {
    if (done) return;
    done = true;
    finish();
  };
  clone.addEventListener("transitionend", onEnd, { once: true });
  window.setTimeout(onEnd, 400); // fallback in case transitionend never fires
}
