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
    
    // Messages utilisateur
    const showMessage = useCallback((message, type = 'success') => {
        setMessageBox({ message, type });
        setTimeout(() => setMessageBox({ message: '', type: '' }), 3000);
    }, []);

    // Gestion des utilisateurs
    const addUserToDatabase = useCallback(async (userObj) => {
        if (!userObj) return;
        
        try {
            const userDocRef = doc(db, `artifacts/${appId}/users`, userObj.uid);
            const userData = {
                uid: userObj.uid,
                email: userObj.email,
                username: userObj.displayName || userObj.email.split('@')[0],
                joinDate: new Date(),
                xp: 0,
                level: 1,
                totalParties: 0,
                unlockedBadges: []
            };
            
            await setDoc(userDocRef, userData);
            setUserProfile(userData);
        } catch (error) {
            console.error('Erreur ajout utilisateur:', error);
        }
    }, []);

    // Fonction pour changer l'arrière-plan
    const changeBackground = useCallback((category) => {
        if (localImageData[category]) {
            setBackgroundUrl(localImageData[category]);
        }
    }, []);

    // Écoute des changements d'authentification
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                
                // Vérifier si l'utilisateur existe dans Firestore
                try {
                    const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
                    const userDoc = await getDoc(userDocRef);
                    
                    if (!userDoc.exists()) {
                        await addUserToDatabase(user);
                    } else {
                        setUserProfile(userDoc.data());
                    }
                } catch (error) {
                    console.error('Erreur lors de la vérification utilisateur:', error);
                }
            } else {
                setUser(null);
                setUserProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [addUserToDatabase]);

    // Écoute des changements du profil utilisateur
    useEffect(() => {
        if (!user) return;

        const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                setUserProfile(doc.data());
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Navigation
    const navItems = [
        { id: 'home', icon: Home, label: 'Accueil' },
        { id: 'stats', icon: BarChart, label: 'Stats' },
        { id: 'badges', icon: Award, label: 'Badges' },
        { id: 'challenges', icon: Shield, label: 'Défis' },
        { id: 'souvenirs', icon: Calendar, label: 'Souvenirs' },
        { id: 'friends', icon: Users, label: 'Amis' },
        { id: 'profile', icon: UserIcon, label: 'Profil' }
    ];

    const renderPage = () => {
        switch (currentPage) {
            case 'home': return <HomePage />;
            case 'stats': return <StatsPage />;
            case 'badges': return <BadgesPage />;
            case 'challenges': return <ChallengesPage />;
            case 'souvenirs': return <SouvenirsPage />;
            case 'friends': return <FriendsPage setSelectedFriendId={setSelectedFriendId} setCurrentPage={setCurrentPage} />;
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
                setUserProfile
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

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
};

export default App;
