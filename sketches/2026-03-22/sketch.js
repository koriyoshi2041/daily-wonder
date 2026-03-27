// Time Cannot Be Bought - 2026-03-22
// Visualizing the irreplacability of time through tree rings

let rings = [];
let age = 0;
let rushing = false;
let rushCount = 0;
let naturalGrowth = true;
let lastRingTime = 0;
const RING_INTERVAL = 800; // ms between natural rings
const RUSH_INTERVAL = 50;  // ms when rushing

// Two trees side by side
let patientTree = { rings: [], age: 0, rushDamage: 0 };
let rushedTree = { rings: [], age: 0, rushDamage: 0 };

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  textFont('Georgia');
  lastRingTime = millis();
}

function draw() {
  background(20, 10, 8);
  
  let now = millis();
  let interval = rushing ? RUSH_INTERVAL : RING_INTERVAL;
  
  // Add rings based on time
  if (now - lastRingTime > interval) {
    addRing(patientTree, false);
    addRing(rushedTree, rushing);
    lastRingTime = now;
  }
  
  // Draw both trees
  let leftX = width * 0.3;
  let rightX = width * 0.7;
  let centerY = height * 0.5;
  
  drawTree(patientTree, leftX, centerY, "Natural Growth");
  drawTree(rushedTree, rightX, centerY, "Rushed Growth");
  
  // Draw rushing indicator
  if (rushing) {
    fill(0, 80, 100, 80);
    noStroke();
    textSize(24);
    textAlign(CENTER, CENTER);
    text("⚡ RUSHING ⚡", width/2, 60);
    
    // Warning message
    fill(40, 70, 100, 60);
    textSize(14);
    text("Money can accelerate, but cannot replicate time's patience", width/2, 90);
  }
  
  // Instructions
  drawInstructions();
  
  // Central message
  drawCentralMessage();
}

function addRing(tree, isRushed) {
  tree.age++;
  
  // Natural ring properties
  let baseThickness = random(2, 5);
  let baseIrregularity = 0.02;
  let baseColorShift = 0;
  
  if (isRushed) {
    tree.rushDamage += 0.15;
    // Rushed growth causes defects
    baseThickness *= random(0.3, 2.5); // Uneven thickness
    baseIrregularity = 0.1 + tree.rushDamage * 0.05; // More irregular shape
    baseColorShift = random(-30, 30); // Color inconsistency
  } else {
    // Slow natural healing
    tree.rushDamage = max(0, tree.rushDamage - 0.01);
  }
  
  tree.rings.push({
    thickness: baseThickness,
    irregularity: baseIrregularity,
    colorShift: baseColorShift,
    wasRushed: isRushed,
    noiseOffset: random(1000)
  });
}

function drawTree(tree, x, y, label) {
  push();
  translate(x, y);
  
  // Calculate total radius
  let totalRadius = 0;
  for (let ring of tree.rings) {
    totalRadius += ring.thickness;
  }
  
  // Limit max radius
  let maxRadius = min(width * 0.25, height * 0.35);
  let scale = totalRadius > maxRadius ? maxRadius / totalRadius : 1;
  
  // Draw rings from outside in
  let currentRadius = totalRadius * scale;
  
  for (let i = tree.rings.length - 1; i >= 0; i--) {
    let ring = tree.rings[i];
    let thickness = ring.thickness * scale;
    
    // Ring color - natural browns with age variation
    let baseHue = 30;
    let hue = baseHue + ring.colorShift;
    let sat = 40 + (ring.wasRushed ? random(-20, 20) : 0);
    let bri = 30 + (i / tree.rings.length) * 25;
    
    // Draw irregular ring
    noFill();
    stroke(hue, sat, bri, 90);
    strokeWeight(thickness);
    
    beginShape();
    let points = 60;
    for (let j = 0; j <= points; j++) {
      let angle = (j / points) * TWO_PI;
      let irregularity = noise(
        cos(angle) * 2 + ring.noiseOffset,
        sin(angle) * 2 + ring.noiseOffset
      );
      let r = currentRadius * (1 + (irregularity - 0.5) * ring.irregularity);
      vertex(cos(angle) * r, sin(angle) * r);
    }
    endShape(CLOSE);
    
    currentRadius -= thickness;
  }
  
  // Draw center (pith)
  if (tree.rings.length > 0) {
    fill(25, 50, 20);
    noStroke();
    ellipse(0, 0, 10, 10);
  }
  
  // Label
  fill(40, 20, 80, 80);
  noStroke();
  textSize(16);
  textAlign(CENTER);
  text(label, 0, maxRadius + 40);
  
  // Age indicator
  fill(40, 10, 60, 60);
  textSize(13);
  text(`${tree.rings.length} years`, 0, maxRadius + 60);
  
  // Quality indicator
  let quality = calculateQuality(tree);
  let qualityColor = quality > 0.8 ? color(120, 60, 70, 70) : 
                     quality > 0.5 ? color(45, 60, 70, 70) :
                     color(0, 60, 70, 70);
  fill(qualityColor);
  textSize(12);
  text(`Quality: ${(quality * 100).toFixed(0)}%`, 0, maxRadius + 80);
  
  pop();
}

function calculateQuality(tree) {
  if (tree.rings.length === 0) return 1;
  
  let rushedRings = tree.rings.filter(r => r.wasRushed).length;
  let ratio = 1 - (rushedRings / tree.rings.length);
  
  // Also factor in rush damage
  let damagepenalty = tree.rushDamage * 0.1;
  
  return max(0, ratio - damagepenalty);
}

function drawInstructions() {
  fill(40, 10, 60, 50);
  noStroke();
  textSize(13);
  textAlign(LEFT, BOTTOM);
  text("Hold SPACE or click to rush growth", 20, height - 40);
  text("Press R to reset both trees", 20, height - 20);
}

function drawCentralMessage() {
  // Only show after some growth
  if (patientTree.rings.length > 5) {
    fill(40, 20, 80, 40);
    noStroke();
    textAlign(CENTER, TOP);
    textSize(18);
    text("A 50-year oak cannot be purchased with money", width/2, 30);
  }
}

function keyPressed() {
  if (key === ' ' || key === 'Space') {
    rushing = true;
  }
  if (key === 'r' || key === 'R') {
    // Reset
    patientTree = { rings: [], age: 0, rushDamage: 0 };
    rushedTree = { rings: [], age: 0, rushDamage: 0 };
  }
}

function keyReleased() {
  if (key === ' ' || key === 'Space') {
    rushing = false;
  }
}

function mousePressed() {
  rushing = true;
}

function mouseReleased() {
  rushing = false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
