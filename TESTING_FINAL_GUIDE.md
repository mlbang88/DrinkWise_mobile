# Guide de Test Final - DrinkWise 🧪

Version : 1.1.0  
Date : 18 janvier 2026  
Phases : 1, 2, 3 complétées

---

## 📋 Checklist Globale

### Phase 1 - Stabilisation ✅
- [x] XSS protection (DOMPurify)
- [x] Rate limiting (interactions, commentaires)
- [x] Memory leaks fixés
- [x] Batch loading optimisé
- [x] Sentry error monitoring
- [x] Firebase Analytics
- [x] ARIA labels et accessibilité

### Phase 2 - UX Improvements ✅
- [x] Animations fluides (Framer Motion)
- [x] Pull-to-refresh amélioré
- [x] Infinite scroll
- [x] Skeletons de chargement
- [x] Offline mode indicator
- [x] Error retry mechanisms

### Phase 3 - Polish ✅
- [x] Système i18n FR/EN
- [x] Performance tracking (Web Vitals)
- [x] Utilitaires de performance
- [x] Traductions complètes
- [x] Store assets documentation

---

## 🧪 Tests Fonctionnels

### 1. Feed Page

#### Chargement Initial
- [ ] Les skeletons apparaissent pendant le chargement
- [ ] Les posts s'affichent avec animation de fondu
- [ ] Pas de lag ou freeze
- [ ] Images chargent correctement
- [ ] Temps de chargement < 3 secondes (3G)

#### Pull-to-Refresh
- [ ] Tirer vers le bas affiche l'indicateur violet
- [ ] Icône tourne progressivement
- [ ] Texte change ("Tirez" → "Relâchez")
- [ ] Feed se rafraîchit au relâchement
- [ ] Animation fluide sans saccade

#### Infinite Scroll
- [ ] Scroll à 80% déclenche le chargement
- [ ] Spinner apparaît en bas
- [ ] Message "✨ Vous êtes à jour !" s'affiche
- [ ] Pas de requêtes multiples simultanées

#### Interactions Posts
- [ ] Like/reactions fonctionnent instantanément
- [ ] Animation du cœur sur double-tap
- [ ] Commentaires s'ajoutent sans délai
- [ ] Rate limiting bloque les spams
- [ ] Toast notifications apparaissent

#### Offline Mode
- [ ] Bannière rouge "Mode hors ligne" apparaît
- [ ] Interactions échouent gracieusement
- [ ] Message d'erreur clair
- [ ] Bannière verte "Connexion rétablie" au retour online

---

### 2. Performance

#### Web Vitals
```bash
# Ouvrir Chrome DevTools
# Lighthouse → Run audit
```

**Targets** :
- [ ] Performance score > 90
- [ ] Accessibility score > 85
- [ ] Best Practices > 90
- [ ] SEO > 80
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1

#### Bundle Size
```bash
npm run build
```

- [ ] Total gzipped < 300 KB
- [ ] FeedPage chunk < 50 KB
- [ ] Images lazy-loadées

#### Memory Leaks
```bash
# Chrome DevTools → Performance → Memory
# Enregistrer 30 secondes d'utilisation
# Vérifier que la mémoire ne croît pas continuellement
```

- [ ] Pas de croissance linéaire de mémoire
- [ ] Pas de listeners non nettoyés
- [ ] useEffect avec cleanup functions

---

### 3. Accessibilité (A11Y)

#### Navigation Clavier
- [ ] Tab parcourt tous les éléments interactifs
- [ ] Focus visible (outline violet)
- [ ] Enter/Space activent les boutons
- [ ] Escape ferme les modales
- [ ] Skip link fonctionne

#### Screen Reader (NVDA/VoiceOver)
- [ ] Tous les boutons ont des labels ARIA
- [ ] Images ont des alt texts descriptifs
- [ ] Landmarks (main, nav) annoncés
- [ ] États annoncés (expanded, pressed)
- [ ] Live regions pour toasts

