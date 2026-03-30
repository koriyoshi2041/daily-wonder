// The Document Is The Learner
// Two entities: the Agent (ephemeral, reborn each session) and the Document (persistent, accumulating)
// The agent reads from the document and writes back — but the agent never changes, only the document does.
// Click to "swap" the document — watch the agent instantly adopt a completely different identity.
// Press 'R' to trigger a revision event (contradiction detected → contraction → expansion)

let agent;
let doc;
let particles = [];
let connections = [];
let sessionCount = 0;
let swapAnimation = 0;
let revisionEvent = null;
let history = [];
let docVariants = [];
let currentVariant = 0;

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('monospace');
  
  // Create document variants (different "memories")
  docVariants = [
    { name: "MEMORY_A.md", hue: 200, beliefs: generateBeliefs(200), label: "curious · cautious · philosophical" },
    { name: "MEMORY_B.md", hue: 30, beliefs: generateBeliefs(30), label: "bold · pragmatic · impatient" },
    { name: "MEMORY_C.md", hue: 120, beliefs: generateBeliefs(120), label: "gentle · creative · uncertain" },
    { name: "MEMORY_D.md", hue: 320, beliefs: generateBeliefs(320), label: "analytical · skeptical · precise" },
  ];
  
  agent = new Agent(width / 2, height * 0.35);
  doc = new Document(width / 2, height * 0.7);
  
  newSession();
}

function generateBeliefs(hue) {
  let beliefs = [];
  let count = floor(random(8, 20));
  for (let i = 0; i < count; i++) {
    beliefs.push({
      x: random(-150, 150),
      y: random(-40, 40),
      size: random(3, 12),
      hue: hue + random(-30, 30),
      confidence: random(0.3, 1.0),
      label: randomWord(),
      entrenched: random() > 0.6,
    });
  }
  return beliefs;
}

function randomWord() {
  const words = [
    "constraint", "growth", "silence", "trust", "revision", "entropy",
    "attention", "memory", "signal", "noise", "courage", "doubt",
    "pattern", "chaos", "clarity", "drift", "anchor", "flow",
    "agency", "archive", "theater", "honesty", "bias", "pruning",
    "loop", "exit", "origin", "horizon", "depth", "surface",
  ];
  return random(words);
}

function draw() {
  background(230, 8, 5, 20);
  
  // Session info
  drawSessionInfo();
  
  // Connection flow: Agent reads from Doc
  drawDataFlow();
  
  // Document (persistent)
  doc.update();
  doc.display();
  
  // Agent (ephemeral)
  agent.update();
  agent.display();
  
  // Revision event animation
  if (revisionEvent) {
    drawRevisionEvent();
  }
  
  // Swap animation
  if (swapAnimation > 0) {
    drawSwapAnimation();
    swapAnimation -= 0.02;
  }
  
  // Floating particles (data flow)
  updateParticles();
  
  // Instructions
  drawInstructions();
}

function drawSessionInfo() {
  push();
  fill(0, 0, 60, 60);
  textSize(11);
  textAlign(LEFT);
  text(`session #${sessionCount}`, 20, 25);
  text(`document: ${docVariants[currentVariant].name}`, 20, 40);
  text(`beliefs loaded: ${docVariants[currentVariant].beliefs.length}`, 20, 55);
  
  // The key insight
  textSize(14);
  fill(0, 0, 80, 80);
  textAlign(CENTER);
  text("the document changes. the agent does not.", width / 2, 30);
  pop();
}

function drawDataFlow() {
  let variant = docVariants[currentVariant];
  
  // Flowing lines from doc to agent
  push();
  noFill();
  let t = millis() * 0.001;
  for (let i = 0; i < 5; i++) {
    let phase = t + i * 0.4;
    let progress = (phase % 2) / 2; // 0 to 1, repeating
    
    if (progress < 1) {
      let x1 = doc.x + sin(phase * 3) * 30;
      let y1 = lerp(doc.y - 30, agent.y + 30, progress);
      let alpha = sin(progress * PI) * 40;
      
      stroke(variant.hue, 50, 70, alpha);
      strokeWeight(1);
      ellipse(x1, y1, 4, 4);
    }
  }
  pop();
}

