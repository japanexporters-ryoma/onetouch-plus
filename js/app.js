/**
 * app.js - メインアプリケーション制御
 */

document.addEventListener('DOMContentLoaded', () => {
  // スキャンエンジン初期化
  const scanner = new window.ScanEngine();
  window.appScanner = scanner; // DriveSyncから参照できるように公開

  // ----------------------------------------------------
  // 1. 画面遷移制御
  // ----------------------------------------------------
  const sections = document.querySelectorAll('.view-section');
  
  function switchView(viewName) {
    sections.forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
      target.classList.add('active');
    }

    // 画面ごとの個別処理
    if (viewName === 'video') {
      initVideoView();
    } else if (viewName === 'books') {
      initBooksView();
    } else if (viewName === 'voice') {
      showMainVoiceMenu();
    }

    // 画面遷移後にスキャン対象を再取得（サポートON時のみ）
    setTimeout(() => {
      if (scanner.supportEnabled) {
        scanner.start();
      }
    }, 200);
  }

  // ----------------------------------------------------
  // サポートOFFトグルボタン
  // ----------------------------------------------------
  const btnSupportToggle = document.getElementById('btn-support-toggle');
  if (btnSupportToggle) {
    btnSupportToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      scanner.toggleSupport();
    });
  }
  document.querySelectorAll('.menu-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const view = card.dataset.view;
      if (view) switchView(view);
    });
  });

  document.querySelectorAll('[data-action="back-home"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      switchView('home');
    });
  });

  // ----------------------------------------------------
  // 3. 設定パネルの制御
  // ----------------------------------------------------
  const settingsPanel = document.getElementById('settings-panel');
  const btnSettingsToggle = document.getElementById('btn-settings-toggle');
  const btnCloseSettings = document.querySelector('[data-action="close-settings"]');

  function openSettings() {
    settingsPanel.classList.remove('hidden');
    scanner.stop();
    setTimeout(() => scanner.start(), 200);
  }

  function closeSettings() {
    settingsPanel.classList.add('hidden');
    scanner.stop();
    setTimeout(() => scanner.start(), 200);
  }

  if (btnSettingsToggle) {
    btnSettingsToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (settingsPanel.classList.contains('hidden')) {
        openSettings();
      } else {
        closeSettings();
      }
    });
  }

  if (btnCloseSettings) {
    btnCloseSettings.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSettings();
    });
  }

  // 設定オプション変更
  document.querySelectorAll('.btn-opt').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const setting = btn.dataset.setting;
      const val = btn.dataset.val;

      // 同じグループの active を外す
      btn.parentElement.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (setting === 'mode') {
        scanner.setMode(val);
      } else if (setting === 'speed') {
        scanner.setSpeed(val);
      } else if (setting === 'voice-type') {
        window.audioManager.setVoiceType(val);
      } else if (setting === 'sound') {
        window.audioManager.setSoundEnabled(val === 'on');
      }

      if (window.audioManager) {
        window.audioManager.playSelectSound();
      }

      // 設定変更をGoogleドライブに自動同期
      if (window.googleDriveSync) {
        window.googleDriveSync.saveToDrive();
      }
    });
  });

  // ----------------------------------------------------
  // 4. お父さんのお笑いシアター（Render API連携 & フォールバック内蔵）
  // ----------------------------------------------------
  const COMEDIAN_PRESETS = {
    sand: {
      name: 'サンドウィッチマン',
      query: 'サンドウィッチマン 公式 コント 漫才',
      fallback: [
        { id: 'TYHTRihC2hg', title: '【公式】サンドウィッチマン コント「寝具店」' },
        { id: 'WOxVwLQdvjM', title: '【公式】サンドウィッチマン 傑作コント「ファミレス」' },
        { id: 'udai2HRVy0c', title: 'サンドウィッチマン 爆笑漫才「街頭アンケート」' },
        { id: '2Vv-BfVoq4g', title: 'サンドウィッチマン コント「ハンバーガーショップ」' },
        { id: 'kJQP7kiw5Fk', title: 'サンドウィッチマン コント「職務質問」' }
      ]
    },
    nakagawake: {
      name: '中川家',
      query: '中川家 漫才 礼二 剛 爆笑 モノマネ',
      fallback: [
        { id: 'fF7_G796kHQ', title: '中川家 爆笑漫才「電車の車掌・日常のモノマネ」' },
        { id: 'oJd8hG91fAQ', title: '中川家 礼二・剛「みどりの窓口の駅員」' },
        { id: 'kK2-7kP91yQ', title: '中川家 定番漫才「大阪のおばちゃん」' },
        { id: 'wJ7_G796kHQ', title: '中川家 漫才「タクシーの運転手」' }
      ]
    },
    kamaitachi: {
      name: 'かまいたち',
      query: 'かまいたち チャンネル 公式 コント 漫才',
      fallback: [
        { id: 'uH3Y8g7qP_w', title: 'かまいたち 爆笑コント「ホームルーム」' },
        { id: '9kX-7jP11yQ', title: 'かまいたち 爆笑漫才「トトロ」' },
        { id: '8kX-7jP11yQ', title: 'かまいたち コント「奇術師」' }
      ]
    },
    chidori: {
      name: '千鳥',
      query: '千鳥 漫才 大悟 ノブ 爆笑',
      fallback: [
        { id: '7kX-7jP11yQ', title: '千鳥 傑作漫才「クセがすごい寿司屋」' },
        { id: '6kX-7jP11yQ', title: '千鳥 定番漫才「白平（はくへい）」' },
        { id: '5kX-7jP11yQ', title: '千鳥 漫才「旅館の予約」' }
      ]
    },
    knights: {
      name: 'ナイツ',
      query: 'ナイツ 漫才 ヤホー ヤホー漫才 爆笑',
      fallback: [
        { id: '4kX-7jP11yQ', title: 'ナイツ 定番漫才「ヤホーで調べました」' },
        { id: '3kX-7jP11yQ', title: 'ナイツ 時事漫才「有名人間違い」' }
      ]
    },
    soshina: {
      name: '粗品（霜降り明星）',
      query: '粗品 霜降り明星 公式 フリップ 漫才 爆笑',
      fallback: [
        { id: '2kX-7jP11yQ', title: '粗品 フリップネタ「高速ツッコミ傑作選」' },
        { id: '1kX-7jP11yQ', title: '霜降り明星 爆笑漫才「学校」' }
      ]
    },
    ohtani: {
      name: '大谷翔平',
      query: '大谷翔平 ホームラン ハイライト 2024 2025 WBC',
      fallback: [
        { id: 'LXb3EKWsInQ', title: '大谷翔平 特大ホームラン集＆名場面' },
        { id: '1La4QzGeaaQ', title: '大谷翔平 WBC 決勝 歓喜のラスト' }
      ]
    },
    drifters: {
      name: '志村けん・ドリフ',
      query: '8時だョ!全員集合 ドリフターズ コント 志村けん',
      fallback: [
        { id: 'e-ORhEE9VVg', title: 'ドリフターズ 懐かしの爆笑コント「学校コント」' },
        { id: 'OPf0YbXqDm0', title: '志村けん バカ殿様・変なおじさん傑作選' }
      ]
    },
    songs: {
      name: '懐かしの昭和歌謡',
      query: '昭和 歌謡曲 ヒットパレード 名曲',
      fallback: [
        { id: '2Vv-BfVoq4g', title: '【昭和歌謡 名曲集】心に残る想い出のメロディー' },
        { id: 'kJQP7kiw5Fk', title: '【懐かしの童謡・唱歌】ふるさと、紅葉、春の小川' }
      ]
    },
    nature: {
      name: '日本の絶景・鉄道',
      query: '日本の絶景 美しい自然 風景 ローカル線 車窓',
      fallback: [
        { id: '1La4QzGeaaQ', title: '【4K】日本の絶景 四季の彩り (桜・紅葉・富士山)' },
        { id: 'e-ORhEE9VVg', title: '【前面展望】日本のローカル線・美しい車窓の旅' }
      ]
    }
  };

  const videoSelectorScreen = document.getElementById('video-selector-screen');
  const videoListScreen = document.getElementById('video-list-screen');
  const videoTheaterScreen = document.getElementById('video-theater-screen');
  const videoListComedianName = document.getElementById('video-list-comedian-name');
  const videoItemsContainer = document.getElementById('video-items-container');
  const videoListLoading = document.getElementById('video-list-loading');
  const theaterChannelName = document.getElementById('theater-channel-name');
  const videoFrame = document.getElementById('video-frame');
  const videoTitle = document.getElementById('video-title');
  const videoIndexBadge = document.getElementById('video-index-badge');

  let activeComedianKey = 'sand';
  let activeVideoList = [];
  let activeVideoIndex = 0;

  function initVideoView() {
    // 動画画面を開いた時はまず芸人セレクターを表示
    if (videoSelectorScreen && videoListScreen && videoTheaterScreen) {
      videoSelectorScreen.classList.remove('hidden');
      videoListScreen.classList.add('hidden');
      videoTheaterScreen.classList.add('hidden');
    }
    if (videoFrame) videoFrame.src = '';
  }

  // 1. 芸人を選択 ➔ 動画一覧画面へ遷移
  async function selectComedian(comedianKey) {
    activeComedianKey = comedianKey;
    const config = COMEDIAN_PRESETS[comedianKey] || COMEDIAN_PRESETS.sand;
    
    if (videoListComedianName) videoListComedianName.textContent = config.name;
    if (theaterChannelName) theaterChannelName.textContent = config.name;

    if (videoSelectorScreen) videoSelectorScreen.classList.add('hidden');
    if (videoTheaterScreen) videoTheaterScreen.classList.add('hidden');
    if (videoListScreen) videoListScreen.classList.remove('hidden');

    activeVideoList = [...config.fallback];
    renderVideoList(activeVideoList);

    // Render API (https://otousan-owarai.onrender.com/api/search) から最新動画を取得
    if (videoListLoading) videoListLoading.classList.remove('hidden');

    try {
      const q = encodeURIComponent(config.query);
      const res = await fetch(`https://otousan-owarai.onrender.com/api/search?q=${q}`, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const data = await res.json();
        if (data.videos && data.videos.length > 0) {
          const apiVideos = data.videos.map(v => ({
            id: v.videoId,
            title: v.title,
            thumbnail: v.thumbnail || `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`
          })).filter(v => v.id);

          if (apiVideos.length > 0) {
            activeVideoList = apiVideos;
            renderVideoList(activeVideoList);
          }
        }
      }
    } catch (e) {
      console.warn('API fetch failed or timed out, using fallback videos:', e);
    } finally {
      if (videoListLoading) videoListLoading.classList.add('hidden');
    }

    if (scanner.supportEnabled) {
      setTimeout(() => scanner.start(), 300);
    }
  }

  // 動画カード一覧をレンダリング
  function renderVideoList(videos) {
    if (!videoItemsContainer) return;
    videoItemsContainer.innerHTML = '';

    videos.forEach((vid, idx) => {
      const card = document.createElement('button');
      card.className = 'video-item-card scannable';
      card.dataset.index = idx;
      
      const thumbUrl = vid.thumbnail || `https://i.ytimg.com/vi/${vid.id}/mqdefault.jpg`;

      card.innerHTML = `
        <div class="video-thumb-box">
          <img class="video-thumb-img" src="${thumbUrl}" alt="thumbnail" loading="lazy" />
          <div class="video-play-badge">▶</div>
        </div>
        <div class="video-item-info">
          <div class="video-item-title">${vid.title}</div>
          <div class="video-play-label">▶ 今すぐこの動画を見る</div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        e.stopPropagation();
        playVideoByIndex(idx);
      });

      videoItemsContainer.appendChild(card);
    });

    if (scanner.supportEnabled) {
      setTimeout(() => scanner.start(), 200);
    }
  }

  // 2. 動画カードを選択 ➔ 大画面シアターで再生開始
  function playVideoByIndex(idx) {
    activeVideoIndex = idx;
    if (videoListScreen) videoListScreen.classList.add('hidden');
    if (videoTheaterScreen) videoTheaterScreen.classList.remove('hidden');

    playCurrentTheaterVideo();

    if (scanner.supportEnabled) {
      setTimeout(() => scanner.start(), 300);
    }
  }

  function playCurrentTheaterVideo() {
    if (!activeVideoList || activeVideoList.length === 0) return;
    const item = activeVideoList[activeVideoIndex % activeVideoList.length];
    if (item && videoFrame) {
      videoFrame.src = `https://www.youtube.com/embed/${item.id}?autoplay=1&rel=0&modestbranding=1`;
      if (videoTitle) videoTitle.textContent = item.title;
      if (videoIndexBadge) {
        videoIndexBadge.textContent = `動画 ${activeVideoIndex + 1} / ${activeVideoList.length}`;
      }
    }
  }

  function nextTheaterVideo() {
    if (!activeVideoList || activeVideoList.length === 0) return;
    activeVideoIndex = (activeVideoIndex + 1) % activeVideoList.length;
    playCurrentTheaterVideo();
  }

  // シアターから動画一覧へ戻る
  function backToVideoList() {
    if (videoFrame) videoFrame.src = '';
    if (videoTheaterScreen) videoTheaterScreen.classList.add('hidden');
    if (videoListScreen) videoListScreen.classList.remove('hidden');
    if (scanner.supportEnabled) {
      setTimeout(() => scanner.start(), 300);
    }
  }

  // 動画一覧から芸人セレクターへ戻る
  function backToComedians() {
    if (videoFrame) videoFrame.src = '';
    if (videoTheaterScreen) videoTheaterScreen.classList.add('hidden');
    if (videoListScreen) videoListScreen.classList.add('hidden');
    if (videoSelectorScreen) videoSelectorScreen.classList.remove('hidden');
    if (scanner.supportEnabled) {
      setTimeout(() => scanner.start(), 300);
    }
  }

  // 芸人カードクリックイベント
  document.querySelectorAll('.comedian-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      const cKey = card.dataset.comedian;
      if (cKey) selectComedian(cKey);
    });
  });

  // 次の動画ボタン
  document.querySelectorAll('[data-action="theater-next"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      nextTheaterVideo();
    });
  });

  // 動画一覧へ戻るボタン
  document.querySelectorAll('[data-action="back-to-video-list"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      backToVideoList();
    });
  });

  // 芸人を選び直すボタン
  document.querySelectorAll('[data-action="back-to-comedians"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      backToComedians();
    });
  });

  // ----------------------------------------------------
  // 5. 朗読小説シアター（耳で聴く名作文学 & 複視配慮 特大1行表示）
  // ----------------------------------------------------
  const booksSelectorScreen = document.getElementById('books-selector-screen');
  const booksPlayerScreen = document.getElementById('books-player-screen');
  const booksGrid = document.getElementById('books-grid');
  const bookPlayingTitle = document.getElementById('book-playing-title');
  const bookCurrentSentence = document.getElementById('book-current-sentence');
  const bookProgressFill = document.getElementById('book-progress-fill');
  const btnBookPlayToggle = document.getElementById('btn-book-play-toggle');
  const btnBookCtrlCenter = document.getElementById('btn-book-ctrl-center');

  let activeBook = null;
  let bookAudio = null;
  let bookSentenceInterval = null;
  let isBookPlaying = false;

  function initBooksView() {
    if (booksSelectorScreen && booksPlayerScreen) {
      booksSelectorScreen.classList.remove('hidden');
      booksPlayerScreen.classList.add('hidden');
    }
    stopBookPlayback();
    renderBooksGrid();
  }

  function renderBooksGrid() {
    if (!booksGrid || !window.AUDIO_BOOKS) return;
    booksGrid.innerHTML = '';

    window.AUDIO_BOOKS.forEach(book => {
      const card = document.createElement('button');
      card.className = 'book-card scannable';
      card.innerHTML = `
        <span class="b-icon">${book.icon}</span>
        <div class="b-info">
          <div class="b-title">${book.title}</div>
          <div class="b-author">${book.author}</div>
          <div class="b-genre">${book.genre}</div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        e.stopPropagation();
        selectBook(book);
      });

      booksGrid.appendChild(card);
    });

    if (scanner.supportEnabled) {
      setTimeout(() => scanner.start(), 200);
    }
  }

  function selectBook(book) {
    activeBook = book;
    if (booksSelectorScreen) booksSelectorScreen.classList.add('hidden');
    if (booksPlayerScreen) booksPlayerScreen.classList.remove('hidden');

    if (bookPlayingTitle) {
      bookPlayingTitle.textContent = `${book.title} - ${book.author}`;
    }

    startBookPlayback(book);

    if (scanner.supportEnabled) {
      setTimeout(() => scanner.start(), 300);
    }
  }

  function startBookPlayback(book) {
    stopBookPlayback();

    bookAudio = new Audio(book.audioSrc);
    isBookPlaying = true;
    updateBookPlayButtons(true);

    let currentSentenceIdx = 0;
    const sentences = book.sentences || ['朗読を開始します...'];
    
    if (bookCurrentSentence) {
      bookCurrentSentence.textContent = sentences[0];
    }

    bookAudio.play().catch(e => console.warn('Audio play error:', e));

    // 音声の進行に合わせて一文ずつ表示を切り替える
    bookAudio.addEventListener('timeupdate', () => {
      if (!bookAudio.duration) return;
      const progress = (bookAudio.currentTime / bookAudio.duration) * 100;
      if (bookProgressFill) {
        bookProgressFill.style.width = `${progress}%`;
      }

      // 時間比率でセンテンスを更新
      const targetIdx = Math.min(
        sentences.length - 1,
        Math.floor((bookAudio.currentTime / bookAudio.duration) * sentences.length)
      );

      if (targetIdx !== currentSentenceIdx) {
        currentSentenceIdx = targetIdx;
        if (bookCurrentSentence) {
          bookCurrentSentence.style.opacity = '0';
          bookCurrentSentence.style.transform = 'translateY(8px)';
          setTimeout(() => {
            bookCurrentSentence.textContent = sentences[currentSentenceIdx];
            bookCurrentSentence.style.opacity = '1';
            bookCurrentSentence.style.transform = 'translateY(0)';
          }, 200);
        }
      }
    });

    bookAudio.addEventListener('ended', () => {
      isBookPlaying = false;
      updateBookPlayButtons(false);
      if (bookCurrentSentence) {
        bookCurrentSentence.textContent = '【おわり】ボタンを押すと最初から再生します';
      }
    });
  }

  function toggleBookPlay() {
    if (!bookAudio) return;
    if (isBookPlaying) {
      bookAudio.pause();
      isBookPlaying = false;
      updateBookPlayButtons(false);
    } else {
      bookAudio.play();
      isBookPlaying = true;
      updateBookPlayButtons(true);
    }
  }

  function updateBookPlayButtons(playing) {
    const text = playing ? '⏸️ 一時停止' : '▶️ 再開する';
    if (btnBookPlayToggle) btnBookPlayToggle.textContent = text;
    if (btnBookCtrlCenter) btnBookCtrlCenter.textContent = text;
  }

  function rewindBook() {
    if (!bookAudio) return;
    bookAudio.currentTime = Math.max(0, bookAudio.currentTime - 10);
  }

  function forwardBook() {
    if (!bookAudio || !activeBook) return;
    const sentences = activeBook.sentences || [];
    const stepSec = (bookAudio.duration || 60) / sentences.length;
    bookAudio.currentTime = Math.min(bookAudio.duration - 1, bookAudio.currentTime + stepSec);
  }

  function stopBookPlayback() {
    if (bookAudio) {
      bookAudio.pause();
      bookAudio = null;
    }
    isBookPlaying = false;
    clearInterval(bookSentenceInterval);
  }

  function backToBooksList() {
    stopBookPlayback();
    if (booksPlayerScreen) booksPlayerScreen.classList.add('hidden');
    if (booksSelectorScreen) booksSelectorScreen.classList.remove('hidden');
    if (scanner.supportEnabled) {
      setTimeout(() => scanner.start(), 300);
    }
  }

  // 朗読プレイヤーボタンイベント
  document.querySelectorAll('[data-action="book-toggle-play"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleBookPlay();
    });
  });

  document.querySelectorAll('[data-action="book-rewind"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      rewindBook();
    });
  });

  document.querySelectorAll('[data-action="book-forward"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      forwardBook();
    });
  });

  document.querySelectorAll('[data-action="back-to-books-list"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      backToBooksList();
    });
  });

  // ----------------------------------------------------
  // 7. おはなしカード（意思伝達・ボイス）＆ 痛い部位選択
  // ----------------------------------------------------
  const voiceMainGrid = document.getElementById('voice-main-grid');
  const voicePainGrid = document.getElementById('voice-pain-grid');
  const voiceViewTitle = document.getElementById('voice-view-title');
  const voiceViewHint = document.getElementById('voice-view-hint');
  const voiceLastSpoken = document.getElementById('voice-last-spoken');
  const voiceTextDisplay = document.getElementById('voice-text-display');

  function showPainMenu() {
    if (voiceMainGrid && voicePainGrid) {
      voiceMainGrid.classList.add('hidden');
      voicePainGrid.classList.remove('hidden');
      if (voiceViewTitle) voiceViewTitle.textContent = '⚡ どこが痛いですか？';
      if (voiceViewHint) voiceViewHint.textContent = '痛い場所を選んでください';
      scanner.restart();
    }
  }

  function showMainVoiceMenu() {
    if (voiceMainGrid && voicePainGrid) {
      voicePainGrid.classList.add('hidden');
      voiceMainGrid.classList.remove('hidden');
      if (voiceViewTitle) voiceViewTitle.textContent = 'おはなしカード';
      if (voiceViewHint) voiceViewHint.textContent = '押すと声でお知らせします';
      scanner.restart();
    }
  }

  // 痛い部位メニューを開く
  document.querySelectorAll('[data-action="open-pain-menu"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      // まず「痛いです」と発声
      if (window.audioManager) {
        window.audioManager.playPhrase('pain', '痛いです、助けてください');
      }
      if (voiceTextDisplay && voiceLastSpoken) {
        voiceTextDisplay.textContent = '「痛いです」';
        voiceLastSpoken.classList.remove('hidden');
      }
      setTimeout(() => {
        showPainMenu();
      }, 500);
    });
  });

  // 部位メニューからメインメニューへ戻る
  document.querySelectorAll('[data-action="back-to-main-voice"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showMainVoiceMenu();
    });
  });

  // 全てのボイスカードのクリック共通処理
  document.querySelectorAll('.voice-card').forEach(card => {
    card.addEventListener('click', (e) => {
      e.stopPropagation();
      // 部位切り替えアクションのボタンは個別で処理済み
      if (card.dataset.action === 'open-pain-menu' || card.dataset.action === 'back-to-main-voice') return;

      const voiceKey = card.dataset.voiceKey;
      const phrase = card.dataset.phrase || card.querySelector('.v-text').textContent;

      if (voiceKey && window.audioManager) {
        window.audioManager.playPhrase(voiceKey, phrase);
      } else if (phrase && window.audioManager) {
        window.audioManager.speak(phrase);
      }

      if (phrase && voiceTextDisplay && voiceLastSpoken) {
        voiceTextDisplay.textContent = `「${phrase}」`;
        voiceLastSpoken.classList.remove('hidden');
        setTimeout(() => {
          voiceLastSpoken.classList.add('hidden');
        }, 4000);
      }
    });
  });

  // ----------------------------------------------------
  // 8. Google 認証 & ドライブ同期 UI制御
  // ----------------------------------------------------
  const googleAuthModal = document.getElementById('google-auth-modal');
  const btnGoogleAuth = document.getElementById('btn-google-auth');
  const btnCloseAuthModal = document.getElementById('btn-close-auth-modal');
  const btnSaveClientIdLogin = document.getElementById('btn-save-client-id-login');
  const btnDemoLogin = document.getElementById('btn-demo-login');
  const btnGoogleLogout = document.getElementById('btn-google-logout');
  const btnManualSync = document.getElementById('btn-manual-sync');
  const authUnregisteredView = document.getElementById('auth-unregistered-view');
  const authRegisteredView = document.getElementById('auth-registered-view');

  function updateAuthModalView() {
    if (window.googleDriveSync.isAuthorized && window.googleDriveSync.userProfile) {
      if (authUnregisteredView) authUnregisteredView.classList.add('hidden');
      if (authRegisteredView) authRegisteredView.classList.remove('hidden');
    } else {
      if (authUnregisteredView) authUnregisteredView.classList.remove('hidden');
      if (authRegisteredView) authRegisteredView.classList.add('hidden');
    }
  }

  function openGoogleAuthModal() {
    if (googleAuthModal) {
      updateAuthModalView();
      googleAuthModal.classList.remove('hidden');
    }
  }

  function closeGoogleAuthModal() {
    if (googleAuthModal) {
      googleAuthModal.classList.add('hidden');
    }
  }

  if (btnGoogleAuth) {
    btnGoogleAuth.addEventListener('click', (e) => {
      e.stopPropagation();
      openGoogleAuthModal();
    });
  }

  if (btnCloseAuthModal) {
    btnCloseAuthModal.addEventListener('click', (e) => {
      e.stopPropagation();
      closeGoogleAuthModal();
    });
  }

  // ワンクリックでGoogleログイン
  if (btnSaveClientIdLogin) {
    btnSaveClientIdLogin.addEventListener('click', (e) => {
      e.stopPropagation();
      window.googleDriveSync.login();
    });
  }

  // デモログイン（体験用）
  if (btnDemoLogin) {
    btnDemoLogin.addEventListener('click', (e) => {
      e.stopPropagation();
      window.googleDriveSync.isAuthorized = true;
      window.googleDriveSync.userProfile = {
        name: '竜馬（お父さん共有アカウント）',
        email: 'ryoma@example.com',
        picture: 'icon.svg'
      };
      localStorage.setItem(window.googleDriveSync.STORAGE_KEY_USER, JSON.stringify(window.googleDriveSync.userProfile));
      window.googleDriveSync.updateUI();
      updateAuthModalView();
      closeGoogleAuthModal(); // 自動で閉じる！
      window.googleDriveSync.showSyncToast('☁️ ログイン完了：Googleドライブ同期が有効になりました');
    });
  }

  if (btnGoogleLogout) {
    btnGoogleLogout.addEventListener('click', (e) => {
      e.stopPropagation();
      window.googleDriveSync.logout();
      updateAuthModalView();
      window.googleDriveSync.showSyncToast('ログアウトしました（端末内データで動作中）');
    });
  }

  if (btnManualSync) {
    btnManualSync.addEventListener('click', (e) => {
      e.stopPropagation();
      window.googleDriveSync.saveToDrive();
    });
  }

  // 初期UI更新
  if (window.googleDriveSync) {
    window.googleDriveSync.updateUI();
  }

  // スキャン開始
  scanner.start();
});
