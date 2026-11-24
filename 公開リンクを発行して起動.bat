@echo off
chcp 65001 > nul
echo ============================================================
echo   OneTouch+（ワンタッチプラス）外部公開リンク起動
echo ============================================================
echo.
cd /d "%~dp0"

echo 1. Webサーバーを起動中...
start "OneTouch_Server" /min cmd /c "python -m http.server 8080"

timeout /t 2 > nul

echo 2. お父さんのタブレットやスマホからアクセスできる公開リンクを作成中...
echo （数秒後に「https://xxxx.trycloudflare.com」が表示されます）
echo ------------------------------------------------------------
npx --yes cloudflared tunnel --url http://localhost:8080

pause
