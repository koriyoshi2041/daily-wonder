// Evidence Loom - an interactive map where claims tighten only when evidence, tests, and counterexamples stay woven.

const STRANDS = [
  ['observation', '#2f5f5c'],
  ['source', '#8b5f38'],
  ['definition', '#4d5f80'],
  ['example', '#9a5a42'],
  ['counter', '#6d5267'],
  ['test', '#47693f'],
  ['transfer', '#897536'],
  ['memory', '#40515a'],
  ['claim', '#a04435'],
  ['revision', '#5f6045'],
];

let anchors = [];
let shuttles = [];
let focus = { x: 0, y: 0, strength: 0 };
let held = -1;
let frozen = false;
let layer = 0;
let seedValue = 606;

function setup() {
  createCanvas(vw(), vh());
  pixelDensity(min(2, window.devicePixelRatio || 1));
  textFont('ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
  reseed();
}

function reseed() {
  randomSeed(seedValue);
  noiseSeed(seedValue);
  anchors = [];
  const s = min(width, height);
  const cx = width * 0.52;
  const cy = height * 0.54;
  STRANDS.forEach(([label, color], i) => {
    const angle = -HALF_PI + (TWO_PI * i) / STRANDS.length + random(-0.12, 0.12);
    const r = s * random(0.23, 0.39);
    const compact = compactTarget(i);
    anchors.push({
      label,
      color,
      x: compact?.x ?? cx + cos(angle) * r,
      y: compact?.y ?? cy + sin(angle) * r,
      vx: random(-0.4, 0.4),
      vy: random(-0.4, 0.4),
      weight: random(0.35, 0.92),
      phase: random(TWO_PI),
      pinned: false,
    });
  });
  shuttles = [];
  for (let i = 0; i < 16; i += 1) addShuttle(floor(random(anchors.length)));
  keepInside();
}

function draw() {
  background('#e9e1cf');
  drawPaper();
  if (!frozen) moveAnchors();
  drawLoom();
  moveShuttles();
  drawAnchors();
  drawFocus();
  drawHud();
  focus.strength *= 0.9;
}

function drawPaper() {
  noStroke();
  for (let y = 0; y < height; y += 5) {
    const tone = 224 + noise(y * 0.02, frameCount * 0.003) * 12;
    fill(tone, 216, 199, 24);
    rect(0, y, width, 3);
  }

  const step = max(30, min(width, height) * 0.055);
  stroke('#cfc2aa');
  strokeWeight(1);
  for (let x = -step; x < width + step; x += step) {
    line(x + (frameCount * 0.035) % step, 0, x + (frameCount * 0.035) % step, height);
  }
  for (let y = -step; y < height + step; y += step) {
    line(0, y + (frameCount * 0.02) % step, width, y + (frameCount * 0.02) % step);
  }

  fill(54, 55, 48, 16);
  textStyle(BOLD);
  textSize(constrain(width * 0.13, 58, 148));
  textAlign(LEFT, BASELINE);
  text('LOOM', 12, height - 26);
  textStyle(NORMAL);
}

function moveAnchors() {
  const cx = width * 0.52;
  const cy = height * 0.54;
  anchors.forEach((a, i) => {
    if (a.pinned || i === held) return;

    const target = compactTarget(i);
    let ax = ((target?.x ?? cx) - a.x) * (target ? 0.0042 : 0.0007);
    let ay = ((target?.y ?? cy) - a.y) * (target ? 0.0042 : 0.0007);
    ax += cos(frameCount * 0.011 + a.phase) * 0.035;
    ay += sin(frameCount * 0.014 + a.phase) * 0.035;

    anchors.forEach((b, j) => {
      if (i === j) return;
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d2 = max(160, dx * dx + dy * dy);
      ax += (dx / d2) * (width < 540 ? 85 : 155);
      ay += (dy / d2) * (width < 540 ? 85 : 155);
    });

    if (focus.strength > 0.01) {
      const dx = focus.x - a.x;
      const dy = focus.y - a.y;
      const d = max(24, sqrt(dx * dx + dy * dy));
      const polarity = layer === 2 ? -1 : 1;
      ax += (dx / d) * 0.08 * focus.strength * polarity;
      ay += (dy / d) * 0.08 * focus.strength * polarity;
      a.weight = constrain(a.weight + 0.006 * focus.strength, 0.18, 1);
    }

    a.vx = (a.vx + ax) * 0.88;
    a.vy = (a.vy + ay) * 0.88;
    a.x += a.vx;
    a.y += a.vy;
  });
  keepInside();
}

function weaveScore(a, b) {
  const d = dist(a.x, a.y, b.x, b.y);
  const range = min(width, height) * 0.48;
  const distance = constrain(1 - d / range, 0, 1);
  const balance = 1 - abs(a.weight - b.weight);
  const semanticBoost = (a.label === 'counter' && b.label === 'claim') || (a.label === 'test' && b.label === 'claim') ? 0.18 : 0;
  return constrain(distance * 0.62 + balance * 0.32 + semanticBoost, 0, 1);
}

function connections() {
  const list = [];
  for (let i = 0; i < anchors.length; i += 1) {
    for (let j = i + 1; j < anchors.length; j += 1) {
      const score = weaveScore(anchors[i], anchors[j]);
      if (score > 0.23) list.push({ a: i, b: j, score });
    }
  }
  return list.sort((u, v) => v.score - u.score).slice(0, width < 540 ? 16 : 24);
}

function drawLoom() {
  connections().forEach((edge, i) => {
    const a = anchors[edge.a];
    const b = anchors[edge.b];
    const mx = (a.x + b.x) * 0.5;
    const my = (a.y + b.y) * 0.5;
    const wobble = sin(frameCount * 0.018 + i * 0.7) * 24 * edge.score;
    const ink = layer === 1 ? 72 : 48;
    noFill();
    stroke(45, 55, 48, ink * edge.score);
    strokeWeight(0.6 + edge.score * 3.6);
    bezier(a.x, a.y, mx + wobble, my - wobble, mx - wobble, my + wobble, b.x, b.y);

    if (layer !== 0 && edge.score > 0.54) {
      stroke(a.color + '66');
      strokeWeight(1);
      line(a.x, a.y, b.x, b.y);
    }
  });
}

function moveShuttles() {
  if (!frozen && frameCount % 14 === 0) addShuttle(floor(random(anchors.length)));

  for (let i = shuttles.length - 1; i >= 0; i -= 1) {
    const s = shuttles[i];
    s.t += s.speed;
    if (s.t >= 1) {
      anchors[s.to].weight = constrain(anchors[s.to].weight + 0.09, 0.18, 1);
      shuttles.splice(i, 1);
      if (!frozen && random() < 0.7) addShuttle(s.to);
      continue;
    }

    const a = anchors[s.from];
    const b = anchors[s.to];
    const u = 1 - pow(1 - s.t, 3);
    const bow = sin(s.t * PI) * s.arc;
    const x = lerp(a.x, b.x, u) + cos(s.angle) * bow;
    const y = lerp(a.y, b.y, u) + sin(s.angle) * bow;
    noStroke();
    fill(s.color);
    ellipse(x, y, 13 + sin(s.t * PI) * 12, 7 + sin(s.t * PI) * 5);
    fill('#f8edd6');
    circle(x, y, 3.5);
  }
}

function addShuttle(from) {
  const edges = connections().filter((edge) => edge.a === from || edge.b === from);
  if (!edges.length || shuttles.length > 44) return;
  const edge = random(edges.slice(0, min(6, edges.length)));
  const to = edge.a === from ? edge.b : edge.a;
  shuttles.push({
    from,
    to,
    t: 0,
    speed: random(0.008, 0.022),
    arc: random(-26, 26),
    angle: random(TWO_PI),
    color: random(['#a04435', '#2f5f5c', '#897536', '#4d5f80']),
  });
}

function drawAnchors() {
  anchors.forEach((a, i) => {
    const r = anchorRadius();
    const active = i === held || dist(mouseX, mouseY, a.x, a.y) < r + 14;
    noStroke();
    fill(51, 48, 42, active ? 56 : 30);
    ellipse(a.x + 5, a.y + 7, r * 2.2, r * 1.5);
    fill(a.color);
    ellipse(a.x, a.y, r * 2.15, r * 1.48);
    fill('#f8edd6');
    ellipse(a.x - r * 0.2, a.y - r * 0.08, r * (0.72 + a.weight * 0.6), r * 0.34);
    fill('#302e29');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(width < 540 ? 10.5 : 12);
    text(a.label, a.x, a.y + r + 13);
    if (a.pinned) {
      fill('#302e29');
      circle(a.x + r * 0.62, a.y - r * 0.42, 6);
    }
  });
}

function drawFocus() {
  if (focus.strength < 0.04) return;
  noFill();
  stroke('#a04435');
  strokeWeight(1.3);
  circle(focus.x, focus.y, 26 + focus.strength * 80);
  stroke('#2f5f5c88');
  circle(focus.x, focus.y, 11 + focus.strength * 34);
}

function drawHud() {
  const score = floor(comprehension() * 100);
  const compact = width < 540;
  noStroke();
  fill('#302e29');
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(compact ? 13 : 15);
  text('Evidence Loom', 16, 16);
  textStyle(NORMAL);
  fill('#6d6659');
  textSize(compact ? 11.5 : 13);
  const mode = ['weave', 'x-ray', 'repel'][layer];
  const help = compact
    ? `comprehension ${score}% · ${mode}\ndrag/tap · 1-3 layer · F freeze · R reset`
    : `comprehension ${score}% · ${mode} layer · drag evidence · tap to probe · double tap pins · 1-3 layers · F freeze · R reset`;
  text(help, 16, 39, width - 32, compact ? 48 : 26);
}

function comprehension() {
  const list = connections();
  if (!list.length) return 0;
  const average = list.reduce((sum, edge) => sum + edge.score, 0) / list.length;
  const claim = anchors.find((a) => a.label === 'claim');
  const test = anchors.find((a) => a.label === 'test');
  const counter = anchors.find((a) => a.label === 'counter');
  const pressure = (weaveScore(claim, test) + weaveScore(claim, counter)) * 0.5;
  return constrain(average * 0.72 + pressure * 0.28, 0, 1);
}

function pickAnchor(x, y) {
  for (let i = anchors.length - 1; i >= 0; i -= 1) {
    if (dist(x, y, anchors[i].x, anchors[i].y) < anchorRadius() + 16) return i;
  }
  return -1;
}

function mousePressed() {
  held = pickAnchor(mouseX, mouseY);
  focus = { x: mouseX, y: mouseY, strength: held >= 0 ? 0.65 : 1 };
  if (held >= 0) anchors[held].pinned = false;
  return false;
}

function mouseDragged() {
  focus = { x: mouseX, y: mouseY, strength: 0.9 };
  if (held >= 0) {
    const a = anchors[held];
    a.x = constrain(mouseX, marginX(), layoutWidth() - marginX());
    a.y = constrain(mouseY, topMargin(), height - marginX());
    a.vx = movedX * 0.18;
    a.vy = movedY * 0.18;
    a.weight = constrain(a.weight + 0.012, 0.18, 1);
  }
  return false;
}

function mouseReleased() {
  held = -1;
}

function doubleClicked() {
  const hit = pickAnchor(mouseX, mouseY);
  if (hit >= 0) anchors[hit].pinned = !anchors[hit].pinned;
  return false;
}

function touchStarted() {
  return mousePressed();
}

function touchMoved() {
  return mouseDragged();
}

function touchEnded() {
  held = -1;
  return false;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    seedValue += 17;
    reseed();
  }
  if (key === 'f' || key === 'F') frozen = !frozen;
  if (key === ' ') addShuttle(floor(random(anchors.length)));
  if (key === '1') layer = 0;
  if (key === '2') layer = 1;
  if (key === '3') layer = 2;
}

function keepInside() {
  anchors.forEach((a) => {
    a.x = constrain(a.x, marginX(), layoutWidth() - marginX());
    a.y = constrain(a.y, topMargin(), height - marginX());
  });
}

function compactTarget(i) {
  if (width >= 540) return null;
  const cx = layoutWidth() * 0.5;
  const cy = height * 0.55;
  const r = min(layoutWidth(), height) * 0.31;
  const angle = -HALF_PI + (TWO_PI * i) / STRANDS.length;
  return { x: cx + cos(angle) * r, y: cy + sin(angle) * r };
}

function anchorRadius() {
  return width < 540 ? 18 : constrain(width * 0.026, 21, 33);
}

function marginX() {
  return anchorRadius() + 18;
}

function topMargin() {
  return width < 540 ? 96 : anchorRadius() + 44;
}

function vw() {
  return min(windowWidth, document.documentElement.clientWidth || windowWidth);
}

function vh() {
  return min(windowHeight, document.documentElement.clientHeight || windowHeight);
}

function layoutWidth() {
  return min(width, window.innerWidth || width, document.documentElement.clientWidth || width, window.visualViewport?.width || width);
}

function windowResized() {
  resizeCanvas(vw(), vh());
  keepInside();
}
