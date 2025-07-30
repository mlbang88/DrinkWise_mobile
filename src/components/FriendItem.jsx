import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

const FriendItem = ({ friendId, onRemove, onViewStats, appId, db }) => {
    const [friendProfile, setFriendProfile] = useState(null);
    
    useEffect(() => {
        const profileRef = doc(db, `artifacts/${appId}/public_user_stats`, friendId);
        const unsub = onSnapshot(profileRef, (doc) => {
            if (doc.exists()) setFriendProfile({ id: doc.id, ...doc.data() });
        }, (error) => {
            console.error("❌ Erreur d'accès au profil ami:", error);
            // Profil ami non accessible, on peut continuer sans
        });
        return () => unsub();
    }, [friendId, appId, db]);

    if (!friendProfile) {
        return (
            <div style={{
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9ca3af',
                textAlign: 'center'
            }}>
                Chargement...
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '12px'
        }}>
            <span style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: '500'
            }}>
                {friendProfile.username}
            </span>
            
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
            }}>
                <button 
                    onClick={() => onViewStats(friendId)}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: friendProfile.isPublic ? '#60a5fa' : '#9ca3af',
                        fontWeight: '600'
                    }}
                    title={friendProfile.isPublic ? "Voir stats" : "Profil privé"}
                >
                    📊
                </button>
                <button 
                    onClick={() => onRemove(friendId)}
                    style={{
                        padding: '4px 8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        color: '#f87171',
                        fontWeight: '600'
                    }}
                    title="Supprimer"
                >
                    🗑️
                </button>
            </div>
        </div>
    );
};

export default FriendItem;