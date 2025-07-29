@echo off
echo ========================================
echo    SAUVEGARDE AUTOMATIQUE GITHUB
echo ========================================
echo.

:: Ajouter tous les fichiers modifiés
echo [1/4] Ajout des fichiers modifiés...
git add .
if %errorlevel% neq 0 (
    echo ERREUR: Impossible d'ajouter les fichiers
    pause
    exit /b 1
)

:: Créer un commit avec un message automatique
echo [2/4] Création du commit...
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
echo [3/4] Envoi vers GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERREUR: Impossible d'envoyer sur GitHub
    echo Vérifiez votre connexion internet
    pause
    exit /b 1
)

:: Succès
echo [4/4] ✅ Sauvegarde terminée avec succès !
echo.
echo Votre code a été sauvegardé sur GitHub :
echo https://github.com/mlbang88/DrinkWise_mobile
echo.
timeout /t 5 /nobreak > nul
