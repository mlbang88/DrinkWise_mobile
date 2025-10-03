// src/components/BattleRoyale.jsx
import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { collection, doc, addDoc, onSnapshot, updateDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import useBattleRoyale from '../hooks/useBattleRoyale';
import { Trophy, Users, Target, Sparkles, Crown, Flame, Heart, Brain, Zap, Medal, Award } from 'lucide-react';

const GAME_MODES = {
    MODERATION_MASTER: {
        id: 'moderation',
        name: 'Modération Master',
        icon: Brain,
        color: '#10B981',
        description: 'Gagne des points en montrant ta maîtrise et ta responsabilité',
        metrics: [
            'Temps entre les boissons',
            'Choix de boissons alternatives', 
            'Aide aux amis en difficulté',
            'Planification responsable'
        ],
        scoringRules: {
            timeBetweenDrinks: { min: 30, points: 10 }, // 10 pts si >30min entre boissons
            waterIntake: { points: 5 }, // 5 pts par verre d'eau
            helpingFriends: { points: 15 }, // 15 pts pour aider un ami
            responsiblePlanning: { points: 20 } // 20 pts pour plan de retour
        }
    },
    EXPLORER_PRO: {
        id: 'explorer',
        name: 'Explorer Pro',
        icon: Sparkles,
        color: '#8B5CF6',
        description: 'Découvre, expérimente et partage tes aventures gustatives',
        metrics: [
            'Nouvelles boissons découvertes',
            'Lieux originaux visités',
            'Photos créatives partagées',
            'Reviews détaillées'
        ],
        scoringRules: {
            newDrinks: { points: 25 }, // 25 pts par nouvelle boisson
            newVenues: { points: 20 }, // 20 pts par nouveau lieu
            creativePhotos: { points: 15 }, // 15 pts pour photo originale
            detailedReviews: { points: 10 } // 10 pts pour review >50 mots
        }
    },
    SOCIAL_HOST: {
        id: 'social',
        name: 'Social Host',
        icon: Heart,
        color: '#EF4444',
        description: 'Organise des moments inoubliables et rassemble les gens',
        metrics: [
            'Événements organisés',
            'Amis rassemblés',
            'Ambiance créée',
            'Souvenirs partagés'
        ],
        scoringRules: {
            eventsOrganized: { points: 50 }, // 50 pts par événement créé
            friendsGathered: { points: 5 }, // 5 pts par ami présent
            moodBoost: { points: 10 }, // 10 pts pour ambiance positive
            memoriesShared: { points: 15 } // 15 pts pour souvenirs partagés
        }
    },
    BALANCED_PLAYER: {
        id: 'balanced',
        name: 'Balanced Player',
        icon: Target,
        color: '#F59E0B',
        description: 'Équilibre parfait entre plaisir, responsabilité et découverte',
        metrics: [
            'Équilibre consommation/pauses',
            'Variété des expériences',
            'Consistance dans le temps',
            'Adaptabilité sociale'
        ],
        scoringRules: {
            balanceRatio: { points: 15 }, // 15 pts pour bon équilibre
            varietyScore: { points: 12 }, // 12 pts pour diversité
            consistency: { points: 18 }, // 18 pts pour régularité
            socialAdaptability: { points: 10 } // 10 pts pour adaptation sociale
        }
    },
    PARTY_BEAST: {
        id: 'party',
        name: 'Party Beast',
        icon: Zap,
        color: '#FF6B35',
        description: 'Maximise ton fun, ta créativité et ton endurance de soirée !',
        metrics: [
            'Volume de consommation',
            'Endurance et longévité',
            'Créativité des mélanges',
            'Énergie communicative'
        ],
        scoringRules: {
            volumePoints: { points: 8 }, // 8 pts par boisson
            enduranceBonus: { points: 25 }, // 25 pts si soirée >4h
            creativeMixes: { points: 20 }, // 20 pts pour cocktails originaux
            partyEnergy: { points: 15 }, // 15 pts pour ambiance électrique
            longestStreak: { points: 30 }, // 30 pts pour record personnel
            crowdPleaser: { points: 12 } // 12 pts pour faire danser les autres
        }
    }
};

// Fonction utilitaire pour calculer le temps restant
const getTimeRemaining = (endTime) => {
    if (!endTime) return 'Temps indéterminé';
    
    const now = new Date();
    const end = new Date(endTime.seconds ? endTime.seconds * 1000 : endTime);
    const diff = end - now;
    
    if (diff <= 0) return 'Terminé';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}j ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    return 'Moins d\'1h';
};

