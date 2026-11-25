# Sizzle & Serve — a cooking game

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/goperek48/cookgame-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/goperek48/cookgame-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Run a tiny burger diner against the clock. Orders land on the board with a
patience timer: grill the patties, chop the lettuce and tomato, stack the
burger on the plate in the right order, and serve it before the customer
walks out. Burnt patties, wrong orders and cold feet cost you coins; a clean
streak builds your combo and your tips.

- `main.ts` — the entrypoint. Copies `game/` and `screenshots/` to
  `$MAKEFUN_OUTPUT_DIR` (`/output` in the grader sandbox) and writes
  `dossier.json` with the vendored `vendor/makefun-game.ts` library.
- `game/` — the playable game as static files: `index.html` plus ES modules
  under `game/src/`. No build step, no network request, no library.
- `screenshots/` — real renders of the game running in desktop Chrome.

## How to play

- **Mouse:** click an ingredient bin to pick it up, then click where it goes
  (grill, chopping board, or the plate). Click a cooked patty to collect it.
  Click the plate, then the serve window, to serve the matching order.
- **Keyboard:** `1`–`6` pick ingredients, `G` grill, `C` chop, `Space` serve,
  `T` trash what you hold, `P` pause, `R` restart.
- **Rules:** a patty cooks in ~6 s and burns after ~12 s. Lettuce and tomato
  need 3 chops each. Serve exactly what the ticket asks — extras and missing
  items are refused. Three walked-out customers end the day.

## Run it

```sh
node serve.ts   # serves game/ at http://localhost:8080
```

Or open `game/index.html` directly in desktop Chrome. To hand the entry in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
