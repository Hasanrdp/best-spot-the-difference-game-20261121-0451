// Boot and the one loop: input is read every frame, the world advances in
// fixed 1/60 s steps, and the renderer paints what is there. The game moves
// between title, play, paused, level-clear, victory and game-over screens.
//
// ?seed=N fixes the decorative jitter. ?shot=start|play|play2|end (with
// &seed=N, &level=N, &found=N) stages that scene instead of running the loop,
// paints it twice and sets window.__shotReady for a screenshot.

import { VIEW, STEP } from './config.js';
import {
  PHASE_TITLE,
  PHASE_PLAY,
  PHASE_PAUSED,
  PHASE_LEVEL_CLEAR,
  PHASE_VICTORY,
  PHASE_GAME_OVER,
  createWorld,
  startGame,
  startLevel,
  nextLevel,
  clickAt,
  useHint,
  tick,
} from './world.js';
import {
  ACTION_CONFIRM,
  ACTION_PAUSE,
  ACTION_HINT,
  ACTION_MUTE,
  ACTION_NEXT,
  ACTION_RESTART,
  ACTION_LEVEL_1,
  ACTION_LEVEL_2,
  ACTION_LEVEL_3,
  createInput,
} from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, readBest, saveBest } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall is dropped. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const world = createWorld(seed);
const audio = createAudio();
const input = createInput(canvas);
const renderer = createRenderer(canvas);
let best = readBest();

function announce(message) {
  status.textContent = message;
}

function saveBestIfBeaten() {
  if (world.score > best) {
    best = world.score;
    saveBest(best);
  }
}

function runShot(name) {
  stageShot(name, world, params);
  let painted = 0;
  function paint() {
    renderer.draw(world, best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let accumulator = 0;
  let last = performance.now();
  let wasPhase = world.phase;

  function afterStep(events) {
    if (events & 1) audio.found();
    if (events & 4) audio.wrong();
    if (events & 16) audio.hint();
    if (events & 2) {
      audio.clear();
      announce(`Level clear! Score ${world.score}.`);
    }
    if (events & 8) {
      audio.over();
      saveBestIfBeaten();
      announce(world.timeLeft <= 0 ? "Time's up!" : 'Out of hearts!');
    }
  }

  /** A click on a button region; returns true when a button handled it. */
  function handleUiClick(x, y) {
    const region = renderer.regionAt(x, y);
    if (!region) return false;
    if (region === 'hint') {
      const hint = useHint(world);
      if (hint) audio.hint();
      return true;
    }
    if (region === 'mute') {
      world.muted = !world.muted;
      audio.muted = world.muted;
      return true;
    }
    if (region === 'resume') {
      world.phase = PHASE_PLAY;
      announce('Playing.');
      return true;
    }
    if (region === 'next') {
      audio.click();
      nextLevel(world);
      if (world.phase === PHASE_VICTORY) {
        audio.victory();
        saveBestIfBeaten();
        announce(`All differences found! Total score ${world.score}.`);
      }
      return true;
    }
    if (region === 'retry') {
      audio.click();
      startLevel(world, world.levelIndex);
      return true;
    }
    if (region === 'again') {
      audio.click();
      startGame(world);
      return true;
    }
    if (region === 'title') {
      audio.click();
      world.phase = PHASE_TITLE;
      announce('Twin Lanterns. Choose a scene to start.');
      return true;
    }
    if (region.startsWith('level-')) {
      const index = Number(region.slice('level-'.length));
      audio.click();
      startLevel(world, index);
      announce('Playing. Find the differences.');
      return true;
    }
    return false;
  }

  function handleClicks() {
    for (const point of input.takeClicks()) {
      audio.ensure();
      if (handleUiClick(point.x, point.y)) continue;
      if (world.phase === PHASE_TITLE) continue;
      if (world.phase === PHASE_PLAY) {
        const before = world.events;
        const result = clickAt(world, point.x, point.y);
        if (result !== 'none') afterStep(world.events & ~before);
        if (result === 'found') announce(world.message);
        else if (result === 'wrong') announce(world.message);
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (!actions) return;
    if (actions & ACTION_MUTE) {
      world.muted = !world.muted;
      audio.muted = world.muted;
    }
    if (world.phase === PHASE_TITLE) {
      if (actions & ACTION_LEVEL_1) startLevel(world, 0);
      else if (actions & ACTION_LEVEL_2) startLevel(world, 1);
      else if (actions & ACTION_LEVEL_3) startLevel(world, 2);
      else if (actions & ACTION_CONFIRM) startGame(world);
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (world.phase === PHASE_PLAY) {
        world.phase = PHASE_PAUSED;
        announce('Paused.');
      } else if (world.phase === PHASE_PAUSED) {
        world.phase = PHASE_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (world.phase === PHASE_PLAY && actions & ACTION_HINT) {
      const hint = useHint(world);
      if (hint) audio.hint();
    }
    if (world.phase === PHASE_LEVEL_CLEAR && actions & (ACTION_NEXT | ACTION_CONFIRM)) {
      nextLevel(world);
      if (world.phase === PHASE_VICTORY) {
        audio.victory();
        saveBestIfBeaten();
      }
    }
    if ((world.phase === PHASE_VICTORY || world.phase === PHASE_GAME_OVER) && actions & ACTION_RESTART) {
      if (world.phase === PHASE_GAME_OVER) startLevel(world, world.levelIndex);
      else startGame(world);
    }
  }

  function step() {
    const timedOut = tick(world, STEP);
    if (timedOut) {
      audio.over();
      saveBestIfBeaten();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    handleClicks();
    if (world.phase === PHASE_PLAY || world.phase === PHASE_TITLE) {
      while (accumulator >= STEP) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    if (world.phase !== wasPhase) {
      if (world.phase === PHASE_VICTORY) audio.victory();
      wasPhase = world.phase;
    }
    renderer.draw(world, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && world.phase === PHASE_PLAY) {
      world.phase = PHASE_PAUSED;
      announce('Paused.');
    }
  });

  announce('Twin Lanterns. Choose a scene, or press 1, 2 or 3 to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
