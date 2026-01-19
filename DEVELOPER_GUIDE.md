# 🚀 Guide de Démarrage Rapide - DrinkWise Development

## ⚡ Installation Rapide

```bash
# Cloner le repository
git clone https://github.com/mlbang88/DrinkWise_mobile.git
cd DrinkWise_mobile

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

---

## 📁 Structure du Projet

```
DrinkWise_mobile/
├── src/
│   ├── components/        # Composants React réutilisables
│   │   ├── chat/         # 💬 Système de messagerie
│   │   ├── stories/      # 📸 Stories éphémères (24h)
│   │   ├── onboarding/   # 👋 Flow d'introduction
│   │   └── ...
│   ├── pages/            # Pages principales de l'app
│   ├── services/         # Services Firebase & logique métier
│   │   ├── chatService.js        # Messagerie en temps réel
│   │   ├── storyService.js       # Stories éphémères
│   │   ├── badgeService.js       # Système de badges
│   │   └── ...
│   ├── utils/            # Utilitaires
│   │   ├── data.jsx      # ⭐ 35 badges configurés ici
│   │   ├── enhancedNotifications.js  # 🔔 Notifications riches
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── contexts/         # Contexts React (Auth, Theme, etc.)
│   └── styles/           # Fichiers CSS et thème
├── public/
│   └── sounds/          # 🔊 Fichiers audio (à ajouter)
├── functions/           # Firebase Cloud Functions
└── android/            # Build Android (Capacitor)
```

---

## 🎯 Fonctionnalités Principales

### ✅ Implémenté
- 🏆 **35 Badges** avec critères dynamiques (Party Animal, Night Owl, etc.)
- 🔔 **Notifications enrichies** avec sons et vibrations
- 💬 **Chat privé** en temps réel (Firestore)
- 📸 **Stories éphémères** (24h, comme Instagram)
- 👋 **Onboarding interactif** (6 écrans animés)
- 🗺️ **Système de territoires** (conquête de bars)
- ⚔️ **Battle Mode** (affrontements 1v1)
- 📊 **Système XP/Niveaux** (100 niveaux)
- 👥 **Groupes d'amis** et statistiques

### 🔜 À Implémenter
- 📅 Calendrier d'événements
- 📊 Statistiques avancées avec graphiques
- 🤖 Recommandations IA (Gemini)
- 💰 Cashback/Récompenses
- 🏆 Mode Tournoi

*Voir `FEATURES_IMPLEMENTATION_STATUS.md` pour le détail complet*

---

## 🔥 Quick Start pour Développeurs

### 1. Configuration Firebase

Créer un fichier `.env` à la racine :

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Ajouter les fichiers audio

Télécharger des sons libres de droits et les placer dans `public/sounds/` :
- achievement.mp3
- level-up.mp3
- badge.mp3
- notification.mp3
- message.mp3
- success.mp3
- error.mp3
- warning.mp3

**Sources recommandées :**
- https://freesound.org/
- https://mixkit.co/free-sound-effects/
- https://www.zapsplat.com/

### 3. Mettre à jour les règles Firestore

Dans Firebase Console > Firestore Database > Rules :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... règles existantes ...
    
    // 💬 Chat rules
    match /chats/{chatId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read: if request.auth != null && 
          request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participants;
        allow create: if request.auth != null && 
          request.auth.uid == request.resource.data.senderId;
        allow update: if request.auth != null && 
          request.auth.uid == resource.data.senderId;
      }
    }
    
    // 📸 Stories rules
    match /stories/{storyId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && 
        request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 💻 Commandes Utiles

```bash
# Développement
npm run dev              # Lancer le serveur de dev (Vite)

# Build & Déploiement
npm run build            # Build production
npm run preview          # Preview du build
npm run deploy           # Déployer sur Firebase Hosting

# Tests
npm run test             # Lancer les tests (Vitest)
npm run test:ui          # Interface UI pour les tests

# Mobile (Capacitor)
npm run android          # Ouvrir dans Android Studio
npm run ios              # Ouvrir dans Xcode (Mac uniquement)

# Git
./quick-save.bat         # Quick commit & push
./save-to-github.bat     # Commit détaillé & push
```

---

## 🎨 Utiliser les Nouveaux Composants

### 1. Enhanced Notifications

```jsx
import { enhancedNotifications } from './utils/enhancedNotifications';

// Badge débloqué
enhancedNotifications.showAchievement({
    name: 'Party Animal',
    description: '3 soirées consécutives !'
});

// Level up
enhancedNotifications.showLevelUp(10, 'Fêtard Confirmé');

// Message simple
enhancedNotifications.showSuccess('Succès !', 'Soirée enregistrée');
enhancedNotifications.showError('Erreur', 'Impossible de sauvegarder');

