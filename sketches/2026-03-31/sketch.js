// "Mesh of Words" — Self-replicating Forth agents as living organisms
// Inspired by davidcanhelp/unit and the spinthariscope (seeing single atoms act)

let units = [];
let sharedWords = [];
let gossipLines = [];
const FORTH_WORDS = [
  'DUP', 'SWAP', 'DROP', 'OVER', 'ROT', 'NIP', 'TUCK',
  '+', '-', '*', '/', 'MOD', 'ABS', 'NEGATE',
  'IF', 'THEN', 'ELSE', 'DO', 'LOOP', 'BEGIN', 'UNTIL',
  'EMIT', 'CR', '.', 'TYPE', 'KEY',
  'EVOLVE', 'MUTATE', 'SPAWN', 'SHARE', 'REPLICATE',
  'GOAL', 'CLAIM', 'HEAL', 'WATCH', 'TRUST',
  'MESH', 'PEERS', 'GOSSIP', 'SWARM', 'FITNESS'
];

class Unit {
  constructor(x, y, gen) {
    this.x = x;
    this.y = y;
    this.gen = gen || 0;
    this.vx = random(-0.3, 0.3);
    this.vy = random(-0.3, 0.3);
    this.words = [];
    this.fitness = 0;
    this.size = random(8, 14);
    this.pulse = random(TWO_PI);
    this.color = this.genColor();
    this.age = 0;
    this.lastMutate = 0;
    this.alive = true;
    // Bootstrap: each unit starts with a few random words
    let wordCount = floor(random(2, 5));
    for (let i = 0; i < wordCount; i++) {
      this.words.push(random(FORTH_WORDS));
    }
  }

  genColor() {
    // Color shifts with generation — deeper generations get warmer
    let hue = (this.gen * 37 + 180) % 360;
    return color(hue, 70, 90, 200);
  }

  update() {
    this.age++;
    this.pulse += 0.03;
    this.x += this.vx;
    this.y += this.vy;

    // Soft boundary
    if (this.x < 30) this.vx += 0.02;
    if (this.x > width - 30) this.vx -= 0.02;
    if (this.y < 30) this.vy += 0.02;
    if (this.y > height - 30) this.vy -= 0.02;

    // Damping
    this.vx *= 0.998;
    this.vy *= 0.998;

    // Fitness grows with words and age
    this.fitness = this.words.length * 10 + floor(this.age / 60);

    // Mutate occasionally
    if (this.age - this.lastMutate > 180 && random() < 0.01) {
      this.mutate();
    }

    // Try to spawn if fit enough
    if (this.fitness > 50 && units.length < 40 && random() < 0.002) {
      this.spawn();
    }
  }

  mutate() {
    this.lastMutate = this.age;
    if (random() < 0.5 && this.words.length > 1) {
      // Replace a word
      let idx = floor(random(this.words.length));
      let oldWord = this.words[idx];
      this.words[idx] = random(FORTH_WORDS);
      // Flash
      this.pulse = 0;
    } else {
      // Add a new word
      this.words.push(random(FORTH_WORDS));
    }
  }

  spawn() {
    let child = new Unit(
      this.x + random(-20, 20),
      this.y + random(-20, 20),
      this.gen + 1
    );
    // Child inherits parent's words + possible mutation
    child.words = [...this.words];
    if (random() < 0.3) {
      child.words.push(random(FORTH_WORDS));
    }
    units.push(child);

    // Spawn flash
    for (let i = 0; i < 5; i++) {
      gossipLines.push({
        x1: this.x, y1: this.y,
        x2: child.x, y2: child.y,
        life: 30, type: 'spawn'
      });
    }
  }

  gossipWith(other) {
    let d = dist(this.x, this.y, other.x, other.y);
    if (d < 120 && random() < 0.005) {
      // Share a word
      let word = random(this.words);
      if (!other.words.includes(word)) {
        other.words.push(word);
        gossipLines.push({
          x1: this.x, y1: this.y,
          x2: other.x, y2: other.y,
          life: 20, type: 'gossip',
          word: word
        });
      }
    }
  }

