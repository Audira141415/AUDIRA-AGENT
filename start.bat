@echo off
title AUDIRA STUDIO 3D - Starter
color 0b
cd /d "%~dp0"

echo ======================================================================
echo    AUDIRA STUDIO 3D - AI INDIE GAME DEV ^& 3D ASSET COMMAND CENTER
echo ======================================================================
echo.

:: 1. Periksa folder node_modules
if not exist "node_modules\" (
    echo [1/3] Direktori node_modules belum ditemukan. Menginstal dependensi...
    call npm install
    if errorlevel 1 (
        echo [ERROR] Gagal menginstal dependensi. Pastikan Node.js terpasang.
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependensi node_modules terverifikasi.
)

:: Bersihkan port 5173, 5174, dan 8080 jika ada proses lama yang masih menggantung
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5173,5174,8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }" >nul 2>&1

:: 2. Jalankan Backend WebSocket & HTTP Ingestion Server (Port 8080)
echo [2/3] Menjalankan Backend WebSocket Server (Port 8080)...
start "AUDIRA-AGENT Backend Server (8080)" cmd /k "title AUDIRA-AGENT Backend Server (8080) && npm run server"

:: 3. Jalankan Frontend 3D Visualizer Vite (Port 5173) dengan force reload cache
echo [3/3] Menjalankan Frontend 3D Visualizer Vite (Port 5173)...
start "AUDIRA-AGENT 3D Visualizer (5173)" cmd /k "title AUDIRA-AGENT 3D Visualizer (5173) && npm run dev -- --force"

:: Tunggu sejenak agar server siap
timeout /t 3 /nobreak >nul

:: Buka visualizer di browser default
echo.
echo [*] Membuka visualizer di browser: http://localhost:5173/ ...
start http://localhost:5173/

echo.
echo ======================================================================
echo    Semua komponen AUDIRA STUDIO 3D telah berjalan!
echo    - Frontend 3D Visualizer : http://localhost:5173/
echo    - Live WebSocket Server  : ws://localhost:8080/
echo    - HTTP Ingestion API     : http://localhost:8080/api/agent-event
echo.
echo    Untuk menghentikan semua komponen, cukup jalankan: stop.bat
echo ======================================================================
echo.
pause