const BattleRoyale = () => {
    const { db, user, appId, userProfile, setMessageBox } = useContext(FirebaseContext);
    const [activeMode, setActiveMode] = useState(null);
    const [currentTournament, setCurrentTournament] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [showCreateTournament, setShowCreateTournament] = useState(false);
    const [userStats, setUserStats] = useState({});
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'mine', 'create', 'leaderboard'
    const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
    
    // Utiliser le hook Battle Royale
    const { activeTournaments, userTournaments, joinTournament } = useBattleRoyale();

    // Charger le classement global quand on ouvre l'onglet
    useEffect(() => {
        if (activeTab === 'leaderboard' && leaderboard.length === 0) {
            loadGlobalLeaderboard();
        }
    }, [activeTab]);

    const loadGlobalLeaderboard = async () => {
        if (!db || !appId) return;
        
        setLoadingLeaderboard(true);
        try {
            const publicStatsRef = collection(db, `artifacts/${appId}/public_user_stats`);
            const leaderboardQuery = query(
                publicStatsRef,
                orderBy('tournamentStats.totalPoints', 'desc'),
                limit(50)
            );
            
            const snapshot = await getDocs(leaderboardQuery);
            const topPlayers = snapshot.docs.map((doc, index) => ({
                userId: doc.id,
                rank: index + 1,
                ...doc.data()
            }));
            
            setLeaderboard(topPlayers);
        } catch (error) {
            console.error('Erreur chargement leaderboard:', error);
            setMessageBox({ 
                message: 'Erreur lors du chargement du classement', 
                type: 'error' 
            });
        } finally {
            setLoadingLeaderboard(false);
        }
    };

    // Interface de création de tournoi
    const CreateTournamentModal = () => {
        const [tournamentName, setTournamentName] = useState('');
        const [selectedModes, setSelectedModes] = useState([]);
        const [duration, setDuration] = useState('24h');
        const [isPrivate, setIsPrivate] = useState(false);
        const [maxParticipants, setMaxParticipants] = useState(20);

        const createTournament = async () => {
            if (!tournamentName || selectedModes.length === 0) return;

            try {
                const tournament = {
                    name: tournamentName,
                    createdBy: user.uid,
                    creatorName: userProfile.username,
                    modes: selectedModes,
                    duration: duration,
                    isPrivate: isPrivate,
                    maxParticipants: maxParticipants,
                    participants: [user.uid],
                    startTime: new Date(),
                    endTime: new Date(Date.now() + (duration === '24h' ? 24 * 60 * 60 * 1000 : 
                                                  duration === '3d' ? 3 * 24 * 60 * 60 * 1000 :
                                                  7 * 24 * 60 * 60 * 1000)),
                    status: 'active',
                    scores: {}
                };

                await addDoc(collection(db, `artifacts/${appId}/tournaments`), tournament);
                setMessageBox({ message: '🏆 Tournoi créé avec succès !', type: 'success' });
                setShowCreateTournament(false);
            } catch (error) {
                console.error('Erreur création tournoi:', error);
                setMessageBox({ message: 'Erreur lors de la création', type: 'error' });
            }
        };

        return (
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                    borderRadius: '20px',
                    padding: '30px',
                    maxWidth: '500px',
                    width: '100%',
                    border: '1px solid #333'
                }}>
                    <h2 style={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
                        🏆 Créer un Tournoi
                    </h2>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>
                            Nom du tournoi
                        </label>
                        <input
                            type="text"
                            value={tournamentName}
                            onChange={(e) => setTournamentName(e.target.value)}
                            placeholder="Battle des Champions"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid #555',
                                backgroundColor: '#333',
                                color: '#fff'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>
                            Modes de jeu autorisés
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {Object.values(GAME_MODES).map(mode => {
                                const Icon = mode.icon;
                                const isSelected = selectedModes.includes(mode.id);
                                return (
                                    <div
                                        key={mode.id}
                                        onClick={() => {
                                            if (isSelected) {
                                                setSelectedModes(prev => prev.filter(m => m !== mode.id));
                                            } else {
                                                setSelectedModes(prev => [...prev, mode.id]);
                                            }
                                        }}
                                        style={{
                                            padding: '15px',
                                            borderRadius: '12px',
                                            border: `2px solid ${isSelected ? mode.color : '#555'}`,
                                            backgroundColor: isSelected ? `${mode.color}20` : '#333',
                                            cursor: 'pointer',
                                            textAlign: 'center',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <Icon size={24} color={mode.color} style={{ marginBottom: '8px' }} />
                                        <div style={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}>
                                            {mode.name}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>
                                Durée
                            </label>
                            <select
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid #555',
                                    backgroundColor: '#333',
                                    color: '#fff'
                                }}
                            >
                                <option value="24h">24 heures</option>
                                <option value="3d">3 jours</option>
                                <option value="7d">1 semaine</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ color: '#ccc', display: 'block', marginBottom: '8px' }}>
                                Participants max
                            </label>
                            <input
                                type="number"
                                value={maxParticipants}
                                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                                min="2"
                                max="100"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid #555',
                                    backgroundColor: '#333',
                                    color: '#fff'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '25px' }}>
                        <label style={{ color: '#ccc', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                style={{ marginRight: '10px' }}
                            />
                            Tournoi privé (sur invitation uniquement)
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setShowCreateTournament(false)}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid #555',
                                backgroundColor: '#333',
                                color: '#ccc',
                                cursor: 'pointer'
                            }}
                        >
                            Annuler
                        </button>
                        <button
                            onClick={createTournament}
                            style={{
                                flex: 1,
                                padding: '12px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Créer le Tournoi
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Composant de sélection de mode
    const ModeSelector = () => (
        <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: '#fff', marginBottom: '20px', textAlign: 'center' }}>
                🎯 Choisis ton style de jeu
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                {Object.values(GAME_MODES).map(mode => {
                    const Icon = mode.icon;
                    const isActive = activeMode === mode.id;
                    
                    return (
                        <div
                            key={mode.id}
                            onClick={() => setActiveMode(mode.id)}
                            style={{
                                padding: '20px',
                                borderRadius: '15px',
                                border: `2px solid ${isActive ? mode.color : '#333'}`,
                                backgroundColor: isActive ? `${mode.color}15` : '#1a1a1a',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                transform: isActive ? 'scale(1.02)' : 'scale(1)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                <Icon size={28} color={mode.color} style={{ marginRight: '12px' }} />
                                <h4 style={{ color: '#fff', margin: 0 }}>{mode.name}</h4>
                            </div>
                            <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '15px' }}>
                                {mode.description}
                            </p>
                            <div style={{ fontSize: '12px', color: '#888' }}>
                                <strong style={{ color: mode.color }}>Métriques clés:</strong>
                                <ul style={{ margin: '5px 0', paddingLeft: '15px' }}>
                                    {mode.metrics.map((metric, index) => (
                                        <li key={index}>{metric}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%)',
            padding: '20px'
        }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ 
                        color: '#fff', 
                        fontSize: '2.5rem', 
                        marginBottom: '10px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        ⚔️ Battle Royale
                    </h1>
                    <p style={{ color: '#ccc', fontSize: '1.1rem' }}>
                        Choisis ton style, rejoins la compétition, montre qui tu es vraiment !
                    </p>
                </div>

                {/* Système d'onglets */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    gap: '10px', 
                    marginBottom: '30px',
                    flexWrap: 'wrap',
                    padding: '0 10px'
                }}>
                    {[
                        { id: 'active', label: 'Tournois Actifs', icon: '🏆' },
                        { id: 'mine', label: 'Mes Tournois', icon: '👤' },
                        { id: 'create', label: 'Créer', icon: '➕' },
                        { id: 'leaderboard', label: 'Classement', icon: '📊' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '12px 20px',
                                borderRadius: '12px',
                                border: activeTab === tab.id ? '2px solid #667eea' : '1px solid #333',
                                backgroundColor: activeTab === tab.id 
                                    ? 'rgba(102, 126, 234, 0.2)' 
                                    : '#1a1a1a',
                                color: activeTab === tab.id ? '#667eea' : '#ccc',
                                fontSize: '14px',
                                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Contenu selon l'onglet actif */}
                {activeTab === 'active' && (
                    <>
                        {/* Tournois disponibles */}
                        {activeTournaments.length > 0 ? (
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ 
                                    color: '#fff', 
                                    textAlign: 'center', 
                                    marginBottom: '25px',
                                    fontSize: '20px'
                                }}>
                                    🏆 Tournois Disponibles
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                    {activeTournaments.map(tournament => {
                                        const isParticipating = tournament.participants?.includes(user.uid);
                                        const isCreator = tournament.createdBy === user.uid;
                                        const participants = tournament.participants?.length || 0;
                                        
                                        return (
                                            <div
                                                key={tournament.id}
                                                style={{
                                                    background: isParticipating 
                                                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))'
                                                        : 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
                                                    border: isParticipating ? '2px solid #667eea' : '1px solid #333',
                                                    borderRadius: '15px',
                                                    padding: '20px',
                                                    position: 'relative'
                                                }}
                                            >
                                                {isCreator && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        right: '10px',
                                                        backgroundColor: '#FFD700',
                                                        color: '#000',
                                                        padding: '4px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        ORGANISATEUR
                                                    </div>
                                                )}
                                                
                                                <h4 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '18px' }}>
                                                    {tournament.name}
                                                </h4>
                                                
                                                <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '15px' }}>
                                                    <div>👤 {participants}/{tournament.maxParticipants} participants</div>
                                                    <div>⏰ {getTimeRemaining(tournament.endTime)}</div>
                                                    <div>🎮 {tournament.modes?.length || 0} mode{(tournament.modes?.length || 0) > 1 ? 's' : ''}</div>
                                                </div>
                                                
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                                                    {tournament.modes?.map(mode => {
                                                        const modeData = Object.values(GAME_MODES).find(m => m.id === mode);
                                                        if (!modeData) return null;
                                                        const Icon = modeData.icon;
                                                        return (
                                                            <div key={mode} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '4px 8px',
                                                                backgroundColor: `${modeData.color}20`,
                                                                border: `1px solid ${modeData.color}`,
                                                                borderRadius: '8px',
                                                                fontSize: '10px',
                                                                color: modeData.color
                                                            }}>
                                                                <Icon size={12} />
                                                                {modeData.name}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                {!isParticipating && !isCreator && participants < tournament.maxParticipants && (
                                                    <button
                                                        onClick={() => joinTournament(tournament.id)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '10px',
                                                            borderRadius: '8px',
                                                            border: 'none',
                                                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                                            color: '#fff',
                                                            fontSize: '14px',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        🚀 Rejoindre
                                                    </button>
                                                )}
                                                
                                                {isParticipating && (
                                                    <div style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                                        border: '1px solid #10B981',
                                                        color: '#10B981',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        textAlign: 'center'
                                                    }}>
                                                        ✅ Inscrit
                                                    </div>
                                                )}
                                                
                                                {participants >= tournament.maxParticipants && !isParticipating && (
                                                    <div style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        borderRadius: '8px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                                                        border: '1px solid #EF4444',
                                                        color: '#EF4444',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        textAlign: 'center'
                                                    }}>
                                                        🚫 Complet
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                border: '2px dashed #667eea',
                                borderRadius: '15px',
                                padding: '40px 20px',
                                textAlign: 'center',
                                marginBottom: '40px'
                            }}>
                                <Trophy size={48} color="#667eea" style={{ marginBottom: '15px' }} />
                                <h3 style={{ color: '#667eea', margin: '0 0 15px 0' }}>
                                    Aucun tournoi disponible
                                </h3>
                                <p style={{ color: '#ccc', marginBottom: '20px' }}>
                                    Sois le premier à créer un tournoi Battle Royale !<br />
                                    Défie tes amis et montre ton style de soirée 🚀
                                </p>
                                <button
                                    onClick={() => setActiveTab('create')}
                                    style={{
                                        padding: '12px 25px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🏆 Créer le Premier Tournoi
                                </button>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'mine' && (
                    <>
                        {/* Mes tournois */}
                        {userTournaments.length > 0 ? (
                            <div style={{ marginBottom: '40px' }}>
                                <h3 style={{ 
                                    color: '#fff', 
                                    textAlign: 'center', 
                                    marginBottom: '25px',
                                    fontSize: '20px'
                                }}>
                                    👤 Mes Tournois ({userTournaments.length})
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                    {userTournaments.map(tournament => {
                                        const isCreator = tournament.createdBy === user.uid;
                                        const participants = tournament.participants?.length || 0;
                                        const myScore = tournament.scores?.[user.uid] || 0;
                                        
                                        return (
                                            <div
                                                key={tournament.id}
                                                style={{
                                                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2))',
                                                    border: '2px solid #667eea',
                                                    borderRadius: '15px',
                                                    padding: '20px',
                                                    position: 'relative'
                                                }}
                                            >
                                                {isCreator && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        right: '10px',
                                                        backgroundColor: '#FFD700',
                                                        color: '#000',
                                                        padding: '4px 8px',
                                                        borderRadius: '12px',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        ORGANISATEUR
                                                    </div>
                                                )}
                                                
                                                <h4 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '18px' }}>
                                                    {tournament.name}
                                                </h4>
                                                
                                                <div style={{ 
                                                    color: '#fff', 
                                                    fontSize: '24px', 
                                                    fontWeight: 'bold',
                                                    marginBottom: '10px',
                                                    textAlign: 'center',
                                                    padding: '10px',
                                                    backgroundColor: 'rgba(102, 126, 234, 0.3)',
                                                    borderRadius: '10px'
                                                }}>
                                                    🏆 {myScore} points
                                                </div>
                                                
                                                <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '15px' }}>
                                                    <div>👤 {participants}/{tournament.maxParticipants} participants</div>
                                                    <div>⏰ {getTimeRemaining(tournament.endTime)}</div>
                                                    <div>🎮 {tournament.modes?.length || 0} mode{(tournament.modes?.length || 0) > 1 ? 's' : ''}</div>
                                                </div>
                                                
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {tournament.modes?.map(mode => {
                                                        const modeData = Object.values(GAME_MODES).find(m => m.id === mode);
                                                        if (!modeData) return null;
                                                        const Icon = modeData.icon;
                                                        return (
                                                            <div key={mode} style={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                padding: '4px 8px',
                                                                backgroundColor: `${modeData.color}20`,
                                                                border: `1px solid ${modeData.color}`,
                                                                borderRadius: '8px',
                                                                fontSize: '10px',
                                                                color: modeData.color
                                                            }}>
                                                                <Icon size={12} />
                                                                {modeData.name}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                border: '2px dashed #667eea',
                                borderRadius: '15px',
                                padding: '40px 20px',
                                textAlign: 'center'
                            }}>
                                <Trophy size={48} color="#667eea" style={{ marginBottom: '15px' }} />
                                <h3 style={{ color: '#667eea', margin: '0 0 15px 0' }}>
                                    Aucun tournoi rejoint
                                </h3>
                                <p style={{ color: '#ccc', marginBottom: '20px' }}>
                                    Rejoins un tournoi actif pour commencer à accumuler des points !
                                </p>
                                <button
                                    onClick={() => setActiveTab('active')}
                                    style={{
                                        padding: '12px 25px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                        color: '#fff',
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer'
                                    }}
                                >
                                    🏆 Voir les Tournois
                                </button>
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'create' && (
                    <>
                        {/* Sélection de mode */}
                        <ModeSelector />
                        
                        {/* Bouton de création */}
                        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                            <button
                                onClick={() => setShowCreateTournament(true)}
                                style={{
                                    padding: '15px 30px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: '#fff',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <Crown size={20} />
                                Créer un Tournoi
                            </button>
                        </div>
                    </>
                )}

                {activeTab === 'leaderboard' && (
                    <div>
                        <h3 style={{ 
                            color: '#fff', 
                            textAlign: 'center', 
                            marginBottom: '25px',
                            fontSize: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}>
                            <Trophy size={24} color="#FFD700" />
                            Classement Global
                        </h3>

                        {loadingLeaderboard ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#ccc'
                            }}>
                                ⏳ Chargement du classement...
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div style={{
                                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                border: '2px dashed #667eea',
                                borderRadius: '15px',
                                padding: '40px 20px',
                                textAlign: 'center'
                            }}>
                                <Trophy size={48} color="#667eea" style={{ marginBottom: '15px' }} />
                                <h4 style={{ color: '#667eea', margin: '0 0 10px 0' }}>
                                    Aucun classement disponible
                                </h4>
                                <p style={{ color: '#ccc', fontSize: '14px' }}>
                                    Sois le premier à participer aux tournois !
                                </p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {leaderboard.map((player, index) => {
                                    const isCurrentUser = player.userId === user.uid;
                                    const tournamentStats = player.tournamentStats || {};
                                    const totalPoints = tournamentStats.totalPoints || 0;
                                    const winRate = tournamentStats.winRate || 0;
                                    const favoriteMode = tournamentStats.favoriteMode || 'balanced';

                                    // Configuration des couleurs par mode
                                    const modeConfig = {
                                        moderation: { color: '#10B981', icon: Brain },
                                        explorer: { color: '#8B5CF6', icon: Sparkles },
                                        social: { color: '#EF4444', icon: Heart },
                                        balanced: { color: '#F59E0B', icon: Target },
                                        party: { color: '#FF6B35', icon: Flame }
                                    };

                                    const config = modeConfig[favoriteMode] || modeConfig.balanced;
                                    const ModeIcon = config.icon;

                                    // Style spécial pour le podium
                                    let podiumStyle = {};
                                    let rankIcon = null;
                                    
                                    if (index === 0) {
                                        podiumStyle = {
                                            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 215, 0, 0.1))',
                                            border: '2px solid #FFD700',
                                            boxShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                                        };
                                        rankIcon = <Crown size={24} color="#FFD700" />;
                                    } else if (index === 1) {
                                        podiumStyle = {
                                            background: 'linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(192, 192, 192, 0.1))',
                                            border: '2px solid #C0C0C0'
                                        };
                                        rankIcon = <Medal size={24} color="#C0C0C0" />;
                                    } else if (index === 2) {
                                        podiumStyle = {
                                            background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(205, 127, 50, 0.1))',
                                            border: '2px solid #CD7F32'
                                        };
                                        rankIcon = <Medal size={24} color="#CD7F32" />;
                                    } else {
                                        podiumStyle = {
                                            background: isCurrentUser 
                                                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.1))'
                                                : 'linear-gradient(135deg, #1a1a1a, #2d2d2d)',
                                            border: isCurrentUser ? '2px solid #667eea' : '1px solid #333'
                                        };
                                    }

                                    return (
                                        <div
                                            key={player.userId}
                                            style={{
                                                ...podiumStyle,
                                                borderRadius: '15px',
                                                padding: '20px',
                                                position: 'relative',
                                                transition: 'transform 0.2s ease',
                                                cursor: 'pointer'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        >
                                            {/* Rang */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '15px',
                                                left: '15px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                {rankIcon || (
                                                    <div style={{
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '50%',
                                                        background: 'rgba(255, 255, 255, 0.1)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '14px',
                                                        fontWeight: 'bold',
                                                        color: '#fff'
                                                    }}>
                                                        {index + 1}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Badge "C'est toi !" */}
                                            {isCurrentUser && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '15px',
                                                    right: '15px',
                                                    backgroundColor: '#667eea',
                                                    color: '#fff',
                                                    padding: '4px 12px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    C'EST TOI !
                                                </div>
                                            )}

                                            {/* Username */}
                                            <div style={{
                                                marginLeft: '45px',
                                                marginBottom: '15px'
                                            }}>
                                                <h4 style={{
                                                    color: '#fff',
                                                    margin: '0 0 5px 0',
                                                    fontSize: '18px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {player.username || 'Utilisateur'}
                                                </h4>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    color: config.color,
                                                    fontSize: '12px'
                                                }}>
                                                    <ModeIcon size={14} />
                                                    <span>{favoriteMode.charAt(0).toUpperCase() + favoriteMode.slice(1)}</span>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr 1fr',
                                                gap: '15px',
                                                marginTop: '10px'
                                            }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        color: '#FFD700',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {totalPoints}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#888'
                                                    }}>
                                                        Points
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        color: '#10B981',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {tournamentStats.tournamentsWon || 0}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#888'
                                                    }}>
                                                        Victoires
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        color: '#8B5CF6',
                                                        marginBottom: '4px'
                                                    }}>
                                                        {winRate}%
                                                    </div>
                                                    <div style={{
                                                        fontSize: '11px',
                                                        color: '#888'
                                                    }}>
                                                        Win Rate
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Sélection de mode - maintenant conditionnel pour l'ancien layout */}
                {/* <ModeSelector /> */}

                {/* Actions principales - supprimé car intégré dans les onglets */}
                {/* <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '40px' }}>
                    <button
                        onClick={() => setShowCreateTournament(true)}
                        style={{
                            padding: '15px 30px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
                        <Crown size={20} />
                        Créer un Tournoi
                    </button>
                    
                    <div style={{
                        padding: '15px 20px',
                        borderRadius: '12px',
                        border: '2px solid #667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.1)',
                        color: '#667eea',
                        fontSize: '14px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                            📊 Tes Tournois Actifs
                        </div>
                        <div style={{ fontSize: '12px', color: '#ccc' }}>
                            {userTournaments.length} tournoi{userTournaments.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div> */}

            </div>

            {/* Modal de création de tournoi */}
            {showCreateTournament && <CreateTournamentModal />}
        </div>
    );
};

export default BattleRoyale;