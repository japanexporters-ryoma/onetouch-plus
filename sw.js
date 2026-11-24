/**
 * sw.js - OneTouch+ 完全オフライン動作 Service Worker
 * 入院中やWi-Fiのない環境でも、朗読小説やおはなしカードが完全動作するよう全リソースをキャッシュ
 */

const CACHE_NAME = 'onetouch-plus-v1';

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
  
  // 朗読小説 音声ファイル
  './audio/books/meros.mp3',
  './audio/books/chumon.mp3',
  './audio/books/kumo.mp3',
  './audio/books/zenigata.mp3',
  './audio/books/botchan.mp3',

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

// オフライン優先（Cache First, Network Fallback）
self.addEventListener('fetch', (event) => {
  // YouTube動画のストリーミングやGoogle APIはネットワーク優先
  if (event.request.url.includes('youtube.com') || 
      event.request.url.includes('googlevideo.com') ||
      event.request.url.includes('googleapis.com') ||
      event.request.url.includes('accounts.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // 成功したレスポンスを動的キャッシュ
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // オフライン時のフォールバック
        return caches.match('./index.html');
      });
    })
  );
});
