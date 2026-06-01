// Inference Switchboard - draggable logic blocks that test whether a route can carry understanding.

const LABELS = [
  ['premise', 'what must be true'],
  ['source', 'where it came from'],
  ['scope', 'where it applies'],
  ['counter', 'what could break it'],
  ['test', 'what would show it'],
  ['transfer', 'where it travels'],
  ['memory', 'what remains later'],
  ['claim', 'what can be said'],
];

const PALETTE = ['#7b6952', '#315f66', '#b2533c', '#485f3e', '#90643d', '#6c5364', '#2d3946', '#8f7b2c'];

let nodes = [];
let packets = [];
let selected = -1;
let selectedOffset = { x: 0, y: 0 };
let pulse = { x: 0, y: 0, force: 0 };
let frozen = false;

function setup() {
  createCanvas(viewportWidth(), viewportHeight());
  pixelDensity(min(2, window.devicePixelRatio || 1));
  textFont('ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif');
  seed();
}

function seed() {
  const s = min(width, height);
  const compactTargets = compactNodeTargets();
  nodes = LABELS.map(([title, note], i) => {
    const angle = -HALF_PI + (TWO_PI * i) / LABELS.length;
    const radius = s * (0.26 + (i % 2) * 0.045);
    const target = compactTargets?.[i];
    return {
      title,
      note,
      x: target ? target.x : width * 0.5 + cos(angle) * radius,
      y: target ? target.y : height * 0.53 + sin(angle) * radius,
      vx: random(-0.6, 0.6),
      vy: random(-0.6, 0.6),
      tone: PALETTE[i],
      trust: random(0.28, 0.78),
      phase: random(TWO_PI),
      pin: false,
    };
  });
  keepNodesInBounds();
  packets = [];
  for (let i = 0; i < 9; i += 1) spawnPacket(i % nodes.length);
}

function draw() {
  background('#ece8dc');
  drawBoard();
  if (!frozen) updateNodes();
  drawEdges();
  updatePackets();
  drawNodes();
  drawPanel();
  pulse.force *= 0.88;
}

function drawBoard() {
  const step = max(34, min(width, height) * 0.07);
  stroke('#d4c9b6');
  strokeWeight(1);
  for (let x = (frameCount * 0.05) % step; x < width; x += step) line(x, 0, x, height);
  for (let y = (frameCount * 0.035) % step; y < height; y += step) line(0, y, width, y);

  noStroke();
  fill(43, 54, 59, 18);
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(constrain(width * 0.115, 48, 128));
  text('ROUTE', 14, height - constrain(width * 0.15, 86, 156));
  textStyle(NORMAL);
}

function updateNodes() {
  const centerX = width * 0.5;
  const centerY = height * 0.53;
  nodes.forEach((node, i) => {
    if (i === selected || node.pin) return;

    const compactTargets = compactNodeTargets();
    const target = compactTargets?.[i];
    let ax = ((target?.x ?? centerX) - node.x) * (target ? 0.0038 : 0.00065);
    let ay = ((target?.y ?? centerY) - node.y) * (target ? 0.0038 : 0.00065);
    ax += cos(frameCount * 0.013 + node.phase) * 0.024;
    ay += sin(frameCount * 0.016 + node.phase) * 0.024;

    nodes.forEach((other, j) => {
      if (i === j) return;
      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const d2 = max(90, dx * dx + dy * dy);
      const repel = width < 520 ? 86 : 185;
      ax += (dx / d2) * repel;
      ay += (dy / d2) * repel;
    });

    if (pulse.force > 0.01) {
      const dx = node.x - pulse.x;
      const dy = node.y - pulse.y;
      const d2 = max(80, dx * dx + dy * dy);
      ax += (dx / d2) * 240 * pulse.force;
      ay += (dy / d2) * 240 * pulse.force;
      node.trust = lerp(node.trust, 1, 0.015 * pulse.force);
    }

    node.vx = (node.vx + ax) * 0.9;
    node.vy = (node.vy + ay) * 0.9;
    const bounds = nodeBounds();
    node.x = constrain(node.x + node.vx, bounds.x, layoutWidth() - bounds.x);
    node.y = constrain(node.y + node.vy, bounds.top, height - bounds.bottom);
    node.trust = lerp(node.trust, 0.25 + 0.7 * noise(node.x * 0.005, node.y * 0.005, frameCount * 0.005), 0.025);
  });
}

