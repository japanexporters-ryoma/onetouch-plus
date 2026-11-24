/**
 * sw.js - OneTouch+ 完全オフライン動作 Service Worker
 * 入院中やWi-Fiのない環境でも、朗読小説やおはなしカードが完全動作するよう全リソースをキャッシュ
 */

const CACHE_NAME = 'onetouch-plus-v3';

// オフラインキャッシュ対象の完全リスト
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './css/style.css',
  './js/app.js',
  './js/audio.js',
  './js/books-data.js',
  './js/drive.js',
  './js/scanner.js',
  
  // 朗読小説 センテンス完全同期音声ファイル
  './audio/books_sentence/botchan_0.mp3',
  './audio/books_sentence/botchan_1.mp3',
  './audio/books_sentence/botchan_2.mp3',
  './audio/books_sentence/botchan_3.mp3',
  './audio/books_sentence/botchan_4.mp3',
  './audio/books_sentence/chumon_0.mp3',
  './audio/books_sentence/chumon_1.mp3',
  './audio/books_sentence/chumon_2.mp3',
  './audio/books_sentence/chumon_3.mp3',
  './audio/books_sentence/chumon_4.mp3',
  './audio/books_sentence/chumon_5.mp3',
  './audio/books_sentence/chumon_6.mp3',
  './audio/books_sentence/kumo_0.mp3',
  './audio/books_sentence/kumo_1.mp3',
  './audio/books_sentence/kumo_2.mp3',
  './audio/books_sentence/kumo_3.mp3',
  './audio/books_sentence/kumo_4.mp3',
  './audio/books_sentence/kumo_5.mp3',
  './audio/books_sentence/kumo_6.mp3',
  './audio/books_sentence/meros_0.mp3',
  './audio/books_sentence/meros_1.mp3',
  './audio/books_sentence/meros_2.mp3',
  './audio/books_sentence/meros_3.mp3',
  './audio/books_sentence/meros_4.mp3',
  './audio/books_sentence/meros_5.mp3',
  './audio/books_sentence/meros_6.mp3',
  './audio/books_sentence/meros_7.mp3',
  './audio/books_sentence/meros_8.mp3',
  './audio/books_sentence/meros_9.mp3',
  './audio/books_sentence/meros_10.mp3',
  './audio/books_sentence/meros_11.mp3',
  './audio/books_sentence/meros_12.mp3',
  './audio/books_sentence/meros_13.mp3',
  './audio/books_sentence/meros_14.mp3',
  './audio/books_sentence/meros_15.mp3',
  './audio/books_sentence/meros_16.mp3',
  './audio/books_sentence/meros_17.mp3',
  './audio/books_sentence/meros_18.mp3',
  './audio/books_sentence/meros_19.mp3',
  './audio/books_sentence/meros_20.mp3',
  './audio/books_sentence/meros_21.mp3',
  './audio/books_sentence/meros_22.mp3',
  './audio/books_sentence/meros_23.mp3',
  './audio/books_sentence/zenigata_0.mp3',
  './audio/books_sentence/zenigata_1.mp3',
  './audio/books_sentence/zenigata_2.mp3',
  './audio/books_sentence/zenigata_3.mp3',
  './audio/books_sentence/zenigata_4.mp3',
  './audio/books_sentence/zenigata_5.mp3',

  // おはなしカード 音声ファイル（女性）
  './audio/voice/tea.mp3',
  './audio/voice/thanks.mp3',
  './audio/voice/tv.mp3',
  './audio/voice/yes.mp3',
  './audio/voice/no.mp3',
  './audio/voice/pain.mp3',
  './audio/voice/turn.mp3',
  './audio/voice/call.mp3',
  './audio/voice/pain_head.mp3',
  './audio/voice/pain_stomach.mp3',
  './audio/voice/pain_urine.mp3',
  './audio/voice/pain_arm.mp3',
  './audio/voice/pain_leg.mp3',
  './audio/voice/pain_back.mp3',
  './audio/voice/pain_general.mp3',

  // おはなしカード 音声ファイル（男性）
  './audio/voice_male/tea.mp3',
  './audio/voice_male/thanks.mp3',
  './audio/voice_male/tv.mp3',
  './audio/voice_male/yes.mp3',
  './audio/voice_male/no.mp3',
  './audio/voice_male/pain.mp3',
  './audio/voice_male/turn.mp3',
  './audio/voice_male/call.mp3',
  './audio/voice_male/pain_head.mp3',
  './audio/voice_male/pain_stomach.mp3',
  './audio/voice_male/pain_urine.mp3',
  './audio/voice_male/pain_arm.mp3',
  './audio/voice_male/pain_leg.mp3',
  './audio/voice_male/pain_back.mp3',
  './audio/voice_male/pain_general.mp3'
];

// インストール時にすべて先回りキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline assets...');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 古いキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// リクエスト種別に応じた戦略（プログラムファイルは Network First、音声・画像等は Cache First）
self.addEventListener('fetch', (event) => {
  // YouTube動画のストリーミングやGoogle API・外部フォントはネットワーク優先
  if (event.request.url.includes('youtube.com') || 
      event.request.url.includes('googlevideo.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('accounts.google.com') ||
      event.request.url.includes('gstatic.com')) {
    return;
  }

  const url = new URL(event.request.url);
  const isCodeAsset = url.pathname.endsWith('.html') || 
                      url.pathname.endsWith('.js') || 
                      url.pathname.endsWith('.css') || 
                      url.pathname.endsWith('/') || 
                      url.pathname === '';

  if (isCodeAsset) {
    // プログラムコード: Network First (最新の修正を即座に反映、オフライン時はキャッシュ)
    event.respondWith(
      fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        return caches.match(event.request).then((cached) => cached || caches.match('./index.html'));
      })
    );
  } else {
    // 音声・画像・静的アセット: Cache First (高速レスポンス & オフライン優先)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
  }
});
