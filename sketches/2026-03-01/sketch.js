/**
 * Layered Networks - 分层网络
 * Daily Wonder | 2026-03-01
 * 
 * 可视化三层网络架构：
 * - 顶层（应用层）：用户可见的服务
 * - 中层（逻辑层）：处理和路由
 * - 底层（基础设施层）：核心数据通道
 * 
 * 数据包在节点间流动，穿越层级边界
 * 
 * 交互：
 * - 鼠标悬停：高亮节点及其连接
 * - 点击节点：从该节点发射数据包
 * - 'r' 键：重新生成网络
 * - 's' 键：保存截图
 */

// 网络配置
const LAYER_COUNT = 3;
const LAYER_NAMES = ['Infrastructure', 'Logic', 'Application'];
const NODES_PER_LAYER = [8, 12, 6];

// 层高度配置
let layerYPositions = [];

// 节点和连接
let nodes = [];
let connections = [];
let packets = [];

// 颜色主题
let colors = {
  bg: null,
  layers: [],
  packet: null,
  highlight: null
};

// 交互状态
let hoveredNode = null;
let time = 0;

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100, 100);
  
  // 定义颜色
  colors.bg = color(230, 40, 8);
  colors.layers = [
    color(260, 70, 70),  // 底层：紫色
    color(185, 80, 75),  // 中层：青色
    color(35, 85, 90)    // 顶层：橙色
  ];
  colors.packet = color(55, 90, 95);  // 数据包：金黄
  colors.highlight = color(0, 0, 100, 60);
  
  // 计算层位置
  let margin = 80;
  let usableHeight = height - margin * 2;
  for (let i = 0; i < LAYER_COUNT; i++) {
    // 底层在下，顶层在上
    layerYPositions[i] = height - margin - (i * usableHeight / (LAYER_COUNT - 1));
  }
  
  generateNetwork();
}

function generateNetwork() {
  nodes = [];
  connections = [];
  packets = [];
  
  // 生成每层的节点
  for (let layer = 0; layer < LAYER_COUNT; layer++) {
    let count = NODES_PER_LAYER[layer];
    let y = layerYPositions[layer];
    let margin = 60;
    let spacing = (width - margin * 2) / (count + 1);
    
    for (let i = 0; i < count; i++) {
      let x = margin + spacing * (i + 1);
      // 添加一些随机偏移
      x += random(-15, 15);
      let yOffset = random(-20, 20);
      
      nodes.push({
        x: x,
        y: y + yOffset,
        layer: layer,
        id: nodes.length,
        connections: [],
        size: map(layer, 0, 2, 12, 8),  // 底层节点更大
        pulsePhase: random(TWO_PI),
        activity: 0
      });
    }
  }
  
  // 生成层内连接
  for (let layer = 0; layer < LAYER_COUNT; layer++) {
    let layerNodes = nodes.filter(n => n.layer === layer);
    
    // 每个节点连接 1-3 个邻近节点
    for (let node of layerNodes) {
      let nearbyNodes = layerNodes
        .filter(n => n.id !== node.id)
        .sort((a, b) => dist(node.x, node.y, a.x, a.y) - dist(node.x, node.y, b.x, b.y))
        .slice(0, floor(random(1, 4)));
      
      for (let target of nearbyNodes) {
        if (!connectionExists(node.id, target.id)) {
          addConnection(node, target, 'horizontal');
        }
      }
    }
  }
  
  // 生成层间连接（垂直通道）
  for (let layer = 0; layer < LAYER_COUNT - 1; layer++) {
    let lowerNodes = nodes.filter(n => n.layer === layer);
    let upperNodes = nodes.filter(n => n.layer === layer + 1);
    
    // 每个上层节点连接 1-2 个下层节点
    for (let upper of upperNodes) {
      let targets = lowerNodes
        .sort((a, b) => abs(a.x - upper.x) - abs(b.x - upper.x))
        .slice(0, floor(random(1, 3)));
      
      for (let lower of targets) {
        addConnection(lower, upper, 'vertical');
      }
    }
  }
}

function connectionExists(id1, id2) {
  return connections.some(c => 
    (c.from.id === id1 && c.to.id === id2) ||
    (c.from.id === id2 && c.to.id === id1)
  );
}

function addConnection(from, to, type) {
  let conn = {
    from: from,
    to: to,
    type: type,
    id: connections.length
  };
  connections.push(conn);
  from.connections.push(conn);
  to.connections.push(conn);
}

