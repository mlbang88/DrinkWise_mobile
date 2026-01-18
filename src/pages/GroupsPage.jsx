// src/pages/GroupsPage.jsx
import React, { useState, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import GroupManager from '../components/GroupManager';
import GroupStats from '../components/GroupStats';

export default function GroupsPage() {
    const { user } = useContext(FirebaseContext);
    const [selectedGroupId, setSelectedGroupId] = useState(null);

    if (!user) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
            }}>
                Veuillez vous connecter pour accéder aux groupes.
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: 'clamp(16px, 5vw, 20px)'
        }}>
            {/* En-tête */}
            <div style={{
                marginBottom: '30px'
            }}>
                <h1 style={{
                    color: 'white',
                    fontSize: 'clamp(20px, 6vw, 28px)',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                }}>
                    👥 Mes Groupes
                </h1>
                <p style={{
                    color: '#ccc',
                    fontSize: 'clamp(14px, 4vw, 16px)',
                    margin: 0,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                }}>
                    Créez des groupes avec vos amis et suivez vos statistiques collectives !
                </p>
            </div>

            {/* Gestionnaire de groupes */}
            <GroupManager 
                onSelectGroup={setSelectedGroupId}
                selectedGroupId={selectedGroupId}
            />
            
            {/* Statistiques du groupe sélectionné */}
            {selectedGroupId && (
                <GroupStats groupId={selectedGroupId} />
            )}
            
            {/* Message si aucun groupe sélectionné */}
            {!selectedGroupId && (
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '15px',
                    padding: 'clamp(32px, 8vw, 40px)',
                    textAlign: 'center',
                    color: '#9ca3af'
                }}>
                    <h3 style={{ 
                        color: '#ccc', 
                        marginBottom: '15px',
                        fontSize: 'clamp(16px, 4.5vw, 18px)'
                    }}>
                        🎯 Sélectionnez un groupe
                    </h3>
                    <p style={{ 
                        fontSize: 'clamp(12px, 3.5vw, 14px)', 
                        margin: 0,
                        lineHeight: '1.4',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                    }}>
                        Choisissez un groupe ci-dessus pour voir ses statistiques détaillées et créer des défis collectifs.
                    </p>
                </div>
            )}
        </div>
    );
}
