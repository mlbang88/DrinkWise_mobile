import React, { useState, useCallback, useContext, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider, useTheme } from './styles/ThemeContext.jsx';
import ThemedText from './styles/ThemedText.jsx';
import { FirebaseProvider, FirebaseContext } from './contexts/FirebaseContext.jsx';
import { localImageData } from './utils/data';

// Import critical components (always needed)
import LoadingSpinner from './components/LoadingSpinner';
import MessageBox from './components/MessageBox';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import BottomNav from './components/BottomNav';
import ToastContainer from './components/ToastContainer';

// Lazy load pages (code splitting)
const StatsPage = lazy(() => import('./pages/StatsPage'));
const BadgesPage = lazy(() => import('./pages/BadgesPage'));
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'));
const FriendsPage = lazy(() => import('./pages/FriendsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FriendStatsPage = lazy(() => import('./pages/FriendStatsPage'));
const FeedPage = lazy(() => import('./pages/FeedPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const BattleRoyale = lazy(() => import('./components/BattleRoyale'));

// Import icons for the nav bar
import { Home, BarChart, Users, Award, User as UserIcon, Trophy, Rss, Target } from 'lucide-react';

// Import error handling and logging
import ErrorBoundary from './components/ErrorBoundary';
import { logger } from './utils/logger.js';
import { errorHandler } from './utils/errorHandler.js';

// Import navigation improvements
import PageTransition from './components/PageTransition';

const mainBgStyle = {
    background: '#0f0f0f', // Dark gray
    // Support responsive universel
    minHeight: '100dvh',
    width: '100vw',
    maxWidth: '100vw',
    overflowX: 'hidden'
};

const AppContent = () => {
    const { user, loading, messageBox } = useContext(FirebaseContext);
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedFriendId, setSelectedFriendId] = useState(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [previousPage, setPreviousPage] = useState(null);
    
    // IMPORTANT: useTheme doit être appelé avant tout return conditionnel
    useTheme();

    // Navigation avec transition fluide
    const navigateToPage = useCallback((pageId) => {
        if (pageId === currentPage || isTransitioning) return;
        
        setIsTransitioning(true);
        setPreviousPage(currentPage);
        
        // Petite pause pour l'animation de sortie
        setTimeout(() => {
            setCurrentPage(pageId);
            setIsTransitioning(false);
        }, 150);
    }, [currentPage, isTransitioning]);

    if (loading) {
        return <LoadingSpinner />;
    }

    // Navigation - Items principaux (max 5 pour mobile)
    const mainNavItems = [
        { id: 'home', icon: Home, label: 'Accueil' },
        { id: 'feed', icon: Rss, label: 'Fil' },
        { id: 'battle', icon: Trophy, label: 'Battle' },
        { id: 'friends', icon: Users, label: 'Amis' },
        { id: 'profile', icon: UserIcon, label: 'Profil' }
    ];
    
    // Items secondaires accessibles via HomePage ou profil
    const secondaryNavItems = [
        { id: 'stats', icon: BarChart, label: 'Stats' },
        { id: 'badges', icon: Award, label: 'Badges' },
        { id: 'challenges', icon: Target, label: 'Défis' }
    ];

    const renderPage = () => {
        const PageComponent = () => {
            switch (currentPage) {
                case 'home': return <HomePage setCurrentPage={setCurrentPage} />;
                case 'feed': return <FeedPage />;
                case 'battle': return <BattleRoyale setCurrentPage={setCurrentPage} />;
                case 'map': return <MapPage setCurrentPage={setCurrentPage} />;
                case 'stats': return <StatsPage />;
                case 'badges': return <BadgesPage />;
                case 'challenges': return <ChallengesPage />;
                case 'friends': return <FriendsPage setSelectedFriendId={setSelectedFriendId} setCurrentPage={setCurrentPage} />;
                case 'profile': return <ProfilePage setCurrentPage={setCurrentPage} />;
                case 'friendStats': return <FriendStatsPage friendId={selectedFriendId} setCurrentPage={setCurrentPage} />;
                default: return <HomePage />;
            }
        };

        return (
            <PageTransition 
                isActive={!isTransitioning}
                direction="fade"
                duration={300}
            >
                <Suspense fallback={<LoadingSpinner />}>
                    <PageComponent />
                </Suspense>
            </PageTransition>
        );
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
                        // Support Safe Area universel
                        paddingTop: 'env(safe-area-inset-top, 0)',
                        paddingBottom: 'env(safe-area-inset-bottom, 0)',
                        paddingLeft: 'env(safe-area-inset-left, 0)',
                        paddingRight: 'env(safe-area-inset-right, 0)'
                    }}
                >
                    {/* Skip link pour navigation clavier */}
                    <a href="#main-content" className="skip-link">
                        Aller au contenu principal
                    </a>

                    <header 
                        className="mobile-header p-4 bg-black/20 shadow-lg text-center backdrop-blur-sm"
                        role="banner"
                    >
                        <ThemedText style={{ 
                            fontSize: 'clamp(1.5rem, 5vw, 2rem)', // Taille responsive universelle
                            fontWeight: 'bold',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)'
                        }}>
                            DrinkWise
                        </ThemedText>
                    </header>
                    
                    <main 
                        id="main-content"
                        className="mobile-main" 
                        role="main"
                        aria-label="Contenu principal"
                    >
                        <div className="page-container">
                            {renderPage()}
                        </div>
                    </main>
                    
                    {/* Modern Bottom Navigation */}
                    <nav role="navigation" aria-label="Navigation principale">
                        <BottomNav 
                            currentPage={currentPage} 
                            onNavigate={navigateToPage}
                        />
                    </nav>
                </div>
            )}
            
            {/* Toast notifications */}
            <aside role="status" aria-live="polite" aria-atomic="true">
                <ToastContainer />
            </aside>
            
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
        <ErrorBoundary>
            <ThemeProvider>
                <FirebaseProvider>
                    <AppContent />
                </FirebaseProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default App;