function routeScore(a, b) {
  const d = dist(a.x, a.y, b.x, b.y);
  const range = min(width, height) * 0.43;
  const distanceScore = constrain(1 - d / range, 0, 1);
  const complement = 1 - abs(a.trust - b.trust);
  return distanceScore * 0.7 + complement * 0.3;
}

function edgeList() {
  const edges = [];
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const score = routeScore(nodes[i], nodes[j]);
      if (score > 0.28) edges.push({ from: i, to: j, score });
    }
  }
  return edges.sort((a, b) => b.score - a.score).slice(0, 15);
}

function drawEdges() {
  const edges = edgeList();
  edges.forEach((edge, index) => {
    const a = nodes[edge.from];
    const b = nodes[edge.to];
    const bend = sin(frameCount * 0.015 + index) * 18 * edge.score;
    noFill();
    stroke(41, 54, 52, 34 + edge.score * 92);
    strokeWeight(0.8 + edge.score * 3.8);
    bezier(
      a.x,
      a.y,
      (a.x + b.x) * 0.5 + bend,
      (a.y + b.y) * 0.5 - bend,
      (a.x + b.x) * 0.5 - bend,
      (a.y + b.y) * 0.5 + bend,
      b.x,
      b.y
    );
  });
}

function updatePackets() {
  if (!frozen && frameCount % 18 === 0) spawnPacket(floor(random(nodes.length)));

  for (let i = packets.length - 1; i >= 0; i -= 1) {
    const packet = packets[i];
    packet.t += packet.speed;
    if (packet.t >= 1) {
      const destination = packet.to;
      nodes[destination].trust = min(1, nodes[destination].trust + 0.12);
      packets.splice(i, 1);
      if (!frozen && random() < 0.72) spawnPacket(destination);
      continue;
    }
    const a = nodes[packet.from];
    const b = nodes[packet.to];
    const u = 1 - pow(1 - packet.t, 3);
    const wobble = sin(packet.t * PI) * packet.arc;
    const x = lerp(a.x, b.x, u) + cos(packet.angle) * wobble;
    const y = lerp(a.y, b.y, u) + sin(packet.angle) * wobble;
    noStroke();
    fill(packet.color);
    circle(x, y, 7 + sin(packet.t * PI) * 12);
    fill('#fff6dc');
    circle(x, y, 3.5);
  }
}

function spawnPacket(from) {
  const edges = edgeList().filter((edge) => edge.from === from || edge.to === from);
  if (edges.length === 0) return;
  const edge = random(edges.slice(0, min(5, edges.length)));
  const to = edge.from === from ? edge.to : edge.from;
  packets.push({
    from,
    to,
    t: 0,
    speed: random(0.009, 0.021),
    arc: random(-22, 22),
    angle: random(TWO_PI),
    color: random(['#b2533c', '#315f66', '#8f7b2c', '#485f3e']),
  });
}

function drawNodes() {
  nodes.forEach((node, i) => {
    const hover = dist(mouseX, mouseY, node.x, node.y) < 66 || selected === i;
    const w = nodeWidth();
    const h = nodeHeight();
    const x = node.x - w / 2;
    const y = node.y - h / 2;
    noStroke();
    fill(39, 48, 48, hover ? 58 : 34);
    rect(x + 7, y + 9, w, h, 7);
    fill(node.tone);
    rect(x, y, w, h, 7);
    fill(255, 246, 221, 220);
    rect(x + 8, y + 8, w - 16, 5 + node.trust * 8, 3);
    fill('#f6ecd2');
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    textSize(13);
    text(node.title, x + 12, y + 21);
    textStyle(NORMAL);
    textSize(10.5);
    fill(255, 246, 221, 188);
    text(node.note, x + 12, y + 42, w - 24, 28);
    if (node.pin) {
      fill('#f6ecd2');
      circle(x + w - 14, y + 14, 7);
    }
  });
}

