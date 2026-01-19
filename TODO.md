# 📋 TODO List - DrinkWise Development

## 🔥 PRIORITÉ CRITIQUE (À faire immédiatement)

### 1. Configuration Audio
- [ ] Télécharger 8 fichiers audio libres de droits
  - achievement.mp3
  - level-up.mp3
  - badge.mp3
  - notification.mp3
  - message.mp3
  - success.mp3
  - error.mp3
  - warning.mp3
- [ ] Les placer dans `public/sounds/`
- [ ] Tester le système de notifications enrichies
- [ ] **Sources recommandées :**
  - https://freesound.org/
  - https://mixkit.co/free-sound-effects/
  - https://www.zapsplat.com/

### 2. Mise à jour Firebase
- [ ] Déployer les nouvelles règles Firestore (firestore.rules)
- [ ] Tester les règles pour chat et stories
- [ ] Vérifier les permissions Storage pour les stories

### 3. Intégrations dans App.jsx
- [ ] Ajouter OnboardingFlow au composant principal
- [ ] Intégrer enhancedNotifications dans les actions existantes
- [ ] Tester l'onboarding sur première visite

---

## 🚀 PRIORITÉ HAUTE (Cette semaine)

### Interface & UX
- [ ] Ajouter un bouton "Messages" dans la navigation principale
- [ ] Ajouter un bouton "Stories" dans la navigation ou HomePage
- [ ] Créer une page dédiée aux conversations (ChatPage.jsx)
- [ ] Intégrer StoryRings dans le feed ou une section dédiée
- [ ] Ajouter des badges de notification pour messages non lus

### Système de Chat
- [ ] Fetch et affichage des noms/avatars des utilisateurs
- [ ] Implémenter l'envoi d'images
- [ ] Implémenter l'envoi de localisation
- [ ] Ajouter les emojis picker
- [ ] Recherche dans les conversations
- [ ] Support des messages vocaux (bonus)

### Système de Stories
- [ ] Ring de stories dans le feed avec indicateur "non vu"
- [ ] Support caméra native (Capacitor Camera API)
- [ ] Filtres et stickers pour les stories (bonus)
- [ ] Partage de story depuis une soirée
- [ ] Réponse aux stories par message privé

### Stats Tracking
- [ ] Ajouter le tracking de `consecutivePartiesWeekend`
- [ ] Ajouter le tracking de `organizedParties`
- [ ] Ajouter le tracking de `uniqueCities`
- [ ] Ajouter le tracking de `uniqueCocktails`
- [ ] Ajouter le tracking de `uniqueBeers`
- [ ] Mettre à jour partyService.js pour sauvegarder ces stats

---

## 📅 PRIORITÉ MOYENNE (Prochaines 2 semaines)

