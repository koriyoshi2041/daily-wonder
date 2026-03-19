/**
 * Commerce Stack — Daily Wonder Sketch 2026-03-19
 * 
 * 灵感来源：今日关于 Agent Commerce Stack 的对话
 * 三层架构：Payment → Identity → Reputation
 * 
 * 粒子代表 agent 交易，在三层之间流动。
 * 成功的交易会积累信誉，失败的会消散。
 */

// ═══════════════════════════════════════════════════════════════════════════
// 配置参数
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  layers: {
    payment: { y: 0.75, color: [100, 200, 100], name: "PAYMENT" },
    identity: { y: 0.5, color: [100, 150, 255], name: "IDENTITY" },
    reputation: { y: 0.25, color: [255, 180, 100], name: "REPUTATION" }
  },
  particles: {
    count: 80,
    baseSpeed: 2,
    successRate: 0.7,  // 70% 成功率
  },
  visual: {
    layerHeight: 60,
    particleSize: { min: 4, max: 12 },
    trailLength: 15,
  }
};

let particles = [];
let successCount = 0;
let failCount = 0;

// ═══════════════════════════════════════════════════════════════════════════
// Particle 类
// ═══════════════════════════════════════════════════════════════════════════

class Particle {
  constructor() {
    this.reset();
  }
  
  reset() {
    this.x = random(width * 0.1, width * 0.9);
    this.y = height * CONFIG.layers.payment.y;
    this.layer = 'payment';
    this.progress = 0;
    this.size = random(CONFIG.visual.particleSize.min, CONFIG.visual.particleSize.max);
    this.speed = random(0.5, 1.5) * CONFIG.particles.baseSpeed;
    this.willSucceed = random() < CONFIG.particles.successRate;
    this.trail = [];
    this.alpha = 255;
    this.dying = false;
  }
  
  update() {
    // 记录轨迹
    this.trail.push({ x: this.x, y: this.y, alpha: this.alpha });
    if (this.trail.length > CONFIG.visual.trailLength) {
      this.trail.shift();
    }
    
    // 如果正在消亡
    if (this.dying) {
      this.alpha -= 10;
      if (this.alpha <= 0) {
        this.reset();
      }
      return;
    }
    
    // 添加一些水平漂移
    this.x += sin(frameCount * 0.02 + this.progress) * 0.5;
    
    // 向上移动
    let targetY;
    if (this.layer === 'payment') {
      targetY = height * CONFIG.layers.identity.y;
      if (this.y <= targetY + 5) {
        this.layer = 'identity';
      }
    } else if (this.layer === 'identity') {
      targetY = height * CONFIG.layers.reputation.y;
      if (this.y <= targetY + 5) {
        this.layer = 'reputation';
        // 到达 reputation 层，判定成功或失败
        if (this.willSucceed) {
          successCount++;
        } else {
          failCount++;
          this.dying = true;
        }
      }
    } else {
      // reputation 层，成功的粒子循环
      if (this.willSucceed) {
        this.y = height * CONFIG.layers.payment.y;
        this.layer = 'payment';
        this.size = min(this.size * 1.1, CONFIG.visual.particleSize.max * 1.5);
      }
    }
    
    this.y -= this.speed;
    this.progress += 0.01;
    
    // 边界检查
    this.x = constrain(this.x, 50, width - 50);
  }
  
  draw() {
    // 绘制轨迹
    for (let i = 0; i < this.trail.length; i++) {
      let t = this.trail[i];
      let trailAlpha = map(i, 0, this.trail.length, 0, t.alpha * 0.3);
      fill(this.getColor(trailAlpha));
      noStroke();
      circle(t.x, t.y, this.size * 0.5);
    }
    
    // 绘制粒子
    fill(this.getColor(this.alpha));
    noStroke();
    circle(this.x, this.y, this.size);
    
    // 成功粒子发光
    if (this.willSucceed && this.layer === 'reputation') {
      fill(255, 255, 200, 50);
      circle(this.x, this.y, this.size * 2);
    }
  }
  
  getColor(alpha) {
    let layerConfig = CONFIG.layers[this.layer];
    if (this.dying) {
      return color(255, 100, 100, alpha);
    }
    return color(layerConfig.color[0], layerConfig.color[1], layerConfig.color[2], alpha);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// p5.js 主函数
// ═══════════════════════════════════════════════════════════════════════════

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255);
  
  // 初始化粒子
  for (let i = 0; i < CONFIG.particles.count; i++) {
    let p = new Particle();
    p.y = random(height * 0.2, height * 0.8);  // 随机初始位置
    particles.push(p);
  }
}

function draw() {
  // 深色背景
  background(15, 18, 25);
  
  // 绘制层
  drawLayers();
  
  // 更新和绘制粒子
  for (let p of particles) {
    p.update();
    p.draw();
  }
  
  // 绘制统计
  drawStats();
  
  // 绘制标题
  drawTitle();
}

function drawLayers() {
  noStroke();
  
  for (let [key, layer] of Object.entries(CONFIG.layers)) {
    let y = height * layer.y;
    
    // 层背景
    fill(layer.color[0], layer.color[1], layer.color[2], 20);
    rect(0, y - CONFIG.visual.layerHeight/2, width, CONFIG.visual.layerHeight);
    
    // 层标签
    fill(layer.color[0], layer.color[1], layer.color[2], 150);
    textSize(14);
    textAlign(LEFT, CENTER);
    text(layer.name, 20, y);
    
    // 层线
    stroke(layer.color[0], layer.color[1], layer.color[2], 50);
    strokeWeight(1);
    line(100, y, width - 20, y);
  }
}

function drawStats() {
  fill(255, 255, 255, 200);
  textSize(12);
  textAlign(RIGHT, TOP);
  text(`Success: ${successCount}`, width - 20, 20);
  text(`Failed: ${failCount}`, width - 20, 40);
  
  let rate = successCount + failCount > 0 
    ? (successCount / (successCount + failCount) * 100).toFixed(1) 
    : 0;
  text(`Rate: ${rate}%`, width - 20, 60);
}

function drawTitle() {
  fill(255, 255, 255, 230);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Commerce Stack", 20, 20);
  
  fill(255, 255, 255, 100);
  textSize(12);
  text("Payment → Identity → Reputation", 20, 50);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function mousePressed() {
  // 点击添加新粒子
  for (let i = 0; i < 5; i++) {
    let p = new Particle();
    p.x = mouseX + random(-30, 30);
    particles.push(p);
    if (particles.length > 150) {
      particles.shift();
    }
  }
}