function drawPanel() {
  const score = floor(meanRouteScore() * 100);
  const compact = width < 520;
  noStroke();
  fill('#263238');
  textAlign(LEFT, TOP);
  textStyle(BOLD);
  textSize(compact ? 13 : 14);
  text('Inference Switchboard', 16, 16);
  textStyle(NORMAL);
  fill('#5f6258');
  textSize(compact ? 12 : 14);
  const help = compact
    ? `route ${score}% · drag · tap · double tap pins\nF freeze · R reset`
    : `route integrity ${score}% · drag blocks · tap to perturb · double tap pins · F freeze · R reset`;
  text(help, 16, 38, width - 32, compact ? 42 : 24);
}

function meanRouteScore() {
  const edges = edgeList();
  if (!edges.length) return 0;
  return edges.reduce((sum, edge) => sum + edge.score, 0) / edges.length;
}

function pickNode(x, y) {
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i];
    const w = nodeWidth();
    const h = nodeHeight();
    if (x > node.x - w / 2 && x < node.x + w / 2 && y > node.y - h / 2 && y < node.y + h / 2) return i;
  }
  return -1;
}

function mousePressed() {
  selected = pickNode(mouseX, mouseY);
  pulse = { x: mouseX, y: mouseY, force: selected === -1 ? 1 : 0.45 };
  if (selected >= 0) {
    selectedOffset = { x: nodes[selected].x - mouseX, y: nodes[selected].y - mouseY };
    nodes[selected].pin = false;
  }
  return false;
}

function mouseDragged() {
  pulse = { x: mouseX, y: mouseY, force: 0.8 };
  if (selected >= 0) {
    const node = nodes[selected];
    const bounds = nodeBounds();
    node.x = constrain(mouseX + selectedOffset.x, bounds.x, layoutWidth() - bounds.x);
    node.y = constrain(mouseY + selectedOffset.y, bounds.top, height - bounds.bottom);
    node.vx = movedX * 0.2;
    node.vy = movedY * 0.2;
    node.trust = min(1, node.trust + 0.02);
  }
  return false;
}

function mouseReleased() {
  selected = -1;
}

function doubleClicked() {
  const hit = pickNode(mouseX, mouseY);
  if (hit >= 0) nodes[hit].pin = !nodes[hit].pin;
  return false;
}

function touchStarted() {
  return mousePressed();
}

function touchMoved() {
  return mouseDragged();
}

function touchEnded() {
  selected = -1;
  return false;
}

function keyPressed() {
  if (key === 'r' || key === 'R') seed();
  if (key === 'f' || key === 'F') frozen = !frozen;
  if (key === ' ') spawnPacket(floor(random(nodes.length)));
}

function keepNodesInBounds() {
  const bounds = nodeBounds();
  nodes.forEach((node) => {
    node.x = constrain(node.x, bounds.x, layoutWidth() - bounds.x);
    node.y = constrain(node.y, bounds.top, height - bounds.bottom);
  });
}

function nodeWidth() {
  return width < 520 ? 104 : constrain(width * 0.155, 112, 156);
}

function nodeHeight() {
  return width < 520 ? 61 : constrain(width * 0.074, 62, 76);
}

function nodeBounds() {
  return {
    x: nodeWidth() / 2 + 14,
    top: width < 520 ? 108 : nodeHeight() / 2 + 44,
    bottom: nodeHeight() / 2 + 20,
  };
}

function viewportWidth() {
  return min(windowWidth, document.documentElement.clientWidth || windowWidth);
}

function viewportHeight() {
  return min(windowHeight, document.documentElement.clientHeight || windowHeight);
}

function layoutWidth() {
  return min(width, window.innerWidth || width, document.documentElement.clientWidth || width, window.visualViewport?.width || width);
}

function compactNodeTargets() {
  if (width >= 520) return null;
  const right = min(layoutWidth() - 70, 286);
  return [
    { x: 224, y: height * 0.30 },
    { x: right, y: height * 0.36 },
    { x: right, y: height * 0.49 },
    { x: right, y: height * 0.63 },
    { x: 222, y: height * 0.66 },
    { x: 132, y: height * 0.62 },
    { x: 108, y: height * 0.48 },
    { x: 134, y: height * 0.34 },
  ];
}

function windowResized() {
  resizeCanvas(viewportWidth(), viewportHeight());
  keepNodesInBounds();
}
