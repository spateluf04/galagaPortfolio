// Original pixel-grid enemy silhouettes (not derived from any existing game's sprites).
const ENEMY_GRIDS: string[][] = [
  // diamond drone
  ["..XX..", ".XXXX.", "XXXXXX", ".XXXX.", "..XX.."],
  // crab-claw
  ["X....X", "XX..XX", ".XXXX.", "XX..XX", "X....X"],
  // chevron swarmer
  [".X..X.", "XX..XX", "XXXXXX", ".XXXX.", "..XX.."],
];

export function enemyIconSvg(index: number, colorVar: string): string {
  const grid = ENEMY_GRIDS[index % ENEMY_GRIDS.length];
  const cell = 4;
  const rects: string[] = [];
  grid.forEach((row, y) => {
    row.split("").forEach((char, x) => {
      if (char === "X") {
        rects.push(
          `<rect x="${x * cell}" y="${y * cell}" width="${cell}" height="${cell}" fill="${colorVar}" />`,
        );
      }
    });
  });
  const w = grid[0].length * cell;
  const h = grid.length * cell;
  return `<svg viewBox="0 0 ${w} ${h}" width="28" height="20" shape-rendering="crispEdges" aria-hidden="true">${rects.join("")}</svg>`;
}
