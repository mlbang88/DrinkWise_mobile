# 🗺️ Système de Contrôle Territorial - Documentation MVP

## 📋 Vue d'ensemble

Le système de contrôle territorial permet aux utilisateurs de **conquérir des bars et lieux** via Google Maps, créant une expérience gamifiée de **domination territoriale** basée sur les sorties réelles.

### Concept clé
**"Conquiers la ville, un verre à la fois"** 🍺👑

Chaque soirée dans un bar = points de contrôle territorial. Plus tu reviens, plus tu contrôles le lieu!

---

## 🎯 Fonctionnalités MVP (Phase 1)

### ✅ Implémenté

1. **Recherche de lieux Google Maps**
   - Modal de recherche avec autocomplete
   - Géolocalisation automatique
   - Détails complets des lieux (adresse, note, horaires)
   - Debounce 300ms pour optimiser les requêtes

2. **Système de points de contrôle**
   - Points de base par visite: **10 pts**
   - Bonus nouveau lieu: **+50 pts**
   - Bonus première prise de contrôle: **+100 pts**
   - Bonus reprise de territoire: **+75 pts**
   - Bonus défense: **+25 pts**
   - Multiplicateurs de série (streak)
   - Bonus mode compétitif: **+20 pts**
   - Bonus groupe: **x1.5**
   - Bonus mode explorateur: **+30 pts**

3. **Niveaux de contrôle**
   - 🥉 **Bronze** (0-99 pts) - Multiplicateur x1.0
   - 🥈 **Argent** (100-249 pts) - Multiplicateur x1.2
   - 🥇 **Or** (250-499 pts) - Multiplicateur x1.5
   - 💎 **Platine** (500-999 pts) - Multiplicateur x2.0
   - 💠 **Diamant** (1000+ pts) - Multiplicateur x3.0

4. **Intégration CompetitivePartyModal**
   - Bouton "Rechercher un lieu" remplace input texte
   - Sauvegarde automatique des données venue
   - Mise à jour du contrôle territorial après chaque soirée
   - Notifications de conquête/défense

5. **Firestore Schema**
   ```
   artifacts/{appId}/
     ├── venues/{placeId}
     │   ├── placeId: string
     │   ├── name: string
     │   ├── address: string
     │   ├── coordinates: { lat, lng }
     │   ├── types: string[]
     │   ├── rating: number
     │   ├── totalVisits: number
     │   ├── uniqueVisitors: number
     │   ├── currentController: {
     │   │   userId, username, controlPoints, level, since
     │   │   }
     │   └── discoveredBy: { userId, username }
     │
     └── venueControls/{userId_placeId}
         ├── placeId: string
         ├── venueName: string
         ├── userId: string
         ├── totalPoints: number
         ├── visitCount: number
         ├── visitStreak: number
         ├── level: string (BRONZE, ARGENT, OR, PLATINE, DIAMANT)
         ├── controlledSince: timestamp
         ├── lastVisit: timestamp
         └── pointsHistory: array
   ```

6. **Services créés**
   - `googleMapsService.js` - Wrapper API Google Maps
   - `venueService.js` - Logique de contrôle territorial

---

## 🛠️ Configuration Google Maps API

### Étapes de setup

1. **Google Cloud Console**
   - Aller sur: https://console.cloud.google.com/
   - Créer un nouveau projet ou utiliser existant
   - Activer la facturation (requis, mais 200$/mois gratuits)

2. **Activer les APIs**
   - Places API (New)
   - Geocoding API
   - Maps JavaScript API

3. **Créer une clé API**
   - "APIs & Services" > "Credentials"
   - "Create Credentials" > "API Key"
   - Copier la clé

4. **Restrictions recommandées**
   ```
   Application restrictions:
   - HTTP referrers
   - https://yourdomain.com/*
   - http://localhost:*
   
   API restrictions:
   - Places API (New)
   - Geocoding API
   - Maps JavaScript API
   ```

