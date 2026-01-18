@echo off
echo ========================================
echo   Recuperation changements GitHub
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

REM Vérifier s'il y a des changements locaux non committés
echo [1/4] Verification changements locaux...
git diff-index --quiet HEAD --
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Vous avez des changements locaux non commites:
    echo.
    git status --short
    echo.
    echo Que voulez-vous faire ?
    echo 1 - Les sauvegarder temporairement ^(stash^) puis recuperer GitHub
    echo 2 - Les commiter maintenant puis recuperer GitHub
    echo 3 - Les ignorer et forcer la mise a jour GitHub ^(DANGER: perd changements^)
    echo 4 - Annuler
    echo.
    set /p choice=Votre choix ^(1/2/3/4^): 
    
    if "%choice%"=="1" (
        echo.
        echo Sauvegarde temporaire des changements...
        git stash push -m "Auto-stash avant pull - %date% %time%"
        set STASHED=1
    ) else if "%choice%"=="2" (
        echo.
        echo Commit des changements locaux...
        git add .
        git commit -m "Changements locaux avant pull - %date% %time%"
        set STASHED=0
    ) else if "%choice%"=="3" (
        echo.
        echo [WARNING] Cette operation va supprimer vos changements locaux !
        set /p confirm=Etes-vous VRAIMENT sur ? ^(tapez OUI en majuscules^): 
        if not "%confirm%"=="OUI" (
            echo Operation annulee pour votre securite.
            pause
            exit /b 1
        )
        git reset --hard HEAD
        set STASHED=0
    ) else (
        echo Operation annulee.
        pause
        exit /b 1
    )
) else (
    set STASHED=0
    echo Aucun changement local.
)

REM Fetch pour voir ce qui a changé
echo.
echo [2/4] Verification des changements GitHub...
git fetch origin %BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Impossible de contacter GitHub
    echo Verifiez votre connexion internet
    pause
    exit /b 1
)

REM Comparer avec GitHub
for /f %%i in ('git rev-list HEAD..origin/%BRANCH% --count') do set COMMITS=%%i
if %COMMITS% EQU 0 (
    echo Aucun nouveau commit sur GitHub.
    echo Vous etes deja a jour !
    
    if %STASHED% EQU 1 (
        echo.
        echo Voulez-vous restaurer vos changements sauvegardes ? ^(O/N^)
        set /p restore=
        if /i "%restore%"=="O" (
            git stash pop
        )
    )
    
    echo.
    pause
    exit /b 0
)

echo %COMMITS% nouveau^(x^) commit^(s^) sur GitHub:
echo.
git log --oneline HEAD..origin/%BRANCH%
echo.

REM Pull les changements
echo [3/4] Recuperation des changements...
git pull origin %BRANCH%
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERREUR] Conflit detecte !
    echo.
    echo Les fichiers en conflit sont:
    git diff --name-only --diff-filter=U
    echo.
    echo Actions possibles:
    echo 1. Editez manuellement les fichiers en conflit
    echo 2. Cherchez les marqueurs ^<^<^<^<^<^<^< HEAD
    echo 3. Resolvez les conflits
    echo 4. Faites: git add . puis git commit
    echo.
    
    if %STASHED% EQU 1 (
        echo Note: Vos changements sont sauvegardes dans le stash
        echo Utilisez 'git stash list' pour les voir
        echo Utilisez 'git stash pop' pour les restaurer
    )
    
    pause
    exit /b 1
)

echo ✅ Recuperation reussie !

REM Restaurer les changements stashés
if %STASHED% EQU 1 (
    echo.
    echo [4/4] Restauration de vos changements locaux...
    set /p restore=Voulez-vous restaurer vos changements sauvegardes ? ^(O/N^): 
    if /i "%restore%"=="O" (
        git stash pop
        if %ERRORLEVEL% NEQ 0 (
            echo.
            echo [WARNING] Conflit lors de la restauration
            echo Vos changements sont toujours dans le stash
            echo Utilisez 'git stash list' et 'git stash show' pour les voir
        ) else (
            echo ✅ Changements locaux restaures !
        )
    ) else (
        echo Vos changements restent dans le stash
        echo Utilisez 'git stash pop' pour les restaurer plus tard
    )
)

echo.
echo ========================================
echo   ✅ Synchronisation terminee !
echo ========================================
echo.
echo Branch: %BRANCH%
echo Commits recuperes: %COMMITS%
echo.

REM Afficher l'état final
git status
echo.
pause
