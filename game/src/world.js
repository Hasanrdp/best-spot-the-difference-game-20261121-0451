// The game's state: which level is open, what has been found, the clock,
// hearts, hints and score. Pure logic, no drawing and no DOM: the renderer
// paints whatever this holds, and shots.js drives it with real clicks.

import {
  LEVELS,
  LEVEL_TIME_SECONDS,
  HEARTS,
  HINTS_PER_LEVEL,
  POINTS_PER_FIND,
  TIME_BONUS_PER_SECOND,
  WRONG_PENALTY,
  HINT_COST,
  LEVEL_CLEAR_BONUS,
  LEFT_PANEL,
  RIGHT_PANEL,
} from './config.js';

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_PAUSED = 'paused';
export const PHASE_LEVEL_CLEAR = 'level-clear';
export const PHASE_VICTORY = 'victory';
export const PHASE_GAME_OVER = 'game-over';

export function createWorld(seed) {
  const world = {
    seed,
    phase: PHASE_TITLE,
    levelIndex: 0,
    found: new Set(),
    wrongMarks: [],
    hearts: HEARTS,
    hintsLeft: HINTS_PER_LEVEL,
    hintPulse: null,
    score: 0,
    levelScore: 0,
    timeLeft: LEVEL_TIME_SECONDS,
    best: 0,
    message: '',
    messageUntil: 0,
    now: 0,
    levelStartScore: 0,
    totalFound: 0,
    totalDiffs: LEVELS.reduce((n, level) => n + level.diffs.length, 0),
    muted: false,
    events: 0,
  };
  return world;
}

export function levelOf(world) {
  return LEVELS[world.levelIndex];
}

export function foundCount(world) {
  return world.found.size;
}

export function remainingCount(world) {
  return levelOf(world).diffs.length - world.found.size;
}

export function startLevel(world, index) {
  world.levelIndex = index;
  world.found = new Set();
  world.wrongMarks = [];
  world.hearts = HEARTS;
  world.hintsLeft = HINTS_PER_LEVEL;
  world.hintPulse = null;
  world.levelScore = 0;
  world.levelStartScore = world.score;
  world.timeLeft = LEVEL_TIME_SECONDS;
  world.phase = PHASE_PLAY;
  world.message = `${levelOf(world).name}: find ${levelOf(world).diffs.length} differences.`;
  world.messageUntil = world.now + 4;
  world.events = 0;
}

export function startGame(world) {
  world.score = 0;
  world.totalFound = 0;
  startLevel(world, 0);
}

export function nextLevel(world) {
  if (world.levelIndex + 1 >= LEVELS.length) {
    world.phase = PHASE_VICTORY;
    return;
  }
  startLevel(world, world.levelIndex + 1);
}

/** Which panel, if any, holds the point (logical canvas pixels). */
function panelAt(x, y) {
  for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
    if (x >= panel.x && x <= panel.x + panel.width && y >= panel.y && y <= panel.y + panel.height) {
      return panel;
    }
  }
  return null;
}

/**
 * Resolve a click in logical canvas pixels. Returns 'found', 'wrong' or
 * 'none' (outside both pictures). A found difference is marked on both
 * panels at once; a wrong click costs a heart.
 */
export function clickAt(world, x, y) {
  if (world.phase !== PHASE_PLAY) return 'none';
  const panel = panelAt(x, y);
  if (!panel) return 'none';
  const lx = x - panel.x;
  const ly = y - panel.y;
  const level = levelOf(world);
  for (const diff of level.diffs) {
    if (world.found.has(diff.id)) continue;
    const dx = lx - diff.x;
    const dy = ly - diff.y;
    if (dx * dx + dy * dy <= (diff.r + 10) * (diff.r + 10)) {
      world.found.add(diff.id);
      world.totalFound += 1;
      const bonus = Math.round(world.timeLeft) * 1;
      const gained = POINTS_PER_FIND + bonus;
      world.score += gained;
      world.levelScore += gained;
      world.message = `Found it! +${gained} points.`;
      world.messageUntil = world.now + 2.5;
      world.events |= 1; // found
      if (world.found.size === level.diffs.length) {
        const timeBonus = Math.round(world.timeLeft) * TIME_BONUS_PER_SECOND;
        world.score += LEVEL_CLEAR_BONUS + timeBonus;
        world.levelScore += LEVEL_CLEAR_BONUS + timeBonus;
        world.phase = PHASE_LEVEL_CLEAR;
        world.events |= 2; // level cleared
      }
      return 'found';
    }
  }
  world.hearts -= 1;
  world.score = Math.max(0, world.score - WRONG_PENALTY);
  world.wrongMarks.push({ x, y, until: world.now + 1.2 });
  world.message = world.hearts > 0 ? `Not a difference. ${world.hearts} ${world.hearts === 1 ? 'heart' : 'hearts'} left.` : 'Out of hearts!';
  world.messageUntil = world.now + 2.5;
  world.events |= 4; // wrong
  if (world.hearts <= 0) {
    world.phase = PHASE_GAME_OVER;
    world.events |= 8; // game over
  }
  return 'wrong';
}

/** Spend a hint: briefly pulse the next unfound difference. Returns its hint text or null. */
export function useHint(world) {
  if (world.phase !== PHASE_PLAY || world.hintsLeft <= 0) return null;
  const next = levelOf(world).diffs.find((diff) => !world.found.has(diff.id));
  if (!next) return null;
  world.hintsLeft -= 1;
  world.score = Math.max(0, world.score - HINT_COST);
  world.hintPulse = { id: next.id, until: world.now + 2.2 };
  world.message = `Hint: ${next.hint}.`;
  world.messageUntil = world.now + 3;
  world.events |= 16; // hint
  return next.hint;
}

/** Advance the clock by dt seconds; returns true when time runs out. */
export function tick(world, dt) {
  world.now += dt;
  world.wrongMarks = world.wrongMarks.filter((mark) => mark.until > world.now);
  if (world.hintPulse && world.hintPulse.until <= world.now) world.hintPulse = null;
  if (world.phase !== PHASE_PLAY) return false;
  world.timeLeft -= dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.phase = PHASE_GAME_OVER;
    world.message = "Time's up!";
    world.events |= 8;
    return true;
  }
  return false;
}

export function allDiffIds(level) {
  return new Set(level.diffs.map((diff) => diff.id));
}
