import React, { useState, useCallback, useContext } from 'react';
import { ThemeProvider, useTheme } from './styles/ThemeContext.jsx';
import ThemedText from './styles/ThemedText.jsx';
import { FirebaseProvider, FirebaseContext } from './contexts/FirebaseContext.jsx';
import { localImageData } from './utils/data';

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

const AppContent = () => {
    const { user, loading, messageBox } = useContext(FirebaseContext);
    const [currentPage, setCurrentPage] = useState('home');
    const [backgroundUrl, setBackgroundUrl] = useState(localImageData['soiree']);
    const [selectedFriendId, setSelectedFriendId] = useState(null);
    
    // IMPORTANT: useTheme doit être appelé avant tout return conditionnel
    useTheme();

    if (loading) {
        return <LoadingSpinner />;
    }

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
    
    return (
        <>
            {!user ? (
                <AuthPage />
            ) : (
                <div 
                    className="min-h-screen font-sans flex flex-col text-white relative w-full" 
                    style={{ 
                        ...mainBgStyle, 
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundUrl})`,
                        margin: 0,
                        padding: 0,
                        minHeight: '100vh', // Force la hauteur minimum à 100vh
                        backgroundAttachment: 'fixed', // Fond fixe pour toujours couvrir
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                    }}
                >
                    <header className="relative z-10 p-4 bg-black/20 shadow-lg text-center backdrop-blur-sm flex-shrink-0">
                        <ThemedText style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>DrinkWise</ThemedText>
                    </header>
                    <main className="relative z-10 flex-grow flex flex-col w-full min-h-0">
                        <div className="w-full flex-grow flex flex-col">
                            {renderPage()}
                        </div>
                    </main>
                    <footer className="relative z-10 bg-black/50 backdrop-blur-sm border-t border-white/20 flex-shrink-0 mt-auto">
                        <div className="flex justify-around items-center p-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentPage(item.id)}
                                    className="flex flex-col items-center p-2 transition-colors duration-200"
                                    style={{
                                        minWidth: '60px',
                                        backgroundColor: 'transparent' // Pas de background
                                    }}
                                >
                                    <item.icon 
                                        size={20} 
                                        style={{ 
                                            color: currentPage === item.id ? '#a855f7' : '#ffffff',
                                            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))' // Ombre pour meilleure visibilité
                                        }}
                                    />
                                    <span 
                                        className="text-[10px] mt-0.5"
                                        style={{ 
                                            color: currentPage === item.id ? '#a855f7' : '#ffffff',
                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)' // Ombre pour le texte aussi
                                        }}
                                    >
                                        {item.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </footer>
                </div>
            )}
            <MessageBox 
                message={messageBox.message} 
                type={messageBox.type} 
                onClose={() => {}} // Les messages se ferment automatiquement
            />
        </>
    );
};

const App = () => {
    return (
        <ThemeProvider>
            <FirebaseProvider>
                <AppContent />
            </FirebaseProvider>
        </ThemeProvider>
    );
};

export default App;
