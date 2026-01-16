import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { useTheme } from '../styles/ThemeContext.jsx';
import ThemedText from '../styles/ThemedText.jsx';
import { badgeService } from '../services/badgeService';
import { ExperienceService } from '../services/experienceService';
import { StreakService } from '../services/streakService';
import { badgeList, gameplayConfig } from '../utils/data';
import PartyModeSelector from '../components/PartyModeSelector';
import LoadingIcon from '../components/LoadingIcon';
import RewardNotification from '../components/RewardNotification';
import GlassButton from '../components/GlassButton';
import ErrorFallback, { EmptyState } from '../components/ErrorFallback';
import ModernHeader from '../components/ModernHeader';
import StatCard from '../components/StatCard';
import FloatingParticles from '../components/FloatingParticles';
import AnimatedCounter from '../components/AnimatedCounter';
import { PlusCircle } from 'lucide-react';
import { DrinkWiseImages } from '../assets/DrinkWiseImages';
import { logger } from '../utils/logger';

const HomePage = () => {
    const { db, user, appId, userProfile } = useContext(FirebaseContext);
    
    const { theme } = useTheme();
    const [showPartyModeSelector, setShowPartyModeSelector] = useState(false);
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [lastBadge, setLastBadge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showRewardNotification, setShowRewardNotification] = useState(false);
    const [rewardData, setRewardData] = useState({ xpGained: 0, newBadges: [] });
    const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });

    // Écouter les récompenses
    useEffect(() => {
        const handleRewardNotification = (event) => {
            setRewardData(event.detail);
            setShowRewardNotification(true);
        };

        window.addEventListener('showRewardNotification', handleRewardNotification);
        return () => window.removeEventListener('showRewardNotification', handleRewardNotification);
    }, []);

    // Charger le streak au montage
    useEffect(() => {
        if (!user || !db) return;
        
        const loadStreak = async () => {
            const streak = await StreakService.getStreak(db, user.uid, appId);
            setStreakData(streak);
        };
        
        loadStreak();
    }, [user, db, appId]);

    // Charger les stats et badges
    useEffect(() => {
        // Vérifier que db, appId et user.uid sont disponibles AVANT tout
        if (!db || !appId || !user?.uid) {
            logger.warn('HomePage: contexte Firebase incomplet');
            setLoading(false);
            return;
        }

        // Mettre à jour les stats publiques si elles n'existent pas
        if (userProfile) {
            logger.info('HOMEPAGE', 'Mise à jour des stats publiques');
            badgeService.updatePublicStats(db, user, appId, userProfile);
        }

        let unsubscribe = null;
        
        // Petit délai pour éviter les conflits de listeners
        const timeoutId = setTimeout(() => {
            const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/parties`));
            unsubscribe = onSnapshot(q, (snap) => {
            const partiesData = snap.docs.map(d => d.data());

            const now = new Date();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            const weeklyParties = partiesData.filter(p => p.timestamp.toDate() >= oneWeekAgo);
            const stats = ExperienceService.calculateRealStats(weeklyParties, userProfile);
            setWeeklyStats(stats);

            if (userProfile?.unlockedBadges && userProfile.unlockedBadges.length > 0) {
                const lastBadgeId = userProfile.unlockedBadges[userProfile.unlockedBadges.length - 1];
                setLastBadge(badgeList[lastBadgeId]);
            }

            setLoading(false);
            }, (error) => {
                logger.error('HOMEPAGE', 'Erreur lecture soirées pour le tableau de bord', error);
                setError(error.message || 'Erreur lors du chargement des données');
                setLoading(false);
            });
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            if (unsubscribe) {
                try {
                    unsubscribe();
                } catch (error) {
                    logger.warn('HomePage: Listener cleanup error', { error: error.message });
                }
            }
        };
    }, [db, user, appId, userProfile]);

    const containerClassName = "backdrop-blur-md border border-gray-600 shadow-lg";
    const containerStyle = {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '0.75rem'
    };

    const retryLoadData = () => {
        setError(null);
        setLoading(true);
        // Force re-render, useEffect will re-run
        const loadStreak = async () => {
            if (!user || !db) return;
            const streak = await StreakService.getStreak(db, user.uid, appId);
            setStreakData(streak);
        };
        loadStreak();
    };

    if (loading) {
        return <div className="flex justify-center mt-10"><LoadingIcon /></div>;
    }

    if (error) {
        return <ErrorFallback message={error} onRetry={retryLoadData} />;
    }

    // Calcul du niveau depuis publicStats (source unique de vérité)
    let userLevel = undefined;
    let userLevelName = '';
    
    if (userProfile?.publicStats?.level !== undefined) {
        userLevel = userProfile.publicStats.level;
        userLevelName = userProfile.publicStats.levelName || '';
    } else if (userProfile?.publicStats) {
        // Recalculer depuis publicStats si level manque
        const stats = {
            totalParties: userProfile.publicStats.totalParties || 0,
            totalDrinks: userProfile.publicStats.totalDrinks || 0,
            totalChallenges: userProfile.publicStats.challengesCompleted || 0,
            totalBadges: userProfile.publicStats.unlockedBadges?.length || 0,
            totalQuizQuestions: userProfile.publicStats.totalQuizQuestions || 0
        };
        const currentXp = ExperienceService.calculateTotalXP(stats);
        userLevel = ExperienceService.calculateLevel(currentXp);
        userLevelName = ExperienceService.getLevelName(userLevel);
    } else {
        // Fallback absolu (ne devrait jamais arriver)
        userLevel = 1;
        userLevelName = 'Bronze Novice';
    }

    // Interface normale uniquement
    return (
        <div className="page-modern">
            {/* Floating Particles Background */}
            <FloatingParticles count={15} />
            
            {/* Modern Header */}
            <ModernHeader 
                username={userProfile?.username || 'Fêtard'} 
                level={userLevel}
                streak={streakData.currentStreak}
            />

            {/* Hero Action Button */}
            <div className="hero-action">
                <button className="btn-hero" onClick={() => setShowPartyModeSelector(true)}>
                    <div className="btn-hero-icon">
                        <PlusCircle size={32} />
                    </div>
                    <div className="btn-hero-content">
                        <span className="btn-hero-title">Nouvelle Soirée</span>
                        <span className="btn-hero-subtitle">Commencer à tracker</span>
                    </div>
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="stats-grid">
                <StatCard 
                    icon="🔥" 
                    label="Série Actuelle" 
                    value={<AnimatedCounter value={streakData.currentStreak} />}
                    accent="warning"
                />
                <StatCard 
                    icon="🍻" 
                    label="Soirées" 
                    value={<AnimatedCounter value={weeklyStats?.totalParties || 0} />}
                    accent="primary"
                />
                <StatCard 
                    icon="🏆" 
                    label="Badges" 
                    value={<AnimatedCounter value={userProfile?.unlockedBadges?.length || 0} />}
                    accent="success"
                />
                <StatCard 
                    icon="⚡" 
                    label="XP Total" 
                    value={<AnimatedCounter value={userProfile?.xp ? Math.floor(userProfile.xp) : 0} />}
                    accent="info"
                />
            </div>

            {/* Stats Hebdomadaires */}
            {weeklyStats && weeklyStats.totalParties > 0 && (
                <div className="card-elevated animate-slide-up" style={{ margin: '0 20px 24px' }}>
                    <h2 className="heading-2 mb-4">📊 Cette Semaine</h2>
                    <div className="neon-divider" style={{ margin: '12px 0 16px' }} />
                    <div className="space-y-3">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-base)' }}>
                            <span className="text-secondary">🎉 Soirées</span>
                            <span style={{ fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                                {weeklyStats.totalParties}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-base)' }}>
                            <span className="text-secondary">🍻 Verres</span>
                            <span style={{ fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                                {weeklyStats.totalDrinks}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-base)' }}>
                            <span className="text-secondary">🍺 Volume</span>
                            <span style={{ fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                                {weeklyStats.totalVolume ? `${(weeklyStats.totalVolume / 100).toFixed(1)}L` : '0L'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-base)' }}>
                            <span className="text-secondary">🥊 Bagarres</span>
                            <span style={{ fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                                {weeklyStats.totalFights}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-base)' }}>
                            <span className="text-secondary">🤢 Vomis</span>
                            <span style={{ fontWeight: 'var(--font-bold)', color: 'var(--text-primary)' }}>
                                {weeklyStats.totalVomi}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Dernier Badge */}
            {lastBadge && (
                <div className="card-elevated" style={{ margin: '0 20px 24px' }}>
                    <h2 className="heading-2 mb-4">🏆 Dernier Exploit</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ 
                            padding: '12px', 
                            borderRadius: '16px', 
                            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%)',
                            border: '2px solid rgba(139, 92, 246, 0.3)',
                            flexShrink: 0
                        }}>
                            {React.cloneElement(lastBadge.icon, { size: 32, style: { color: '#8b5cf6' } })}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="body-large" style={{ fontWeight: 'var(--font-bold)', marginBottom: '4px' }}>
                                {lastBadge.name}
                            </div>
                            <div className="caption">
                                {lastBadge.description}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State si pas de stats */}
            {weeklyStats && weeklyStats.totalParties === 0 && (
                <div style={{ padding: '0 20px' }}>
                    <div className="card-glass" style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
                        <h3 className="heading-2" style={{ marginBottom: '8px' }}>Prêt à commencer ?</h3>
                        <p className="caption">Crée ta première soirée et commence à tracker tes moments !</p>
                    </div>
                </div>
            )}

            {/* Modales */}
            {showPartyModeSelector && (
                <PartyModeSelector 
                    onClose={() => setShowPartyModeSelector(false)}
                    onPartySaved={() => {
                        setShowPartyModeSelector(false);
                    }}
                />
            )}
            
            {showRewardNotification && (
                <RewardNotification
                    xpGained={rewardData.xpGained}
                    newBadges={rewardData.newBadges}
                    onClose={() => setShowRewardNotification(false)}
                />
            )}
        </div>
    );
};

export default HomePage;