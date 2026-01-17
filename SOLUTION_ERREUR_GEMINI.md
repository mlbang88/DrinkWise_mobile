# 🔧 Solution : Erreur 404 - Modèle Gemini non trouvé

## 🔴 Problème identifié

**Erreur dans les logs** :
```
Error: [GoogleGenerativeAI Error]: Error fetching from 
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent: 
[404 Not Found] models/gemini-1.5-flash-latest is not found for API version v1beta
```

**Cause** : Le modèle `gemini-1.5-flash-latest` n'existe pas ou n'est pas disponible pour l'API v1beta.

---

## ✅ Solution

### Problème 1 : Nom de modèle invalide

**Ligne 210 de `functions/index.js`** :
```javascript
model: "gemini-1.5-flash-001",  // ⚠️ Peut-être invalide selon la version
```

**OU** (si version déployée différente) :
```javascript
model: "models/gemini-1.5-flash-latest",  // ❌ N'existe pas
```

### Solution : Utiliser un nom de modèle valide

Les modèles Gemini valides sont :
- ✅ `gemini-1.5-flash` (recommandé - sans suffixe)
- ✅ `gemini-1.5-pro`
- ✅ `gemini-2.0-flash-exp` (expérimental)
- ✅ `gemini-2.5-flash` (si disponible dans votre région)
- ❌ `gemini-1.5-flash-latest` (n'existe pas)
- ❌ `gemini-1.5-flash-001` (peut ne pas exister selon la version)

---

## 🔧 Corrections à appliquer

### Correction 1 : Modifier le nom du modèle dans `callGeminiForText`

**Fichier** : `functions/index.js` ligne 210

**AVANT** :
```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-001",  // ou "models/gemini-1.5-flash-latest"
  // ...
});
```

**APRÈS** (Option 1 - Recommandé) :
```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",  // ✅ Nom standard, sans préfixe "models/"
  // ...
});
```

**APRÈS** (Option 2 - Si vous voulez la dernière version) :
```javascript
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",  // ✅ Plus récent, si disponible
  // ...
});
```

### Correction 2 : Uniformiser avec les autres fonctions

**Fichier** : `functions/index.js` ligne 465

Vous utilisez déjà `gemini-2.5-flash` dans `analyzeImageSecure`. Pour la cohérence :

```javascript
// Dans callGeminiForText (ligne 210)
model: "gemini-2.5-flash",  // ✅ Même modèle que analyzeImageSecure
```

---

## 🧪 Vérification

### Étape 1 : Vérifier les modèles disponibles

Utilisez la fonction `listGeminiModels` déjà présente dans votre code pour voir quels modèles sont disponibles :

```javascript
// Appeler depuis votre frontend ou via Firebase Console
const listModels = httpsCallable(functions, 'listGeminiModels');
const result = await listModels();
console.log('Modèles disponibles:', result.data);
```

### Étape 2 : Tester avec différents modèles

Testez dans cet ordre de préférence :
1. `gemini-2.5-flash` (le plus récent)
2. `gemini-1.5-flash` (standard, très fiable)
3. `gemini-1.5-pro` (si besoin de plus de puissance)

---

## 📝 Code corrigé complet

```javascript
// Fonction helper pour appeler Gemini avec du texte uniquement (SDK officiel)
async function callGeminiForText(prompt) {
  try {
    const GEMINI_API_KEY = resolveGeminiApiKey();

    logger.info('🤖 Appel Gemini pour génération de texte');

    // Initialiser le SDK Google Generative AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",  // ✅ Nom valide, sans préfixe
      generationConfig: {
        temperature: 0.7,
        topK: 20,
        topP: 0.8,
        maxOutputTokens: 800,
        candidateCount: 1
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
      ]
    });

    logger.info('📤 Envoi du prompt à Gemini...', { promptLength: prompt.length });

    // Générer le contenu avec le SDK
    const result = await model.generateContent(prompt);  // ✅ Format simplifié (string direct)
    
    // ... reste du code
  } catch (error) {
    // ... gestion d'erreurs
  }
}
```

---

## ⚠️ Points importants

1. **Format du nom du modèle** :
   - ✅ Utiliser `"gemini-1.5-flash"` (sans préfixe `models/`)
   - ❌ Ne pas utiliser `"models/gemini-1.5-flash"` (le SDK ajoute le préfixe automatiquement)

2. **Format du prompt pour generateContent** :
   - Option 1 (recommandé) : `generateContent(prompt)` - string direct
   - Option 2 : `generateContent([{ text: prompt }])` - tableau de Parts
   - Les deux fonctionnent, mais le format string est plus simple

3. **Cohérence** :
   - Utiliser le même modèle dans toutes les fonctions (`callGeminiForText` et `analyzeImageSecure`)
   - Actuellement : `analyzeImageSecure` utilise `gemini-2.5-flash`
   - Recommandation : Utiliser `gemini-1.5-flash` partout pour la stabilité, ou `gemini-2.5-flash` partout pour les dernières fonctionnalités

---

## 🚀 Après correction

1. **Redéployer les fonctions** :
   ```bash
   cd functions
   npm run deploy
   # ou
   firebase deploy --only functions:callGeminiAPI
   ```

2. **Tester** :
   - Appeler `callGeminiAPI` avec un prompt simple
   - Vérifier les logs pour confirmer que le modèle est trouvé
   - Vérifier que la réponse est générée correctement

3. **Surveiller les logs** :
   - Plus d'erreur 404
   - Logs montrant "✅ Génération de texte réussie"

---

## 📚 Références

- [Documentation Gemini API - Modèles disponibles](https://ai.google.dev/models/gemini)
- [SDK Google Generative AI - getGenerativeModel](https://ai.google.dev/api/generate-content)

---

**Date** : 2025-01-27  
**Problème** : 404 Not Found - Modèle Gemini non trouvé  
**Solution** : Utiliser un nom de modèle valide (`gemini-1.5-flash` ou `gemini-2.5-flash`)
