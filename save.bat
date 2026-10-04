@echo off
setlocal enabledelayedexpansion

title AUDIRA-AGENT - Git Push & Auto-Save
color 0B

echo.
echo ==============================================================================
echo        🎮 AUDIRA-AGENT: CYBER GAME STUDIO - 1-CLICK GIT SAVE & PUSH
echo ==============================================================================
echo  Target Repo  : https://github.com/Audira141415/AUDIRA-AGENT.git
echo  Target Branch: main
echo ==============================================================================
echo.

:: 1. Cek apakah Git terinstal
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Git tidak terdeteksi di sistem PATH Anda!
    echo Silakan install Git for Windows dari https://git-scm.com/
    echo.
    pause
    exit /b 1
)

:: 2. Cek apakah repository git sudah diinisialisasi
if not exist ".git" (
    echo [*] Menginisialisasi Git Repository lokal baru...
    git init -b main
    if %errorlevel% neq 0 (
        git init
        git branch -M main
    )
    echo [OK] Git repository berhasil diinisialisasi.
) else (
    echo [*] Git repository lokal terdeteksi aktif.
)

:: 3. Pastikan branch bernama main
git branch -M main >nul 2>nul

:: 4. Cek dan konfigurasi remote origin
git remote get-url origin >nul 2>nul
if %errorlevel% neq 0 (
    echo [*] Menambahkan remote origin: https://github.com/Audira141415/AUDIRA-AGENT.git
    git remote add origin https://github.com/Audira141415/AUDIRA-AGENT.git
) else (
    echo [*] Menyelaraskan remote origin ke: https://github.com/Audira141415/AUDIRA-AGENT.git
    git remote set-url origin https://github.com/Audira141415/AUDIRA-AGENT.git
)

:: 5. Fetch status remote terbaru
echo [*] Memeriksa status remote GitHub...
git fetch origin main >nul 2>nul

:: 6. Periksa perubahan file lokal
echo [*] Memeriksa status perubahan file...
set HAS_CHANGES=0
for /f "tokens=*" %%i in ('git status --porcelain') do (
    set HAS_CHANGES=1
)

if "!HAS_CHANGES!"=="1" (
    echo.
    echo [*] Terdeteksi perubahan file lokal:
    git status --short
    echo.
    
    :: Staging semua file
    echo [*] Melakukan staging file (git add -A)...
    git add -A

    :: Input pesan commit
    set "DEFAULT_MSG=feat: update AUDIRA-AGENT Cyber Game Studio & Asset Command Center (%date% %time%)"
    echo ------------------------------------------------------------------------------
    set /p COMMIT_MSG="[?] Masukkan pesan commit (Tekan Enter untuk default): "
    if "!COMMIT_MSG!"=="" (
        set "COMMIT_MSG=!DEFAULT_MSG!"
    )

    :: Commit perubahan
    echo [*] Melakukan commit: "!COMMIT_MSG!"
    git commit -m "!COMMIT_MSG!"
    if %errorlevel% equ 0 (
        echo [OK] Commit berhasil dibuat.
    )
) else (
    echo [OK] Tidak ada file baru atau file yang dimodifikasi (working tree clean).
)

:: 7. Push ke remote origin main
echo.
echo [*] Mengunggah dan menyinkronkan ke GitHub (origin/main)...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [!] Terjadi kendala saat push. Melakukan sinkronisasi otomatis...
    timeout /t 2 /nobreak >nul
    git fetch origin main >nul 2>nul
    git pull --rebase origin main
    echo [*] Mengulang push setelah sinkronisasi...
    git push -u origin main
)

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ==============================================================================
    echo  [SUCCESS] SELURUH KODE, ASET 3D, DAN SCREENSHOT SUDAH SINKRON DI GITHUB!
    echo  Repositori: https://github.com/Audira141415/AUDIRA-AGENT
    echo  Branch    : main (Up-to-Date)
    echo ==============================================================================
) else (
    color 0E
    echo.
    echo ==============================================================================
    echo  [INFO] Jika GitHub meminta login atau izin akun Audira141415,
    echo  silakan jalankan perintah manual: git push -u origin main
    echo  atau pastikan Personal Access Token (PAT) Anda aktif.
    echo ==============================================================================
)

echo.
pause
