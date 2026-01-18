@echo off
echo ========================================
echo   Exposition du localhost avec ngrok
echo ========================================
echo.

echo 1. Demarrage du serveur Vite...
start cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 5

echo.
echo 2. Installation/Lancement de ngrok...
echo.
echo IMPORTANT: Si ngrok n'est pas installe, installez-le depuis https://ngrok.com/download
echo.

REM Vérifier si ngrok est installé
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: ngrok n'est pas installe ou pas dans le PATH
    echo.
    echo Veuillez:
    echo 1. Telecharger ngrok depuis https://ngrok.com/download
    echo 2. Creer un compte gratuit sur ngrok.com
    echo 3. Executer: ngrok config add-authtoken VOTRE_TOKEN
    echo 4. Relancer ce script
    pause
    exit /b 1
)

echo Ngrok detecte! Exposition du port 5173...
echo.
echo COPIEZ L'URL HTTPS qui apparaitra ci-dessous pour y acceder depuis votre telephone!
echo.

ngrok http 5173

pause
