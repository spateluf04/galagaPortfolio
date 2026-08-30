import "./styles/base.css";
import "./styles/hud.css";
import "./styles/sections.css";
import "./styles/flight.css";
import "./styles/project-modal.css";
import { profile, projects, skillGroups, nav } from "./content";
import { initStarfield } from "./starfield";
import { initHud } from "./hud";
import { avatarSvg, enemyIconSvg, skillIconSvg } from "./pixel-icons";
import { initScrollFx } from "./scrollfx";
import { initFlight } from "./flight";
import { scrambleIn } from "./scramble";
import { initProjectModal } from "./project-modal";

function $<T extends HTMLElement>(selector: string): T {
  const el = document.querySelector<T>(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el;
}

function renderTagline() {
  $("#hero-tagline").textContent = profile.taglines[profile.activeTagline];
}

function renderFormation() {
  const list = $("#formation-list");
  list.innerHTML = nav
    .map(
      (item) =>
        `<li><a class="formation__link bracketed" href="#${item.id}">${item.label}</a></li>`,
    )
    .join("");
}

function renderAbout() {
  $("#about-bio").textContent = profile.bio;
  $("#about-avatar").innerHTML = avatarSvg();
  const factsList = $("#quick-facts");
  factsList.innerHTML = profile.quickFacts
    .map(
      (fact) =>
        `<li><span class="fact__label">${fact.label}</span><span>${fact.value}</span></li>`,
    )
    .join("");
}

// Cycled per card so the four posters read as distinct "stage" colors
// rather than one repeated accent.
const POSTER_ACCENTS = ["var(--accent-amber)", "var(--accent-pink)", "var(--accent-teal)"];

function renderProjects() {
  const grid = $("#projects-grid");
  grid.innerHTML = projects
    .map((project, index) => {
      const githubLink = project.github
        ? `<a href="${project.github}" target="_blank" rel="noreferrer">GITHUB</a>`
        : `<a href="#" aria-disabled="true" title="Repo link coming soon">GITHUB</a>`;
      const demoLink = project.demo
        ? `<a href="${project.demo}" target="_blank" rel="noreferrer">LIVE DEMO</a>`
        : "";
      const accent = POSTER_ACCENTS[index % POSTER_ACCENTS.length];
      const kicker = project.tech[0]?.toUpperCase() ?? project.stage;
      return `
        <li class="project-card bracketed">
          <button
            type="button"
            class="project-card__poster"
            data-project-index="${index}"
            style="--poster-accent: ${accent}"
            aria-haspopup="dialog"
            aria-label="View mission briefing: ${project.title}"
          >
            <span class="project-card__poster-visual" aria-hidden="true">
              <span class="project-card__badge">${project.stage}</span>
              <span class="project-card__icon">${enemyIconSvg(index, accent, 44)}</span>
            </span>
            <span class="project-card__poster-scrim" aria-hidden="true"></span>
            <span class="project-card__poster-text">
              <span class="project-card__kicker">${kicker}</span>
              <span class="project-card__title-overlay" role="heading" aria-level="3">${project.title}</span>
            </span>
          </button>
          <div class="project-card__body">
            <p class="project-card__blurb">${project.blurb}</p>
            <ul class="project-card__tags">
              ${project.tech.map((tech) => `<li>${tech}</li>`).join("")}
            </ul>
            <div class="project-card__links">
              ${githubLink}
              ${demoLink}
            </div>
          </div>
        </li>
      `;
    })
    .join("");
}

const SCROLL_GROUPS = new Set(["Languages", "Frameworks", "Tools"]);

function renderSkills() {
  const grid = $("#skills-grid");
  grid.innerHTML = skillGroups
    .map((group) => {
      const items = SCROLL_GROUPS.has(group.label)
        ? `
          <ul class="skill-scroll" tabindex="0" aria-label="${group.label} skills, scroll horizontally for more">
            ${group.items
              .map(
                (item) => `
                  <li class="skill-scroll__item">
                    ${skillIconSvg(item, "#5dcaa5")}
                    <span class="skill-scroll__label">${item}</span>
                  </li>
                `,
              )
              .join("")}
          </ul>
        `
        : `
          <ul class="skill-group__items">
            ${group.items.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        `;
      return `
        <div class="skill-group bracketed">
          <h3 class="skill-group__label">${group.label}</h3>
          ${items}
        </div>
      `;
    })
    .join("");
}

function renderContact() {
  const actions = $("#contact-actions");

  const linkedinLink = profile.links.linkedin
    ? `<a class="contact__action bracketed" href="${profile.links.linkedin}" target="_blank" rel="noreferrer">LINKEDIN</a>`
    : "";

  actions.innerHTML = `
    <a class="contact__action bracketed" href="${profile.links.github}" target="_blank" rel="noreferrer">GITHUB</a>
    ${linkedinLink}
    <a class="contact__action bracketed" href="${profile.links.resume}" download>DOWNLOAD RESUME</a>
  `;
}

function initContactForm() {
  const form = $<HTMLFormElement>("#contact-form");
  const status = $("#contact-status");
  const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
  const originalLabel = submitBtn.textContent ?? "SEND TRANSMISSION";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const nameInput = $<HTMLInputElement>("#contact-name");
    const firstName = nameInput.value.trim().split(" ")[0] || "there";

    submitBtn.disabled = true;
    submitBtn.textContent = "SENDING...";
    status.classList.remove("contact-form__status--error");
    status.textContent = "";

    try {
      const formData = Array.from(new FormData(form).entries()) as [string, string][];
      const res = await fetch(window.location.pathname, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString(),
      });

      if (res.ok) {
        status.textContent = `Thanks, ${firstName} — message received. I'll get back to you soon.`;
        form.reset();
      } else {
        throw new Error(`Form endpoint returned ${res.status}`);
      }
    } catch (err) {
      // Keep the visitor-facing copy friendly, but never swallow the cause:
      // a silently-caught 404 here is indistinguishable from a network drop,
      // which makes a misconfigured Netlify form impossible to diagnose from
      // a bug report. The most common cause is form detection being off for
      // the site, so the POST hits a page that was never registered.
      console.warn("[contact] submission failed — form not delivered:", err);
      status.classList.add("contact-form__status--error");
      status.textContent = `Couldn't send that automatically — email me directly at ${profile.links.email} instead.`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });
}

