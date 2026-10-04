@echo off
title AUDIRA NOC 3D - Stopper
color 0c
cd /d "%~dp0"

echo ======================================================================
echo    MENGHENTIKAN SEMUA KOMPONEN AUDIRA NOC 3D
echo ======================================================================
echo.

echo [*] Menghentikan proses pada port 5173-5175 (Vite) dan 8080 (Node Server)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-NetTCPConnection -LocalPort 5173,5174,5175,8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }"

echo [*] Menutup jendela konsol AUDIRA-AGENT...
taskkill /FI "WINDOWTITLE eq AUDIRA-AGENT Backend Server (8080)*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AUDIRA-AGENT 3D Visualizer (5173)*" /F >nul 2>&1

echo.
echo ======================================================================
echo    [OK] Semua layanan AUDIRA NOC 3D berhasil dihentikan.
echo    Port 5173 dan Port 8080 telah bersih dan bebas digunakan.
echo ======================================================================
echo.
timeout /t 3
