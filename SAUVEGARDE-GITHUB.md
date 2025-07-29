# Script de sauvegarde automatique pour DrinkWise

## Configuration initiale (une seule fois)

Votre repository est maintenant configuré ! Voici comment sauvegarder automatiquement :

## 🚀 Méthodes de sauvegarde

### 1. **Sauvegarde automatique complète**
Double-cliquez sur : `save-to-github.bat`
- Ajoute tous les fichiers modifiés
- Crée un commit avec l'heure/date
- Envoie tout sur GitHub
- Affiche le statut de progression

### 2. **Sauvegarde rapide**
Double-cliquez sur : `quick-save.bat`
- Sauvegarde instantanée en 2 secondes
- Parfait pour les sauvegardes fréquentes

### 3. **Sauvegarde manuelle**
```bash
git add .
git commit -m "Votre message"
git push origin main
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
```

## 🔧 Configuration automatique

Le repository est déjà configuré avec :
- ✅ Remote GitHub : https://github.com/mlbang88/DrinkWise_mobile.git
- ✅ Branche principale : main
- ✅ Tracking automatique
- ✅ Configuration utilisateur

## 🎯 Recommandations

1. **Sauvegardez souvent** : Utilisez `quick-save.bat` après chaque modification importante
2. **Messages de commit** : Pour les commits manuels, utilisez des messages descriptifs
3. **Avant de fermer VS Code** : Toujours faire une sauvegarde finale

Votre code est maintenant automatiquement sauvegardé sur GitHub ! 🎉
