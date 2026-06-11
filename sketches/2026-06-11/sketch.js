// Attention Ledger - drag attention lenses over fragile explanation blocks.

const BLOCK_LABELS = [
  'term',
  'example',
  'edge',
  'counter',
  'proof',
  'test',
  'source',
  'claim',
  'scope',
  'map',
  'step',
  'recall',
];

const PALETTE = {
  paper: '#ece7d8',
  ink: '#282621',
  faint: '#cfc5ad',
  red: '#b94b3d',
  blue: '#315e78',
  green: '#4f7255',
  gold: '#b28a36',
  violet: '#6c5a8d',
};

let blocks = [];
let bridges = [];
let lenses = [];
let sparks = [];
let heldLens = -1;
let selectedBlock = -1;
let seedValue = 611;
let mode = 0;
let frozen = false;
let pulse = { x: 0, y: 0, force: 0 };

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(min(2, window.devicePixelRatio || 1));
  textFont('ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
  resetLedger();
}

function resetLedger() {
  randomSeed(seedValue);
  noiseSeed(seedValue);
  blocks = [];
  bridges = [];
  sparks = [];
  selectedBlock = -1;
  const compact = width < 620;
  const columns = compact ? 3 : 4;
  const rows = compact ? 4 : 3;
  const left = width * (compact ? 0.09 : 0.1);
  const right = width * (compact ? 0.91 : 0.9);
  const top = height * (compact ? 0.19 : 0.22);
  const bottom = height * 0.83;
  const cellW = (right - left) / columns;
  const cellH = (bottom - top) / rows;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const i = row * columns + col;
      blocks.push({
        id: i,
        label: BLOCK_LABELS[i % BLOCK_LABELS.length],
        x: left + cellW * (col + 0.5) + random(-cellW * 0.12, cellW * 0.12),
        y: top + cellH * (row + 0.5) + random(-cellH * 0.14, cellH * 0.14),
        w: min(cellW * 0.68, compact ? 92 : 116),
        h: compact ? 38 : 44,
        vx: random(-0.2, 0.2),
        vy: random(-0.2, 0.2),
        strain: random(0.22, 0.7),
        clarity: random(0.26, 0.72),
        phase: random(TWO_PI),
        color: random([PALETTE.blue, PALETTE.green, PALETTE.gold, PALETTE.violet]),
      });
    }
  }

  for (let i = 0; i < blocks.length; i += 1) {
    const a = blocks[i];
    const candidates = blocks
      .filter((b) => b.id !== a.id && abs(b.y - a.y) < cellH * 1.25)
      .sort((m, n) => dist(a.x, a.y, m.x, m.y) - dist(a.x, a.y, n.x, n.y));
    candidates.slice(0, compact ? 1 : 2).forEach((b) => {
      if (!bridges.some((edge) => sameEdge(edge, a.id, b.id))) {
        bridges.push({ a: a.id, b: b.id, trust: random(0.25, 0.9), phase: random(TWO_PI) });
      }
    });
  }

  lenses = [
    { x: width * 0.28, y: height * 0.45, r: compact ? 70 : 92, label: 'attention', hue: PALETTE.blue },
    { x: width * 0.63, y: height * 0.55, r: compact ? 62 : 84, label: 'evidence', hue: PALETTE.green },
  ];
}

function sameEdge(edge, a, b) {
  return (edge.a === a && edge.b === b) || (edge.a === b && edge.b === a);
}

function draw() {
  background(PALETTE.paper);
  drawPaper();
  if (!frozen) {
    updateLedger();
    updateSparks();
  }
  drawTitle();
  drawBridges();
  drawBlocks();
  drawLenses();
  drawSparks();
  drawPulse();
  drawHud();
  pulse.force *= 0.88;
}

function drawPaper() {
  noStroke();
  for (let y = 0; y < height; y += 7) {
    fill(236 + noise(y * 0.02, frameCount * 0.003) * 8, 229, 211, 30);
    rect(0, y, width, 3);
  }
  stroke(PALETTE.faint + '66');
  strokeWeight(1);
  const gap = max(42, min(width, height) * 0.075);
  for (let x = -gap; x < width + gap; x += gap) {
    line(x, height * 0.16, x, height);
  }
  for (let y = height * 0.18; y < height; y += gap) {
    line(0, y, width, y);
  }
}

