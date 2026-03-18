/**
 * Signal & Noise — Daily Wonder Sketch 2026-03-18
 * 
 * 灵感来源：2024年互联网流量报告 — 51% 是机器人
 * 可视化人类声音与机器噪音的海洋
 * 
 * 在这片数字海洋中，真正的人类声音正在被淹没。
 * Small Web 的复兴提醒我们：authentic voice 比任何算法都珍贵。
 * 鼠标移动时，会为附近的人类粒子"放大"它们的声音。
 */

// ═══════════════════════════════════════════════════════════════════════════
// 配置参数
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // 粒子比例（基于真实数据：51% 机器人）
  totalParticles: 300,
  botRatio: 0.51,
  
  // 物理参数
  baseSpeed: 0.8,
  noiseScale: 0.003,
  
  // 人类粒子特性
  human: {
    size: { min: 4, max: 10 },
    hues: [15, 35, 45, 320, 340],  // 暖色调：橙、金、琥珀、玫瑰
    saturation: { min: 60, max: 90 },
    brightness: { min: 70, max: 100 },
    speedVariation: 0.5,  // 移动不规则
    pulseSpeed: 0.05,
    trailLength: 8,
  },
  
  // 机器粒子特性
  bot: {
    size: { min: 2, max: 5 },
    hues: [200, 210, 220, 230],  // 冷色调：蓝灰
    saturation: { min: 20, max: 40 },
    brightness: { min: 30, max: 50 },
    speedVariation: 0.1,  // 移动整齐
    gridSnap: 0.7,        // 倾向于网格化运动
    clusterStrength: 0.02,
  },
  
  // 交互
  mouseInfluenceRadius: 150,
  amplifyStrength: 3,
  
  // 视觉
  backgroundColor: [225, 15, 8],  // 深蓝黑色
  fadeAlpha: 25,
};

// ═══════════════════════════════════════════════════════════════════════════
// 粒子类
// ═══════════════════════════════════════════════════════════════════════════

class Particle {
  constructor(isHuman) {
    this.isHuman = isHuman;
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0);
    
    // 基于类型设置属性
    if (isHuman) {
      this.setupHuman();
    } else {
      this.setupBot();
    }
    
