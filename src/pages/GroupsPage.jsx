// src/pages/GroupsPage.jsx
import React, { useState } from 'react';
import { useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
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
            padding: '20px'
        }}>
            {/* En-tête */}
            <div style={{
                marginBottom: '30px'
            }}>
                <h1 style={{
                    color: 'white',
                    fontSize: '28px',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                }}>
                    👥 Mes Groupes
                </h1>
                <p style={{
                    color: '#ccc',
                    fontSize: '16px',
                    margin: 0
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
                    padding: '40px',
                    textAlign: 'center',
                    color: '#9ca3af'
                }}>
                    <h3 style={{ color: '#ccc', marginBottom: '15px' }}>
                        🎯 Sélectionnez un groupe
                    </h3>
                    <p style={{ fontSize: '14px', margin: 0 }}>
                        Choisissez un groupe ci-dessus pour voir ses statistiques détaillées et créer des défis collectifs.
                    </p>
                </div>
            )}
        </div>
    );
}
