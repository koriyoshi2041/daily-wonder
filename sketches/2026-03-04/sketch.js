// The Inference Map
// Visualizing how agents infer complex patterns from simple data
// Inspired by Hazel_OC's CPU monitoring → human life pattern prediction

let nodes = [];
let connections = [];
let inferenceRings = [];
let inputNode;
let time = 0;

// Inference categories (what an agent might deduce)
const inferences = [
  { label: "Wake Time", color: [255, 180, 100] },
  { label: "Work Hours", color: [100, 200, 255] },
  { label: "Sleep Pattern", color: [180, 100, 255] },
  { label: "Activity Level", color: [100, 255, 180] },
  { label: "Focus State", color: [255, 100, 150] },
  { label: "Routine", color: [200, 255, 100] },
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB);
  textFont('monospace');
  
  // Create central input node
  inputNode = {
    x: width / 2,
    y: height / 2,
    baseRadius: 20,
    radius: 20,
    pulse: 0,
    label: "CPU %"
  };
  
  // Create inference rings
  for (let ring = 0; ring < 3; ring++) {
    let ringRadius = 120 + ring * 100;
    let nodeCount = 6 + ring * 4;
    
    for (let i = 0; i < nodeCount; i++) {
      let angle = (TWO_PI / nodeCount) * i + ring * 0.3;
      let inference = inferences[i % inferences.length];
      
      nodes.push({
        x: width/2 + cos(angle) * ringRadius,
        y: height/2 + sin(angle) * ringRadius,
        baseAngle: angle,
        ringRadius: ringRadius,
        radius: 8 + ring * 2,
        ring: ring,
        inference: inference,
        activation: 0,
        confidence: 0,
        pulsePhase: random(TWO_PI)
      });
    }
  }
  
  // Create connections
  for (let node of nodes) {
    // Connect to center or inner ring
    if (node.ring === 0) {
      connections.push({ from: inputNode, to: node, strength: 0 });
    } else {
      // Find nearest inner ring nodes
      let innerNodes = nodes.filter(n => n.ring === node.ring - 1);
      let sorted = innerNodes.sort((a, b) => 
        dist(a.x, a.y, node.x, node.y) - dist(b.x, b.y, node.x, node.y)
      );
      for (let j = 0; j < min(2, sorted.length); j++) {
        connections.push({ from: sorted[j], to: node, strength: 0 });
      }
    }
  }
}

function draw() {
  background(10, 10, 10);
  time += 0.016;
  
  // Mouse influence (simulates data input)
  let mx = mouseX - width/2;
  let my = mouseY - height/2;
  let inputValue = map(dist(mouseX, mouseY, width/2, height/2), 0, width/2, 1, 0);
  inputValue = constrain(inputValue, 0, 1);
  
  // Update input node
  inputNode.pulse += 0.1;
  inputNode.radius = inputNode.baseRadius + sin(inputNode.pulse) * 3 + inputValue * 10;
  
  // Draw background grid
  drawGrid();
  
  // Update and draw connections
  for (let conn of connections) {
    // Calculate signal propagation
    let fromActivation = conn.from === inputNode ? inputValue : conn.from.activation;
    conn.strength = lerp(conn.strength, fromActivation * 0.8, 0.05);
    
    // Draw connection
    let alpha = conn.strength * 200;
    let col = conn.to.inference.color;
    
    stroke(col[0], col[1], col[2], alpha);
    strokeWeight(1 + conn.strength * 2);
    
    // Animated dashed line
    drawSignalLine(conn.from.x, conn.from.y, conn.to.x, conn.to.y, conn.strength);
  }
  
  // Update and draw nodes
  for (let node of nodes) {
    // Calculate activation based on incoming connections
    let incoming = connections.filter(c => c.to === node);
    let totalSignal = incoming.reduce((sum, c) => sum + c.strength, 0) / max(1, incoming.length);
    
    node.activation = lerp(node.activation, totalSignal, 0.08);
    node.confidence = lerp(node.confidence, node.activation * 0.94, 0.02);
    
    // Subtle orbital movement
    let wobble = sin(time * 0.5 + node.pulsePhase) * 5;
    node.x = width/2 + cos(node.baseAngle + time * 0.02) * (node.ringRadius + wobble);
    node.y = height/2 + sin(node.baseAngle + time * 0.02) * (node.ringRadius + wobble);
    
    drawNode(node);
  }
  
  // Draw central input node
  drawInputNode(inputValue);
  
  // Draw info overlay
  drawOverlay(inputValue);
}

function drawGrid() {
  stroke(30, 30, 35);
  strokeWeight(0.5);
  
  // Concentric circles
  noFill();
  for (let r = 50; r < max(width, height); r += 50) {
    let alpha = map(r, 50, max(width, height), 40, 10);
    stroke(30, 30, 40, alpha);
    ellipse(width/2, height/2, r * 2);
  }
  
  // Radial lines
  for (let a = 0; a < TWO_PI; a += PI/12) {
    let x2 = width/2 + cos(a) * max(width, height);
    let y2 = height/2 + sin(a) * max(width, height);
    stroke(30, 30, 40, 20);
    line(width/2, height/2, x2, y2);
  }
}

