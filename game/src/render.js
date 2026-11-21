// All drawing: the HUD, the two picture panels with their markers, and the
// title / pause / clear / victory / game-over screens. The renderer also
// remembers where this frame's buttons are, so the boot code can route a
// click to the right action.

import {
  VIEW,
  LEFT_PANEL,
  RIGHT_PANEL,
  LEVELS,
  LEVEL_CLEAR_BONUS,
  PALETTE,
  FONT,
  BEST_KEY,
} from './config.js';
import { PAINTERS } from './scenes.js';
import { createRandom } from './random.js';
import {
  PHASE_TITLE,
  PHASE_PLAY,
  PHASE_PAUSED,
  PHASE_LEVEL_CLEAR,
  PHASE_VICTORY,
  PHASE_GAME_OVER,
  levelOf,
  foundCount,
  remainingCount,
  allDiffIds,
} from './world.js';

const HEART = '♥';

function fmtTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const renderer = {
    regions: [],
    draw(world, best) {
      renderer.regions = [];
      ctx.clearRect(0, 0, VIEW.width, VIEW.height);
      ctx.fillStyle = PALETTE.backdrop;
      ctx.fillRect(0, 0, VIEW.width, VIEW.height);
      drawHud(world, best);
      drawPanels(world);
      drawBottomBar(world);
      if (world.phase === PHASE_TITLE) drawTitle(world, best);
      else if (world.phase === PHASE_PAUSED) drawOverlayCard(world, 'Paused', 'Press P or click Resume to keep playing.', [
        { id: 'resume', label: 'Resume  (P)' },
      ]);
      else if (world.phase === PHASE_LEVEL_CLEAR) {
        drawOverlayCard(world, 'Level clear!', levelClearText(world), [
          { id: 'next', label: world.levelIndex + 1 < LEVELS.length ? 'Next level  (N)' : 'See results  (N)' },
        ]);
      } else if (world.phase === PHASE_VICTORY) {
        drawOverlayCard(world, 'All differences found!', victoryText(world, best), [
          { id: 'again', label: 'Play again  (R)' },
          { id: 'title', label: 'Title screen' },
        ]);
      } else if (world.phase === PHASE_GAME_OVER) {
        drawOverlayCard(world, world.timeLeft <= 0 ? "Time's up!" : 'Out of hearts!', gameOverText(world), [
          { id: 'retry', label: 'Try this level again  (R)' },
          { id: 'title', label: 'Title screen' },
        ]);
      }
    },
    regionAt(x, y) {
      for (const region of renderer.regions) {
        if (x >= region.x && x <= region.x + region.w && y >= region.y && y <= region.y + region.h) return region.id;
      }
      return null;
    },
  };

  function button(x, y, w, h, label, id, opts = {}) {
    ctx.fillStyle = opts.accent ? PALETTE.button : PALETTE.card;
    roundRectPath(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = opts.accent ? PALETTE.button : PALETTE.cardEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = opts.accent ? PALETTE.buttonText : PALETTE.text;
    ctx.font = `bold ${opts.size ?? 19}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2 + 1);
    renderer.regions.push({ id, x, y, w, h });
  }

  function drawHud(world, best) {
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 0, VIEW.width, 100);
    ctx.fillStyle = PALETTE.hudLine;
    ctx.fillRect(0, 100, VIEW.width, 2);

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 30px ${FONT}`;
    ctx.fillText('TWIN LANTERNS', 40, 44);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText('Spot the difference', 40, 72);

    if (world.phase !== PHASE_TITLE) {
      const level = levelOf(world);
      ctx.fillStyle = PALETTE.text;
      ctx.font = `bold 22px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(level.name, VIEW.width / 2, 42);
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `15px ${FONT}`;
      ctx.fillText(level.subtitle, VIEW.width / 2, 68);
    }

    // Right cluster: timer, hearts, score, hint, mute.
    const inGame = world.phase === PHASE_PLAY || world.phase === PHASE_PAUSED;
    ctx.textAlign = 'right';
    ctx.fillStyle = inGame && world.timeLeft <= 30 ? PALETTE.red : PALETTE.text;
    ctx.font = `bold 26px ${FONT}`;
    ctx.fillText(inGame ? fmtTime(world.timeLeft) : '3:00', 880, 46);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('time left', 880, 70);

    ctx.font = `24px ${FONT}`;
    ctx.textAlign = 'left';
    let hx = 895;
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i < world.hearts ? PALETTE.red : '#4a3f66';
      ctx.fillText(HEART, hx, 48);
      hx += 28;
    }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('hearts', 895, 70);

    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 24px ${FONT}`;
    ctx.fillText(`${world.score}`, 1025, 46);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `14px ${FONT}`;
    ctx.fillText('score', 1025, 70);
    if (best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `13px ${FONT}`;
      ctx.fillText(`best ${best}`, 1025, 92);
    }

    if (inGame) {
      button(1040, 22, 96, 40, `Hint (${world.hintsLeft})`, 'hint');
      button(1148, 22, 92, 40, world.muted ? 'Muted' : 'Sound', 'mute');
    }
  }

  function drawPanels(world) {
    const level = levelOf(world);
    const paint = PAINTERS[level.id];
    const seed = world.seed + world.levelIndex * 7919;
    const leftRng = createRandom(seed);
    const rightRng = createRandom(seed);
    const t = world.now;
    paint(ctx, LEFT_PANEL, new Set(), leftRng, t);
    paint(ctx, RIGHT_PANEL, allDiffIds(level), rightRng, t);

    for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
      ctx.strokeStyle = PALETTE.panelEdge;
      ctx.lineWidth = 3;
      roundRectPath(ctx, panel.x, panel.y, panel.width, panel.height, 10);
      ctx.stroke();
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `bold 14px ${FONT}`;
      ctx.textAlign = 'left';
      ctx.fillText(panel === LEFT_PANEL ? 'A' : 'B', panel.x + 12, panel.y - 8);
    }

    // Found markers on both panels.
    for (const diff of level.diffs) {
      if (!world.found.has(diff.id)) continue;
      for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
        const cx = panel.x + diff.x;
        const cy = panel.y + diff.y;
        ctx.strokeStyle = PALETTE.gold;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, diff.r + 6, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = PALETTE.goldSoft;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, diff.r + 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = PALETTE.gold;
        ctx.font = `bold 18px ${FONT}`;
        ctx.textAlign = 'center';
        ctx.fillText('✓', cx, cy - diff.r - 16);
      }
    }

    // Hint pulse on the next unfound difference.
    if (world.hintPulse && world.phase === PHASE_PLAY) {
      const diff = level.diffs.find((d) => d.id === world.hintPulse.id);
      if (diff) {
        const pulse = 6 + Math.sin(world.now * 8) * 4;
        for (const panel of [LEFT_PANEL, RIGHT_PANEL]) {
          ctx.strokeStyle = PALETTE.goldSoft;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(panel.x + diff.x, panel.y + diff.y, diff.r + pulse, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Wrong-click crosses, fading.
    for (const mark of world.wrongMarks) {
      const age = 1 - (mark.until - world.now) / 1.2;
      ctx.globalAlpha = Math.max(0, 1 - age);
      ctx.strokeStyle = PALETTE.red;
      ctx.lineWidth = 4;
      const s = 12;
      ctx.beginPath();
      ctx.moveTo(mark.x - s, mark.y - s);
      ctx.lineTo(mark.x + s, mark.y + s);
      ctx.moveTo(mark.x + s, mark.y - s);
      ctx.lineTo(mark.x - s, mark.y + s);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function drawBottomBar(world) {
    const level = levelOf(world);
    const found = foundCount(world);
    const remain = remainingCount(world);
    ctx.fillStyle = PALETTE.hud;
    ctx.fillRect(0, 578, VIEW.width, 142);
    ctx.fillStyle = PALETTE.hudLine;
    ctx.fillRect(0, 578, VIEW.width, 2);

    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 28px ${FONT}`;
    ctx.fillText(`Found ${found} of ${level.diffs.length}  ·  ${remain} remain`, 40, 626);

    // Dots for each difference: gold when found, outline when not.
    let dx = 40;
    for (let i = 0; i < level.diffs.length; i += 1) {
      const diff = level.diffs[i];
      ctx.beginPath();
      ctx.arc(dx + 10, 656, 8, 0, Math.PI * 2);
      if (world.found.has(diff.id)) {
        ctx.fillStyle = PALETTE.gold;
        ctx.fill();
      } else {
        ctx.strokeStyle = PALETTE.cardEdge;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      dx += 30;
    }

    // Level dots.
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText('Levels', 1080, 622);
    let lx = 1100;
    for (let i = 0; i < LEVELS.length; i += 1) {
      ctx.beginPath();
      ctx.arc(lx + 10, 616, 8, 0, Math.PI * 2);
      if (i < world.levelIndex || world.phase === PHASE_VICTORY) {
        ctx.fillStyle = PALETTE.green;
        ctx.fill();
      } else if (i === world.levelIndex) {
        ctx.fillStyle = PALETTE.gold;
        ctx.fill();
      } else {
        ctx.strokeStyle = PALETTE.cardEdge;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      lx += 30;
    }

    // Message line.
    if (world.now < world.messageUntil && world.message) {
      ctx.textAlign = 'left';
      ctx.fillStyle = PALETTE.goldSoft;
      ctx.font = `17px ${FONT}`;
      ctx.fillText(world.message, 40, 700);
    } else {
      ctx.textAlign = 'left';
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `15px ${FONT}`;
      ctx.fillText('Click a difference on either picture  ·  H hint  ·  P pause  ·  M sound', 40, 700);
    }
  }

  function drawOverlayCard(world, title, body, actions) {
    ctx.fillStyle = 'rgba(10, 8, 18, 0.72)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    const w = 640;
    const h = 300;
    const x = (VIEW.width - w) / 2;
    const y = 170;
    ctx.fillStyle = PALETTE.card;
    roundRectPath(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = PALETTE.cardEdge;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 38px ${FONT}`;
    ctx.fillText(title, VIEW.width / 2, y + 62);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `19px ${FONT}`;
    const lines = body.split('\n');
    lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, y + 108 + i * 30));

    let bx = VIEW.width / 2 - (actions.length * 240 + (actions.length - 1) * 16) / 2;
    for (const action of actions) {
      button(bx, y + 210, 240, 52, action.label, action.id, { accent: true });
      bx += 256;
    }
  }

  function drawTitle(world, best) {
    ctx.fillStyle = 'rgba(10, 8, 18, 0.66)';
    ctx.fillRect(0, 100, VIEW.width, 478);
    const cx = VIEW.width / 2;
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 54px ${FONT}`;
    ctx.fillText('TWIN LANTERNS', cx, 208);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `22px ${FONT}`;
    ctx.fillText('Spot the difference — two lantern-lit pictures, seven secrets apart.', cx, 248);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `17px ${FONT}`;
    ctx.fillText('Find all 7 differences in each scene before the lantern burns down.', cx, 280);
    if (best > 0) {
      ctx.fillStyle = PALETTE.goldSoft;
      ctx.font = `bold 18px ${FONT}`;
      ctx.fillText(`Best total score: ${best}`, cx, 312);
    }

    const cards = [
      { id: 'level-0', label: '1 · Harbour at Dusk' },
      { id: 'level-1', label: '2 · Moonlit Garden' },
      { id: 'level-2', label: '3 · Bakery Morning' },
    ];
    let bx = cx - (cards.length * 260 + (cards.length - 1) * 16) / 2;
    for (const card of cards) {
      button(bx, 340, 260, 56, card.label, card.id, { size: 18 });
      bx += 276;
    }
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT}`;
    ctx.fillText('Click a scene, or press 1 / 2 / 3  ·  Click differences on either picture', cx, 436);
    ctx.fillText('Wrong clicks cost a heart  ·  H for a hint  ·  M to mute', cx, 462);
    ctx.fillText('A complete game, drawn and played entirely in your browser.', cx, 488);
  }

  function levelClearText(world) {
    const level = levelOf(world);
    const timeBonus = Math.round(world.timeLeft) * 2;
    return [
      `${level.name} — all ${level.diffs.length} differences found.`,
      `Level score ${world.levelScore}  (includes ${LEVEL_CLEAR_BONUS} clear bonus + ${timeBonus} time bonus)`,
      `Total score ${world.score}  ·  ${world.totalFound} of ${world.totalDiffs} differences found so far`,
    ].join('\n');
  }

  function victoryText(world, best) {
    const bestLine = Math.max(best, world.score) > 0 ? `Best total score: ${Math.max(best, world.score)}` : '';
    return [
      `Every difference in all three scenes — ${world.totalDiffs} in all.`,
      `Total score ${world.score}`,
      bestLine,
    ].filter(Boolean).join('\n');
  }

  function gameOverText(world) {
    const level = levelOf(world);
    return [
      `${level.name} — you found ${foundCount(world)} of ${level.diffs.length} differences.`,
      `Total score ${world.score}`,
      'The lanterns are still lit. Try the level again.',
    ].join('\n');
  }

  return renderer;
}

export function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off: the best score then lasts this visit only.
  }
}
