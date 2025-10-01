// src/components/BattlePointsNotification.jsx
import React, { useState, useEffect } from 'react';
import { Trophy, Zap, Star, Crown } from 'lucide-react';

const BattlePointsNotification = ({ results, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    
    useEffect(() => {
        // Animation d'entrée
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    if (!results || results.length === 0) return null;

    const totalPoints = results.reduce((sum, result) => sum + result.pointsEarned, 0);
    
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
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
            zIndex: 2000,
            padding: '20px',
            opacity: isVisible ? 1 : 0,
            transition: 'opacity 0.3s ease'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                border: '2px solid #FF6B35',
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center',
                transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
                transition: 'all 0.3s ease'
            }}>
                {/* Animation de célébration */}
                <div style={{ marginBottom: '20px' }}>
                    <Crown size={64} color="#FFD700" style={{ 
                        animation: 'bounce 1s ease-in-out infinite alternate',
                        filter: 'drop-shadow(0 0 20px rgba(255, 215, 0, 0.5))'
                    }} />
                </div>

                <h2 style={{
                    color: '#FF6B35',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '15px'
                }}>
                    🎉 Points Battle Royale !
                </h2>

                <div style={{
                    backgroundColor: 'rgba(255, 107, 53, 0.1)',
                    border: '1px solid #FF6B35',
                    borderRadius: '15px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <div style={{
                        fontSize: '36px',
                        fontWeight: 'bold',
                        color: '#FFD700',
                        marginBottom: '10px'
                    }}>
                        +{totalPoints} points
                    </div>
                    <div style={{ color: '#ccc', fontSize: '14px' }}>
                        Gagnés dans {results.length} tournoi{results.length > 1 ? 's' : ''}
                    </div>
                </div>

                {/* Détail par tournoi */}
                <div style={{ marginBottom: '25px' }}>
                    {results.map((result, index) => (
                        <div key={index} style={{
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            padding: '15px',
                            marginBottom: '10px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                marginBottom: '10px'
                            }}>
                                <div style={{ color: '#fff', fontWeight: 'bold' }}>
                                    🏆 {result.tournamentName}
                                </div>
                                <div style={{ color: '#FF6B35', fontWeight: 'bold' }}>
                                    +{result.pointsEarned} pts
                                </div>
                            </div>
                            
                            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                                Mode: {getModeDisplayName(result.mode)}
                            </div>
                            
                            {/* Breakdown des points */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                {Object.entries(result.breakdown).map(([key, points]) => (
                                    <div key={key} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        fontSize: '11px',
                                        color: '#ccc'
                                    }}>
                                        <span>{formatBreakdownKey(key)}</span>
                                        <span style={{ color: '#10B981' }}>+{points}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bouton fermer */}
                <button
                    onClick={handleClose}
                    style={{
                        padding: '12px 30px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #FF6B35, #FF8A50)',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'transform 0.2s ease'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                >
                    Génial ! 🚀
                </button>
            </div>

            {/* CSS pour l'animation bounce */}
            <style jsx>{`
                @keyframes bounce {
                    0% { transform: translateY(0px); }
                    100% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
};

// Fonctions utilitaires
const getModeDisplayName = (mode) => {
    const modes = {
        'party': '⚡ Party Beast',
        'moderation': '🧠 Modération Master', 
        'explorer': '✨ Explorer Pro',
        'social': '❤️ Social Host',
        'balanced': '🎯 Balanced Player'
    };
    return modes[mode] || mode;
};

const formatBreakdownKey = (key) => {
    const labels = {
        'volumePoints': 'Volume',
        'enduranceBonus': 'Endurance',
        'marathonBonus': 'Marathon',
        'creativeMixes': 'Cocktails créatifs',
        'partyEnergy': 'Énergie',
        'longestStreak': 'Record perso',
        'crowdPleaser': 'Ambiance',
        'varietyAlcoholBonus': 'Diversité',
        'steadyPaceBonus': 'Rythme',
        'epicNightBonus': 'Soirée épique',
        'timeBetweenDrinks': 'Espacement',
        'waterIntake': 'Hydratation',
        'helpingFriends': 'Aide amis',
        'responsiblePlanning': 'Responsabilité',
        'newDrinks': 'Découvertes',
        'newVenues': 'Nouveaux lieux',
        'creativePhotos': 'Photos',
        'detailedReviews': 'Reviews',
        'eventsOrganized': 'Organisation',
        'friendsGathered': 'Rassemblement',
        'moodBoost': 'Ambiance',
        'memoriesShared': 'Souvenirs',
        'balanceRatio': 'Équilibre',
        'varietyScore': 'Variété',
        'consistency': 'Régularité',
        'socialAdaptability': 'Adaptation'
    };
    return labels[key] || key;
};

export default BattlePointsNotification;