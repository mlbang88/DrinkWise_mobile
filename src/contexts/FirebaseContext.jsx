// src/contexts/FirebaseContext.js
import { createContext, useState, useEffect } from 'react';
import { auth, db, functions, appId } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { generateUniqueUsername } from '../utils/usernameUtils';

export const FirebaseContext = createContext(null);

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
                                setUserProfile(profileData);
                            }
                        } else {
                            setUserProfile(profileData);
                        }
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
