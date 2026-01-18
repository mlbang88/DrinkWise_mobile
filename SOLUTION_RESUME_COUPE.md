# 🔧 Solution : Résumé coupé au milieu d'un mot

## 🔴 Problème identifié

Le résumé généré par Gemini se coupe au milieu d'un mot. Dans les logs, on voit :
- Longueur : 121 caractères
- Texte coupé : "...quelques bi" (probablement "bières")

**Cause probable** : 
1. `maxOutputTokens: 800` pourrait être insuffisant ou mal configuré
2. Gemini s'arrête avec `finishReason: MAX_TOKENS` ou `LENGTH` avant de terminer la phrase
3. Le texte n'est pas complètement extrait de la réponse

---

## ✅ Solutions

### Solution 1 : Augmenter maxOutputTokens (RECOMMANDÉ)

**Fichier** : `functions/index.js` ligne 215

**AVANT** :
```javascript
generationConfig: {
  temperature: 0.7,
  topK: 20,
  topP: 0.8,
  maxOutputTokens: 800,  // ⚠️ Peut être insuffisant
  candidateCount: 1
}
```

**APRÈS** :
```javascript
generationConfig: {
  temperature: 0.7,
  topK: 20,
  topP: 0.8,
  maxOutputTokens: 2048,  // ✅ Augmenté pour permettre des résumés complets
  candidateCount: 1
}
```

**Note** : 2048 tokens ≈ 1500-2000 caractères, largement suffisant pour un résumé de 2-3 phrases.

---

### Solution 2 : Vérifier et logger le finishReason

**Fichier** : `functions/index.js` après ligne 234

**Ajouter** :
```javascript
const text = extractTextFromGeminiResponse(response);

// 🔍 DEBUG : Vérifier pourquoi la génération s'est arrêtée
const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
const finishReason = candidates[0]?.finishReason || 'unknown';

logger.info('🔍 Finish reason Gemini:', {
  finishReason,
  textLength: text.length,
  maxTokens: 800,  // ou la valeur actuelle
  isComplete: finishReason === 'STOP'  // STOP = terminé normalement
});

// ⚠️ Si MAX_TOKENS, augmenter maxOutputTokens
if (finishReason === 'MAX_TOKENS') {
  logger.warn('⚠️ Résumé coupé à cause de MAX_TOKENS - augmenter maxOutputTokens');
}
```

---

### Solution 3 : Améliorer le prompt pour forcer la complétion

**Fichier** : `src/components/BasicPartyModal.jsx` ligne 273-280

**AVANT** :
```javascript
const prompt = `Raconte cette soirée en 2-3 phrases complètes et drôles:
...
TERMINE TOUTES TES PHRASES.`;
```

**APRÈS** :
```javascript
const prompt = `Raconte cette soirée en 2-3 phrases complètes et drôles:
...
IMPORTANT : 
- TERMINE TOUTES TES PHRASES COMPLÈTEMENT
- Ne t'arrête pas au milieu d'un mot
- Chaque phrase doit se terminer par un point
- Longueur attendue : 150-300 caractères`;
```

---

### Solution 4 : Vérifier l'extraction complète du texte

**Fichier** : `functions/index.js` fonction `extractTextFromGeminiResponse`

**Problème potentiel** : Si Gemini retourne plusieurs `parts`, il faut tous les joindre.

**Vérification** : La fonction actuelle joint déjà tous les parts avec `.join(' ')`, donc ça devrait être bon.

**Amélioration possible** :
```javascript
function extractTextFromGeminiResponse(response) {
  let directText = '';

  try {
    if (response && typeof response.text === 'function') {
      directText = (response.text() || '').trim();
    }
  } catch (textError) {
    logger.warn('⚠️ Impossible de lire response.text() depuis Gemini:', textError);
  }

  if (directText) {
    // ✅ Vérifier que le texte n'est pas tronqué
    const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
    const finishReason = candidates[0]?.finishReason || 'unknown';
    
    if (finishReason === 'MAX_TOKENS') {
      logger.warn('⚠️ Texte potentiellement tronqué (MAX_TOKENS)');
    }
    
    return directText;
  }

  const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
  const partsText = candidates
    .flatMap((candidate) => Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [])
    .filter((part) => typeof part?.text === 'string')
    .map((part) => part.text)
    .join(' ')  // ✅ Joint tous les parts
    .trim();

  if (partsText) {
    // ✅ Vérifier le finishReason ici aussi
    const finishReason = candidates[0]?.finishReason || 'unknown';
    if (finishReason === 'MAX_TOKENS') {
      logger.warn('⚠️ Texte potentiellement tronqué (MAX_TOKENS)', {
        textLength: partsText.length,
        lastChars: partsText.substring(Math.max(0, partsText.length - 50))
      });
    }
    
    return partsText;
  }

  // ... reste du code
}
```

---

## 🔧 Code corrigé complet

### 1. Augmenter maxOutputTokens dans `callGeminiForText`

