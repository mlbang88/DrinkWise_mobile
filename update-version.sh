#!/bin/bash
# Script de déploiement avec mise à jour automatique de version

echo "🚀 Déploiement DrinkWise avec mise à jour version..."

# Incrémenter la version
CURRENT_VERSION=$(jq -r '.version' public/version.json)
echo "📦 Version actuelle: $CURRENT_VERSION"

# Nouvelle version (incrémente le patch)
IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
NEW_VERSION="$major.$minor.$((patch + 1))"

echo "🆕 Nouvelle version: $NEW_VERSION"

# Mettre à jour le fichier version.json
cat > public/version.json << EOF
{
  "version": "$NEW_VERSION",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "description": "Mise à jour automatique"
}
EOF

# Mettre à jour le cache name dans le Service Worker
sed -i "s/drinkwise-v[0-9.]*/drinkwise-v$NEW_VERSION/g" public/sw.js

echo "✅ Version mise à jour: $NEW_VERSION"
echo "📁 Fichiers modifiés:"
echo "   - public/version.json"
echo "   - public/sw.js"

echo ""
echo "📋 Prochaines étapes:"
echo "   1. Build: npm run build"
echo "   2. Deploy: firebase deploy --only hosting"
echo "   3. Les testeurs verront la notification de mise à jour !"
