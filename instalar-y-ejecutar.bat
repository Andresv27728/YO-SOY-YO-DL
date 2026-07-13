@echo off
title YT Player - Instalador y Lanzador
color 0A

echo ========================================
echo    YT Player & Downloader
echo    Instalador Automatico
echo ========================================
echo.

echo [1/2] Instalando dependencias...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Fallo la instalacion de dependencias.
    echo Verifica que Node.js este instalado.
    pause
    exit /b 1
)

echo.
echo [2/2] Iniciando la aplicacion...
echo.
call npm start

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Fallo al iniciar la aplicacion.
    pause
    exit /b 1
)