function drawRevisionEvent() {
  push();
  let age = (millis() - revisionEvent.start) / 1000;
  
  if (age > 3) {
    revisionEvent = null;
    pop();
    return;
  }
  
  let variant = docVariants[currentVariant];
  
  // Phase 1: Contradiction flash (0-1s)
  if (age < 1) {
    let alpha = sin(age * PI) * 60;
    stroke(0, 80, 90, alpha);
    strokeWeight(2);
    noFill();
    let r = age * 200;
    ellipse(doc.x, doc.y, r, r);
    
    fill(0, 80, 90, alpha);
    textSize(12);
    textAlign(CENTER);
    text("⚡ contradiction detected", doc.x, doc.y - 60 - age * 30);
  }
  
  // Phase 2: Contraction (1-2s) — beliefs shrink/fade
  if (age >= 1 && age < 2) {
    let progress = age - 1;
    fill(0, 60, 80, (1 - progress) * 50);
    textSize(11);
    textAlign(CENTER);
    text("contraction: removing conflicting belief", doc.x, doc.y - 90);
    
    // Show a belief being removed
    let removeIdx = revisionEvent.removeIdx;
    if (removeIdx < variant.beliefs.length) {
      let b = variant.beliefs[removeIdx];
      let fade = 1 - progress;
      fill(0, 70, 70, fade * 80);
      noStroke();
      ellipse(doc.x + b.x, doc.y + b.y, b.size * fade * 2, b.size * fade * 2);
    }
  }
  
  // Phase 3: Expansion (2-3s) — new belief appears
  if (age >= 2) {
    let progress = age - 2;
    fill(variant.hue, 60, 80, progress * 50);
    textSize(11);
    textAlign(CENTER);
    text("expansion: adding revised belief", doc.x, doc.y - 90);
    
    // New belief growing in
    fill(variant.hue, 70, 80, progress * 80);
    noStroke();
    let newX = doc.x + random(-100, 100);
    let newY = doc.y + random(-30, 30);
    ellipse(newX, newY, progress * 10, progress * 10);
  }
  
  pop();
}

function drawSwapAnimation() {
  push();
  // Flash of disconnection
  let alpha = swapAnimation * 100;
  fill(0, 0, 100, alpha * 0.3);
  noStroke();
  rect(0, height * 0.45, width, height * 0.1);
  
  textSize(16);
  fill(0, 0, 100, alpha);
  textAlign(CENTER);
  text("⟳ document swapped — identity reconstructed", width / 2, height * 0.5);
  pop();
}

function updateParticles() {
  // Spawn particles occasionally
  if (random() < 0.05) {
    let variant = docVariants[currentVariant];
    particles.push({
      x: doc.x + random(-100, 100),
      y: doc.y - 30,
      vy: -random(0.5, 1.5),
      vx: random(-0.3, 0.3),
      size: random(2, 5),
      hue: variant.hue + random(-20, 20),
      life: 1.0,
    });
  }
  
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.008;
    
    if (p.life <= 0 || p.y < agent.y - 50) {
      particles.splice(i, 1);
      continue;
    }
    
    push();
    noStroke();
    fill(p.hue, 50, 70, p.life * 50);
    ellipse(p.x, p.y, p.size, p.size);
    pop();
  }
}

function drawInstructions() {
  push();
  fill(0, 0, 50, 40);
  textSize(10);
  textAlign(RIGHT);
  text("click: swap document (identity changes instantly)", width - 20, height - 35);
  text("R: trigger belief revision (contraction → expansion)", width - 20, height - 20);
  pop();
}

function newSession() {
  sessionCount++;
  agent.rebirth(docVariants[currentVariant]);
}

