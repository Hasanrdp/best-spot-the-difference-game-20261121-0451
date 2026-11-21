// Twin Lanterns — tuning, layout and level data in one place.
// The playfield is a fixed 1280x720 logical canvas; the renderer scales it
// to fit the window, so no rule below depends on the screen size.

export const VIEW = { width: 1280, height: 720 };

// The two picture panels, in logical pixels. Both panels show the same scene;
// the right one carries the differences.
export const PANEL = { width: 580, height: 440, y: 118, gap: 20 };
export const LEFT_PANEL = { x: 40, y: PANEL.y, width: PANEL.width, height: PANEL.height };
export const RIGHT_PANEL = {
  x: 40 + PANEL.width + PANEL.gap,
  y: PANEL.y,
  width: PANEL.width,
  height: PANEL.height,
};

export const STEP = 1 / 60;
export const LEVEL_TIME_SECONDS = 180;
export const HEARTS = 3;
export const HINTS_PER_LEVEL = 3;
export const POINTS_PER_FIND = 100;
export const TIME_BONUS_PER_SECOND = 2;
export const WRONG_PENALTY = 25;
export const HINT_COST = 50;
export const LEVEL_CLEAR_BONUS = 250;

// A difference is a spot inside a panel, in panel-local pixels (0..580, 0..440).
// `r` is the click tolerance radius; `hint` is the text the hint button shows.
export const LEVELS = [
  {
    id: 'harbour',
    name: 'Harbour at Dusk',
    subtitle: 'Fishing boats come home as the lighthouse wakes.',
    diffs: [
      { id: 'gull', x: 118, y: 62, r: 26, hint: 'Look at the sky, left side' },
      { id: 'flag', x: 300, y: 96, r: 24, hint: 'A flag on the tall mast' },
      { id: 'crate', x: 470, y: 356, r: 30, hint: 'Crates stacked on the quay' },
      { id: 'lantern', x: 88, y: 300, r: 26, hint: 'A lamp on the quay post' },
      { id: 'window', x: 402, y: 176, r: 24, hint: 'A lit window in the lighthouse' },
      { id: 'fish', x: 240, y: 402, r: 26, hint: 'Something jumped out of the water' },
      { id: 'rope', x: 516, y: 250, r: 26, hint: 'The mooring rope by the small boat' },
    ],
  },
  {
    id: 'garden',
    name: 'Moonlit Garden',
    subtitle: 'Koi drift under the bridge while fireflies wake.',
    diffs: [
      { id: 'koi', x: 150, y: 360, r: 28, hint: 'A fish in the pond, lower left' },
      { id: 'stone', x: 468, y: 330, r: 28, hint: 'A stone by the pond edge' },
      { id: 'blossom', x: 96, y: 108, r: 26, hint: 'Blossom on the cherry branch' },
      { id: 'moon', x: 486, y: 66, r: 26, hint: 'The moon, upper right' },
      { id: 'firefly', x: 300, y: 210, r: 22, hint: 'A firefly over the pond' },
      { id: 'bridge', x: 292, y: 300, r: 26, hint: 'The little bridge, middle' },
      { id: 'frog', x: 400, y: 396, r: 24, hint: 'Something small sits by the water' },
    ],
  },
  {
    id: 'bakery',
    name: 'Bakery Morning',
    subtitle: 'Fresh bread, warm light, and a cat on the prowl.',
    diffs: [
      { id: 'cat', x: 108, y: 372, r: 28, hint: 'Near the doorstep, low down' },
      { id: 'awning', x: 290, y: 96, r: 28, hint: 'A stripe on the awning' },
      { id: 'basket', x: 452, y: 330, r: 28, hint: 'Bread baskets by the window' },
      { id: 'sign', x: 500, y: 150, r: 26, hint: 'The hanging shop sign' },
      { id: 'wheel', x: 196, y: 386, r: 26, hint: 'The bicycle wheel' },
      { id: 'chimney', x: 96, y: 74, r: 24, hint: 'Smoke over the roof' },
      { id: 'loaf', x: 330, y: 240, r: 24, hint: 'A loaf in the window' },
    ],
  },
];

export const PALETTE = {
  backdrop: '#14101d',
  panelEdge: '#3a2f52',
  panelEdgeFound: '#e8b64c',
  hud: '#1d1729',
  hudLine: '#3a2f52',
  text: '#f5efe0',
  muted: '#b8aed0',
  gold: '#e8b64c',
  goldSoft: '#f6d488',
  red: '#e5534b',
  green: '#7dc383',
  blue: '#6fb3d8',
  card: '#241d33',
  cardEdge: '#4a3f66',
  button: '#e8b64c',
  buttonText: '#241a08',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** localStorage key for the best total score (this browser only). */
export const BEST_KEY = 'twin-lanterns.best';
