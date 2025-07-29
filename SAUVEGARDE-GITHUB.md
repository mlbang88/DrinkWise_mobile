# Script de sauvegarde automatique pour DrinkWise

## Configuration initiale (une seule fois)

Votre repository est maintenant configuré ! Voici comment sauvegarder automatiquement :

## 🚀 Méthodes de sauvegarde

### 1. **Sauvegarde rapide** ⭐ (RECOMMANDÉ)
**Double-cliquez sur : `quick-save.bat`**
- ✅ Sauvegarde instantanée en 2 secondes
- ✅ Parfait pour les sauvegardes fréquentes
- ✅ Utilisez après chaque modification importante

**Ou depuis VS Code :**
- `Ctrl+Shift+P` → "Tasks: Run Task" → "Quick Save to GitHub"

### 2. **Sauvegarde automatique complète**
Double-cliquez sur : `save-to-github.bat`
- Ajoute tous les fichiers modifiés
- Crée un commit avec l'heure/date
- Envoie tout sur GitHub
- Affiche le statut de progression

### 3. **Sauvegarde manuelle**
```bash
git add .
git commit -m "Votre message"
git push origin main
```

## 📚 Récupérer une ancienne sauvegarde

### 1. **Voir l'historique** 
Double-cliquez sur : `view-history.bat`
- Affiche les 15 dernières sauvegardes
- Notez l'ID du commit que vous voulez récupérer

### 2. **Récupérer une sauvegarde**
Double-cliquez sur : `restore-backup.bat`
- Tapez l'ID du commit (ex: `697fd1c`)
- Confirme avant de récupérer
- Sauvegarde automatiquement votre code actuel

### 3. **Récupération manuelle**
```bash
# Voir l'historique
git log --oneline -10

# Récupérer un commit spécifique
git checkout COMMIT_ID -- .
git add .
git commit -m "Récupération du commit COMMIT_ID"
```

## 📦 Commandes Git utiles

```bash
# Voir l'état des fichiers
git status

# Voir l'historique des commits
git log --oneline

# Annuler le dernier commit (garde les modifications)
git reset --soft HEAD~1

# Récupérer la dernière version depuis GitHub
git pull origin main

# Voir les différences depuis le dernier commit
git diff
```

## 🔧 Configuration automatique

Le repository est déjà configuré avec :
- ✅ Remote GitHub : https://github.com/mlbang88/DrinkWise_mobile.git
- ✅ Branche principale : main
- ✅ Tracking automatique
- ✅ Configuration utilisateur
- ✅ Tâches VS Code intégrées

## 🎯 Recommandations

1. **Sauvegardez souvent** : Utilisez `quick-save.bat` après chaque modification importante
2. **Messages de commit** : Pour les commits manuels, utilisez des messages descriptifs
3. **Avant de fermer VS Code** : Toujours faire une sauvegarde finale
4. **Vérifiez l'historique** : Utilisez `view-history.bat` régulièrement

## 🛡️ Sécurité

- Vos sauvegardes sont stockées sur GitHub (sécurisé)
- Le script de récupération fait une sauvegarde automatique avant de récupérer
- Vous pouvez toujours annuler une récupération avec `git stash pop`

Votre code est maintenant automatiquement sauvegardé sur GitHub ! 🎉
