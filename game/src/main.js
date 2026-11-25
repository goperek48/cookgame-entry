// main.js — boot and game loop for Sizzle & Serve. Owns the game state,
// the frame loop, and the wiring between input, kitchen, orders and render.

import { CANVAS_H, CANVAS_W, DAY_SECONDS, MAX_STRIKES, makeRng } from './config.js';
import { ensureAudio, setSizzle, sfx, stopSizzle } from './audio.js';
import { newKitchen, tickGrill } from './kitchen.js';
import { spawnOrder, tickOrders } from './orders.js';
import { handleClick, handleKey, floatText } from './input.js';
import { render } from './render.js';
import { applyShot, readShotQuery } from './shots.js';

export function createState(seed) {
  const state = {
    screen: 'title',
    rng: makeRng(seed || (Date.now() % 2147483647)),
    timeLeftMs: DAY_SECONDS * 1000,
    coins: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    strikes: 0,
    orders: [],
    orderTimer: 0,
    kitchen: newKitchen(),
    floats: [],
    mouse: { x: 640, y: 360 },
    paused: false,
    frozen: false, // screenshot staging freezes the clock without showing PAUSED
  };
  state.startGame = () => startGame(state);
  state.restartGame = () => startGame(state);
  state.togglePause = () => {
    if (state.screen !== 'playing') return;
    state.paused = !state.paused;
    if (state.paused) setSizzle(false);
    sfx.click();
  };
  return state;
}

function startGame(state) {
  state.screen = 'playing';
  state.timeLeftMs = DAY_SECONDS * 1000;
  state.coins = 0;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.served = 0;
  state.strikes = 0;
  state.orders = [];
  state.orderTimer = 0;
  state.kitchen = newKitchen();
  state.floats = [];
  state.paused = false;
  spawnOrder(state);
  spawnOrder(state);
  sfx.click();
}

function endDay(state) {
  state.screen = 'over';
  stopSizzle();
  sfx.over();
}

function tick(state, dtMs) {
  if (state.screen !== 'playing' || state.paused || state.frozen) return;
  state.timeLeftMs -= dtMs;
  const walked = tickOrders(state, dtMs);
  for (const order of walked) {
    state.strikes += 1;
    state.combo = 0;
    sfx.walkout();
    floatText(state, 273, 130, `${order.customer} walked out!`, '#ff9d9d');
  }
  tickGrill(
    state.kitchen,
    dtMs,
    () => sfx.done(),
    () => floatText(state, 174, 230, 'A patty burnt!', '#ff9d9d'),
  );
  for (const f of state.floats) f.t += dtMs;
  state.floats = state.floats.filter((f) => f.t < f.life);
  if (state.strikes >= MAX_STRIKES || state.timeLeftMs <= 0) {
    state.timeLeftMs = Math.max(0, state.timeLeftMs);
    endDay(state);
  }
}

function boot() {
  const canvas = document.getElementById('game');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  const state = createState(20261125);
  window.SIZZLE = state; // live game state, handy for play-testing and debugging

  const shot = readShotQuery();
  if (shot) applyShot(state, shot);

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    state.mouse = {
      x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  });
  canvas.addEventListener('click', (e) => {
    ensureAudio();
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_W;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_H;
    handleClick(state, x, y);
  });
  window.addEventListener('keydown', (e) => {
    if ([' ', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.preventDefault();
    ensureAudio();
    handleKey(state, e.key);
  });

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(100, now - last);
    last = now;
    tick(state, dt);
    render(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