function updateLedger() {
  blocks.forEach((b, index) => {
    let attention = 0;
    lenses.forEach((lens) => {
      const d = dist(b.x, b.y, lens.x, lens.y);
      if (d < lens.r) attention += 1 - d / lens.r;
    });

    const targetClarity = constrain(0.2 + attention * 0.72 - b.strain * 0.25, 0.06, 1);
    b.clarity = lerp(b.clarity, targetClarity, 0.035);
    b.strain = constrain(b.strain + (attention > 0.15 ? -0.0025 : 0.0014), 0.04, 1);

    const driftX = sin(frameCount * 0.009 + b.phase) * (1 + b.strain * 9);
    const driftY = cos(frameCount * 0.011 + b.phase * 0.7) * (1 + b.strain * 6);
    b.vx = (b.vx + driftX * 0.002) * 0.92;
    b.vy = (b.vy + driftY * 0.002) * 0.92;

    if (pulse.force > 0.04) {
      const d = dist(b.x, b.y, pulse.x, pulse.y);
      if (d < 180) {
        const tug = (1 - d / 180) * pulse.force;
        b.vx += ((b.x - pulse.x) / max(d, 1)) * tug * 0.9;
        b.vy += ((b.y - pulse.y) / max(d, 1)) * tug * 0.9;
        b.strain = constrain(b.strain + tug * 0.08, 0.04, 1);
      }
    }

    b.x = constrain(b.x + b.vx, b.w * 0.7, width - b.w * 0.7);
    b.y = constrain(b.y + b.vy, height * 0.18, height - b.h * 1.4);

    if (attention > 0.4 && frameCount % 9 === index % 9) {
      sparks.push({ from: b.id, x: b.x, y: b.y, life: 1, hue: attention > 1 ? PALETTE.green : b.color });
    }
  });

  bridges.forEach((edge) => {
    const a = blocks[edge.a];
    const b = blocks[edge.b];
    const sharedClarity = min(a.clarity, b.clarity);
    edge.trust = constrain(lerp(edge.trust, sharedClarity - (a.strain + b.strain) * 0.16, 0.02), 0.05, 1);
  });
}

function updateSparks() {
  for (let i = sparks.length - 1; i >= 0; i -= 1) {
    const s = sparks[i];
    const source = blocks[s.from];
    s.life -= 0.018;
    s.x = lerp(s.x, source.x, 0.025) + noise(i, frameCount * 0.02) * 4 - 2;
    s.y -= 0.35 + source.clarity * 0.5;
    if (s.life <= 0) sparks.splice(i, 1);
  }
}

function drawTitle() {
  const compact = width < 620;
  noStroke();
  fill(PALETTE.ink);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(compact ? 24 : 34);
  text('ATTENTION LEDGER', width * 0.06, compact ? 22 : 30);
  textStyle(NORMAL);
  textSize(compact ? 11 : 13);
  fill('#655e51');
  text('drag lenses over blocks; clarity rises only where attention and evidence overlap', width * 0.06, compact ? 56 : 72, width * 0.86);
}

function drawBridges() {
  bridges.forEach((edge) => {
    const a = blocks[edge.a];
    const b = blocks[edge.b];
    const mid = sin(frameCount * 0.012 + edge.phase) * 16;
    const trustColor = edge.trust < 0.32 ? PALETTE.red : edge.trust > 0.66 ? PALETTE.green : '#796d57';
    noFill();
    stroke(trustColor + hexAlpha(0.25 + edge.trust * 0.45));
    strokeWeight(1.2 + edge.trust * 4);
    beginShape();
    vertex(a.x, a.y);
    quadraticVertex((a.x + b.x) * 0.5, (a.y + b.y) * 0.5 + mid, b.x, b.y);
    endShape();
  });
}

function drawBlocks() {
  blocks.forEach((b, index) => {
    const active = index === selectedBlock;
    const shake = (1 - b.clarity) * b.strain * (active ? 6 : 2);
    const x = b.x + random(-shake, shake) * 0.08;
    const y = b.y + random(-shake, shake) * 0.08;
    const alpha = 0.45 + b.clarity * 0.5;

    rectMode(CENTER);
    noStroke();
    fill('#d5c8ad88');
    rect(x + 5, y + 6, b.w, b.h, 3);
    fill(b.color + hexAlpha(alpha));
    rect(x, y, b.w, b.h, 3);

    noFill();
    stroke(active ? PALETTE.ink : (b.clarity > 0.62 ? PALETTE.green : PALETTE.red));
    strokeWeight(active ? 3 : 1.4);
    rect(x, y, b.w, b.h, 3);

    const cuts = ceil((1 - b.clarity) * 5);
    stroke(PALETTE.paper + 'cc');
    strokeWeight(1.1);
    for (let i = 0; i < cuts; i += 1) {
      const yy = y - b.h * 0.35 + (i / max(cuts - 1, 1)) * b.h * 0.7;
      line(x - b.w * 0.36, yy, x + b.w * 0.36, yy + sin(frameCount * 0.03 + i + b.phase) * 3);
    }

    fill(PALETTE.paper);
    noStroke();
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(width < 620 ? 11 : 13);
    text(b.label.toUpperCase(), x, y - 1);

    textStyle(NORMAL);
    textSize(9);
    fill(PALETTE.ink + 'aa');
    text(nf(round(b.clarity * 100), 2) + '%', x, y + b.h * 0.32);
  });
}

