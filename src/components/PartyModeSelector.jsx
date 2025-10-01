import React, { useState, useContext, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { Trophy, Edit3, Clock, Zap, X } from 'lucide-react';
import BasicPartyModal from './BasicPartyModal';
import CompetitivePartyModal from './CompetitivePartyModal';
import useBattleRoyale from '../hooks/useBattleRoyale.js';

const PartyModeSelector = ({ onClose, onPartySaved }) => {
    const { db, user, appId } = useContext(FirebaseContext);
    const { userTournaments } = useBattleRoyale();
    const [selectedMode, setSelectedMode] = useState(null);
    const [draftData, setDraftData] = useState(null);
    const [hasDraft, setHasDraft] = useState(false);

    // Vérifier s'il y a un brouillon sauvegardé
    useEffect(() => {
        const checkForDraft = async () => {
            if (!user || !db) return;
            
            try {
                const draftRef = doc(db, `artifacts/${appId}/users/${user.uid}/draft`, 'party');
                const draftDoc = await getDoc(draftRef);
                
                if (draftDoc.exists()) {
                    const data = draftDoc.data();
                    // Vérifier si le brouillon est récent (moins de 24h)
                    const lastSaved = data.lastSaved?.toDate();
                    const now = new Date();
                    const hoursDiff = (now - lastSaved) / (1000 * 60 * 60);
                    
                    if (hoursDiff < 24) {
                        setDraftData(data);
                        setHasDraft(true);
                    }
                }
            } catch (error) {
                console.error("Erreur vérification brouillon:", error);
            }
        };
        
        checkForDraft();
    }, [user, db, appId]);

    // Si un mode est sélectionné, afficher le modal correspondant
    if (selectedMode === 'basic') {
        return (
            <BasicPartyModal 
                onClose={() => setSelectedMode(null)}
                onPartySaved={onPartySaved}
            />
        );
    }
    
    if (selectedMode === 'competitive') {
        return (
            <CompetitivePartyModal 
                onClose={() => setSelectedMode(null)}
                onPartySaved={onPartySaved}
                draftData={selectedMode === 'draft' ? draftData : null}
            />
        );
    }
    
    if (selectedMode === 'draft') {
        return (
            <CompetitivePartyModal 
                onClose={() => setSelectedMode(null)}
                onPartySaved={onPartySaved}
                draftData={draftData}
            />
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            paddingTop: '60px',
            overflowY: 'auto'
        }}>
            <div style={{
                backgroundColor: '#1a202c',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '480px',
                width: '100%',
                minHeight: '85vh',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '32px'
                }}>
                    <h2 style={{
                        background: 'linear-gradient(135deg, #8b45ff, #3b82f6)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '28px',
                        fontWeight: '800',
                        margin: 0
                    }}>
                        🎉 Nouvelle Soirée
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            padding: '10px',
                            cursor: 'pointer',
                            color: 'white'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Reprise de brouillon */}
                {hasDraft && (
                    <div
                        onClick={() => setSelectedMode('draft')}
                        style={{
                            padding: '20px',
                            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))',
                            border: '2px solid rgba(34, 197, 94, 0.4)',
                            borderRadius: '16px',
                            marginBottom: '24px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 25px rgba(34, 197, 94, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px'
                        }}>
                            <Clock size={24} style={{ color: '#22c55e' }} />
                            <span style={{
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: '700'
                            }}>
                                📝 Reprendre la soirée en cours
                            </span>
                        </div>
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '14px',
                            margin: 0,
                            marginLeft: '36px'
                        }}>
                            Tu as une soirée en cours de saisie. Continue où tu en étais !
                            {draftData?.isOngoing && (
                                <span style={{ color: '#22c55e', fontWeight: '600', marginLeft: '8px' }}>
                                    🟢 En direct
                                </span>
                            )}
                        </p>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Mode Simple */}
                    <div
                        onClick={() => setSelectedMode('basic')}
                        style={{
                            padding: '24px',
                            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(79, 70, 229, 0.1))',
                            border: '2px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '12px'
                        }}>
                            <Edit3 size={28} style={{ color: '#6366f1' }} />
                            <span style={{
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: '700'
                            }}>
                                📝 Mode Simple
                            </span>
                        </div>
                        
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '15px',
                            margin: 0,
                            marginLeft: '40px',
                            lineHeight: '1.5'
                        }}>
                            Enregistrement rapide et basique. Parfait pour juste noter ta soirée sans fioritures.
                        </p>
                        
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginTop: '16px',
                            marginLeft: '40px'
                        }}>
                            <span style={{
                                padding: '4px 8px',
                                background: 'rgba(99, 102, 241, 0.3)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#c7d2fe'
                            }}>
                                ✅ Simple et rapide
                            </span>
                            <span style={{
                                padding: '4px 8px',
                                background: 'rgba(99, 102, 241, 0.3)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#c7d2fe'
                            }}>
                                📸 Photos
                            </span>
                        </div>
                    </div>

                    {/* Mode Compétitif */}
                    <div
                        onClick={() => setSelectedMode('competitive')}
                        style={{
                            padding: '24px',
                            background: 'linear-gradient(135deg, rgba(139, 69, 255, 0.2), rgba(255, 107, 53, 0.1))',
                            border: '2px solid rgba(139, 69, 255, 0.4)',
                            borderRadius: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 8px 25px rgba(139, 69, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = 'none';
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '12px'
                        }}>
                            <Trophy size={28} style={{ color: '#8b45ff' }} />
                            <span style={{
                                color: 'white',
                                fontSize: '20px',
                                fontWeight: '700'
                            }}>
                                🏆 Mode Compétitif
                            </span>
                            {userTournaments.length > 0 && (
                                <span style={{
                                    padding: '4px 8px',
                                    background: 'rgba(255, 107, 53, 0.3)',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    color: '#FF6B35',
                                    fontWeight: '600'
                                }}>
                                    {userTournaments.length} tournoi{userTournaments.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '15px',
                            margin: 0,
                            marginLeft: '40px',
                            lineHeight: '1.5'
                        }}>
                            Suivi temps réel, Battle Royale, brouillons et gamification complète. 
                            {userTournaments.length > 0 ? ' Tes points seront calculés automatiquement !' : ''}
                        </p>
                        
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginTop: '16px',
                            marginLeft: '40px'
                        }}>
                            <span style={{
                                padding: '4px 8px',
                                background: 'rgba(139, 69, 255, 0.3)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#c4b5fd'
                            }}>
                                ⏱️ Temps réel
                            </span>
                            <span style={{
                                padding: '4px 8px',
                                background: 'rgba(139, 69, 255, 0.3)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#c4b5fd'
                            }}>
                                💾 Brouillons
                            </span>
                            <span style={{
                                padding: '4px 8px',
                                background: 'rgba(139, 69, 255, 0.3)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#c4b5fd'
                            }}>
                                🏆 Battle Royale
                            </span>
                            <span style={{
                                padding: '4px 8px',
                                background: 'rgba(139, 69, 255, 0.3)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: '#c4b5fd'
                            }}>
                                🎯 Quiz & Badges
                            </span>
                        </div>
                    </div>
                </div>

                {/* Conseil */}
                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    textAlign: 'center'
                }}>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '13px',
                        margin: 0,
                        lineHeight: '1.4'
                    }}>
                        💡 <strong>Conseil :</strong> Utilise le mode compétitif pendant ta soirée pour le suivi temps réel, 
                        et le mode simple pour enregistrer rapidement des soirées passées.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PartyModeSelector;