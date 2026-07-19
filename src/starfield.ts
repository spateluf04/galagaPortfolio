interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
}

const LAYER_COLORS = ["#3a3a52", "#b4b2a9", "#f1efe8"];

export function initStarfield(canvas: HTMLCanvasElement): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 639px)").matches;
  const starCount = isMobile ? 50 : 100;

  let stars: Star[] = [];
  let width = 0;
  let height = 0;
  let rafId = 0;
  let paused = document.hidden;
  let lastScrollY = window.scrollY;
  let warp = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = document.documentElement.clientWidth;
    height = document.documentElement.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function seedStars() {
    stars = Array.from({ length: starCount }, () => {
      const layer = Math.floor(Math.random() * 3);
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        size: layer + 1,
        speed: (layer + 1) * 0.15,
        color: LAYER_COLORS[layer],
      };
    });
  }

  function drawStatic() {
    ctx!.clearRect(0, 0, width, height);
    for (const star of stars) {
      ctx!.fillStyle = star.color;
      ctx!.fillRect(star.x, star.y, star.size, star.size);
    }
  }

  function tick() {
    if (paused) return;

    // Scroll-velocity "warp": fast scrolling stretches stars into streaks
    // and speeds their drift, relaxing back to points ~300ms after rest.
    const scrollDelta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    warp += (scrollDelta - warp) * 0.25;

    ctx!.clearRect(0, 0, width, height);
    for (const star of stars) {
      const drift = star.speed + warp * star.speed * 0.6;
      star.y += drift;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      } else if (star.y < 0) {
        star.y = height;
        star.x = Math.random() * width;
      }
      ctx!.fillStyle = star.color;
      const streak = Math.min(Math.abs(warp) * star.speed * 2, 40);
      if (streak > 1.5) {
        const streakY = drift >= 0 ? star.y - streak : star.y;
        ctx!.fillRect(star.x, streakY, star.size, star.size + streak);
      } else {
        ctx!.fillRect(star.x, star.y, star.size, star.size);
      }
    }
    rafId = requestAnimationFrame(tick);
  }

  resize();
  seedStars();

  if (reducedMotion) {
    drawStatic();
  } else {
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    resize();
    seedStars();
    if (reducedMotion) drawStatic();
  });

  document.addEventListener("visibilitychange", () => {
    paused = document.hidden;
    if (!paused && !reducedMotion) {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
    }
  });
}
