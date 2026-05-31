// Proof Loom — a draggable proof graph for comprehension as tension release.

const BLOCKS = [
  { id: 'premise', label: 'premise', tone: '#253238', mass: 1.7, x: 0.18, y: 0.28 },
  { id: 'context', label: 'context', tone: '#6d826f', mass: 1.25, x: 0.34, y: 0.22 },
  { id: 'analogy', label: 'analogy', tone: '#ba6f40', mass: 1.1, x: 0.58, y: 0.2 },
  { id: 'counter', label: 'counter', tone: '#8a4c58', mass: 1.35, x: 0.79, y: 0.32 },
  { id: 'inference', label: 'inference', tone: '#415f8c', mass: 1.55, x: 0.28, y: 0.56 },
  { id: 'compression', label: 'compression', tone: '#9b8747', mass: 1.35, x: 0.52, y: 0.58 },
  { id: 'transfer', label: 'transfer', tone: '#4f7a7a', mass: 1.15, x: 0.72, y: 0.62 },
  { id: 'claim', label: 'claim', tone: '#2e3f53', mass: 1.8, x: 0.49, y: 0.82 },
];

const LINKS = [
  ['premise', 'context', 0.18], ['context', 'analogy', 0.14], ['analogy', 'counter', 0.2],
  ['premise', 'inference', 0.24], ['context', 'inference', 0.2], ['counter', 'compression', 0.28],
  ['inference', 'compression', 0.16], ['compression', 'transfer', 0.18], ['transfer', 'claim', 0.22],
  ['inference', 'claim', 0.26], ['counter', 'claim', 0.34],
];

let nodes = [];
let links = [];
let pulses = [];
let dragged = null;
let nearest = null;
let mode = 0;
let t = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(min(2, window.devicePixelRatio || 1));
  textFont('Helvetica, Arial, sans-serif');
  initGraph();
}

function initGraph() {
  const margin = min(width, height) * 0.08;
  nodes = BLOCKS.map((b) => ({
    ...b,
    x: lerp(margin, width - margin, b.x),
    y: lerp(margin, height - margin, b.y),
    vx: random(-0.2, 0.2),
    vy: random(-0.2, 0.2),
    r: constrain(min(width, height) * 0.035 * b.mass, 28, 58),
    heat: random(0.2, 0.8),
  }));
  links = LINKS.map(([a, b, strain]) => ({
    a: nodes.find((n) => n.id === a),
    b: nodes.find((n) => n.id === b),
    strain,
    flow: random(1),
  }));
  pulses = [];
  emitPulse(nodes[0], nodes[nodes.length - 1]);
}

function draw() {
  t += 0.012;
  background('#f3efe4');
  drawPaper();
  updateNearest();
  physics();
  drawLinks();
  updatePulses();
  drawNodes();
  drawHud();
}

function drawPaper() {
  noFill();
  stroke('#ded6c4');
  strokeWeight(1);
  const gap = 34;
  for (let x = (frameCount * 0.08) % gap; x < width; x += gap) line(x, 0, x - 80, height);
  for (let y = 18; y < height; y += gap) line(0, y, width, y + 30);

  noStroke();
  fill(37, 50, 56, 18);
  textSize(constrain(width * 0.105, 44, 118));
  textStyle(BOLD);
  textAlign(LEFT, TOP);
  text('PROOF', 18, height - constrain(width * 0.15, 76, 150));
  textStyle(NORMAL);
}

function physics() {
  const cx = width * 0.5;
  const cy = height * 0.52;

  for (const n of nodes) {
    if (n === dragged) continue;
    let ax = (cx - n.x) * 0.0007;
    let ay = (cy - n.y) * 0.0007;

    for (const other of nodes) {
      if (other === n) continue;
      const dx = n.x - other.x;
      const dy = n.y - other.y;
      const d2 = max(80, dx * dx + dy * dy);
      const push = 680 / d2;
      ax += dx * push;
      ay += dy * push;
    }

    for (const l of links) {
      if (l.a !== n && l.b !== n) continue;
      const other = l.a === n ? l.b : l.a;
      const dx = other.x - n.x;
      const dy = other.y - n.y;
      const d = max(1, sqrt(dx * dx + dy * dy));
      const rest = min(width, height) * (0.18 + l.strain);
      const pull = (d - rest) * 0.0009;
      ax += dx * pull;
      ay += dy * pull;
    }

    n.vx = (n.vx + ax) * 0.9;
    n.vy = (n.vy + ay) * 0.9;
    n.x += n.vx;
    n.y += n.vy;
    n.x = constrain(n.x, n.r + 16, width - n.r - 16);
    n.y = constrain(n.y, n.r + 16, height - n.r - 16);
    n.heat = lerp(n.heat, 0.25 + 0.45 * noise(n.x * 0.004, n.y * 0.004, t), 0.05);
  }
}

