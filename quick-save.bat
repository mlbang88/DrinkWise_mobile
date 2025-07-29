@echo off
:: Sauvegarde rapide sans confirmation
git add . && git commit -m "Quick save %date% %time%" && git push origin main
if %errorlevel% equ 0 (
    echo ✅ Sauvegarde rapide terminée !
) else (
    echo ❌ Erreur lors de la sauvegarde
)
timeout /t 2 /nobreak > nul
