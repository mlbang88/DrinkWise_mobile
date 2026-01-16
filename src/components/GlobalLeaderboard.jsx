import React, { useState, useEffect, useRef } from 'react';
import { Trophy, MapPin, TrendingUp, Award, Medal, Crown, X, Loader } from 'lucide-react';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';
import { logger } from '../utils/logger';

/**
 * Leaderboard global avec pagination infinie
 * Affiche le classement mondial avec filtres par ville/pays
 */
const GlobalLeaderboard = ({ db, appId, userId, onClose }) => {
    const [leaders, setLeaders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState(null);
    const [currentUserRank, setCurrentUserRank] = useState(null);
    const [filter, setFilter] = useState('global'); // 'global', 'city', 'country'
    const [sortBy, setSortBy] = useState('territories'); // 'territories', 'drinks', 'level', 'parties'
    
    const loaderRef = useRef(null);
    const PAGE_SIZE = 20;

    useEffect(() => {
        loadLeaderboard(true);
    }, [filter, sortBy]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadLeaderboard(false);
                }
            },
            { threshold: 0.5 }
        );

        if (loaderRef.current) {
            observer.observe(loaderRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading, lastDoc]);

    const loadLeaderboard = async (reset = false) => {
        if (isLoading && !reset) return;
        
        setIsLoading(true);
        try {
            // Déterminer le champ de tri selon sortBy
            const sortFields = {
                territories: 'totalVenues', // Nombre de territoires contrôlés
                drinks: 'totalDrinks',
                level: 'level',
                parties: 'totalParties'
            };
            
            const sortField = sortFields[sortBy] || 'totalVenues';
            
            // Charger depuis public_user_stats pour avoir toutes les stats
            const statsRef = collection(db, `artifacts/${appId}/public_user_stats`);
            
            let q = query(
                statsRef,
                orderBy(sortField, 'desc'),
                limit(PAGE_SIZE)
            );

            if (!reset && lastDoc) {
                q = query(statsRef, orderBy(sortField, 'desc'), startAfter(lastDoc), limit(PAGE_SIZE));
            }

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                setHasMore(false);
                setIsLoading(false);
                return;
            }

            const newLeaders = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    userId: doc.id,
                    username: data.username || data.displayName || 'Anonyme',
                    displayName: data.displayName || data.username || 'Anonyme',
                    photoURL: data.photoURL,
                    totalPoints: data.totalPoints || 0,
                    totalVenues: data.totalVenues || 0,
                    totalDrinks: data.totalDrinks || 0,
                    totalParties: data.totalParties || 0,
                    level: data.level || 1,
                    city: data.city || 'Unknown',
                    country: data.country || 'France'
                };
            });

            if (reset) {
                setLeaders(newLeaders);
            } else {
                setLeaders(prev => [...prev, ...newLeaders]);
            }

            setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
            setHasMore(snapshot.docs.length === PAGE_SIZE);

            // Trouver le rang de l'utilisateur actuel
            const userIndex = newLeaders.findIndex(u => u.userId === userId);
            if (userIndex !== -1) {
                setCurrentUserRank(userIndex + 1 + (reset ? 0 : leaders.length));
            }

            logger.info('✅ Leaderboard chargé', { count: newLeaders.length, sortBy });

        } catch (error) {
            logger.error('❌ Erreur chargement leaderboard', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getMedalIcon = (rank) => {
        switch (rank) {
            case 1: return <Crown size={24} color="#fbbf24" />;
            case 2: return <Medal size={24} color="#d1d5db" />;
            case 3: return <Medal size={24} color="#c27803" />;
            default: return null;
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1: return '#fbbf24';
            case 2: return '#d1d5db';
            case 3: return '#c27803';
            default: return '#6b7280';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
            <div style={{
                backgroundColor: '#0a0f1e',
                borderRadius: '20px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 25px 50px -12px rgba(139, 92, 246, 0.25)',
                border: '2px solid rgba(139, 92, 246, 0.3)'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 50%, #5b21b6 100%)',
                    padding: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Trophy size={24} color="white" />
                        </div>
                        <div>
                            <h2 style={{
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: '700',
                                margin: 0
                            }}>
                                Classement Mondial
                            </h2>
                            {currentUserRank && (
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '14px',
                                    margin: '4px 0 0 0'
                                }}>
                                    Votre rang: #{currentUserRank}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={20} color="white" />
                    </button>
                </div>

                {/* Filtres */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    {/* Filtre localisation */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['global', 'city', 'country'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: filter === f ? '#8b5cf6' : '#1f2937',
                                    color: filter === f ? 'white' : '#9ca3af',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    textTransform: 'capitalize'
                                }}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                    
                    {/* Tri par */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#9ca3af', fontSize: '12px', fontWeight: '600' }}>Trier par:</span>
                        {[
                            { value: 'territories', label: '🏯 Territoires', icon: '🏯' },
                            { value: 'drinks', label: '🍺 Verres', icon: '🍺' },
                            { value: 'level', label: '⭐ Niveau', icon: '⭐' },
                            { value: 'parties', label: '🎉 Soirées', icon: '🎉' }
                        ].map(option => (
                            <button
                                key={option.value}
                                onClick={() => setSortBy(option.value)}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: sortBy === option.value ? 'rgba(139, 92, 246, 0.3)' : 'rgba(31, 41, 55, 0.5)',
                                    color: sortBy === option.value ? '#c4b5fd' : '#6b7280',
                                    border: sortBy === option.value ? '1px solid #8b5cf6' : '1px solid transparent',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Liste */}
                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '16px 24px'
                }}>
                    {leaders.map((leader, index) => {
                        const rank = index + 1;
                        const isCurrentUser = leader.userId === userId;

                        return (
                            <div
                                key={leader.userId}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    marginBottom: '12px',
                                    backgroundColor: isCurrentUser ? 'rgba(139, 92, 246, 0.1)' : '#1f2937',
                                    borderRadius: '12px',
                                    border: isCurrentUser ? '2px solid #8b5cf6' : '1px solid rgba(139, 92, 246, 0.2)'
                                }}
                            >
                                {/* Rang */}
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    backgroundColor: rank <= 3 ? `${getRankColor(rank)}20` : '#374151',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {rank <= 3 ? (
                                        getMedalIcon(rank)
                                    ) : (
                                        <span style={{
                                            color: '#9ca3af',
                                            fontSize: '16px',
                                            fontWeight: '700'
                                        }}>
                                            #{rank}
                                        </span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    flexShrink: 0
                                }}>
                                    {leader.username.charAt(0).toUpperCase()}
                                </div>

                                {/* Info */}
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        color: 'white',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {leader.username}
                                        {isCurrentUser && (
                                            <span style={{
                                                padding: '2px 8px',
                                                backgroundColor: '#8b5cf6',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: '700'
                                            }}>
                                                VOUS
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        color: '#9ca3af',
                                        fontSize: '13px',
                                        marginTop: '2px'
                                    }}>
                                        <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                        {leader.totalVenues || 0} lieu{(leader.totalVenues || 0) > 1 ? 'x' : ''}
                                    </div>
                                </div>

                                {/* Stat principale selon le tri */}
                                <div style={{
                                    textAlign: 'right'
                                }}>
                                    <div style={{
                                        color: '#fbbf24',
                                        fontSize: '18px',
                                        fontWeight: '700'
                                    }}>
                                        {sortBy === 'territories' && (leader.totalVenues || 0).toLocaleString()}
                                        {sortBy === 'drinks' && (leader.totalDrinks || 0).toLocaleString()}
                                        {sortBy === 'level' && `Niv. ${leader.level || 1}`}
                                        {sortBy === 'parties' && (leader.totalParties || 0).toLocaleString()}
                                    </div>
                                    <div style={{
                                        color: '#9ca3af',
                                        fontSize: '12px'
                                    }}>
                                        {sortBy === 'territories' && 'territoires'}
                                        {sortBy === 'drinks' && 'verres'}
                                        {sortBy === 'level' && 'niveau'}
                                        {sortBy === 'parties' && 'soirées'}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Loader pour infinite scroll */}
                    <div
                        ref={loaderRef}
                        style={{
                            padding: '20px',
                            textAlign: 'center'
                        }}
                    >
                        {isLoading && (
                            <Loader
                                size={24}
                                color="#8b5cf6"
                                style={{ animation: 'spin 1s linear infinite' }}
                            />
                        )}
                        {!hasMore && leaders.length > 0 && (
                            <div style={{ color: '#6b7280', fontSize: '14px' }}>
                                Fin du classement
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default GlobalLeaderboard;
