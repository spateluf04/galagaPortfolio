// Original pixel-grid art. Everything here is a hand-drawn abstract glyph,
// not a reproduction of any game sprite or company logo.

function gridToSvg(grid: string[], color: string, size: number): string {
  const cell = 4;
  const rects: string[] = [];
  grid.forEach((row, y) => {
    row.split("").forEach((char, x) => {
      if (char === "X") {
        rects.push(
          `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${color}" />`,
        );
      }
    });
  });
  const w = grid[0].length * cell;
  const h = grid.length * cell;
  return `<svg viewBox="0 0 ${w} ${h}" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">${rects.join("")}</svg>`;
}

const ENEMY_GRIDS: string[][] = [
  // diamond drone
  ["..XX..", ".XXXX.", "XXXXXX", ".XXXX.", "..XX.."],
  // crab-claw
  ["X....X", "XX..XX", ".XXXX.", "XX..XX", "X....X"],
  // chevron swarmer
  [".X..X.", "XX..XX", "XXXXXX", ".XXXX.", "..XX.."],
];

export function enemyIconSvg(index: number, colorVar: string): string {
  return gridToSvg(ENEMY_GRIDS[index % ENEMY_GRIDS.length], colorVar, 28);
}

// Abstract pixel glyphs for skill items — original shapes evoking each
// concept (a coiled "S" for Python, a hexagon for Node, etc), not the
// official brand marks.
const SKILL_GRIDS: Record<string, string[]> = {
  Python: [".XXXX...", "X....X..", "X.......", ".XXXX...", ".....X..", "X....X..", ".XXXX...", "........"],
  "JavaScript / TypeScript": [
    "....XX..",
    "...XX...",
    "..XX....",
    ".XXXXXX.",
    "....XX..",
    "...XX...",
    "..XX....",
    "........",
  ],
  "C++": ["........", ".X...X..", ".X...X..", "XXX.XXX.", ".X...X..", ".X...X..", "........", "........"],
  React: ["..XXXX..", ".X....X.", "X..XX..X", "X..XX..X", "X..XX..X", "X..XX..X", ".X....X.", "..XXXX.."],
  "React Native / Expo": [
    ".XXXXX..",
    ".X...X..",
    ".X...X..",
    ".X...X..",
    ".X...X..",
    ".X...X..",
    ".X.X.X..",
    ".XXXXX..",
  ],
  "Next.js": ["X....X..", ".X....X.", "..X....X", ".X....X.", "X....X..", "........", "........", "........"],
  Node: ["..XXXX..", ".X....X.", "X......X", "X......X", "X......X", "X......X", ".X....X.", "..XXXX.."],
  Git: ["X....X..", "X....X..", ".X..X...", "..XX....", "...X....", "...X....", "...X....", "........"],
  "Firebase / Firestore": [
    "...X....",
    "..XXX...",
    "..XXX...",
    ".XXXXX..",
    ".XXXXX..",
    ".XXXXX..",
    "..XXX...",
    "...X....",
  ],
  "Linux / WSL2": ["XXXXXXXX", "X......X", "X.X.....", "X.XX....", "X.X.....", "X.......", "X......X", "XXXXXXXX"],
  "VS Code": ["...X..X.", "..X....X", ".X......", "X.......", "X.......", ".X......", "..X....X", "...X..X."],
};

const FALLBACK_GRID: string[] = ["........", "..XXXX..", ".X....X.", ".X....X.", ".X....X.", ".X....X.", "..XXXX..", "........"];

export function skillIconSvg(name: string, colorVar: string): string {
  return gridToSvg(SKILL_GRIDS[name] ?? FALLBACK_GRID, colorVar, 24);
}

// Same silhouette as the static hero ship (index.html), but with the
// thruster rects tagged so flight.ts can drive their scale as a CSS var.
export function shipSvg(size: number): string {
  return `<svg viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">
    <rect class="ship-hull" x="7" y="1" width="2" height="2" />
    <rect class="ship-hull" x="6" y="3" width="4" height="2" />
    <rect class="ship-hull" x="5" y="5" width="6" height="2" />
    <rect class="ship-hull" x="3" y="7" width="10" height="2" />
    <rect class="ship-hull" x="1" y="9" width="14" height="2" />
    <rect class="ship-thruster flight-ship__flame" x="4" y="11" width="2" height="2" />
    <rect class="ship-thruster flight-ship__flame" x="10" y="11" width="2" height="2" />
  </svg>`;
}
