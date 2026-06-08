// Context Quarantine - an interactive receipt for claims that inherit earlier mistakes.

const LANES = [
  { key: 'assumption', label: 'assumption', x: 0.16, color: '#7e4b39' },
  { key: 'working', label: 'working memory', x: 0.36, color: '#5f6452' },
  { key: 'evidence', label: 'evidence', x: 0.56, color: '#2f6260' },
  { key: 'acceptance', label: 'acceptance', x: 0.78, color: '#405477' },
];

const CLAIM_SEEDS = [
  'version',
  'path',
  'metric',
  'scope',
  'source',
  'owner',
  'test',
  'memory',
  'rollback',
  'deploy',
  'review',
  'claim',
];

let nodes = [];
let links = [];
let pulses = [];
let gates = [];
let receipts = [];
let heldGate = -1;
let mode = 0;
let frozen = false;
let seedValue = 608;
let fieldPulse = { x: 0, y: 0, strength: 0 };

function setup() {
  createCanvas(vw(), vh());
  pixelDensity(min(2, window.devicePixelRatio || 1));
  textFont('ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
  resetSystem();
}

function resetSystem() {
  randomSeed(seedValue);
  noiseSeed(seedValue);
  nodes = [];
  links = [];
  pulses = [];
  receipts = [];
  gates = [
    { t: 0.27, y: height * 0.42, radius: 58, label: 'first error' },
    { t: 0.52, y: height * 0.58, radius: 68, label: 'inherited context' },
    { t: 0.73, y: height * 0.36, radius: 56, label: 'final claim' },
  ];

  const compact = width < 560;
  const perLane = compact ? 3 : 4;
  LANES.forEach((lane, laneIndex) => {
    for (let i = 0; i < perLane; i += 1) {
      const n = makeNode(laneIndex, i, perLane);
      nodes.push(n);
    }
  });

  for (let laneIndex = 0; laneIndex < LANES.length - 1; laneIndex += 1) {
    const from = nodes.filter((n) => n.lane === laneIndex);
    const to = nodes.filter((n) => n.lane === laneIndex + 1);
    from.forEach((a, i) => {
      const primary = to[(i + floor(random(to.length))) % to.length];
      links.push(makeLink(a, primary, random(0.42, 0.82)));
      if (!compact || random() > 0.34) {
        links.push(makeLink(a, random(to), random(0.2, 0.52)));
      }
    });
  }

  contaminate(nodes[floor(random(0, min(perLane, nodes.length)))], 0.82);
  for (let i = 0; i < 18; i += 1) addPulse(random(nodes.filter((n) => n.lane === 0)));
}

function makeNode(laneIndex, rowIndex, perLane) {
  const lane = LANES[laneIndex];
  const jitterX = random(-0.018, 0.018) * layoutWidth();
  const bandTop = topMargin() + 42;
  const bandHeight = height - bandTop - bottomMargin();
  const y = bandTop + ((rowIndex + 0.5) / perLane) * bandHeight + random(-20, 20);
  return {
    id: nodes.length,
    lane: laneIndex,
    label: CLAIM_SEEDS[(laneIndex * perLane + rowIndex) % CLAIM_SEEDS.length],
    x: lane.x * layoutWidth() + gutterLeft() + jitterX,
    y,
    tx: lane.x * layoutWidth() + gutterLeft() + jitterX,
    ty: y,
    vx: random(-0.25, 0.25),
    vy: random(-0.25, 0.25),
    trust: random(0.42, 0.92),
    contamination: 0,
    quarantined: false,
    phase: random(TWO_PI),
  };
}

function makeLink(a, b, confidence) {
  return {
    from: a.id,
    to: b.id,
    confidence,
    contaminated: false,
    phase: random(TWO_PI),
  };
}

function draw() {
  background('#f2ead8');
  drawPaper();
  if (!frozen) {
    updateNodes();
    updateContamination();
    maybeAddPulse();
  }
  drawLanes();
  drawLinks();
  updatePulses();
  drawGates();
  drawNodes();
  drawReceipts();
  drawFieldPulse();
  drawHud();
  fieldPulse.strength *= 0.9;
}

function drawPaper() {
  noStroke();
  for (let y = 0; y < height; y += 6) {
    const tone = 234 + noise(y * 0.024, frameCount * 0.002) * 10;
    fill(tone, 226, 209, 34);
    rect(0, y, width, 3);
  }

  stroke('#d6cab2');
  strokeWeight(1);
  const step = max(34, min(width, height) * 0.06);
  for (let x = -step; x < width + step; x += step) {
    line(x + ((frameCount * 0.02) % step), topMargin() * 0.5, x + ((frameCount * 0.02) % step), height);
  }
}

function updateNodes() {
  nodes.forEach((n) => {
    const lane = LANES[n.lane];
    const drift = sin(frameCount * 0.011 + n.phase) * 9;
    let ax = (n.tx - n.x) * 0.004;
    let ay = (n.ty + drift - n.y) * 0.004;

    gates.forEach((g) => {
      const gx = gateX(g);
      const d = dist(n.x, n.y, gx, g.y);
      if (d < g.radius * 1.8) {
        const push = (1 - d / (g.radius * 1.8)) * (mode === 2 ? -0.08 : 0.08);
        ax += ((n.x - gx) / max(d, 1)) * push;
        ay += ((n.y - g.y) / max(d, 1)) * push;
      }
    });

    if (fieldPulse.strength > 0.02) {
      const d = dist(n.x, n.y, fieldPulse.x, fieldPulse.y);
      if (d < 180) {
        const pull = (1 - d / 180) * 0.12 * fieldPulse.strength;
        ax += ((fieldPulse.x - n.x) / max(d, 1)) * pull;
        ay += ((fieldPulse.y - n.y) / max(d, 1)) * pull;
      }
    }

    n.vx = (n.vx + ax) * 0.9;
    n.vy = (n.vy + ay) * 0.9;
    n.x += n.vx;
    n.y += n.vy;
    n.trust = constrain(n.trust + (n.quarantined ? 0.002 : -0.0008), 0.08, 1);
  });
}

function updateContamination() {
  links.forEach((link) => {
    const a = nodes[link.from];
    const b = nodes[link.to];
    const blocked = crossesQuarantine(a, b);
    const inherited = max(0, a.contamination - (blocked ? 0.48 : 0.08));
    if (inherited > b.contamination && !b.quarantined) {
      b.contamination = lerp(b.contamination, inherited * link.confidence, 0.035);
      link.contaminated = b.contamination > 0.18 || a.contamination > 0.32;
    }
    if (b.quarantined) b.contamination *= 0.935;
    else b.contamination *= 0.998;
  });

  const acceptedRisk = nodes
    .filter((n) => n.lane === LANES.length - 1)
    .reduce((sum, n) => sum + n.contamination, 0);
  if (acceptedRisk > 1.25 && frameCount % 92 === 0) {
    const target = random(nodes.filter((n) => n.lane === LANES.length - 1));
    contaminate(target, 0.45);
  }
}

function maybeAddPulse() {
  if (frameCount % 28 === 0 && pulses.length < 48) {
    const starts = nodes.filter((n) => n.lane === 0 && !n.quarantined);
    addPulse(random(starts));
  }
}

function addPulse(start) {
  const candidates = links.filter((l) => l.from === start.id);
  if (!candidates.length) return;
  const link = random(candidates);
  pulses.push({
    link,
    t: 0,
    speed: random(0.007, 0.017),
    color: start.contamination > 0.3 ? '#b54436' : random(['#2f6260', '#405477', '#8c713b']),
  });
}

function updatePulses() {
  for (let i = pulses.length - 1; i >= 0; i -= 1) {
    const p = pulses[i];
    const a = nodes[p.link.from];
    const b = nodes[p.link.to];
    p.t += frozen ? 0 : p.speed;
    const u = easeOutCubic(constrain(p.t, 0, 1));
    const bow = sin(u * PI) * (22 + 20 * p.link.confidence);
    const x = lerp(a.x, b.x, u);
    const y = lerp(a.y, b.y, u) + bow * (a.y < b.y ? 1 : -1) * 0.35;
    noStroke();
    fill(p.color);
    ellipse(x, y, 13 + sin(u * PI) * 10, 7 + sin(u * PI) * 4);
    fill('#fff6df');
    circle(x, y, 3);

    if (p.t >= 1) {
      if (a.contamination > 0.22 && !crossesQuarantine(a, b) && !b.quarantined) {
        b.contamination = max(b.contamination, a.contamination * p.link.confidence);
      }
      pulses.splice(i, 1);
      const next = links.filter((l) => l.from === b.id);
      if (next.length && random() < 0.8 && !b.quarantined) {
        pulses.push({ link: random(next), t: 0, speed: random(0.007, 0.017), color: p.color });
      }
    }
  }
}

function drawLanes() {
  const top = topMargin();
  const h = height - top - bottomMargin();
  LANES.forEach((lane) => {
    const x = lane.x * layoutWidth() + gutterLeft();
    stroke(lane.color + '55');
    strokeWeight(1.2);
    line(x, top, x, top + h);
    noStroke();
    fill(lane.color);
    textAlign(CENTER, TOP);
    textStyle(BOLD);
    textSize(width < 560 ? 10 : 12);
    text(lane.label, x, top - 28);
  });

  noStroke();
  fill(54, 48, 40, 13);
  textStyle(BOLD);
  textSize(constrain(width * 0.09, 38, 112));
  textAlign(RIGHT, BASELINE);
  text('RECEIPT', width - 12, height - 26);
}

function drawLinks() {
  links.forEach((link, i) => {
    const a = nodes[link.from];
    const b = nodes[link.to];
    const blocked = crossesQuarantine(a, b);
    const risk = max(a.contamination, b.contamination);
    const base = mode === 1 ? 76 : 44;
    const col = blocked ? '#2f6260' : risk > 0.22 ? '#b54436' : '#463f35';
    noFill();
    stroke(col + alphaHex(base * (0.35 + link.confidence * 0.65)));
    strokeWeight(blocked ? 1.2 : 0.6 + link.confidence * 2.3 + risk * 2.4);
    const mx = (a.x + b.x) * 0.5;
    const my = (a.y + b.y) * 0.5;
    const wobble = sin(frameCount * 0.016 + link.phase + i) * 18;
    bezier(a.x, a.y, mx, my + wobble, mx, my - wobble, b.x, b.y);
  });
}

function drawGates() {
  gates.forEach((g, i) => {
    const x = gateX(g);
    const active = i === heldGate || dist(mouseX, mouseY, x, g.y) < g.radius;
    noFill();
    stroke(active ? '#263f3d' : '#476663');
    strokeWeight(active ? 3 : 2);
    drawingContext.setLineDash([9, 7]);
    circle(x, g.y, g.radius * 2);
    drawingContext.setLineDash([]);
    noStroke();
    fill(active ? '#263f3d' : '#52645d');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(width < 560 ? 10 : 11);
    text(g.label, x, g.y);
  });
}

function drawNodes() {
  nodes.forEach((n) => {
    const lane = LANES[n.lane];
    const r = nodeRadius(n);
    const risk = n.contamination;
    noStroke();
    fill(46, 40, 32, 34);
    ellipse(n.x + 4, n.y + 6, r * 2.2, r * 1.35);
    fill(risk > 0.18 ? lerpColorValue('#f5d6bd', '#b54436', risk) : lane.color);
    ellipse(n.x, n.y, r * 2.1, r * 1.45);
    fill(n.quarantined ? '#f2ead8' : '#fff6df');
    ellipse(n.x - r * 0.23, n.y - r * 0.12, r * (0.75 + n.trust * 0.42), r * 0.28);

    if (risk > 0.08) {
      noFill();
      stroke('#b54436' + alphaHex(80 + risk * 120));
      strokeWeight(1.4 + risk * 2);
      circle(n.x, n.y, r * (2.1 + risk * 2));
    }

    if (n.quarantined) {
      stroke('#263f3d');
      strokeWeight(2);
      line(n.x - r * 0.72, n.y - r * 0.72, n.x + r * 0.72, n.y + r * 0.72);
      line(n.x + r * 0.72, n.y - r * 0.72, n.x - r * 0.72, n.y + r * 0.72);
    }

    noStroke();
    fill('#302c27');
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    textSize(width < 560 ? 9.5 : 11);
    text(n.label, n.x, n.y + r + 12);
  });
}

function drawReceipts() {
  const compact = width < 560;
  const recent = receipts.slice(compact ? -3 : -5);
  const x = compact ? 14 : width - 228;
  const y = compact ? height - 92 : topMargin() + 8;
  noStroke();
  fill(242, 234, 216, compact ? 190 : 220);
  rect(x - 8, y - 8, compact ? width - 28 : 216, compact ? 80 : 134, 4);
  fill('#302c27');
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(12);
  text('quarantine receipt', x, y);
  textStyle(NORMAL);
  fill('#6e6355');
  textSize(10.5);
  if (!recent.length) {
    text('click a claim to isolate it', x, y + 20);
  } else {
    recent.forEach((r, i) => {
      text(`${r.name}: risk ${floor(r.risk * 100)} -> held`, x, y + 20 + i * 18);
    });
  }
}

function drawFieldPulse() {
  if (fieldPulse.strength < 0.04) return;
  noFill();
  stroke('#b54436');
  strokeWeight(1.5);
  circle(fieldPulse.x, fieldPulse.y, 34 + fieldPulse.strength * 130);
  stroke('#2f626088');
  circle(fieldPulse.x, fieldPulse.y, 12 + fieldPulse.strength * 52);
}

function drawHud() {
  const compact = width < 560;
  const risk = acceptanceRisk();
  const blocked = nodes.filter((n) => n.quarantined).length;
  noStroke();
  fill('#302c27');
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(compact ? 13 : 15);
  text('Context Quarantine', 16, 15);
  fill('#6e6355');
  textStyle(NORMAL);
  textSize(compact ? 11.5 : 13);
  const modeName = ['trace', 'x-ray', 'reverse'][mode];
  const copy = compact
    ? `accepted risk ${floor(risk * 100)}% · held ${blocked} · ${modeName}\ndrag rings · tap claims · M mode · R reset`
    : `accepted risk ${floor(risk * 100)}% · held claims ${blocked} · ${modeName} mode · drag quarantine rings · click claims · Space inject · M mode · F freeze · R reset`;
  text(copy, 16, 38, width - 32, compact ? 54 : 32);
}

function contaminate(node, amount) {
  node.contamination = constrain(node.contamination + amount, 0, 1);
  node.trust = max(0.18, node.trust - amount * 0.3);
}

function acceptanceRisk() {
  const accepted = nodes.filter((n) => n.lane === LANES.length - 1);
  if (!accepted.length) return 0;
  return accepted.reduce((sum, n) => sum + n.contamination, 0) / accepted.length;
}

function crossesQuarantine(a, b) {
  return gates.some((g) => distanceToSegment(gateX(g), g.y, a.x, a.y, b.x, b.y) < g.radius);
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  const t = constrain(((px - x1) * dx + (py - y1) * dy) / len2, 0, 1);
  return dist(px, py, x1 + dx * t, y1 + dy * t);
}

function pickNode(x, y) {
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    if (dist(x, y, nodes[i].x, nodes[i].y) < nodeRadius(nodes[i]) + 13) return i;
  }
  return -1;
}

