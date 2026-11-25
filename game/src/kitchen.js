// kitchen.js — the working stations: grill, chopping board, assembly plate,
// the trash, and what the cook is holding. Pure state transitions; input.js
// decides which one the player asked for.

import { CHOPS_NEEDED, GRILL_BURN_MS, GRILL_COOK_MS, INGREDIENTS } from './config.js';
import { sfx, setSizzle } from './audio.js';

export function newKitchen() {
  return {
    grill: [
      { state: 'empty', t: 0 },
      { state: 'empty', t: 0 },
    ],
    board: { item: null, chops: 0 },
    plate: [],
    held: null, // an ingredient id, or 'pattyCooked'
    plateSelected: false,
  };
}

export function heldLabel(k) {
  if (!k.held) return null;
  if (k.held === 'pattyCooked') return 'Cooked Patty';
  return INGREDIENTS[k.held].name;
}

// --- grill ---------------------------------------------------------------

export function grillHasCooking(k) {
  return k.grill.some((s) => s.state === 'cooking');
}

export function tickGrill(k, dtMs, onDone, onBurnt) {
  for (const slot of k.grill) {
    if (slot.state !== 'cooking' && slot.state !== 'done') continue;
    slot.t += dtMs;
    if (slot.t >= GRILL_BURN_MS) {
      slot.state = 'burnt';
      onBurnt && onBurnt();
    } else if (slot.state === 'cooking' && slot.t >= GRILL_COOK_MS) {
      slot.state = 'done';
      onDone && onDone();
    }
  }
  setSizzle(grillHasCooking(k));
}

export function placeOnGrill(k) {
  if (k.held !== 'patty') return 'need-patty';
  const slot = k.grill.find((s) => s.state === 'empty');
  if (!slot) return 'grill-full';
  slot.state = 'cooking';
  slot.t = 0;
  k.held = null;
  sfx.flip();
  return 'ok';
}

export function collectGrill(k, index) {
  const slot = k.grill[index];
  if (!slot) return 'no-slot';
  if (slot.state === 'done') {
    if (k.held) return 'hands-full';
    k.held = 'pattyCooked';
    slot.state = 'empty';
    slot.t = 0;
    sfx.pickup();
    return 'ok';
  }
  if (slot.state === 'burnt') {
    slot.state = 'empty';
    slot.t = 0;
    sfx.error();
    return 'trashed-burnt';
  }
  return 'not-ready';
}

// --- chopping board ------------------------------------------------------

export function placeOnBoard(k) {
  if (!k.held || !INGREDIENTS[k.held]) return 'need-item';
  const ing = INGREDIENTS[k.held];
  if (ing.needs !== 'chop') return 'no-chop';
  if (k.board.item) return 'board-busy';
  k.board.item = k.held;
  k.board.chops = 0;
  k.held = null;
  sfx.place();
  return 'ok';
}

export function chopBoard(k) {
  if (!k.board.item) return 'board-empty';
  k.board.chops += 1;
  sfx.chop();
  if (k.board.chops >= CHOPS_NEEDED) {
    if (k.held) return 'done-hands-full';
    k.held = k.board.item;
    k.board.item = null;
    k.board.chops = 0;
    sfx.done();
    return 'chopped';
  }
  return 'chopped-once';
}

// --- assembly plate ------------------------------------------------------

export function addToPlate(k) {
  if (!k.held) return 'empty-hands';
  const id = k.held === 'pattyCooked' ? 'patty' : k.held;
  if (k.held !== 'pattyCooked' && INGREDIENTS[k.held].needs !== 'none') return 'not-ready';
  if (k.plate.length >= 8) return 'plate-full';
  k.plate.push(id);
  k.held = null;
  sfx.place();
  return 'ok';
}

export function clearPlate(k) {
  k.plate = [];
  k.plateSelected = false;
}

export function trashHeld(k) {
  if (!k.held) return 'empty-hands';
  k.held = null;
  sfx.error();
  return 'ok';
}

// Pick an ingredient up from its bin. Raw patty / lettuce / tomato still need
// their station; bun, cheese and onion go straight to the plate.
export function pickFromBin(k, id) {
  if (k.held) return 'hands-full';
  k.held = id;
  sfx.pickup();
  return 'ok';
}
