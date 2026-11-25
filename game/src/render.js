// render.js — every pixel of Sizzle & Serve, drawn with the 2D canvas API.
// No image files: the kitchen, the food and the tickets are all vector art.

import { BIN_ORDER, CANVAS_H, CANVAS_W, GRILL_BURN_MS, GRILL_COOK_MS, INGREDIENTS } from './config.js';
import { LAYOUT } from './layout.js';
import { findMatchingOrder } from './orders.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || '700'} ${size}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

// --- food icons ------------------------------------------------------------

export function drawIngredientIcon(ctx, id, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 100;
  if (id === 'bun') {
    ctx.fillStyle = '#e8a94f';
    ctx.beginPath();
    ctx.ellipse(0, 6 * u, 46 * u, 26 * u, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#f7cf8a';
    ctx.beginPath();
    ctx.ellipse(0, 10 * u, 44 * u, 20 * u, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff3d6';
    for (const [dx, dy] of [[-22, -8], [0, -16], [22, -8], [-10, -4], [12, -4]]) {
      ctx.beginPath();
      ctx.ellipse(dx * u, dy * u, 4 * u, 2.5 * u, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'patty') {
    ctx.fillStyle = '#8a5a33';
    rr(ctx, -46 * u, -14 * u, 92 * u, 30 * u, 14 * u);
    ctx.fill();
    ctx.fillStyle = '#6e4525';
    for (const [dx, dy] of [[-28, 0], [-8, 4], [14, -3], [30, 3]]) {
      ctx.beginPath();
      ctx.arc(dx * u, dy * u, 3.5 * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#a9743f';
    rr(ctx, -40 * u, -12 * u, 80 * u, 8 * u, 4 * u);
    ctx.fill();
  } else if (id === 'lettuce') {
    ctx.fillStyle = '#5fb84a';
    for (const [dx, dy, r] of [[-30, 0, 18], [-10, -6, 20], [12, -4, 19], [30, 2, 17], [0, 6, 20]]) {
      ctx.beginPath();
      ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#79d165';
    for (const [dx, dy, r] of [[-18, -4, 10], [8, -6, 9], [22, 2, 8]]) {
      ctx.beginPath();
      ctx.arc(dx * u, dy * u, r * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'tomato') {
    ctx.fillStyle = '#e04a3a';
    ctx.beginPath();
    ctx.arc(0, 0, 32 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0786a';
    ctx.beginPath();
    ctx.arc(-8 * u, -8 * u, 18 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ff8a7a';
    ctx.beginPath();
    ctx.arc(-12 * u, -12 * u, 7 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3d8a2e';
    ctx.beginPath();
    ctx.ellipse(0, -30 * u, 10 * u, 5 * u, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'cheese') {
    ctx.fillStyle = '#f7c948';
    ctx.save();
    ctx.rotate(-0.06);
    rr(ctx, -42 * u, -20 * u, 84 * u, 40 * u, 6 * u);
    ctx.fill();
    ctx.fillStyle = '#e0a92e';
    ctx.beginPath();
    ctx.arc(-20 * u, 4 * u, 5 * u, 0, Math.PI * 2);
    ctx.arc(12 * u, -6 * u, 4 * u, 0, Math.PI * 2);
    ctx.arc(28 * u, 8 * u, 3.5 * u, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (id === 'onion') {
    ctx.strokeStyle = '#e8ddf2';
    ctx.lineWidth = 7 * u;
    for (const r of [30, 20, 10]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * u, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = '#c9bdd4';
    ctx.lineWidth = 2 * u;
    for (const r of [25, 15]) {
      ctx.beginPath();
      ctx.arc(0, 0, r * u, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// A cooked patty is darker with grill marks.
export function drawCookedPatty(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 100;
  ctx.fillStyle = '#6b3f1e';
  rr(ctx, -46 * u, -14 * u, 92 * u, 30 * u, 14 * u);
  ctx.fill();
  ctx.strokeStyle = '#3f2410';
  ctx.lineWidth = 4 * u;
  for (const dx of [-24, 0, 24]) {
    ctx.beginPath();
    ctx.moveTo(dx * u - 8 * u, -10 * u);
    ctx.lineTo(dx * u + 8 * u, 10 * u);
    ctx.stroke();
  }
  ctx.restore();
}

// --- background ------------------------------------------------------------

function drawBackground(ctx) {
  ctx.fillStyle = '#f3e2c2';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // Wall tiles.
  ctx.fillStyle = '#e8d3ac';
  for (let y = 0; y < 200; y += 40) {
    for (let x = (y / 40) % 2 === 0 ? 0 : 40; x < CANVAS_W; x += 80) {
      ctx.fillRect(x, y, 76, 36);
    }
  }
  // Wooden counter band.
  ctx.fillStyle = '#a9743f';
  ctx.fillRect(0, 196, CANVAS_W, 16);
  ctx.fillStyle = '#8a5a33';
  ctx.fillRect(0, 208, CANVAS_W, 4);
  // Floor.
  ctx.fillStyle = '#d9b98a';
  ctx.fillRect(0, 620, CANVAS_W, 100);
  ctx.fillStyle = '#c9a878';
  for (let x = 0; x < CANVAS_W; x += 64) ctx.fillRect(x, 620, 2, 100);
}

// --- header ----------------------------------------------------------------

function drawHeader(ctx, state) {
  const h = LAYOUT.header;
  ctx.fillStyle = '#3b2a1a';
  ctx.fillRect(h.x, h.y, h.w, h.h);
  text(ctx, 'SIZZLE & SERVE', 24, 28, 24, '#ffcf3d', '800');
  text(ctx, 'burger diner', 268, 30, 14, '#e8d3ac', '600');

  const secs = Math.max(0, Math.ceil(state.timeLeftMs / 1000));
  const mm = Math.floor(secs / 60);
  const ss = String(secs % 60).padStart(2, '0');
  const urgent = secs <= 30 && state.screen === 'playing';
  text(ctx, `${mm}:${ss}`, 560, 28, 26, urgent ? '#ff6b5e' : '#ffffff', '800', 'center');
  ctx.fillStyle = '#5a4632';
  rr(ctx, 470, 44, 180, 6, 3);
  ctx.fill();
  ctx.fillStyle = urgent ? '#ff6b5e' : '#ffcf3d';
  rr(ctx, 470, 44, 180 * Math.max(0, state.timeLeftMs / (150 * 1000)), 6, 3);
  ctx.fill();

  text(ctx, `🪙 $${state.coins}`, 700, 28, 22, '#ffe08a', '800');
  text(ctx, `SCORE ${state.score}`, 850, 28, 20, '#ffffff', '700');
  if (state.combo >= 2) text(ctx, `COMBO x${state.combo}`, 1000, 28, 20, '#ffcf3d', '800');
  // Strikes as hearts.
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < 3 - state.strikes ? '#ff5b6e' : '#5a4632';
    ctx.beginPath();
    const hx = 1160 + i * 30;
    ctx.arc(hx, 24, 9, 0, Math.PI * 2);
    ctx.arc(hx + 14, 24, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hx - 8, 26);
    ctx.lineTo(hx + 22, 26);
    ctx.lineTo(hx + 7, 42);
    ctx.closePath();
    ctx.fill();
  }
}

// --- order tickets ---------------------------------------------------------

function drawOrders(ctx, state) {
  LAYOUT.orders.forEach((slot, i) => {
    const order = state.orders[i];
    ctx.fillStyle = '#fff8e8';
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#d9b98a';
    ctx.lineWidth = 2;
    rr(ctx, slot.x, slot.y, slot.w, slot.h, 10);
    ctx.stroke();
    if (!order) {
      text(ctx, '— no order —', slot.x + 75, slot.y + 58, 13, '#b09a7a', '600', 'center');
      return;
    }
    const frac = Math.max(0, order.patience / order.maxPatience);
    text(ctx, order.customer, slot.x + 10, slot.y + 16, 15, '#3b2a1a', '800');
    text(ctx, `$${order.value}`, slot.x + slot.w - 10, slot.y + 16, 15, '#2e7d32', '800', 'right');
    text(ctx, order.name, slot.x + 10, slot.y + 36, 12, '#8a6d4b', '600');
    // Recipe icons in a row.
    const iconW = Math.min(30, (slot.w - 20) / order.recipe.length);
    order.recipe.forEach((ing, j) => {
      drawIngredientIcon(ctx, ing, slot.x + 16 + j * iconW + iconW / 2 - 4, slot.y + 66, 26);
    });
    // Patience bar.
    ctx.fillStyle = '#e0d3bd';
    rr(ctx, slot.x + 10, slot.y + 96, slot.w - 20, 8, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.5 ? '#5fb84a' : frac > 0.25 ? '#f7a928' : '#e04a3a';
    rr(ctx, slot.x + 10, slot.y + 96, (slot.w - 20) * frac, 8, 4);
    ctx.fill();
  });
}

// --- stations --------------------------------------------------------------

function stationCard(ctx, rect, title, accent) {
  ctx.fillStyle = '#fff3dc';
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.stroke();
  text(ctx, title, rect.x + 14, rect.y + 18, 14, '#8a6d4b', '800');
}

function drawGrill(ctx, state) {
  const g = LAYOUT.grill;
  stationCard(ctx, g, 'GRILL — click a patty to collect', '#8a5a33');
  state.kitchen.grill.forEach((slot, i) => {
    const r = LAYOUT.grillSlots[i];
    ctx.fillStyle = '#3b2a1a';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#6b563e';
    ctx.lineWidth = 2;
    for (let k = 1; k < 4; k++) {
      ctx.beginPath();
      ctx.moveTo(r.x + 8, r.y + (r.h / 4) * k);
      ctx.lineTo(r.x + r.w - 8, r.y + (r.h / 4) * k);
      ctx.stroke();
    }
    if (slot.state === 'cooking' || slot.state === 'done' || slot.state === 'burnt') {
      if (slot.state === 'burnt') {
        ctx.fillStyle = '#1d1208';
        rr(ctx, r.x + 16, r.y + 44, 92, 30, 14);
        ctx.fill();
        text(ctx, 'BURNT!', r.x + 62, r.y + 60, 15, '#ff9d9d', '800', 'center');
        text(ctx, 'click to toss', r.x + 62, r.y + 92, 11, '#c9b18a', '600', 'center');
      } else {
        if (slot.state === 'done') drawCookedPatty(ctx, r.x + 62, r.y + 56, 100);
        else drawIngredientIcon(ctx, 'patty', r.x + 62, r.y + 56, 100);
        const frac = Math.min(1, slot.t / GRILL_COOK_MS);
        ctx.fillStyle = '#5a4632';
        rr(ctx, r.x + 14, r.y + 100, r.w - 28, 10, 5);
        ctx.fill();
        ctx.fillStyle = slot.state === 'done' ? '#5fb84a' : '#f7a928';
        rr(ctx, r.x + 14, r.y + 100, (r.w - 28) * frac, 10, 5);
        ctx.fill();
        text(
          ctx, slot.state === 'done' ? 'READY — click!' : `${Math.ceil((GRILL_COOK_MS - slot.t) / 1000)}s`,
          r.x + 62, r.y + 82, 13, slot.state === 'done' ? '#7dff8a' : '#ffe08a', '800', 'center',
        );
      }
    } else {
      text(ctx, 'empty', r.x + 62, r.y + 62, 13, '#8a6d4b', '600', 'center');
    }
  });
}

function drawBoard(ctx, state) {
  const b = LAYOUT.board;
  stationCard(ctx, b, 'CHOPPING BOARD — click to chop', '#3d8a2e');
  ctx.fillStyle = '#d9a05f';
  rr(ctx, b.x + 24, b.y + 52, b.w - 48, 108, 10);
  ctx.fill();
  ctx.fillStyle = '#c98f4e';
  rr(ctx, b.x + 24, b.y + 52, b.w - 48, 12, 6);
  ctx.fill();
  const board = state.kitchen.board;
  if (board.item) {
    drawIngredientIcon(ctx, board.item, b.x + 150, b.y + 104, 90);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < board.chops ? '#5fb84a' : '#fff3dc';
      ctx.beginPath();
      ctx.arc(b.x + 120 + i * 30, b.y + 176, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    text(ctx, board.chops >= 3 ? 'chopped!' : 'click to chop', b.x + 150, b.y + 140, 12, '#5a4632', '700', 'center');
  } else {
    text(ctx, 'put lettuce or tomato here', b.x + 150, b.y + 106, 13, '#8a6d4b', '600', 'center');
  }
}

function drawPlate(ctx, state) {
  const p = LAYOUT.plate;
  const selected = state.kitchen.plateSelected;
  stationCard(ctx, p, 'ASSEMBLY PLATE', selected ? '#2e7d32' : '#8a6d4b');
  const c = LAYOUT.plateCenter;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 18, 120, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d9d2c4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 18, 120, 52, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(c.x, c.y + 18, 92, 38, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Stack the burger bottom-up, top bun drawn as a dome.
  const stack = state.kitchen.plate;
  let y = c.y + 30;
  const layers = [...stack];
  layers.forEach((ing, idx) => {
    const isTopBun = idx === layers.length - 1 && ing === 'bun' && layers.filter((x) => x === 'bun').length > 1;
    const isBottomBun = idx === 0 && ing === 'bun';
    if (isTopBun) {
      ctx.fillStyle = '#e8a94f';
      ctx.beginPath();
      ctx.ellipse(c.x, y - 6, 62, 30, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff3d6';
      for (const dx of [-30, -8, 16, 34]) {
        ctx.beginPath();
        ctx.ellipse(c.x + dx, y - 24, 4, 2.5, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      y -= 26;
    } else if (isBottomBun) {
      ctx.fillStyle = '#d99a3d';
      rr(ctx, c.x - 62, y - 18, 124, 16, 8);
      ctx.fill();
      y -= 14;
    } else if (ing === 'patty') {
      ctx.fillStyle = '#6b3f1e';
      rr(ctx, c.x - 64, y - 16, 128, 15, 7);
      ctx.fill();
      y -= 13;
    } else if (ing === 'lettuce') {
      ctx.fillStyle = '#5fb84a';
      rr(ctx, c.x - 70, y - 14, 140, 10, 5);
      ctx.fill();
      y -= 9;
    } else if (ing === 'tomato') {
      ctx.fillStyle = '#e04a3a';
      rr(ctx, c.x - 58, y - 15, 116, 13, 6);
      ctx.fill();
      y -= 11;
    } else if (ing === 'cheese') {
      ctx.fillStyle = '#f7c948';
      ctx.save();
      ctx.translate(c.x, y - 8);
      ctx.rotate(-0.03);
      rr(ctx, -64, -7, 128, 13, 4);
      ctx.fill();
      ctx.restore();
      y -= 11;
    } else if (ing === 'onion') {
      ctx.strokeStyle = '#e8ddf2';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(c.x, y - 8, 56, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      y -= 8;
    }
  });
  if (stack.length === 0) {
    text(ctx, 'build your burger here', c.x, c.y - 8, 13, '#b09a7a', '600', 'center');
  }
  if (selected) text(ctx, 'selected — click SERVE', c.x, p.y + p.h - 14, 12, '#2e7d32', '800', 'center');
}

function drawServe(ctx, state) {
  const s = LAYOUT.serve;
  const match = state.screen === 'playing' && state.kitchen.plate.length > 0 && findMatchingOrder(state, state.kitchen.plate);
  ctx.fillStyle = match ? '#e6f7e6' : '#fff3dc';
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.fill();
  ctx.strokeStyle = match ? '#2e7d32' : '#c98f4e';
  ctx.lineWidth = match ? 4 : 3;
  rr(ctx, s.x, s.y, s.w, s.h, 12);
  ctx.stroke();
  text(ctx, 'SERVE WINDOW', s.x + 120, s.y + 20, 15, '#8a6d4b', '800', 'center');
  // Bell.
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.arc(s.x + 120, s.y + 58, 22, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(s.x + 94, s.y + 58, 52, 6);
  ctx.fillStyle = '#d9a41f';
  ctx.beginPath();
  ctx.arc(s.x + 120, s.y + 70, 5, 0, Math.PI * 2);
  ctx.fill();
  text(
    ctx,
    match ? `serves ${match.customer} — click!` : 'click to serve the plate',
    s.x + 120, s.y + 98, 12, match ? '#2e7d32' : '#8a6d4b', '700', 'center',
  );
}

function drawTrash(ctx) {
  const t = LAYOUT.trash;
  ctx.fillStyle = '#e8e0d2';
  rr(ctx, t.x, t.y, t.w, t.h, 12);
  ctx.fill();
  ctx.strokeStyle = '#a89a80';
  ctx.lineWidth = 2;
  rr(ctx, t.x, t.y, t.w, t.h, 12);
  ctx.stroke();
  ctx.fillStyle = '#8a8272';
  rr(ctx, t.x + 92, t.y + 18, 56, 52, 6);
  ctx.fill();
  ctx.fillStyle = '#6e6656';
  rr(ctx, t.x + 86, t.y + 12, 68, 10, 5);
  ctx.fill();
  text(ctx, 'TRASH — click to toss what you hold', t.x + 120, t.y + 84, 11, '#8a8272', '700', 'center');
}

function drawBins(ctx, state) {
  LAYOUT.bins.forEach((bin, i) => {
    const id = BIN_ORDER[i];
    const ing = INGREDIENTS[id];
    const holding = state.kitchen.held === id;
    ctx.fillStyle = holding ? '#ffe9b0' : '#fff8e8';
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 12);
    ctx.fill();
    ctx.strokeStyle = holding ? '#f7a928' : '#d9b98a';
    ctx.lineWidth = holding ? 3 : 2;
    rr(ctx, bin.x, bin.y, bin.w, bin.h, 12);
    ctx.stroke();
    drawIngredientIcon(ctx, id, bin.x + 95, bin.y + 62, 88);
    text(ctx, ing.name, bin.x + 95, bin.y + 112, 16, '#3b2a1a', '800', 'center');
    text(ctx, `[${ing.key}]`, bin.x + 95, bin.y + 132, 12, '#8a6d4b', '700', 'center');
    if (ing.needs === 'grill') text(ctx, '→ grill', bin.x + 95, bin.y + 30, 11, '#a9713f', '700', 'center');
    if (ing.needs === 'chop') text(ctx, '→ chop ×3', bin.x + 95, bin.y + 30, 11, '#3d8a2e', '700', 'center');
  });
}

function drawFooter(ctx, state) {
  text(
    ctx,
    '1–6 pick ingredient · G grill · C chop · Space serve · T trash · P pause · M mute',
    24, 648, 14, '#6e5844', '600',
  );
  text(
    ctx,
    `served ${state.served} · best combo x${state.bestCombo} · day ends at 0:00`,
    1256, 648, 14, '#6e5844', '600', 'right',
  );
  if (state.kitchen.held) {
    text(ctx, `holding: ${state.kitchen.held === 'pattyCooked' ? 'Cooked Patty' : INGREDIENTS[state.kitchen.held].name}`, 24, 676, 14, '#3b2a1a', '800');
  }
  if (state.paused) text(ctx, 'PAUSED — press P to resume', 640, 676, 16, '#e04a3a', '800', 'center');
}

function drawHeld(ctx, state) {
  if (!state.kitchen.held || !state.mouse) return;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  if (state.kitchen.held === 'pattyCooked') drawCookedPatty(ctx, state.mouse.x, state.mouse.y - 10, 70);
  else drawIngredientIcon(ctx, state.kitchen.held, state.mouse.x, state.mouse.y - 10, 70);
  ctx.restore();
}

function drawFloats(ctx, state) {
  for (const f of state.floats) {
    const a = Math.max(0, 1 - f.t / f.life);
    ctx.save();
    ctx.globalAlpha = a;
    text(ctx, f.text, f.x, f.y - (f.t / f.life) * 30, 17, f.color, '800', 'center');
    ctx.restore();
  }
}

// --- screens -----------------------------------------------------------------

function overlay(ctx, alpha) {
  ctx.fillStyle = `rgba(30, 18, 8, ${alpha})`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

function drawTitle(ctx, state) {
  overlay(ctx, 0.45);
  ctx.fillStyle = '#fff8e8';
  rr(ctx, 290, 130, 700, 460, 18);
  ctx.fill();
  ctx.strokeStyle = '#f7a928';
  ctx.lineWidth = 4;
  rr(ctx, 290, 130, 700, 460, 18);
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 200, 52, '#3b2a1a', '800', 'center');
  text(ctx, 'a tiny burger diner', 640, 240, 20, '#8a6d4b', '600', 'center');
  drawIngredientIcon(ctx, 'bun', 480, 300, 70);
  drawIngredientIcon(ctx, 'patty', 560, 300, 70);
  drawIngredientIcon(ctx, 'lettuce', 640, 300, 70);
  drawIngredientIcon(ctx, 'tomato', 720, 300, 70);
  drawIngredientIcon(ctx, 'cheese', 800, 300, 70);
  text(ctx, 'Orders land on the board. Grill the patty, chop the veg,', 640, 350, 17, '#3b2a1a', '600', 'center');
  text(ctx, 'stack the burger and serve it before the customer walks out.', 640, 376, 17, '#3b2a1a', '600', 'center');
  text(ctx, 'Three walk-outs end your day. Tips grow with your combo.', 640, 402, 17, '#3b2a1a', '600', 'center');
  text(ctx, 'CLICK OR PRESS ENTER TO START', 640, 470, 20, '#e04a3a', '800', 'center');
  text(ctx, 'mouse + keys 1–6 · G grill · C chop · Space serve', 640, 510, 14, '#8a6d4b', '600', 'center');
  text(ctx, 'an original game — no assets, no network, all drawn in code', 640, 544, 12, '#b09a7a', '600', 'center');
}

function drawGameOver(ctx, state) {
  overlay(ctx, 0.55);
  ctx.fillStyle = '#fff8e8';
  rr(ctx, 340, 150, 600, 420, 18);
  ctx.fill();
  ctx.strokeStyle = '#f7a928';
  ctx.lineWidth = 4;
  rr(ctx, 340, 150, 600, 420, 18);
  ctx.stroke();
  text(ctx, 'DAY OVER', 640, 210, 44, '#3b2a1a', '800', 'center');
  text(ctx, state.strikes >= 3 ? 'Too many customers walked out…' : 'The dinner rush is done!', 640, 250, 16, '#8a6d4b', '600', 'center');
  const rows = [
    ['Coins earned', `$${state.coins}`],
    ['Burgers served', `${state.served}`],
    ['Best combo', `x${state.bestCombo}`],
    ['Final score', `${state.score}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 300 + i * 42;
    text(ctx, label, 420, y, 18, '#3b2a1a', '600');
    text(ctx, value, 860, y, 18, '#2e7d32', '800', 'right');
  });
  text(ctx, 'PRESS R TO COOK AGAIN', 640, 500, 20, '#e04a3a', '800', 'center');
}

// --- main entry --------------------------------------------------------------

export function render(ctx, state) {
  drawBackground(ctx);
  drawHeader(ctx, state);
  drawOrders(ctx, state);
  drawGrill(ctx, state);
  drawBoard(ctx, state);
  drawPlate(ctx, state);
  drawServe(ctx, state);
  drawTrash(ctx);
  drawBins(ctx, state);
  drawFooter(ctx, state);
  drawFloats(ctx, state);
  drawHeld(ctx, state);
  if (state.screen === 'title') drawTitle(ctx, state);
  else if (state.screen === 'over') drawGameOver(ctx, state);
}
