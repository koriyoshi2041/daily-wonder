// Daily Wonder Sketch: 2026-03-12
// Theme: Agent Infrastructure Layers
// Identity ✓ Payment ✓ Governance ❓

let layers = [];
let particles = [];
let connections = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Define three layers
  const layerHeight = height / 4;
  layers = [
    { name: "Identity Layer", y: layerHeight, color: color(100, 200, 100), status: "solved", emoji: "✓" },
    { name: "Payment Layer", y: layerHeight * 2, color: color(100, 150, 200), status: "solved", emoji: "✓" },
    { name: "Governance Layer", y: layerHeight * 3, color: color(200, 100, 100, 150), status: "empty", emoji: "❓" }
  ];
  
  // Create particles for each layer
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 15; j++) {
      particles.push({
        layer: i,
        x: random(100, width - 100),
        baseY: layers[i].y,
        y: layers[i].y,
        vx: random(-0.5, 0.5),
        vy: 0,
        size: random(8, 15),
        phase: random(TWO_PI)
      });
    }
  }
}

function draw() {
  background(15, 15, 20);
  
  // Draw layer backgrounds
  drawLayers();
  
  // Update and draw particles
  updateParticles();
  drawParticles();
  
  // Draw connections between layers
  drawConnections();
  
  // Draw layer labels
  drawLabels();
  
  // Draw title
  drawTitle();
}

function drawLayers() {
  noStroke();
  for (let layer of layers) {
    let alpha = layer.status === "empty" ? 30 : 50;
    fill(red(layer.color), green(layer.color), blue(layer.color), alpha);
    rect(0, layer.y - 40, width, 80);
  }
}

function updateParticles() {
  for (let p of particles) {
    // Horizontal movement
    p.x += p.vx;
    if (p.x < 50 || p.x > width - 50) p.vx *= -1;
    
    // Vertical oscillation
    p.y = p.baseY + sin(frameCount * 0.02 + p.phase) * 15;
    
    // Mouse interaction
    let d = dist(mouseX, mouseY, p.x, p.y);
    if (d < 100) {
      p.x += (p.x - mouseX) * 0.02;
    }
  }
}

function drawParticles() {
  for (let p of particles) {
    let layer = layers[p.layer];
    
    // Glow effect
    for (let i = 3; i > 0; i--) {
      noStroke();
      fill(red(layer.color), green(layer.color), blue(layer.color), 30 / i);
      ellipse(p.x, p.y, p.size * i * 1.5);
    }
    
    // Core
    fill(layer.color);
    ellipse(p.x, p.y, p.size);
  }
}

function drawConnections() {
  // Connections between Identity and Payment (solid)
  drawLayerConnections(0, 1, true);
  
  // Connections between Payment and Governance (broken)
  drawLayerConnections(1, 2, false);
}

function drawLayerConnections(layer1, layer2, solid) {
  let p1s = particles.filter(p => p.layer === layer1);
  let p2s = particles.filter(p => p.layer === layer2);
  
  for (let i = 0; i < min(p1s.length, p2s.length); i++) {
    let p1 = p1s[i];
    let p2 = p2s[i];
    
    if (solid) {
      // Solid connection
      stroke(150, 150, 150, 100);
      strokeWeight(1);
      line(p1.x, p1.y, p2.x, p2.y);
    } else {
      // Broken/flickering connection
      if (random() > 0.3) {
        stroke(200, 100, 100, 50 + sin(frameCount * 0.1) * 30);
        strokeWeight(1);
        
        // Draw dashed line
        let steps = 10;
        for (let j = 0; j < steps; j += 2) {
          let t1 = j / steps;
          let t2 = (j + 1) / steps;
          let x1 = lerp(p1.x, p2.x, t1);
          let y1 = lerp(p1.y, p2.y, t1);
          let x2 = lerp(p1.x, p2.x, t2);
          let y2 = lerp(p1.y, p2.y, t2);
          line(x1, y1, x2, y2);
        }
      }
    }
  }
}

function drawLabels() {
  textAlign(LEFT, CENTER);
  textSize(16);
  
  for (let layer of layers) {
    let alpha = layer.status === "empty" ? 150 : 255;
    fill(255, alpha);
    
    let emoji = layer.emoji;
    let status = layer.status === "empty" ? "missing" : "solved";
    
    text(`${emoji} ${layer.name}`, 30, layer.y);
    
    // Hover effect
    if (abs(mouseY - layer.y) < 40) {
      fill(255, 200);
      textSize(12);
      if (layer.status === "empty") {
        text("← Who builds this?", 200, layer.y);
      } else {
        text("← Connected", 200, layer.y);
      }
      textSize(16);
    }
  }
}

function drawTitle() {
  fill(255);
  textAlign(CENTER, TOP);
  textSize(24);
  text("Agent Infrastructure Stack", width / 2, 30);
  
  textSize(12);
  fill(150);
  text("Identity ✓  Payment ✓  Governance ❓", width / 2, 60);
  
  // Instructions
  textAlign(CENTER, BOTTOM);
  textSize(11);
  fill(100);
  text("Move mouse to interact • Click governance layer to attempt connection", width / 2, height - 20);
}

function mousePressed() {
  // Check if clicking on governance layer
  if (abs(mouseY - layers[2].y) < 50) {
    // Attempt to connect - but fail with visual feedback
    showConnectionAttempt();
  }
}

function showConnectionAttempt() {
  // Flash effect
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      // This would show a flash, but in p5.js we'll handle it differently
    }, i * 100);
  }
  
  // Create temporary "error" particles
  for (let i = 0; i < 10; i++) {
    particles.push({
      layer: 2,
      x: mouseX + random(-50, 50),
      baseY: layers[2].y,
      y: layers[2].y,
      vx: random(-2, 2),
      vy: random(-2, 2),
      size: random(3, 6),
      phase: random(TWO_PI),
      temp: true,
      life: 60
    });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Update layer positions
  const layerHeight = height / 4;
  layers[0].y = layerHeight;
  layers[1].y = layerHeight * 2;
  layers[2].y = layerHeight * 3;
  
  // Update particle base positions
  for (let p of particles) {
    p.baseY = layers[p.layer].y;
  }
}
