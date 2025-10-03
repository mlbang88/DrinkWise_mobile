# 📊 Source Unique d'Expérience - Documentation

## ✅ PRINCIPE FONDAMENTAL

**Il n'existe qu'UNE SEULE source de vérité pour l'XP et le niveau : `userProfile.publicStats`**

## 🎯 Source de vérité

### ✅ UTILISER (Source unique)
```javascript
// 1. Récupérer les stats depuis publicStats
const stats = {
    totalParties: userProfile.publicStats?.totalParties || 0,
    totalDrinks: userProfile.publicStats?.totalDrinks || 0,
    totalChallenges: userProfile.publicStats?.challengesCompleted || 0,
    totalBadges: userProfile.publicStats?.unlockedBadges?.length || 0,
    totalQuizQuestions: userProfile.publicStats?.totalQuizQuestions || 0
};

// 2. Calculer l'XP depuis ces stats
const currentXp = ExperienceService.calculateTotalXP(stats);
const currentLevel = ExperienceService.calculateLevel(currentXp);
const currentLevelName = ExperienceService.getLevelName(currentLevel);
```

### ❌ NE PLUS UTILISER (Déprécié)
```javascript
// ❌ DÉPRÉCIÉ - Ne jamais utiliser
const xp = userProfile.xp;          // ❌ Peut être désynchronisé
const level = userProfile.level;    // ❌ Peut être désynchronisé
const levelName = userProfile.levelName;  // ❌ Peut être désynchronisé
```

## 📁 Fichiers corrigés

### ✅ ProfilePage.jsx
- **Avant**: Triple fallback (frozenStats → stableStats → publicStats)
- **Après**: Source unique `publicStats` via useMemo
```javascript
const stats = useMemo(() => {
    const publicStats = userProfile?.publicStats || {};
    return {
        totalParties: publicStats.totalParties || 0,
        totalDrinks: publicStats.totalDrinks || 0,
        totalChallenges: publicStats.challengesCompleted || 0,
        totalBadges: publicStats.unlockedBadges?.length || 0,
        totalQuizQuestions: publicStats.totalQuizQuestions || 0
    };
}, [userProfile?.publicStats]);
```

### ✅ HomePage.jsx
- **Avant**: Fallback vers `userProfile.xp` et `userProfile.level`
- **Après**: Recalcule depuis `publicStats` si nécessaire
```javascript
if (userProfile?.publicStats?.level !== undefined) {
    userLevel = userProfile.publicStats.level;
    userLevelName = userProfile.publicStats.levelName || '';
} else if (userProfile?.publicStats) {
    // Recalcul depuis publicStats
    const stats = { /* ... */ };
    const currentXp = ExperienceService.calculateTotalXP(stats);
    userLevel = ExperienceService.calculateLevel(currentXp);
    userLevelName = ExperienceService.getLevelName(userLevel);
}
```

### ✅ QuizManagerSimple.jsx
- **Avant**: `const oldXp = userProfile.xp || 0;`
- **Après**: Calcul depuis `publicStats`
```javascript
const stats = {
    totalParties: userProfile.publicStats?.totalParties || 0,
    totalDrinks: userProfile.publicStats?.totalDrinks || 0,
    totalChallenges: userProfile.publicStats?.challengesCompleted || 0,
    totalBadges: userProfile.publicStats?.unlockedBadges?.length || 0,
    totalQuizQuestions: userProfile.publicStats?.totalQuizQuestions || 0
};
const oldXp = ExperienceService.calculateTotalXP(stats);
const oldLevel = ExperienceService.calculateLevel(oldXp);
```

### ✅ badgeService.js
- **Avant**: Synchronisait `userProfile.xp` et `userProfile.level`
- **Après**: Ne synchronise plus que `publicStats`
```javascript
// ❌ SUPPRIMÉ - Ne plus synchroniser
// if ((userProfile.xp || 0) !== cumulativeStats.totalXP) {
//     profileUpdates.xp = cumulativeStats.totalXP;
// }
// if ((userProfile.level || 1) !== cumulativeStats.level) {
//     profileUpdates.level = cumulativeStats.level;
// }

// ✅ GARDÉ - publicStats est la source unique
if (publicStatsChanged) {
    profileUpdates.publicStats = newPublicStats;
}
```

## 🔄 Flux de calcul

```
1. Événement (nouvelle soirée, badge, challenge, etc.)
   ↓
2. badgeService.syncPublicStats() recalcule TOUT depuis les données réelles
   ↓
3. Mise à jour de publicStats dans Firestore
   ↓
4. FirebaseContext écoute les changements de publicStats
   ↓
5. Tous les composants utilisent publicStats pour calculer XP/niveau
```

## 🚨 Points d'attention

### Pourquoi `userProfile.xp` était problématique ?
1. **Désynchronisation**: Modifié à différents endroits avec des valeurs différentes
2. **Sources multiples**: frozenStats, stableStats, cachedXP créaient de la confusion
3. **Oscillations**: Le même utilisateur voyait des niveaux différents selon la page
4. **Bugs visuels**: Niveau 20 sur Friends, niveau 19 sur Profile

### Solution appliquée
1. **Une seule source**: `publicStats` calculé depuis les données réelles
2. **Calcul déterministe**: Même stats = même XP = même niveau
3. **Pas de cache**: On recalcule à chaque fois depuis `publicStats` (rapide car simple formule)

## 📝 Checklist pour nouveaux composants

Quand tu crées un nouveau composant qui affiche XP/niveau:

- [ ] ✅ Importer `ExperienceService`
- [ ] ✅ Lire `userProfile.publicStats`
- [ ] ✅ Construire l'objet `stats` avec les 5 propriétés
- [ ] ✅ Calculer XP via `ExperienceService.calculateTotalXP(stats)`
- [ ] ✅ Calculer niveau via `ExperienceService.calculateLevel(xp)`
- [ ] ✅ Calculer nom via `ExperienceService.getLevelName(level)`
- [ ] ❌ NE JAMAIS utiliser `userProfile.xp` ou `userProfile.level`

## 🎉 Résultat

**Niveau cohérent partout**: Que tu sois sur ProfilePage, HomePage, FriendsPage, ou n'importe où, le niveau affiché est **toujours le même** car calculé depuis **la même source unique**.

---

*Dernière mise à jour: 3 octobre 2025*
*Auteur: Refactoring XP System v2.0*
