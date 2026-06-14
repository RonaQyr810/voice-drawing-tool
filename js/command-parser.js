/**
 * 命令解析器 - 将自然语言语音文本解析为绘图操作序列
 * 支持同义词、模糊匹配、复合指令拆解
 */
class CommandParser {
  constructor() {
    this.colorMap = {
      '红': '#ef4444', '红色': '#ef4444', '赤': '#ef4444',
      '蓝': '#2563eb', '蓝色': '#2563eb', '兰': '#2563eb',
      '绿': '#22c55e', '绿色': '#22c55e', 'lv': '#22c55e',
      '黄': '#eab308', '黄色': '#eab308',
      '黑': '#1f2937', '黑色': '#1f2937',
      '白': '#f8fafc', '白色': '#f8fafc',
      '紫': '#a855f7', '紫色': '#a855f7',
      '橙': '#f97316', '橙色': '#f97316',
      '粉': '#ec4899', '粉色': '#ec4899',
      '灰': '#6b7280', '灰色': '#6b7280',
      '青': '#06b6d4', '青色': '#06b6d4', 'cyan': '#06b6d4'
    };

    this.shapeKeywords = {
      circle: ['圆', '圆形', '圆圈', '圆儿'],
      rectangle: ['矩形', '长方形', '方块', '正方形', '方形'],
      line: ['线', '直线', '线段', '线条'],
      triangle: ['三角形', '三角'],
      ellipse: ['椭圆', '椭圆形'],
      polygon: ['多边形', '五角形', '五角星', '星形', '六边形', '五边形'],
      text: ['文字', '文本', '字']
    };

    this.positionKeywords = [
      '中心', '中央', '中间', '左上', '左下', '右上', '右下',
      '上方', '下方', '左边', '右边', '顶部', '底部', '左侧', '右侧'
    ];

    this.controlCommands = {
      start: ['开始监听', '开始', '启动', '开始录音', '开始识别', '打开麦克风'],
      stop: ['停止监听', '停止', '暂停', '关闭麦克风', '结束监听'],
      undo: ['撤销', '撤回', '上一步', '取消上一步'],
      clear: ['清空', '清除', '清空画布', '清除画布', '全部删除', '重置画布'],
      help: ['帮助', '指令帮助', '怎么用', '使用说明']
    };
  }

  normalize(text) {
    return text
      .replace(/[，。！？、；：""''（）\s]+/g, '')
      .replace(/画(一个|个|一只|一条|一幅)?/g, '画')
      .replace(/帮我/g, '')
      .replace(/请/g, '')
      .toLowerCase();
  }

  parse(text) {
    const raw = text.trim();
    if (!raw) {
      return { type: 'unknown', message: '未识别到有效语音' };
    }

    const normalized = this.normalize(raw);

    const control = this._parseControl(normalized, raw);
    if (control) return control;

    if (this._isCompound(normalized)) {
      return this._parseCompound(normalized, raw);
    }

    const actions = this._parseDrawActions(normalized, raw);
    if (actions.length > 0) {
      return { type: 'draw', actions };
    }

    return {
      type: 'unknown',
      message: `无法理解指令「${raw}」，请尝试说「画一个红色的圆」或「帮助」`
    };
  }

  _parseControl(normalized, raw) {
    for (const [cmd, keywords] of Object.entries(this.controlCommands)) {
      if (keywords.some(k => normalized.includes(k) || raw.includes(k))) {
        return { type: cmd, raw };
      }
    }
    return null;
  }

  _isCompound(text) {
    const separators = ['然后', '接着', '再', '之后', '并且', '同时', '以及', '还有'];
    return separators.some(s => text.includes(s));
  }

  _parseCompound(normalized, raw) {
    const separators = ['然后', '接着', '之后', '并且', '同时', '以及', '还有'];
    let parts = [normalized];

    for (const sep of separators) {
      const newParts = [];
      for (const part of parts) {
        newParts.push(...part.split(sep).filter(p => p.length > 0));
      }
      parts = newParts;
    }

    parts = parts.flatMap(p => p.split('再').filter(x => x.length > 0));

    const allActions = [];
    for (const part of parts) {
      const actions = this._parseDrawActions(part, raw);
      allActions.push(...actions);
    }

    if (allActions.length > 0) {
      return { type: 'draw', actions: allActions, compound: true };
    }

    return { type: 'unknown', message: `复合指令解析失败: ${raw}` };
  }

  _parseDrawActions(text, raw) {
    const actions = [];

    const moveMatch = text.match(/移动(?:画笔|笔)?到\s*(\d+)\s*[,，]?\s*(\d+)/);
    if (moveMatch) {
      actions.push({
        type: 'move',
        params: { x: parseInt(moveMatch[1], 10), y: parseInt(moveMatch[2], 10) }
      });
      return actions;
    }

    const colorOnly = text.match(/(?:设置|切换|改为|换成)(?:颜色|画笔颜色)?(红|红色|蓝|蓝色|绿|绿色|黄|黄色|黑|黑色|白|白色|紫|紫色|橙|橙色|粉|粉色|灰|灰色|青|青色)/);
    if (colorOnly && !this._hasShapeKeyword(text)) {
      actions.push({
        type: 'color',
        params: { color: this._resolveColor(colorOnly[1]) }
      });
      return actions;
    }

    const strokeMatch = text.match(/线宽\s*(\d+)|笔画(?:宽度|粗细)\s*(\d+)/);
    if (strokeMatch && !this._hasShapeKeyword(text)) {
      actions.push({
        type: 'strokeWidth',
        params: { width: parseInt(strokeMatch[1] || strokeMatch[2], 10) }
      });
      return actions;
    }

    const shapeType = this._detectShape(text);
    if (!shapeType) return actions;

    const params = this._extractParams(text, shapeType);
    actions.push({ type: shapeType, params });
    return actions;
  }

