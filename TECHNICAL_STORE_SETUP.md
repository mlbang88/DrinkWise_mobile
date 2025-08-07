# 🔧 Configuration Technique pour Store

## 1. Fichiers Firebase manquants

### Android
```bash
# Télécharger depuis Firebase Console
# Project Settings > General > Your apps > Android app
# Placer dans : android/app/google-services.json
```

### iOS  
```bash
# Télécharger depuis Firebase Console
# Project Settings > General > Your apps > iOS app  
# Placer dans : ios/App/App/GoogleService-Info.plist
```

## 2. Sécurisation variables d'environnement

### Problème actuel
```javascript
// ❌ Clé API exposée côté client
VITE_GEMINI_API_KEY=your_key_here
```

### Solution recommandée
```javascript
// ✅ Déplacer vers Firebase Functions
// Clé API stockée côté serveur uniquement
exports.analyzeImageSecure = onCall(async (request) => {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Serveur only
  // ... logique d'analyse
});
```

## 3. Build configuration

### Android version codes
```gradle
// android/app/build.gradle
versionCode 1        // Premier release
versionName "1.0.0"  // Version publique
```

### iOS version
```xml
<!-- ios/App/App/Info.plist -->
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

## 4. Store Assets requis

### Icons (déjà présents ✅)
- Android: res/mipmap-*/ic_launcher.png
- iOS: Assets.xcassets/AppIcon.appiconset/

### Screenshots à préparer
- 5-10 screenshots par plateforme
- Différentes tailles d'écran
- Mettre en valeur les fonctionnalités clés

### Store descriptions
- Titre accrocheur (max 30 caractères)
- Description courte (max 80 caractères)  
- Description longue (max 4000 caractères)
- Mots-clés stratégiques
