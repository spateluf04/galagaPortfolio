import "../styles/game.css";

const WIDTH = 320;
const HEIGHT = 480;
const PLAYER_SPEED = 220; // px/sec
const BULLET_SPEED = 340;
const FIRE_COOLDOWN = 0.25;
const RAPID_FIRE_COOLDOWN = 0.12;
const SPREAD_ANGLE = 0.26; // radians, half-angle of the 3-way fan
const PLAYER_INVULN_TIME = 1.5;
const BUFF_DURATION = 8;
const POWERUP_DROP_CHANCE = 0.18;
const POWERUP_SPEED = 60;
const MAX_ENEMY_BULLETS = 6;
const ENEMY_BULLET_BASE_SPEED = 150;
const WAVE_CLEAR_PAUSE = 1.6;
const PLAYER_CELL = 2;
const ENEMY_CELL = 3;

type EnemyType = "drone" | "striker" | "elite";
type PowerKind = "rapid" | "spread" | "shield";
type Phase = "playing" | "wave-clear" | "over";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Bullet extends Rect {
  vx: number;
  vy: number;
}

interface Enemy extends Rect {
  alive: boolean;
  type: EnemyType;
  hp: number;
  baseX: number;
  fireCooldown: number;
}

interface PowerUp extends Rect {
  kind: PowerKind;
}

function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// Original pixel-grid sprites, hand-drawn for this game specifically —
// not a reproduction of any existing game's ship/enemy designs.
const SHIP_GRID = [
  "................",
  ".......CC.......",
  ".......CC.......",
  "......CXXC......",
  "......XXXX......",
  ".....XXXXXX.....",
  "....XXXXXXXX....",
  "....XXXXXXXX....",
  "...XXXXXXXXXX...",
  "..XXXXXXXXXXXX..",
  ".XXXXXXXXXXXXXX.",
  ".XX.XXXXXXXX.XX.",
  "..X..TT..TT..X..",
  ".....TT..TT.....",
];

const ENEMY_GRIDS: Record<EnemyType, string[]> = {
  drone: ["..XXXX..", ".XXXXXX.", "XX.XX.XX", "XXXXXXXX", ".XX..XX.", "X......X"],
  striker: ["X......X", "XX....XX", ".XX..XX.", "..XXXX..", ".XX..XX.", "XX....XX"],
  elite: [
    "..XXXX..",
    ".XXXXXX.",
    "XXXXXXXX",
    "XX.XX.XX",
    "XXXXXXXX",
    ".X.XX.X.",
    "X.X..X.X",
  ],
};

const ENEMY_COLORS: Record<EnemyType, string> = {
  drone: "#ed93b1",
  striker: "#5dcaa5",
  elite: "#fac775",
};
const ENEMY_HP: Record<EnemyType, number> = { drone: 1, striker: 1, elite: 2 };
const ENEMY_POINTS: Record<EnemyType, number> = { drone: 50, striker: 80, elite: 150 };
const ENEMY_DIMS: Record<EnemyType, { w: number; h: number }> = {
  drone: { w: ENEMY_GRIDS.drone[0].length * ENEMY_CELL, h: ENEMY_GRIDS.drone.length * ENEMY_CELL },
  striker: {
    w: ENEMY_GRIDS.striker[0].length * ENEMY_CELL,
    h: ENEMY_GRIDS.striker.length * ENEMY_CELL,
  },
  elite: { w: ENEMY_GRIDS.elite[0].length * ENEMY_CELL, h: ENEMY_GRIDS.elite.length * ENEMY_CELL },
};

const POWERUP_COLORS: Record<PowerKind, string> = {
  rapid: "#fac775",
  spread: "#ed93b1",
  shield: "#5dcaa5",
};
const POWERUP_LABELS: Record<PowerKind, string> = { rapid: "R", spread: "S", shield: "O" };
const POWERUP_KINDS: PowerKind[] = ["rapid", "spread", "shield"];