5. **Ajouter à .env**
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
   ```

6. **Redémarrer l'app**
   ```bash
   npm run dev
   ```

---

## 💰 Coûts estimés

### Tarification Google Maps
- **Places API**: $17 / 1,000 requêtes
- **Geocoding API**: $5 / 1,000 requêtes
- **Maps JavaScript API**: $7 / 1,000 chargements

### Crédit gratuit
- **200$/mois** de crédit Google Maps
- ≈ **12,000 recherches/mois gratuites**

### Estimation réaliste
Pour **1000 utilisateurs actifs**:
- 3 recherches/utilisateur/mois = 3,000 requêtes
- Coût après crédit gratuit: **~$20-30/mois**

### Optimisations implémentées
- ✅ Cache 30 minutes (réduit 50% des requêtes)
- ✅ Debounce 300ms (évite requêtes inutiles)
- ✅ Pas de map loading dans MVP (économie $7/1k)

---

## 📱 UX Flow

### Flux utilisateur

1. **Créer une soirée compétitive**
   - Ouvrir CompetitivePartyModal
   - Cliquer "📍 Rechercher un lieu"

2. **Rechercher un bar**
   - Taper le nom (ex: "Le Bistrot")
   - Autocomplete affiche suggestions
   - Géolocalisation priorise lieux proches

3. **Sélectionner le lieu**
   - Cliquer sur suggestion
   - Voir détails complets (note, adresse, horaires)
   - Confirmer sélection

4. **Terminer la soirée**
   - Remplir drinks, stats, etc.
   - Cliquer "Terminer & Quiz"
   - **Calcul automatique des points territoriaux**

5. **Voir résultat**
   - Notification de conquête/défense
   - Points gagnés affichés
   - Niveau de contrôle mis à jour

---

## 🎮 Mécanique de jeu

### Stratégies de joueurs

**1. Le Défenseur** 🛡️
- Retourner au même bar régulièrement
- Accumuler des points de défense (+25 pts)
- Profiter du multiplicateur de série
- Atteindre niveau Diamant sur son bar préféré

**2. L'Explorateur** 🗺️
- Découvrir de nouveaux lieux
- Bonus +50 pts par nouveau lieu
- Mode explorateur: +30 pts supplémentaires
- Collectionner les premières prises de contrôle (+100 pts)

**3. Le Conquérant** ⚔️
- Reprendre les bars des autres
- Bonus takeover: +75 pts
- Créer des rivalités territoriales
- Dominer un quartier entier

**4. Le Social** 👥
- Organiser des soirées de groupe
- Multiplicateur x1.5 en groupe
- Conquérir en équipe
- Bonus organisateur

### Synergies avec Battle Royale

Les **5 modes de jeu** Battle Royale influencent le contrôle territorial:

- 🧘 **Modération** (x1.3 XP) - Points de défense augmentés
- 🗺️ **Explorateur** (x1.25 XP) - +30 pts bonus nouveaux lieux
- 🎭 **Social** (x1.2 XP) - Multiplicateur groupe amélioré
- ⚖️ **Balanced** (x1.15 XP) - Bonus équilibrés
- 🎉 **Party** (x1.1 XP) - Points de base augmentés

---

## 🔮 Fonctionnalités futures (Phase 2+)

### Prochaines étapes

**Phase 2: Visualisation** (2 semaines)
- [ ] MapPage.jsx avec carte interactive
- [ ] Marqueurs de lieux contrôlés (couleur par niveau)
- [ ] Heatmap des zones de contrôle
- [ ] Itinéraire vers lieux proches

**Phase 3: Quartiers** (3 semaines)
- [ ] Système de quartiers (arrondissements)
- [ ] Contrôle de quartier (majorité de bars)
- [ ] Bonus de quartier (+100 pts/jour)
- [ ] Rivalités entre quartiers

**Phase 4: Teams** (2 semaines)
- [ ] Création d'équipes territoriales
- [ ] Conquête collaborative
- [ ] Leaderboard par équipe
- [ ] Raids territoriaux

**Phase 5: Events** (2 semaines)
- [ ] Territory Wars (guerres de territoire)
- [ ] Happy Hours x2 points
- [ ] Conquête flash (24h)
- [ ] Défis de quartier

**Phase 6: Récompenses** (1 semaine)
- [ ] Badges territoriaux (Empereur de Montmartre)
- [ ] Titres exclusifs (Baron du 11e)
- [ ] Réductions IRL (partenariats bars)
- [ ] Trophées physiques

---

## 🏆 Métriques de succès MVP

### KPIs à suivre

**Engagement**
- Utilisation recherche de lieu: **>60%** des soirées
- Soirées avec lieu vs sans lieu
- Taux de retour au même lieu: **>30%**

**Gamification**
- Moyenne points/utilisateur/mois
- Distribution des niveaux (Bronze → Diamant)
- Nombre de takeovers (reprises)
- Longest streak (série la plus longue)

**Technique**
- Coût API Google Maps/mois
- Latence recherche (<500ms)
- Cache hit rate (>50%)
- Erreurs API (<1%)

---

## 🧪 Tests suggérés

### Scénarios de test

1. **Recherche de base**
   - [ ] Taper "bistrot" → voir suggestions
   - [ ] Sélectionner lieu → voir détails
   - [ ] Confirmer → bouton affiche nom lieu

2. **Première conquête**
   - [ ] Terminer soirée avec nouveau lieu
   - [ ] Vérifier notification "👑 Nouveau territoire!"
   - [ ] Firestore: venue créée avec currentController

3. **Défense de territoire**
   - [ ] Retourner au même lieu
   - [ ] Vérifier bonus défense (+25 pts)
   - [ ] Firestore: visitStreak incrémenté

4. **Reprise de territoire** (test 2 users)
   - [ ] User A contrôle Bar X
   - [ ] User B visite Bar X
   - [ ] Vérifier notification "⚔️ Territoire conquis!"
   - [ ] Firestore: currentController = User B

5. **Modes de jeu**
   - [ ] Mode explorateur → vérifier +30 pts
   - [ ] Mode compétitif → vérifier +20 pts
   - [ ] Groupe → vérifier x1.5 multiplicateur

---

## 🐛 Troubleshooting

### Problèmes courants

**"Google Maps API non configurée"**
- Vérifier `.env` contient `VITE_GOOGLE_MAPS_API_KEY`
- Redémarrer serveur dev: `npm run dev`

**"Aucun lieu trouvé"**
- Vérifier Places API (New) activée dans GCP
- Vérifier restrictions API key (localhost autorisé)

**"Erreur 403 Forbidden"**
- API key invalide ou restrictions trop strictes
- Vérifier facturation activée dans GCP

**Cache ne fonctionne pas**
- Vérifier Console: "📦 Résultats depuis le cache"
- Attendre 30 min avant expiration

---

## 📄 Fichiers modifiés/créés

### Nouveaux fichiers
```
src/
├── services/
│   ├── googleMapsService.js  (380 lignes)
│   └── venueService.js        (420 lignes)
└── components/
    └── VenueSearchModal.jsx   (350 lignes)

