import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from './styles/ThemeContext.jsx';
import ThemedText from './styles/ThemedText.jsx';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc, collection, getDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { auth, db, functions, appId } from './firebase';
import { FirebaseContext } from './contexts/FirebaseContext.jsx';
import { normalizeString } from './utils/helpers';
import { localImageData } from './utils/data';
import { badgeService } from './services/badgeService';

// Import all components and pages
import LoadingSpinner from './components/LoadingSpinner';
import MessageBox from './components/MessageBox';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import StatsPage from './pages/StatsPage';
import BadgesPage from './pages/BadgesPage';
import ChallengesPage from './pages/ChallengesPage';
import SouvenirsPage from './pages/SouvenirsPage';
import FriendsPage from './pages/FriendsPage';
import ProfilePage from './pages/ProfilePage';
import FriendStatsPage from './pages/FriendStatsPage';

// Import icons for the nav bar
import { Home, BarChart, Users, Award, User as UserIcon, Shield, Calendar } from 'lucide-react';

const mainBgStyle = {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    transition: 'background-image 0.5s ease-in-out',
};

const App = () => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState('home');
    const [messageBox, setMessageBox] = useState({ message: '', type: '' });
    const [backgroundUrl, setBackgroundUrl] = useState(localImageData['soiree']);
    const [selectedFriendId, setSelectedFriendId] = useState(null);
    
    const changeBackground = useCallback((keyword) => {
        const normalizedKeyword = normalizeString(keyword);
        const url = localImageData[normalizedKeyword] || localImageData['soiree'];
        setBackgroundUrl(url);
    }, []);

    // Fonction pour exposer l'état du mode soirée (pour debugging)
    const getCurrentPartyState = useCallback(() => {
        return { partyMode, activeDraft };
    }, [partyMode, activeDraft]);
    
    // Exposer la fonction globalement pour le debugging
    useEffect(() => {
        window.getCurrentPartyState = getCurrentPartyState;
        return () => {
            delete window.getCurrentPartyState;
        };
    }, [getCurrentPartyState]);

    // Fonctions du mode soirée
    const loadActiveDraft = useCallback(async (userId) => {
        try {
            // Vérifier s'il y a eu une fermeture récente (moins de 2 minutes)
            if (lastDraftClose && Date.now() - lastDraftClose < 120000) {
                console.log("🚫 Draft fermé récemment, pas de rechargement automatique");
                return;
            }

            const draftRef = doc(db, `artifacts/${appId}/users/${userId}/party_draft`, 'current');
            const draftSnap = await getDoc(draftRef);
            
            if (draftSnap.exists()) {
                const draft = draftSnap.data();
                setActiveDraft(draft);
                setPartyMode(true);
                console.log("✅ Draft rechargé automatiquement");
            }
        } catch (error) {
            console.error('Erreur lors du chargement du draft:', error);
        }
    }, [lastDraftClose, db, appId]);

    const startPartyMode = useCallback(async () => {
        if (!user) return;

        const newDraft = {
            userId: user.uid,
            startTime: new Date(),
            drinks: [],
            events: {
                vomi: 0,
                fights: 0,
                girlsTalkedTo: 0
            },
            location: '',
            category: 'Soirée',
            notes: '',
            status: 'draft',
            lastSaved: new Date()
        };

        try {
            await setDoc(doc(db, `artifacts/${appId}/users/${user.uid}/party_draft`, 'current'), newDraft);
            setActiveDraft(newDraft);
            setPartyMode(true);
            setShouldAutoLoadDraft(true); // Réactiver le chargement automatique
        } catch (error) {
            console.error('Erreur lors du démarrage du mode soirée:', error);
        }
    }, [user]);

    const endPartyMode = useCallback(async () => {
        if (!user || !activeDraft) return;

        try {
            await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/party_draft`, 'current'));
            setPartyMode(false);
            setActiveDraft(null);
            setShouldAutoLoadDraft(false); // Empêcher le rechargement automatique
        } catch (error) {
            console.error('Erreur lors de l\'arrêt du mode soirée:', error);
        }
    }, [user, activeDraft]);

    const forceEndPartyMode = useCallback(() => {
        console.log("🏠 Fermeture forcée du mode soirée après quiz - État avant:", { partyMode, activeDraft: !!activeDraft });
        setPartyMode(false);
        setActiveDraft(null);
        setShouldAutoLoadDraft(false); // Empêcher le rechargement automatique
        console.log("🏠 Fermeture forcée terminée - Mode soirée fermé");
    }, [partyMode, activeDraft]);

    const saveDraftToFirebase = useCallback(async () => {
        if (!user || !activeDraft) return;

        setIsAutoSaving(true);
        try {
            const updatedDraft = {
                ...activeDraft,
                lastSaved: new Date()
            };
            
            await updateDoc(doc(db, `artifacts/${appId}/users/${user.uid}/party_draft`, 'current'), updatedDraft);
            setActiveDraft(updatedDraft);
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            // Si le document n'existe plus, arrêter l'auto-sauvegarde
            if (error.code === 'not-found') {
                console.log("⚠️ Draft supprimé - arrêt de l'auto-sauvegarde");
                setActiveDraft(null);
                setPartyMode(false);
            }
        } finally {
            setIsAutoSaving(false);
        }
    }, [user, activeDraft, db, appId]);

    const addDrinkToDraft = useCallback((drinkType, quantity = 1) => {
        if (!activeDraft) return;

        const updatedDraft = { ...activeDraft };
        const existingDrink = updatedDraft.drinks.find(d => d.type === drinkType);

        if (existingDrink) {
            existingDrink.quantity += quantity;
        } else {
            updatedDraft.drinks.push({ 
                type: drinkType, 
                quantity: quantity,
                addedAt: new Date()
            });
        }

        setActiveDraft(updatedDraft);
        saveDraftToFirebase();
    }, [activeDraft, saveDraftToFirebase]);

    const removeDrinkFromDraft = useCallback((drinkType, quantity = 1) => {
        if (!activeDraft) return;

        const updatedDraft = { ...activeDraft };
        const drinkIndex = updatedDraft.drinks.findIndex(d => d.type === drinkType);

        if (drinkIndex !== -1) {
            updatedDraft.drinks[drinkIndex].quantity -= quantity;
            if (updatedDraft.drinks[drinkIndex].quantity <= 0) {
                updatedDraft.drinks.splice(drinkIndex, 1);
            }
        }

        setActiveDraft(updatedDraft);
        saveDraftToFirebase();
    }, [activeDraft, saveDraftToFirebase]);

    const addEventToDraft = useCallback((eventType) => {
        if (!activeDraft) return;

        const updatedDraft = { ...activeDraft };
        updatedDraft.events[eventType] = (updatedDraft.events[eventType] || 0) + 1;

        setActiveDraft(updatedDraft);
        saveDraftToFirebase();
    }, [activeDraft, saveDraftToFirebase]);

    const completeParty = useCallback(async (completedPartyData) => {
        if (!user || !activeDraft) return;

        try {
            // Ajouter la soirée terminée à la collection parties
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${user.uid}/parties`), {
                ...completedPartyData,
                userId: user.uid,
                endTime: new Date(),
                timestamp: new Date()
            });

            console.log("✅ Soirée finalisée depuis le mode soirée avec ID:", docRef.id);

            // Supprimer le draft
            await deleteDoc(doc(db, `artifacts/${appId}/users/${user.uid}/party_draft`, 'current'));
            
            // Arrêter l'auto-sauvegarde immédiatement
            setActiveDraft(null);

            // NE PAS fermer le mode soirée maintenant - sera fermé par le quiz !
            // setPartyMode(false);
            // setActiveDraft(null);

            // Déclencher le quiz avec un petit délai pour être sûr que l'état est mis à jour
            console.log("🎯 Déclenchement du quiz après finalisation du mode soirée");
            
            // Méthode DIRECTE : Stocker dans localStorage et forcer l'affichage du quiz
            try {
                localStorage.setItem('drinkwise_quiz_data', JSON.stringify(completedPartyData));
                localStorage.setItem('drinkwise_quiz_id', docRef.id);
                localStorage.setItem('drinkwise_quiz_active', 'true');
                localStorage.setItem('drinkwise_quiz_from_party', 'true');
                localStorage.setItem('drinkwise_quiz_trigger', Date.now().toString());
                console.log("💾 Quiz stocké directement dans localStorage pour déclenchement immédiat");
                
                // Forcer le re-rendu de l'App pour que le QuizManager détecte le changement
                window.dispatchEvent(new Event('storage'));
                
            } catch (error) {
                console.error("❌ Erreur stockage quiz:", error);
            }

        } catch (error) {
            console.error('Erreur lors de la finalisation de la soirée:', error);
        }
    }, [user, activeDraft, db, appId]);

    // Fonction pour fermer temporairement le mode soirée (sans supprimer le draft)
    const closeDraftTemporarily = useCallback(() => {
        setPartyMode(false);
        setActiveDraft(null);
        setLastDraftClose(Date.now());
        setShouldAutoLoadDraft(false);
        console.log("🔄 Draft fermé temporairement - rechargement automatique désactivé");
        
        // Réactiver le rechargement automatique après 5 minutes
        setTimeout(() => {
            setShouldAutoLoadDraft(true);
            console.log("🔄 Rechargement automatique réactivé");
        }, 300000); // 5 minutes
    }, []);

    // Charger le draft actif au démarrage
    useEffect(() => {
        if (user && shouldAutoLoadDraft) {
            loadActiveDraft(user.uid);
        } else if (!user) {
            setPartyMode(false);
            setActiveDraft(null);
            setShouldAutoLoadDraft(true); // Reset pour le prochain utilisateur
        }
    }, [user, shouldAutoLoadDraft, loadActiveDraft]);

    // Auto-save du draft toutes les 10 secondes
    useEffect(() => {
        if (partyMode && activeDraft && user) {
            const interval = setInterval(() => {
                saveDraftToFirebase();
            }, 10000);

            return () => clearInterval(interval);
        }
    }, [partyMode, activeDraft, user, saveDraftToFirebase]);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                const userProfileRef = doc(db, `artifacts/${appId}/users/${firebaseUser.uid}/profile`, 'data');
                const unsubProfile = onSnapshot(userProfileRef, async (profileSnap) => {
                    if (!profileSnap.exists()) {
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
                        await setDoc(userProfileRef, newProfile);
                        const publicProfileRef = doc(db, `artifacts/${appId}/profiles`, firebaseUser.uid);
                        await setDoc(publicProfileRef, {
                            username: newUsername,
                            username_lowercase: newUsername.toLowerCase(),
                            isPublic: false
                        });
                        setUserProfile(newProfile);
                    } else {
                        setUserProfile(profileSnap.data());
                    }
                    setUser(firebaseUser);
                    setLoading(false);
                });
                return () => unsubProfile();
            } else {
                setUser(null);
                setUserProfile(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        if (!db || !user || !userProfile || !appId) return;

        const userPartiesRef = collection(db, `artifacts/${appId}/users/${user.uid}/parties`);
        const unsubscribeParties = onSnapshot(userPartiesRef, async (snapshot) => {
            const allParties = snapshot.docs.map(doc => doc.data());
            const calculatedStats = badgeService.calculateGlobalStats(allParties);

            setUserProfile(prev => ({ ...prev, publicStats: calculatedStats }));

            if (userProfile.isPublic) {
                const publicStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
                const publicProfileRef = doc(db, `artifacts/${appId}/profiles`, user.uid);
                try {
                    await setDoc(publicStatsRef, { ...calculatedStats, username: userProfile.username }, { merge: true });
                    await setDoc(publicProfileRef, {
                        username: userProfile.username,
                        username_lowercase: userProfile.username.toLowerCase(),
                        isPublic: true,
                        unlockedBadges: userProfile.unlockedBadges || []
                    }, { merge: true });
                    console.log("✅ Stats publiques mises à jour avec succès");
                } catch (e) { console.error("Erreur de mise à jour des stats publiques", e) }
            }
        });

        return () => unsubscribeParties();
    }, [db, user, appId, userProfile?.isPublic, userProfile?.username, userProfile?.unlockedBadges]);


    useEffect(() => {
        let keyword = 'soiree';
        if (user) {
            if (currentPage === 'stats') keyword = 'graphique';
            else if (currentPage === 'friends' || currentPage === 'friendStats') keyword = 'amis';
            else if (currentPage === 'profile') keyword = 'profil';
            else if (currentPage === 'badges') keyword = 'anniversaire'; // Image de célébration pour les badges
            else if (currentPage === 'challenges') keyword = 'defis';
            else if (currentPage === 'souvenirs') keyword = 'souvenirs';
        }
        changeBackground(keyword);
    }, [currentPage, user, changeBackground]);


    if (loading) {
        return <LoadingSpinner text="Démarrage de l'application..." />;
    }

    const navItems = [
        { id: 'home', icon: Home, label: 'Accueil' },
        { id: 'stats', icon: BarChart, label: 'Stats' },
        { id: 'badges', icon: Award, label: 'Badges' },
        { id: 'challenges', icon: Shield, label: 'Défis' },
        { id: 'souvenirs', icon: Calendar, label: 'Souvenirs' },
        { id: 'friends', icon: Users, label: 'Amis' },
        { id: 'profile', icon: UserIcon, label: 'Profil' },
    ];

    const renderPage = () => {
        switch (currentPage) {
            case 'home': return <HomePage />;
            case 'stats': return <StatsPage />;
            case 'badges': return <BadgesPage />;
            case 'challenges': return <ChallengesPage />;
            case 'souvenirs': return <SouvenirsPage />;
            case 'friends': return <FriendsPage setCurrentPage={setCurrentPage} setSelectedFriendId={setSelectedFriendId} />;
            case 'profile': return <ProfilePage />;
            case 'friendStats': return <FriendStatsPage friendId={selectedFriendId} setCurrentPage={setCurrentPage} />;
            default: return <HomePage />;
        }
    };

    const AppContent = () => {
        const { theme } = useTheme();
        
        return (
            <FirebaseContext.Provider value={{ 
                db, 
                auth, 
                functions, 
                user, 
                appId, 
                setMessageBox, 
                changeBackground, 
                userProfile, 
                setUserProfile,
                // Fonctions du mode soirée
                partyMode,
                activeDraft,
                isAutoSaving,
                startPartyMode,
                endPartyMode,
                forceEndPartyMode,
                addDrinkToDraft,
                removeDrinkFromDraft,
                addEventToDraft,
                completeParty,
                saveDraftToFirebase,
                closeDraftTemporarily
            }}>
                {!user ? (
                    <AuthPage />
                ) : (
                    <div 
                        className="min-h-screen font-sans flex flex-col text-white relative w-full h-screen" 
                        style={{ 
                            ...mainBgStyle, 
                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundUrl})`,
                            margin: 0,
                            padding: 0
                        }}
                    >
                        <header className="relative z-10 p-4 bg-black/20 shadow-lg text-center backdrop-blur-sm">
                            <ThemedText style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>DrinkWise</ThemedText>
                        </header>
                    <main className="relative z-10 flex-grow flex flex-col w-full">
                        <div className="w-full h-full">
                            {renderPage()}
                        </div>
                    </main>
                    <footer className="relative z-10 shadow-lg flex justify-around backdrop-blur-sm" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', paddingTop: '16px', paddingBottom: '24px', paddingLeft: '4px', paddingRight: '4px' }}>
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentPage(item.id)}
                                className="flex flex-col items-center w-12"
                                style={{ backgroundColor: 'transparent', padding: '8px 4px', border: 'none', outline: 'none' }}
                            >
                                <item.icon 
                                    size={20} 
                                    style={{ color: currentPage === item.id ? '#a855f7' : '#ffffff' }}
                                />
                                <span 
                                    className="text-[10px] mt-0.5"
                                    style={{ color: currentPage === item.id ? '#a855f7' : '#ffffff' }}
                                >
                                    {item.label}
                                </span>
                            </button>
                        ))}
                    </footer>
                </div>
            )}
            <MessageBox message={messageBox.message} type={messageBox.type} onClose={() => setMessageBox({ message: '', type: '' })} />
        </FirebaseContext.Provider>
        );
    };

    return (
        <PartyFlowProvider>
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </PartyFlowProvider>
    );
};

export default App;