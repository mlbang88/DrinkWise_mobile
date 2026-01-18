# 🔄 Workflow de synchronisation PC ↔️ GitHub

## 📋 Le problème

Si vous modifiez des fichiers sur GitHub Codespaces demain, votre PC local ne sera plus à jour.

## ✅ La solution : `git pull`

### 🏠 Quand vous revenez sur votre PC

```bash
# 1. Vérifier votre branche actuelle
git branch

# 2. Récupérer les changements de GitHub
git pull origin main

# 3. Si vous avez des changements locaux non committés
git stash          # Sauvegarder temporairement vos changements
git pull origin main
git stash pop      # Récupérer vos changements
```

---

## 🎯 Workflow recommandé

### ⚠️ **AVANT de travailler ailleurs (Codespaces, autre PC)**

Sur votre PC :
```bash
# Toujours commit et push vos changements locaux
git add .
git commit -m "Sauvegarde avant travail distant"
git push origin main
```

### 💻 **Sur GitHub Codespaces**

```bash
# Travailler normalement
git add .
git commit -m "Changements depuis Codespaces"
git push origin main
```

### 🏠 **Retour sur votre PC**

```bash
# Récupérer les changements
git pull origin main
```

---

## 🚨 Scénarios problématiques et solutions

### Scénario 1 : Vous avez modifié les mêmes fichiers

```bash
# Sur PC avant de pull
git stash                    # Sauvegarder vos modifs locales
git pull origin main         # Récupérer les changements GitHub
git stash pop                # Réappliquer vos modifs

# Si conflit
# Git vous montrera les fichiers en conflit
# Éditez-les manuellement pour résoudre
git add .
git commit -m "Résolution conflits"
```

### Scénario 2 : Vous avez oublié de commit avant de partir

```bash
# Sur Codespaces
# ⚠️ Attention ! Vous risquez d'avoir des différences

# Solution 1 : Créer une branche temporaire
git checkout -b temp-codespaces
# Travaillez dessus
git push origin temp-codespaces

# De retour sur PC
git fetch origin
git checkout temp-codespaces  # Voir les changements
git checkout main
git merge temp-codespaces     # Fusionner
```

### Scénario 3 : Changements sur les deux en même temps

```bash
# Sur PC
git checkout -b feature-pc
git add .
git commit -m "Changements PC"
git push origin feature-pc

# Sur Codespaces
git checkout -b feature-codespaces
git add .
git commit -m "Changements Codespaces"
git push origin feature-codespaces

# Plus tard, fusionner
git checkout main
git merge feature-pc
git merge feature-codespaces
# Résoudre conflits si nécessaire
git push origin main
```

---

## 📦 Script automatique de synchronisation

### sync-before-work.bat (à lancer AVANT de travailler ailleurs)

```batch
@echo off
echo ========================================
echo   Sauvegarde avant travail distant
echo ========================================

REM Sauvegarder les changements locaux
echo [1/3] Ajout des fichiers...
git add .

REM Commit avec timestamp
echo [2/3] Commit automatique...
set timestamp=%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%
set timestamp=%timestamp: =0%
git commit -m "Auto-save avant travail distant - %timestamp%"

REM Push vers GitHub
echo [3/3] Push vers GitHub...
git push origin main

echo.
echo ✅ Tout est sauvegarde sur GitHub !
echo Vous pouvez travailler ailleurs en toute securite.
pause
```

### sync-after-work.bat (à lancer APRES le retour sur PC)

```batch
@echo off
echo ========================================
echo   Recuperation changements GitHub
echo ========================================

REM Vérifier s'il y a des changements locaux
git status --porcelain > nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Vous avez des changements locaux non commites
    echo.
    echo Options:
    echo 1 - Les sauvegarder temporairement ^(stash^)
    echo 2 - Les commiter maintenant
    echo 3 - Annuler
    echo.
    set /p choice=Votre choix ^(1/2/3^): 
    
    if "%choice%"=="1" (
        echo Sauvegarde temporaire...
        git stash
    ) else if "%choice%"=="2" (
        git add .
        git commit -m "Changements locaux avant pull"
    ) else (
        echo Operation annulee
        exit /b 1
    )
)

REM Pull depuis GitHub
echo [1/2] Recuperation changements...
git pull origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Synchronisation reussie !
    
    REM Si des changements ont été stashés, les restaurer
    git stash list | findstr "stash@{0}" > nul
    if %ERRORLEVEL% EQU 0 (
        echo.
        echo Voulez-vous restaurer vos changements locaux sauvegardes ? ^(O/N^)
        set /p restore=
        if /i "%restore%"=="O" (
            echo [2/2] Restauration changements locaux...
            git stash pop
        )
    )
) else (
    echo.
    echo ❌ Erreur lors du pull
    echo Verifiez les conflits eventuels
)

pause
```