.env.example                    (mis à jour)
firestore.rules                 (ajout venues/venueControls)
```

### Fichiers modifiés
```
src/components/CompetitivePartyModal.jsx
- Import VenueSearchModal, venueService, MapPin icon
- État venue, showVenueSearch
- Bouton recherche lieu remplace input texte
- Sauvegarde venue dans partyData
- Appel updateVenueControl() après soirée
```

---

## 🎨 Design System

### Couleurs des niveaux
```css
Bronze:  #CD7F32  (cuivre)
Argent:  #C0C0C0  (argenté)
Or:      #FFD700  (doré brillant)
Platine: #E5E4E2  (gris platine)
Diamant: #B9F2FF  (bleu cristal)
```

### Icônes utilisées
- 📍 `MapPin` - Lieux
- 👑 Nouvelle conquête
- ⚔️ Reprise de territoire
- 🛡️ Défense
- 🔥 Série (streak)
- 🗺️ Mode explorateur
- 👥 Groupe
- 🏆 Mode compétitif

---

## 💡 Conseils d'implémentation

### Best practices

1. **Toujours vérifier venue avant updateVenueControl**
   ```js
   if (venue) {
     await venueService.updateVenueControl(...);
   }
   ```

2. **Gérer les erreurs gracieusement**
   ```js
   try {
     const result = await updateVenueControl(...);
   } catch (error) {
     console.error('Erreur contrôle territorial:', error);
     // L'app continue de fonctionner
   }
   ```

3. **Utiliser le cache pour économiser**
   - Cache 30 min implémenté automatiquement
   - Pas besoin de clearCache() sauf debug

4. **Logger pour debugging**
   - Tous les services utilisent logger.js
   - Console affiche 🗺️ pour territorial
   - Breakdown des points visible

---

## 🚀 Prochaines actions

### Pour l'utilisateur final

1. **Setup Google Maps API**
   - Suivre instructions dans `.env.example`
   - Activer facturation GCP
   - Créer et configurer API key

2. **Tester MVP**
   - Créer soirée compétitive
   - Rechercher un bar
   - Vérifier points dans Console

3. **Feedback**
   - Latence recherche acceptable?
   - UX VenueSearchModal intuitive?
   - Points/niveaux motivants?

### Pour le développeur

1. **Monitoring**
   - Suivre coûts GCP quotidiennement
   - Analyser logs Firestore
   - Optimiser cache si nécessaire

2. **Phase 2 planning**
   - Décider priorité: Map vs Quartiers vs Teams?
   - Designer UI MapPage
   - Estimer temps développement

3. **Partenariats bars**
   - Contacter bars locaux
   - Proposer visibilité dans app
   - Négocier réductions utilisateurs actifs

---

## 📞 Support

**Issues connues**: Aucune pour le moment

**Contact**: Check console logs avec logger.js

**Documentation API**:
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)

---

*Créé le 3 octobre 2025 - Version MVP 1.0* 🗺️🍺👑
