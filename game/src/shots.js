// The screenshot scenes behind ?shot=start|play|play2|end. Each one plays the
// real rules forward from a fresh world — real clicks through the same
// clickAt the player uses — so the frame is what a short game really looks
// like, and the same seed always gives the same frame.
//
// - start: the title screen over the harbour scene.
// - play:  level 1 (or ?level=N) with the first three differences found, so
//   the picture shows markers on found differences, several still unfound,
//   and a counter of how many remain.
// - play2: level 2 with five of seven found.
// - end:   every level cleared, on the victory screen.

import { LEVELS, LEFT_PANEL } from './config.js';
import {
  PHASE_TITLE,
  PHASE_VICTORY,
  createWorld,
  startLevel,
  startGame,
  nextLevel,
  clickAt,
  tick,
  levelOf,
} from './world.js';

/** Click the centre of a difference on the left panel, through real rules. */
function findDifference(world, diff) {
  clickAt(world, LEFT_PANEL.x + diff.x, LEFT_PANEL.y + diff.y);
}

/** Let the scene's animation settle at a fixed moment. */
function settle(world, seconds) {
  for (let t = 0; t < seconds; t += 1 / 60) tick(world, 1 / 60);
}

export function stageShot(name, world, query) {
  const levelParam = Number.parseInt(query.get('level') ?? '', 10);
  const level = Number.isInteger(levelParam) && levelParam >= 0 && levelParam < LEVELS.length ? levelParam : 0;
  const foundParam = Number.parseInt(query.get('found') ?? '', 10);
  const foundWanted = Number.isInteger(foundParam) ? foundParam : 3;

  if (name === 'play' || name === 'play2') {
    const targetLevel = name === 'play2' ? 1 : level;
    const targetFound = name === 'play2' ? 5 : foundWanted;
    startLevel(world, targetLevel);
    const diffs = levelOf(world).diffs;
    for (let i = 0; i < Math.min(targetFound, diffs.length); i += 1) findDifference(world, diffs[i]);
    settle(world, 6);
    return;
  }

  if (name === 'end') {
    startGame(world);
    for (let li = 0; li < LEVELS.length; li += 1) {
      for (const diff of levelOf(world).diffs) findDifference(world, diff);
      if (li + 1 < LEVELS.length) nextLevel(world);
    }
    world.phase = PHASE_VICTORY;
    settle(world, 2);
    return;
  }

  // Anything else is the title screen.
  world.phase = PHASE_TITLE;
  world.levelIndex = 0;
  settle(world, 4);
}

export { createWorld };
