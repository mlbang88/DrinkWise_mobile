import React, { useState, useEffect, useContext } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { badgeService } from '../services/badgeService';
import { badgeList, gameplayConfig } from '../utils/data';
import LoadingSpinner from '../components/LoadingSpinner';

const FriendStatsPage = ({ friendId, setCurrentPage }) => {
    const { db, appId, setMessageBox, userProfile, user } = useContext(FirebaseContext);
    const [friendStats, setFriendStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fonction pour calculer le niveau et l'XP
    const calculateLevelInfo = (stats) => {
        if (!stats) return { level: 0, levelName: "Novice de la Fête", currentXp: 0, nextLevelXp: 500, progress: 0 };
        
        const totalXp = (stats.totalParties || 0) * gameplayConfig.xpPerParty + 
                       (stats.totalDrinks || 0) * gameplayConfig.xpPerDrink;
        
        let currentLevel = 0;
        for (let i = gameplayConfig.levels.length - 1; i >= 0; i--) {
            if (totalXp >= gameplayConfig.levels[i].xp) {
                currentLevel = i;
                break;
            }
        }
        
        const nextLevel = Math.min(currentLevel + 1, gameplayConfig.levels.length - 1);
        const currentLevelXp = gameplayConfig.levels[currentLevel].xp;
        const nextLevelXp = gameplayConfig.levels[nextLevel].xp;
        const progress = nextLevel === currentLevel ? 100 : 
            ((totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
        
        return {
            level: currentLevel,
            levelName: gameplayConfig.levels[currentLevel].name,
            currentXp: totalXp,
            nextLevelXp,
            progress: Math.min(progress, 100)
        };
    };

    useEffect(() => {
        // Mettre à jour les stats publiques de l'utilisateur actuel si nécessaire
        if (user && userProfile) {
            console.log("🔍 Vérification des stats publiques:", userProfile.publicStats);
            // Toujours mettre à jour pour s'assurer que les badges sont synchronisés
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
            console.error("Erreur chargement stats ami:", error);
            setLoading(false);
        });
        return () => unsub();
    }, [db, appId, friendId, setMessageBox, user, userProfile]);

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url("https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'white',
            padding: '20px'
        }}>
            {/* Header avec bouton retour */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '30px'
            }}>
                <button 
                    onClick={() => setCurrentPage('friends')}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '28px',
                        cursor: 'pointer',
                        marginRight: '15px'
                    }}
                >
                    ←
                </button>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: 0,
                    textAlign: 'center',
                    flex: 1
                }}>
                    Stats de {friendStats?.username || '...'}
                </h1>
            </div>

            {friendStats ? (
                <div>
                    {/* Niveau et progression XP */}
                    {(() => {
                        const levelInfo = calculateLevelInfo(friendStats);
                        return (
                            <div style={{
                                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                borderRadius: '20px',
                                padding: '20px',
                                marginBottom: '25px',
                                border: '2px solid rgba(139, 92, 246, 0.4)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '15px'
                                }}>
                                    <div>
                                        <h3 style={{
                                            fontSize: '20px',
                                            fontWeight: 'bold',
                                            margin: '0 0 5px 0',
                                            color: '#a855f7'
                                        }}>
                                            Niveau {levelInfo.level + 1}
                                        </h3>
                                        <p style={{
                                            fontSize: '16px',
                                            margin: 0,
                                            color: '#e5e7eb'
                                        }}>
                                            {levelInfo.levelName}
                                        </p>
                                    </div>
                                    <div style={{
                                        textAlign: 'right'
                                    }}>
                                        <div style={{
                                            fontSize: '14px',
                                            color: '#9ca3af',
                                            marginBottom: '2px'
                                        }}>
                                            XP Total
                                        </div>
                                        <div style={{
                                            fontSize: '18px',
                                            fontWeight: 'bold',
                                            color: '#fbbf24'
                                        }}>
                                            {levelInfo.currentXp}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Barre de progression */}
                                <div style={{
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: '10px',
                                    height: '12px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        backgroundColor: '#a855f7',
                                        height: '100%',
                                        width: `${levelInfo.progress}%`,
                                        borderRadius: '10px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                                
                                <div style={{
                                    fontSize: '12px',
                                    color: '#9ca3af',
                                    textAlign: 'center',
                                    marginTop: '8px'
                                }}>
                                    {levelInfo.level + 1 < gameplayConfig.levels.length ? 
                                        `${Math.round(levelInfo.progress)}% vers le niveau ${levelInfo.level + 2}` :
                                        'Niveau maximum atteint!'
                                    }
                                </div>
                            </div>
                        );
                    })()}

                    {/* Stats personnelles */}
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '20px',
                        padding: '25px',
                        marginBottom: '25px'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '20px',
                            marginBottom: '25px'
                        }}>
                            <div>
                                <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px' }}>Soirées:</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{friendStats.totalParties || 0}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px' }}>Boissons:</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{friendStats.totalDrinks || 0}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px' }}>Bagarres:</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{friendStats.totalFights || 0}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px' }}>Vomis:</div>
                                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{friendStats.totalVomi || 0}</div>
                            </div>
                        </div>

                        {/* Boisson préférée */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <div style={{ fontSize: '24px' }}>🏆</div>
                            <div>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                                    Boisson Préférée
                                </div>
                                <div style={{ fontSize: '14px', color: '#f59e0b' }}>
                                    {friendStats.mostConsumedDrink?.type || 'Aucune'} ({friendStats.mostConsumedDrink?.quantity || 0} verres)
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Battle de Stats */}
                    {userProfile?.publicStats ? (
                        <div style={{
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            borderRadius: '20px',
                            padding: '25px',
                            border: '2px solid #8b5cf6'
                        }}>
                            <h3 style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                marginBottom: '20px',
                                margin: '0 0 20px 0'
                            }}>
                                ⚔️ Battle de Stats ⚔️
                            </h3>
                            
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: '10px',
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>
                                <div style={{ color: '#ccc' }}>Vous</div>
                                <div style={{ color: '#ccc' }}>Stat</div>
                                <div style={{ color: '#ccc' }}>{friendStats.username}</div>
                                
                                {[
                                    { key: 'totalDrinks', label: 'Boissons' },
                                    { key: 'totalVolume', label: 'Volume (cL)' },
                                    { key: 'totalFights', label: 'Bagarres' },
                                    { key: 'totalVomi', label: 'Vomis' },
                                    { key: 'totalParties', label: 'Soirées' }
                                ].map(({ key, label }) => {
                                    const userVal = userProfile.publicStats[key] || 0;
                                    const friendVal = friendStats[key] || 0;
                                    const userColor = userVal >= friendVal ? '#10b981' : '#ef4444';
                                    const friendColor = friendVal >= userVal ? '#10b981' : '#ef4444';
                                    
                                    return (
                                        <React.Fragment key={key}>
                                            <div style={{ 
                                                color: userColor,
                                                fontSize: '16px',
                                                padding: '8px 0'
                                            }}>
                                                {userVal}
                                            </div>
                                            <div style={{ 
                                                color: 'white',
                                                fontSize: '14px',
                                                padding: '8px 0'
                                            }}>
                                                {label}
                                            </div>
                                            <div style={{ 
                                                color: friendColor,
                                                fontSize: '16px',
                                                padding: '8px 0'
                                            }}>
                                                {friendVal}
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            backgroundColor: 'rgba(255, 0, 0, 0.2)',
                            borderRadius: '20px',
                            padding: '25px',
                            border: '2px solid #ef4444',
                            textAlign: 'center'
                        }}>
                            <p style={{ color: '#ef4444', margin: 0 }}>
                                Battle non disponible - Stats publiques manquantes
                            </p>
                            <p style={{ color: '#9ca3af', fontSize: '14px', margin: '5px 0 0 0' }}>
                                Enregistrez une nouvelle soirée pour activer la battle
                            </p>
                        </div>
                    )}

                    {/* Comparaison des badges */}
                    <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        borderRadius: '20px',
                        padding: '25px',
                        marginTop: '25px'
                    }}>
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            textAlign: 'center',
                            marginBottom: '20px',
                            margin: '0 0 20px 0'
                        }}>
                            🏆 Badges & Exploits 🏆
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
};

export default FriendStatsPage;