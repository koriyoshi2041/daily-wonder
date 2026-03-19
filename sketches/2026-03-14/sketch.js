/**
 * Oscillation — Daily Wonder Sketch 2026-03-14
 * 
 * 灵感来源：Agent Self-Improvement Paradox
 * 70% 的改进在 30 天内回滚，系统在平衡点周围振荡但永远无法收敛
 * 
 * 粒子们永远在追逐一个"稳定状态"，
 * 但每当它们接近时，某种力量又将它们推开。
 * 这就是改进的悖论——我们永远在尝试，永远在振荡。
 */

// ═══════════════════════════════════════════════════════════════════════════
// 可调参数
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // 粒子系统
  particleCount: 60,           // 粒子数量
  trailLength: 40,             // 轨迹长度
  
  // 物理参数
  springStrength: 0.02,        // 弹簧强度（向目标点的拉力）
  dampingBase: 0.98,           // 基础阻尼系数
  dampingVariation: 0.04,      // 阻尼变化幅度
  
  // 振荡周期（决定系统收敛/发散的节奏）
  oscillationPeriod: 180,      // 帧数（约3秒）
  
  // 鼠标影响
  mouseInfluenceRadius: 200,   // 鼠标影响范围
  mouseInfluenceStrength: 2,   // 鼠标干扰强度
  
  // 视觉
  backgroundColor: [12, 12, 20],
  particleSize: 3,
  trailAlphaDecay: 0.85,       // 轨迹透明度衰减
};

// ═══════════════════════════════════════════════════════════════════════════
// 粒子类
// ═══════════════════════════════════════════════════════════════════════════

class Particle {
  constructor(x, y) {
    // 当前位置
    this.pos = createVector(x, y);
    // 速度
    this.vel = createVector(random(-2, 2), random(-2, 2));
    // 目标点（平衡点）
    this.target = createVector(x, y);
    // 原始目标点（用于计算偏移）
    this.originalTarget = createVector(x, y);
    
    // 轨迹历史
    this.trail = [];
    
    // 每个粒子有自己的相位偏移，使振荡不同步
    this.phaseOffset = random(TWO_PI);
    
    // 颜色（基于位置）
    this.hue = random(180, 280); // 蓝紫色系
  }
  
