/**
 * drive.js - Google アカウント認証 & Google ドライブ同期モジュール
 * 各ユーザー自身のGoogleドライブに設定やお気に入りデータを安全に保存（BYOSアーキテクチャ）
 */

class GoogleDriveSync {
  constructor() {
    this.clientId = ''; // Google Cloud Consoleで発行されるクライアントID
    this.tokenClient = null;
    this.accessToken = null;
    this.userProfile = null;
    this.isAuthorized = false;
    this.fileId = null;
    this.fileName = 'OneTouch_plus_data.json';

    this.STORAGE_KEY_USER = 'onetouch_plus_user';
    this.STORAGE_KEY_CLIENT_ID = 'onetouch_plus_google_client_id';

    // 保存されているクライアントIDがあれば復元
    this.clientId = localStorage.getItem(this.STORAGE_KEY_CLIENT_ID) || '';

    this.initUserFromStorage();
  }

  initUserFromStorage() {
    try {
      const savedUser = localStorage.getItem(this.STORAGE_KEY_USER);
      if (savedUser) {
        this.userProfile = JSON.parse(savedUser);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  setClientId(newClientId) {
    this.clientId = newClientId.trim();
    localStorage.setItem(this.STORAGE_KEY_CLIENT_ID, this.clientId);
    this.initTokenClient();
  }

  initTokenClient() {
    if (!window.google || !window.google.accounts || !this.clientId) {
      return;
    }

    try {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.clientId,
        scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile',
        callback: async (resp) => {
          if (resp.error) {
            console.error('Google OAuth error:', resp);
            return;
          }
          this.accessToken = resp.access_token;
          this.isAuthorized = true;
          await this.fetchUserProfile();
          await this.syncFromDrive();
          this.updateUI();
        }
      });
    } catch (e) {
      console.warn('Google TokenClient init failed:', e);
    }
  }

  // ログイン開始
  login() {
    if (!this.clientId) {
      // クライアントID未設定の場合はデモ/設定案内モーダルを開く
      this.openClientIdPrompt();
      return;
    }

    if (!this.tokenClient) {
      this.initTokenClient();
    }

    if (this.tokenClient) {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      this.openClientIdPrompt();
    }
  }

  // ログアウト
  logout() {
    if (this.accessToken && window.google && window.google.accounts) {
      google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Access token revoked');
      });
    }
    this.accessToken = null;
    this.userProfile = null;
    this.isAuthorized = false;
    this.fileId = null;
    localStorage.removeItem(this.STORAGE_KEY_USER);
    this.updateUI();
  }

  // ユーザープロフィールの取得
  async fetchUserProfile() {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });
      if (res.ok) {
        this.userProfile = await res.json();
        localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(this.userProfile));
      }
    } catch (e) {
      console.warn('Failed to fetch userinfo:', e);
    }
  }

  // Googleドライブからデータを読み込み同期
  async syncFromDrive() {
    if (!this.accessToken) return null;

    try {
      // 1. ファイルを検索
      const q = encodeURIComponent(`name = '${this.fileName}' and trashed = false`);
      const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive`, {
        headers: { Authorization: `Bearer ${this.accessToken}` }
      });

      if (!searchRes.ok) return null;
      const data = await searchRes.json();

      if (data.files && data.files.length > 0) {
        this.fileId = data.files[0].id;
        // 2. ファイルの中身をダウンロード
        const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${this.fileId}?alt=media`, {
          headers: { Authorization: `Bearer ${this.accessToken}` }
        });
        if (fileRes.ok) {
          const syncData = await fileRes.json();
          this.applyDataToApp(syncData);
          this.showSyncToast('☁️ Googleドライブからデータを復元しました');
          return syncData;
        }
      } else {
        // まだファイルがドライブにない場合は、現在のローカル設定を初回保存
        await this.saveToDrive();
      }
    } catch (e) {
      console.warn('Drive sync failed:', e);
    }
    return null;
  }

  // アプリの現在のデータをGoogleドライブへ保存
  async saveToDrive() {
    if (!this.accessToken) {
      // 未ログイン時はLocalStorageにのみ保存
      return;
    }

    const appData = this.collectAppData();
    const content = JSON.stringify(appData, null, 2);

    try {
      if (this.fileId) {
        // 既存ファイルの更新 (PATCH)
        await fetch(`https://www.googleapis.com/upload/drive/v3/files/${this.fileId}?uploadType=media`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: content
        });
        this.showSyncToast('☁️ Googleドライブに自動保存しました');
      } else {
        // 新規ファイル作成 (POST multipart)
        const metadata = {
          name: this.fileName,
          mimeType: 'application/json',
          description: 'OneTouch+ の設定とお気に入りデータ'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([content], { type: 'application/json' }));

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: { Authorization: `Bearer ${this.accessToken}` },
          body: form
        });

        if (res.ok) {
          const resData = await res.json();
          this.fileId = resData.id;
          this.showSyncToast('☁️ Googleドライブにデータを新規保存しました');
        }
      }
    } catch (e) {
      console.warn('Save to drive failed:', e);
    }
  }

  // アプリ全体のデータを収集
  collectAppData() {
    return {
      appName: 'OneTouch+',
      version: '1.0',
      savedAt: new Date().toISOString(),
      user: this.userProfile ? { name: this.userProfile.name, email: this.userProfile.email } : null,
      settings: {
        mode: window.appScanner ? window.appScanner.mode : 'item',
        speed: window.appScanner ? window.appScanner.speed : 'v-normal',
        voiceType: window.audioManager ? window.audioManager.voiceType : 'female',
        sound: window.audioManager ? window.audioManager.soundEnabled : true
      }
    };
  }

  // ドライブから読み込んだデータをアプリに反映
  applyDataToApp(syncData) {
    if (!syncData || !syncData.settings) return;
    const s = syncData.settings;

    if (window.appScanner) {
      if (s.mode) window.appScanner.setMode(s.mode);
      if (s.speed) window.appScanner.setSpeed(s.speed);
    }
    if (window.audioManager) {
      if (s.voiceType) window.audioManager.setVoiceType(s.voiceType);
      if (s.sound !== undefined) window.audioManager.setSoundEnabled(s.sound);
    }

    // UIのラジオ・オプション状態を同期
    document.querySelectorAll('.btn-opt').forEach(btn => {
      const setting = btn.dataset.setting;
      const val = btn.dataset.val;
      if (setting === 'mode' && val === s.mode) {
        btn.parentElement.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } else if (setting === 'speed' && val === s.speed) {
        btn.parentElement.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } else if (setting === 'voice-type' && val === s.voiceType) {
        btn.parentElement.querySelectorAll('.btn-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  }

  // UI上のログインボタン・ステータス表示の更新
  updateUI() {
    const btnAuth = document.getElementById('btn-google-auth');
    const authStatus = document.getElementById('auth-user-status');
    const userName = document.getElementById('auth-user-name');
    const userAvatar = document.getElementById('auth-user-avatar');

    if (!btnAuth) return;

    if (this.isAuthorized && this.userProfile) {
      btnAuth.classList.add('logged-in');
      btnAuth.innerHTML = `
        <img class="user-avatar" src="${this.userProfile.picture || 'icon.svg'}" alt="user" />
        <span class="user-name">${this.userProfile.name || 'ログイン中'}</span>
      `;
      if (authStatus) authStatus.classList.remove('hidden');
      if (userName) userName.textContent = this.userProfile.name;
      if (userAvatar && this.userProfile.picture) userAvatar.src = this.userProfile.picture;
    } else {
      btnAuth.classList.remove('logged-in');
      btnAuth.innerHTML = `
        <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
        </svg>
        <span>Googleで保存</span>
      `;
      if (authStatus) authStatus.classList.add('hidden');
    }
  }

  // 同期完了トースト通知
  showSyncToast(msg) {
    let toast = document.getElementById('sync-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'sync-toast';
      toast.className = 'sync-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Google Client ID 設定モーダルの表示（案内）
  openClientIdPrompt() {
    const modal = document.getElementById('google-auth-modal');
    if (modal) {
      modal.classList.remove('hidden');
      const input = document.getElementById('input-google-client-id');
      if (input) input.value = this.clientId;
    }
  }
}

window.googleDriveSync = new GoogleDriveSync();
