# Configuration de l'authentification sociale - DrinkWise

## 🔧 Configuration Firebase Console

Pour activer la connexion sociale avec Google et Facebook, vous devez configurer ces providers dans la console Firebase.

### 1. Google Authentication

1. **Aller dans Firebase Console** : https://console.firebase.google.com/
2. **Sélectionner votre projet** : drinkwise-31d3a
3. **Authentication** > **Sign-in method**
4. **Activer Google** :
   - Cliquer sur "Google"
   - Activer le provider
   - Ajouter votre email comme support email
   - Sauvegarder

### 2. Facebook Authentication

1. **Créer une app Facebook** : https://developers.facebook.com/
2. **Récupérer App ID et App Secret**
3. **Dans Firebase Console** :
   - Activer "Facebook" dans Sign-in method
   - Ajouter l'App ID et App Secret de Facebook
   - Copier l'URL de redirection OAuth fournie par Firebase
4. **Dans Facebook Developers** :
   - Ajouter l'URL de redirection dans les paramètres OAuth
   - Activer "Facebook Login" dans les produits

### 3. Configuration des domaines autorisés

Dans Firebase Console > Authentication > Settings > Authorized domains :
- Ajouter votre domaine de production
- Les domaines localhost sont déjà autorisés pour le développement

## 🔒 Sécurité

- **Google** : Utilise OAuth 2.0 avec scopes `profile` et `email`
- **Facebook** : Utilise Facebook Login avec permissions `email` et `public_profile`
- Les tokens sont automatiquement gérés par Firebase Auth
- Rotation automatique des tokens de rafraîchissement

## 🧪 Test

Pour tester en développement :
1. S'assurer que `localhost:5173` et `localhost:5174` sont dans les domaines autorisés
2. Tester la connexion Google (fonctionne immédiatement)
3. Tester la connexion Facebook (nécessite la configuration complète)

## 📱 Production

Pour le déploiement :
1. Ajouter `drinkwiseapp.netlify.app` dans les domaines autorisés Firebase
2. Mettre à jour les URLs de redirection dans Facebook Developers
3. Vérifier que les popups ne sont pas bloqués

## 🔧 Dépannage

**Popup bloqué** : 
- Vérifier que les popups sont autorisés pour le site
- Utiliser `signInWithRedirect` au lieu de `signInWithPopup` si nécessaire

**Account exists with different credential** :
- L'utilisateur a déjà un compte avec le même email mais via un autre provider
- Proposer à l'utilisateur de se connecter avec son method original puis lier les comptes

**Operation not allowed** :
- Le provider n'est pas activé dans Firebase Console
- Vérifier la configuration dans Authentication > Sign-in method