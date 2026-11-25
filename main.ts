// Sizzle & Serve — a cooking-game entry for best-cooking-game-20261125-0137.
// Node 22, standard library only. The game is this directory's game/ folder:
// plain static files a desktop browser loads offline (game/index.html and its
// ES modules, no library, no network request). This program hands it in: it
// copies game/ and screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

// Fail fast, with a named reason, when the entry on disk cannot pass the
// gate — instead of writing a dossier the scorer would refuse.
function checkEntry() {
  const problems = [];
  const index = join(here, 'game', 'index.html');
  if (!existsSync(index)) problems.push('game/index.html is missing');
  else if (statSync(index).size > 1048576) problems.push('game/index.html is over 1 MiB');
  const shots = join(here, 'screenshots');
  if (!existsSync(shots)) {
    problems.push('screenshots/ is missing');
  } else {
    const files = readdirSync(shots).filter((f) => !f.startsWith('.'));
    if (files.length < 3 || files.length > CAPS.screenshots.max) {
      problems.push(`screenshots/ holds ${files.length} images, need 3 or 4`);
    }
    for (const f of files) {
      if (statSync(join(shots, f)).size > CAPS.screenshots.max_bytes) {
        problems.push(`screenshots/${f} is over 256 KiB`);
      }
    }
  }
  if (problems.length > 0) {
    throw new Error(`entry check failed: ${problems.join('; ')}`);
  }
}

checkEntry();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, CAPS);
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`Sizzle & Serve handed in: ${dossier.length} bytes of dossier, ${readdirSync(join(out, 'game')).length} top-level game entries.`);
