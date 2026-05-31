// Argument Weather Station — a tactile pressure map for comprehension.

const LABELS = ['claim', 'source', 'context', 'exception', 'model', 'test', 'memory', 'transfer', 'risk'];
const TONES = ['#3f6058', '#bb6b45', '#425d82', '#8d7045', '#7d4b5b', '#526f48', '#29363c', '#9a8642', '#5b6d77'];

let blocks = [];
let rays = [];
let active = null;
let touchField = { x: 0, y: 0, force: 0 };
let mode = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(min(2, window.devicePixelRatio || 1));
  textFont('system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
  seedBlocks();
}

function seedBlocks() {
  const s = min(width, height);
  blocks = LABELS.map((label, i) => {
    const a = (TWO_PI * i) / LABELS.length - HALF_PI;
    const ring = s * (0.23 + (i % 3) * 0.045);
    return {
      label,
      x: width * 0.5 + cos(a) * ring,
      y: height * 0.52 + sin(a) * ring,
      vx: random(-0.4, 0.4),
      vy: random(-0.4, 0.4),
      r: constrain(s * 0.045 + label.length * 1.2, 25, 46),
      charge: random(0.25, 0.85),
      bias: random(TWO_PI),
    };
  });
  rays = [];
  for (let i = 0; i < 7; i += 1) emitRay(floor(random(blocks.length)));
}

function draw() {
  background('#f4f0e7');
  drawAtmosphere();
  updateBlocks();
  drawRelations();
  updateRays();
  drawBlocks();
  drawHud();
  touchField.force *= 0.92;
}

function drawAtmosphere() {
  const s = min(width, height);
  noFill();
  for (let i = 0; i < 19; i += 1) {
    const w = s * (0.15 + i * 0.055);
    const wobble = sin(frameCount * 0.01 + i) * 9;
    stroke(i % 2 ? '#d9cdb5' : '#c7d6c5');
    strokeWeight(i % 5 === 0 ? 1.4 : 0.65);
    ellipse(width * 0.5 + wobble, height * 0.52, w, w * (0.62 + i * 0.006));
  }

  noStroke();
  fill(44, 59, 63, 16);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(constrain(width * 0.105, 44, 116));
  text('WEATHER', 18, height - constrain(width * 0.15, 78, 145));
  textStyle(NORMAL);
}

function updateBlocks() {
  const s = min(width, height);
  const cx = width * 0.5;
  const cy = height * 0.51;
  for (let i = 0; i < blocks.length; i += 1) {
    const b = blocks[i];
    if (active === i) continue;

    let ax = (cx - b.x) * 0.00085;
    let ay = (cy - b.y) * 0.00085;
    const swirl = mode === 0 ? 1 : mode === 1 ? -1 : 0.35;
    ax += cos(frameCount * 0.018 + b.bias) * 0.035 * swirl;
    ay += sin(frameCount * 0.015 + b.bias) * 0.035;

    for (let j = 0; j < blocks.length; j += 1) {
      if (i === j) continue;
      const other = blocks[j];
      const dx = b.x - other.x;
      const dy = b.y - other.y;
      const d2 = max(80, dx * dx + dy * dy);
      const push = (660 + b.charge * 220) / d2;
      ax += dx * push;
      ay += dy * push;
    }

    if (touchField.force > 0.01) {
      const dx = b.x - touchField.x;
      const dy = b.y - touchField.y;
      const d2 = max(70, dx * dx + dy * dy);
      const sign = mode === 2 ? -1 : 1;
      ax += (dx / d2) * 170 * touchField.force * sign;
      ay += (dy / d2) * 170 * touchField.force * sign;
    }

    b.vx = (b.vx + ax) * 0.91;
    b.vy = (b.vy + ay) * 0.91;
    b.x = constrain(b.x + b.vx, b.r + 12, width - b.r - 12);
    b.y = constrain(b.y + b.vy, b.r + 12, height - b.r - 12);
    b.charge = lerp(b.charge, 0.3 + 0.45 * noise(b.x * 0.005, b.y * 0.005, frameCount * 0.006), 0.04);
  }
}

