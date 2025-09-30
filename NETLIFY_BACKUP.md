# BACKUP NETLIFY CONFIGURATION
# Sauvegarde effectuée le 30/09/2025 avant migration Firebase Hosting

## Configuration Netlify actuelle (netlify.toml)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/version.json"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

## Instructions de restauration Netlify
Si Firebase Hosting ne fonctionne pas et qu'il faut revenir à Netlify :

1. Redeployer sur Netlify avec cette configuration
2. Remettre les redirections et headers
3. Vérifier que le build "npm run build" → "dist" fonctionne
4. Configurer les variables d'environnement si nécessaire

## Notes importantes
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: 20
- SPA redirect: `/* → /index.html` (status 200)
- Service Worker: no-cache
- Assets: cache 1 an

Date de sauvegarde: 30 septembre 2025