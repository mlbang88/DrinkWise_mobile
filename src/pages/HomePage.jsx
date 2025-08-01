import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import ThemedText from '../styles/ThemedText.jsx';
import { badgeService } from '../services/badgeService';
import { badgeList, gameplayConfig } from '../utils/data';
import AddPartyModal from '../components/AddPartyModal';
import LoadingIcon from '../components/LoadingIcon';
import RewardNotification from '../components/RewardNotification';
import { PlusCircle } from 'lucide-react';

const HomePage = () => {
    const { db, user, appId, userProfile } = useContext(FirebaseContext);
    
    const [showAddPartyModal, setShowAddPartyModal] = useState(false);
    const [weeklyStats, setWeeklyStats] = useState(null);
    const [lastBadge, setLastBadge] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showRewardNotification, setShowRewardNotification] = useState(false);
    const [rewardData, setRewardData] = useState({ xpGained: 0, newBadges: [] });

    // Écouter les récompenses
    useEffect(() => {
        const handleRewardNotification = (event) => {
            setRewardData(event.detail);
            setShowRewardNotification(true);
        };

        window.addEventListener('showRewardNotification', handleRewardNotification);
        return () => window.removeEventListener('showRewardNotification', handleRewardNotification);
    }, []);

    // Charger les stats et badges
    useEffect(() => {
        if (!user || !db) {
            setLoading(false);
            return;
        }

        // Mettre à jour les stats publiques si elles n'existent pas
        if (userProfile) {
            console.log("🏠 HomePage - Mise à jour des stats publiques");
            badgeService.updatePublicStats(db, user, appId, userProfile);
        }

        const q = query(collection(db, `artifacts/${appId}/users/${user.uid}/parties`));
        const unsubscribe = onSnapshot(q, (snap) => {
            const partiesData = snap.docs.map(d => d.data());

            const now = new Date();
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            const weeklyParties = partiesData.filter(p => p.timestamp.toDate() >= oneWeekAgo);
            const stats = badgeService.calculateGlobalStats(weeklyParties);
            setWeeklyStats(stats);

            if (userProfile?.unlockedBadges && userProfile.unlockedBadges.length > 0) {
                const lastBadgeId = userProfile.unlockedBadges[userProfile.unlockedBadges.length - 1];
                setLastBadge(badgeList[lastBadgeId]);
            }

            setLoading(false);
        }, (error) => {
            console.error("Erreur lecture soirées pour le tableau de bord:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db, user, appId, userProfile]);

    const containerClassName = "backdrop-blur-md border border-gray-600 shadow-lg";
    const containerStyle = {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '0.75rem'
    };

    if (loading) {
        return <div className="flex justify-center mt-10"><LoadingIcon /></div>;
    }

    // Calcul du niveau si absent
    let _userLevel = undefined;
    let _userLevelName = '';
    // Priorité : publicStats.level > userProfile.level > calcul local
    if (userProfile?.publicStats?.level !== undefined) {
        _userLevel = userProfile.publicStats.level;
        _userLevelName = userProfile.publicStats.levelName || '';
    } else if (userProfile?.level !== undefined) {
        _userLevel = userProfile.level;
        _userLevelName = userProfile.levelName || '';
    } else if (userProfile?.xp !== undefined && gameplayConfig) {
        const levels = gameplayConfig.levels;
        const currentXp = userProfile.xp;
        let foundLevel = 0;
        for (let i = levels.length - 1; i >= 0; i--) {
            if (currentXp >= levels[i].xp) {
                foundLevel = i;
                break;
            }
        }
        _userLevel = foundLevel;
        _userLevelName = levels[foundLevel]?.name || '';
    }

    // Interface normale uniquement
    return (
        <div className="w-full h-full animate-fade-in space-y-4">
            <div className="text-center mb-6">
                <ThemedText style={{ fontSize: '1.75rem', fontWeight: 'bold', display: 'block', marginTop: '20px' }}>
                    Bienvenue, {userProfile?.username || 'Fêtard'} !
                </ThemedText>
                <ThemedText style={{ fontSize: '1rem', color: '#d1d5db', display: 'block', marginTop: '8px', marginBottom: '20px' }}>
                    Prêt à faire la fête ?
                </ThemedText>
            </div>

            {/* Bouton Nouvelle Soirée */}
            <div className="mobile-card">
                <button
                    onClick={() => setShowAddPartyModal(true)}
                    className="w-full font-bold transition-transform transform active:scale-95 flex items-center justify-center shadow-lg"
                    style={{ 
                        padding: '20px 24px',
                        backgroundColor: '#7c3aed',
                        color: 'white',
                        fontSize: '1.125rem',
                        borderRadius: '12px',
                        border: 'none'
                    }}
                >
                    <PlusCircle size={24} className="flex-shrink-0" style={{ color: 'white', marginRight: '12px' }} /> 
                    <span className="flex-grow text-center">Nouvelle Soirée</span>
                </button>
            </div>

            {/* Stats et Badges */}
            <div className="mobile-grid">
                <div className={`mobile-card p-6 ${containerClassName}`} style={{ ...containerStyle, border: '2px solid rgba(255, 255, 255, 0.2)' }}>
                    <ThemedText style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                        📊 Semaine
                    </ThemedText>
                    {weeklyStats && weeklyStats.totalParties > 0 ? (
                        <div className="space-y-3">
                            <ThemedText style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                <span>🎉 Soirées :</span> <span style={{ fontWeight: 'bold' }}>{weeklyStats.totalParties}</span>
                            </ThemedText>
                            <ThemedText style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                <span>🍻 Verres :</span> <span style={{ fontWeight: 'bold' }}>{weeklyStats.totalDrinks}</span>
                            </ThemedText>
                            <ThemedText style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                <span>🍺 Volume :</span> <span style={{ fontWeight: 'bold' }}>{weeklyStats.totalVolume ? `${(weeklyStats.totalVolume / 100).toFixed(1)}L` : '0L'}</span>
                            </ThemedText>
                            <ThemedText style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                <span>🥊 Bagarres :</span> <span style={{ fontWeight: 'bold' }}>{weeklyStats.totalFights}</span>
                            </ThemedText>
                            <ThemedText style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
                                <span>🤢 Vomis :</span> <span style={{ fontWeight: 'bold' }}>{weeklyStats.totalVomi}</span>
                            </ThemedText>
                        </div>
                    ) : (
                        <ThemedText className="mobile-text-sm" style={{ color: '#9ca3af', textAlign: 'center' }}>
                            Aucune soirée cette semaine
                        </ThemedText>
                    )}
                </div>

                <div className={`mobile-card p-6 ${containerClassName}`} style={{ ...containerStyle, border: '2px solid rgba(255, 255, 255, 0.2)' }}>
                    <ThemedText style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
                        🏆 Dernier Exploit
                    </ThemedText>
                    {lastBadge ? (
                        <div className="flex items-center space-x-3">
                            <div className="p-2 rounded-full flex-shrink-0 badge-container-gold">
                                {React.cloneElement(lastBadge.icon, { size: 28, className: 'badge-gold' })}
                            </div>
                            <div className="flex-1 min-w-0">
                                <ThemedText className="mobile-text-base break-words" style={{ fontWeight: 'bold' }}>
                                    {lastBadge.name}
                                </ThemedText>
                                <ThemedText className="mobile-text-sm break-words" style={{ color: '#d1d5db' }}>
                                    {lastBadge.description}
                                </ThemedText>
                            </div>
                        </div>
                    ) : (
                        <ThemedText className="mobile-text-sm" style={{ color: '#9ca3af', textAlign: 'center' }}>
                            Pas encore d'exploits
                        </ThemedText>
                    )}
                </div>
            </div>

            {/* Modales */}
            {showAddPartyModal && (
                <AddPartyModal 
                    onClose={() => setShowAddPartyModal(false)}
                    onPartySaved={() => {
                        setShowAddPartyModal(false);
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