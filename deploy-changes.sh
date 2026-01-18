#!/bin/bash
# Script de déploiement automatique pour dev mobile
# Usage: ./deploy-changes.sh "description des changements"

echo "🚀 Déploiement automatique sur GitHub + Vercel"
echo "================================================"

# 1. Vérifier qu'on est sur la bonne branche
BRANCH=$(git branch --show-current)
echo "📍 Branche actuelle: $BRANCH"

# 2. Voir les fichiers modifiés
echo ""
echo "📝 Fichiers modifiés:"
git status --short

# 3. Ajouter tous les changements
echo ""
echo "➕ Ajout des changements..."
git add .

# 4. Commit avec message
MESSAGE="$1"
if [ -z "$MESSAGE" ]; then
    MESSAGE="Update from mobile dev session"
fi
echo "💬 Commit: $MESSAGE"
git commit -m "$MESSAGE"

# 5. Push vers GitHub
echo ""
echo "⬆️  Push vers GitHub..."
git push origin $BRANCH

echo ""
echo "✅ Déployé avec succès!"
echo "🌐 Vercel va redéployer automatiquement dans ~30-60 secondes"
echo "📱 Rechargez: https://drink-wise-mobile.vercel.app"
