/**
 * 语音控制器 - Web Speech API 封装
 * 支持连续识别、自动重启、低延迟反馈
 */
class VoiceController {
  constructor(options = {}) {
    this.onResult = options.onResult || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});
    this.onError = options.onError || (() => {});

    this.isListening = false;
    this.recognition = null;
    this.restartDelay = 300;
    this._restartTimer = null;

    this._initRecognition();
  }

  _initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      this._setStatus('error', '浏览器不支持语音识别', '请使用 Chrome 或 Edge');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'zh-CN';
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    this.recognition.onstart = () => {
      this.isListening = true;
      this._setStatus('listening', '正在监听', '请说出绘图指令');
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        this._scheduleRestart();
      } else {
        this._setStatus('idle', '已停止', '说「开始监听」重新启动');
      }
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim();

        if (result.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) {
        this.onResult({ interim, final: null });
      }

      if (final) {
        this._setStatus('processing', '处理中', final);
        this.onResult({ interim: null, final });
      }
    };

    this.recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        return;
      }
      if (event.error === 'aborted') {
        return;
      }

      const messages = {
        'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许',
        'network': '网络错误，语音识别需要网络连接',
        'audio-capture': '未检测到麦克风设备',
        'service-not-allowed': '语音识别服务不可用'
      };

      const msg = messages[event.error] || `识别错误: ${event.error}`;
      this.onError(msg);
      this._setStatus('error', '识别出错', msg);
    };
  }

  start() {
    if (!this.recognition) {
      this.onError('语音识别不可用');
      return false;
    }

    if (this.isListening) return true;

    try {
      this.isListening = true;
      this.recognition.start();
      return true;
    } catch (e) {
      if (e.message && e.message.includes('already started')) {
        return true;
      }
      this.isListening = false;
      this.onError('启动语音识别失败');
      return false;
    }
  }

  stop() {
    this.isListening = false;
    clearTimeout(this._restartTimer);

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this._setStatus('idle', '已停止', '说「开始监听」重新启动');
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }

  _scheduleRestart() {
    clearTimeout(this._restartTimer);
    this._restartTimer = setTimeout(() => {
      if (this.isListening && this.recognition) {
        try {
          this.recognition.start();
        } catch (e) {
          // already running
        }
      }
    }, this.restartDelay);
  }

  _setStatus(state, label, detail) {
    this.onStatusChange({ state, label, detail });
  }

  isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}

window.VoiceController = VoiceController;
