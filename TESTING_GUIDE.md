# 🧪 Guide de Test - Système de Contrôle Territorial

## ✅ Tests à effectuer maintenant

### Test 1: VenueSearchModal dans CompetitivePartyModal

1. **Ouvrir l'app** → `http://localhost:5173`
2. **Créer soirée compétitive:**
   - Onglet "Soirées"
   - Bouton "➕" 
   - Sélectionner **"Compétitif"**
3. **Cliquer "📍 Rechercher un lieu"**
4. **Taper:** "bar" ou "bistrot" ou nom d'un bar local
5. **Vérifier:**
   - ✅ Liste autocomplete apparaît
   - ✅ Suggestions en temps réel (debounce 300ms)
6. **Cliquer sur une suggestion**
7. **Vérifier:**
   - ✅ Détails du lieu s'affichent (nom, adresse, note, horaires)
   - ✅ Bouton "Confirmer" devient actif
8. **Cliquer "Confirmer"**
9. **Vérifier:**
   - ✅ Modal se ferme
   - ✅ Nom du lieu apparaît dans le bouton
   - ✅ **NE LANCE PAS LE QUIZ** ← Important!
10. **Terminer la soirée** (remplir drinks, stats, etc.)
11. **Cliquer "Terminer & Quiz"**
12. **Vérifier dans Console (F12):**
    - ✅ Message: `🗺️ Contrôle territorial: +XXX points (Bronze/Argent/Or/etc.)`
    - ✅ Notification: "👑 Nouveau territoire!" ou "⚔️ Territoire conquis!"

---

### Test 2: VenueSearchModal dans BasicPartyModal

1. **Créer soirée basique:**
   - Onglet "Soirées"
   - Bouton "➕"
   - Sélectionner **"Basique"**
2. **Cliquer "📍 Rechercher un lieu"** (nouveau bouton!)
3. **Répéter étapes 4-9 du Test 1**
4. **Terminer la soirée**
5. **Vérifier:**
   - ✅ Points territoriaux calculés aussi pour mode basique
   - ✅ Message console: `🗺️ Contrôle territorial: +XXX points`

---

### Test 3: Première prise de contrôle (Bonus +100 pts)

1. **Créer soirée avec un NOUVEAU lieu** (jamais visité)
2. **Vérifier dans Console:**
   - ✅ `👑 Première prise de contrôle: +100 pts`
   - ✅ `🆕 Nouveau lieu découvert: +50 pts`
   - ✅ Total: au moins **160 points** (10 base + 100 + 50)

---

### Test 4: Défense de territoire (Bonus +25 pts)

1. **Retourner au MÊME lieu** (déjà visité au Test 3)
2. **Terminer soirée**
3. **Vérifier dans Console:**
   - ✅ `🛡️ Défense du territoire: +25 pts`
   - ✅ `🔥 Série x2: +XX pts` (streak bonus)

---

### Test 5: Mode Explorateur (Bonus +30 pts)

1. **Créer soirée compétitive**
2. **Sélectionner style "Explorateur"** dans PartyModeSelector
3. **Ajouter un lieu**
4. **Terminer soirée**
5. **Vérifier dans Console:**
   - ✅ `🗺️ Mode Explorateur: +30 pts`

---

### Test 6: Groupe (Multiplicateur x1.5)

1. **Créer soirée compétitive**
2. **Ajouter des compagnons** (amis ou groupe)
3. **Ajouter un lieu**
4. **Terminer soirée**
5. **Vérifier dans Console:**
   - ✅ `👥 En groupe: +XX pts` (bonus multiplicateur)

---

## 🔍 Vérification Firestore

### Après chaque test, vérifier dans Firebase Console:

1. **Ouvrir Firebase Console:**
   ```
   https://console.firebase.google.com/
   ```

2. **Navigation:**
   - Sélectionner projet DrinkWise
   - Firestore Database
   - `artifacts/{appId}/venues`

3. **Vérifier document venue créé:**
   ```json
   {
     "placeId": "ChIJ...",
     "name": "Le Bistrot",
     "address": "123 Rue...",
     "coordinates": { "lat": 48.xxx, "lng": 2.xxx },
     "totalVisits": 1,
     "uniqueVisitors": 1,
     "currentController": {
       "userId": "xxx",
       "username": "TonNom",
       "controlPoints": 160,
       "level": "BRONZE",
       "since": "Timestamp"
     }
   }
   ```

4. **Vérifier venueControls:**
   - `artifacts/{appId}/venueControls/{userId}_{placeId}`
   ```json
   {
     "placeId": "ChIJ...",
     "venueName": "Le Bistrot",
     "totalPoints": 160,
     "visitCount": 1,
     "visitStreak": 1,
     "level": "BRONZE",
     "pointsHistory": [...]
   }
   ```

