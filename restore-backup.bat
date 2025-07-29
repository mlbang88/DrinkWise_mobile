@echo off
echo ========================================
echo    RÉCUPÉRATION DE SAUVEGARDE
echo ========================================
echo.

echo Liste des 10 dernières sauvegardes :
echo.
git log --oneline -10

echo.
echo ========================================
echo.
set /p commit_id="Entrez l'ID du commit à récupérer (ex: 697fd1c) : "

if "%commit_id%"=="" (
    echo Aucun ID fourni. Annulation.
    pause
    exit /b 1
)

echo.
echo ⚠️  ATTENTION : Cette action va remplacer votre code actuel !
echo.
set /p confirm="Êtes-vous sûr ? (oui/non) : "

if /i not "%confirm%"=="oui" (
    echo Opération annulée.
    pause
    exit /b 0
)

echo.
echo [1/3] Sauvegarde de sécurité du code actuel...
git stash push -m "Sauvegarde automatique avant récupération"

echo [2/3] Récupération du commit %commit_id%...
git checkout %commit_id% -- .

echo [3/3] Application des changements...
git add .
git commit -m "Récupération du commit %commit_id%"

echo.
echo ✅ Récupération terminée !
echo.
echo Pour annuler cette récupération, utilisez :
echo git stash pop
echo.
pause