  draw() {
    let s = this.size + sin(this.pulse) * 2;
    let a = map(sin(this.pulse), -1, 1, 150, 255);

    // Glow
    push();
    noStroke();
    let c = this.color;
    fill(hue(c), saturation(c), brightness(c), 30);
    ellipse(this.x, this.y, s * 3, s * 3);

    // Core
    fill(hue(c), saturation(c), brightness(c), a);
    ellipse(this.x, this.y, s, s);

    // Word label (show top word)
    if (this.words.length > 0) {
      fill(0, 0, 100, map(sin(this.pulse), -1, 1, 100, 220));
      textAlign(CENTER, CENTER);
      textSize(8);
      text(this.words[0], this.x, this.y - s - 4);
    }

    // Generation indicator
    fill(0, 0, 60, 120);
    textSize(6);
    text('g' + this.gen, this.x, this.y + s + 6);
    pop();
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  textFont('monospace');

  // Seed population
  for (let i = 0; i < 8; i++) {
    units.push(new Unit(
      random(100, width - 100),
      random(100, height - 100),
      0
    ));
  }
}

function draw() {
  background(240, 10, 8, 40); // Dark blue-black with trail

  // Update and draw gossip lines
  for (let i = gossipLines.length - 1; i >= 0; i--) {
    let g = gossipLines[i];
    g.life--;
    if (g.life <= 0) {
      gossipLines.splice(i, 1);
      continue;
    }
    let a = map(g.life, 0, 30, 0, 150);
    if (g.type === 'spawn') {
      stroke(30, 80, 100, a); // Gold for spawn
      strokeWeight(2);
    } else {
      stroke(180, 60, 80, a); // Cyan for gossip
      strokeWeight(1);
      // Show shared word
      if (g.word && g.life > 10) {
        noStroke();
        fill(180, 60, 100, a);
        textSize(7);
        textAlign(CENTER);
        text(g.word, (g.x1 + g.x2) / 2, (g.y1 + g.y2) / 2 - 5);
      }
    }
    let t = 1 - g.life / 30;
    let mx = lerp(g.x1, g.x2, t);
    let my = lerp(g.y1, g.y2, t);
    stroke(g.type === 'spawn' ? color(30, 80, 100, a) : color(180, 60, 80, a));
    line(g.x1, g.y1, mx, my);
  }

  // Gossip between nearby units
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      units[i].gossipWith(units[j]);

      // Draw faint connection line for nearby units
      let d = dist(units[i].x, units[i].y, units[j].x, units[j].y);
      if (d < 120) {
        let a = map(d, 0, 120, 40, 0);
        stroke(200, 30, 50, a);
        strokeWeight(0.5);
        line(units[i].x, units[i].y, units[j].x, units[j].y);
      }
    }
  }

  // Update and draw units
  noStroke();
  for (let u of units) {
    u.update();
    u.draw();
  }

  // Cull underperforming units if population is high
  if (units.length > 35) {
    units.sort((a, b) => a.fitness - b.fitness);
    let culled = units.shift();
    // Death flash
    gossipLines.push({
      x1: culled.x - 10, y1: culled.y,
      x2: culled.x + 10, y2: culled.y,
      life: 15, type: 'spawn'
    });
  }

  // HUD
  fill(0, 0, 60, 180);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11);
  text(`units: ${units.length}  |  max gen: ${Math.max(...units.map(u => u.gen))}  |  total words: ${units.reduce((s, u) => s + u.words.length, 0)}`, 12, 12);
  textSize(9);
  fill(0, 0, 40, 140);
  text('click to spawn  |  press M to force mutate all  |  press E to evolve (cull weakest)', 12, 28);
}

function mousePressed() {
  units.push(new Unit(mouseX, mouseY, 0));
}

function keyPressed() {
  if (key === 'm' || key === 'M') {
    for (let u of units) u.mutate();
  }
  if (key === 'e' || key === 'E') {
    if (units.length > 3) {
      units.sort((a, b) => a.fitness - b.fitness);
      units.shift();
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
