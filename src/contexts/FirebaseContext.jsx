// src/contexts/FirebaseContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db, functions, appId } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { generateUniqueUsername } from '../utils/usernameUtils';
import { friendshipListenerService } from '../services/friendshipListenerService.js';
import { ExperienceService } from '../services/experienceService';
import { logger } from '../utils/logger.js';

// Valeur par défaut pour éviter les erreurs de destructuration
const defaultContextValue = {
    user: null,
    loading: true,
    db: null,
    auth: null,
    functions: null,
    appId: null,
    setMessageBox: () => {},
    changeBackground: () => {},
    userProfile: null,
    setUserProfile: () => {},
    messageBox: { message: '', type: '' },
    logout: () => {}
};

export const FirebaseContext = createContext(defaultContextValue);

// Fonction pour vérifier et corriger le niveau utilisateur
const verifyAndFixUserLevel = async (userProfileRef, profileData) => {
    try {
        const currentXp = profileData.xp || 0;
        const currentLevel = profileData.level || 1;
        const correctLevel = ExperienceService.calculateLevel(currentXp);
        
        // Vérifier si le niveau numérique correspond à l'XP
        if (typeof currentLevel === 'number' && currentLevel !== correctLevel) {
            logger.info('FIREBASE', `Correction du niveau: ${currentLevel} → ${correctLevel} (XP: ${currentXp})`);
            
            await updateDoc(userProfileRef, {
                level: correctLevel
            });
            
            // Retourner le profil corrigé
            return {
                ...profileData,
                level: correctLevel
            };
        }
        
        return profileData;
    } catch (error) {
        logger.error('FIREBASE', 'Erreur lors de la vérification du niveau', error);
        return profileData;
    }
};

// Hook personnalisé pour utiliser le contexte Firebase
export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context || context === defaultContextValue) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
};

