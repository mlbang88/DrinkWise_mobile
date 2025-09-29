@echo off
echo ========================================
echo    SAUVEGARDE + DEPLOIEMENT AUTO
echo ========================================
echo.

:: Build de l'application
echo [1/5] Build de l'application...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: Build échoué
    pause
    exit /b 1
)

:: Ajouter tous les fichiers modifiés
echo [2/5] Ajout des fichiers modifiés...
git add .
if %errorlevel% neq 0 (
    echo ERREUR: Impossible d'ajouter les fichiers
    pause
    exit /b 1
)

:: Créer un commit avec un message automatique
echo [3/5] Création du commit...
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%DD%/%MM%/%YYYY% à %HH%:%Min%"

git commit -m "Sauvegarde automatique du %timestamp%"
if %errorlevel% equ 1 (
    echo Aucun changement à sauvegarder.
    timeout /t 3 /nobreak > nul
    exit /b 0
)
if %errorlevel% neq 0 (
    echo ERREUR: Impossible de créer le commit
    pause
    exit /b 1
)

:: Envoyer sur GitHub
echo [4/5] Envoi vers GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERREUR: Impossible d'envoyer sur GitHub
    echo Vérifiez votre connexion internet
    pause
    exit /b 1
)

:: Déploiement Netlify (optionnel - déjà automatique via GitHub)
echo [5/5] ✅ Déploiement en cours sur Netlify...
echo.
echo 🚀 Sauvegarde et déploiement terminés !
echo.
echo 📱 Site web : https://drinkwiseapp.netlify.app
echo 📂 GitHub   : https://github.com/mlbang88/DrinkWise_mobile
echo.
echo Le site sera mis à jour automatiquement dans 1-3 minutes.
echo.
timeout /t 5 /nobreak > nul