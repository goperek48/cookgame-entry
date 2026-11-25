// orders.js — the order board: spawning tickets, patience timers, matching
// a finished plate against a ticket, and scoring a serve.

import {
  CUSTOMERS, MAX_ORDERS, ORDER_EVERY_MS, ORDER_PATIENCE_MS,
  makeRecipe, recipeName, recipeValue,
} from './config.js';

let nextOrderId = 1;

export function newOrder(rng) {
  const recipe = makeRecipe(rng);
  return {
    id: nextOrderId++,
    customer: CUSTOMERS[Math.floor(rng() * CUSTOMERS.length)],
    recipe,
    name: recipeName(recipe),
    value: recipeValue(recipe),
    patience: ORDER_PATIENCE_MS,
    maxPatience: ORDER_PATIENCE_MS,
  };
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const order = newOrder(state.rng);
  state.orders.push(order);
  return order;
}

// Advance patience; returns the orders that just walked out.
export function tickOrders(state, dtMs) {
  const walked = [];
  for (const order of state.orders) order.patience -= dtMs;
  state.orders = state.orders.filter((order) => {
    if (order.patience <= 0) { walked.push(order); return false; }
    return true;
  });
  state.orderTimer += dtMs;
  if (state.orderTimer >= ORDER_EVERY_MS) {
    state.orderTimer = 0;
    spawnOrder(state);
  }
  return walked;
}

// Same multiset of ingredients, in any stacking order.
export function plateMatches(order, plate) {
  if (plate.length !== order.recipe.length) return false;
  const count = (arr) => {
    const m = new Map();
    for (const i of arr) m.set(i, (m.get(i) || 0) + 1);
    return m;
  };
  const a = count(order.recipe);
  const b = count(plate);
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

// Find the ticket this plate satisfies, if any.
export function findMatchingOrder(state, plate) {
  return state.orders.find((o) => plateMatches(o, plate)) || null;
}

// Score a serve: base value plus a tip that shrinks as patience runs out.
export function serveOrder(state, order) {
  const tip = Math.round(6 * Math.max(0, order.patience / order.maxPatience));
  const earned = order.value + tip;
  state.coins += earned;
  state.score += earned * 10;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.served += 1;
  state.orders = state.orders.filter((o) => o.id !== order.id);
  return { earned, tip, combo: state.combo };
}

export function resetOrderCounter() {
  nextOrderId = 1;
}