---

## 🎯 Règles d'or

### ✅ À FAIRE

1. **Toujours commit avant de changer d'environnement**
2. **Toujours pull en revenant sur un environnement**
3. **Utiliser des branches pour expérimenter**
4. **Commit fréquemment avec des messages clairs**

### ❌ À ÉVITER

1. **Travailler sur plusieurs environnements sans synchroniser**
2. **Modifier le même fichier simultanément**
3. **Oublier de push après un commit**
4. **Forcer un push (`git push --force`) sans raison**

---

## 🔍 Vérifier l'état de synchronisation

```bash
# Voir si vous êtes à jour avec GitHub
git status

# Voir les différences avec GitHub
git fetch origin
git diff main origin/main

# Voir l'historique des commits
git log --oneline -10

# Voir les branches
git branch -a
```

---

## 💡 Astuce : Alias Git utiles

Ajoutez dans `~/.gitconfig` :

```ini
[alias]
    # Synchronisation rapide
    sync = !git pull origin main && git push origin main
    
    # Sauvegarder rapidement
    save = !git add . && git commit -m \"Quick save\" && git push origin main
    
    # Voir l'état simplifié
    st = status -sb
    
    # Historique graphique
    lg = log --graph --oneline --decorate --all
    
    # Annuler le dernier commit (garder les changements)
    undo = reset HEAD~1 --soft
```

Utilisation :
```bash
git save          # Sauvegarde ultra-rapide
git sync          # Synchronisation bidirectionnelle
git st            # État simplifié
git lg            # Historique visuel
```

---

## 📱 Application mobile Git (pour suivre)

### Pour iOS
- **Working Copy** - Client Git complet
- Peut pull/push
- Éditeur intégré

### Pour Android
- **MGit** - Client Git
- **Termux** - Terminal Linux complet

---

## ⚡ Quick Commands

```bash
# Sauvegarder avant de partir
git add . && git commit -m "Save before remote work" && git push

# Récupérer en revenant
git pull

# Si problème, tout réinitialiser (⚠️ perd changements locaux)
git fetch origin
git reset --hard origin/main

# Voir ce qui a changé sur GitHub
git fetch origin
git log HEAD..origin/main --oneline
```

---

## 🎯 Recommandation pour votre cas

### Option Simple : Toujours tout synchroniser

**Avant de quitter votre PC :**
```bash
.\sync-before-work.bat
```

**En revenant sur votre PC :**
```bash
.\sync-after-work.bat
```

### Option Avancée : Branches par environnement

```bash
# Sur PC
git checkout -b dev-pc

# Sur Codespaces
git checkout -b dev-codespaces

# Fusionner régulièrement dans main
git checkout main
git merge dev-pc
git merge dev-codespaces
```

---

## ✅ Checklist quotidienne

### 🌅 Matin (sur PC)
- [ ] `git pull origin main`
- [ ] Vérifier que tout fonctionne
- [ ] Travailler normalement

### 🌆 Soir (avant de partir)
- [ ] `git add .`
- [ ] `git commit -m "Descriptif"`
- [ ] `git push origin main`

### 💻 Sur Codespaces
- [ ] Vérifier branche `main`
- [ ] Travailler
- [ ] Commit + push régulièrement

### 🏠 Retour sur PC
- [ ] `git pull origin main`
- [ ] Vérifier que tout fonctionne
- [ ] Continuer le travail

---

C'est tout ! Avec ce workflow, vous ne perdrez jamais de code. 🚀
