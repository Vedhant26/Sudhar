@echo off
echo ========================================================
echo        Sudhar Mobile Launch ^& Cloudflare Tunnel
echo ========================================================
echo.

echo [1/3] Starting Backend API (Port 8000)...
start "Sudhar Backend" cmd /k "cd /d %~dp0api && python main.py"

echo [2/3] Starting Frontend (Port 5173)...
start "Sudhar Frontend" cmd /k "cd /d %~dp0web && npm run dev"

timeout /t 3 >nul

echo [3/3] Starting Cloudflare HTTPS Tunnel...
echo.
echo Scan the QR code or use the https://*.trycloudflare.com link generated below:
echo.
npx -y cloudflared tunnel --protocol http2 --url http://localhost:5173
pause