function drawLinks() {
  for (const l of links) {
    const dx = l.b.x - l.a.x;
    const dy = l.b.y - l.a.y;
    const d = sqrt(dx * dx + dy * dy);
    const tension = constrain(abs(d - min(width, height) * (0.18 + l.strain)) / 180, 0, 1);
    const wobble = sin(t * 3 + l.flow * TAU) * 16 * (0.3 + tension);
    const mx = (l.a.x + l.b.x) * 0.5 - dy / max(d, 1) * wobble;
    const my = (l.a.y + l.b.y) * 0.5 + dx / max(d, 1) * wobble;

    noFill();
    strokeWeight(1 + tension * 4);
    stroke(37, 50, 56, 58 + tension * 82);
    bezier(l.a.x, l.a.y, mx, my, mx, my, l.b.x, l.b.y);
  }
}

function updatePulses() {
  for (let i = pulses.length - 1; i >= 0; i--) {
    const p = pulses[i];
    p.u += p.speed;
    if (p.u >= 1) {
      p.from.heat = min(1, p.from.heat + 0.2);
      p.to.heat = min(1, p.to.heat + 0.45);
      if (random() < 0.72) emitPulse(p.to);
      pulses.splice(i, 1);
      continue;
    }

    const x = lerp(p.from.x, p.to.x, ease(p.u));
    const y = lerp(p.from.y, p.to.y, ease(p.u));
    noStroke();
    fill(p.color);
    circle(x, y, 7 + sin(p.u * PI) * 12);
    fill(255, 248, 226, 150);
    circle(x, y, 2.5);
  }
}

function drawNodes() {
  for (const n of nodes) {
    const active = n === dragged || n === nearest;
    const breathing = sin(t * 4 + n.mass) * 3;
    const r = n.r + breathing + n.heat * 8;

    noStroke();
    fill(red(color(n.tone)), green(color(n.tone)), blue(color(n.tone)), active ? 70 : 38);
    circle(n.x, n.y, r * 2.45);
    fill(n.tone);
    circle(n.x, n.y, r * 1.66);
    fill('#fff7df');
    circle(n.x - r * 0.18, n.y - r * 0.2, r * 0.62);

    fill('#1f292d');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(constrain(r * 0.28, 10, 15));
    text(n.label, n.x, n.y + 1);
    textStyle(NORMAL);
  }
}

function drawHud() {
  const solved = floor(map(totalTension(), 0.95, 0.18, 12, 98, true));
  fill('#253238');
  textAlign(LEFT, TOP);
  textSize(13);
  textStyle(BOLD);
  text('Proof Loom', 18, 18);
  textStyle(NORMAL);
  fill('#5e625a');
  text(`clarity ${solved}% · drag blocks · tap blank space for a pulse · R reset · M mode ${mode + 1}`, 18, 38);
}

function totalTension() {
  let sum = 0;
  for (const l of links) {
    const d = dist(l.a.x, l.a.y, l.b.x, l.b.y);
    sum += abs(d - min(width, height) * (0.18 + l.strain)) / min(width, height);
  }
  return sum / links.length;
}

function updateNearest() {
  nearest = null;
  let best = 9999;
  for (const n of nodes) {
    const d = dist(pointerX(), pointerY(), n.x, n.y);
    if (d < n.r * 1.35 && d < best) {
      nearest = n;
      best = d;
    }
  }
}

function emitPulse(from, forcedTo) {
  const choices = links.filter((l) => l.a === from || l.b === from);
  if (!choices.length) return;
  const link = forcedTo ? links.find((l) => (l.a === from && l.b === forcedTo) || (l.b === from && l.a === forcedTo)) : random(choices);
  if (!link) return;
  const to = link.a === from ? link.b : link.a;
  pulses.push({
    from,
    to,
    u: 0,
    speed: random(0.012, 0.026),
    color: mode === 0 ? '#c4492d' : mode === 1 ? '#386b87' : '#8a6f2b',
  });
}

function mousePressed() {
  updateNearest();
  if (nearest) {
    dragged = nearest;
  } else {
    const start = nodes.reduce((best, n) => dist(mouseX, mouseY, n.x, n.y) < dist(mouseX, mouseY, best.x, best.y) ? n : best, nodes[0]);
    emitPulse(start);
  }
  return false;
}

function mouseDragged() {
  if (dragged) {
    dragged.x = mouseX;
    dragged.y = mouseY;
    dragged.vx = movedX * 0.22;
    dragged.vy = movedY * 0.22;
    dragged.heat = 1;
  }
  return false;
}

function mouseReleased() {
  dragged = null;
}

function touchStarted() {
  mousePressed();
  return false;
}

function touchMoved() {
  mouseDragged();
  return false;
}

function keyPressed() {
  if (key === 'r' || key === 'R') initGraph();
  if (key === 'm' || key === 'M') mode = (mode + 1) % 3;
  if (key === ' ') emitPulse(random(nodes));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGraph();
}

function pointerX() {
  return touches.length ? touches[0].x : mouseX;
}

function pointerY() {
  return touches.length ? touches[0].y : mouseY;
}

function ease(x) {
  return 1 - pow(1 - x, 3);
}
