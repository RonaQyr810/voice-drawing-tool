/**
 * 应用主入口 - 串联语音、解析与绘图
 */
(function () {
  const canvas = document.getElementById('drawing-canvas');
  const statusDot = document.getElementById('status-dot');
  const statusLabel = document.getElementById('status-label');
  const statusDetail = document.getElementById('status-detail');
  const interimText = document.getElementById('interim-text');
  const finalText = document.getElementById('final-text');
  const feedbackLog = document.getElementById('feedback-log');
  const cursorIndicator = document.getElementById('cursor-indicator');

  const engine = new DrawingEngine(canvas);
  const parser = new CommandParser();

  engine.clear();

  const commandQueue = [];
  let isProcessingQueue = false;
  const COMMAND_COOLDOWN_MS = 80;

  function logFeedback(message, type = 'info') {
    const li = document.createElement('li');
    li.className = type;
    li.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    feedbackLog.insertBefore(li, feedbackLog.firstChild);

    while (feedbackLog.children.length > 20) {
      feedbackLog.removeChild(feedbackLog.lastChild);
    }
  }

  function updateCursorIndicator(pos) {
    if (!pos) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    cursorIndicator.style.left = `${pos.x * scaleX}px`;
    cursorIndicator.style.top = `${pos.y * scaleY}px`;
    cursorIndicator.classList.add('visible');
  }

  function updateStatus({ state, label, detail }) {
    statusDot.className = 'status-dot';
    if (state === 'listening') statusDot.classList.add('listening');
    else if (state === 'processing') statusDot.classList.add('processing');
    else if (state === 'error') statusDot.classList.add('error');

    statusLabel.textContent = label;
    statusDetail.textContent = detail;
  }

  function handleCommand(text) {
    const result = parser.parse(text);

    switch (result.type) {
      case 'start':
        voice.start();
        logFeedback('语音监听已启动', 'success');
        break;

      case 'stop':
        voice.stop();
        logFeedback('语音监听已停止', 'info');
        break;

      case 'undo':
        enqueueActions([{ type: 'undo', params: {} }]);
        break;

      case 'clear':
        enqueueActions([{ type: 'clear', params: {} }]);
        break;

      case 'help':
        logFeedback(parser.getHelpText(), 'info');
        break;

      case 'draw':
        enqueueActions(result.actions);
        if (result.compound) {
          logFeedback(`复合指令拆解为 ${result.actions.length} 步`, 'info');
        }
        break;

      case 'unknown':
        logFeedback(result.message, 'error');
        break;

      default:
        logFeedback('未识别的指令类型', 'error');
    }
  }

  function enqueueActions(actions) {
    commandQueue.push(...actions);
    processQueue();
  }

  async function processQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (commandQueue.length > 0) {
      const action = commandQueue.shift();
      const drawResult = engine.execute(action);

      if (drawResult.success) {
        logFeedback(drawResult.message, 'success');
        if (drawResult.position) {
          updateCursorIndicator(drawResult.position);
        } else {
          updateCursorIndicator(engine.getPenPosition());
        }
      } else {
        logFeedback(drawResult.message, 'error');
      }

      await sleep(COMMAND_COOLDOWN_MS);
    }

    isProcessingQueue = false;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  const voice = new VoiceController({
    onResult: ({ interim, final }) => {
      if (interim) {
        interimText.textContent = interim;
      }
      if (final) {
        interimText.textContent = '';
        finalText.textContent = final;
        handleCommand(final);
      }
    },
    onStatusChange: updateStatus,
    onError: (msg) => logFeedback(msg, 'error')
  });

  updateCursorIndicator(engine.getPenPosition());

  if (!voice.isSupported()) {
    logFeedback('当前浏览器不支持 Web Speech API，请使用 Chrome 或 Edge', 'error');
  } else {
    logFeedback('应用已就绪，请说「开始监听」启动语音控制', 'info');
  }

  document.addEventListener('keydown', (e) => e.preventDefault());
  canvas.addEventListener('mousedown', (e) => e.preventDefault());
  canvas.addEventListener('touchstart', (e) => e.preventDefault());

  window.addEventListener('resize', () => {
    updateCursorIndicator(engine.getPenPosition());
  });
})();