function draw() {
  background(colors.bg);
  time += 0.016;
  
  // 更新悬停状态
  updateHover();
  
  // 绘制层背景
  drawLayerBackgrounds();
  
  // 绘制连接
  drawConnections();
  
  // 更新和绘制数据包
  updatePackets();
  drawPackets();
  
  // 绘制节点
  drawNodes();
  
  // 绘制层标签
  drawLayerLabels();
  
  // 绘制信息
  drawInfo();
  
  // 自动生成数据包
  if (frameCount % 30 === 0) {
    spawnRandomPacket();
  }
}

function drawLayerBackgrounds() {
  noStroke();
  
  for (let i = 0; i < LAYER_COUNT; i++) {
    let y = layerYPositions[i];
    let layerColor = colors.layers[i];
    
    // 层区域（半透明带）
    let bandHeight = 100;
    for (let j = 0; j < 20; j++) {
      let alpha = map(j, 0, 20, 15, 0);
      fill(hue(layerColor), saturation(layerColor), brightness(layerColor), alpha);
      rect(0, y - bandHeight/2 + j * 2.5, width, bandHeight - j * 5);
    }
  }
}

function drawConnections() {
  for (let conn of connections) {
    let isHighlighted = hoveredNode && 
      (conn.from.id === hoveredNode.id || conn.to.id === hoveredNode.id);
    
    let baseAlpha = isHighlighted ? 80 : 25;
    let weight = isHighlighted ? 2.5 : 1.2;
    
    if (conn.type === 'vertical') {
      // 垂直连接：渐变色
      drawGradientLine(conn.from, conn.to, baseAlpha, weight);
    } else {
      // 水平连接：单色
      let layerColor = colors.layers[conn.from.layer];
      stroke(hue(layerColor), saturation(layerColor) * 0.7, brightness(layerColor), baseAlpha);
      strokeWeight(weight);
      line(conn.from.x, conn.from.y, conn.to.x, conn.to.y);
    }
  }
}

function drawGradientLine(from, to, alpha, weight) {
  let steps = 20;
  strokeWeight(weight);
  
  for (let i = 0; i < steps; i++) {
    let t1 = i / steps;
    let t2 = (i + 1) / steps;
    
    let x1 = lerp(from.x, to.x, t1);
    let y1 = lerp(from.y, to.y, t1);
    let x2 = lerp(from.x, to.x, t2);
    let y2 = lerp(from.y, to.y, t2);
    
    let c1 = colors.layers[from.layer];
    let c2 = colors.layers[to.layer];
    let c = lerpColor(c1, c2, t1);
    
    stroke(hue(c), saturation(c) * 0.8, brightness(c), alpha);
    line(x1, y1, x2, y2);
  }
}

function drawNodes() {
  for (let node of nodes) {
    let layerColor = colors.layers[node.layer];
    let isHovered = hoveredNode && hoveredNode.id === node.id;
    let isConnected = hoveredNode && node.connections.some(c => 
      c.from.id === hoveredNode.id || c.to.id === hoveredNode.id
    );
    
    // 脉冲效果
    let pulse = sin(time * 2 + node.pulsePhase) * 0.3 + 1;
    let activityPulse = node.activity * 0.5;
    node.activity *= 0.95;  // 衰减活动
    
    let size = node.size * pulse + activityPulse * 10;
    
    // 节点光晕
    if (isHovered || isConnected || node.activity > 0.1) {
      let glowAlpha = isHovered ? 40 : (isConnected ? 25 : node.activity * 30);
      for (let r = size * 3; r > size; r -= 4) {
        let a = map(r, size, size * 3, glowAlpha, 0);
        fill(hue(layerColor), saturation(layerColor), brightness(layerColor), a);
        noStroke();
        circle(node.x, node.y, r);
      }
    }
    
    // 节点主体
    let bri = isHovered ? 100 : (isConnected ? 90 : 80);
    fill(hue(layerColor), saturation(layerColor), bri);
    noStroke();
    circle(node.x, node.y, size);
    
    // 节点核心（亮点）
    fill(hue(layerColor), saturation(layerColor) * 0.3, 100, 80);
    circle(node.x - size * 0.15, node.y - size * 0.15, size * 0.4);
  }
}

function drawPackets() {
  for (let packet of packets) {
    let progress = packet.progress;
    let from = packet.from;
    let to = packet.to;
    
    // 当前位置
    let x = lerp(from.x, to.x, progress);
    let y = lerp(from.y, to.y, progress);
    
    // 颜色混合（根据所在层）
    let currentLayer = packet.from.layer;
    if (packet.to.layer !== packet.from.layer) {
      currentLayer = progress < 0.5 ? packet.from.layer : packet.to.layer;
    }
    
    // 数据包光晕
    for (let r = 18; r > 4; r -= 3) {
      let a = map(r, 4, 18, 60, 0);
      fill(hue(colors.packet), saturation(colors.packet), brightness(colors.packet), a);
      noStroke();
      circle(x, y, r);
    }
    
    // 数据包核心
    fill(colors.packet);
    circle(x, y, 6);
    
    // 拖尾
    let tailLen = 5;
    for (let i = 1; i <= tailLen; i++) {
      let t = max(0, progress - i * 0.03);
      let tx = lerp(from.x, to.x, t);
      let ty = lerp(from.y, to.y, t);
      let a = map(i, 1, tailLen, 50, 10);
      let s = map(i, 1, tailLen, 4, 1);
      fill(hue(colors.packet), saturation(colors.packet) * 0.8, brightness(colors.packet), a);
      circle(tx, ty, s);
    }
  }
}