#### Contraste
- [ ] Texte blanc sur noir : ratio > 7:1
- [ ] Violet #bf00ff sur noir : > 4.5:1
- [ ] Erreurs en rouge : > 3:1

---

### 4. Internationalisation (i18n)

#### Détection Automatique
```javascript
// Tester dans console
console.log(navigator.language); // devrait détecter 'en' ou 'fr'
```

- [ ] Langue détectée automatiquement
- [ ] Préférence sauvée dans localStorage
- [ ] Re-render automatique au changement

#### Traductions
**Tester avec** :
```javascript
import { setLanguage, t } from './utils/i18n';

setLanguage('en'); // Passer en anglais
// Vérifier tous les textes
setLanguage('fr'); // Repasser en français
```

- [ ] Feed : titre, boutons, messages
- [ ] Erreurs : tous les messages traduits
- [ ] Succès : toasts en bonne langue
- [ ] Offline indicator : textes traduits
- [ ] Bouton "Réessayer" traduit

#### Coverage
- [ ] Navigation (5 clés)
- [ ] Feed (10 clés)
- [ ] Posts (15 clés)
- [ ] Erreurs (10 clés)
- [ ] Succès (6 clés)

---

### 5. Sécurité

#### XSS Protection
**Tester avec** :
```javascript
// Essayer d'ajouter un commentaire avec script
const maliciousComment = '<script>alert("XSS")</script>';
// Devrait être échappé par DOMPurify
```

- [ ] Scripts bloqués dans commentaires
- [ ] HTML échappé dans contenu posts
- [ ] Images XSS bloquées
- [ ] Pas d'eval() ou innerHTML dangereux

#### Rate Limiting
**Tester** :
```javascript
// Spammer les likes rapidement (5+ en 1 seconde)
// Devrait bloquer après 1 par seconde
```

- [ ] Interactions limitées à 1/seconde
- [ ] Commentaires limités à 3/minute
- [ ] Toast "Trop de requêtes" s'affiche
- [ ] Timer visible dans le message

#### Firebase Rules
```bash
# Tester d'accéder aux données d'autres users
# Devrait être bloqué par Firestore rules
```

- [ ] Lecture limitée aux amis + own data
- [ ] Écriture limitée à own data
- [ ] Pas de bypass possible

---

### 6. Erreurs & Edge Cases

#### Connexion Perdue
- [ ] Banner offline apparaît
- [ ] Requêtes échouent gracieusement
- [ ] ErrorRetry component s'affiche
- [ ] Bouton "Réessayer" fonctionne
- [ ] Banner "online" au retour

#### Feed Vide
- [ ] EmptyState component s'affiche
- [ ] Message clair et actionable
- [ ] Bouton "Créer une soirée" visible
- [ ] Pas d'erreur console

#### Images Cassées
- [ ] Placeholder gris s'affiche
- [ ] Alt text lisible
- [ ] Pas de broken image icon
- [ ] Post reste fonctionnel

#### Slow 3G
```bash
# Chrome DevTools → Network → Slow 3G
```

- [ ] Skeletons affichés pendant chargement
- [ ] Pas de timeout
- [ ] Images progressive load
- [ ] UI reste responsive

---

## 🎯 Tests Automatisés

### Vitest (Unit Tests)

```bash
npm test
```

**Coverage requis** : > 60%

- [ ] FeedPage.test.jsx passe
- [ ] InstagramPost.test.jsx passe
- [ ] accessibility.test.jsx passe
- [ ] 0 tests failing

### Lighthouse CI

```bash
npm run lighthouse
```

- [ ] Performance > 90
- [ ] Accessibility > 85
- [ ] Best Practices > 90
- [ ] SEO > 80

---

## 📱 Tests Mobile

### iOS (Safari)

- [ ] Pull-to-refresh natif désactivé
- [ ] Animations fluides 60 FPS
- [ ] Touch events réactifs
- [ ] Safe area respectée (encoche)
- [ ] Pas de bounce scroll indésirable

