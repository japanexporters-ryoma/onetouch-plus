/**
 * audio.js - Web Audio API による効果音生成 & ナチュラルAI音声再生
 */
class AudioManager {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.voiceType = 'female'; // 'female' (Nanami) or 'male' (Keita)
    this.currentAudio = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setSoundEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  setVoiceType(type) {
    this.voiceType = type; // 'female' or 'male'
  }

  // スキャンフォーカス移動時の軽い「ポッ」音
  playFocusSound() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime); // A4
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch (e) {
      console.warn(e);
    }
  }

  // 決定・クリック音「ピロン！」
  playSelectSound() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } catch (e) {
      console.warn(e);
    }
  }

  // クロスヘアの軸ロック音「カチッ」
  playLockSound() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {
      console.warn(e);
    }
  }

  // 呼出チャイム音「ピン・ポーン♪」
  playChime(callback) {
    this.init();
    try {
      const now = this.ctx.currentTime;
      // ピン（高音 G5 784Hz）
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // ポーン（低音 E5 659Hz）
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(659.25, now + 0.4);
      gain2.gain.setValueAtTime(0.25, now + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.4);
      osc2.stop(now + 1.2);

      if (callback) {
        setTimeout(callback, 800);
      }
    } catch (e) {
      if (callback) callback();
    }
  }

  // 花火の打ち上げ音「ヒュー…ドーン！」
  playFireworkSound() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.35);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);

      setTimeout(() => {
        if (!this.ctx) return;
        const boomNow = this.ctx.currentTime;
        const boomOsc = this.ctx.createOscillator();
        const boomGain = this.ctx.createGain();
        boomOsc.type = 'triangle';
        boomOsc.frequency.setValueAtTime(160, boomNow);
        boomOsc.frequency.exponentialRampToValueAtTime(40, boomNow + 0.6);

        boomGain.gain.setValueAtTime(0.25, boomNow);
        boomGain.gain.exponentialRampToValueAtTime(0.001, boomNow + 0.7);

        boomOsc.connect(boomGain);
        boomGain.connect(this.ctx.destination);
        boomOsc.start(boomNow);
        boomOsc.stop(boomNow + 0.7);
      }, 350);
    } catch (e) {
      console.warn(e);
    }
  }

  // スロットあたり・ファンファーレ
  playFanfare() {
    if (!this.soundEnabled) return;
    this.init();
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const duration = 0.14;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = this.ctx.currentTime + (idx * duration);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration + (idx === 3 ? 0.4 : 0.05));

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(start);
        osc.stop(start + duration + (idx === 3 ? 0.4 : 0.05));
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // ==========================================
  // 【最重要】ナチュラルなAI肉声ファイルの再生
  // ==========================================
  playPhrase(voiceKey, fallbackText) {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }

    const folder = this.voiceType === 'male' ? 'audio/voice_male' : 'audio/voice';
    const filePath = `${folder}/${voiceKey}.mp3`;

    // 呼出ベルの場合はチャイムを鳴らしてから喋る
    if (voiceKey === 'call') {
      this.playChime(() => {
        this.playAudioFile(filePath, fallbackText);
      });
      return;
    }

    this.playAudioFile(filePath, fallbackText);
  }

  playAudioFile(filePath, fallbackText) {
    const audio = new Audio(filePath);
    this.currentAudio = audio;

    audio.play().catch((err) => {
      console.warn('Audio file play failed, fallback to SpeechSynthesis:', err);
      this.speak(fallbackText);
    });
  }

  // フォールバック用の音声合成 (Web Speech API)
  speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const uttr = new SpeechSynthesisUtterance(text);
    uttr.lang = 'ja-JP';
    uttr.rate = 0.95; // 少しゆっくり丁寧に
    uttr.pitch = this.voiceType === 'male' ? 0.85 : 1.1;

    const voices = window.speechSynthesis.getVoices();
    const jaVoice = voices.find(v => v.lang.includes('ja') || v.lang.includes('JP'));
    if (jaVoice) {
      uttr.voice = jaVoice;
    }

    window.speechSynthesis.speak(uttr);
  }
}

window.audioManager = new AudioManager();
