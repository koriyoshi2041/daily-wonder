/**
 * 萤火虫之夜 - Firefly Night
 * Daily Wonder | 2026-02-27
 * 
 * 夏夜的萤火虫在黑暗中闪烁飞舞
 * 鼠标移动会轻柔地吸引它们靠近
 */

let fireflies = [];
const NUM_FIREFLIES = 80;

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100, 100);
  
  // 初始化萤火虫
  for (let i = 0; i < NUM_FIREFLIES; i++) {
    fireflies.push(new Firefly());
  }
}

function draw() {
  // 深蓝色夜空，带有微妙的渐变
  background(220, 60, 8, 25); // 半透明背景产生拖尾效果
  
  // 绘制淡淡的星光背景
  drawStars();
  
  // 更新和绘制萤火虫
  for (let firefly of fireflies) {
    firefly.update();
    firefly.draw();
  }
  
  // 鼠标位置产生微光
  drawMouseGlow();
}

function drawStars() {
  // 固定的星星（使用 frameCount 作为种子产生稳定的位置）
  randomSeed(42);
  noStroke();
  for (let i = 0; i < 50; i++) {
    let x = random(width);
    let y = random(height);
    let twinkle = sin(frameCount * 0.02 + i) * 0.5 + 0.5;
    fill(60, 10, 80, twinkle * 30);
    circle(x, y, 1.5);
  }
  randomSeed(frameCount); // 重置随机种子
}

function drawMouseGlow() {
  // 鼠标周围的柔和光晕
  noStroke();
  for (let r = 80; r > 0; r -= 10) {
    fill(45, 80, 90, map(r, 0, 80, 8, 0));
    circle(mouseX, mouseY, r);
  }
}

// 萤火虫类
class Firefly {
  constructor() {
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(random(-1, 1), random(-1, 1));
    this.acc = createVector(0, 0);
    
    // 每只萤火虫有自己的闪烁节奏
    this.phase = random(TWO_PI);
    this.glowSpeed = random(0.02, 0.05);
    
    // 暖黄色到淡绿色之间
    this.hue = random(45, 80);
    this.maxSize = random(4, 8);
  }
  
  update() {
    // 柔和地被鼠标吸引
    let mouse = createVector(mouseX, mouseY);
    let dir = p5.Vector.sub(mouse, this.pos);
    let distance = dir.mag();
    
    if (distance < 200) {
      dir.normalize();
      dir.mult(map(distance, 0, 200, 0.05, 0));
      this.acc.add(dir);
    }
    
    // 添加随机漫游
    this.acc.add(p5.Vector.random2D().mult(0.1));
    
    // 物理更新
    this.vel.add(this.acc);
    this.vel.limit(2);
    this.vel.mult(0.98); // 阻尼
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // 边界环绕
    if (this.pos.x < 0) this.pos.x = width;
    if (this.pos.x > width) this.pos.x = 0;
    if (this.pos.y < 0) this.pos.y = height;
    if (this.pos.y > height) this.pos.y = 0;
    
    // 更新闪烁相位
    this.phase += this.glowSpeed;
  }
  
  draw() {
    // 计算当前亮度（呼吸般的闪烁）
    let glow = (sin(this.phase) + 1) / 2;
    glow = pow(glow, 2); // 让闪烁更有节奏感
    
    let size = this.maxSize * (0.5 + glow * 0.5);
    let brightness = 50 + glow * 50;
    let alpha = 30 + glow * 70;
    
    noStroke();
    
    // 外层光晕
    for (let r = size * 4; r > size; r -= size * 0.5) {
      fill(this.hue, 70, brightness, map(r, size, size * 4, alpha * 0.3, 0));
      circle(this.pos.x, this.pos.y, r);
    }
    
    // 核心光点
    fill(this.hue, 40, 100, alpha);
    circle(this.pos.x, this.pos.y, size);
    
    // 中心最亮点
    fill(60, 10, 100, alpha * 0.8);
    circle(this.pos.x, this.pos.y, size * 0.3);
  }
}

// 点击时萤火虫四散
function mousePressed() {
  for (let firefly of fireflies) {
    let dir = p5.Vector.sub(firefly.pos, createVector(mouseX, mouseY));
    let distance = dir.mag();
    if (distance < 150) {
      dir.normalize();
      dir.mult(map(distance, 0, 150, 8, 0));
      firefly.vel.add(dir);
    }
  }
}

// 响应式画布
function windowResized() {
  resizeCanvas(min(windowWidth - 40, 800), min(windowHeight - 40, 600));
}
