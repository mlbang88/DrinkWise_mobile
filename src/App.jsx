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
import FriendsPage from './pages/FriendsPage_NEW';
import ProfilePage from './pages/ProfilePage';
import FriendStatsPage from './pages/FriendStatsPage';
import FeedPage from './pages/FeedPage';

// Import icons for the nav bar
import { Home, BarChart, Users, Award, User as UserIcon, Shield, Rss } from 'lucide-react';

const mainBgStyle = {
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    transition: 'background-image 0.5s ease-in-out',
    // Support responsive universel
    minHeight: '100dvh', // Dynamic Viewport Height pour mobiles modernes (avec fallback)
    width: '100vw',
    maxWidth: '100vw',
    overflowX: 'hidden'
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
        { id: 'feed', icon: Rss, label: 'Fil' },
        { id: 'stats', icon: BarChart, label: 'Stats' },
        { id: 'badges', icon: Award, label: 'Badges' },
        { id: 'friends', icon: Users, label: 'Amis' },
        { id: 'profile', icon: UserIcon, label: 'Profil' }
    ];

    const renderPage = () => {
        switch (currentPage) {
            case 'home': return <HomePage />;
            case 'feed': return <FeedPage />;
            case 'stats': return <StatsPage />;
            case 'badges': return <BadgesPage />;
            case 'challenges': return <ChallengesPage />;
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
                    className="mobile-container font-sans text-white relative" 
                    style={{ 
                        ...mainBgStyle, 
                        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${backgroundUrl})`,
                        backgroundAttachment: 'fixed',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        // Support Safe Area universel
                        paddingTop: 'env(safe-area-inset-top, 0)',
                        paddingBottom: 'env(safe-area-inset-bottom, 0)',
                        paddingLeft: 'env(safe-area-inset-left, 0)',
                        paddingRight: 'env(safe-area-inset-right, 0)'
                    }}
                >
                    <header className="mobile-header p-4 bg-black/20 shadow-lg text-center backdrop-blur-sm">
                        <ThemedText style={{ 
                            fontSize: 'clamp(1.5rem, 5vw, 2rem)', // Taille responsive universelle
                            fontWeight: 'bold',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                        }}>
                            DrinkWise
                        </ThemedText>
                    </header>
                    
                    <main className="mobile-main">
                        <div className="page-container">
                            {renderPage()}
                        </div>
                    </main>
                    
                    <footer className="mobile-footer">
                        <div className="flex">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setCurrentPage(item.id)}
                                    className="mobile-nav-button"
                                >
                                    <item.icon 
                                        size={20} 
                                        style={{ 
                                            color: currentPage === item.id ? '#a855f7' : '#ffffff',
                                            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))',
                                            marginBottom: '2px',
                                            // Taille responsive selon l'écran
                                            width: 'clamp(18px, 5vw, 24px)',
                                            height: 'clamp(18px, 5vw, 24px)'
                                        }}
                                    />
                                    <span 
                                        className="mobile-text-sm"
                                        style={{ 
                                            color: currentPage === item.id ? '#a855f7' : '#ffffff',
                                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                                            fontWeight: currentPage === item.id ? 'bold' : 'normal',
                                            // Adaptation responsive du texte
                                            fontSize: 'clamp(0.7rem, 3vw, 0.85rem)',
                                            lineHeight: '1.2',
                                            marginTop: '2px'
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
                onClose={() => {}} 
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
