// Twin Lanterns — the entry hand-in (Node 22, standard library only).
//
// This program hands the game in: it copies this repository's game/ and
// screenshots/ into the output directory and writes dossier.json there, the
// summary the judge reads, built with the vendored make.fun library.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for
// /output, from this file's directory:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game locally first with `node serve.ts`, then open
// http://localhost:8080 to play it in a desktop browser.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(from, to) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
}

function listShots(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => statSync(join(dir, name)).isFile())
    .sort();
}

mkdirSync(outputDir, { recursive: true });
copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
if (existsSync(join(repoRoot, 'screenshots'))) {
  copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
}

// The scorer's caps (reference/gate.json): text_max_bytes is the only one
// that shapes the dossier's bytes. The rest refuse an entry the scorer
// would refuse anyway — more than 4 screenshots or one over 256 KiB, more
// than 993 files in game/ or 48 MiB of game files in all, or a path under
// game/ over 1000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

const shots = listShots(join(outputDir, 'screenshots'));
console.log(`handed in ${shots.length} screenshot(s): ${shots.join(', ')}`);
console.log(`dossier.json: ${dossier.length} bytes`);
