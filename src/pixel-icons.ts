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

// Multi-tone variant of gridToSvg: each character keys into a palette, so a
// grid can carry more than one colour. "." is transparent.
function shadeGridToSvg(grid: string[], palette: Record<string, string>, size: number): string {
  const cell = 4;
  const rects: string[] = [];
  grid.forEach((row, y) => {
    row.split("").forEach((char, x) => {
      const fill = palette[char];
      if (!fill) return;
      rects.push(
        `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${fill}" />`,
      );
    });
  });
  const w = grid[0].length * cell;
  const h = grid.length * cell;
  return `<svg viewBox="0 0 ${w} ${h}" width="${size}" height="${size}" shape-rendering="crispEdges" aria-hidden="true">${rects.join("")}</svg>`;
}

// Hand-authored pixel portrait of Samir, drawn from a reference photo the way
// an artist would work from one — every cell is placed by hand, not traced or
// auto-downsampled (a straight luminance downsample of the source photo turns
// to mush at this resolution). Palette is deliberately pulled from the site
// tokens so the portrait sits inside the arcade look instead of fighting it.
//   h hair   k glasses   s skin   d skin shadow   w white
//   b bindi  j jacket    g gold chain             z zipper
const PORTRAIT_GRID: string[] = [
  "...........h..hh...h............",
  "..........hhhhhhhhhhhh..........",
  "........hhhhhhhhhhhhhhhh........",
  ".......hhhhhhhhhhhhhhhhhh.......",
  "......hhhhhhhhhhhhhhhhhhhh......",
  "......hhhhhhhhhhhhhhhhhhhh......",
  "......hhhhsssssssssssshhhh......",
  "......hhhssssssbbsssssshhh......",
  "......hhhsssssssssssssshhh......",
  "......hhsssssssssssssssshh......",
  "......hhsshhhhhsshhhhhsshh......",
  "......hhsssssssssssssssshh......",
  "......hhkkkkkksssskkkkkkhh......",
  "......hhksssskssssksssskhh......",
  "......hhkweewksssskweewkhh......",
  "......hhkkkkkksssskkkkkkhh......",
  "......hhsssssssddssssssshh......",
  "......hhssssssddddsssssshh......",
  "......hhssssswwwwwwssssshh......",
  "......hhssssssddddsssssshh......",
  "......hhsssssssssssssssshh......",
  ".......hssssssssssssssssh.......",
  "........hssssssssssssssh........",
  ".........hssssssssssssh.........",
  "...........hssssssssh...........",
  ".......jjjjjdssssssdjjjjj.......",
  "....jjjjjjjjdssssssdjjjjjjjj....",
  "..jjjjjjjjjjgssssssgjjjjjjjjjj..",
  "jjjjjjjjjjjjggssssggjjjjjjjjjjjj",
  "jjjjjjjjjjjjjjggggjjjjjjjjjjjjjj",
  "jjjjjjjjjjjjjjjzzjjjjjjjjjjjjjjj",
  "jjjjjjjjjjjjjjjzzjjjjjjjjjjjjjjj",
];

const PORTRAIT_PALETTE: Record<string, string> = {
  h: "#33355c", // hair, brows, and the sideburn frame around the face
  k: "#15162a", // glasses frame
  s: "#e8b07a", // skin
  d: "#b8804e", // skin in shadow (nose, jaw, neck)
  w: "#fdfdff", // smile
  e: "#15162a", // pupils
  b: "var(--accent-pink)", // bindi
  j: "#3a3d63", // jacket — kept well above the page background so the
                // shoulders still read as a silhouette on #050510
  g: "#f0b83f", // gold chain
  z: "#8a8db5", // zipper
};

export function avatarSvg(size = 160): string {
  return shadeGridToSvg(PORTRAIT_GRID, PORTRAIT_PALETTE, size);
}

const ENEMY_GRIDS: string[][] = [
  // diamond drone
  ["..XX..", ".XXXX.", "XXXXXX", ".XXXX.", "..XX.."],
  // crab-claw
  ["X....X", "XX..XX", ".XXXX.", "XX..XX", "X....X"],
  // chevron swarmer
  [".X..X.", "XX..XX", "XXXXXX", ".XXXX.", "..XX.."],
];

export function enemyIconSvg(index: number, colorVar: string, size = 28): string {
  return gridToSvg(ENEMY_GRIDS[index % ENEMY_GRIDS.length], colorVar, size);
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