function drawRelations() {
  const s = min(width, height);
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const a = blocks[i];
      const b = blocks[j];
      const d = dist(a.x, a.y, b.x, b.y);
      if (d > s * 0.42) continue;
      const strength = 1 - d / (s * 0.42);
      stroke(48, 57, 50, 28 + strength * 80);
      strokeWeight(0.7 + strength * 2.4);
      const bend = sin((i + j) * 1.7 + frameCount * 0.018) * 18 * strength;
      noFill();
      bezier(a.x, a.y, (a.x + b.x) * 0.5 + bend, (a.y + b.y) * 0.5 - bend, (a.x + b.x) * 0.5 + bend, (a.y + b.y) * 0.5 - bend, b.x, b.y);
    }
  }
}

function updateRays() {
  if (frameCount % 22 === 0) emitRay(floor(random(blocks.length)));
  for (let i = rays.length - 1; i >= 0; i -= 1) {
    const ray = rays[i];
    ray.u += ray.speed;
    if (ray.u >= 1) {
      blocks[ray.to].charge = 1;
      if (random() < 0.55) emitRay(ray.to);
      rays.splice(i, 1);
      continue;
    }
    const a = blocks[ray.from];
    const b = blocks[ray.to];
    const u = 1 - pow(1 - ray.u, 3);
    const x = lerp(a.x, b.x, u);
    const y = lerp(a.y, b.y, u);
    noStroke();
    fill(ray.tone);
    circle(x, y, 5 + sin(ray.u * PI) * 13);
    fill('#fff8df');
    circle(x, y, 3);
  }
}

function drawBlocks() {
  blocks.forEach((b, i) => {
    const hot = active === i || dist(mouseX, mouseY, b.x, b.y) < b.r * 1.2;
    const r = b.r + b.charge * 8 + sin(frameCount * 0.04 + b.bias) * 2;
    noStroke();
    fill(48, 57, 50, hot ? 58 : 34);
    circle(b.x, b.y, r * 2.75);
    fill(TONES[i % TONES.length]);
    circle(b.x, b.y, r * 1.72);
    fill(255, 247, 221, 220);
    circle(b.x - r * 0.2, b.y - r * 0.18, r * 0.56);
    fill('#263036');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(constrain(r * 0.28, 10, 15));
    text(b.label, b.x, b.y + 1);
    textStyle(NORMAL);
  });
}

function drawHud() {
  const s = min(width, height);
  const pressure = floor(constrain(map(meanDistance(), s * 0.18, s * 0.36, 91, 28), 12, 96));
  noStroke();
  fill('#263036');
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(14);
  text('Argument Weather Station', 16, 16);
  textStyle(NORMAL);
  fill('#65685e');
  text(`coherence ${pressure}% · drag labels · tap to stir · M mode ${mode + 1} · R reset`, 16, 38, width - 32);
}

function meanDistance() {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      sum += dist(blocks[i].x, blocks[i].y, blocks[j].x, blocks[j].y);
      count += 1;
    }
  }
  return sum / count;
}

function emitRay(from) {
  const candidates = blocks.map((_, index) => index).filter((index) => index !== from);
  const to = random(candidates);
  rays.push({ from, to, u: 0, speed: random(0.008, 0.019), tone: random(['#8d7045', '#3f6058', '#425d82', '#bb6b45']) });
}

function pickBlock(x, y) {
  let best = null;
  let bestD = Infinity;
  blocks.forEach((b, i) => {
    const d = dist(x, y, b.x, b.y);
    if (d < b.r * 1.35 && d < bestD) {
      best = i;
      bestD = d;
    }
  });
  return best;
}

function mousePressed() {
  active = pickBlock(mouseX, mouseY);
  touchField = { x: mouseX, y: mouseY, force: active === null ? 1 : 0.35 };
  if (active === null) emitRay(floor(random(blocks.length)));
  return false;
}

function mouseDragged() {
  touchField = { x: mouseX, y: mouseY, force: 1 };
  if (active !== null) {
    const b = blocks[active];
    b.x = constrain(mouseX, b.r + 12, width - b.r - 12);
    b.y = constrain(mouseY, b.r + 12, height - b.r - 12);
    b.vx = movedX * 0.25;
    b.vy = movedY * 0.25;
    b.charge = 1;
  }
  return false;
}

function mouseReleased() {
  active = null;
}

function touchStarted() {
  return mousePressed();
}

function touchMoved() {
  return mouseDragged();
}

function touchEnded() {
  active = null;
  return false;
}

function keyPressed() {
  if (key === 'r' || key === 'R') seedBlocks();
  if (key === 'm' || key === 'M') mode = (mode + 1) % 3;
  if (key === ' ') emitRay(floor(random(blocks.length)));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  seedBlocks();
}
