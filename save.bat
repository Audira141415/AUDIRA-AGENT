@echo off
setlocal enabledelayedexpansion

title AUDIRA-AGENT - Git Push & Auto-Save
color 0B

echo.
echo ==============================================================================
echo        🎮 AUDIRA-AGENT: CYBER GAME STUDIO - 1-CLICK GIT SAVE & PUSH
echo ==============================================================================
echo  Target Repo : https://github.com/Audira141415/AUDIRA-AGENT.git
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
    echo [*] Git repository lokal sudah aktif.
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

:: 5. Staging semua file proyek (mengikuti .gitignore)
echo.
echo [*] Melakukan staging file (git add -A)...
git add -A

:: Cek status file
git status --short
echo.

:: 6. Input pesan commit
set "DEFAULT_MSG=feat: update AUDIRA-AGENT Cyber Game Studio & Asset Command Center (%date% %time%)"
echo ------------------------------------------------------------------------------
set /p COMMIT_MSG="[?] Masukkan pesan commit (Tekan Enter untuk default): "
if "!COMMIT_MSG!"=="" (
    set "COMMIT_MSG=%DEFAULT_MSG%"
)

:: 7. Commit perubahan
echo.
echo [*] Melakukan commit dengan pesan: "!COMMIT_MSG!"
git commit -m "!COMMIT_MSG!"

if %errorlevel% neq 0 (
    echo [INFO] Tidak ada perubahan baru untuk di-commit.
) else (
    echo [OK] Commit berhasil dibuat.
)

:: 8. Push ke remote origin main
echo.
echo [*] Mengunggah (push) ke GitHub: origin/main...
git push -u origin main

if %errorlevel% neq 0 (
    echo.
    echo [!] Push pertama gagal atau remote memiliki commit berbeda.
    echo [*] Mencoba sinkronisasi (git pull --rebase origin main)...
    git pull --rebase origin main
    if %errorlevel% equ 0 (
        echo [*] Mengulang push setelah sinkronisasi...
        git push -u origin main
    )
)

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ==============================================================================
    echo  [SUCCESS] KODE DAN SCREENSHOT BERHASIL DI-PUSH KE GITHUB!
    echo  URL Repositori: https://github.com/Audira141415/AUDIRA-AGENT
    echo ==============================================================================
) else (
    color 0E
    echo.
    echo ==============================================================================
    echo  [CATATAN] Push memerlukan autentikasi GitHub atau token akses personal (PAT).
    echo  Pastikan Anda telah login ke akun GitHub (Audira141415).
    echo  Atau jalankan: git push -u origin main secara manual jika ada prompt login.
    echo ==============================================================================
)

echo.
pause
