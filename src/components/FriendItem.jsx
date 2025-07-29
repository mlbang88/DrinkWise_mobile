import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';

const FriendItem = ({ friendId, onRemove, onViewStats, appId, db }) => {
    const [friendProfile, setFriendProfile] = useState(null);
    
    useEffect(() => {
        const profileRef = doc(db, `artifacts/${appId}/profiles`, friendId);
        const unsub = onSnapshot(profileRef, (doc) => {
            if (doc.exists()) setFriendProfile({ id: doc.id, ...doc.data() });
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
                {friendProfile.isPublic && (
                    <button 
                        onClick={() => onViewStats(friendId)}
                        style={{
                            padding: '4px 8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            color: '#60a5fa',
                            fontWeight: '600'
                        }}
                        title="Voir stats"
                    >
                        📊
                    </button>
                )}
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