// Système d'authentification de secours - MODE URGENCE
// À utiliser uniquement en cas de panne Firebase

import { logger } from './logger.js';

export const EMERGENCY_USERS = [
    {
        email: 'admin@drinkwise.app',
        password: 'AdminSecure2025!',
        displayName: 'Admin DrinkWise',
        uid: 'emergency-admin-' + Date.now(),
        role: 'admin'
    },
    {
        email: 'user@drinkwise.app', 
        password: 'UserTest2025!',
        displayName: 'Utilisateur Test',
        uid: 'emergency-user-' + Date.now(),
        role: 'user'
    }
];

export const emergencyAuth = {
    // Mode d'urgence activé
    isEmergencyMode: false,
    currentUser: null,

    // Activer le mode d'urgence
    enableEmergencyMode() {
        this.isEmergencyMode = true;
        logger.warn('🚨 MODE D\'URGENCE FIREBASE ACTIVÉ');
        return true;
    },

    // Connexion d'urgence
    async signInEmergency(email, password) {
        const user = EMERGENCY_USERS.find(u => u.email === email && u.password === password);
        
        if (user) {
            this.currentUser = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                emailVerified: true,
                isAnonymous: false,
                metadata: {
                    creationTime: new Date().toISOString(),
                    lastSignInTime: new Date().toISOString()
                }
            };
            
            logger.info('🚨 Connexion d\'urgence réussie', { email });
            
            // Simuler l'événement Firebase onAuthStateChanged
            window.dispatchEvent(new CustomEvent('emergencyAuth', { 
                detail: { user: this.currentUser, type: 'signIn' }
            }));
            
            return { user: this.currentUser };
        }
        
        throw new Error('Identifiants d\'urgence invalides');
    },

    // Déconnexion d'urgence
    async signOutEmergency() {
        const previousUser = this.currentUser;
        this.currentUser = null;
        
        logger.info('🚨 Déconnexion d\'urgence', { email: previousUser?.email });
        
        // Simuler l'événement Firebase onAuthStateChanged
        window.dispatchEvent(new CustomEvent('emergencyAuth', { 
            detail: { user: null, type: 'signOut' }
        }));
        
        return true;
    },

    // Vérifier si un utilisateur est connecté en mode d'urgence
    getCurrentUser() {
        return this.currentUser;
    },

    // Créer un profil d'urgence pour la base de données
    createEmergencyProfile(db, appId) {
        if (!this.currentUser) return null;
        
        return {
            uid: this.currentUser.uid,
            email: this.currentUser.email,
            displayName: this.currentUser.displayName,
            username: this.currentUser.email.split('@')[0],
            photoURL: null,
            level: 1,
            levelName: 'Novice de la Fête',
            xp: 0,
            createdAt: new Date(),
            isPublic: true,
            friends: [],
            emergencyMode: true,
            emergencyActivatedAt: new Date().toISOString()
        };
    }
};

// Intégration avec le contexte Firebase existant
export const wrapFirebaseAuth = (originalAuth) => {
    return new Proxy(originalAuth, {
        get(target, prop) {
            // Si le mode d'urgence est activé, intercepter certaines méthodes
            if (emergencyAuth.isEmergencyMode) {
                switch (prop) {
                    case 'currentUser':
                        return emergencyAuth.getCurrentUser();
                    case 'signOut':
                        return () => emergencyAuth.signOutEmergency();
                    default:
                        return target[prop];
                }
            }
            
            return target[prop];
        }
    });
};