function drawGrid(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  x: number,
  y: number,
  cell: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let row = 0; row < grid.length; row++) {
    const line = grid[row];
    for (let col = 0; col < line.length; col++) {
      if (line[col] !== ".") ctx.fillRect(x + col * cell, y + row * cell, cell, cell);
    }
  }
}

interface WaveConfig {
  cols: number;
  rows: number;
  speedMul: number;
  fireInterval: number;
  eliteChance: number;
  bulletSpeed: number;
}

function waveConfig(n: number): WaveConfig {
  return {
    cols: Math.min(4 + Math.floor(n / 2), 7),
    rows: Math.min(3 + Math.floor(n / 3), 5),
    speedMul: 1 + n * 0.1,
    fireInterval: Math.max(2200 - n * 180, 650),
    eliteChance: Math.min(0.15 + n * 0.05, 0.5),
    bulletSpeed: ENEMY_BULLET_BASE_SPEED + n * 8,
  };
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
  hint.textContent =
    "ARROWS / A-D TO MOVE · SPACE TO FIRE · DRAG + HOLD ON TOUCH · ESC TO EXIT";

  overlay.append(closeBtn, canvas, hint);
  root.appendChild(overlay);

  const ctx = canvas.getContext("2d")!;

  let player: Rect = { x: WIDTH / 2 - 16, y: HEIGHT - 54, w: 32, h: 28 };
  let moveDir = 0; // -1, 0, 1 from keyboard
  let dragX: number | null = null;
  let firing = false;
  let fireCooldownTimer = 0;
  let invulnTimer = 0;
  let waveClearTimer = 0;
  let bullets: Bullet[] = [];
  let enemyBullets: Bullet[] = [];
  let enemies: Enemy[] = [];
  let powerUps: PowerUp[] = [];
  let formationT = 0;
  let waveIndex = 0;
  let lives = 3;
  let phase: Phase = "playing";
  let currentWave = waveConfig(0);
  const buffs: Record<PowerKind, number> = { rapid: 0, spread: 0, shield: 0 };

  function resetPlayer() {
    player = { x: WIDTH / 2 - 16, y: HEIGHT - 54, w: 32, h: 28 };
  }

  function spawnWave() {
    currentWave = waveConfig(waveIndex);
    const { cols, rows, eliteChance } = currentWave;
    const slotW = 34;
    const slotH = 38;
    const marginX = (WIDTH - cols * slotW) / 2;
    enemies = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        let type: EnemyType;
        if (row === rows - 1) type = "drone";
        else if (row === 0 && Math.random() < eliteChance) type = "elite";
        else type = "striker";

        const dims = ENEMY_DIMS[type];
        const x = marginX + col * slotW + (slotW - dims.w) / 2;
        const y = 36 + row * slotH;

        enemies.push({
          x,
          y,
          w: dims.w,
          h: dims.h,
          baseX: x,
          alive: true,
          type,
          hp: ENEMY_HP[type],
          fireCooldown: randRange(currentWave.fireInterval * 0.4, currentWave.fireInterval * 1.2) / 1000,
        });
      }
    }
    enemyBullets = [];
  }

  function resetGame() {
    waveIndex = 0;
    lives = 3;
    bullets = [];
    powerUps = [];
    buffs.rapid = 0;
    buffs.spread = 0;
    buffs.shield = 0;
    invulnTimer = 0;
    fireCooldownTimer = 0;
    phase = "playing";
    resetPlayer();
    spawnWave();
  }

  spawnWave();

  function onKeyDown(e: KeyboardEvent) {
    if (phase === "over" && (e.code === "Space" || e.key === "Enter")) {
      e.preventDefault();
      resetGame();
      return;
    }
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
    if (phase === "over") {
      resetGame();
      return;
    }
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

  function fireBullet() {
    const originX = player.x + player.w / 2 - 2;
    const originY = player.y;
    if (buffs.spread > 0) {
      for (const angle of [-SPREAD_ANGLE, 0, SPREAD_ANGLE]) {
        bullets.push({
          x: originX,
          y: originY,
          w: 4,
          h: 10,
          vx: Math.sin(angle) * BULLET_SPEED,
          vy: -Math.cos(angle) * BULLET_SPEED,
        });
      }
    } else {
      bullets.push({ x: originX, y: originY, w: 4, h: 10, vx: 0, vy: -BULLET_SPEED });
    }
  }

  function spawnPowerUp(from: Enemy) {
    const kind = POWERUP_KINDS[Math.floor(Math.random() * POWERUP_KINDS.length)];
    powerUps.push({ x: from.x + from.w / 2 - 6, y: from.y, w: 12, h: 12, kind });
  }

  function hitPlayer() {
    lives -= 1;
    invulnTimer = PLAYER_INVULN_TIME;
    if (lives <= 0) phase = "over";
  }

  function update(dt: number) {
    if (phase === "over") return;

    if (phase === "wave-clear") {
      waveClearTimer -= dt;
      if (waveClearTimer <= 0) {
        waveIndex += 1;
        spawnWave();
        phase = "playing";
      }
      return;
    }

    buffs.rapid = Math.max(0, buffs.rapid - dt);
    buffs.spread = Math.max(0, buffs.spread - dt);
    buffs.shield = Math.max(0, buffs.shield - dt);
    invulnTimer = Math.max(0, invulnTimer - dt);

    if (dragX !== null) {
      player.x += (dragX - (player.x + player.w / 2)) * Math.min(1, dt * 10);
    } else {
      player.x += moveDir * PLAYER_SPEED * dt;
    }
    player.x = Math.max(0, Math.min(WIDTH - player.w, player.x));

    fireCooldownTimer -= dt;
    const cooldown = buffs.rapid > 0 ? RAPID_FIRE_COOLDOWN : FIRE_COOLDOWN;
    if (firing && fireCooldownTimer <= 0) {
      fireBullet();
      fireCooldownTimer = cooldown;
    }

    for (const b of bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    bullets = bullets.filter((b) => b.y + b.h > 0);

    formationT += dt * currentWave.speedMul;
    const sway = Math.sin(formationT) * 16;
    for (const enemy of enemies) {
      if (enemy.alive) enemy.x = enemy.baseX + sway;
    }

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      enemy.fireCooldown -= dt;
      if (enemy.fireCooldown <= 0 && enemyBullets.length < MAX_ENEMY_BULLETS) {
        const dx = player.x + player.w / 2 - (enemy.x + enemy.w / 2);
        const dy = player.y - (enemy.y + enemy.h);
        const dist = Math.hypot(dx, dy) || 1;
        const speed = currentWave.bulletSpeed;
        enemyBullets.push({
          x: enemy.x + enemy.w / 2 - 2,
          y: enemy.y + enemy.h,
          w: 4,
          h: 10,
          vx: (dx / dist) * speed,
          vy: (dy / dist) * speed,
        });
        enemy.fireCooldown =
          randRange(currentWave.fireInterval * 0.6, currentWave.fireInterval * 1.4) / 1000;
      }
    }

    for (const b of enemyBullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    enemyBullets = enemyBullets.filter((b) => b.y < HEIGHT + 20 && b.y > -20);

    for (const p of powerUps) p.y += POWERUP_SPEED * dt;
    powerUps = powerUps.filter((p) => p.y < HEIGHT + 20);

    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      for (let i = bullets.length - 1; i >= 0; i--) {
        if (intersects(bullets[i], enemy)) {
          bullets.splice(i, 1);
          enemy.hp -= 1;
          if (enemy.hp <= 0) {
            enemy.alive = false;
            onScore(ENEMY_POINTS[enemy.type]);
            if (Math.random() < POWERUP_DROP_CHANCE) spawnPowerUp(enemy);
          }
          break;
        }
      }
    }

    const invulnerable = invulnTimer > 0 || buffs.shield > 0;
    if (!invulnerable) {
      for (let i = enemyBullets.length - 1; i >= 0; i--) {
        if (intersects(enemyBullets[i], player)) {
          enemyBullets.splice(i, 1);
          hitPlayer();
          break;
        }
      }
      for (const enemy of enemies) {
        if (enemy.alive && intersects(enemy, player)) {
          enemy.alive = false;
          hitPlayer();
          break;
        }
      }
    }

    for (let i = powerUps.length - 1; i >= 0; i--) {
      if (intersects(powerUps[i], player)) {
        buffs[powerUps[i].kind] = BUFF_DURATION;
        powerUps.splice(i, 1);
      }
    }

    if (phase === "playing" && enemies.every((e) => !e.alive)) {
      phase = "wave-clear";
      waveClearTimer = WAVE_CLEAR_PAUSE;
    }
  }

  function drawHud() {
    ctx.fillStyle = "#f1efe8";
    ctx.font = "10px monospace";
    ctx.textBaseline = "top";
    ctx.textAlign = "left";
    ctx.fillText(`WAVE ${waveIndex + 1}`, 6, 6);
    ctx.textAlign = "right";
    ctx.fillText(`LIVES ${lives}`, WIDTH - 6, 6);

    ctx.textAlign = "left";
    POWERUP_KINDS.forEach((kind, i) => {
      const active = buffs[kind] > 0;
      const bx = 6 + i * 16;
      const by = 20;
      ctx.fillStyle = active ? POWERUP_COLORS[kind] : "#3a3a52";
      ctx.fillRect(bx, by, 12, 12);
      ctx.fillStyle = active ? "#050510" : "#b4b2a9";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(POWERUP_LABELS[kind], bx + 6, by + 7);
    });
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function drawPowerUp(p: PowerUp) {
    ctx.fillStyle = POWERUP_COLORS[p.kind];
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = "#050510";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(POWERUP_LABELS[p.kind], p.x + p.w / 2, p.y + p.h / 2 + 1);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }

  function draw() {
    ctx.fillStyle = "#050510";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const showPlayer = phase !== "over" && (invulnTimer <= 0 || Math.floor(invulnTimer * 10) % 2 === 0);
    if (showPlayer) {
      drawGrid(ctx, SHIP_GRID, player.x, player.y, PLAYER_CELL, "#5dcaa5");
      if (buffs.shield > 0) {
        ctx.strokeStyle = "#5dcaa5";
        ctx.globalAlpha = 0.6;
        ctx.strokeRect(player.x - 3, player.y - 3, player.w + 6, player.h + 6);
        ctx.globalAlpha = 1;
      }
    }

    ctx.fillStyle = "#fac775";
    for (const b of bullets) ctx.fillRect(b.x, b.y, b.w, b.h);

    for (const enemy of enemies) {
      if (enemy.alive) drawGrid(ctx, ENEMY_GRIDS[enemy.type], enemy.x, enemy.y, ENEMY_CELL, ENEMY_COLORS[enemy.type]);
    }

    ctx.fillStyle = "#ff4d6d";
    for (const b of enemyBullets) ctx.fillRect(b.x, b.y, b.w, b.h);

    for (const p of powerUps) drawPowerUp(p);

    drawHud();

    if (phase === "wave-clear") {
      ctx.fillStyle = "#fac775";
      ctx.font = "16px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(`WAVE ${waveIndex + 1} CLEAR`, WIDTH / 2, HEIGHT / 2);
    } else if (phase === "over") {
      ctx.fillStyle = "#ed93b1";
      ctx.font = "18px monospace";
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("GAME OVER", WIDTH / 2, HEIGHT / 2 - 12);
      ctx.fillStyle = "#f1efe8";
      ctx.font = "10px monospace";
      ctx.fillText("SPACE / TAP TO CONTINUE", WIDTH / 2, HEIGHT / 2 + 12);
    }
  }

  let last = performance.now();
  let rafId = 0;

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