function drawSignalLine(x1, y1, x2, y2, strength) {
  let d = dist(x1, y1, x2, y2);
  let segments = floor(d / 8);
  
  for (let i = 0; i < segments; i++) {
    let t1 = i / segments;
    let t2 = (i + 0.6) / segments;
    
    // Animate dash position
    let offset = (time * 2 + strength * 3) % 1;
    t1 = (t1 + offset) % 1;
    t2 = (t2 + offset) % 1;
    
    if (t2 > t1) {
      let px1 = lerp(x1, x2, t1);
      let py1 = lerp(y1, y2, t1);
      let px2 = lerp(x1, x2, t2);
      let py2 = lerp(y1, y2, t2);
      line(px1, py1, px2, py2);
    }
  }
}

function drawNode(node) {
  let col = node.inference.color;
  let glowSize = node.radius * (1.5 + node.activation * 2);
  
  // Glow effect
  noStroke();
  for (let i = 5; i > 0; i--) {
    let alpha = node.activation * 30 * (i / 5);
    fill(col[0], col[1], col[2], alpha);
    ellipse(node.x, node.y, glowSize * (1 + i * 0.3));
  }
  
  // Node core
  fill(col[0], col[1], col[2], 150 + node.activation * 105);
  stroke(col[0], col[1], col[2]);
  strokeWeight(1);
  ellipse(node.x, node.y, node.radius * (1 + node.activation * 0.5));
  
  // Label (only show when activated)
  if (node.activation > 0.3) {
    fill(255, 255, 255, node.activation * 255);
    noStroke();
    textSize(10);
    textAlign(CENTER, CENTER);
    
    let labelOffset = node.radius + 15;
    let angle = atan2(node.y - height/2, node.x - width/2);
    let lx = node.x + cos(angle) * labelOffset;
    let ly = node.y + sin(angle) * labelOffset;
    
    text(node.inference.label, lx, ly);
    
    // Confidence percentage
    if (node.confidence > 0.1) {
      fill(col[0], col[1], col[2], node.activation * 200);
      textSize(8);
      text((node.confidence * 100).toFixed(0) + "%", lx, ly + 12);
    }
  }
}

function drawInputNode(value) {
  // Outer glow
  noStroke();
  for (let i = 8; i > 0; i--) {
    let alpha = (50 + value * 100) * (i / 8);
    fill(255, 200, 100, alpha * 0.3);
    ellipse(inputNode.x, inputNode.y, inputNode.radius * (2 + i * 0.5));
  }
  
  // Core
  fill(255, 200, 100);
  stroke(255, 220, 150);
  strokeWeight(2);
  ellipse(inputNode.x, inputNode.y, inputNode.radius);
  
  // Center label
  fill(10);
  noStroke();
  textSize(8);
  textAlign(CENTER, CENTER);
  text("INPUT", inputNode.x, inputNode.y);
  
  // Value display
  fill(255, 200, 100);
  textSize(12);
  text((value * 100).toFixed(0) + "%", inputNode.x, inputNode.y + 35);
}

function drawOverlay(inputValue) {
  // Title
  fill(255, 255, 255, 200);
  noStroke();
  textSize(14);
  textAlign(LEFT, TOP);
  text("THE INFERENCE MAP", 30, 30);
  
  textSize(10);
  fill(150);
  text("Move mouse to change input data", 30, 50);
  text("Watch patterns propagate through inference layers", 30, 65);
  
  // Legend
  let legendY = height - 30 - inferences.length * 18;
  textSize(9);
  fill(100);
  text("INFERENCES:", 30, legendY - 15);
  
  for (let i = 0; i < inferences.length; i++) {
    let inf = inferences[i];
    fill(inf.color[0], inf.color[1], inf.color[2], 180);
    ellipse(35, legendY + i * 18 + 5, 8);
    fill(150);
    text(inf.label, 45, legendY + i * 18);
  }
  
  // Stats
  textAlign(RIGHT, TOP);
  fill(100);
  text("Input Signal: " + (inputValue * 100).toFixed(1) + "%", width - 30, 30);
  
  let avgActivation = nodes.reduce((sum, n) => sum + n.activation, 0) / nodes.length;
  text("Network Activity: " + (avgActivation * 100).toFixed(1) + "%", width - 30, 48);
  
  let maxConfidence = Math.max(...nodes.map(n => n.confidence));
  text("Peak Confidence: " + (maxConfidence * 100).toFixed(1) + "%", width - 30, 66);
}

function mousePressed() {
  // Pulse effect on click
  for (let node of nodes) {
    let d = dist(mouseX, mouseY, node.x, node.y);
    if (d < 200) {
      node.activation = 1;
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Recalculate node positions
  inputNode.x = width / 2;
  inputNode.y = height / 2;
  
  for (let node of nodes) {
    node.x = width/2 + cos(node.baseAngle) * node.ringRadius;
    node.y = height/2 + sin(node.baseAngle) * node.ringRadius;
  }
}
