@echo off
REM Script pour exposer votre localhost avec ngrok
REM Usage: double-cliquer ou lancer depuis le terminal

echo ========================================
echo   Exposition du localhost DrinkWise
echo ========================================
echo.

REM Vérifier si ngrok est installé
where ngrok >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] ngrok n'est pas installe.
    echo.
    echo Installation rapide:
    echo 1. Telecharger: https://ngrok.com/download
    echo 2. Extraire ngrok.exe
    echo 3. Placer dans C:\Windows ou ajouter au PATH
    echo 4. Creer un compte gratuit sur ngrok.com
    echo 5. Configurer: ngrok authtoken VOTRE_TOKEN
    echo.
    pause
    exit /b 1
)

echo [OK] ngrok est installe
echo.

REM Vérifier si le serveur dev tourne sur le port 5173
netstat -ano | findstr ":5173" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ATTENTION] Le serveur Vite ne semble pas tourner sur le port 5173
    echo Lancez 'npm run dev' dans un autre terminal
    echo.
    echo Continuer quand meme? (O/N)
    set /p continue=
    if /i not "%continue%"=="O" (
        exit /b 1
    )
)

echo.
echo ========================================
echo   Demarrage du tunnel ngrok
echo ========================================
echo.
echo L'URL publique sera affichee ci-dessous.
echo Partagez cette URL pour acceder au localhost depuis n'importe ou.
echo.
echo ATTENTION: Cette URL est publique! Ne partagez qu'avec des personnes de confiance.
echo.
echo Appuyez sur Ctrl+C pour arreter le tunnel.
echo.

REM Lancer ngrok
ngrok http 5173 --region eu
