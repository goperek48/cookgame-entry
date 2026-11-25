// config.js — constants, ingredients and recipes for Sizzle & Serve.
// One clear job: everything tunable about the game lives here.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const DAY_SECONDS = 150;
export const MAX_STRIKES = 3;
export const MAX_ORDERS = 3;
export const ORDER_EVERY_MS = 12000;
export const ORDER_PATIENCE_MS = 45000;

export const GRILL_COOK_MS = 6000;
export const GRILL_BURN_MS = 12000;
export const CHOPS_NEEDED = 3;

// Ingredient catalogue. `needs` says what must happen before it can go on
// the plate: 'grill' (raw patty), 'chop' (lettuce / tomato) or 'none'.
export const INGREDIENTS = {
  bun: { id: 'bun', name: 'Bun', key: '1', color: '#e8a94f', dark: '#b97f2e', needs: 'none' },
  patty: { id: 'patty', name: 'Patty', key: '2', color: '#8a5a33', dark: '#5f3a1d', needs: 'grill' },
  lettuce: { id: 'lettuce', name: 'Lettuce', key: '3', color: '#5fb84a', dark: '#3d8a2e', needs: 'chop' },
  tomato: { id: 'tomato', name: 'Tomato', key: '4', color: '#e04a3a', dark: '#a92e22', needs: 'chop' },
  cheese: { id: 'cheese', name: 'Cheese', key: '5', color: '#f7c948', dark: '#d9a41f', needs: 'none' },
  onion: { id: 'onion', name: 'Onion', key: '6', color: '#f2eef5', dark: '#c9bdd4', needs: 'none' },
};

export const BIN_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'onion'];

export const CUSTOMERS = [
  'Maya', 'Riko', 'Sari', 'Dimas', 'Lina', 'Bimo', 'Nadia', 'Arka',
  'Tania', 'Yoga', 'Putri', 'Fajar', 'Rani', 'Dewi', 'Agus', 'Sinta',
];

// Deterministic RNG (mulberry32) so screenshot staging is reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

// A recipe is a list of ingredient ids. Every burger starts and ends with a
// bun; the middle is 1-4 fillings, usually including a patty.
export function makeRecipe(rng) {
  const middle = [];
  const n = 1 + Math.floor(rng() * 4);
  const pool = ['patty', 'patty', 'patty', 'lettuce', 'tomato', 'cheese', 'onion', 'cheese'];
  for (let i = 0; i < n; i++) middle.push(pick(rng, pool));
  if (!middle.includes('patty') && rng() < 0.8) middle.splice(Math.floor(rng() * (middle.length + 1)), 0, 'patty');
  return ['bun', ...middle, 'bun'];
}

export function recipeName(recipe) {
  const fill = recipe.filter((i) => i !== 'bun');
  const patties = fill.filter((i) => i === 'patty').length;
  if (patties >= 2) return 'Double Stack';
  if (fill.includes('cheese') && fill.includes('onion')) return 'Cheesy Onion Melt';
  if (fill.includes('lettuce') && fill.includes('tomato')) return 'Garden Classic';
  if (fill.includes('cheese')) return 'Cheese Deluxe';
  if (fill.includes('tomato')) return 'Tomato Fresh';
  return 'House Burger';
}

export function recipeValue(recipe) {
  return 6 + 4 * (recipe.length - 2);
}
