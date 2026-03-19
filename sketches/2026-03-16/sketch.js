// The Ledger Gap - 2026-03-16
// Visualizing visible costs vs invisible value

let costs = [];
let values = [];
let showValues = false;

function setup() {
  createCanvas(800, 600);
  
  // 创建"成本"粒子 - 大、红、规则
  for (let i = 0; i < 30; i++) {
    costs.push({
      x: random(100, 400),
      y: random(100, 500),
      size: random(20, 40),
      speed: random(0.5, 1.5),
      angle: random(TWO_PI)
    });
  }
  
  // 创建"价值"粒子 - 小、蓝、分散
  for (let i = 0; i < 100; i++) {
    values.push({
      x: random(400, 700),
      y: random(100, 500),
      size: random(3, 10),
      speed: random(0.2, 0.8),
      angle: random(TWO_PI),
      alpha: random(50, 150),
      connections: []
    });
  }
  
  // 建立价值之间的连接
  for (let v of values) {
    for (let other of values) {
      if (v !== other && dist(v.x, v.y, other.x, other.y) < 80) {
        v.connections.push(other);
      }
    }
  }
}

function draw() {
  background(15, 15, 20);
  
  // 分割线
  stroke(50);
  strokeWeight(1);
  line(width/2, 50, width/2, height - 50);
  
  // 标签
  noStroke();
  fill(200);
  textSize(14);
  textAlign(CENTER);
  text("MEASURABLE COSTS", width/4, 40);
  text("HIDDEN VALUE", 3*width/4, 40);
  
  // 绘制成本粒子（总是可见）
  for (let c of costs) {
    // 移动
    c.x += cos(c.angle) * c.speed;
    c.y += sin(c.angle) * c.speed;
    
    // 边界反弹
    if (c.x < 50 || c.x > width/2 - 20) c.angle = PI - c.angle;
    if (c.y < 50 || c.y > height - 50) c.angle = -c.angle;
    
    // 绘制
    fill(220, 60, 60);
    noStroke();
    ellipse(c.x, c.y, c.size);
    
    // 成本数字
    fill(255, 200);
    textSize(8);
    text("$" + floor(c.size * 3), c.x, c.y + 3);
  }
  
  // 绘制价值粒子（鼠标悬停/按键时显示）
  let valueAlpha = showValues ? 255 : map(mouseX, 0, width, 0, 100);
  
  // 连接线
  if (valueAlpha > 30) {
    stroke(100, 150, 255, valueAlpha * 0.3);
    strokeWeight(0.5);
    for (let v of values) {
      for (let conn of v.connections) {
        line(v.x, v.y, conn.x, conn.y);
      }
    }
  }
  
  // 价值粒子
  for (let v of values) {
    // 缓慢移动
    v.x += cos(v.angle) * v.speed * 0.5;
    v.y += sin(v.angle) * v.speed * 0.5;
    
    // 边界处理
    if (v.x < width/2 + 20 || v.x > width - 50) v.angle = PI - v.angle;
    if (v.y < 50 || v.y > height - 50) v.angle = -v.angle;
    
    // 绘制
    let alpha = map(valueAlpha, 0, 255, v.alpha * 0.1, v.alpha);
    fill(100, 150, 255, alpha);
    noStroke();
    ellipse(v.x, v.y, v.size);
  }
  
  // 指令
  fill(100);
  textSize(12);
  textAlign(CENTER);
  text("Move mouse right to reveal hidden value • Press SPACE to toggle", width/2, height - 20);
  
  // 总计显示
  let totalCost = costs.reduce((sum, c) => sum + c.size * 3, 0);
  let totalValue = showValues || mouseX > width * 0.7 ? 
    "∞ (compound, delayed, distributed)" : 
    "??? (unmeasured)";
  
  fill(220, 60, 60);
  textAlign(LEFT);
  textSize(16);
  text("Total: $" + floor(totalCost), 50, height - 60);
  
  fill(100, 150, 255, valueAlpha);
  textAlign(RIGHT);
  text("Total: " + totalValue, width - 50, height - 60);
}

function keyPressed() {
  if (key === ' ') {
    showValues = !showValues;
  }
}

function mousePressed() {
  // 点击重新生成
  if (mouseButton === LEFT && mouseY > 60) {
    setup();
  }
}
