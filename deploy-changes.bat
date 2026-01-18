@echo off
REM Script de déploiement automatique pour dev mobile (Windows)
REM Usage: deploy-changes.bat "description des changements"

echo ========================================
echo   Deploiement automatique sur GitHub
echo ========================================
echo.

REM 1. Vérifier la branche actuelle
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i
echo Branche actuelle: %BRANCH%
echo.

REM 2. Voir les fichiers modifiés
echo Fichiers modifies:
git status --short
echo.

REM 3. Ajouter tous les changements
echo Ajout des changements...
git add .
echo.

REM 4. Commit avec message
set MESSAGE=%~1
if "%MESSAGE%"=="" set MESSAGE=Update from mobile dev session
echo Commit: %MESSAGE%
git commit -m "%MESSAGE%"
echo.

REM 5. Push vers GitHub
echo Push vers GitHub...
git push origin %BRANCH%
echo.

echo ========================================
echo   Deploye avec succes!
echo ========================================
echo.
echo Vercel va redeployer automatiquement dans ~30-60 secondes
echo Rechargez: https://drink-wise-mobile.vercel.app
echo.
pause
