// src/contexts/FirebaseContext.js
import { createContext, useState, useEffect } from 'react';
import { auth, db, functions, appId } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

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
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);
                
                // Écouter les changements du profil utilisateur en temps réel
                const userProfileRef = doc(db, `artifacts/${appId}/users/${firebaseUser.uid}/profile`, 'data');
                const unsubProfile = onSnapshot(userProfileRef, async (profileSnap) => {
                    if (!profileSnap.exists()) {
                        // Créer un nouveau profil utilisateur
                        const newUsername = firebaseUser.displayName || `user_${firebaseUser.uid.substring(0, 5)}`;
                        const newProfile = {
                            username: newUsername,
                            username_lowercase: newUsername.toLowerCase(),
                            unlockedBadges: [],
                            friends: [],
                            isPublic: false,
                            xp: 0,
                            level: "Novice de la Fête",
                            completedChallenges: {}
                        };
                        
                        try {
                            await setDoc(userProfileRef, newProfile);
                            setUserProfile(newProfile);
                        } catch (error) {
                            console.error("Erreur lors de la création du profil:", error);
                        }
                    } else {
                        setUserProfile(profileSnap.data());
                    }
                }, (error) => {
                    console.error("❌ Erreur Firestore onSnapshot:", error);
                    // En cas d'erreur de permissions, continuer sans bloquer l'app
                    setLoading(false);
                });
                
                setLoading(false);
                
                // Cleanup function pour l'écoute du profil
                return () => unsubProfile();
            } else {
                setUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
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