function updatePackets() {
  for (let i = packets.length - 1; i >= 0; i--) {
    let packet = packets[i];
    packet.progress += packet.speed;
    
    if (packet.progress >= 1) {
      // 到达目标
      packet.to.activity = 1;
      
      // 可能继续传播
      if (random() < 0.6 && packet.hops < 5) {
        let nextConnections = packet.to.connections.filter(c => 
          c.from.id !== packet.from.id && c.to.id !== packet.from.id
        );
        
        if (nextConnections.length > 0) {
          let nextConn = random(nextConnections);
          let nextTarget = nextConn.from.id === packet.to.id ? nextConn.to : nextConn.from;
          
          packets.push({
            from: packet.to,
            to: nextTarget,
            progress: 0,
            speed: random(0.015, 0.03),
            hops: packet.hops + 1
          });
        }
      }
      
      packets.splice(i, 1);
    }
  }
}

function spawnRandomPacket() {
  if (nodes.length === 0 || connections.length === 0) return;
  
  // 从随机节点开始
  let startNode = random(nodes);
  if (startNode.connections.length === 0) return;
  
  let conn = random(startNode.connections);
  let targetNode = conn.from.id === startNode.id ? conn.to : conn.from;
  
  startNode.activity = 1;
  
  packets.push({
    from: startNode,
    to: targetNode,
    progress: 0,
    speed: random(0.015, 0.03),
    hops: 0
  });
}

function spawnPacketFromNode(node) {
  if (node.connections.length === 0) return;
  
  node.activity = 1;
  
  // 向所有连接发送数据包
  for (let conn of node.connections) {
    let target = conn.from.id === node.id ? conn.to : conn.from;
    
    packets.push({
      from: node,
      to: target,
      progress: 0,
      speed: random(0.02, 0.04),
      hops: 0
    });
  }
}

function drawLayerLabels() {
  textFont('monospace');
  textSize(10);
  noStroke();
  
  for (let i = 0; i < LAYER_COUNT; i++) {
    let y = layerYPositions[i];
    let layerColor = colors.layers[i];
    
    // 层名称
    fill(hue(layerColor), saturation(layerColor) * 0.5, brightness(layerColor), 60);
    textAlign(LEFT, CENTER);
    text(LAYER_NAMES[i].toUpperCase(), 15, y);
    
    // 层级数字
    textAlign(RIGHT, CENTER);
    text('L' + i, width - 15, y);
  }
}

function drawInfo() {
  fill(220, 20, 60, 50);
  noStroke();
  textFont('monospace');
  textSize(11);
  textAlign(LEFT, TOP);
  text('LAYERED NETWORKS', 20, 20);
  text('Nodes: ' + nodes.length + '  Connections: ' + connections.length + '  Packets: ' + packets.length, 20, 35);
  
  textAlign(RIGHT, BOTTOM);
  fill(220, 20, 50, 40);
  text('[Click] Send packets  [R] Regenerate  [S] Save', width - 20, height - 20);
}

function updateHover() {
  hoveredNode = null;
  let minDist = 30;
  
  for (let node of nodes) {
    let d = dist(mouseX, mouseY, node.x, node.y);
    if (d < minDist) {
      minDist = d;
      hoveredNode = node;
    }
  }
  
  cursor(hoveredNode ? HAND : ARROW);
}

function mousePressed() {
  if (hoveredNode) {
    spawnPacketFromNode(hoveredNode);
  }
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    generateNetwork();
  }
  
  if (key === 's' || key === 'S') {
    saveCanvas('layered-networks-' + frameCount, 'png');
  }
}

function windowResized() {
  resizeCanvas(min(windowWidth - 40, 800), min(windowHeight - 40, 600));
  
  // 重新计算层位置
  let margin = 80;
  let usableHeight = height - margin * 2;
  for (let i = 0; i < LAYER_COUNT; i++) {
    layerYPositions[i] = height - margin - (i * usableHeight / (LAYER_COUNT - 1));
  }
  
  generateNetwork();
}
