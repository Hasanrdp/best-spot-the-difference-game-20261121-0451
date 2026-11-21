// Pointer and keyboard input, translated into logical canvas pixels and
// one-shot actions. The game loop drains the queue once per frame.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_NEXT = 16;
export const ACTION_RESTART = 32;
export const ACTION_LEVEL_1 = 64;
export const ACTION_LEVEL_2 = 128;
export const ACTION_LEVEL_3 = 256;

const KEY_ACTIONS = {
  Space: ACTION_CONFIRM,
  Enter: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyH: ACTION_HINT,
  KeyM: ACTION_MUTE,
  KeyN: ACTION_NEXT,
  KeyR: ACTION_RESTART,
  Digit1: ACTION_LEVEL_1,
  Digit2: ACTION_LEVEL_2,
  Digit3: ACTION_LEVEL_3,
};

export function createInput(canvas) {
  const state = {
    queuedActions: 0,
    clicks: [],
    pointer: { x: 0, y: 0, inside: false },
  };

  function toLogical(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('pointermove', (event) => {
    const point = toLogical(event);
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.inside = true;
  });

  canvas.addEventListener('pointerleave', () => {
    state.pointer.inside = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const point = toLogical(event);
    state.clicks.push(point);
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.inside = true;
  });

  window.addEventListener('keydown', (event) => {
    const action = KEY_ACTIONS[event.code];
    if (action === undefined) return;
    if (event.code === 'Space') event.preventDefault();
    if (!event.repeat) state.queuedActions |= action;
  });

  return {
    takeActions() {
      const actions = state.queuedActions;
      state.queuedActions = 0;
      return actions;
    },
    takeClicks() {
      const clicks = state.clicks;
      state.clicks = [];
      return clicks;
    },
    pointer() {
      return state.pointer;
    },
  };
}