function initInsertCoin() {
  const btn = $<HTMLButtonElement>("#insert-coin");
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  btn.hidden = !(hasTouch || hasFinePointer);
  btn.textContent = hasFinePointer ? "PRESS SPACE TO PLAY" : "TAP TO PLAY";

  async function launch() {
    const gameRoot = $("#game-root");
    if (!gameRoot.hidden) return;
    const { mountGame } = await import("./game/index");
    let total = 0;
    const scoreEl = $("#hud-score");
    mountGame(gameRoot, (delta) => {
      total += delta;
      scoreEl.textContent = Math.min(999999, total).toString().padStart(6, "0");
    });
  }

  btn.addEventListener("click", launch);
  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || !$("#game-root").hidden) return;
    // Don't steal Space from a focused control that handles it natively
    // (e.g. the project-card MISSION BRIEF toggle) — only treat it as the
    // global "press space to play" shortcut when nothing else claims it.
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, [contenteditable]")) return;
    e.preventDefault();
    launch();
  });
}

function init() {
  document.title = `${profile.name} — CS Student`;
  renderTagline();
  scrambleIn($(".hero__name"), 1500);
  scrambleIn($("#hero-tagline"), 1500);
  renderFormation();
  renderAbout();
  renderProjects();
  renderSkills();
  renderContact();
  initContactForm();
  initInsertCoin();

  initStarfield($<HTMLCanvasElement>("#starfield"));
  initHud($("#hud-score"), $("#hud-stage"));
  initScrollFx();
  initFlight();
  initProjectModal();
}

init();