function drawLenses() {
  lenses.forEach((lens, index) => {
    const held = index === heldLens;
    noFill();
    stroke(lens.hue + (held ? 'ee' : 'aa'));
    strokeWeight(held ? 4 : 2.5);
    circle(lens.x, lens.y, lens.r * 2);
    stroke(PALETTE.ink + '33');
    strokeWeight(1);
    circle(lens.x, lens.y, lens.r * 1.42);

    noStroke();
    fill(PALETTE.paper + 'dd');
    circle(lens.x, lens.y, 9);
    fill(lens.hue);
    circle(lens.x, lens.y, held ? 7 : 5);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(10);
    fill(PALETTE.ink);
    text(lens.label.toUpperCase(), lens.x, lens.y - lens.r - 14);
  });
}

function drawSparks() {
  sparks.forEach((s) => {
    noStroke();
    fill(s.hue + hexAlpha(s.life));
    circle(s.x, s.y, 3 + s.life * 9);
    fill(PALETTE.paper + hexAlpha(s.life));
    circle(s.x, s.y, 1.5 + s.life * 3);
  });
}

function drawPulse() {
  if (pulse.force <= 0.03) return;
  noFill();
  stroke(PALETTE.red + hexAlpha(pulse.force * 0.7));
  strokeWeight(2);
  circle(pulse.x, pulse.y, 240 * (1 - pulse.force * 0.4));
}

function drawHud() {
  const avgClarity = blocks.reduce((sum, b) => sum + b.clarity, 0) / blocks.length;
  const avgTrust = bridges.reduce((sum, e) => sum + e.trust, 0) / max(bridges.length, 1);
  const fragile = blocks.filter((b) => b.strain > 0.62 && b.clarity < 0.48).length;
  const compact = width < 620;
  const panelW = compact ? width * 0.88 : 310;
  const panelH = compact ? 74 : 88;
  const x = width * 0.06;
  const y = height - panelH - 18;

  noStroke();
  fill('#f5efdfdd');
  rect(x, y, panelW, panelH, 4);
  stroke(PALETTE.ink + '33');
  noFill();
  rect(x, y, panelW, panelH, 4);

  fill(PALETTE.ink);
  noStroke();
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(12);
  text('ledger state', x + 14, y + 12);
  textStyle(NORMAL);
  textSize(11);
  fill('#655e51');
  const line = compact ? 18 : 20;
  text(`clarity ${round(avgClarity * 100)}%   bridge trust ${round(avgTrust * 100)}%   fragile ${fragile}`, x + 14, y + 32);
  text(`mode ${modeName()}   ${frozen ? 'frozen' : 'live'}   drag/tap lenses, M/F/R/Space`, x + 14, y + 32 + line);
}

function mousePressed() {
  handlePress(mouseX, mouseY);
}

function touchStarted() {
  handlePress(firstTouchX(), firstTouchY());
  return false;
}

function handlePress(x, y) {
  heldLens = -1;
  lenses.forEach((lens, index) => {
    if (dist(x, y, lens.x, lens.y) < lens.r) heldLens = index;
  });

  selectedBlock = -1;
  blocks.forEach((b, index) => {
    if (abs(x - b.x) < b.w * 0.58 && abs(y - b.y) < b.h * 0.62) {
      selectedBlock = index;
      b.strain = constrain(b.strain - 0.18, 0.04, 1);
      b.clarity = constrain(b.clarity + 0.18, 0.04, 1);
      sparks.push({ from: b.id, x: b.x, y: b.y, life: 1, hue: PALETTE.gold });
    }
  });

  pulse = { x, y, force: 1 };
}

function mouseDragged() {
  handleDrag(mouseX, mouseY);
}

function touchMoved() {
  handleDrag(firstTouchX(), firstTouchY());
  return false;
}

function handleDrag(x, y) {
  if (heldLens >= 0) {
    lenses[heldLens].x = constrain(x, 20, width - 20);
    lenses[heldLens].y = constrain(y, height * 0.12, height - 22);
  }
}

function mouseReleased() {
  heldLens = -1;
}

function touchEnded() {
  heldLens = -1;
  return false;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    seedValue += 17;
    resetLedger();
  } else if (key === 'f' || key === 'F') {
    frozen = !frozen;
  } else if (key === 'm' || key === 'M') {
    mode = (mode + 1) % 3;
    if (mode === 1) lenses[0].r = min(width, height) * 0.18;
    if (mode === 2) lenses[1].r = min(width, height) * 0.24;
    if (mode === 0) resetLensSizes();
  } else if (key === ' ') {
    pulse = { x: random(width * 0.18, width * 0.82), y: random(height * 0.25, height * 0.78), force: 1 };
  }
}

function resetLensSizes() {
  const compact = width < 620;
  lenses[0].r = compact ? 70 : 92;
  lenses[1].r = compact ? 62 : 84;
}

function modeName() {
  if (mode === 1) return 'wide attention';
  if (mode === 2) return 'strict evidence';
  return 'balanced';
}

function firstTouchX() {
  return touches.length ? touches[0].x : mouseX;
}

function firstTouchY() {
  return touches.length ? touches[0].y : mouseY;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetLedger();
}

function hexAlpha(value) {
  const n = constrain(round(value * 255), 0, 255);
  return n.toString(16).padStart(2, '0');
}
