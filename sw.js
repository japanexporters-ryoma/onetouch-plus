/**
 * sw.js - OneTouch+ 完全オフライン動作 Service Worker
 * 入院中やWi-Fiのない環境でも、朗読小説やおはなしカードが完全動作するよう全リソースをキャッシュ
 */

const CACHE_NAME = 'onetouch-plus-v5';

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
  './audio/books_sentence/chumon_7.mp3',
  './audio/books_sentence/chumon_8.mp3',
  './audio/books_sentence/chumon_9.mp3',
  './audio/books_sentence/chumon_10.mp3',
  './audio/books_sentence/chumon_11.mp3',
  './audio/books_sentence/chumon_12.mp3',
  './audio/books_sentence/chumon_13.mp3',
  './audio/books_sentence/chumon_14.mp3',
  './audio/books_sentence/chumon_15.mp3',
  './audio/books_sentence/chumon_16.mp3',
  './audio/books_sentence/chumon_17.mp3',
  './audio/books_sentence/chumon_18.mp3',
  './audio/books_sentence/chumon_19.mp3',
  './audio/books_sentence/chumon_20.mp3',
  './audio/books_sentence/chumon_21.mp3',
  './audio/books_sentence/chumon_22.mp3',
  './audio/books_sentence/chumon_23.mp3',
  './audio/books_sentence/chumon_24.mp3',
  './audio/books_sentence/chumon_25.mp3',
  './audio/books_sentence/chumon_26.mp3',
  './audio/books_sentence/chumon_27.mp3',
  './audio/books_sentence/chumon_28.mp3',
  './audio/books_sentence/chumon_29.mp3',
  './audio/books_sentence/chumon_30.mp3',
  './audio/books_sentence/chumon_31.mp3',
  './audio/books_sentence/chumon_32.mp3',
  './audio/books_sentence/chumon_33.mp3',
  './audio/books_sentence/chumon_34.mp3',
  './audio/books_sentence/chumon_35.mp3',
  './audio/books_sentence/chumon_36.mp3',
  './audio/books_sentence/chumon_37.mp3',
  './audio/books_sentence/chumon_38.mp3',
  './audio/books_sentence/chumon_39.mp3',
  './audio/books_sentence/chumon_40.mp3',
  './audio/books_sentence/chumon_41.mp3',
  './audio/books_sentence/chumon_42.mp3',
  './audio/books_sentence/chumon_43.mp3',
  './audio/books_sentence/chumon_44.mp3',
  './audio/books_sentence/chumon_45.mp3',
  './audio/books_sentence/chumon_46.mp3',
  './audio/books_sentence/chumon_47.mp3',
  './audio/books_sentence/chumon_48.mp3',
  './audio/books_sentence/chumon_49.mp3',
  './audio/books_sentence/chumon_50.mp3',
  './audio/books_sentence/chumon_51.mp3',
  './audio/books_sentence/chumon_52.mp3',
  './audio/books_sentence/chumon_53.mp3',
  './audio/books_sentence/chumon_54.mp3',
  './audio/books_sentence/chumon_55.mp3',
  './audio/books_sentence/chumon_56.mp3',
  './audio/books_sentence/chumon_57.mp3',
  './audio/books_sentence/chumon_58.mp3',
  './audio/books_sentence/chumon_59.mp3',
  './audio/books_sentence/chumon_60.mp3',
  './audio/books_sentence/chumon_61.mp3',
  './audio/books_sentence/chumon_62.mp3',
  './audio/books_sentence/chumon_63.mp3',
  './audio/books_sentence/chumon_64.mp3',
  './audio/books_sentence/chumon_65.mp3',
  './audio/books_sentence/chumon_66.mp3',
  './audio/books_sentence/chumon_67.mp3',
  './audio/books_sentence/chumon_68.mp3',
  './audio/books_sentence/chumon_69.mp3',
  './audio/books_sentence/chumon_70.mp3',
  './audio/books_sentence/chumon_71.mp3',
  './audio/books_sentence/chumon_72.mp3',
  './audio/books_sentence/chumon_73.mp3',
  './audio/books_sentence/chumon_74.mp3',
  './audio/books_sentence/chumon_75.mp3',
  './audio/books_sentence/chumon_76.mp3',
  './audio/books_sentence/chumon_77.mp3',
  './audio/books_sentence/chumon_78.mp3',
  './audio/books_sentence/chumon_79.mp3',
  './audio/books_sentence/chumon_80.mp3',
  './audio/books_sentence/chumon_81.mp3',
  './audio/books_sentence/chumon_82.mp3',
  './audio/books_sentence/chumon_83.mp3',
  './audio/books_sentence/chumon_84.mp3',
  './audio/books_sentence/chumon_85.mp3',
  './audio/books_sentence/chumon_86.mp3',
  './audio/books_sentence/chumon_87.mp3',
  './audio/books_sentence/chumon_88.mp3',
  './audio/books_sentence/chumon_89.mp3',
  './audio/books_sentence/chumon_90.mp3',
  './audio/books_sentence/chumon_91.mp3',
  './audio/books_sentence/chumon_92.mp3',
  './audio/books_sentence/chumon_93.mp3',
  './audio/books_sentence/chumon_94.mp3',
  './audio/books_sentence/chumon_95.mp3',
  './audio/books_sentence/chumon_96.mp3',
  './audio/books_sentence/chumon_97.mp3',
  './audio/books_sentence/chumon_98.mp3',
  './audio/books_sentence/chumon_99.mp3',
  './audio/books_sentence/chumon_100.mp3',
  './audio/books_sentence/chumon_101.mp3',
  './audio/books_sentence/chumon_102.mp3',
  './audio/books_sentence/chumon_103.mp3',
  './audio/books_sentence/chumon_104.mp3',
  './audio/books_sentence/chumon_105.mp3',
  './audio/books_sentence/chumon_106.mp3',
  './audio/books_sentence/chumon_107.mp3',
  './audio/books_sentence/chumon_108.mp3',
  './audio/books_sentence/chumon_109.mp3',
  './audio/books_sentence/chumon_110.mp3',
  './audio/books_sentence/chumon_111.mp3',
  './audio/books_sentence/chumon_112.mp3',
  './audio/books_sentence/chumon_113.mp3',
  './audio/books_sentence/chumon_114.mp3',
  './audio/books_sentence/chumon_115.mp3',
  './audio/books_sentence/chumon_116.mp3',
  './audio/books_sentence/chumon_117.mp3',
  './audio/books_sentence/chumon_118.mp3',
  './audio/books_sentence/chumon_119.mp3',
  './audio/books_sentence/chumon_120.mp3',
  './audio/books_sentence/chumon_121.mp3',
  './audio/books_sentence/chumon_122.mp3',
  './audio/books_sentence/chumon_123.mp3',
  './audio/books_sentence/chumon_124.mp3',
  './audio/books_sentence/chumon_125.mp3',
  './audio/books_sentence/chumon_126.mp3',
  './audio/books_sentence/chumon_127.mp3',
  './audio/books_sentence/chumon_128.mp3',
  './audio/books_sentence/chumon_129.mp3',
  './audio/books_sentence/chumon_130.mp3',
  './audio/books_sentence/chumon_131.mp3',
  './audio/books_sentence/chumon_132.mp3',
  './audio/books_sentence/chumon_133.mp3',
  './audio/books_sentence/chumon_134.mp3',
  './audio/books_sentence/chumon_135.mp3',
  './audio/books_sentence/chumon_136.mp3',
  './audio/books_sentence/chumon_137.mp3',
  './audio/books_sentence/chumon_138.mp3',
  './audio/books_sentence/chumon_139.mp3',
  './audio/books_sentence/chumon_140.mp3',
  './audio/books_sentence/chumon_141.mp3',
  './audio/books_sentence/chumon_142.mp3',
  './audio/books_sentence/chumon_143.mp3',
  './audio/books_sentence/chumon_144.mp3',
  './audio/books_sentence/chumon_145.mp3',
  './audio/books_sentence/chumon_146.mp3',
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