export const FirebaseProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [messageBox, setMessageBoxState] = useState({ message: '', type: '' });

    // Messages utilisateur
    const showMessage = (message, type = 'success') => {
        setMessageBoxState({ message, type });
        setTimeout(() => setMessageBoxState({ message: '', type: '' }), 3000);
    };

    const setMessageBox = (messageData) => {
        if (typeof messageData === 'string') {
            showMessage(messageData, 'info');
        } else if (messageData && messageData.message) {
            showMessage(messageData.message, messageData.type || 'info');
        }
    };

    useEffect(() => {
        let unsubProfile = null;
        
        // Vérifier le mode d'urgence au démarrage
        const checkEmergencyMode = () => {
            const emergencyData = sessionStorage.getItem('emergencyAuth');
            if (emergencyData) {
                try {
                    const { user: emergencyUser, timestamp, mode } = JSON.parse(emergencyData);
                    
                    // Vérifier que le mode d'urgence n'est pas trop ancien (24h max)
                    const isValid = (Date.now() - timestamp) < (24 * 60 * 60 * 1000);
                    
                    if (isValid && mode === 'emergency') {
                        logger.warn('AUTH', 'Mode d\'urgence détecté - Utilisateur connecté');
                        
                        // Créer un profil d'urgence
                        const emergencyProfile = {
                            username: 'utilisateur_urgence',
                            displayName: emergencyUser.displayName,
                            email: emergencyUser.email,
                            photoURL: null,
                            level: 1,
                            levelName: 'Utilisateur d\'Urgence',
                            xp: 0,
                            isPublic: true,
                            friends: [],
                            emergencyMode: true
                        };
                        
                        setUser(emergencyUser);
                        setUserProfile(emergencyProfile);
                        setLoading(false);
                        
                        showMessage('🚨 Mode d\'urgence actif - Connexion temporaire', 'info');
                        logger.warn('AUTH', 'Mode d\'urgence: Service d\'écoute des amitiés désactivé');
                        return true; // Mode d'urgence activé
                    } else {
                        // Nettoyer les données expirées
                        sessionStorage.removeItem('emergencyAuth');
                    }
                } catch (error) {
                    logger.error('AUTH', 'Erreur mode d\'urgence', error);
                    sessionStorage.removeItem('emergencyAuth');
                }
            }
            return false;
        };
        
        // Si le mode d'urgence est actif, ne pas écouter Firebase
        if (checkEmergencyMode()) {
            return; // Sortir early, le mode d'urgence est actif
        }
        
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            // Nettoyer la précédente écoute si elle existe
            if (unsubProfile) {
                try {
                    unsubProfile();
                } catch (error) {
                    logger.warn('FIREBASE', 'Erreur lors du nettoyage du listener profil', error);
                }
                unsubProfile = null;
            }
            
            if (firebaseUser) {
                setUser(firebaseUser);
                
                // Écouter les changements du profil utilisateur en temps réel
                const userProfileRef = doc(db, `artifacts/${appId}/users/${firebaseUser.uid}/profile`, 'data');
                unsubProfile = onSnapshot(userProfileRef, async (profileSnap) => {
                    if (!profileSnap.exists()) {
                        // Créer un nouveau profil utilisateur avec username unique
                        let baseUsername = firebaseUser.displayName || 
                                          (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'user');
                        
                        // Si le baseUsername est vide ou null, utiliser un défaut
                        if (!baseUsername || baseUsername.trim() === '') {
                            baseUsername = 'user';
                        }
                        
                        // Générer un username unique
                        const uniqueUsername = await generateUniqueUsername(db, appId, baseUsername);
                        
                        const newProfile = {
                            username: uniqueUsername,
                            username_lowercase: uniqueUsername.toLowerCase(),
                            unlockedBadges: [],
                            friends: [],
                            isPublic: false,
                            xp: 0,
                            level: "Novice de la Fête",
                            completedChallenges: {}
                        };
                        
                        try {
                            await setDoc(userProfileRef, newProfile);
                            
                            // Créer aussi l'entrée dans profiles pour la recherche d'amis
                            const publicProfileRef = doc(db, `artifacts/${appId}/profiles`, firebaseUser.uid);
                            await setDoc(publicProfileRef, {
                                username: uniqueUsername,
                                username_lowercase: uniqueUsername.toLowerCase(),
                                isPublic: false
                            });
                            
                            setUserProfile(newProfile);
                            logger.info('FIREBASE', 'Nouveau profil créé avec username unique', uniqueUsername);
                        } catch (error) {
                            logger.error('FIREBASE', 'Erreur lors de la création du profil', error);
                        }
                    } else {
                        const profileData = profileSnap.data();
                        
                        // Vérifier que le username existe, sinon le réparer avec un username unique
                        if (!profileData.username || profileData.username.trim() === '') {
                            let baseUsername = firebaseUser.displayName || 
                                              firebaseUser.email?.split('@')[0] || 'user';
                            
                            const repairedUsername = await generateUniqueUsername(db, appId, baseUsername, firebaseUser.uid);
                            
                            logger.info('FIREBASE', 'Réparation du username manquant avec username unique', repairedUsername);
                            
                            try {
                                await setDoc(userProfileRef, {
                                    ...profileData,
                                    username: repairedUsername,
                                    username_lowercase: repairedUsername.toLowerCase()
                                }, { merge: true });
                                
                                // Mettre à jour aussi dans profiles
                                const publicProfileRef = doc(db, `artifacts/${appId}/profiles`, firebaseUser.uid);
                                await setDoc(publicProfileRef, {
                                    username: repairedUsername,
                                    username_lowercase: repairedUsername.toLowerCase(),
                                    isPublic: profileData.isPublic || false
                                }, { merge: true });
                                
                                setUserProfile({
                                    ...profileData,
                                    username: repairedUsername,
                                    username_lowercase: repairedUsername.toLowerCase()
                                });
                            } catch (error) {
                                logger.error('FIREBASE', 'Erreur réparation username', error);
                                // Vérifier et corriger le niveau même en cas d'erreur username
                                const correctedProfile = await verifyAndFixUserLevel(userProfileRef, profileData);
                                setUserProfile(correctedProfile);
                            }
                        } else {
                            // Vérifier et corriger le niveau si nécessaire
                            const correctedProfile = await verifyAndFixUserLevel(userProfileRef, profileData);
                            setUserProfile(correctedProfile);
                        }
                    }
                    
                    // Démarrer le service d'écoute des amitiés avec synchronisation automatique
                    // TEMPORAIREMENT DÉSACTIVÉ pour diagnostiquer l'erreur Firestore INTERNAL ASSERTION FAILED
                    try {
                        logger.debug('FIREBASE', 'Service d\'écoute des amitiés temporairement désactivé pour diagnostic');
                        // friendshipListenerService.startListening(db, appId, firebaseUser.uid, setMessageBox, functions);
                    } catch (error) {
                        logger.error('FIREBASE', 'Erreur démarrage service d\'écoute', error);
                    }
                }, (error) => {
                    logger.error('FIREBASE', 'Erreur Firestore onSnapshot', error);
                    // En cas d'erreur de permissions, continuer sans bloquer l'app
                    setLoading(false);
                });
                
                setLoading(false);
            } else {
                setUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => {
            if (unsubscribe) {
                try {
                    unsubscribe();
                } catch (error) {
                    logger.warn('FIREBASE', 'Erreur cleanup auth listener', error);
                }
            }
            if (unsubProfile) {
                try {
                    unsubProfile();
                } catch (error) {
                    logger.warn('FIREBASE', 'Erreur cleanup profile listener', error);
                }
            }
        };
    }, []);

    const changeBackground = () => {
        // Fonction pour changer le background si nécessaire
        logger.debug('UI', 'Change background called');
    };

    const logout = async () => {
        try {
            // Vérifier le mode d'urgence
            const emergencyData = sessionStorage.getItem('emergencyAuth');
            if (emergencyData) {
                // Mode d'urgence - déconnexion simple
                sessionStorage.removeItem('emergencyAuth');
                setUser(null);
                setUserProfile(null);
                setMessageBox('🚨 Déconnexion du mode d\'urgence');
                
                // Recharger la page pour revenir au mode normal
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                return;
            }
            
            // Mode normal - déconnexion Firebase
            await signOut(auth);
            setUser(null);
            setUserProfile(null);
            setMessageBox('Déconnexion réussie !');
        } catch (error) {
            logger.error('AUTH', 'Erreur de déconnexion', error);
            setMessageBox('Erreur lors de la déconnexion');
        }
    };

    const value = {
        user,
        loading,
        db,
        auth,
        functions,
        appId,
        setMessageBox,
        changeBackground,
        userProfile,
        setUserProfile,
        messageBox,
        logout
    };

    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    );
};