---

## 🐛 Problèmes possibles

### "Google Maps API non configurée"

**Cause:** Clé API manquante  
**Solution:**
```bash
# Vérifier .env existe
dir .env

# Vérifier contenu
type .env

# Doit contenir:
VITE_GOOGLE_MAPS_API_KEY=AIzaSyBft5cAtkne-0dbY8m20bFeYGIKUBHRf_Y
```

**Si .env n'existe pas:**
```bash
copy .env.example .env
# Puis éditer .env et ajouter ta clé
```

**Redémarrer serveur:**
```bash
# Ctrl+C pour arrêter
npm run dev
```

---

### "Aucun lieu trouvé"

**Cause:** API pas activée ou restrictions trop strictes  
**Solution:**

1. **Vérifier APIs activées:**
   - https://console.cloud.google.com/apis/dashboard
   - Places API (New) ✅ Enabled
   - Geocoding API ✅ Enabled
   - Maps JavaScript API ✅ Enabled

2. **Vérifier restrictions HTTP referrers:**
   - Credentials → Ta clé API
   - Application restrictions: `localhost:*` et `127.0.0.1:*`
   - **PAS de `http://` devant!**

3. **Attendre 2-3 minutes** (propagation Google)

---

### Modal se ferme immédiatement

**Cause:** Fix appliqué normalement  
**Solution:** Si le problème persiste:
- Vérifier commit `b3ec4a7` appliqué
- Refresh hard du navigateur (Ctrl+Shift+R)
- Vider cache navigateur

---

### Quiz se lance au lieu de fermer modal

**Cause:** Fix appliqué normalement  
**Solution:** Si problème persiste:
- Vérifier que `onVenueSelect` dans CompetitivePartyModal contient `setShowVenueSearch(false)`
- Vérifier que VenueSearchModal.handleConfirm ne contient PLUS `onClose()`

---

## 📊 Résultats attendus

### Points par scénario:

| Scénario | Points attendus | Breakdown |
|----------|----------------|-----------|
| **Nouveau lieu** | 160+ pts | 10 (base) + 50 (nouveau) + 100 (1ère prise) |
| **Défense (2e visite)** | 45+ pts | 10 (base) + 25 (défense) + 10 (streak x2) |
| **Reprise territoire** | 85+ pts | 10 (base) + 75 (takeover) |
| **Mode explorateur** | 40+ pts | 10 (base) + 30 (explorateur) |
| **En groupe** | 15+ pts | 10 (base) × 1.5 (groupe) |
| **Compétitif** | 30+ pts | 10 (base) + 20 (compétitif) |

### Niveaux de contrôle:

| Points | Niveau | Multiplicateur |
|--------|--------|---------------|
| 0-99 | 🥉 Bronze | x1.0 |
| 100-249 | 🥈 Argent | x1.2 |
| 250-499 | 🥇 Or | x1.5 |
| 500-999 | 💎 Platine | x2.0 |
| 1000+ | 💠 Diamant | x3.0 |

---

## ✅ Checklist finale

Après tous les tests:

- [ ] VenueSearchModal s'ouvre dans CompetitivePartyModal
- [ ] VenueSearchModal s'ouvre dans BasicPartyModal
- [ ] Autocomplete fonctionne (<3s latence)
- [ ] Détails lieu affichés correctement
- [ ] Modal se ferme en cliquant "Confirmer"
- [ ] Quiz NE se lance PAS prématurément
- [ ] Points territoriaux calculés et affichés
- [ ] Notifications "👑" ou "⚔️" apparaissent
- [ ] Firestore `venues` créé avec données
- [ ] Firestore `venueControls` créé avec points
- [ ] Deuxième visite = bonus défense +25pts
- [ ] Mode explorateur = +30pts bonus
- [ ] Groupe = multiplicateur x1.5

---

## 🎯 Tests avancés (optionnels)

### Test Multi-utilisateurs (Takeover)

**Nécessite 2 comptes:**

1. **User A:** Créer soirée au "Bar X" → Contrôle établi
2. **User B:** Créer soirée au même "Bar X"
3. **Vérifier User B:**
   - ✅ `⚔️ Territoire conquis! +75 pts`
   - ✅ User B devient currentController dans Firestore

### Test Série (Streak)

**Visiter le même lieu 3 fois:**

1. **Visite 1:** Points normaux
2. **Visite 2:** +10% bonus (streak x2)
3. **Visite 3:** +20% bonus (streak x3)
4. **Vérifier:** `visitStreak` incrémenté dans Firestore

---

**Bon test! 🧪** Si un test échoue, note lequel et je t'aide à debugger! 🚀