### Calendrier d'Événements
- [ ] Créer EventService.js
- [ ] Créer EventCalendar.jsx (vue calendrier)
- [ ] Créer EventCard.jsx (carte d'événement)
- [ ] Créer EventCreator.jsx (création d'événement)
- [ ] Créer EventDetails.jsx (page détails)
- [ ] Système d'invitations
- [ ] Gestion des confirmations (Oui/Non/Peut-être)
- [ ] Notifications de rappel
- [ ] Intégration Google Calendar API
- [ ] Export .ics pour ajout au calendrier

### Statistiques Avancées
- [ ] Installer recharts ou chart.js
- [ ] Créer StatsPage.jsx avec onglets
- [ ] Graphique de tendance de consommation
- [ ] Graphique de tendance XP
- [ ] Heatmap des jours de sortie
- [ ] Comparaison avec amis (radar chart)
- [ ] Top 10 des boissons préférées
- [ ] Statistiques par période (semaine/mois/année)
- [ ] Export PDF des statistiques

### Optimisations Performance
- [ ] Lazy loading des routes avec React.lazy()
- [ ] Code splitting par fonctionnalité
- [ ] Optimisation des images (WebP, lazy load)
- [ ] Memoization des composants (React.memo)
- [ ] Virtualisation des longues listes (react-window)
- [ ] Service Worker pour cache offline avancé
- [ ] Pagination des messages/stories/feed

---

## 🎯 PRIORITÉ BASSE (Long terme - 1+ mois)

### Recommandations IA (Gemini)
- [ ] Créer AIRecommendationService.js
- [ ] Intégration Google Places API
- [ ] Algorithme de recommandation de bars
- [ ] Suggestions d'événements personnalisées
- [ ] Découverte de nouvelles boissons
- [ ] Suggestions d'amis (intérêts similaires)
- [ ] Itinéraires de soirée optimisés
- [ ] Page RecommendationsPage.jsx
- [ ] Insights comportementaux avec graphiques

### Système de Cashback/Récompenses
- [ ] Créer RewardService.js
- [ ] Wallet virtuel (points/argent)
- [ ] Système de points par soirée
- [ ] QR code de validation en établissement
- [ ] Marketplace de récompenses
- [ ] Gestion des partenaires (admin panel)
- [ ] Historique des transactions
- [ ] Conversion points → réductions
- [ ] Cartes de fidélité digitales
- [ ] Page WalletPage.jsx
- [ ] Page MarketplacePage.jsx

### Mode Tournoi avec Brackets
- [ ] Créer TournamentService.js
- [ ] Algorithme de bracket (single/double elimination)
- [ ] Système de matchmaking
- [ ] Planning automatique des matches
- [ ] Live scores et résultats
- [ ] Notifications de match
- [ ] Récompenses pour les vainqueurs
- [ ] Classements globaux et locaux
- [ ] Historique des tournois
- [ ] TournamentBracket.jsx (visualisation)
- [ ] TournamentCreator.jsx
- [ ] MatchRoom.jsx (page de match live)
- [ ] TournamentHistory.jsx

---

## 🛠️ AMÉLIORATIONS TECHNIQUES

### Tests
- [ ] Configurer Vitest proprement
- [ ] Tests unitaires pour services critiques
  - [ ] badgeService.js
  - [ ] chatService.js
  - [ ] storyService.js
  - [ ] partyService.js
- [ ] Tests d'intégration pour flows principaux
  - [ ] Création de soirée
  - [ ] Envoi de message
  - [ ] Création de story
- [ ] Tests E2E avec Playwright
  - [ ] Onboarding flow
  - [ ] Inscription/connexion
  - [ ] Création de soirée complète
- [ ] Viser 80%+ de coverage

### Sécurité
- [ ] Audit complet des règles Firestore
- [ ] Validation stricte de tous les inputs
- [ ] Rate limiting sur Firebase Functions
- [ ] Content Security Policy (CSP)
- [ ] Protection XSS dans le chat
- [ ] Protection CSRF
- [ ] Encryption des données sensibles
- [ ] Scan de vulnérabilités (npm audit)

### SEO & Accessibilité
- [ ] Meta tags dynamiques par page
- [ ] Schema.org markup pour événements
- [ ] Robots.txt optimisé
- [ ] Sitemap.xml automatique
- [ ] ARIA labels sur tous les composants interactifs
- [ ] Navigation complète au clavier
- [ ] Support lecteurs d'écran
- [ ] Contrast ratio WCAG AA minimum
- [ ] Focus visible sur tous les éléments
- [ ] Tests avec Lighthouse (score 90+)

### Documentation
- [ ] JSDoc sur tous les services
- [ ] Storybook pour les composants UI
- [ ] Guide de contribution (CONTRIBUTING.md)
- [ ] Changelog détaillé (CHANGELOG.md)
- [ ] Architecture Decision Records (ADR)
- [ ] API documentation (si API publique)

---

## 🐛 BUGS CONNUS À CORRIGER

### Critiques
- [ ] Chat : Noms d'utilisateurs non affichés (fetch depuis users collection)
- [ ] Stories : Avatars par défaut (fetch depuis users collection)
- [ ] Permissions Storage pour upload de stories

### Moyens
- [ ] Performance : Re-renders inutiles dans FeedPage (déjà documenté)
- [ ] Memory leaks potentiels dans les listeners Firestore
- [ ] Messages d'erreur trop techniques pour l'utilisateur

### Mineurs
- [ ] Animations parfois saccadées sur Android bas de gamme
- [ ] États de chargement manquants sur certaines actions
- [ ] Traductions françaises inconsistantes

---

## 💡 IDÉES FUTURES (Backlog)

### Fonctionnalités Bonus
- [ ] 🎵 Intégration Spotify (playlists de soirée)
- [ ] 🚕 Intégration Uber/Bolt (retour sécurisé)
- [ ] 🍕 Commande de nourriture (UberEats API)
- [ ] 📸 Génération automatique de résumés photo/vidéo
- [ ] 🎮 Mini-jeux en soirée (beer pong tracker, etc.)
- [ ] 🌐 Version web desktop complète
- [ ] 👓 Support AR pour mesurer les verres (bonus fun)
- [ ] 🎙️ Commandes vocales (Siri/Google Assistant)

### Social Avancé
- [ ] Livestream de soirée (WebRTC)
- [ ] Partage de localisation en temps réel
- [ ] Mode "Soirée de groupe" avec stats partagées
- [ ] Création de défis personnalisés entre amis
- [ ] Système de parrainages/referral

### Monétisation
- [ ] Abonnement Premium avec features exclusives
- [ ] Publicités non intrusives (bannières partenaires)
- [ ] Commission sur le cashback des partenaires
- [ ] Vente de badges/skins exclusifs
- [ ] Organisation d'événements sponsorisés

---

## 📊 MÉTRIQUES DE SUCCÈS

### Performance
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] Lighthouse score > 90
- [ ] Bundle size < 500kb (gzipped)

### Qualité
- [ ] Test coverage > 80%
- [ ] 0 erreurs ESLint
- [ ] 0 vulnérabilités critiques (npm audit)
- [ ] Accessibilité WCAG AA

### User Experience
- [ ] Taux de complétion onboarding > 80%
- [ ] Taux de rétention J7 > 50%
- [ ] Temps moyen de session > 5 min
- [ ] Taux d'engagement avec stories > 30%

---

## ⏱️ ESTIMATIONS DE TEMPS

| Tâche | Estimation | Priorité |
|-------|-----------|----------|
| Configuration audio | 1h | 🔥 Critique |
| Firebase update | 30min | 🔥 Critique |
| Intégrations App.jsx | 2h | 🔥 Critique |
| Système chat complet | 1-2 jours | 🚀 Haute |
| Système stories complet | 1-2 jours | 🚀 Haute |
| Calendrier événements | 1 semaine | 📅 Moyenne |
| Stats avancées | 1 semaine | 📅 Moyenne |
| Recommandations IA | 2 semaines | 🎯 Basse |
| Cashback système | 2 semaines | 🎯 Basse |
| Mode tournoi | 1 semaine | 🎯 Basse |
| Optimisations | 1 semaine | 🛠️ Continue |
| Tests complets | 1 semaine | 🛠️ Continue |

**Total estimé : ~2-3 mois pour features complètes**

---

## 📝 NOTES

### Conventions de Code
- Utiliser ESLint et Prettier
- Composants en PascalCase
- Fichiers en camelCase
- Constantes en UPPER_SNAKE_CASE
- Commits en français, messages descriptifs
- Branches : feature/nom-feature, fix/nom-bug

### Git Workflow
1. Créer une branche depuis `main`
2. Développer et tester localement
3. Commit réguliers avec messages clairs
4. Push et créer une PR
5. Review et merge dans `main`

### Avant Chaque Commit
- [ ] Tester localement
- [ ] Vérifier les erreurs console
- [ ] Linter (npm run lint)
- [ ] Build sans erreurs (npm run build)

---

**Dernière mise à jour :** 2024  
**Maintenu par :** Maxime Labonde

*Ce TODO est un document vivant, à mettre à jour régulièrement au fur et à mesure de l'avancement du projet.*
