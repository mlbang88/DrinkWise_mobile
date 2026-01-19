# 🎉 DrinkWise Mobile

L'application sociale qui transforme vos soirées en aventures épiques ! Suivi de consommation, badges, défis, territoires et bien plus...

## ⚡ Nouveautés (2024)

- 🏆 **35 Badges uniques** : Party Animal, Night Owl, Dancing Queen/King, The Legend...
- 💬 **Messagerie privée** : Chat en temps réel avec vos amis
- 📸 **Stories éphémères** : Partagez vos moments pendant 24h
- 🔔 **Notifications enrichies** : Sons, vibrations et alertes contextuelles
- 👋 **Onboarding interactif** : Introduction en 6 étapes animées
- 🗺️ **Contrôle territorial** : Devenez le roi/la reine de vos bars préférés
- ⚔️ **Battle Royale** : Affrontez vos amis en 1v1

*Voir [FEATURES_IMPLEMENTATION_STATUS.md](FEATURES_IMPLEMENTATION_STATUS.md) pour la liste complète*

## ✨ Fonctionnalités Principales

### 🎮 Gamification
- 🏆 **35 badges** à débloquer (Common, Rare, Epic, Legendary)
- 📈 **100 niveaux** avec système XP complet
- 🎯 **Défis quotidiens** et challenges spéciaux
- ⚔️ **Battle Mode** : Affrontements 1v1 entre amis
- 🗺️ **Territorial Control** : Conquérez des bars et établissements

### 👥 Social
- 💬 **Chat privé** en temps réel (Firestore)
- 📸 **Stories 24h** (photos/vidéos)
- 👫 **Système d'amis** avec demandes
- 👨‍👩‍👧‍👦 **Groupes** et statistiques de groupe
- 🎉 **Feed social** avec likes et commentaires

### 📊 Tracking & Stats
- 🤖 **Détection IA** de boissons (Gemini AI)
- 📊 **Statistiques détaillées** personnelles et sociales
- 🏅 **Classements** entre amis
- 📈 **Historique** complet des soirées

### 📱 Mobile
- 📱 **Application native** Android et iOS (Capacitor)
- 🔔 **Push notifications** riches
- 📳 **Haptic feedback** pour une expérience immersive
- 🎵 **Sons personnalisés** pour chaque action

## 🚀 Installation

1. **Cloner le projet**
```bash
git clone [url-du-repo]
cd DrinkWise_mobile
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'IA Gemini**
   - Obtenez une clé API Gemini sur [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Ouvrez le fichier `.env` à la racine du projet
   - Remplacez `votre_clé_api_gemini_ici` par votre vraie clé API :
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Démarrer le développement**
```bash
npm run dev
```

## 📱 Développement Mobile

### Android
```bash
npm run build
npx cap sync android
npx cap open android
```

### iOS
```bash
npm run build
npx cap sync ios
npx cap open ios
```

## 🤖 Utilisation de l'IA

L'application inclut un système de détection automatique de boissons :

1. **Ajouter une soirée** : Cliquez sur le bouton "+" dans l'onglet Accueil
2. **Analyser une boisson** : Cliquez sur "Analyser une boisson avec l'IA"
3. **Prendre/Sélectionner une photo** : Utilisez votre appareil photo ou galerie
4. **Résultat automatique** : Le type de boisson et le degré d'alcool sont automatiquement détectés

## 🛠️ Technologies

- **Frontend** : React 18, Vite
- **Mobile** : Capacitor
- **IA** : Google Gemini API
- **Base de données** : Firebase Firestore
- **Authentification** : Firebase Auth
- **Styling** : CSS avec système de thème intégré

## 🔧 Configuration

Le projet utilise les variables d'environnement suivantes dans `.env` :

```
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

## 📝 Scripts disponibles

- `npm run dev` : Démarrage en mode développement
- `npm run build` : Build de production
- `npm run preview` : Aperçu du build
- `npx cap sync` : Synchronisation avec les plateformes mobiles

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request
