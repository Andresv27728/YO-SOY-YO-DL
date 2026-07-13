@echo off
title YO SOY YO DL - Instalador Automatico
color 0B
mode con: cols=70 lines=40

echo.
echo   ╔══════════════════════════════════════════════════╗
echo   ║         YO SOY YO DL - YT Player               ║
echo   ║         Instalador Automatico v2.0              ║
echo   ╚══════════════════════════════════════════════════╝
echo.

set "REPO_URL=https://github.com/YOUR_USERNAME/yt-player.git"
set "INSTALL_DIR=%USERPROFILE%\YO-SOY-YO-DL"

echo   [1/6] Verificando Node.js...
echo.

where node >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Node.js encontrado:
    node --version
    goto :checkGit
)

echo   [!] Node.js no encontrado.
echo   [~] Descargando e instalando Node.js...
echo.

set "NODE_URL=https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi"
set "NODE_INSTALLER=%TEMP%\node_installer.msi"

echo   Descargando Node.js v20.18.1...
echo   (esto puede tardar unos minutos)
echo.

curl -L -o "%NODE_INSTALLER%" "%NODE_URL%" 2>nul
if %errorlevel% neq 0 (
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%NODE_URL%', '%NODE_INSTALLER%')"
)

if not exist "%NODE_INSTALLER%" (
    echo.
    echo   [ERROR] No se pudo descargar Node.js.
    echo   Instala manualmente desde: https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo   Instalando Node.js (puede pedir permisos de admin)...
echo.
msiexec /i "%NODE_INSTALLER%" /qn /norestart
if %errorlevel% neq 0 (
    echo   [!] Intentando con permisos elevados...
    powershell -Command "Start-Process msiexec.exe -ArgumentList '/i \"%NODE_INSTALLER%\" /qn /norestart' -Verb RunAs -Wait"
)

set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\node;%PATH%"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   [ERROR] Node.js no se pudo instalar.
    echo   Instala manualmente desde: https://nodejs.org
    pause
    exit /b 1
)

echo   [OK] Node.js instalado correctamente:
node --version
del "%NODE_INSTALLER%" >nul 2>&1

:checkGit
echo.
echo   [2/6] Verificando Git...
echo.

where git >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Git encontrado.
    goto :clone
)

echo   [!] Git no encontrado.
echo   [~] Descargando e instalando Git...
echo.

set "GIT_URL=https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/Git-2.47.1-64-bit.exe"
set "GIT_INSTALLER=%TEMP%\git_installer.exe"

echo   Descargando Git...
echo.

curl -L -o "%GIT_INSTALLER%" "%GIT_URL%" 2>nul
if %errorlevel% neq 0 (
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('%GIT_URL%', '%GIT_INSTALLER%')"
)

if not exist "%GIT_INSTALLER%" (
    echo.
    echo   [ERROR] No se pudo descargar Git.
    echo   Instala manualmente desde: https://git-scm.com
    echo.
    pause
    exit /b 1
)

echo   Instalando Git (puede pedir permisos de admin)...
echo.

"%GIT_INSTALLER%" /VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS="icons,ext\reg\shellhere,assoc,assoc_sh"
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%GIT_INSTALLER%' -ArgumentList '/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /RESTARTAPPLICATIONS /COMPONENTS=\"icons,ext\reg\shellhere,assoc,assoc_sh\"' -Verb RunAs -Wait"
)

set "PATH=%ProgramFiles%\Git\cmd;%PATH%"

where git >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   [ERROR] Git no se pudo instalar.
    echo   Instala manualmente desde: https://git-scm.com
    pause
    exit /b 1
)

echo   [OK] Git instalado correctamente.
del "%GIT_INSTALLER%" >nul 2>&1

:clone
echo.
echo   [3/6] Clonando repositorio...
echo.

if exist "%INSTALL_DIR%" (
    echo   [~] Directorio ya existe, actualizando...
    cd /d "%INSTALL_DIR%"
    git pull
    goto :installDeps
)

echo   Clonando en: %INSTALL_DIR%
echo.

git clone "%REPO_URL%" "%INSTALL_DIR%"
if %errorlevel% neq 0 (
    echo.
    echo   [ERROR] No se pudo clonar el repositorio.
    echo   Verifica tu conexion a internet.
    pause
    exit /b 1
)

cd /d "%INSTALL_DIR%"
echo   [OK] Repositorio clonado.

:installDeps
echo.
echo   [4/6] Verificando dependencias...
echo.

if exist "node_modules" (
    if exist "node_modules\electron\dist\electron.exe" (
        echo   [OK] Dependencias ya instaladas.
        goto :createShortcut
    )
)

echo   [~] Instalando dependencias (npm install)...
echo.

call npm install
if %errorlevel% neq 0 (
    echo   Reintentando...
    call npm install --force
    if %errorlevel% neq 0 (
        echo   [ERROR] No se pudieron instalar las dependencias.
        pause
        exit /b 1
    )
)

echo   [OK] Dependencias instaladas.

:createShortcut
echo.
echo   [5/6] Creando acceso directo en el escritorio...
echo.

set "SHORTCUT_VBS=%USERPROFILE%\Desktop\YO SOY YO DL.vbs"

(
    echo Set WshShell = CreateObject^("WScript.Shell"^)
    echo WshShell.CurrentDirectory = "%INSTALL_DIR%"
    echo WshShell.Run "cmd /c npm start", 0, False
) > "%SHORTCUT_VBS%"
echo   [OK] Acceso directo creado en el escritorio.

:run
if not exist "%USERPROFILE%\Desktop\Descargas" mkdir "%USERPROFILE%\Desktop\Descargas"

echo.
echo   [6/6] Iniciando YO SOY YO DL...
echo   ══════════════════════════════════════════
echo.

cd /d "%INSTALL_DIR%"
call npm start
