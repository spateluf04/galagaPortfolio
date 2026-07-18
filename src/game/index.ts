import "../styles/game.css";

const WIDTH = 320;
const HEIGHT = 480;
const PLAYER_SPEED = 220; // px/sec
const BULLET_SPEED = 340;
const FIRE_COOLDOWN = 0.25;
const ENEMY_COLS = 4;
const ENEMY_ROWS = 3;
const ENEMY_SIZE = 20;
const POINTS_PER_ENEMY = 100;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Enemy extends Rect {
  alive: boolean;
  baseX: number;
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export interface GameHandle {
  destroy(): void;
}

export function mountGame(root: HTMLElement, onScore: (delta: number) => void): GameHandle {
  root.innerHTML = "";
  root.hidden = false;

  const overlay = document.createElement("div");
  overlay.className = "game-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Easter egg mini-game");

  const closeBtn = document.createElement("button");
  closeBtn.className = "game-close";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Close game");
  closeBtn.textContent = "×";

  const canvas = document.createElement("canvas");
  canvas.className = "game-canvas";
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  const hint = document.createElement("p");
  hint.className = "game-hint";
  hint.textContent = "ARROWS / A-D TO MOVE · SPACE TO FIRE · DRAG + HOLD ON TOUCH · ESC TO EXIT";

  overlay.append(closeBtn, canvas, hint);
  root.appendChild(overlay);

  const ctx = canvas.getContext("2d")!;

  const player: Rect = { x: WIDTH / 2 - 12, y: HEIGHT - 40, w: 24, h: 16 };
  let moveDir = 0; // -1, 0, 1 from keyboard
  let dragX: number | null = null;
  let firing = false;
  let cooldown = 0;
  const bullets: Rect[] = [];
  const enemies: Enemy[] = [];
  let formationT = 0;
  let cleared = false;

  const marginX = (WIDTH - ENEMY_COLS * (ENEMY_SIZE + 12)) / 2;
  for (let row = 0; row < ENEMY_ROWS; row++) {
    for (let col = 0; col < ENEMY_COLS; col++) {
      const x = marginX + col * (ENEMY_SIZE + 12);
      enemies.push({
        x,
        baseX: x,
        y: 40 + row * (ENEMY_SIZE + 14),
        w: ENEMY_SIZE,
        h: ENEMY_SIZE,
        alive: true,
      });
    }
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") moveDir = -1;
    else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") moveDir = 1;
    else if (e.code === "Space") {
      firing = true;
      e.preventDefault();
    } else if (e.key === "Escape") {
      close();
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    if (["ArrowLeft", "a", "A", "ArrowRight", "d", "D"].includes(e.key)) moveDir = 0;
    if (e.code === "Space") firing = false;
  }

  function canvasX(clientX: number): number {
    const rect = canvas.getBoundingClientRect();
    return ((clientX - rect.left) / rect.width) * WIDTH;
  }

  function onTouchStart(e: TouchEvent) {
    e.preventDefault();
    dragX = canvasX(e.touches[0].clientX);
    firing = true;
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault();
    dragX = canvasX(e.touches[0].clientX);
  }

  function onTouchEnd(e: TouchEvent) {
    e.preventDefault();
    dragX = null;
    firing = false;
  }

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  closeBtn.addEventListener("click", close);

  function close() {
    document.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("keyup", onKeyUp);
    canvas.removeEventListener("touchstart", onTouchStart);
    canvas.removeEventListener("touchmove", onTouchMove);
    canvas.removeEventListener("touchend", onTouchEnd);
    cancelAnimationFrame(rafId);
    root.hidden = true;
    root.innerHTML = "";
  }

  let last = performance.now();
  let rafId = 0;

  function update(dt: number) {
    if (dragX !== null) {
      player.x += (dragX - (player.x + player.w / 2)) * Math.min(1, dt * 10);
    } else {
      player.x += moveDir * PLAYER_SPEED * dt;
    }
    player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));

    cooldown -= dt;
    if (firing && cooldown <= 0) {
      bullets.push({ x: player.x + player.w / 2 - 2, y: player.y, w: 4, h: 10 });
      cooldown = FIRE_COOLDOWN;
    }

    for (const b of bullets) b.y -= BULLET_SPEED * dt;
    for (let i = bullets.length - 1; i >= 0; i--) {
      if (bullets[i].y + bullets[i].h < 0) bullets.splice(i, 1);
    }

    formationT += dt;
    const sway = Math.sin(formationT) * 16;
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      enemy.x = enemy.baseX + sway;
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      for (let i = bullets.length - 1; i >= 0; i--) {
        if (intersects(bullets[i], enemy)) {
          enemy.alive = false;
          bullets.splice(i, 1);
          onScore(POINTS_PER_ENEMY);
          break;
        }
      }
    }

    cleared = enemies.every((e) => !e.alive);
  }

  function draw() {
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = "#5dcaa5";
    ctx.fillRect(player.x, player.y, player.w, player.h);

    ctx.fillStyle = "#fac775";
    for (const b of bullets) ctx.fillRect(b.x, b.y, b.w, b.h);

    ctx.fillStyle = "#ed93b1";
    for (const enemy of enemies) {
      if (enemy.alive) ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
    }

    if (cleared) {
      ctx.fillStyle = "#fac775";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.fillText("WAVE CLEAR", WIDTH / 2, HEIGHT / 2);
    }
  }

  function loop(now: number) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  rafId = requestAnimationFrame(loop);

  return { destroy: close };
}