  _hasShapeKeyword(text) {
    return Object.values(this.shapeKeywords).some(keywords =>
      keywords.some(k => text.includes(k))
    );
  }

  _detectShape(text) {
    for (const [shape, keywords] of Object.entries(this.shapeKeywords)) {
      if (keywords.some(k => text.includes(k))) {
        if (shape === 'polygon') {
          if (text.includes('五角') || text.includes('五边形') || text.includes('星')) return 'polygon';
          if (text.includes('六边形')) return 'polygon';
        }
        return shape;
      }
    }

    if (text.includes('圆') && !text.includes('椭圆')) return 'circle';
    return null;
  }

  _extractParams(text, shapeType) {
    const params = {};
    const color = this._extractColor(text);
    if (color) params.color = color;

    const position = this._extractPosition(text);
    if (position) params.position = position;

    params.filled = !text.includes('空心') && !text.includes('边框');

    const radius = this._extractNumber(text, ['半径', 'r']);
    const width = this._extractNumber(text, ['宽', '宽度', 'w']);
    const height = this._extractNumber(text, ['高', '高度', 'h']);
    const size = this._extractNumber(text, ['大小', '尺寸', '边长']);

    if (radius) params.radius = radius;
    if (width) params.width = width;
    if (height) params.height = height;
    if (size) params.size = size;

    const strokeW = this._extractNumber(text, ['线宽', '笔画']);
    if (strokeW) params.strokeWidth = strokeW;

    if (shapeType === 'line') {
      const lineCoords = this._extractLineEndpoints(text);
      if (lineCoords) {
        params.from = lineCoords.from;
        params.to = lineCoords.to;
      }
    }

    if (shapeType === 'polygon') {
      if (text.includes('六边形')) params.sides = 6;
      else if (text.includes('三角形')) params.sides = 3;
      else params.sides = 5;
      if (!params.radius) params.radius = 50;
    }

    if (shapeType === 'ellipse') {
      if (width && !height) params.radiusX = width / 2;
      if (height && !width) params.radiusY = height / 2;
      if (width && height) {
        params.radiusX = width / 2;
        params.radiusY = height / 2;
      }
    }

    if (shapeType === 'text') {
      const textMatch = text.match(/写[「"']?(.+?)[」"']?$/) ||
        text.match(/文字[「"']?(.+?)[」"']?$/) ||
        text.match(/绘制(.{1,10})$/);
      if (textMatch) params.text = textMatch[1];
    }

    return params;
  }

  _extractColor(text) {
    for (const [name, hex] of Object.entries(this.colorMap)) {
      if (text.includes(name)) return hex;
    }
    return null;
  }

  _resolveColor(name) {
    return this.colorMap[name] || '#2563eb';
  }

  _extractPosition(text) {
    for (const pos of this.positionKeywords) {
      if (text.includes(`在${pos}`) || text.includes(pos)) {
        return pos;
      }
    }

    const coordMatch = text.match(/(?:在|到|位置)\s*(\d+)\s*[,，]?\s*(\d+)/);
    if (coordMatch) {
      return { x: parseInt(coordMatch[1], 10), y: parseInt(coordMatch[2], 10) };
    }

    return null;
  }

  _extractNumber(text, keywords) {
    for (const kw of keywords) {
      const patterns = [
        new RegExp(`${kw}\\s*(\\d+)`),
        new RegExp(`(\\d+)\\s*${kw}`)
      ];
      for (const p of patterns) {
        const m = text.match(p);
        if (m) return parseInt(m[1], 10);
      }
    }
    return null;
  }

  _extractLineEndpoints(text) {
    const posMap = {
      '左上': { x: 80, y: 80 },
      '左下': { x: 80, y: 520 },
      '右上': { x: 820, y: 80 },
      '右下': { x: 820, y: 520 },
      '中心': { x: 450, y: 300 },
      '中央': { x: 450, y: 300 }
    };

    const fromTo = text.match(/从(.+?)到(.+?)(?:画|的|$)/);
    if (fromTo) {
      const fromKey = fromTo[1].replace(/画.*$/, '');
      const toKey = fromTo[2].replace(/画.*$/, '');
      const from = posMap[fromKey] || this._extractPosition(fromKey);
      const to = posMap[toKey] || this._extractPosition(toKey);
      if (from && to) return { from, to };
    }

    const coordLine = text.match(/(\d+)\s*[,，]?\s*(\d+)\s*到\s*(\d+)\s*[,，]?\s*(\d+)/);
    if (coordLine) {
      return {
        from: { x: parseInt(coordLine[1], 10), y: parseInt(coordLine[2], 10) },
        to: { x: parseInt(coordLine[3], 10), y: parseInt(coordLine[4], 10) }
      };
    }

    return null;
  }

  getHelpText() {
    return [
      '语音指令帮助：',
      '· 控制：开始监听、停止监听、撤销、清空画布',
      '· 图形：圆、矩形、三角形、椭圆、直线、多边形、文字',
      '· 属性：红色/蓝色…、宽200、高100、半径50、空心',
      '· 位置：中心、左上、右下、坐标 300 400',
      '· 复合：画一个红圆然后画蓝色矩形',
      '· 示例：「在中心画一个半径80的红色圆」'
    ].join('\n');
  }
}

window.CommandParser = CommandParser;