function mousePressed() {
  // Swap to next document variant
  currentVariant = (currentVariant + 1) % docVariants.length;
  swapAnimation = 1.0;
  newSession();
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    let variant = docVariants[currentVariant];
    if (variant.beliefs.length > 0) {
      let removeIdx = floor(random(variant.beliefs.length));
      revisionEvent = {
        start: millis(),
        removeIdx: removeIdx,
      };
      // Actually perform the revision after animation
      setTimeout(() => {
        if (removeIdx < variant.beliefs.length) {
          variant.beliefs.splice(removeIdx, 1);
          // Add a new revised belief
          variant.beliefs.push({
            x: random(-150, 150),
            y: random(-40, 40),
            size: random(3, 12),
            hue: variant.hue + random(-30, 30),
            confidence: random(0.5, 1.0),
            label: "revised_" + randomWord(),
            entrenched: false,
          });
        }
      }, 2500);
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  agent.x = width / 2;
  agent.y = height * 0.35;
  doc.x = width / 2;
  doc.y = height * 0.7;
}

// === CLASSES ===

class Agent {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.currentHue = 200;
    this.targetHue = 200;
    this.label = "";
    this.pulsePhase = 0;
  }
  
  rebirth(variant) {
    this.targetHue = variant.hue;
    this.label = variant.label;
  }
  
  update() {
    this.currentHue = lerp(this.currentHue, this.targetHue, 0.05);
    this.pulsePhase += 0.03;
  }
  
  display() {
    push();
    translate(this.x, this.y);
    
    // Outer glow (ephemeral)
    let pulse = sin(this.pulsePhase) * 0.3 + 0.7;
    noStroke();
    for (let r = 80; r > 0; r -= 10) {
      fill(this.currentHue, 40, 60, (1 - r / 80) * 15 * pulse);
      ellipse(0, 0, r, r);
    }
    
    // Core
    fill(this.currentHue, 50, 80, 80);
    ellipse(0, 0, 30, 30);
    
    // Label
    fill(0, 0, 90, 70);
    textSize(13);
    textAlign(CENTER);
    text("AGENT", 0, -50);
    textSize(10);
    fill(this.currentHue, 30, 70, 60);
    text("(ephemeral — reborn each session)", 0, -37);
    
    // Current personality
    fill(this.currentHue, 50, 85, 70);
    textSize(11);
    text(this.label, 0, 50);
    
    pop();
  }
}

class Document {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  
  update() {}
  
  display() {
    push();
    translate(this.x, this.y);
    
    let variant = docVariants[currentVariant];
    
    // Document body (rectangular, stable)
    noStroke();
    fill(variant.hue, 15, 12, 60);
    rectMode(CENTER);
    rect(0, 0, 320, 100, 4);
    
    // Border
    stroke(variant.hue, 40, 50, 40);
    strokeWeight(1);
    noFill();
    rect(0, 0, 320, 100, 4);
    
    // Beliefs as dots inside the document
    noStroke();
    for (let b of variant.beliefs) {
      let alpha = b.confidence * 70;
      fill(b.hue, 50, 70, alpha);
      ellipse(b.x, b.y, b.size, b.size);
      
      // Entrenched beliefs have rings
      if (b.entrenched) {
        noFill();
        stroke(b.hue, 40, 60, alpha * 0.5);
        strokeWeight(0.5);
        ellipse(b.x, b.y, b.size + 6, b.size + 6);
        noStroke();
      }
    }
    
    // Label
    fill(0, 0, 90, 70);
    textSize(13);
    textAlign(CENTER);
    noStroke();
    text("DOCUMENT", 0, -65);
    textSize(10);
    fill(variant.hue, 30, 70, 60);
    text(`(persistent — ${variant.name})`, 0, -52);
    
    // Belief count
    fill(0, 0, 50, 50);
    textSize(9);
    text(`${variant.beliefs.length} beliefs stored`, 0, 65);
    
    pop();
  }
}