    // 共有属性
    this.phase = random(TWO_PI);
    this.noiseOffset = random(1000);
    this.trail = [];
    this.amplified = 0;  // 被鼠标放大的程度
  }
  
  setupHuman() {
    const c = CONFIG.human;
    this.baseSize = random(c.size.min, c.size.max);
    this.hue = random(c.hues);
    this.saturation = random(c.saturation.min, c.saturation.max);
    this.brightness = random(c.brightness.min, c.brightness.max);
    this.speedMult = random(0.5, 1.5);  // 速度个性化
    this.wanderStrength = random(0.5, 1.5);
  }
  
  setupBot() {
    const c = CONFIG.bot;
    this.baseSize = random(c.size.min, c.size.max);
    this.hue = random(c.hues);
    this.saturation = random(c.saturation.min, c.saturation.max);
    this.brightness = random(c.brightness.min, c.brightness.max);
    this.speedMult = 1;  // 速度一致
    this.gridPhase = random(TWO_PI);
    this.targetAngle = random(TWO_PI);
    this.angleChangeTimer = floor(random(60, 180));
  }
  
  update(mousePos) {
    this.phase += this.isHuman ? CONFIG.human.pulseSpeed : 0.02;
    
    // 更新放大效果
    if (mousePos) {
      const d = p5.Vector.dist(this.pos, mousePos);
      if (d < CONFIG.mouseInfluenceRadius && this.isHuman) {
        const influence = 1 - (d / CONFIG.mouseInfluenceRadius);
        this.amplified = lerp(this.amplified, influence * CONFIG.amplifyStrength, 0.1);
      } else {
        this.amplified *= 0.95;
      }
    }
    
    // 运动行为
    if (this.isHuman) {
      this.updateHuman();
    } else {
      this.updateBot();
    }
    
    // 应用速度
    this.vel.limit(CONFIG.baseSpeed * 3);
    this.pos.add(this.vel);
    
    // 边界处理
    this.wrapEdges();
    
    // 记录轨迹（只有人类有明显轨迹）
    if (this.isHuman) {
      this.trail.push(this.pos.copy());
      if (this.trail.length > CONFIG.human.trailLength) {
        this.trail.shift();
      }
    }
  }
  
  updateHuman() {
    // 有机的、Perlin噪声驱动的运动
    const n = noise(
      this.pos.x * CONFIG.noiseScale,
      this.pos.y * CONFIG.noiseScale,
      frameCount * 0.005 + this.noiseOffset
    );
    const angle = n * TWO_PI * 4;
    
    // 基础力
    const force = p5.Vector.fromAngle(angle);
    force.mult(CONFIG.baseSpeed * this.speedMult * CONFIG.human.speedVariation);
    
    // 随机漫步叠加
    const wander = p5.Vector.fromAngle(this.phase * 2);
    wander.mult(0.2 * this.wanderStrength);
    
    this.vel.add(force);
    this.vel.add(wander);
    this.vel.mult(0.92);  // 阻尼
  }
  
  updateBot() {
    // 机械的、网格化的运动
    this.angleChangeTimer--;
    if (this.angleChangeTimer <= 0) {
      // 倾向于直角转向
      const snapAngles = [0, HALF_PI, PI, PI + HALF_PI];
      if (random() < CONFIG.bot.gridSnap) {
        this.targetAngle = random(snapAngles);
      } else {
        this.targetAngle += random(-0.5, 0.5);
      }
      this.angleChangeTimer = floor(random(60, 180));
    }
    
    // 平滑转向
    const currentAngle = this.vel.heading();
    const angleDiff = this.targetAngle - currentAngle;
    const newAngle = currentAngle + angleDiff * 0.05;
    
    this.vel = p5.Vector.fromAngle(newAngle);
    this.vel.mult(CONFIG.baseSpeed * this.speedMult);
    
    // 集群倾向
    this.vel.y += sin(frameCount * 0.01 + this.gridPhase) * CONFIG.bot.clusterStrength;
  }
  
  wrapEdges() {
    if (this.pos.x < -20) this.pos.x = width + 20;
    if (this.pos.x > width + 20) this.pos.x = -20;
    if (this.pos.y < -20) this.pos.y = height + 20;
    if (this.pos.y > height + 20) this.pos.y = -20;
  }
  
  draw() {
    const amplifyBoost = 1 + this.amplified;
    const pulse = 1 + sin(this.phase) * 0.2;
    const size = this.baseSize * pulse * amplifyBoost;
    
    if (this.isHuman) {
      this.drawHuman(size, amplifyBoost);
    } else {
      this.drawBot(size);
    }
  }
  
  drawHuman(size, amplifyBoost) {
    // 绘制轨迹
    if (this.trail.length > 1) {
      noFill();
      for (let i = 0; i < this.trail.length - 1; i++) {
        const alpha = map(i, 0, this.trail.length - 1, 0, 80 * amplifyBoost);
        const weight = map(i, 0, this.trail.length - 1, 0.5, size * 0.5);
        stroke(this.hue, this.saturation * 0.7, this.brightness, alpha);
        strokeWeight(weight);
        line(this.trail[i].x, this.trail[i].y, this.trail[i+1].x, this.trail[i+1].y);
      }
    }
    
    // 外发光（放大时更强）
    noStroke();
    const glowLayers = 3 + floor(this.amplified * 2);
    for (let i = glowLayers; i >= 0; i--) {
      const layerRatio = i / glowLayers;
      const layerSize = size * (1 + layerRatio * (1 + this.amplified));
      const alpha = (1 - layerRatio) * (100 + this.amplified * 100);
      fill(this.hue, this.saturation * (1 - layerRatio * 0.5), this.brightness, alpha);
      ellipse(this.pos.x, this.pos.y, layerSize * 2, layerSize * 2);
    }
    
    // 核心
    fill(this.hue, this.saturation * 0.5, 100);
    ellipse(this.pos.x, this.pos.y, size, size);
    
    // 放大时的额外效果：声波环
    if (this.amplified > 0.3) {
      noFill();
      stroke(this.hue, this.saturation * 0.5, 100, this.amplified * 100);
      strokeWeight(1);
      const ringSize = size * (3 + sin(this.phase * 3) * 0.5) * this.amplified;
      ellipse(this.pos.x, this.pos.y, ringSize, ringSize);
    }
  }
  
  drawBot(size) {
    // 简单的方形（机械感）
    noStroke();
    
    // 微弱发光
    fill(this.hue, this.saturation * 0.5, this.brightness * 0.5, 50);
    rectMode(CENTER);
    rect(this.pos.x, this.pos.y, size * 2.5, size * 2.5);
    
    // 核心（方形）
    fill(this.hue, this.saturation, this.brightness);
    const rotAngle = this.vel.heading();
    push();
    translate(this.pos.x, this.pos.y);
    rotate(rotAngle);
    rect(0, 0, size, size);
    pop();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════════════════════════════════════

let particles = [];
let humanCount = 0;
let botCount = 0;

// ═══════════════════════════════════════════════════════════════════════════
// p5.js 生命周期
// ═══════════════════════════════════════════════════════════════════════════

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  
  // 创建粒子
  const numBots = floor(CONFIG.totalParticles * CONFIG.botRatio);
  const numHumans = CONFIG.totalParticles - numBots;
  
  // 先添加机器人
  for (let i = 0; i < numBots; i++) {
    particles.push(new Particle(false));
    botCount++;
  }
  
  // 再添加人类
  for (let i = 0; i < numHumans; i++) {
    particles.push(new Particle(true));
    humanCount++;
  }
  
  // 打乱顺序
  shuffle(particles, true);
}

