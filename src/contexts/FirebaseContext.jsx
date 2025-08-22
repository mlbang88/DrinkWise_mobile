// src/contexts/FirebaseContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth, db, functions, appId } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { generateUniqueUsername } from '../utils/usernameUtils';
import { friendshipListenerService } from '../services/friendshipListenerService.js';
import { levelUtils } from '../utils/levelUtils';

export const FirebaseContext = createContext(null);

// Fonction pour vérifier et corriger le niveau utilisateur
const verifyAndFixUserLevel = async (userProfileRef, profileData) => {
    try {
        const currentXp = profileData.xp || 0;
        const currentLevel = profileData.level || 1;
        const correctLevel = levelUtils.calculateLevel(currentXp);
        
        // Vérifier si le niveau numérique correspond à l'XP
        if (typeof currentLevel === 'number' && currentLevel !== correctLevel) {
            console.log(`🔧 Correction du niveau: ${currentLevel} → ${correctLevel} (XP: ${currentXp})`);
            
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
        console.error("❌ Erreur lors de la vérification du niveau:", error);
        return profileData;
    }
};

// Hook personnalisé pour utiliser le contexte Firebase
export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
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
        
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            // Nettoyer la précédente écoute si elle existe
            if (unsubProfile) {
                unsubProfile();
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
                            console.log("✅ Nouveau profil créé avec username unique:", uniqueUsername);
                        } catch (error) {
                            console.error("❌ Erreur lors de la création du profil:", error);
                        }
                    } else {
                        const profileData = profileSnap.data();
                        
                        // Vérifier que le username existe, sinon le réparer avec un username unique
                        if (!profileData.username || profileData.username.trim() === '') {
                            let baseUsername = firebaseUser.displayName || 
                                              firebaseUser.email?.split('@')[0] || 'user';
                            
                            const repairedUsername = await generateUniqueUsername(db, appId, baseUsername, firebaseUser.uid);
                            
                            console.log("🔧 Réparation du username manquant avec username unique:", repairedUsername);
                            
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
                                console.error("❌ Erreur réparation username:", error);
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
                    try {
                        friendshipListenerService.startListening(db, appId, firebaseUser.uid, setMessageBox, functions);
                        console.log("🤝 Service d'écoute des amitiés avec auto-sync démarré");
                    } catch (error) {
                        console.error("❌ Erreur démarrage service d'écoute:", error);
                    }
                }, (error) => {
                    console.error("❌ Erreur Firestore onSnapshot:", error);
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
            unsubscribe();
            if (unsubProfile) {
                unsubProfile();
            }
        };
    }, []);

    const changeBackground = () => {
        // Fonction pour changer le background si nécessaire
        console.log("Change background called");
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
        messageBox
    };

    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    );
};
