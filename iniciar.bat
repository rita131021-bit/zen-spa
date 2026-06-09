@echo off
title Zen Spa - Iniciando servidores...
echo.
echo ========================================
echo    ZEN SPA PARA MASCOTAS
echo    Iniciando servidores...
echo ========================================
echo.

:: Matar procesos previos en puertos 3000 y 3001
echo Limpiando puertos anteriores...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Esperar un segundo
timeout /t 2 /nobreak >nul

:: Iniciar backend
echo Iniciando backend (puerto 3001)...
start "ZEN SPA - Backend" cmd /k "cd /d C:\Users\carol\proyectos\zen-spa\zen-spa-backend && npm start"

:: Esperar que el backend arranque
timeout /t 4 /nobreak >nul

:: Iniciar frontend
echo Iniciando frontend (puerto 3000)...
start "ZEN SPA - Frontend" cmd /k "cd /d C:\Users\carol\proyectos\zen-spa\zen-spa-admin && npm run dev"

:: Esperar que el frontend compile
echo.
echo Esperando que compile el frontend...
timeout /t 12 /nobreak >nul

:: Abrir navegador
echo Abriendo navegador...
start http://localhost:3000

echo.
echo ========================================
echo    Zen Spa corriendo en localhost:3000
echo ========================================
echo.
pause
