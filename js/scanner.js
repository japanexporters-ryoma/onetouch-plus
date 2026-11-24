/**
 * scanner.js - オートスキャン ＆ クロスヘア（XY走査線・ポイントスキャン）エンジン
 * ハンディキャップ対応：5段階速度（超低速モード）＆ 反応遅延アシスト（通り過ぎ救済）
 */

class ScanEngine {
  constructor() {
    this.mode = 'item'; // 'item' or 'crosshair'
    this.speed = 'v-normal'; // 'v-slowest', 'v-slow', 'v-normal', 'v-fast', 'v-fastest'
    
    // 5段階の速度設定（ハンディキャップ・反応遅延に対応）
    this.speedConfigs = {
      item: {
        'v-slowest': 5000, // 5.0秒
        'v-slow':    3500, // 3.5秒
        'v-normal':  2200, // 2.2秒
        'v-fast':    1500, // 1.5秒
        'v-fastest': 1000  // 1.0秒
      },
      crosshair: {
        'v-slowest': 75,   // 75px/秒（画面端から端まで10秒以上かかる超ゆったりモード）
        'v-slow':    130,  // 130px/秒
        'v-normal':  220,  // 220px/秒
        'v-fast':    350,  // 350px/秒
        'v-fastest': 520   // 520px/秒
      }
    };

    // 項目スキャン用
    this.items = [];
    this.currentIndex = -1;
    this.itemTimer = null;

    // クロスヘア（走査線）用
    this.crosshairState = 'IDLE'; // 'IDLE', 'SCAN_Y', 'SCAN_X', 'RESOLVING'
    this.posY = 0;
    this.posX = 0;
    this.dirY = 1;
    this.dirX = 1;
    this.lastFrameTime = 0;
    this.animFrameId = null;

    // 通過中の要素ハイライト追従用
    this.hoveredItem = null;

    // DOM要素
    this.overlay = document.getElementById('crosshair-overlay');
    this.lineH = document.getElementById('scan-line-horizontal');
    this.lineV = document.getElementById('scan-line-vertical');
    this.targetEffect = document.getElementById('crosshair-target');
    this.statusBadge = document.getElementById('input-status-badge');
    this.modeIndicator = document.getElementById('scan-mode-indicator');

    // デバウンス用
    this.lastTriggerTime = 0;
    this.debounceMs = 350;

    // 介助者（お母さん）用サポートON/OFF
    this.supportEnabled = true;

    this.initEvents();
  }

  initEvents() {
    // 1. キーボード入力（ナースコール変換機 / Bluetoothスイッチ / スペース / Enter）
    window.addEventListener('keydown', (e) => {
      if (!this.supportEnabled) return; // サポートOFF時は通常入力
      if (['Space', 'Enter', 'ArrowRight', 'NumpadEnter'].includes(e.code) || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.trigger();
      }
    });

    // 2. 画面全体のタッチ/クリック
    document.addEventListener('pointerdown', (e) => {
      // サポートトグルボタン自体のクリックは邪魔しない
      if (e.target.closest('#btn-support-toggle')) return;

      // サポートOFF（介助モード）の時は、通常タッチとしてそのまま通す！
      if (!this.supportEnabled) {
        return; 
      }

      this.trigger();
    });

    // リサイズ時に位置調整
    window.addEventListener('resize', () => {
      if (this.mode === 'crosshair' && this.crosshairState !== 'IDLE') {
        this.resetCrosshair();
        this.start();
      }
    });
  }

  toggleSupport() {
    this.supportEnabled = !this.supportEnabled;
    const btn = document.getElementById('btn-support-toggle');

    if (!this.supportEnabled) {
      // サポートOFF（通常タッチモード）
      this.stop();
      if (btn) {
        btn.classList.add('off');
        btn.textContent = '▶ サポートONにする';
      }
      if (this.statusBadge) {
        this.statusBadge.style.backgroundColor = '#1d4ed8';
        this.statusBadge.style.color = '#bfdbfe';
        this.statusBadge.textContent = '介助モード（画面直接タッチ操作）';
      }
      if (this.modeIndicator) {
        this.modeIndicator.textContent = 'モード: 通常タッチ（介助）';
      }
    } else {
      // サポートON（スイッチスキャン再開）
      if (btn) {
        btn.classList.remove('off');
        btn.textContent = '🖐️ サポートOFF（通常タッチ）';
      }
      if (this.statusBadge) {
        this.statusBadge.style.backgroundColor = '#065f46';
        this.statusBadge.style.color = '#6ee7b7';
        this.statusBadge.textContent = 'ボタン入力受付中';
      }
      if (this.modeIndicator) {
        this.modeIndicator.textContent = `モード: ${this.mode === 'item' ? '項目スキャン' : '十字線スキャン'}`;
      }
      this.start();
    }

    if (window.audioManager) {
      window.audioManager.playSelectSound();
    }
  }

