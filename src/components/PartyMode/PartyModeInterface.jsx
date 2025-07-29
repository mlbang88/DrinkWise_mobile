import React, { useContext, useEffect } from 'react';
import { FirebaseContext } from '../../contexts/FirebaseContext.jsx';
import DrinkCounter from './DrinkCounter';
import QuickEventButton from './QuickEventButton';

const PartyModeInterface = ({ onEndParty }) => {
    const { 
        activeDraft, 
        addDrinkToDraft,
        removeDrinkFromDraft,
        addEventToDraft,
        endPartyMode,
        setMessageBox 
    } = useContext(FirebaseContext);

    // Auto-save toutes les 30 secondes
    useEffect(() => {
        if (!activeDraft) return;

        const autoSaveInterval = setInterval(() => {
            console.log('🔄 Auto-save automatique en cours...');
            // La sauvegarde se fait automatiquement via les fonctions addDrinkToDraft et addEventToDraft
        }, 30000);

        return () => clearInterval(autoSaveInterval);
    }, [activeDraft]);

    if (!activeDraft) {
        return (
            <div style={{
                textAlign: 'center',
                color: 'white',
                padding: '40px'
            }}>
                <h2>Mode Soirée non actif</h2>
                <p>Activez le mode soirée pour commencer à enregistrer.</p>
            </div>
        );
    }

    const handleDrinkIncrement = (type) => {
        addDrinkToDraft(type, 1);
    };

    const handleDrinkDecrement = (type) => {
        removeDrinkFromDraft(type, 1);
    };

    const handleEventIncrement = (eventType) => {
        addEventToDraft(eventType);
    };

    const getDrinkCount = (type) => {
        const drink = activeDraft.drinks.find(d => d.type === type);
        return drink ? drink.quantity : 0;
    };

    const formatTime = (date) => {
        if (!date) return 'Non défini';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Non défini';
        return dateObj.toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    return (
        <div 
            style={{
                maxWidth: '400px',
                margin: '0 auto',
                padding: '20px'
            }}
            onClick={(e) => {
                // Empêcher la propagation qui peut causer la remontée
                e.stopPropagation();
            }}
        >
            {/* Header Mode Soirée */}
            <div style={{
                backgroundColor: 'rgba(139, 69, 255, 0.3)',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '24px',
                textAlign: 'center',
                border: '2px solid #8b45ff'
            }}>
                <h1 style={{
                    color: 'white',
                    fontSize: '24px',
                    fontWeight: 'bold',
                    margin: '0 0 8px 0'
                }}>
                    🔥 Mode Soirée Activé
                </h1>
                <p style={{
                    color: '#d1d5db',
                    fontSize: '14px',
                    margin: 0
                }}>
                    Commencé à {formatTime(activeDraft.startTime)}
                </p>
                
                {/* Bouton d'arrêt */}
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onEndParty();
                    }}
                    style={{
                        marginTop: '12px',
                        padding: '8px 16px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '14px',
                        cursor: 'pointer'
                    }}
                >
                    Arrêter la soirée
                </button>
            </div>

            {/* Compteurs de boissons */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    textAlign: 'center'
                }}>
                    🍺 Compteurs de Boissons
                </h2>
                
                <DrinkCounter
                    type="Bière"
                    icon="🍺"
                    count={getDrinkCount('Bière')}
                    onIncrement={() => handleDrinkIncrement('Bière')}
                    onDecrement={() => handleDrinkDecrement('Bière')}
                />
                
                <DrinkCounter
                    type="Cocktail"
                    icon="🍸"
                    count={getDrinkCount('Cocktail')}
                    onIncrement={() => handleDrinkIncrement('Cocktail')}
                    onDecrement={() => handleDrinkDecrement('Cocktail')}
                />
                
                <DrinkCounter
                    type="Shot"
                    icon="🥃"
                    count={getDrinkCount('Spiritueux')}
                    onIncrement={() => handleDrinkIncrement('Spiritueux')}
                    onDecrement={() => handleDrinkDecrement('Spiritueux')}
                />
                
                <DrinkCounter
                    type="Vin"
                    icon="🍷"
                    count={getDrinkCount('Vin')}
                    onIncrement={() => handleDrinkIncrement('Vin')}
                    onDecrement={() => handleDrinkDecrement('Vin')}
                />
            </div>

            {/* Événements rapides */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '16px',
                    textAlign: 'center'
                }}>
                    ⚡ Événements Rapides
                </h2>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                }}>
                    <QuickEventButton
                        icon="🤮"
                        label="Vomi"
                        count={activeDraft.events.vomi || 0}
                        onIncrement={() => handleEventIncrement('vomi')}
                    />
                    
                    <QuickEventButton
                        icon="👊"
                        label="Bagarre"
                        count={activeDraft.events.fights || 0}
                        onIncrement={() => handleEventIncrement('fights')}
                    />
                    
                    <QuickEventButton
                        icon="💋"
                        label="Fille parlée"
                        count={activeDraft.events.girlsTalkedTo || 0}
                        onIncrement={() => handleEventIncrement('girlsTalkedTo')}
                    />
                    
                    <QuickEventButton
                        icon="🎯"
                        label="Recal"
                        count={activeDraft.events.recal || 0}
                        onIncrement={() => handleEventIncrement('recal')}
                    />
                </div>
            </div>

            {/* Statut de sauvegarde */}
            <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                border: '2px solid #10b981',
                borderRadius: '12px',
                padding: '12px',
                textAlign: 'center',
                marginBottom: '20px'
            }}>
                <div style={{
                    color: '#10b981',
                    fontSize: '14px',
                    fontWeight: '600'
                }}>
                    ✅ Sauvegarde automatique active
                </div>
                <div style={{
                    color: '#9ca3af',
                    fontSize: '12px',
                    marginTop: '4px'
                }}>
                    Dernière mise à jour : {formatTime(activeDraft.lastSaved)}
                </div>
            </div>

            {/* Bouton pour terminer la soirée */}
            <button
                onClick={onEndParty}
                style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
                🏁 Terminer la Soirée
            </button>
        </div>
    );
};

export default PartyModeInterface;
