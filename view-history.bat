@echo off
echo 📚 HISTORIQUE DES SAUVEGARDES
echo ========================================
git log --oneline -15 --graph --decorate
echo.
echo ========================================
echo.
echo 💡 Pour récupérer une sauvegarde :
echo    1. Notez l'ID du commit (ex: 697fd1c)
echo    2. Utilisez restore-backup.bat
echo.
pause