```javascript
// functions/index.js ligne 209-224
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    temperature: 0.7,
    topK: 20,
    topP: 0.8,
    maxOutputTokens: 2048,  // ✅ Augmenté de 800 à 2048
    candidateCount: 1
  },
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
  ]
});
```

### 2. Ajouter le logging du finishReason

```javascript
// functions/index.js après ligne 234
const text = extractTextFromGeminiResponse(response);

// 🔍 DEBUG : Vérifier le finishReason
const candidates = Array.isArray(response?.candidates) ? response.candidates : [];
const finishReason = candidates[0]?.finishReason || 'unknown';

logger.info('✅ Génération de texte réussie', {
  length: text.length,
  finishReason,  // ✅ Ajouté
  isComplete: finishReason === 'STOP',  // ✅ STOP = terminé normalement
  preview: text.substring(0, 150) + (text.length > 150 ? '...' : ''),
  lastChars: text.substring(Math.max(0, text.length - 50))  // ✅ Derniers caractères pour vérifier
});

// ⚠️ Avertir si coupé
if (finishReason === 'MAX_TOKENS') {
  logger.warn('⚠️ Résumé potentiellement tronqué - MAX_TOKENS atteint', {
    textLength: text.length,
    suggestion: 'Augmenter maxOutputTokens si nécessaire'
  });
}
```

### 3. Améliorer le prompt

```javascript
// src/components/BasicPartyModal.jsx ligne 273-280
const prompt = `Raconte cette soirée en 2-3 phrases complètes et drôles:

📍 ${safeDetails.location || 'lieu mystérieux'}
🍺 ${totalDrinks} verre${totalDrinks > 1 ? 's' : ''} (${safeDetails.drinks?.map(d => `${d.quantity} ${d.type}`).join(', ') || 'rien'})
👥 ${companions}
💕 ${safeDetails.stats?.newNumbersGot || 0} num${(safeDetails.stats?.newNumbersGot || 0) > 1 ? 's' : ''}, 👊 ${safeDetails.stats?.timeFightsStarted || 0} bagarre${(safeDetails.stats?.timeFightsStarted || 0) > 1 ? 's' : ''}, 🤮 ${safeDetails.stats?.vomitCount || 0} vomi${(safeDetails.stats?.vomitCount || 0) > 1 ? 's' : ''}

Comme un pote qui raconte. Mentionne le lieu, avec qui, les verres et les stats.

IMPORTANT : 
- TERMINE TOUTES TES PHRASES COMPLÈTEMENT
- Ne t'arrête pas au milieu d'un mot
- Chaque phrase doit se terminer par un point
- Longueur attendue : 150-300 caractères`;
```

---

## 🧪 Tests à effectuer

1. **Tester avec maxOutputTokens augmenté** :
   - Générer un résumé
   - Vérifier dans les logs le `finishReason`
   - Vérifier que le texte est complet

2. **Vérifier les logs** :
   - Si `finishReason: STOP` → Génération complète ✅
   - Si `finishReason: MAX_TOKENS` → Augmenter encore `maxOutputTokens` ⚠️
   - Si `finishReason: LENGTH` → Problème de limite ⚠️

3. **Vérifier le texte final** :
   - Le texte doit se terminer par un point
   - Pas de mots coupés
   - Longueur raisonnable (150-300 caractères pour 2-3 phrases)

---

## 📝 Notes importantes

1. **Tokens vs Caractères** :
   - 1 token ≈ 0.75-1 mot (en français)
   - 800 tokens ≈ 600-800 mots ≈ 3000-4000 caractères
   - 2048 tokens ≈ 1500-2000 mots ≈ 7500-10000 caractères
   - Pour un résumé de 2-3 phrases (150-300 caractères), 800 tokens devrait suffire, mais augmenter à 2048 est plus sûr

2. **Finish Reasons possibles** :
   - `STOP` : Génération terminée normalement ✅
   - `MAX_TOKENS` : Limite de tokens atteinte ⚠️
   - `SAFETY` : Bloqué par les safety settings ⚠️
   - `RECITATION` : Contenu détecté comme recitation ⚠️
   - `OTHER` : Autre raison ⚠️

3. **Coût** :
   - Augmenter `maxOutputTokens` n'augmente le coût que si le texte généré est plus long
   - Pour un résumé de 2-3 phrases, le coût reste similaire

---

## 🚀 Après correction

1. **Redéployer les fonctions** :
   ```bash
   cd functions
   firebase deploy --only functions:callGeminiAPI
   ```

2. **Tester** :
   - Créer une nouvelle soirée
   - Générer un résumé
   - Vérifier qu'il est complet

3. **Surveiller les logs** :
   - Vérifier le `finishReason` dans les logs
   - Vérifier que le texte est complet
   - Plus de mots coupés ✅

---

**Date** : 2025-01-27  
**Problème** : Résumé coupé au milieu d'un mot  
**Solution principale** : Augmenter `maxOutputTokens` de 800 à 2048