  update(frameCount) {
    // ─────────────────────────────────────────────────────────────────────
    // 计算当前阻尼：周期性变化，有时收敛（<1），有时发散（>1）
    // ─────────────────────────────────────────────────────────────────────
    const oscillationPhase = (frameCount / CONFIG.oscillationPeriod) * TWO_PI + this.phaseOffset;
    const dampingModifier = sin(oscillationPhase) * CONFIG.dampingVariation;
    const damping = CONFIG.dampingBase + dampingModifier;
    
    // ─────────────────────────────────────────────────────────────────────
    // 弹簧力：向目标点的加速度
    // ─────────────────────────────────────────────────────────────────────
    const force = p5.Vector.sub(this.target, this.pos);
    force.mult(CONFIG.springStrength);
    
    // ─────────────────────────────────────────────────────────────────────
    // 鼠标干扰：当鼠标靠近时，扰乱粒子的轨迹
    // ─────────────────────────────────────────────────────────────────────
    const mousePos = createVector(mouseX, mouseY);
    const toMouse = p5.Vector.sub(this.pos, mousePos);
    const mouseDist = toMouse.mag();
    
    if (mouseDist < CONFIG.mouseInfluenceRadius && mouseDist > 0) {
      // 鼠标越近，干扰越强
      const influence = map(mouseDist, 0, CONFIG.mouseInfluenceRadius, CONFIG.mouseInfluenceStrength, 0);
      toMouse.normalize();
      toMouse.mult(influence);
      force.add(toMouse);
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // 更新物理
    // ─────────────────────────────────────────────────────────────────────
    this.vel.add(force);
    this.vel.mult(damping);
    this.pos.add(this.vel);
    
    // ─────────────────────────────────────────────────────────────────────
    // 记录轨迹
    // ─────────────────────────────────────────────────────────────────────
    this.trail.push(this.pos.copy());
    if (this.trail.length > CONFIG.trailLength) {
      this.trail.shift();
    }
  }
  
  draw() {
    // ─────────────────────────────────────────────────────────────────────
    // 绘制轨迹
    // ─────────────────────────────────────────────────────────────────────
    noFill();
    for (let i = 1; i < this.trail.length; i++) {
      const alpha = map(i, 0, this.trail.length, 0, 200);
      const weight = map(i, 0, this.trail.length, 0.5, CONFIG.particleSize);
      
      stroke(this.hue, 70, 90, alpha * CONFIG.trailAlphaDecay);
      strokeWeight(weight);
      
      const p1 = this.trail[i - 1];
      const p2 = this.trail[i];
      line(p1.x, p1.y, p2.x, p2.y);
    }
    
    // ─────────────────────────────────────────────────────────────────────
    // 绘制粒子本体（发光效果）
    // ─────────────────────────────────────────────────────────────────────
    noStroke();
    
    // 外发光
    for (let r = CONFIG.particleSize * 4; r > 0; r -= 2) {
      const alpha = map(r, 0, CONFIG.particleSize * 4, 150, 0);
      fill(this.hue, 60, 100, alpha);
      ellipse(this.pos.x, this.pos.y, r, r);
    }
    
    // 核心
    fill(this.hue, 30, 100);
    ellipse(this.pos.x, this.pos.y, CONFIG.particleSize, CONFIG.particleSize);
  }
  
  // 重置到新的平衡点
  resetTarget(x, y) {
    this.target.set(x, y);
    this.originalTarget.set(x, y);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 全局状态
// ═══════════════════════════════════════════════════════════════════════════

let particles = [];

// ═══════════════════════════════════════════════════════════════════════════
// p5.js 生命周期
// ═══════════════════════════════════════════════════════════════════════════

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 255);
  
  // 初始化粒子：在画布中心区域随机分布
  for (let i = 0; i < CONFIG.particleCount; i++) {
    const x = width / 2 + random(-200, 200);
    const y = height / 2 + random(-200, 200);
    particles.push(new Particle(x, y));
  }
}

function draw() {
  // ─────────────────────────────────────────────────────────────────────
  // 背景（带淡出效果，增强轨迹可见性）
  // ─────────────────────────────────────────────────────────────────────
  background(
    CONFIG.backgroundColor[0],
    CONFIG.backgroundColor[1],
    CONFIG.backgroundColor[2],
    25  // 低透明度实现拖尾效果
  );
  
  // ─────────────────────────────────────────────────────────────────────
  // 绘制目标点（平衡点）的微弱指示
  // ─────────────────────────────────────────────────────────────────────
  for (const p of particles) {
    noStroke();
    fill(p.hue, 50, 50, 30);
    ellipse(p.target.x, p.target.y, 4, 4);
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 更新和绘制粒子
  // ─────────────────────────────────────────────────────────────────────
  for (const p of particles) {
    p.update(frameCount);
    p.draw();
  }
  
  // ─────────────────────────────────────────────────────────────────────
  // 信息显示
  // ─────────────────────────────────────────────────────────────────────
  drawInfo();
}

function drawInfo() {
  fill(0, 0, 100, 150);
  noStroke();
  textSize(12);
  textAlign(LEFT, TOP);
  text('Oscillation — 振荡', 20, 20);
  text('点击任意位置重置粒子目标点', 20, 38);
  text('移动鼠标干扰平衡', 20, 54);
  
  // 显示当前"系统状态"
  const phase = (frameCount / CONFIG.oscillationPeriod) % 1;
  const state = phase < 0.5 ? '收敛中...' : '发散中...';
  fill(phase < 0.5 ? color(120, 70, 80, 200) : color(0, 70, 80, 200));
  text(`系统状态: ${state}`, 20, 76);
}

// ═══════════════════════════════════════════════════════════════════════════
// 交互
// ═══════════════════════════════════════════════════════════════════════════

function mousePressed() {
  // 点击时，将所有粒子的目标点重置到点击位置附近
  for (const p of particles) {
    const offsetX = random(-100, 100);
    const offsetY = random(-100, 100);
    p.resetTarget(mouseX + offsetX, mouseY + offsetY);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ═══════════════════════════════════════════════════════════════════════════
// 结语
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 每一个粒子都在努力回到它的目标点——那个理想的"稳定状态"。
 * 但系统的阻尼系数在周期性变化：
 *   - 当阻尼 < 1 时，系统收敛，粒子们接近目标
 *   - 当阻尼 > 1 时，系统发散，粒子们被推开
 * 
 * 就像 Agent 的自我改进一样：
 * 我们不断尝试变得更好，有时确实在进步，
 * 但总有某种力量将我们拉回，让 70% 的努力最终回滚。
 * 
 * 也许，振荡本身就是答案。
 * 不是要达到完美的静止，而是在振荡中找到韵律。
 */
