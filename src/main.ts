import "./styles/base.css";
import "./styles/hud.css";
import "./styles/sections.css";
import { profile, projects, skillGroups, nav } from "./content";
import { initStarfield } from "./starfield";
import { initHud } from "./hud";
import { enemyIconSvg } from "./pixel-icons";
import { initReveal } from "./reveal";

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
  const factsList = $("#quick-facts");
  factsList.innerHTML = profile.quickFacts
    .map(
      (fact) =>
        `<li><span class="fact__label">${fact.label}</span><span>${fact.value}</span></li>`,
    )
    .join("");
}

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
      return `
        <li class="project-card bracketed">
          <div class="project-card__header">
            <span class="project-card__badge">${project.stage}</span>
            ${enemyIconSvg(index, "#ed93b1")}
          </div>
          <div class="project-card__shot" role="img" aria-label="Screenshot placeholder for ${project.title}">SCREENSHOT</div>
          <h3 class="project-card__title">${project.title}</h3>
          <p class="project-card__blurb">${project.blurb}</p>
          <p class="project-card__detail">${project.detail}</p>
          <ul class="project-card__tags">
            ${project.tech.map((tech) => `<li>${tech}</li>`).join("")}
          </ul>
          <div class="project-card__links">
            ${githubLink}
            ${demoLink}
          </div>
        </li>
      `;
    })
    .join("");
}

function renderSkills() {
  const grid = $("#skills-grid");
  grid.innerHTML = skillGroups
    .map(
      (group) => `
        <div class="skill-group bracketed">
          <h3 class="skill-group__label">${group.label}</h3>
          <ul class="skill-group__items">
            ${group.items.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      `,
    )
    .join("");
}

function renderContact() {
  const actions = $("#contact-actions");
  const emailUser = profile.links.email.split("@")[0];
  const emailDomain = profile.links.email.split("@")[1];

  const linkedinLink = profile.links.linkedin
    ? `<a class="contact__action bracketed" href="${profile.links.linkedin}" target="_blank" rel="noreferrer">LINKEDIN</a>`
    : "";

  actions.innerHTML = `
    <button class="contact__action bracketed" id="reveal-email" type="button">EMAIL ME</button>
    <a class="contact__action bracketed" href="${profile.links.github}" target="_blank" rel="noreferrer">GITHUB</a>
    ${linkedinLink}
    <a class="contact__action bracketed" href="${profile.links.resume}" download>DOWNLOAD RESUME</a>
  `;

  const revealBtn = $<HTMLButtonElement>("#reveal-email");
  revealBtn.addEventListener("click", () => {
    window.location.href = `mailto:${emailUser}@${emailDomain}`;
    revealBtn.textContent = `${emailUser}@${emailDomain}`;
  });
}

function initInsertCoin() {
  const btn = $<HTMLButtonElement>("#insert-coin");
  const hasTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  btn.hidden = !(hasTouch || hasFinePointer);

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
    if (e.code === "Space" && $("#game-root").hidden) {
      e.preventDefault();
      launch();
    }
  });
}

function init() {
  document.title = `${profile.name} — CS Student`;
  renderTagline();
  renderFormation();
  renderAbout();
  renderProjects();
  renderSkills();
  renderContact();
  initInsertCoin();

  initStarfield($<HTMLCanvasElement>("#starfield"));
  initHud($("#hud-score"), $("#hud-stage"));
  initReveal();
}

init();