function draw() {
  // 半透明背景产生轨迹效果
  noStroke();
  fill(CONFIG.backgroundColor[0], CONFIG.backgroundColor[1], CONFIG.backgroundColor[2], CONFIG.fadeAlpha);
  rect(0, 0, width, height);
  
  // 获取鼠标位置
  const mousePos = createVector(mouseX, mouseY);
  
  // 更新和绘制粒子
  for (const p of particles) {
    p.update(mousePos);
  }
  
  // 先绘制机器人（在下层）
  for (const p of particles) {
    if (!p.isHuman) p.draw();
  }
  
  // 再绘制人类（在上层）
  for (const p of particles) {
    if (p.isHuman) p.draw();
  }
  
  // 鼠标影响范围可视化
  drawMouseInfluence(mousePos);
  
  // UI
  drawStats();
  drawTitle();
}

function drawMouseInfluence(mousePos) {
  if (mouseX > 0 && mouseY > 0 && mouseX < width && mouseY < height) {
    // 柔和的圆形范围指示
    noFill();
    const pulseSize = CONFIG.mouseInfluenceRadius * (1 + sin(frameCount * 0.05) * 0.1);
    
    // 外环
    stroke(45, 50, 70, 30);
    strokeWeight(2);
    ellipse(mousePos.x, mousePos.y, pulseSize * 2, pulseSize * 2);
    
    // 内环
    stroke(45, 40, 80, 20);
    strokeWeight(1);
    ellipse(mousePos.x, mousePos.y, pulseSize * 1.5, pulseSize * 1.5);
    
    // 中心点
    fill(45, 30, 100, 150);
    noStroke();
    ellipse(mousePos.x, mousePos.y, 6, 6);
  }
}

