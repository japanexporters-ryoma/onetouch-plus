@echo off
chcp 65001 > nul
echo ========================================================
echo  ワンボタン・ポータル サーバー起動スクリプト
echo ========================================================
echo.
echo Fireタブレットや他の端末から開く場合は、
echo 同じWi-Fiに接続した状態で下記のアドレスをブラウザに入力してください：
echo.
python -c "import socket; s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM); s.connect(('8.8.8.8', 80)); ip = s.getsockname()[0]; s.close(); print(f'   http://{ip}:8080\n   または PC上では http://localhost:8080')"
echo.
echo サーバーを終了するときは、この黒い画面を閉じるか Ctrl+C を押してください。
echo.
python -m http.server 8080
pause
