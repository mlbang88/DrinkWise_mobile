import React, { useState, useEffect, useContext } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { ExperienceService } from '../services/experienceService';
import { gameplayConfig } from '../utils/data';
import { badgeService } from '../services/badgeService';
import { DrinkWiseImages } from '../assets/DrinkWiseImages';
import LoadingSpinner from '../components/LoadingSpinner';

export default function FriendStatsPage({ friendId }) {
    const { db, user, appId, userProfile, setMessageBox } = useContext(FirebaseContext);
    const [friendStats, setFriendStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fonction pour calculer le niveau et l'XP avec ExperienceService
    const calculateLevelInfo = (stats) => {
        if (!stats) return { level: 1, levelName: "Novice", currentXp: 0, nextLevelXp: 100, progress: 0 };
        
        const unifiedStats = {
            totalParties: stats.totalParties || stats.parties || 0,
            totalDrinks: stats.totalDrinks || stats.drinks || 0,
            totalChallenges: stats.challengesCompleted || stats.defis || 0,
            totalBadges: stats.badgesUnlocked || stats.badges || 0,
            totalQuizQuestions: 0
        };
        
        const totalXp = ExperienceService.calculateTotalXP(unifiedStats);
        const level = ExperienceService.calculateLevel(totalXp);
        const levelName = ExperienceService.getLevelName(level);
        
        const currentLevelXp = ExperienceService.getXpForLevel(level);
        const nextLevelXp = ExperienceService.getXpForLevel(level + 1);
        const progress = ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

        return {
            level,
            levelName,
            currentXp: totalXp,
            nextLevelXp,
            progress: Math.min(progress, 100)
        };
    };

    useEffect(() => {
        if (!user || !friendId) {
            setLoading(false);
            return;
        }

        // Mettre à jour les stats publiques de l'utilisateur actuel si nécessaire
        if (user && userProfile) {
            console.log("🔍 Vérification des stats publiques:", userProfile.publicStats);
            badgeService.updatePublicStats(db, user, appId, userProfile);
        }

        const statsRef = doc(db, `artifacts/${appId}/public_user_stats`, friendId);
        const unsub = onSnapshot(statsRef, (doc) => {
            console.log("📊 Données ami reçues:", doc.exists(), doc.data());
            if (doc.exists()) {
                const friendData = doc.data();
                console.log("🏆 Badges ami:", friendData.unlockedBadges);
                setFriendStats(friendData);
            } else {
                console.log("❌ Document ami non trouvé pour:", friendId);
                setMessageBox({ message: "Le profil de cet ami est privé ou n'existe pas.", type: "info" });
            }
            setLoading(false);
        }, (error) => {
            console.error("❌ Erreur d'accès aux stats de l'ami:", error);
            setMessageBox({ message: "Impossible d'accéder aux statistiques de cet ami.", type: "error" });
            setLoading(false);
        });

        return () => unsub();
    }, [friendId, db, user, appId, userProfile, setMessageBox]);

    if (loading) return <LoadingSpinner />;

    // Fallback si stats absentes
    const userLevelInfo = calculateLevelInfo({
        totalParties: userProfile?.publicStats?.totalParties ?? 0,
        totalDrinks: userProfile?.publicStats?.totalDrinks ?? 0
    });

    const friendLevelInfo = calculateLevelInfo({
        totalParties: friendStats?.totalParties ?? 0,
        totalDrinks: friendStats?.totalDrinks ?? 0
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '20px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                color: 'white'
            }}>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '1rem', color: '#10b981', fontWeight: 'bold' }}>Moi</div>
                    <div style={{ fontSize: '1.1rem', color: '#a78bfa', fontWeight: 'bold' }}>
                        Niveau {userLevelInfo.level + 1} - {userLevelInfo.levelName}
                    </div>
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                    🏆 Battle vs {friendStats?.username || 'Ami'}
                </h1>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', color: '#8b5cf6', fontWeight: 'bold' }}>{friendStats?.username}</div>
                    <div style={{ fontSize: '1.1rem', color: '#a78bfa', fontWeight: 'bold' }}>
                        Niveau {friendLevelInfo.level + 1} - {friendLevelInfo.levelName}
                    </div>
                </div>
            </div>

            {friendStats ? (
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '20px',
                    padding: '25px',
                    color: 'white'
                }}>
                    {/* Progression XP */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '15px',
                        padding: '20px',
                        marginBottom: '25px'
                    }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#ccc' }}>
                            Progression des niveaux
                        </h3>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            gap: '20px',
                            alignItems: 'center'
                        }}>
                            {/* Vous */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#10b981', marginBottom: '8px' }}>Vous</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '5px' }}>
                                    Niveau {userLevelInfo.level} - {userLevelInfo.levelName}
                                </div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
                                    {userLevelInfo.currentXp} XP
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${userLevelInfo.progress}%`,
                                        height: '100%',
                                        backgroundColor: '#10b981',
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease'
                                    }}></div>
                                </div>
                            </div>

                            {/* VS */}
                            <div style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#fbbf24'
                            }}>
                                VS
                            </div>

                            {/* Ami */}
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#8b5cf6', marginBottom: '8px' }}>
                                    {friendStats.username}
                                </div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '5px' }}>
                                    Niveau {friendLevelInfo.level + 1} - {friendLevelInfo.levelName}
                                </div>
                                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '10px' }}>
                                    {friendLevelInfo.currentXp} XP
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '8px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${friendLevelInfo.progress}%`,
                                        height: '100%',
                                        backgroundColor: '#8b5cf6',
                                        borderRadius: '4px',
                                        transition: 'width 0.3s ease'
                                    }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistiques Battle */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto 1fr',
                        gap: '20px',
                        marginBottom: '30px',
                        padding: '20px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '15px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold', marginBottom: '5px' }}>
                                Vous
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#10b981' }}>
                                {userProfile?.publicStats?.totalDrinks || 0}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Verres</div>
                        </div>
                        
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <div style={{ fontSize: '16px', color: '#fbbf24', fontWeight: 'bold' }}>⚔️</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>Battle</div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: 'bold', marginBottom: '5px' }}>
                                {friendStats.username}
                            </div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8b5cf6' }}>
                                {friendStats.totalDrinks || 0}
                            </div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>Verres</div>
                        </div>
                    </div>

                    {/* Statistiques supplémentaires */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '15px',
                        marginBottom: '30px'
                    }}>
                        {/* Soirées */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{userProfile?.publicStats?.totalParties || 0} vs {friendStats.totalParties || 0}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>Soirées</div>
                        </div>
                        {/* Verres */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{userProfile?.publicStats?.totalDrinks || 0} vs {friendStats.totalDrinks || 0}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>Verres</div>
                        </div>
                        {/* Volume */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{Math.round((userProfile?.publicStats?.totalVolume || 0) / 100) / 10}L vs {Math.round((friendStats.totalVolume || 0) / 100) / 10}L</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>Volume total</div>
                        </div>
                        {/* Bagarres */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{userProfile?.publicStats?.totalFights || 0} vs {friendStats.totalFights || 0}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>Bagarres</div>
                        </div>
                        {/* Vomis */}
                        <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '15px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{userProfile?.publicStats?.totalVomi || 0} vs {friendStats.totalVomi || 0}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '5px' }}>Vomis</div>
                        </div>
                    </div>

                    {/* Section Badges */}
                    <div style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '15px',
                        padding: '20px'
                    }}>
                        <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#ccc' }}>
                            🏅 Comparaison des badges
                        </h3>
                        
                        {/* Statistiques des badges */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '10px',
                            textAlign: 'center',
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px'
                        }}>
                            <div>
                                <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 'bold' }}>Vous</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                                    {userProfile?.unlockedBadges?.length || 0}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#ccc', fontWeight: 'bold' }}>Badges</div>
                                <div style={{ fontSize: '14px', color: '#9ca3af' }}>débloqués</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#8b5cf6', fontWeight: 'bold' }}>{friendStats.username}</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
                                    {friendStats.unlockedBadges?.length || 0}
                                </div>
                            </div>
                        </div>

                        {/* Grille des badges */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                            gap: '12px',
                            maxHeight: '300px',
                            overflowY: 'auto'
                        }}>
                            {(() => {
                                console.log("🎯 Debug badges:", {
                                    userBadges: userProfile?.unlockedBadges,
                                    friendBadges: friendStats.unlockedBadges,
                                    friendStats: friendStats
                                });
                                return Object.entries(badgeList).map(([badgeId, badge]) => {
                                    const userHas = userProfile?.unlockedBadges?.includes(badgeId) || false;
                                    const friendHas = friendStats.unlockedBadges?.includes(badgeId) || false;
                                    
                                    let borderColor = 'rgba(75, 85, 99, 0.5)'; // Gris par défaut
                                    let bgColor = 'rgba(0, 0, 0, 0.3)';
                                    
                                    if (userHas && friendHas) {
                                        borderColor = '#fbbf24'; // Doré pour les deux
                                        bgColor = 'rgba(251, 191, 36, 0.1)';
                                    } else if (userHas) {
                                        borderColor = '#10b981'; // Vert pour vous
                                        bgColor = 'rgba(16, 185, 129, 0.1)';
                                    } else if (friendHas) {
                                        borderColor = '#8b5cf6'; // Violet pour l'ami
                                        bgColor = 'rgba(139, 92, 246, 0.1)';
                                    }
                                    
                                    return (
                                        <div 
                                            key={badgeId}
                                            style={{
                                                backgroundColor: bgColor,
                                                border: `2px solid ${borderColor}`,
                                                borderRadius: '12px',
                                                padding: '10px',
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                opacity: (userHas || friendHas) ? 1 : 0.4
                                            }}
                                            title={badge.description}
                                        >
                                            <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                                                {badge.icon}
                                            </div>
                                            <div style={{
                                                fontSize: '10px',
                                                color: 'white',
                                                fontWeight: 'bold',
                                                lineHeight: '1.2'
                                            }}>
                                                {badge.name}
                                            </div>
                                            {userHas && friendHas && (
                                                <div style={{ fontSize: '12px', color: '#fbbf24', marginTop: '2px' }}>
                                                    ⭐
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        
                        {/* Légende */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '20px',
                            marginTop: '15px',
                            fontSize: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '2px' }}></div>
                                <span style={{ color: '#9ca3af' }}>Vous</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}></div>
                                <span style={{ color: '#9ca3af' }}>{friendStats.username}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '12px', height: '12px', backgroundColor: '#fbbf24', borderRadius: '2px' }}></div>
                                <span style={{ color: '#9ca3af' }}>Les deux ⭐</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    borderRadius: '20px',
                    padding: '40px',
                    textAlign: 'center',
                    color: '#ccc'
                }}>
                    Statistiques non disponibles.
                </div>
            )}
        </div>
    );
}
