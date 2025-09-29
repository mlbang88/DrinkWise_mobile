# Configuration de l'authentification Google - DrinkWise

## 🔧 Configuration Firebase Console

Pour activer la connexion avec Google, vous devez configurer ce provider dans la console Firebase.

### Google Authentication

1. **Aller dans Firebase Console** : https://console.firebase.google.com/
2. **Sélectionner votre projet** : drinkwise-31d3a
3. **Authentication** > **Sign-in method**
4. **Activer Google** :
   - Cliquer sur "Google"
   - Activer le provider
   - Ajouter votre email comme support email
   - Sauvegarder

### 3. Configuration des domaines autorisés

Dans Firebase Console > Authentication > Settings > Authorized domains :
- Ajouter votre domaine de production
- Les domaines localhost sont déjà autorisés pour le développement

## 🔒 Sécurité

- **Google** : Utilise OAuth 2.0 avec scopes `profile` et `email`
- Les tokens sont automatiquement gérés par Firebase Auth
- Rotation automatique des tokens de rafraîchissement

## 🧪 Test

Pour tester en développement :
1. S'assurer que `localhost:5173` et `localhost:5174` sont dans les domaines autorisés
2. Tester la connexion Google (fonctionne immédiatement après activation)

## 📱 Production

Pour le déploiement :
1. Ajouter `drinkwiseapp.netlify.app` dans les domaines autorisés Firebase
2. Vérifier que les popups ne sont pas bloqués

## 🔧 Dépannage

**Popup bloqué** : 
- Vérifier que les popups sont autorisés pour le site
- Utiliser `signInWithRedirect` au lieu de `signInWithPopup` si nécessaire

**Account exists with different credential** :
- L'utilisateur a déjà un compte avec le même email mais via email/mot de passe
- Proposer à l'utilisateur de se connecter avec son method original

**Operation not allowed** :
- Google provider n'est pas activé dans Firebase Console
- Vérifier la configuration dans Authentication > Sign-in method