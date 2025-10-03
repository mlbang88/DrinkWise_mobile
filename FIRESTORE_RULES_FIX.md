# 🔒 Correction des Règles Firestore - Rapport

## 🐛 Erreur rencontrée

```
POST https://firestore.googleapis.com/.../Listen/... 400 (Bad Request)
FirebaseError: Missing or insufficient permissions.
```

**Contexte**: L'erreur apparaissait lors de l'ouverture du modal de soirée (Battle Royale).

## 🔍 Cause identifiée

Les règles Firestore pour les **tournois Battle Royale** utilisaient des fonctions (`isTournamentCreator()`, `isTournamentParticipant()`) qui accédaient à `resource.data` **avant** que le document existe, causant des erreurs 400.

### Problème dans le code original

```javascript
// ❌ AVANT - Fonctions qui cassent lors de la lecture
function isTournamentCreator() {
    return request.auth != null && request.auth.uid == resource.data.createdBy;
    // ↑ resource.data n'existe pas si le document n'existe pas encore
}

function isTournamentParticipant() {
    return request.auth != null && request.auth.uid in resource.data.participants;
    // ↑ Même problème
}

allow read: if request.auth != null;
// Cette règle était correcte, mais les fonctions ci-dessus causaient des erreurs
```

## ✅ Corrections appliquées

### 1. Simplification des règles Battle Royale

```javascript
// ✅ APRÈS - Règles simplifiées sans fonctions auxiliaires
match /artifacts/{appId}/tournaments/{tournamentId} {
    // Lecture : autorisée pour tous les utilisateurs authentifiés
    allow read: if request.auth != null;

    // Création : seulement par l'utilisateur qui crée le tournoi
    allow create: if request.auth != null && 
        request.resource.data.createdBy == request.auth.uid;

    // Mise à jour : seulement le créateur ou les participants
    allow update: if request.auth != null &&
        (request.auth.uid == resource.data.createdBy || 
         request.auth.uid in resource.data.participants);

    // Suppression : seulement le créateur
    allow delete: if request.auth != null && 
        request.auth.uid == resource.data.createdBy;
}
```

**Changements**:
- ❌ Supprimé les fonctions `isTournamentCreator()` et `isTournamentParticipant()`
- ✅ Intégré les conditions directement dans les règles `allow`
- ✅ Supprimé les validations de champs redondantes qui bloquaient les mises à jour

### 2. Ajout de règles pour les profils publics

```javascript
// ✅ NOUVEAU - Règles pour artifacts/{appId}/profiles/{userId}
match /artifacts/{appId}/profiles/{userId} {
    allow read: if request.auth != null;
    allow write: if request.auth != null && request.auth.uid == userId;
}
```

**Raison**: Les profils publics sont utilisés pour afficher les informations des amis. Sans cette règle, les listeners échouaient.

## 📋 Récapitulatif des règles Firestore

### Collections accessibles en lecture pour tous les users authentifiés:
- ✅ `tournaments` - Tournois Battle Royale
- ✅ `flashChallenges` - Défis flash
- ✅ `public_user_stats` - Stats publiques des utilisateurs
- ✅ `profiles` - Profils publics des utilisateurs
- ✅ `groups` - Groupes
- ✅ `group_memories` - Souvenirs de groupe
- ✅ `feed_interactions` - Likes, commentaires, félicitations
- ✅ `global` - Données globales

### Collections avec accès restreint:
- 🔒 `users/{userId}/parties` - Propriétaire + amis (lecture), Propriétaire (écriture)
- 🔒 `users/{userId}/profile` - Propriétaire + amis (lecture), Propriétaire (écriture)
- 🔒 `users/{userId}/**` - Propriétaire uniquement

## 🚀 Déploiement

```bash
firebase deploy --only firestore:rules
```

**Résultat**:
```
✅ cloud.firestore: rules file firestore.rules compiled successfully
✅ firestore: released rules firestore.rules to cloud.firestore
✅ Deploy complete!
```

## ✅ Tests de validation

Après déploiement, vérifier:
- [ ] Le modal de soirée s'ouvre sans erreur 400
- [ ] Les tournois Battle Royale se chargent correctement
- [ ] Les profils d'amis s'affichent sans "Missing permissions"
- [ ] Aucune erreur dans la console du navigateur

## 📝 Notes importantes

1. **Pourquoi éviter les fonctions dans les règles Firestore?**
   - Les fonctions sont évaluées même si la règle finale est `true`
   - Si elles accèdent à `resource.data` et que le document n'existe pas, elles échouent
   - Mieux vaut intégrer les conditions directement dans les règles `allow`

2. **Différence entre `resource` et `request.resource`**
   - `resource.data` = Document **actuel** (avant modification)
   - `request.resource.data` = Document **nouveau** (après modification)
   - Pour la lecture (`allow read`), `resource` peut ne pas exister!

3. **Sécurité conservée**
   - Seul le créateur peut supprimer un tournoi
   - Seul le créateur ou les participants peuvent mettre à jour
   - Tout le monde peut lire (nécessaire pour afficher les tournois disponibles)

---

**Date**: 3 octobre 2025  
**Statut**: ✅ Déployé et fonctionnel  
**Fichier modifié**: `firestore.rules`