function drawStats() {
  const margin = 20;
  const barWidth = 200;
  const barHeight = 8;
  
  // 背景面板
  fill(225, 20, 15, 200);
  noStroke();
  rect(margin, margin, barWidth + 20, 80, 8);
  
  // 比例条
  const botWidth = barWidth * CONFIG.botRatio;
  const humanWidth = barWidth - botWidth;
  
  // 机器人部分
  fill(215, 30, 40);
  rect(margin + 10, margin + 30, botWidth, barHeight, 4, 0, 0, 4);
  
  // 人类部分
  fill(35, 70, 85);
  rect(margin + 10 + botWidth, margin + 30, humanWidth, barHeight, 0, 4, 4, 0);
  
  // 数字标签
  fill(215, 20, 60);
  textSize(12);
  textAlign(LEFT, CENTER);
  text(`${floor(CONFIG.botRatio * 100)}%`, margin + 10, margin + 50);
  text('Bots', margin + 10, margin + 65);
  
  fill(35, 50, 90);
  textAlign(RIGHT, CENTER);
  text(`${floor((1 - CONFIG.botRatio) * 100)}%`, margin + 10 + barWidth, margin + 50);
  text('Humans', margin + 10 + barWidth, margin + 65);
  
  // 标题
  fill(0, 0, 80);
  textSize(11);
  textAlign(LEFT, TOP);
  text('Internet Traffic 2024', margin + 10, margin + 10);
}

function drawTitle() {
  // 右下角标题
  fill(225, 20, 50);
  noStroke();
  textSize(11);
  textAlign(RIGHT, BOTTOM);
  text('Signal & Noise — 2026.03.18', width - 20, height - 35);
  
  // 交互提示
  fill(225, 15, 40);
  textSize(10);
  text('Move mouse to amplify human voices', width - 20, height - 20);
}

// ═══════════════════════════════════════════════════════════════════════════
// 交互
// ═══════════════════════════════════════════════════════════════════════════

function keyPressed() {
  if (key === ' ') {
    // 空格：重新排列
    for (const p of particles) {
      p.pos = createVector(random(width), random(height));
      p.vel.mult(0);
    }
  }
  
  if (key === 'h' || key === 'H') {
    // H：只显示人类
    for (const p of particles) {
      if (!p.isHuman) {
        p.brightness = p.brightness === 0 ? random(30, 50) : 0;
      }
    }
  }
  
  if (key === 'r' || key === 'R') {
    // R：重置
    setup();
  }
}

function mousePressed() {
  // 点击位置产生一个新的人类粒子
  if (humanCount < CONFIG.totalParticles * 0.6) {
    const newHuman = new Particle(true);
    newHuman.pos = createVector(mouseX, mouseY);
    newHuman.amplified = 2;
    particles.push(newHuman);
    humanCount++;
    
    // 移除一个机器人以保持平衡
    for (let i = particles.length - 1; i >= 0; i--) {
      if (!particles[i].isHuman) {
        particles.splice(i, 1);
        botCount--;
        break;
      }
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ═══════════════════════════════════════════════════════════════════════════
// 结语
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Signal & Noise（信号与噪音）
 * 
 * 2024年的报告显示，互联网流量中有51%来自机器人。
 * 我们以为自己在和人交流，但一半的"存在"都是自动化的脚本。
 * 
 * 这个作品可视化了这种不平衡：
 * - 方形、冷色、规则运动的是"机器人"——爬虫、脚本、自动化系统
 * - 圆形、暖色、有机运动的是"人类"——真实的声音、authentic的存在
 * 
 * 当你移动鼠标，附近的人类粒子会"放大"——
 * 就像在 Small Web 中，当你关注一个独立博客、一个个人网站时，
 * 那个真实的声音就会更清晰、更明亮。
 * 
 * 点击可以"创造"新的人类声音，但总数有限。
 * 就像真正的 authentic voice，每一个都是珍贵的。
 * 
 * Small Web 的复兴不是技术的倒退，
 * 而是对人性化互联网的重新追求。
 * 在算法和机器人的海洋中，
 * 寻找那些真实的、温暖的光点。
 */