function pickGate(x, y) {
  for (let i = gates.length - 1; i >= 0; i -= 1) {
    if (dist(x, y, gateX(gates[i]), gates[i].y) < gates[i].radius + 10) return i;
  }
  return -1;
}

function mousePressed() {
  heldGate = pickGate(mouseX, mouseY);
  const hit = pickNode(mouseX, mouseY);
  fieldPulse = { x: mouseX, y: mouseY, strength: 1 };
  if (hit >= 0 && heldGate < 0) {
    const n = nodes[hit];
    n.quarantined = !n.quarantined;
    if (n.quarantined) {
      receipts.push({ name: n.label, risk: n.contamination });
      n.contamination *= 0.35;
    } else {
      contaminate(n, 0.18);
    }
  }
  return false;
}

function mouseDragged() {
  fieldPulse = { x: mouseX, y: mouseY, strength: 0.7 };
  if (heldGate >= 0) {
    const g = gates[heldGate];
    g.t = constrain((mouseX - gutterLeft()) / layoutWidth(), 0.12, 0.88);
    g.y = constrain(mouseY, topMargin() + 26, height - bottomMargin() - 26);
  }
  return false;
}

function mouseReleased() {
  heldGate = -1;
}

function touchStarted() {
  return mousePressed();
}

function touchMoved() {
  return mouseDragged();
}

