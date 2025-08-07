# Script PowerShell de déploiement avec mise à jour automatique de version
Write-Host "🚀 Déploiement DrinkWise avec mise à jour version..." -ForegroundColor Green

# Lire la version actuelle
$versionContent = Get-Content "public\version.json" | ConvertFrom-Json
$currentVersion = $versionContent.version
Write-Host "📦 Version actuelle: $currentVersion" -ForegroundColor Blue

# Incrémenter la version (patch)
$versionParts = $currentVersion.Split('.')
$newPatch = [int]$versionParts[2] + 1
$newVersion = "$($versionParts[0]).$($versionParts[1]).$newPatch"

Write-Host "🆕 Nouvelle version: $newVersion" -ForegroundColor Green

# Créer le nouveau fichier version.json
$newVersionContent = @{
    version = $newVersion
    buildDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
    description = "Mise à jour automatique"
} | ConvertTo-Json

$newVersionContent | Out-File "public\version.json" -Encoding UTF8

# Mettre à jour le Service Worker
$swContent = Get-Content "public\sw.js" -Raw
$swContent = $swContent -replace "drinkwise-v[\d\.]+", "drinkwise-v$newVersion"
$swContent | Out-File "public\sw.js" -Encoding UTF8

Write-Host "✅ Version mise à jour: $newVersion" -ForegroundColor Green
Write-Host "📁 Fichiers modifiés:" -ForegroundColor Yellow
Write-Host "   - public\version.json"
Write-Host "   - public\sw.js"

Write-Host ""
Write-Host "📋 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "   1. Build: npm run build"
Write-Host "   2. Deploy: firebase deploy --only hosting"
Write-Host "   3. Les testeurs verront la notification de mise à jour ! 🎉"
