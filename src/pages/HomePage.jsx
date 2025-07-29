import React, { useState, useEffect, useContext } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { useTheme } from '../styles/ThemeContext.jsx';
import ThemedText from '../styles/ThemedText.jsx';
import { badgeService } from '../services/badgeService';
import { badgeList } from '../utils/data';
import AddPartyModal from '../components/AddPartyModal';
import LoadingIcon from '../components/LoadingIcon';
import RewardNotification from '../components/RewardNotification';
import { PlusCircle } from 'lucide-react';
import QuizManager from '../components/QuizManagerClean';

const HomePage = () => {
    const { db, user, appId, userProfile } = useContext(FirebaseContext);
    
    const { theme } = useTheme();
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

    // Interface normale uniquement
    return (
        <div className="w-full h-full animate-fade-in space-y-6 px-6 flex flex-col">
            <div className="text-center">
                <ThemedText style={{ fontSize: '2.25rem', fontWeight: 'bold', display: 'block', marginTop: '40px' }}>
                    Bienvenue, {userProfile?.username || 'Fêtard'} !
                </ThemedText>
                <ThemedText style={{ fontSize: '1.125rem', color: '#d1d5db', display: 'block', marginTop: '8px', marginBottom: '20px' }}>
                    Prêt à faire la fête ?
                </ThemedText>
            </div>

            {/* Bouton Nouvelle Soirée */}
            <button
                onClick={() => setShowAddPartyModal(true)}
                className="font-bold transition-transform transform hover:scale-105 flex items-center justify-center shadow-lg"
                style={{ 
                    marginBottom: '60px',
                    marginLeft: '16px',
                    marginRight: '16px',
                    padding: '24px 32px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    fontSize: '1.25rem',
                    borderRadius: '20px'
                }}
            >
                <PlusCircle size={32} className="flex-shrink-0" style={{ color: 'white', marginRight: '16px' }} /> 
                <span className="flex-grow text-center">Enregistrer une Nouvelle Soirée</span>
            </button>

            {/* Stats et Badges */}
            <div className="grid grid-cols-1 flex-grow" style={{ gap: '80px', paddingLeft: '16px', paddingRight: '16px' }}>
                <div className={`p-8 ${containerClassName} min-h-[180px]`} style={{ ...containerStyle, border: '2px solid rgba(255, 255, 255, 0.2)' }}>
                    <ThemedText style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
                        Résumé de la Semaine
                    </ThemedText>
                    {weeklyStats && weeklyStats.totalParties > 0 ? (
                        <div className="space-y-3">
                            <ThemedText style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                                <span>🎉 Soirées :</span> <span style={{ fontWeight: 'bold' }}>{weeklyStats.totalParties}</span>
                            </ThemedText>
                            <ThemedText style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                                <span>🍻 Verres bus :</span> <span style={{ fontWeight: 'bold' }}>{weeklyStats.totalDrinks}</span>
                            </ThemedText>
                            <ThemedText style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                                <span>🥊 Bagarres :</span> <span style={{ fontWeight: 'bold' }}>{weeklyStats.totalFights}</span>
                            </ThemedText>
                            <ThemedText style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.1rem' }}>
                                <span>🤢 Vomis :</span> <span style={{ fontWeight: 'bold' }}>{weeklyStats.totalVomi}</span>
                            </ThemedText>
                        </div>
                    ) : (
                        <ThemedText style={{ color: '#9ca3af', fontSize: '1rem' }}>
                            Aucune soirée enregistrée cette semaine. Il est temps de sortir !
                        </ThemedText>
                    )}
                </div>

                <div className={`p-8 ${containerClassName} min-h-[180px]`} style={{ ...containerStyle, border: '2px solid rgba(255, 255, 255, 0.2)' }}>
                    <ThemedText style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
                        Dernier Exploit
                    </ThemedText>
                    {lastBadge ? (
                        <div className="flex items-center space-x-4">
                            <div className="p-3 rounded-full flex-shrink-0 badge-container-gold">
                                {React.cloneElement(lastBadge.icon, { size: 36, className: 'badge-gold' })}
                            </div>
                            <div style={{ overflow: 'hidden', flex: '1' }}>
                                <ThemedText style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
                                    {lastBadge.name}
                                </ThemedText>
                                <ThemedText style={{ fontSize: '1rem', color: '#d1d5db' }}>
                                    {lastBadge.description}
                                </ThemedText>
                            </div>
                        </div>
                    ) : (
                        <ThemedText style={{ color: '#9ca3af' }}>
                            Enregistrez votre première soirée pour commencer à débloquer des badges !
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
            
            <QuizManager />
        </div>
    );
};

export default HomePage;