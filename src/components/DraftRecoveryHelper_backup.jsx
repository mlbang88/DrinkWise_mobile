import React, { useContext, useState, useEffect } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { doc, getDoc } from 'firebase/firestore';

const DraftRecoveryHelper = ({ onRecoverDraft }) => {
    const { db, user, appId } = useContext(FirebaseContext);
    const [activeDraft, setActiveDraft] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkForActiveDraft = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                const draftRef = doc(db, `artifacts/${appId}/users/${user.uid}/party_draft`, 'current');
                const draftSnap = await getDoc(draftRef);
                
                if (draftSnap.exists()) {
                    setActiveDraft(draftSnap.data());
                }
            } catch (error) {
                console.error('Erreur lors de la vérification du draft:', error);
            } finally {
                setLoading(false);
            }
        };

        checkForActiveDraft();
    }, [user, db, appId]);

    if (loading) return null;
    if (!activeDraft) return null;

    const formatTime = (date) => {
        const dateObj = date.seconds ? date.toDate() : new Date(date);
        return dateObj.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTotalDrinks = () => {
        return activeDraft.drinks.reduce((total, drink) => total + drink.quantity, 0);
    };

    return (
        <div style={{
            backgroundColor: 'rgba(139, 69, 255, 0.2)',
            border: '2px solid #8b45ff',
            borderRadius: '16px',
            padding: '16px',
            margin: '16px',
            marginBottom: '24px'
        }}>
            <div style={{
                textAlign: 'center',
                marginBottom: '16px'
            }}>
                <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                }}>
                    🎉 Soirée en cours détectée
                </h3>
                <p style={{
                    color: '#c084fc',
                    fontSize: '14px',
                    margin: 0
                }}>
                    Commencée le {formatTime(activeDraft.startTime)}
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '16px',
                fontSize: '14px'
            }}>
                <div style={{ color: '#d1d5db' }}>
                    🍺 Total boissons: <span style={{ color: 'white', fontWeight: 'bold' }}>{getTotalDrinks()}</span>
                </div>
                <div style={{ color: '#d1d5db' }}>
                    🤮 Vomis: <span style={{ color: 'white', fontWeight: 'bold' }}>{activeDraft.events.vomi || 0}</span>
                </div>
                <div style={{ color: '#d1d5db' }}>
                    👊 Bagarres: <span style={{ color: 'white', fontWeight: 'bold' }}>{activeDraft.events.fights || 0}</span>
                </div>
                <div style={{ color: '#d1d5db' }}>
                    💋 Filles: <span style={{ color: 'white', fontWeight: 'bold' }}>{activeDraft.events.girlsTalkedTo || 0}</span>
                </div>
            </div>

            <div style={{
                display: 'flex',
                gap: '12px'
            }}>
                <button
                    onClick={() => {
                        // Convertir le draft pour le formulaire normal
                        const convertedData = {
                            location: activeDraft.location || '',
                            category: activeDraft.category || 'Soirée',
                            notes: activeDraft.notes || '',
                            drinks: activeDraft.drinks || [],
                            events: activeDraft.events || {},
                            startTime: activeDraft.startTime,
                            endTime: new Date()
                        };
                        onRecoverDraft(convertedData);
                    }}
                    style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: '#8b45ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    📝 Continuer dans le formulaire
                </button>
                
                <button
                    onClick={() => {
                        // Déclencher l'événement pour retourner en mode soirée
                        const event = new CustomEvent('returnToPartyMode');
                        window.dispatchEvent(event);
                    }}
                    style={{
                        flex: 1,
                        padding: '12px',
                        backgroundColor: 'transparent',
                        color: '#8b45ff',
                        border: '2px solid #8b45ff',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    🎉 Retour mode soirée
                </button>
            </div>
        </div>
    );
};

export default DraftRecoveryHelper;