### Android (Chrome)

- [ ] Touch events précis
- [ ] Haptic feedback fonctionne
- [ ] Back button comportement correct
- [ ] Notifications push OK
- [ ] Pas de lag sur animations

### PWA

- [ ] Service Worker enregistré
- [ ] Cache assets statiques
- [ ] Fonctionne offline (basique)
- [ ] Install prompt apparaît
- [ ] Icon ajoutée à l'écran d'accueil

---

## 🐛 Bugs Connus à Vérifier

### Critique (Bloquants)
- [ ] ~~Feed images flicker~~ ✅ FIXÉ (Phase 1)
- [ ] ~~Memory leak~~ ✅ FIXÉ (Phase 1)
- [ ] ~~XSS vulnerability~~ ✅ FIXÉ (Phase 1)

### Majeurs
- [ ] Infinite scroll peut double-load
- [ ] Pull-refresh peut interférer avec scroll
- [ ] Double-tap peut zoom sur iOS

### Mineurs
- [ ] Animations saccadent sur vieux Android
- [ ] Keyboard push up UI sur iOS
- [ ] Toast peut overlap avec navigation

---

## 📊 Métriques de Succès

### Performance
- **Lighthouse** : > 90 sur tous les critères
- **Bundle size** : < 300 KB gzipped
- **First load** : < 3s sur 3G
- **LCP** : < 2.5s
- **FID** : < 100ms

### Accessibilité
- **axe-core** : 0 violations
- **WCAG 2.1** : Level AA conforme
- **Keyboard nav** : 100% fonctionnel
- **Screen reader** : 100% navigable

### Qualité Code
- **Test coverage** : > 60%
- **Linting** : 0 erreurs
- **TypeScript** : 0 any types
- **Console errors** : 0 en production

---

## 🚀 Déploiement Final

### Pre-Deploy Checklist

- [ ] `npm run build` sans warnings
- [ ] `npm test` tous les tests passent
- [ ] `npm run lint` 0 erreurs
- [ ] Version bump dans package.json
- [ ] CHANGELOG.md mis à jour
- [ ] Git tag créé (v1.1.0)

### Deploy Steps

```bash
# 1. Build production
npm run build

# 2. Test le build localement
npm run preview

# 3. Deploy Vercel
vercel --prod

# 4. Vérifier le site live
# 5. Monitorer Sentry pour erreurs
# 6. Vérifier Analytics Firebase
```

### Post-Deploy Verification

- [ ] Site accessible sur production URL
- [ ] HTTPS fonctionne
- [ ] Service Worker enregistré
- [ ] Pas d'erreurs console
- [ ] Sentry reçoit des events
- [ ] Analytics tracking OK

---

## 📝 Documentation Finale

### À Créer

- [ ] README.md à jour
- [ ] CHANGELOG.md complet
- [ ] API documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

### À Vérifier

- [ ] Tous les TODOs résolus dans le code
- [ ] Commentaires à jour
- [ ] No console.log en production
- [ ] Variables d'env documentées

---

## ✅ Validation Finale

**Reviewer** : _______________  
**Date** : _______________  
**Statut** : ⬜ Prêt pour prod | ⬜ Corrections nécessaires

**Notes** :
```
[Espace pour notes du reviewer]
```

---

## 🎉 Go/No-Go Production

### Critères Bloquants (tous requis)

- [ ] 0 bugs critiques
- [ ] Performance > 85
- [ ] Tests passent à 100%
- [ ] Security audit OK
- [ ] A11Y audit OK

### Recommandations (non-bloquants)

- [ ] Bundle size optimisé
- [ ] i18n complet FR/EN
- [ ] Store assets créés
- [ ] Documentation complète

**Décision finale** : ⬜ GO | ⬜ NO-GO

---

**Dernière mise à jour** : 18 janvier 2026  
**Version testée** : 1.1.0  
**Testé par** : [À compléter]
