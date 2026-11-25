// input.js — mouse and keyboard for Sizzle & Serve. Hit-tests the stations
// laid out in layout.js and calls the kitchen / order actions.

import { BIN_ORDER, INGREDIENTS } from './config.js';
import { LAYOUT, hit } from './layout.js';
import {
  addToPlate, chopBoard, clearPlate, collectGrill, pickFromBin,
  placeOnBoard, placeOnGrill, trashHeld,
} from './kitchen.js';
import { findMatchingOrder, serveOrder } from './orders.js';
import { sfx, toggleMute } from './audio.js';

export function floatText(state, x, y, text, color) {
  state.floats.push({ x, y, text, color: color || '#ffffff', t: 0, life: 1400 });
}

function servePlate(state) {
  const plate = state.kitchen.plate;
  if (plate.length === 0) {
    sfx.error();
    floatText(state, LAYOUT.serve.x + 120, LAYOUT.serve.y + 60, 'Plate is empty!', '#ff9d9d');
    return;
  }
  const order = findMatchingOrder(state, plate);
  if (!order) {
    sfx.error();
    state.combo = 0;
    floatText(state, LAYOUT.serve.x + 120, LAYOUT.serve.y + 60, 'No order matches!', '#ff9d9d');
    return;
  }
  const result = serveOrder(state, order);
  clearPlate(state.kitchen);
  sfx.coin();
  floatText(
    state, LAYOUT.serve.x + 120, LAYOUT.serve.y + 40,
    `+$${result.earned}  ${order.customer} loves it!`, '#7dff8a',
  );
  if (result.tip > 0) {
    floatText(state, LAYOUT.serve.x + 120, LAYOUT.serve.y + 68, `incl. $${result.tip} tip`, '#ffe08a');
  }
  if (result.combo >= 3) {
    floatText(state, LAYOUT.serve.x + 120, LAYOUT.serve.y + 96, `COMBO x${result.combo}!`, '#ffcf3d');
  }
}

export function handleClick(state, x, y) {
  const k = state.kitchen;
  if (state.screen === 'title') { state.startGame(); return; }
  if (state.screen === 'over') { state.restartGame(); return; }
  if (state.paused) return;

  // Ingredient bins along the bottom.
  for (let i = 0; i < BIN_ORDER.length; i++) {
    const bin = LAYOUT.bins[i];
    if (hit(x, y, bin)) {
      const r = pickFromBin(k, BIN_ORDER[i]);
      if (r === 'hands-full') {
        sfx.error();
        floatText(state, bin.x + 95, bin.y - 8, 'Hands full!', '#ff9d9d');
      }
      return;
    }
  }

  // Grill slots.
  for (let i = 0; i < LAYOUT.grillSlots.length; i++) {
    const slot = LAYOUT.grillSlots[i];
    if (hit(x, y, slot)) {
      if (k.held === 'patty') { placeOnGrill(k); return; }
      const r = collectGrill(k, i);
      if (r === 'hands-full') {
        sfx.error();
        floatText(state, slot.x + 65, slot.y - 8, 'Hands full!', '#ff9d9d');
      } else if (r === 'not-ready') {
        floatText(state, slot.x + 65, slot.y - 8, 'Still cooking…', '#ffe08a');
      } else if (r === 'trashed-burnt') {
        floatText(state, slot.x + 65, slot.y - 8, 'Burnt! Tossed.', '#ff9d9d');
      }
      return;
    }
  }

  // Chopping board.
  if (hit(x, y, LAYOUT.board)) {
    if (k.board.item) { chopBoard(k); return; }
    if (k.held) {
      const r = placeOnBoard(k);
      if (r === 'no-chop') {
        sfx.error();
        floatText(state, LAYOUT.board.x + 150, LAYOUT.board.y - 8, 'Only lettuce & tomato get chopped', '#ff9d9d');
      }
    }
    return;
  }

  // Assembly plate.
  if (hit(x, y, LAYOUT.plate)) {
    if (k.held) {
      const r = addToPlate(k);
      if (r === 'not-ready') {
        sfx.error();
        floatText(state, LAYOUT.plate.x + 160, LAYOUT.plate.y - 8, 'Cook or chop it first!', '#ff9d9d');
      }
      return;
    }
    k.plateSelected = !k.plateSelected;
    sfx.click();
    return;
  }

  // Serve window.
  if (hit(x, y, LAYOUT.serve)) { servePlate(state); return; }

  // Trash.
  if (hit(x, y, LAYOUT.trash)) {
    if (trashHeld(k) === 'ok') floatText(state, LAYOUT.trash.x + 120, LAYOUT.trash.y + 110, 'Tossed', '#ff9d9d');
    return;
  }
}

export function handleKey(state, key) {
  const k = state.kitchen;
  if (key === 'm' || key === 'M') { toggleMute(); return; }
  if (state.screen === 'title' && (key === 'Enter' || key === ' ')) { state.startGame(); return; }
  if (state.screen === 'over' && (key === 'r' || key === 'R' || key === 'Enter' || key === ' ')) { state.restartGame(); return; }
  if (state.screen !== 'playing') return;
  if (key === 'p' || key === 'P') { state.togglePause(); return; }
  if (state.paused) return;
  if (key === 'r' || key === 'R') { state.restartGame(); return; }
  if (key >= '1' && key <= '6') {
    const id = BIN_ORDER[Number(key) - 1];
    if (pickFromBin(k, id) === 'hands-full') sfx.error();
    return;
  }
  switch (key) {
    case 'g': case 'G':
      if (k.held === 'patty') placeOnGrill(k);
      break;
    case 'c': case 'C':
      if (k.board.item) chopBoard(k);
      else if (k.held && INGREDIENTS[k.held].needs === 'chop') placeOnBoard(k);
      break;
    case ' ': case 'Enter':
      servePlate(state);
      break;
    case 't': case 'T':
      trashHeld(k);
      break;
    default:
      break;
  }
}
