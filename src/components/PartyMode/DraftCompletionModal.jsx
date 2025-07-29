import React, { useContext, useState } from 'react';
import { FirebaseContext } from '../../contexts/FirebaseContext.jsx';
import { partyCategories } from '../../utils/data.jsx';

const DraftCompletionModal = ({ draft, onClose, onComplete, onAbandon }) => {
    const { closeDraftTemporarily } = useContext(FirebaseContext);
    const [location, setLocation] = useState(draft.location || '');
    const [category, setCategory] = useState(draft.category || partyCategories[0]);
    const [notes, setNotes] = useState(draft.notes || '');

    const handleComplete = () => {
        const completedParty = {
            ...draft,
            location,
            category,
            notes,
            status: 'completed',
            completedAt: new Date()
        };
        onComplete(completedParty);
    };

    const formatTime = (date) => {
        if (!date) return 'Non défini';
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'Non défini';
        return dateObj.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTotalDrinks = () => {
        return draft.drinks.reduce((total, drink) => total + drink.quantity, 0);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#1f2937',
                borderRadius: '20px',
                padding: '24px',
                maxWidth: '400px',
                width: '100%',
                maxHeight: '80vh',
                overflowY: 'auto',
                border: '2px solid #374151'
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '24px'
                }}>
                    <h2 style={{
                        color: 'white',
                        fontSize: '24px',
                        fontWeight: 'bold',
                        margin: '0 0 8px 0'
                    }}>
                        🎯 Finaliser la Soirée
                    </h2>
                    <p style={{
                        color: '#9ca3af',
                        fontSize: '14px',
                        margin: 0
                    }}>
                        Commencée le {formatTime(draft.startTime)}
                    </p>
                </div>

                {/* Résumé rapide */}
                <div style={{
                    backgroundColor: 'rgba(139, 69, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                    border: '1px solid #8b45ff'
                }}>
                    <h3 style={{
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: '0 0 12px 0'
                    }}>
                        Résumé de la soirée
                    </h3>
                    
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '8px',
                        fontSize: '14px'
                    }}>
                        <div style={{ color: '#d1d5db' }}>
                            🍺 Total boissons: <span style={{ color: 'white', fontWeight: 'bold' }}>{getTotalDrinks()}</span>
                        </div>
                        <div style={{ color: '#d1d5db' }}>
                            🤮 Vomis: <span style={{ color: 'white', fontWeight: 'bold' }}>{draft.events.vomi || 0}</span>
                        </div>
                        <div style={{ color: '#d1d5db' }}>
                            👊 Bagarres: <span style={{ color: 'white', fontWeight: 'bold' }}>{draft.events.fights || 0}</span>
                        </div>
                        <div style={{ color: '#d1d5db' }}>
                            💋 Filles: <span style={{ color: 'white', fontWeight: 'bold' }}>{draft.events.girlsTalkedTo || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Formulaire de complétion */}
                <div style={{ marginBottom: '24px' }}>
                    {/* Lieu */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            📍 Lieu de la soirée
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Ex: Chez Paul, Bar du coin..."
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #374151',
                                backgroundColor: '#374151',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Catégorie */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            🎭 Type de soirée
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #374151',
                                backgroundColor: '#374151',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        >
                            {partyCategories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{
                            display: 'block',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            📝 Notes (optionnel)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Raconte ta soirée..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #374151',
                                backgroundColor: '#374151',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                </div>

                {/* Boutons */}
                <div style={{
                    display: 'flex',
                    gap: '12px'
                }}>
                    <button
                        onClick={() => {
                            closeDraftTemporarily();
                            onClose();
                        }}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '12px',
                            border: '2px solid #6b7280',
                            backgroundColor: 'transparent',
                            color: '#9ca3af',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        Plus tard
                    </button>
                    
                    <button
                        onClick={() => {
                            // Déclencher l'abandon du mode soirée
                            if (onAbandon) {
                                onAbandon();
                            }
                        }}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '12px',
                            border: '2px solid #dc2626',
                            backgroundColor: 'transparent',
                            color: '#dc2626',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        🗑️ Abandonner
                    </button>
                    
                    <button
                        onClick={() => {
                            // Convertir le draft pour le formulaire normal
                            const convertedData = {
                                location: location || draft.location || '',
                                category: category || draft.category || partyCategories[0],
                                notes: notes || draft.notes || '',
                                drinks: draft.drinks || [],
                                events: draft.events || {},
                                startTime: draft.startTime,
                                endTime: new Date()
                            };
                            
                            // NE PAS fermer le mode soirée - on laisse le quiz le faire
                            console.log("📝 Ouverture formulaire normal SANS fermer le mode soirée");
                            onClose();
                            
                            // Attendre un peu puis déclencher l'événement
                            setTimeout(() => {
                                const event = new CustomEvent('openNormalFormWithDraft', {
                                    detail: { draftData: convertedData }
                                });
                                window.dispatchEvent(event);
                            }, 100);
                        }}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '12px',
                            border: '2px solid #f59e0b',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        📝 Formulaire
                    </button>
                    
                    <button
                        onClick={handleComplete}
                        style={{
                            flex: 1,
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        ✅ Finaliser
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DraftCompletionModal;
