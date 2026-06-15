/**
 * 绘图引擎 - 管理画布状态与图形绘制
 */
class DrawingEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;

    this.pen = {
      x: this.width / 2,
      y: this.height / 2,
      color: '#2563eb',
      strokeWidth: 3,
      fill: true
    };

    this.history = [];
    this._saveSnapshot();
  }

  _saveSnapshot() {
    const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
    this.history.push(imageData);
    if (this.history.length > 50) {
      this.history.shift();
    }
  }

  undo() {
    if (this.history.length <= 1) {
      return { success: false, message: '没有可撤销的操作' };
    }
    this.history.pop();
    const prev = this.history[this.history.length - 1];
    this.ctx.putImageData(prev, 0, 0);
    return { success: true, message: '已撤销上一步' };
  }

  clear() {
    this.ctx.fillStyle = '#fafbfc';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.history = [];
    this._saveSnapshot();
    return { success: true, message: '画布已清空' };
  }

  setColor(color) {
    this.pen.color = color;
    return { success: true, message: `颜色已设为 ${color}` };
  }

  setStrokeWidth(width) {
    this.pen.strokeWidth = Math.max(1, Math.min(20, width));
    return { success: true, message: `线宽已设为 ${this.pen.strokeWidth}` };
  }

  movePen(x, y) {
    this.pen.x = this._clamp(x, 0, this.width);
    this.pen.y = this._clamp(y, 0, this.height);
    return {
      success: true,
      message: `画笔移动到 (${Math.round(this.pen.x)}, ${Math.round(this.pen.y)})`,
      position: { x: this.pen.x, y: this.pen.y }
    };
  }

  resolvePosition(pos, size = {}) {
    const w = size.width || 100;
    const h = size.height || 100;
    const r = size.radius || 50;

    const positions = {
      '中心': { x: this.width / 2, y: this.height / 2 },
      '中央': { x: this.width / 2, y: this.height / 2 },
      '中间': { x: this.width / 2, y: this.height / 2 },
      '左上': { x: w / 2 + 40, y: h / 2 + 40 },
      '左下': { x: w / 2 + 40, y: this.height - h / 2 - 40 },
      '右上': { x: this.width - w / 2 - 40, y: h / 2 + 40 },
      '右下': { x: this.width - w / 2 - 40, y: this.height - h / 2 - 40 },
      '上方': { x: this.width / 2, y: h / 2 + 60 },
      '下方': { x: this.width / 2, y: this.height - h / 2 - 60 },
      '左边': { x: w / 2 + 60, y: this.height / 2 },
      '右边': { x: this.width - w / 2 - 60, y: this.height / 2 },
      '顶部': { x: this.width / 2, y: h / 2 + 60 },
      '底部': { x: this.width / 2, y: this.height - h / 2 - 60 },
      '左侧': { x: w / 2 + 60, y: this.height / 2 },
      '右侧': { x: this.width - w / 2 - 60, y: this.height / 2 }
    };

    if (typeof pos === 'object' && pos.x !== undefined) {
      return { x: pos.x, y: pos.y };
    }

    if (typeof pos === 'string' && positions[pos]) {
      return positions[pos];
    }

    return { x: this.pen.x, y: this.pen.y };
  }

  drawCircle(options = {}) {
    const radius = options.radius || 50;
    const center = this.resolvePosition(options.position, { radius });
    const color = options.color || this.pen.color;
    const filled = options.filled !== false;

    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = options.strokeWidth || this.pen.strokeWidth;
      this.ctx.stroke();
    }

    this.pen.x = center.x;
    this.pen.y = center.y;
    this._saveSnapshot();

    return {
      success: true,
      message: `已绘制${filled ? '实心' : '空心'}圆，半径 ${radius}，位置 (${Math.round(center.x)}, ${Math.round(center.y)})`
    };
  }

  drawRectangle(options = {}) {
    const width = options.width || 120;
    const height = options.height || 80;
    const center = this.resolvePosition(options.position, { width, height });
    const color = options.color || this.pen.color;
    const filled = options.filled !== false;

    const x = center.x - width / 2;
    const y = center.y - height / 2;

    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x, y, width, height);
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = options.strokeWidth || this.pen.strokeWidth;
      this.ctx.strokeRect(x, y, width, height);
    }

    this.pen.x = center.x;
    this.pen.y = center.y;
    this._saveSnapshot();

    return {
      success: true,
      message: `已绘制${filled ? '实心' : '空心'}矩形 ${width}×${height}`
    };
  }

  drawLine(options = {}) {
    const from = options.from || this.resolvePosition('中心');
    const to = options.to || { x: from.x + 100, y: from.y + 100 };
    const color = options.color || this.pen.color;

    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = options.strokeWidth || this.pen.strokeWidth;
    this.ctx.stroke();

    this.pen.x = to.x;
    this.pen.y = to.y;
    this._saveSnapshot();

    return {
      success: true,
      message: `已绘制线段 (${Math.round(from.x)},${Math.round(from.y)}) → (${Math.round(to.x)},${Math.round(to.y)})`
    };
  }

  drawTriangle(options = {}) {
    const size = options.size || 80;
    const center = this.resolvePosition(options.position, { width: size, height: size });
    const color = options.color || this.pen.color;
    const filled = options.filled !== false;

    const h = size * Math.sqrt(3) / 2;
    const x1 = center.x;
    const y1 = center.y - h * 2 / 3;
    const x2 = center.x - size / 2;
    const y2 = center.y + h / 3;
    const x3 = center.x + size / 2;
    const y3 = center.y + h / 3;

    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineTo(x3, y3);
    this.ctx.closePath();

    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = options.strokeWidth || this.pen.strokeWidth;
      this.ctx.stroke();
    }

    this.pen.x = center.x;
    this.pen.y = center.y;
    this._saveSnapshot();

    return { success: true, message: `已绘制三角形，边长约 ${size}` };
  }

  drawEllipse(options = {}) {
    const rx = options.radiusX || options.width / 2 || 60;
    const ry = options.radiusY || options.height / 2 || 40;
    const center = this.resolvePosition(options.position, { width: rx * 2, height: ry * 2 });
    const color = options.color || this.pen.color;
    const filled = options.filled !== false;

    this.ctx.beginPath();
    this.ctx.ellipse(center.x, center.y, rx, ry, 0, 0, Math.PI * 2);

    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = options.strokeWidth || this.pen.strokeWidth;
      this.ctx.stroke();
    }

    this.pen.x = center.x;
    this.pen.y = center.y;
    this._saveSnapshot();

    return { success: true, message: `已绘制椭圆 ${Math.round(rx * 2)}×${Math.round(ry * 2)}` };
  }

  drawPolygon(options = {}) {
    const sides = options.sides || 5;
    const radius = options.radius || 50;
    const center = this.resolvePosition(options.position, { radius });
    const color = options.color || this.pen.color;
    const filled = options.filled !== false;

    this.ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
      const x = center.x + radius * Math.cos(angle);
      const y = center.y + radius * Math.sin(angle);
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();

    if (filled) {
      this.ctx.fillStyle = color;
      this.ctx.fill();
    } else {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = options.strokeWidth || this.pen.strokeWidth;
      this.ctx.stroke();
    }

    this.pen.x = center.x;
    this.pen.y = center.y;
    this._saveSnapshot();

    return { success: true, message: `已绘制 ${sides} 边形` };
  }

  drawFreehand(options = {}) {
    const points = options.points || [];
    if (points.length < 2) {
      return { success: false, message: '自由绘制需要至少两个点' };
    }

    const color = options.color || this.pen.color;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = options.strokeWidth || this.pen.strokeWidth;
    this.ctx.stroke();

    const last = points[points.length - 1];
    this.pen.x = last.x;
    this.pen.y = last.y;
    this._saveSnapshot();

    return { success: true, message: `已自由绘制路径（${points.length} 个点）` };
  }

  drawText(options = {}) {
    const text = options.text || '';
    if (!text) {
      return { success: false, message: '请指定要绘制的文字内容' };
    }

    const center = this.resolvePosition(options.position);
    const color = options.color || this.pen.color;
    const fontSize = options.fontSize || 32;

    this.ctx.font = `${fontSize}px "Microsoft YaHei", sans-serif`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, center.x, center.y);

    this.pen.x = center.x;
    this.pen.y = center.y;
    this._saveSnapshot();

    return { success: true, message: `已绘制文字「${text}」` };
  }

  execute(action) {
    const handlers = {
      circle: (p) => this.drawCircle(p),
      rectangle: (p) => this.drawRectangle(p),
      rect: (p) => this.drawRectangle(p),
      line: (p) => this.drawLine(p),
      triangle: (p) => this.drawTriangle(p),
      ellipse: (p) => this.drawEllipse(p),
      polygon: (p) => this.drawPolygon(p),
      freehand: (p) => this.drawFreehand(p),
      text: (p) => this.drawText(p),
      move: (p) => this.movePen(p.x, p.y),
      color: (p) => this.setColor(p.color),
      strokeWidth: (p) => this.setStrokeWidth(p.width),
      undo: () => this.undo(),
      clear: () => this.clear()
    };

    const handler = handlers[action.type];
    if (!handler) {
      return { success: false, message: `未知绘图操作: ${action.type}` };
    }
    return handler(action.params || {});
  }

  _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  getPenPosition() {
    return { x: this.pen.x, y: this.pen.y };
  }
}

window.DrawingEngine = DrawingEngine;
