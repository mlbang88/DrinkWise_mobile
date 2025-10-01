// src/components/TournamentDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Trophy, Users, Clock, Target, Crown, Medal, Star, TrendingUp } from 'lucide-react';
import BattleRoyaleService from '../services/battleRoyaleService';

const TournamentDashboard = ({ tournamentId, onClose }) => {
    const { db, user, appId, userProfile } = useContext(FirebaseContext);
    const [tournament, setTournament] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [timeRemaining, setTimeRemaining] = useState('');
    const [activeTab, setActiveTab] = useState('leaderboard');

    const battleService = new BattleRoyaleService(db, appId);

    useEffect(() => {
        if (!tournamentId) return;

        const tournamentRef = doc(db, `artifacts/${appId}/tournaments`, tournamentId);
        const unsubscribe = onSnapshot(tournamentRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setTournament(data);
                
                // Calculer le classement
                const scores = data.scores || {};
                const sorted = Object.entries(scores)
                    .map(([userId, scoreData]) => ({
                        userId,
                        username: scoreData.username || 'Utilisateur',
                        totalPoints: scoreData.totalPoints || 0,
                        modePoints: scoreData.modePoints || {},
                        lastUpdate: scoreData.lastUpdate
                    }))
                    .sort((a, b) => b.totalPoints - a.totalPoints);
                
                setLeaderboard(sorted);
                
                // Trouver la position de l'utilisateur
                const userPosition = sorted.findIndex(item => item.userId === user.uid);
                setUserRank(userPosition !== -1 ? userPosition + 1 : null);
            }
        });

        return unsubscribe;
    }, [tournamentId, db, appId, user.uid]);

    // Calculer le temps restant
    useEffect(() => {
        if (!tournament?.endTime) return;

        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(tournament.endTime.seconds * 1000);
            const diff = end - now;

            if (diff <= 0) {
                setTimeRemaining('Terminé');
                clearInterval(interval);
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            
            if (hours > 24) {
                const days = Math.floor(hours / 24);
                setTimeRemaining(`${days}j ${hours % 24}h`);
            } else {
                setTimeRemaining(`${hours}h ${minutes}m`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [tournament]);

    const joinTournament = async () => {
        try {
            const tournamentRef = doc(db, `artifacts/${appId}/tournaments`, tournamentId);
            await updateDoc(tournamentRef, {
                participants: arrayUnion(user.uid),
                [`scores.${user.uid}`]: {
                    username: userProfile.username,
                    totalPoints: 0,
                    modePoints: {},
                    joinedAt: new Date()
                }
            });
        } catch (error) {
            console.error('Erreur rejoindre tournoi:', error);
        }
    };

    const LeaderboardView = () => (
        <div style={{ padding: '20px' }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
                🏆 Classement en Temps Réel
            </h3>
            
            {leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                    <Trophy size={48} color="#666" style={{ marginBottom: '15px' }} />
                    <p>Aucun participant pour le moment</p>
                    <p style={{ fontSize: '14px' }}>Sois le premier à marquer des points !</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {leaderboard.map((player, index) => {
                        const isCurrentUser = player.userId === user.uid;
                        const rank = index + 1;
                        
                        let rankIcon = <Medal size={24} color="#CD7F32" />; // Bronze par défaut
                        if (rank === 1) rankIcon = <Crown size={24} color="#FFD700" />;
                        else if (rank === 2) rankIcon = <Medal size={24} color="#C0C0C0" />;
                        else if (rank === 3) rankIcon = <Medal size={24} color="#CD7F32" />;
                        else rankIcon = <div style={{ color: '#666', fontWeight: 'bold', width: '24px', textAlign: 'center' }}>{rank}</div>;

                        return (
                            <div
                                key={player.userId}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '15px',
                                    borderRadius: '12px',
                                    backgroundColor: isCurrentUser ? '#667eea20' : '#1a1a1a',
                                    border: isCurrentUser ? '2px solid #667eea' : '1px solid #333',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ marginRight: '15px' }}>
                                    {rankIcon}
                                </div>
                                
                                <div style={{ flex: 1 }}>
                                    <div style={{ 
                                        color: isCurrentUser ? '#667eea' : '#fff', 
                                        fontWeight: 'bold',
                                        marginBottom: '5px'
                                    }}>
                                        {player.username}
                                        {isCurrentUser && <span style={{ color: '#667eea', marginLeft: '8px' }}>(Toi)</span>}
                                    </div>
                                    
                                    <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                                        {Object.entries(player.modePoints).map(([mode, points]) => (
                                            <span key={mode} style={{ color: '#888' }}>
                                                {mode}: {points}pts
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div style={{ 
                                    color: '#fff', 
                                    fontSize: '20px', 
                                    fontWeight: 'bold'
                                }}>
                                    {player.totalPoints}
                                    <span style={{ fontSize: '12px', color: '#888', marginLeft: '3px' }}>pts</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );

    const StatsView = () => (
        <div style={{ padding: '20px' }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
                📊 Statistiques du Tournoi
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <div style={{
                    backgroundColor: '#1a1a1a',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    textAlign: 'center'
                }}>
                    <Users size={32} color="#667eea" style={{ marginBottom: '10px' }} />
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                        {tournament?.participants?.length || 0}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '14px' }}>Participants</div>
                </div>
                
                <div style={{
                    backgroundColor: '#1a1a1a',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    textAlign: 'center'
                }}>
                    <TrendingUp size={32} color="#10B981" style={{ marginBottom: '10px' }} />
                    <div style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold' }}>
                        {leaderboard.reduce((sum, p) => sum + p.totalPoints, 0)}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '14px' }}>Points Totaux</div>
                </div>
                
                <div style={{
                    backgroundColor: '#1a1a1a',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #333',
                    textAlign: 'center'
                }}>
                    <Clock size={32} color="#F59E0B" style={{ marginBottom: '10px' }} />
                    <div style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>
                        {timeRemaining}
                    </div>
                    <div style={{ color: '#ccc', fontSize: '14px' }}>Time Remaining</div>
                </div>
                
                {userRank && (
                    <div style={{
                        backgroundColor: '#667eea20',
                        padding: '20px',
                        borderRadius: '12px',
                        border: '2px solid #667eea',
                        textAlign: 'center'
                    }}>
                        <Star size={32} color="#667eea" style={{ marginBottom: '10px' }} />
                        <div style={{ color: '#667eea', fontSize: '24px', fontWeight: 'bold' }}>
                            #{userRank}
                        </div>
                        <div style={{ color: '#ccc', fontSize: '14px' }}>Ta Position</div>
                    </div>
                )}
            </div>
        </div>
    );

    if (!tournament) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                <div>Chargement du tournoi...</div>
            </div>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.95)',
            zIndex: 1000,
            overflow: 'auto'
        }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                backgroundColor: '#0f0f0f',
                minHeight: '100vh'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #333',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: '#0f0f0f',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ color: '#fff', margin: 0 }}>{tournament.name}</h2>
                            <p style={{ color: '#ccc', margin: '5px 0 0 0', fontSize: '14px' }}>
                                Par {tournament.creatorName} • {timeRemaining}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'none',
                                border: '1px solid #666',
                                borderRadius: '8px',
                                color: '#ccc',
                                padding: '8px 15px',
                                cursor: 'pointer'
                            }}
                        >
                            Fermer
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #333'
                }}>
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            border: 'none',
                            backgroundColor: activeTab === 'leaderboard' ? '#667eea' : 'transparent',
                            color: activeTab === 'leaderboard' ? '#fff' : '#ccc',
                            cursor: 'pointer'
                        }}
                    >
                        Classement
                    </button>
                    <button
                        onClick={() => setActiveTab('stats')}
                        style={{
                            flex: 1,
                            padding: '15px',
                            border: 'none',
                            backgroundColor: activeTab === 'stats' ? '#667eea' : 'transparent',
                            color: activeTab === 'stats' ? '#fff' : '#ccc',
                            cursor: 'pointer'
                        }}
                    >
                        Statistiques
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'leaderboard' && <LeaderboardView />}
                {activeTab === 'stats' && <StatsView />}

                {/* Join Button */}
                {tournament.participants && !tournament.participants.includes(user.uid) && (
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                        <button
                            onClick={joinTournament}
                            style={{
                                padding: '15px 30px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            🚀 Rejoindre le Tournoi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TournamentDashboard;