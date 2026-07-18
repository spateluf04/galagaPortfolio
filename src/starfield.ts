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

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
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
    ctx!.clearRect(0, 0, width, height);
    for (const star of stars) {
      star.y += star.speed;
      if (star.y > height) {
        star.y = 0;
        star.x = Math.random() * width;
      }
      ctx!.fillStyle = star.color;
      ctx!.fillRect(star.x, star.y, star.size, star.size);
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
