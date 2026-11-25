// layout.js — the kitchen floor plan. One source of truth for where every
// station sits, shared by input.js (hit tests) and render.js (drawing).

export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 56 },
  // Three order-ticket slots across the top.
  orders: [
    { x: 24, y: 68, w: 150, h: 116 },
    { x: 186, y: 68, w: 150, h: 116 },
    { x: 348, y: 68, w: 150, h: 116 },
  ],
  // Serve window, top right.
  serve: { x: 1016, y: 68, w: 240, h: 116 },
  // Grill with two patty slots.
  grill: { x: 24, y: 212, w: 300, h: 200 },
  grillSlots: [
    { x: 44, y: 252, w: 124, h: 124 },
    { x: 180, y: 252, w: 124, h: 124 },
  ],
  // Chopping board.
  board: { x: 348, y: 212, w: 300, h: 200 },
  // Assembly plate.
  plate: { x: 672, y: 212, w: 320, h: 200 },
  plateCenter: { x: 832, y: 322 },
  // Trash bin.
  trash: { x: 1016, y: 212, w: 240, h: 96 },
  // Ingredient bins along the bottom: six of them.
  bins: [
    { x: 24, y: 448, w: 190, h: 150 },
    { x: 226, y: 448, w: 190, h: 150 },
    { x: 428, y: 448, w: 190, h: 150 },
    { x: 630, y: 448, w: 190, h: 150 },
    { x: 832, y: 448, w: 190, h: 150 },
    { x: 1034, y: 448, w: 190, h: 150 },
  ],
  footer: { x: 0, y: 628, w: 1280, h: 92 },
};

export function hit(x, y, rect) {
  return x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h;
}

export function center(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}
