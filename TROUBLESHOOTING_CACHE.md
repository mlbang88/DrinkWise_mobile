# TROUBLESHOOTING: Cache Navigateur

**Date:** 4 octobre 2025  
**Problème:** Le navigateur utilise l'ancien code malgré le hot reload  
**Symptôme:** Erreurs CORS alors que le code est corrigé

---

## 🔴 Symptômes

### Ce que tu vois dans la console
```
googleMapsService.js:65 GET https://maps.googleapis.com/maps/api/place/autocomplete/json...
Access to fetch... has been blocked by CORS policy
```

### Pourquoi c'est bizarre
- ✅ Le fichier `googleMapsService.js` est bien à jour (utilise JavaScript API)
- ✅ Les commits sont bien faits (1bab7f6 + 9bcecd8)
- ✅ Vite HMR (Hot Module Replacement) est actif
- ❌ MAIS l'erreur pointe vers la ligne 65 qui n'existe plus !

---

## 🔍 Diagnostic

### Vérification 1: Le fichier sur disque
```bash
# Lire les lignes 60-70 du fichier
head -n 70 src/services/googleMapsService.js | tail -n 10
```

**Résultat attendu:** Code avec `AutocompleteService`, pas de `fetch()`

### Vérification 2: Le navigateur
```
Sources → localhost:5175 → src/services/googleMapsService.js
```

**Si tu vois du code avec `fetch()` :** Le navigateur utilise l'ancien cache !

---

## ✅ Solutions (dans l'ordre de préférence)

### Solution 1: Hard Refresh (RAPIDE ⚡)
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Avantage:** Rapide, conserve les DevTools ouverts  
**Inconvénient:** Peut ne pas suffire pour les modules ES6

---

### Solution 2: Vider le cache DevTools (EFFICACE 🎯)

1. **Ouvrir DevTools:** `F12`
2. **Aller dans Network**
3. **Cocher "Disable cache"**
4. **Garder les DevTools ouverts**
5. **Rafraîchir:** `Ctrl + Shift + R`

**Avantage:** Cache désactivé en permanence pendant le dev  
**Inconvénient:** Légèrement plus lent

---

### Solution 3: Fermer/Réouvrir le navigateur (RADICAL 💪)

1. **Fermer TOUTES les fenêtres du navigateur**
2. **Attendre 2-3 secondes**
3. **Rouvrir le navigateur**
4. **Aller sur `http://localhost:5175`**

**Avantage:** Force le rechargement complet  
**Inconvénient:** Perd les onglets/sessions

---

### Solution 4: Navigation privée (PROPRE 🧹)

**Chrome/Edge:**
```
Ctrl + Shift + N
```

**Firefox:**
```
Ctrl + Shift + P
```

**Puis aller sur:** `http://localhost:5175`

**Avantage:** Pas de cache, pas de cookies, environnement propre  
**Inconvénient:** Pas de localStorage (perte de connexion)

---

## 🛠️ Vérification Post-Fix

### Console - Avant (❌ Ancien code)
```
googleMapsService.js:65 GET https://maps.googleapis.com/.../autocomplete/json
❌ CORS policy: No 'Access-Control-Allow-Origin'
❌ SyntaxError: Unexpected token 'O', "Offline" is not valid JSON
```

### Console - Après (✅ Nouveau code)
```
✅ [INFO] Google Maps API chargée
✅ [INFO] Services Google Maps initialisés
✅ [INFO] 📍 Position obtenue: 48.xxx, 2.xxx
✅ [INFO] 🔍 Recherche Google Places
✅ [INFO] 4 résultats trouvés
```

### DevTools Sources - Vérification manuelle

**Ouvrir:** `Sources → localhost:5175 → src/services/googleMapsService.js`

**Chercher (Ctrl+F):**
- ❌ Si tu trouves `fetch(url)` → Ancien code (cache problème)
- ✅ Si tu trouves `AutocompleteService()` → Nouveau code (OK)

---

## 🤔 Pourquoi Vite HMR ne suffit pas ?

### Cas où HMR fonctionne bien
- ✅ Modifications de composants React (`.jsx`)
- ✅ Modifications de CSS
- ✅ Modifications de variables

### Cas où HMR peut échouer
- ❌ Remplacement complet de fichier (ancien → nouveau)
- ❌ Changement radical de structure
- ❌ Modules avec état global (singletons)
- ❌ Services instanciés au démarrage

**Notre cas:** `googleMapsService.js`
- Ancien: Fonctions avec `fetch()`
- Nouveau: Fonctions avec `AutocompleteService()`
- Changement: **Réécriture complète** → HMR peut ne pas détecter

---

## 🔧 Configuration Vite pour forcer le reload

### Option 1: vite.config.js
```javascript
export default {
  server: {
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    exclude: ['src/services/googleMapsService.js']
  }
}
```

### Option 2: Commentaire dans le fichier
```javascript
// @refresh reload
export const searchPlaces = async () => { ... }
```

### Option 3: Restart manuel du serveur
```bash
# Arrêter Vite
Ctrl + C

# Redémarrer
npm run dev
```

---

## 📋 Checklist de Débogage

Quand tu as des erreurs qui ne devraient pas exister :

- [ ] **Vérifier le fichier sur disque** (`cat` ou `head` ou éditeur)
- [ ] **Vérifier DevTools Sources** (fichier chargé par le navigateur)
- [ ] **Comparer les numéros de ligne** (l'erreur pointe-t-elle vers une ligne valide ?)
- [ ] **Hard refresh** (`Ctrl + Shift + R`)
- [ ] **Disable cache dans DevTools**
- [ ] **Fermer/réouvrir le navigateur**
- [ ] **Mode navigation privée**
- [ ] **Restart Vite** (`Ctrl+C` puis `npm run dev`)

---

## 🎯 Résumé

**Problème:**
```
Fichier à jour ✅ → Mais navigateur utilise ancien code ❌
```

**Cause:**
```
Cache navigateur + HMR incomplet
```

**Solution immédiate:**
```
Fermer/réouvrir navigateur OU Navigation privée
```

**Solution permanente:**
```
DevTools → Network → Disable cache (garder ouvert)
```

---

**Auteur:** GitHub Copilot  
**Type:** Troubleshooting Guide  
**Fréquence:** Rare mais frustrant  
**Temps de résolution:** < 1 minute
