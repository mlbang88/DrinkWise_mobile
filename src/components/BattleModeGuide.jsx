// src/components/BattleModeGuide.jsx
import React from 'react';
import { Zap, Brain, Sparkles, Heart, Target } from 'lucide-react';

const BattleModeGuide = ({ mode, onClose }) => {
    const modes = {
        party: {
            icon: Zap,
            name: 'Party Beast',
            color: '#FF6B35',
            description: 'Le mode ultime pour maximiser ton fun de soirée !',
            tips: [
                '🍻 Plus tu bois, plus tu marques de points',
                '⏰ Les soirées longues (4h+) donnent des bonus massifs',
                '🍸 Créer des mélanges originaux = gros points',
                '🕺 Faire danser tes amis = bonus multiplicateur',
                '🏆 Établir un record personnel = jackpot',
                '🎪 Ambiance électrique + photos = combo parfait'
            ],
            warnings: [
                '⚠️ Reste toujours conscient de tes limites',
                '🚗 Plan de retour sécurisé obligatoire',
                '👥 Entoure-toi d\'amis de confiance',
                '💧 Hydrate-toi régulièrement'
            ],
            scoring: {
                'Volume': '8 pts par boisson',
                'Endurance 4h+': '+25 pts',
                'Endurance 8h+': '+40 pts bonus',
                'Cocktails créatifs': '20 pts chacun',
                'Ambiance électrique': '+15 pts',
                'Record personnel': '+30 pts',
                'Faire danser les autres': '+12 pts',
                'Diversité alcools (3+)': '+25 pts',
                'Rythme soutenu': '+20 pts',
                'Soirée épique (combo)': '+50 pts'
            }
        },
        moderation: {
            icon: Brain,
            name: 'Modération Master',
            color: '#10B981',
            description: 'Maîtrise, responsabilité et aide aux amis',
            tips: [
                '⏱️ Espace tes boissons (30min+) pour des points',
                '💧 Alterne avec de l\'eau pour marquer',
                '🤝 Aide tes amis = gros bonus',
                '🚗 Plan de retour responsable = points garantis'
            ]
        },
        explorer: {
            icon: Sparkles,
            name: 'Explorer Pro', 
            color: '#8B5CF6',
            description: 'Découverte, créativité et aventures gustatives',
            tips: [
                '🆕 Teste de nouvelles boissons',
                '📍 Visite de nouveaux lieux',
                '📸 Photos créatives et originales',
                '📝 Reviews détaillées'
            ]
        },
        social: {
            icon: Heart,
            name: 'Social Host',
            color: '#EF4444', 
            description: 'Organisation, animation et moments inoubliables',
            tips: [
                '🎉 Organise des événements',
                '👥 Rassemble tes amis',
                '🎵 Crée une ambiance de folie',
                '📷 Capture et partage les souvenirs'
            ]
        },
        balanced: {
            icon: Target,
            name: 'Balanced Player',
            color: '#F59E0B',
            description: 'L\'équilibre parfait entre tous les aspects',
            tips: [
                '⚖️ Équilibre consommation et pauses',
                '🌈 Varie tes expériences',
                '📈 Reste constant dans le temps',
                '🎭 Adapte-toi au contexte social'
            ]
        }
    };

    const currentMode = modes[mode];
    if (!currentMode) return null;

    const Icon = currentMode.icon;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
        }}>
            <div style={{
                background: `linear-gradient(135deg, ${currentMode.color}15, #1a1a1a)`,
                border: `2px solid ${currentMode.color}`,
                borderRadius: '20px',
                padding: '30px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    <Icon size={48} color={currentMode.color} style={{ marginBottom: '15px' }} />
                    <h2 style={{ 
                        color: currentMode.color, 
                        margin: 0, 
                        fontSize: '24px',
                        fontWeight: 'bold'
                    }}>
                        Mode {currentMode.name}
                    </h2>
                    <p style={{ color: '#ccc', margin: '10px 0 0 0', fontSize: '16px' }}>
                        {currentMode.description}
                    </p>
                </div>

                {/* Tips */}
                <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '15px' }}>
                        💡 Conseils pour maximiser tes points:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {currentMode.tips.map((tip, index) => (
                            <div key={index} style={{
                                color: '#ccc',
                                fontSize: '14px',
                                padding: '8px 12px',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${currentMode.color}`
                            }}>
                                {tip}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scoring détaillé pour Party Beast */}
                {mode === 'party' && (
                    <>
                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#FF6B35', fontSize: '18px', marginBottom: '15px' }}>
                                🏆 Système de points détaillé:
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                {Object.entries(currentMode.scoring).map(([action, points]) => (
                                    <div key={action} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        padding: '8px 12px',
                                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                                        borderRadius: '8px',
                                        fontSize: '13px'
                                    }}>
                                        <span style={{ color: '#ccc' }}>{action}</span>
                                        <span style={{ color: '#FF6B35', fontWeight: 'bold' }}>{points}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#FFA500', fontSize: '18px', marginBottom: '15px' }}>
                                ⚠️ Reste responsable:
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {currentMode.warnings.map((warning, index) => (
                                    <div key={index} style={{
                                        color: '#FFA500',
                                        fontSize: '14px',
                                        padding: '8px 12px',
                                        backgroundColor: 'rgba(255, 165, 0, 0.1)',
                                        borderRadius: '8px',
                                        borderLeft: '3px solid #FFA500'
                                    }}>
                                        {warning}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Fermer */}
                <div style={{ textAlign: 'center', marginTop: '30px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '12px 30px',
                            borderRadius: '12px',
                            border: 'none',
                            background: `linear-gradient(135deg, ${currentMode.color}, ${currentMode.color}cc)`,
                            color: '#fff',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        Compris ! 🚀
                    </button>
                </div>

                {/* Bouton fermer en haut */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        color: '#666',
                        fontSize: '24px',
                        cursor: 'pointer'
                    }}
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default BattleModeGuide;