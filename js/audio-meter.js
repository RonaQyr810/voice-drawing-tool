/**
 * 麦克风音量监测 - 实时显示输入音量
 */
class AudioMeter {
  constructor(options = {}) {
    this.onLevel = options.onLevel || (() => {});
    this.onStatus = options.onStatus || (() => {});
    this.onError = options.onError || (() => {});

    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.dataArray = null;
    this.rafId = null;
    this.active = false;
  }

  async start() {
    if (this.active) return true;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.75;
      source.connect(this.analyser);

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.active = true;
      this.onStatus('active', '麦克风已连接');
      this._tick();
      return true;
    } catch (err) {
      const msg = err.name === 'NotAllowedError'
        ? '麦克风权限被拒绝，请点击地址栏锁图标允许'
        : '无法访问麦克风，请检查设备连接';
      this.onError(msg);
      this.onStatus('error', msg);
      return false;
    }
  }

  stop() {
    this.active = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.onLevel(0);
    this.onStatus('idle', '麦克风未连接');
  }

  _tick() {
    if (!this.active || !this.analyser) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const avg = sum / this.dataArray.length;
    const level = Math.min(100, Math.round((avg / 128) * 100));

    this.onLevel(level);
    this.rafId = requestAnimationFrame(() => this._tick());
  }

  isActive() {
    return this.active;
  }
}

window.AudioMeter = AudioMeter;
