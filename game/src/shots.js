// shots.js — screenshot staging for Sizzle & Serve. Reads ?shot=start|play|end
// (and &seed=N) and arranges a real game state for the camera: the title
// screen, a dish mid-assembly with a patty on the grill, or the day-over
// score screen. The staged state is a genuine game state, rendered by the
// same code the player sees; the clock is frozen so the shot is stable.

import { newOrder } from './orders.js';

export function readShotQuery() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seed = Number(params.get('seed') || '1');
  if (!shot || !['start', 'play', 'end'].includes(shot)) return null;
  return { shot, seed: Number.isFinite(seed) ? seed : 1 };
}

function stagedOrder(rng, recipe, patienceFrac) {
  const order = newOrder(rng);
  order.recipe = recipe;
  order.patience = Math.round(order.maxPatience * patienceFrac);
  return order;
}

export function applyShot(state, { shot, seed }) {
  const rng = state.rng;
  void seed;
  if (shot === 'start') {
    state.screen = 'title';
    state.orders = [
      stagedOrder(rng, ['bun', 'patty', 'lettuce', 'tomato', 'bun'], 0.8),
      stagedOrder(rng, ['bun', 'patty', 'cheese', 'onion', 'bun'], 0.55),
    ];
    state.timeLeftMs = 150 * 1000;
    state.coins = 0;
    return;
  }
  if (shot === 'play') {
    state.screen = 'playing';
    state.frozen = true; // freeze the clock for a stable screenshot
    state.timeLeftMs = 133 * 1000;
    state.coins = 47;
    state.score = 1250;
    state.combo = 3;
    state.bestCombo = 4;
    state.served = 5;
    state.orders = [
      stagedOrder(rng, ['bun', 'patty', 'lettuce', 'tomato', 'cheese', 'bun'], 0.62),
      stagedOrder(rng, ['bun', 'patty', 'patty', 'cheese', 'bun'], 0.38),
      stagedOrder(rng, ['bun', 'patty', 'onion', 'bun'], 0.85),
    ];
    // One patty mid-grill, one ready to collect.
    state.kitchen.grill[0] = { state: 'cooking', t: 3200, donePinged: false };
    state.kitchen.grill[1] = { state: 'done', t: 6100, donePinged: true };
    // Tomato two chops in on the board.
    state.kitchen.board = { item: 'tomato', chops: 2 };
    // A burger mid-assembly on the plate, cheese in hand.
    state.kitchen.plate = ['bun', 'patty', 'lettuce'];
    state.kitchen.held = 'cheese';
    state.mouse = { x: 832, y: 330 };
    return;
  }
  // shot === 'end'
  state.screen = 'over';
  state.strikes = 3;
  state.coins = 128;
  state.score = 3420;
  state.served = 14;
  state.bestCombo = 6;
  state.timeLeftMs = 0;
  state.orders = [];
}