  setMode(newMode) {
    this.mode = newMode;
    if (this.modeIndicator) {
      this.modeIndicator.textContent = `モード: ${this.mode === 'item' ? '項目スキャン' : '十字線スキャン'}`;
    }
    this.restart();
  }

  setSpeed(newSpeed) {
    this.speed = newSpeed;
    this.restart();
  }

  restart() {
    this.stop();
    if (!this.supportEnabled) {
      return;
    }
    this.start();
  }

  start() {
    // サポートOFF（介助モード）の時は絶対にスキャンを開始しない！
    if (!this.supportEnabled) {
      this.stop();
      return;
    }

    if (this.mode === 'item') {
      this.overlay.classList.add('hidden');
      this.startItemScan();
    } else {
      this.stopItemScan();
      this.startCrosshairScan();
    }
  }

  stop() {
    this.stopItemScan();
    this.stopCrosshairScan();
  }

  // ==========================================
  // スイッチが押された時の統一ハンドラ
  // ==========================================
  trigger() {
    const now = performance.now();
    if (now - this.lastTriggerTime < this.debounceMs) {
      return; // チャタリング防止
    }
    this.lastTriggerTime = now;

    // 入力感知バッジを一瞬フラッシュ
    if (this.statusBadge) {
      this.statusBadge.style.backgroundColor = '#facc15';
      this.statusBadge.style.color = '#000';
      this.statusBadge.textContent = '入力感知！';
      setTimeout(() => {
        this.statusBadge.style.backgroundColor = '#065f46';
        this.statusBadge.style.color = '#6ee7b7';
        this.statusBadge.textContent = 'ボタン入力受付中';
      }, 350);
    }

    if (this.mode === 'item') {
      this.triggerItem();
    } else {
      this.triggerCrosshair();
    }
  }