function touchEnded() {
  heldGate = -1;
  return false;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    seedValue += 31;
    resetSystem();
  }
  if (key === 'f' || key === 'F') frozen = !frozen;
  if (key === 'm' || key === 'M') mode = (mode + 1) % 3;
  if (key === ' ') {
    const starts = nodes.filter((n) => n.lane === 0);
    addPulse(random(starts));
    fieldPulse = { x: width * 0.18, y: height * 0.5, strength: 1 };
  }
}

function nodeRadius(n) {
  return (width < 560 ? 17 : constrain(width * 0.022, 20, 29)) * (0.9 + n.trust * 0.18);
}

function gateX(g) {
  return gutterLeft() + layoutWidth() * g.t;
}

function gutterLeft() {
  return width < 560 ? 0 : 18;
}

function topMargin() {
  return width < 560 ? 96 : 88;
}

function bottomMargin() {
  return width < 560 ? 106 : 44;
}

function layoutWidth() {
  return min(width - gutterLeft() * 2, window.innerWidth || width, document.documentElement.clientWidth || width);
}

function vw() {
  return min(windowWidth, document.documentElement.clientWidth || windowWidth);
}

function vh() {
  return min(windowHeight, document.documentElement.clientHeight || windowHeight);
}

function windowResized() {
  const previousLayoutWidth = max(1, layoutWidth());
  resizeCanvas(vw(), vh());
  const sx = layoutWidth() / previousLayoutWidth;
  nodes.forEach((n) => {
    n.x = constrain(n.x, 24, width - 24);
    n.y = constrain(n.y, topMargin() + 18, height - bottomMargin() - 18);
    n.tx = constrain(n.tx * sx, 24, width - 24);
    n.ty = constrain(n.ty, topMargin() + 18, height - bottomMargin() - 18);
  });
  gates.forEach((g) => {
    g.y = constrain(g.y, topMargin() + 26, height - bottomMargin() - 26);
  });
}

function easeOutCubic(t) {
  return 1 - pow(1 - t, 3);
}

function alphaHex(value) {
  return floor(constrain(value, 0, 255)).toString(16).padStart(2, '0');
}

function lerpColorValue(a, b, t) {
  return lerpColor(color(a), color(b), constrain(t, 0, 1));
}