// Toggle sound
const soundEnabled = enhancedNotifications.toggleSound();
```

### 2. Onboarding Flow

```jsx
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import { useOnboarding } from './hooks/useOnboarding';

function App() {
    const { 
        shouldShowOnboarding, 
        completeOnboarding, 
        skipOnboarding,
        resetOnboarding  // Pour testing
    } = useOnboarding();
    
    return (
        <>
            {shouldShowOnboarding && (
                <OnboardingFlow 
                    onComplete={completeOnboarding}
                    onSkip={skipOnboarding}
                />
            )}
            {/* Votre app */}
        </>
    );
}
```

### 3. Chat System

```jsx
import ChatList from './components/chat/ChatList';
import ChatWindow from './components/chat/ChatWindow';
import { chatService } from './services/chatService';

// Liste des conversations
<ChatList />

// Créer/ouvrir un chat
const chat = await chatService.createOrGetChat(currentUserId, otherUserId);

// Envoyer un message
await chatService.sendMessage(chatId, currentUserId, 'Hello!');

// Écouter les messages
useEffect(() => {
    const unsubscribe = chatService.subscribeToMessages(chatId, (messages) => {
        setMessages(messages);
    });
    return () => unsubscribe();
}, [chatId]);
```

### 4. Stories System

```jsx
import StoryViewer from './components/stories/StoryViewer';
import StoryCreator from './components/stories/StoryCreator';
import { storyService } from './services/storyService';

// Créer une story
<StoryCreator 
    onClose={() => setShowCreator(false)}
    onCreated={() => {/* refresh */}}
/>

// Voir les stories
<StoryViewer 
    userStories={stories}
    onClose={() => setShowViewer(false)}
/>

// Récupérer les stories des amis
const stories = await storyService.getStoriesFromFriends(userId, friendIds);

// Listener temps réel
useEffect(() => {
    const unsubscribe = storyService.subscribeToStories(friendIds, (stories) => {
        setStories(stories);
    });
    return () => unsubscribe();
}, [friendIds]);
```

---

## 🏗️ Ajouter un Nouveau Badge

Dans `src/utils/data.jsx` :

```jsx
export const badgeList = {
    // ... badges existants ...
    
    my_new_badge: {
        name: "Mon Super Badge",
        description: "Description du badge",
        icon: Trophy,  // Icône de lucide-react
        tier: 'epic',  // 'common', 'rare', 'epic', 'legendary'
        xpBonus: 200,
        criteria: (stats, party) => {
            // Votre logique ici
            return stats.totalParties >= 50 && party.drinkCount >= 10;
        }
    }
};
```

**Tiers de badges :**
- **Common** (30-50 XP) : Faciles à obtenir
- **Rare** (100-150 XP) : Nécessitent un effort
- **Epic** (200-300 XP) : Difficiles
- **Legendary** (500-5000 XP) : Très rares

---

## 🔍 Debug Tips

### Vérifier les notifications

```javascript
// Dans la console du navigateur
enhancedNotifications.soundEnabled  // Voir si le son est activé
enhancedNotifications.playSound('achievement')  // Tester un son
```

### Réinitialiser l'onboarding

```javascript
localStorage.removeItem('onboarding_completed');
```

### Voir les messages Firestore en temps réel

Dans Firebase Console > Firestore Database > Data

### Logs

Tous les services utilisent le logger :
```javascript
import { logger } from './utils/logger';

logger.info('Message', { data });
logger.error('Erreur', { error });
```

---

## 🐛 Problèmes Courants

### 1. Les sons ne marchent pas
- ✅ Vérifier que les fichiers audio sont dans `public/sounds/`
- ✅ Vérifier que le son est activé : `enhancedNotifications.soundEnabled`
- ✅ Interaction utilisateur requise avant de jouer un son (limite navigateur)

### 2. Les messages ne s'affichent pas
- ✅ Vérifier les règles Firestore
- ✅ Vérifier que l'utilisateur est authentifié
- ✅ Check la console pour erreurs

### 3. Les stories ne se chargent pas
- ✅ Vérifier les permissions Firebase Storage
- ✅ Limite de 10MB par fichier
- ✅ Formats supportés : image/* et video/*

### 4. Build qui échoue
```bash
# Clear cache et réinstaller
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 Resources

### Documentation
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev/)
- [Framer Motion](https://www.framer.com/motion/)
- [Lucide Icons](https://lucide.dev/)
- [Tailwind CSS](https://tailwindcss.com/)

### Design Inspiration
- Instagram Stories UI
- Snapchat UI
- Discord chat UI
- Gaming UIs (cyberpunk style)

---

## 🤝 Contributing

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

---

## 📝 License

Ce projet est sous licence privée.

---

## 👥 Contact

Maxime Labonde - [@mlbang88](https://github.com/mlbang88)

---

## 🎉 Have Fun!

N'oubliez pas : **Code responsibly, party responsibly!** 🍻