  // ==========================================
  // ① 項目スキャン（Item Scan）
  // ==========================================
  refreshItems() {
    const activeSection = document.querySelector('.view-section.active');
    const settingsPanel = document.getElementById('settings-panel');
    const isSettingsOpen = !settingsPanel.classList.contains('hidden');

    let elements = [];
    if (isSettingsOpen) {
      elements = Array.from(settingsPanel.querySelectorAll('.scannable:not(.hidden)'));
    } else {
      const headerBtn = document.getElementById('btn-settings-toggle');
      if (headerBtn) elements.push(headerBtn);

      if (activeSection) {
        const sectionItems = Array.from(activeSection.querySelectorAll('.scannable:not(.hidden)'));
        elements = elements.concat(sectionItems);
      }
    }

    this.items = elements.filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
    });

    if (this.currentIndex >= this.items.length) {
      this.currentIndex = 0;
    }
  }

  startItemScan() {
    if (!this.supportEnabled) return;
    this.refreshItems();
    if (this.items.length === 0) return;

    if (this.currentIndex < 0 || this.currentIndex >= this.items.length) {
      this.currentIndex = 0;
    }
    this.highlightCurrentItem();

    const interval = this.speedConfigs.item[this.speed] || 2200;
    clearInterval(this.itemTimer);
    this.itemTimer = setInterval(() => {
      this.nextItem();
    }, interval);
  }

  stopItemScan() {
    clearInterval(this.itemTimer);
    this.itemTimer = null;
    if (this.items && this.items[this.currentIndex]) {
      this.items[this.currentIndex].classList.remove('scan-focused');
    }
    this.currentIndex = -1;
  }

  nextItem() {
    this.refreshItems();
    if (this.items.length === 0) return;

    if (this.items[this.currentIndex]) {
      this.items[this.currentIndex].classList.remove('scan-focused');
    }

    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this.highlightCurrentItem();
  }

  highlightCurrentItem() {
    const el = this.items[this.currentIndex];
    if (el) {
      el.classList.add('scan-focused');
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      if (window.audioManager) {
        window.audioManager.playFocusSound();
      }
    }
  }

  triggerItem() {
    if (this.currentIndex >= 0 && this.currentIndex < this.items.length) {
      const selected = this.items[this.currentIndex];
      if (selected) {
        if (window.audioManager) {
          window.audioManager.playSelectSound();
        }
        selected.classList.remove('scan-focused');
        selected.click();
        
        clearInterval(this.itemTimer);
        setTimeout(() => {
          this.startItemScan();
        }, 500);
      }
    } else {
      this.startItemScan();
    }
  }

  // ==========================================
  // ② 十字線（クロスヘア・XY走査線）スキャン
  // ==========================================
  startCrosshairScan() {
    if (!this.supportEnabled) return;
    this.overlay.classList.remove('hidden');
    this.resetCrosshair();
    this.crosshairState = 'SCAN_Y';
    this.lastFrameTime = performance.now();
    this.stepCrosshair();
  }

  stopCrosshairScan() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.resetCrosshair();
    this.overlay.classList.add('hidden');
    this.crosshairState = 'IDLE';
  }

  resetCrosshair() {
    this.lineH.classList.remove('locked');
    this.lineV.classList.remove('locked');
    this.lineH.style.opacity = '1';
    this.lineV.style.opacity = '0';
    this.targetEffect.classList.add('hidden');
    this.posY = 0;
    this.posX = 0;
    this.dirY = 1;
    this.dirX = 1;
    this.lineH.style.top = '0px';
    this.lineV.style.left = '0px';
    this.clearHoverEffect();
  }

  clearHoverEffect() {
    if (this.hoveredItem) {
      this.hoveredItem.classList.remove('scan-focused');
      this.hoveredItem = null;
    }
  }

  stepCrosshair() {
    const now = performance.now();
    const dt = (now - this.lastFrameTime) / 1000;
    this.lastFrameTime = now;

    const winH = window.innerHeight;
    const winW = window.innerWidth;
    const speedPx = this.speedConfigs.crosshair[this.speed] || 220;

    if (this.crosshairState === 'SCAN_Y') {
      // 水平線が上から下へ移動（反転往復）
      this.posY += this.dirY * speedPx * dt;
      if (this.posY >= winH - 8) {
        this.posY = winH - 8;
        this.dirY = -1;
      } else if (this.posY <= 0) {
        this.posY = 0;
        this.dirY = 1;
      }
      this.lineH.style.top = `${this.posY}px`;

      // 走査線が乗っている要素を軽くハイライト（現在地フィードバック）
      this.updateHoverFeedbackY(this.posY);

    } else if (this.crosshairState === 'SCAN_X') {
      // 垂直線が左から右へ移動（反転往復）
      this.posX += this.dirX * speedPx * dt;
      if (this.posX >= winW - 8) {
        this.posX = winW - 8;
        this.dirX = -1;
      } else if (this.posX <= 0) {
        this.posX = 0;
        this.dirX = 1;
      }
      this.lineV.style.left = `${this.posX}px`;
    }

    if (this.crosshairState !== 'RESOLVING') {
      this.animFrameId = requestAnimationFrame(() => this.stepCrosshair());
    }
  }

  // Y走査線が通過中のボタンの視覚的フィードバック
  updateHoverFeedbackY(y) {
    this.refreshItems();
    let currentPassing = null;
    for (const item of this.items) {
      const rect = item.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        currentPassing = item;
        break;
      }
    }

    if (currentPassing !== this.hoveredItem) {
      this.clearHoverEffect();
      if (currentPassing) {
        currentPassing.classList.add('scan-focused');
        this.hoveredItem = currentPassing;
        if (window.audioManager) {
          window.audioManager.playFocusSound();
        }
      }
    }
  }

  triggerCrosshair() {
    if (this.crosshairState === 'SCAN_Y') {
      // 1回目の入力: Y軸（水平線）固定
      // 【反応遅延アシスト】もしボタンを通り過ぎた直後（+140px以内）に押された場合、
      // 直前のボタンの中心Y座標へ優しく引き戻す（お父さんの意図を救済）
      const assistedY = this.calculateAssistedY(this.posY, this.dirY);
      this.posY = assistedY;
      this.lineH.style.top = `${this.posY}px`;

      if (window.audioManager) {
        window.audioManager.playLockSound();
      }
      this.lineH.classList.add('locked');
      this.lineV.style.opacity = '1';
      this.crosshairState = 'SCAN_X';
      this.posX = 0;
      this.dirX = 1;
    } else if (this.crosshairState === 'SCAN_X') {
      // 2回目の入力: X軸（垂直線）固定
      // 【反応遅延アシスト】X方向も直前に通過したボタンの中心へアシスト
      const assistedX = this.calculateAssistedX(this.posX, this.posY, this.dirX);
      this.posX = assistedX;
      this.lineV.style.left = `${this.posX}px`;

      this.lineV.classList.add('locked');
      this.crosshairState = 'RESOLVING';

      const targetX = this.posX;
      const targetY = this.posY;

      // 波紋ターゲットエフェクト
      this.targetEffect.style.left = `${targetX}px`;
      this.targetEffect.style.top = `${targetY}px`;
      this.targetEffect.classList.remove('hidden');

      if (window.audioManager) {
        window.audioManager.playSelectSound();
      }

      setTimeout(() => {
        this.executeCrosshairSelection(targetX, targetY);
      }, 300);
    } else if (this.crosshairState === 'IDLE') {
      this.startCrosshairScan();
    }
  }

  // ==========================================
  // 【最重要】ハンディキャップ向け 反応遅延アシスト
  // ボタンを認識してから押すまでに通り過ぎてしまう現象を救済
  // ==========================================
  calculateAssistedY(rawY, dir) {
    this.refreshItems();
    const tolerance = 160; // 通過後160px以内の遅延を許容

    // すでにいずれかの要素内に直撃しているならそのまま
    for (const item of this.items) {
      const rect = item.getBoundingClientRect();
      if (rawY >= rect.top && rawY <= rect.bottom) {
        return rawY;
      }
    }

    // もし下向き移動中(dir > 0)で、ボタンの下端を過ぎた直後なら直前のボタンの中央へ
    let bestY = rawY;
    let minDiff = tolerance;

    for (const item of this.items) {
      const rect = item.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      
      if (dir > 0 && rawY >= rect.bottom && rawY - rect.bottom < minDiff) {
        minDiff = rawY - rect.bottom;
        bestY = centerY; // 直前のボタンの中心に補正！
      } else if (dir < 0 && rawY <= rect.top && rect.top - rawY < minDiff) {
        minDiff = rect.top - rawY;
        bestY = centerY;
      }
    }

    return bestY;
  }

  calculateAssistedX(rawX, targetY, dir) {
    this.refreshItems();
    const tolerance = 180;

    // 現在のY座標と重なる候補要素を絞り込み
    const candidateItems = this.items.filter(item => {
      const rect = item.getBoundingClientRect();
      return targetY >= rect.top - 40 && targetY <= rect.bottom + 40;
    });

    for (const item of candidateItems) {
      const rect = item.getBoundingClientRect();
      if (rawX >= rect.left && rawX <= rect.right) {
        return rawX; // 直撃
      }
    }

    let bestX = rawX;
    let minDiff = tolerance;

    for (const item of candidateItems) {
      const rect = item.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;

      if (dir > 0 && rawX >= rect.right && rawX - rect.right < minDiff) {
        minDiff = rawX - rect.right;
        bestX = centerX;
      } else if (dir < 0 && rawX <= rect.left && rect.left - rawX < minDiff) {
        minDiff = rect.left - rawX;
        bestX = centerX;
      }
    }

    return bestX;
  }

  executeCrosshairSelection(x, y) {
    this.clearHoverEffect();
    const elements = document.elementsFromPoint(x, y) || [];
    let clickedTarget = null;

    for (const el of elements) {
      if (el.closest('#crosshair-overlay')) continue;
      
      const scannable = el.closest('.scannable');
      if (scannable) {
        clickedTarget = scannable;
        break;
      }
      if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.hasAttribute('data-action')) {
        clickedTarget = el;
        break;
      }
    }

    // 直撃していなければ、近くの要素に優しく吸着
    if (!clickedTarget) {
      clickedTarget = this.findNearestScannable(x, y, 160);
    }

    if (clickedTarget) {
      clickedTarget.classList.add('scan-focused');
      setTimeout(() => {
        clickedTarget.classList.remove('scan-focused');
        clickedTarget.click();
      }, 250);
    }

    setTimeout(() => {
      if (this.mode === 'crosshair') {
        this.resetCrosshair();
        this.crosshairState = 'SCAN_Y';
        this.lastFrameTime = performance.now();
        this.stepCrosshair();
      }
    }, 800);
  }

  findNearestScannable(x, y, maxDistance = 160) {
    this.refreshItems();
    let nearest = null;
    let minD = maxDistance;

    for (const item of this.items) {
      const rect = item.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(cx - x, cy - y);
      if (dist < minD) {
        minD = dist;
        nearest = item;
      }
    }
    return nearest;
  }
}

window.ScanEngine = ScanEngine;
