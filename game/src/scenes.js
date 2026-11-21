// The three scenes, painted fresh on a 2D canvas. Each painter draws one
// picture inside `box` (panel-local 580x440 space). `applied` is the set of
// difference ids active on this panel: the left panel always gets an empty
// set, the right panel gets every difference, so the two pictures are near
// identical and differ in exactly the seven spots the level defines.
// `t` is seconds, for gentle animation (water, fireflies, smoke).

function clipPanel(ctx, box) {
  // No save here: the painter's own save/restore pair owns the clip.
  ctx.beginPath();
  ctx.roundRect(0, 0, 580, 440, 10);
  ctx.clip();
}

function sky(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, 440);
  for (const [at, colour] of stops) g.addColorStop(at, colour);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 580, 440);
}

function disc(ctx, x, y, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function rect(ctx, x, y, w, h, colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, w, h);
}

function poly(ctx, points, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function gull(ctx, x, y, scale, colour) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 9 * scale, y);
  ctx.quadraticCurveTo(x - 4 * scale, y - 6 * scale, x, y);
  ctx.quadraticCurveTo(x + 4 * scale, y - 6 * scale, x + 9 * scale, y);
  ctx.stroke();
}

function glow(ctx, x, y, r, colour, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, colour);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------- harbour
export function paintHarbour(ctx, box, applied, rng, t) {
  ctx.save();
  ctx.translate(box.x, box.y);
  clipPanel(ctx, box);
  sky(ctx, [[0, '#241a44'], [0.45, '#7a4a6e'], [0.62, '#e8905f'], [1, '#3a2a55']]);

  // Setting sun and early stars.
  glow(ctx, 470, 120, 70, '#ffb36b', 0.8);
  disc(ctx, 470, 120, 34, '#ffd9a0');
  for (let i = 0; i < 14; i += 1) {
    const sx = 30 + rng.range(0, 520);
    const sy = 12 + rng.range(0, 90);
    disc(ctx, sx, sy, 1.4, 'rgba(255,255,255,0.85)');
  }
  gull(ctx, 200, 70, 1, '#2a1e3f');
  gull(ctx, 250, 52, 0.8, '#2a1e3f');
  gull(ctx, 340, 84, 0.9, '#2a1e3f');
  // Difference: an extra gull, only on the right picture.
  if (applied.has('gull')) gull(ctx, 118, 62, 1.1, '#2a1e3f');

  // Sea.
  rect(ctx, 0, 250, 580, 190, '#2c4a6e');
  ctx.strokeStyle = 'rgba(255,214,150,0.35)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i += 1) {
    const y = 272 + i * 32;
    ctx.beginPath();
    for (let x = 0; x <= 580; x += 20) {
      const yy = y + Math.sin(x / 46 + t * 0.9 + i * 1.7) * 3;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  // Sun path on the water.
  ctx.strokeStyle = 'rgba(255,190,110,0.4)';
  for (let i = 0; i < 4; i += 1) {
    const y = 268 + i * 34;
    ctx.beginPath();
    ctx.moveTo(430, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  // Lighthouse on the far shore.
  rect(ctx, 380, 130, 52, 130, '#e8ddc8');
  rect(ctx, 380, 150, 52, 18, '#c65b4e');
  rect(ctx, 380, 196, 52, 18, '#c65b4e');
  rect(ctx, 380, 242, 52, 18, '#c65b4e');
  rect(ctx, 372, 112, 68, 20, '#3a2f52');
  // Difference: the lighthouse window is lit on the left, dark on the right.
  disc(ctx, 406, 122, 7, applied.has('window') ? '#3a2f52' : '#ffe9a8');
  poly(ctx, [[372, 112], [406, 92], [440, 112]], '#c65b4e');
  disc(ctx, 406, 88, 5, '#e8b64c');
  glow(ctx, 406, 122, 46, '#ffe9a8', applied.has('window') ? 0.12 : 0.55);

  // Big fishing boat, left of centre.
  poly(ctx, [[180, 300], [360, 300], [335, 336], [205, 336]], '#7a4a3a');
  rect(ctx, 196, 278, 148, 22, '#8f5a44');
  rect(ctx, 262, 190, 8, 92, '#5a3a2e');
  poly(ctx, [[270, 190], [270, 236], [330, 236]], '#f5efe0');
  // Difference: the mast flag flies on the left, and is gone on the right.
  if (!applied.has('flag')) {
    poly(ctx, [[270, 190], [300, 198], [270, 206]], '#e5534b');
    disc(ctx, 270, 188, 3, '#e8b64c');
  }
  disc(ctx, 300, 268, 7, '#ffe9a8');

  // Small rowing boat, right side, tied to the quay.
  poly(ctx, [[478, 318], [548, 318], [534, 342], [492, 342]], '#4a6e8f');
  // Difference: the mooring rope is there on the left, gone on the right.
  if (!applied.has('rope')) {
    ctx.strokeStyle = '#d8c8a8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(486, 322);
    ctx.quadraticCurveTo(500, 300, 516, 292);
    ctx.stroke();
  }

  // Quay along the bottom, with posts, crates and a lamp.
  rect(ctx, 0, 356, 580, 84, '#4a3a52');
  rect(ctx, 0, 356, 580, 6, '#6e5578');
  rect(ctx, 60, 330, 12, 30, '#3a2f42');
  rect(ctx, 520, 330, 12, 30, '#3a2f42');
  // Crates.
  rect(ctx, 430, 322, 34, 34, '#a8763e');
  rect(ctx, 430, 322, 34, 6, '#c08f52');
  rect(ctx, 380, 330, 26, 26, '#8f6234');
  // Difference: one more crate, only on the right picture.
  if (applied.has('crate')) {
    rect(ctx, 470, 322, 34, 34, '#a8763e');
    rect(ctx, 470, 322, 34, 6, '#c08f52');
  }
  // Quay lamp: warm on the left, cold blue on the right.
  rect(ctx, 84, 288, 6, 68, '#2e2438');
  const lampColour = applied.has('lantern') ? '#7fd4e8' : '#ffd98a';
  glow(ctx, 87, 282, 34, lampColour, 0.7);
  disc(ctx, 87, 282, 9, lampColour);
  poly(ctx, [[79, 272], [95, 272], [91, 280], [83, 280]], '#2e2438');

  // Difference: a fish jumps out of the water, only on the right picture.
  if (applied.has('fish')) {
    const fy = 402 - Math.sin(t * 1.4) * 4;
    ctx.save();
    ctx.translate(240, fy);
    ctx.rotate(-0.5);
    ellipse(ctx, 0, 0, 16, 7, '#9fc3d8');
    poly(ctx, [[-14, 0], [-24, -8], [-24, 8]], '#7fa8c0');
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(240, 416, 12, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- garden
export function paintGarden(ctx, box, applied, rng, t) {
  ctx.save();
  ctx.translate(box.x, box.y);
  clipPanel(ctx, box);
  sky(ctx, [[0, '#0e1a33'], [0.5, '#1d3a52'], [1, '#2c4a5e']]);

  // Moon: pale on the left, amber on the right.
  const moonColour = applied.has('moon') ? '#e8a34c' : '#f5eeda';
  glow(ctx, 486, 66, 60, moonColour, 0.7);
  disc(ctx, 486, 66, 30, moonColour);
  disc(ctx, 476, 58, 6, 'rgba(0,0,0,0.08)');
  disc(ctx, 494, 74, 4, 'rgba(0,0,0,0.08)');
  for (let i = 0; i < 22; i += 1) {
    disc(ctx, 20 + rng.range(0, 540), 10 + rng.range(0, 130), 1.3, 'rgba(255,255,255,0.8)');
  }

  // Cherry tree, left.
  ctx.strokeStyle = '#4a2e3a';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(40, 300);
  ctx.quadraticCurveTo(70, 220, 96, 150);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(96, 150);
  ctx.quadraticCurveTo(130, 120, 168, 108);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(96, 150);
  ctx.quadraticCurveTo(70, 110, 60, 84);
  ctx.stroke();
  const blossom = (x, y, r) => {
    disc(ctx, x, y, r, '#f2a7c3');
    disc(ctx, x - r * 0.5, y - r * 0.4, r * 0.55, '#f7c3d6');
    disc(ctx, x + r * 0.5, y + r * 0.3, r * 0.5, '#ef8fb4');
  };
  blossom(170, 100, 16);
  blossom(140, 78, 13);
  blossom(60, 76, 14);
  blossom(110, 60, 11);
  blossom(196, 128, 12);
  // Difference: one blossom cluster is missing on the right picture.
  if (!applied.has('blossom')) blossom(96, 108, 15);

  // Ground and pond.
  rect(ctx, 0, 280, 580, 160, '#1e3a2e');
  ellipse(ctx, 290, 380, 250, 62, '#16324a');
  ellipse(ctx, 290, 378, 235, 52, '#1d4258');
  ctx.strokeStyle = 'rgba(180,220,240,0.25)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    ctx.beginPath();
    ctx.ellipse(290, 372 + i * 10, 190 - i * 30, 34 - i * 6, 0, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  // Lily pads.
  ellipse(ctx, 120, 360, 26, 10, '#3a7a4e');
  ellipse(ctx, 200, 396, 30, 11, '#2f6e44');
  ellipse(ctx, 470, 392, 24, 9, '#3a7a4e');
  disc(ctx, 200, 390, 5, '#f2a7c3');
  disc(ctx, 206, 394, 4, '#f7c3d6');

  // Koi.
  const koi = (x, y, flip, colour) => {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ellipse(ctx, 0, 0, 20, 8, colour);
    poly(ctx, [[-18, 0], [-30, -9], [-30, 9]], colour);
    disc(ctx, 12, -3, 2, '#1a1a1a');
    ctx.restore();
  };
  koi(250, 372, false, '#e8823e');
  koi(360, 392, true, '#f5efe0');
  // Difference: a third koi swims in, only on the right picture.
  if (applied.has('koi')) koi(150, 360, false, '#e8a34c');

  // Arched bridge.
  ctx.strokeStyle = '#a83e2e';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(210, 330);
  ctx.quadraticCurveTo(290, 252, 370, 330);
  ctx.stroke();
  ctx.strokeStyle = '#c65b4e';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(228, 316);
  ctx.quadraticCurveTo(290, 252, 352, 316);
  ctx.stroke();
  // Difference: the paper lantern hanging from the bridge is gone on the right.
  if (!applied.has('bridge')) {
    ctx.strokeStyle = '#d8c8a8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(290, 268);
    ctx.lineTo(290, 282);
    ctx.stroke();
    glow(ctx, 290, 292, 22, '#ffb36b', 0.8);
    ellipse(ctx, 290, 292, 10, 13, '#ff9a4d');
  }

  // Stone lantern, right.
  rect(ctx, 448, 300, 40, 14, '#8a8a7a');
  rect(ctx, 462, 268, 12, 34, '#8a8a7a');
  rect(ctx, 452, 252, 32, 16, '#7a7a6a');
  poly(ctx, [[448, 252], [468, 236], [488, 252]], '#6a6a5a');
  glow(ctx, 468, 276, 16, '#ffe9a8', 0.6);
  disc(ctx, 468, 276, 5, '#ffe9a8');
  // Difference: a small stone appears beside it, only on the right picture.
  if (applied.has('stone')) ellipse(ctx, 468, 330, 14, 9, '#6a6a5a');

  // Fireflies.
  for (let i = 0; i < 9; i += 1) {
    const fx = 120 + rng.range(0, 340);
    const fy = 150 + rng.range(0, 120);
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.3);
    glow(ctx, fx, fy, 8, '#ffe9a8', 0.25 + tw * 0.5);
    disc(ctx, fx, fy, 2, '#ffe9a8');
  }
  // Difference: one extra bright firefly, only on the right picture.
  if (applied.has('firefly')) {
    glow(ctx, 300, 210, 14, '#ffe9a8', 0.9);
    disc(ctx, 300, 210, 3.5, '#fff6c8');
  }

  // Difference: a frog sits at the pond's edge, only on the right picture.
  if (applied.has('frog')) {
    ellipse(ctx, 400, 396, 13, 9, '#5da85d');
    disc(ctx, 392, 385, 5, '#5da85d');
    disc(ctx, 408, 385, 5, '#5da85d');
    disc(ctx, 391, 383, 1.6, '#1a1a1a');
    disc(ctx, 409, 383, 1.6, '#1a1a1a');
  }
  ctx.restore();
}

// ---------------------------------------------------------------- bakery
export function paintBakery(ctx, box, applied, rng, t) {
  ctx.save();
  ctx.translate(box.x, box.y);
  clipPanel(ctx, box);
  sky(ctx, [[0, '#f7d9a0'], [0.6, '#f2a56b'], [1, '#e8825a']]);

  // Morning sun and drifting clouds.
  glow(ctx, 96, 74, 60, '#ffe9a8', 0.8);
  disc(ctx, 96, 74, 28, '#fff3c8');
  ellipse(ctx, 300, 60, 46, 12, 'rgba(255,255,255,0.85)');
  ellipse(ctx, 330, 66, 34, 10, 'rgba(255,255,255,0.85)');
  ellipse(ctx, 470, 44, 40, 11, 'rgba(255,255,255,0.8)');

  // Street.
  rect(ctx, 0, 330, 580, 110, '#8a7a6a');
  rect(ctx, 0, 330, 580, 8, '#a89888');
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 2;
  for (let x = 20; x < 580; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 356);
    ctx.lineTo(x + 40, 356);
    ctx.stroke();
  }

  // Shopfront.
  rect(ctx, 90, 130, 400, 210, '#f2e3c8');
  rect(ctx, 90, 130, 400, 10, '#a8763e');
  // Chimney with smoke.
  rect(ctx, 420, 76, 26, 56, '#8f6a58');
  rect(ctx, 416, 70, 34, 8, '#7a5a48');
  // Difference: smoke curls from the chimney, only on the right picture.
  if (applied.has('chimney')) {
    const sway = Math.sin(t * 1.2) * 6;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.arc(433 + sway, 52 - (t % 2) * 4, 9, 0, Math.PI * 2);
    ctx.arc(440 + sway, 38 - (t % 2) * 4, 12, 0, Math.PI * 2);
    ctx.arc(432 + sway, 22 - (t % 2) * 4, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Awning: stripes, one of which changes colour on the right.
  const stripe = (i, x) => {
    const colours = ['#c65b4e', '#f5efe0'];
    let colour = colours[i % 2];
    if (applied.has('awning') && i === 2) colour = '#3a7a8f';
    rect(ctx, x, 140, 50, 34, colour);
  };
  for (let i = 0; i < 8; i += 1) stripe(i, 90 + i * 50);
  poly(ctx, [[90, 174], [490, 174], [480, 186], [100, 186]], '#a8763e');

  // Shop window with loaves.
  rect(ctx, 130, 210, 180, 96, '#7fb3d8');
  rect(ctx, 130, 210, 180, 96, 'rgba(255,255,255,0.18)');
  rect(ctx, 126, 206, 188, 8, '#a8763e');
  rect(ctx, 126, 302, 188, 8, '#a8763e');
  const loaf = (x, y) => {
    ellipse(ctx, x, y, 20, 11, '#c08f52');
    ctx.strokeStyle = '#8f6234';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 3);
    ctx.lineTo(x + 10, y - 3);
    ctx.stroke();
  };
  loaf(170, 282);
  loaf(220, 282);
  loaf(270, 282);
  // Difference: one more loaf on the shelf, only on the right picture.
  if (applied.has('loaf')) loaf(330, 240);

  // Door.
  rect(ctx, 350, 210, 70, 130, '#7a4a3a');
  disc(ctx, 408, 278, 4, '#e8b64c');
  rect(ctx, 362, 226, 46, 40, 'rgba(255,255,255,0.25)');

  // Hanging sign: present on the left, gone on the right.
  if (!applied.has('sign')) {
    ctx.strokeStyle = '#5a3a2e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(500, 150);
    ctx.lineTo(500, 168);
    ctx.stroke();
    disc(ctx, 500, 186, 20, '#f5efe0');
    ctx.strokeStyle = '#c65b4e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(500, 186, 20, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#c65b4e';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OPEN', 500, 191);
  }

  // Bread baskets by the window.
  rect(ctx, 440, 312, 40, 26, '#a8763e');
  ellipse(ctx, 460, 312, 20, 7, '#c08f52');
  disc(ctx, 452, 308, 5, '#e8c88a');
  disc(ctx, 464, 306, 5, '#e8c88a');
  // Difference: a second basket, only on the right picture.
  if (applied.has('basket')) {
    rect(ctx, 452, 330, 40, 26, '#a8763e');
    ellipse(ctx, 472, 330, 20, 7, '#c08f52');
    disc(ctx, 464, 326, 5, '#e8c88a');
    disc(ctx, 476, 324, 5, '#e8c88a');
  }

  // Bicycle leaning by the door.
  ctx.strokeStyle = '#3a3a4a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(196, 386, 22, 0, Math.PI * 2);
  ctx.stroke();
  // Difference: the front wheel is missing on the right picture.
  if (!applied.has('wheel')) {
    ctx.beginPath();
    ctx.arc(252, 386, 22, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(196, 386);
  ctx.lineTo(224, 350);
  ctx.lineTo(252, 386);
  ctx.moveTo(224, 350);
  ctx.lineTo(214, 340);
  ctx.moveTo(224, 350);
  ctx.lineTo(244, 344);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(214, 340);
  ctx.lineTo(206, 340);
  ctx.moveTo(244, 344);
  ctx.lineTo(252, 344);
  ctx.stroke();

  // Cat on the doorstep: there on the left, gone on the right.
  if (!applied.has('cat')) {
    ellipse(ctx, 108, 380, 22, 13, '#e8e0d0');
    disc(ctx, 126, 364, 10, '#e8e0d0');
    poly(ctx, [[120, 356], [124, 346], [128, 356]], '#e8e0d0');
    poly(ctx, [[130, 356], [134, 346], [138, 356]], '#e8e0d0');
    ctx.strokeStyle = '#e8e0d0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(88, 382);
    ctx.quadraticCurveTo(72, 372, 78, 358);
    ctx.stroke();
    disc(ctx, 129, 362, 1.6, '#1a1a1a');
  }
  ctx.restore();
}

export const PAINTERS = { harbour: paintHarbour, garden: paintGarden, bakery: paintBakery };
