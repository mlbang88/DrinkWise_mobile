@echo off
echo ========================================
echo   Sauvegarde avant travail distant
echo ========================================
echo.

REM Vérifier si on est dans un repo git
git rev-parse --git-dir >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Pas dans un repository Git
    pause
    exit /b 1
)

REM Afficher la branche actuelle
for /f "tokens=*" %%i in ('git branch --show-current') do set BRANCH=%%i
echo Branche actuelle: %BRANCH%
echo.

REM Vérifier s'il y a des changements
git status --porcelain >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [1/3] Verification des changements...
    for /f %%i in ('git status --porcelain ^| find /c /v ""') do set CHANGES=%%i
    
    if %CHANGES% EQU 0 (
        echo Aucun changement a sauvegarder.
        echo Vous etes deja synchronise avec GitHub.
        echo.
        pause
        exit /b 0
    )
    
    echo %CHANGES% fichier^(s^) modifie^(s^)
    echo.
)

REM Afficher les fichiers modifiés
echo Fichiers a sauvegarder:
git status --short
echo.

REM Demander confirmation
set /p confirm=Voulez-vous sauvegarder ces changements ? (O/N): 
if /i not "%confirm%"=="O" (
    echo Operation annulee.
    pause
    exit /b 1
)

REM Ajouter tous les fichiers
echo.
echo [1/3] Ajout des fichiers...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec ajout fichiers
    pause
    exit /b 1
)

REM Créer un commit avec timestamp
echo [2/3] Creation du commit...
set timestamp=%date:~-4,4%-%date:~-7,2%-%date:~-10,2% %time:~0,2%:%time:~3,2%
set timestamp=%timestamp: =0%
git commit -m "Auto-save avant travail distant - %timestamp%"
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec creation commit
    pause
    exit /b 1
)

REM Push vers GitHub
echo [3/3] Envoi vers GitHub...
git push origin %BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Echec push vers GitHub
    echo Verifiez votre connexion internet
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Sauvegarde reussie !
echo ========================================
echo.
echo Vos changements sont maintenant sur GitHub.
echo Vous pouvez travailler sur Codespaces en toute securite.
echo.
echo Branch: %BRANCH%
echo Timestamp: %timestamp%
echo.
pause
