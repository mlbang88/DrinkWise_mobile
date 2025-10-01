// src/components/FriendsLeaderboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { SocialComparisonService } from '../services/socialComparisonService';
import { Trophy, User, TrendingUp, Award, Target, Wine } from 'lucide-react';
import UserAvatar from './UserAvatar';
import LoadingSpinner from './LoadingSpinner';

const FriendsLeaderboard = ({ selectedCategory = 'level', title = "🏆 Classement Amis" }) => {
    const { db, user, appId } = useContext(FirebaseContext);
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);

    const categories = [
        { id: 'level', name: 'Niveau', icon: Trophy, color: '#fbbf24' },
        { id: 'xp', name: 'Expérience', icon: TrendingUp, color: '#8b5cf6' },
        { id: 'parties', name: 'Soirées', icon: User, color: '#ef4444' },
        { id: 'badges', name: 'Badges', icon: Award, color: '#10b981' },
        { id: 'challenges', name: 'Défis', icon: Target, color: '#f97316' },
        { id: 'drinks', name: 'Verres', icon: Wine, color: '#06b6d4' }
    ];

    useEffect(() => {
        loadLeaderboard();
    }, [selectedCategory, user, appId]);

    const loadLeaderboard = async () => {
        if (!user || !db) return;
        
        try {
            setLoading(true);
            const data = await SocialComparisonService.getFriendsLeaderboard(
                db, appId, user.uid, selectedCategory
            );
            setLeaderboard(data);
        } catch (error) {
            console.error('Erreur chargement leaderboard:', error);
            setLeaderboard([]);
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.icon : Trophy;
    };

    const getCategoryColor = (categoryId) => {
        const category = categories.find(cat => cat.id === categoryId);
        return category ? category.color : '#fbbf24';
    };

    const formatValue = (value, categoryId) => {
        if (categoryId === 'xp') return `${value} XP`;
        if (categoryId === 'level') return `Niv. ${value}`;
        return value.toLocaleString();
    };

    const getRankIcon = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return `#${rank}`;
    };

    const getRankColor = (rank, isCurrentUser) => {
        if (isCurrentUser) return '#10b981';  // Vert pour l'utilisateur actuel
        if (rank === 1) return '#fbbf24';    // Or
        if (rank === 2) return '#9ca3af';    // Argent
        if (rank === 3) return '#cd7c2f';    // Bronze
        return '#6b7280';                    // Gris pour les autres
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '20px',
            marginBottom: '20px'
        }}>
            {/* Titre */}
            <h3 style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '15px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
            }}>
                {React.createElement(getCategoryIcon(selectedCategory), { 
                    size: 20, 
                    color: getCategoryColor(selectedCategory) 
                })}
                {title}
            </h3>

            {/* Liste du classement */}
            {leaderboard.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    color: '#9ca3af',
                    padding: '20px'
                }}>
                    <User size={32} color="#6b7280" style={{ marginBottom: '10px' }} />
                    <p>Aucun ami trouvé</p>
                    <p style={{ fontSize: '12px' }}>Ajoutez des amis pour voir le classement !</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {leaderboard.map((player) => (
                        <div
                            key={player.id}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '12px',
                                background: player.isCurrentUser 
                                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)'
                                    : 'rgba(255, 255, 255, 0.05)',
                                border: player.isCurrentUser 
                                    ? '1px solid rgba(16, 185, 129, 0.3)' 
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {/* Rang */}
                            <div style={{
                                width: '40px',
                                textAlign: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: getRankColor(player.rank, player.isCurrentUser)
                            }}>
                                {getRankIcon(player.rank)}
                            </div>

                            {/* Avatar */}
                            <UserAvatar 
                                user={player} 
                                size={32}
                                showOnlineStatus={false}
                            />

                            {/* Infos utilisateur */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    color: 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    marginBottom: '2px'
                                }}>
                                    {player.username || 'Utilisateur'}
                                    {player.isCurrentUser && (
                                        <span style={{ color: '#10b981', marginLeft: '6px' }}>
                                            (Vous)
                                        </span>
                                    )}
                                </div>
                                <div style={{
                                    color: '#9ca3af',
                                    fontSize: '12px'
                                }}>
                                    {formatValue(player[selectedCategory] || 0, selectedCategory)}
                                </div>
                            </div>

                            {/* Écart avec position supérieure */}
                            {player.gap > 0 && player.rank > 1 && (
                                <div style={{
                                    color: '#f87171',
                                    fontSize: '11px',
                                    textAlign: 'right'
                                }}>
                                    <div>-{formatValue(player.gap, selectedCategory)}</div>
                                </div>
                            )}

                            {/* Progression vers le niveau supérieur */}
                            {selectedCategory === 'level' && player.progressToNextLevel !== undefined && (
                                <div style={{
                                    width: '60px',
                                    height: '4px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${Math.min(player.progressToNextLevel || 0, 100)}%`,
                                        height: '100%',
                                        backgroundColor: getCategoryColor(selectedCategory),
                                        borderRadius: '2px',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Footer avec stats rapides */}
            {leaderboard.length > 0 && (
                <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    color: '#9ca3af'
                }}>
                    <span>👥 {leaderboard.length} participant{leaderboard.length > 1 ? 's' : ''}</span>
                    {leaderboard.find(p => p.isCurrentUser) && (
                        <span>
                            📍 Votre position: {leaderboard.find(p => p.isCurrentUser).rank}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default FriendsLeaderboard;