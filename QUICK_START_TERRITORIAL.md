# 🚀 Guide de Démarrage Rapide - Contrôle Territorial

## ⚡ 5 Minutes Setup

### Étape 1: Google Maps API Key (3 min)

1. **Ouvrir Google Cloud Console**
   ```
   https://console.cloud.google.com/
   ```

2. **Créer/Sélectionner un projet**
   - Cliquer "Select a project" en haut
   - "New Project" → Nom: "DrinkWise"
   - Cliquer "Create"

3. **Activer la facturation** ⚠️ OBLIGATOIRE
   - Menu ☰ → "Billing"
   - "Link a billing account"
   - **Gratuit**: 200$/mois de crédit (~12,000 recherches)

4. **Activer les APIs** (30 secondes chacune)
   - Menu ☰ → "APIs & Services" → "Library"
   - Rechercher et activer:
     * ✅ Places API (New)
     * ✅ Geocoding API
     * ✅ Maps JavaScript API

5. **Créer l'API Key**
   - "APIs & Services" → "Credentials"
   - "Create Credentials" → "API Key"
   - ✅ Copier la clé (ex: AIzaSyB...)

6. **Restreindre la clé** (RECOMMANDÉ)
   - Cliquer sur la clé créée
   - "Application restrictions"
     * Choisir "HTTP referrers"
     * Ajouter: `http://localhost:*`
     * Ajouter: `https://yourdomain.com/*`
   - "API restrictions"
     * Choisir "Restrict key"
     * Sélectionner: Places API, Geocoding API, Maps JavaScript API
   - Cliquer "Save"

---

### Étape 2: Configuration locale (30 sec)

1. **Créer fichier .env**
   ```bash
   # Dans le dossier racine du projet
   copy .env.example .env
   ```

2. **Ajouter la clé API**
   Ouvrir `.env` et remplacer:
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyB...votre_vraie_cle_ici
   ```

3. **Redémarrer le serveur**
   ```bash
   # Arrêter le serveur (Ctrl+C)
   npm run dev
   ```

---

### Étape 3: Tester (1 min)

1. **Ouvrir l'app** → `http://localhost:5173`

2. **Créer une soirée compétitive**
   - Onglet "Soirées"
   - Bouton "➕" (Ajouter soirée)

3. **Tester la recherche**
   - Cliquer "📍 Rechercher un lieu"
   - Taper "bar" ou "bistrot"
   - ✅ Si autocomplete apparaît → **ÇA MARCHE!** 🎉

4. **Terminer une soirée avec lieu**
   - Sélectionner un bar dans les suggestions
   - Remplir drinks, stats
   - Cliquer "Terminer & Quiz"
   - ✅ Chercher notification "👑 Nouveau territoire!"

---

## ✅ Checklist de vérification

- [ ] Compte Google Cloud créé
- [ ] Facturation activée (carte enregistrée)
- [ ] 3 APIs activées (Places, Geocoding, Maps)
- [ ] API Key créée et copiée
- [ ] Restrictions appliquées (HTTP referrers + API restrictions)
- [ ] Fichier `.env` créé
- [ ] `VITE_GOOGLE_MAPS_API_KEY` remplie
- [ ] Serveur redémarré
- [ ] Test recherche de lieu fonctionnel
- [ ] Test soirée avec lieu enregistrée

---

## 🐛 Problèmes courants

### "Google Maps API non configurée"
**Cause**: Clé API manquante dans .env  
**Solution**:
```bash
# Vérifier que .env existe
dir .env

# Vérifier contenu
type .env

# Doit contenir:
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

### "Aucun lieu trouvé"
**Cause**: Places API pas activée  
**Solution**:
1. https://console.cloud.google.com/apis/library
2. Rechercher "Places API (New)"
3. Cliquer "Enable"
4. Attendre 2-3 minutes pour propagation

### "Erreur 403 Forbidden"
**Cause**: Restrictions API trop strictes ou facturation inactive  
**Solution**:
1. Vérifier facturation: https://console.cloud.google.com/billing
2. Credentials → Éditer API Key
3. Application restrictions: Ajouter `http://localhost:*`
4. Sauvegarder et attendre 1-2 minutes

### "Request failed with status code 429"
**Cause**: Trop de requêtes (rate limiting)  
**Solution**:
- Attendre 1 minute
- Cache implémenté (30 min) devrait éviter ça

---

## 📊 Vérifier les coûts

1. **Dashboard Google Cloud**
   ```
   https://console.cloud.google.com/billing
   ```

2. **Voir utilisation quotidienne**
   - "Billing" → "Reports"
   - Filtrer par "Places API", "Geocoding API"
   - Vérifier < 200$/mois (gratuit)

3. **Alertes budgétaires**
   - "Billing" → "Budgets & alerts"
   - Créer alerte à 50$ (25% du gratuit)

---

## 🎯 Prochaines étapes

### Phase 1: MVP complet ✅
- [x] VenueSearchModal
- [x] googleMapsService
- [x] venueService
- [x] Points de contrôle
- [x] Firestore schema
- [x] Documentation

### Phase 2: MapPage (à venir)
- [ ] Carte interactive avec marqueurs
- [ ] Visualisation contrôles
- [ ] Itinéraire vers lieux
- [ ] Heatmap territoriale

### Phase 3: Quartiers
- [ ] Système d'arrondissements
- [ ] Contrôle de quartier
- [ ] Bonus quotidien quartier

---

## 📞 Support

**Console navigateur** (F12):
- Messages 🗺️ = Contrôle territorial
- Messages ❌ = Erreurs
- Messages ✅ = Succès

**Logs Firestore**:
```
collections:
  artifacts/{appId}/venues/{placeId}
  artifacts/{appId}/venueControls/{userId_placeId}
```

**Documentation complète**: `TERRITORIAL_CONTROL_MVP.md`

---

## 🎉 C'est parti!

Une fois setup terminé, chaque soirée enregistrée avec un lieu = **points de contrôle territorial automatiques**!

**Bon game!** 🍺👑🗺️
