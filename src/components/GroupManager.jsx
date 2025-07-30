// src/components/GroupManager.jsx
import React, { useState, useEffect, useContext } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { groupService } from '../services/groupService';
import LoadingSpinner from './LoadingSpinner';
import LoadingIcon from './LoadingIcon';

export default function GroupManager({ onSelectGroup, selectedGroupId }) {
    const { db, user, appId, userProfile, setMessageBox } = useContext(FirebaseContext);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [inviteUsername, setInviteUsername] = useState('');
    const [creating, setCreating] = useState(false);
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (!user) return;

        loadUserGroups();
    }, [user, appId]);

    const loadUserGroups = async () => {
        try {
            setLoading(true);
            const userGroups = await groupService.getUserGroups(db, appId, user.uid);
            
            // Calculer les stats pour chaque groupe
            for (const group of userGroups) {
                await groupService.calculateGroupStats(db, appId, group.id);
            }
            
            // Recharger les groupes avec les stats mises à jour
            const updatedGroups = await groupService.getUserGroups(db, appId, user.uid);
            setGroups(updatedGroups);
        } catch (error) {
            console.error('❌ Erreur chargement groupes:', error);
            setMessageBox({ message: 'Erreur lors du chargement des groupes.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) {
            setMessageBox({ message: 'Veuillez saisir un nom de groupe.', type: 'error' });
            return;
        }

        try {
            setCreating(true);
            const groupId = await groupService.createGroup(db, appId, user.uid, {
                name: newGroupName.trim(),
                description: newGroupDesc.trim()
            });

            setMessageBox({ message: 'Groupe créé avec succès !', type: 'success' });
            setNewGroupName('');
            setNewGroupDesc('');
            setShowCreateForm(false);
            loadUserGroups();
        } catch (error) {
            console.error('❌ Erreur création groupe:', error);
            setMessageBox({ message: 'Erreur lors de la création du groupe.', type: 'error' });
        } finally {
            setCreating(false);
        }
    };

    const handleInviteMember = async (groupId) => {
        if (!inviteUsername.trim()) {
            setMessageBox({ message: 'Veuillez saisir un nom d\'utilisateur.', type: 'error' });
            return;
        }

        try {
            setInviting(true);
            
            // Rechercher l'utilisateur par nom d'utilisateur
            const publicStatsRef = collection(db, `artifacts/${appId}/public_user_stats`);
            const snapshot = await getDocs(publicStatsRef);
            
            let targetUserId = null;
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.username && data.username.toLowerCase() === inviteUsername.toLowerCase()) {
                    targetUserId = doc.id;
                }
            });

            if (!targetUserId) {
                setMessageBox({ message: 'Utilisateur non trouvé.', type: 'error' });
                return;
            }

            // Vérifier si l'utilisateur est déjà dans le groupe
            const group = groups.find(g => g.id === groupId);
            if (group.members.includes(targetUserId)) {
                setMessageBox({ message: 'Cet utilisateur est déjà membre du groupe.', type: 'info' });
                return;
            }

            await groupService.addMemberToGroup(db, appId, groupId, targetUserId);
            setMessageBox({ message: 'Membre ajouté avec succès !', type: 'success' });
            setInviteUsername('');
            setShowInviteForm(null);
            loadUserGroups();
        } catch (error) {
            console.error('❌ Erreur invitation membre:', error);
            setMessageBox({ message: 'Erreur lors de l\'invitation.', type: 'error' });
        } finally {
            setInviting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h3 style={{ color: '#ccc', margin: 0 }}>👥 Mes Groupes</h3>
                <button
                    onClick={() => setShowCreateForm(true)}
                    style={{
                        backgroundColor: '#3b82f6',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        padding: '8px 15px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    + Créer un groupe
                </button>
            </div>

            {/* Formulaire de création */}
            {showCreateForm && (
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ color: 'white', marginBottom: '15px' }}>Créer un nouveau groupe</h4>
                    <input
                        type="text"
                        placeholder="Nom du groupe"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '10px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px'
                        }}
                    />
                    <textarea
                        placeholder="Description (optionnel)"
                        value={newGroupDesc}
                        onChange={(e) => setNewGroupDesc(e.target.value)}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginBottom: '15px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '14px',
                            resize: 'vertical'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleCreateGroup}
                            disabled={creating}
                            style={{
                                backgroundColor: '#10b981',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                padding: '10px 20px',
                                cursor: creating ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                opacity: creating ? 0.7 : 1
                            }}
                        >
                            {creating ? <LoadingIcon /> : 'Créer'}
                        </button>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            style={{
                                backgroundColor: '#6b7280',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                padding: '10px 20px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            )}

            {/* Liste des groupes */}
            <div style={{
                display: 'grid',
                gap: '15px'
            }}>
                {groups.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: '#9ca3af',
                        padding: '40px',
                        fontSize: '14px'
                    }}>
                        Aucun groupe trouvé. Créez votre premier groupe !
                    </div>
                ) : (
                    groups.map(group => (
                        <div
                            key={group.id}
                            style={{
                                backgroundColor: selectedGroupId === group.id 
                                    ? 'rgba(59, 130, 246, 0.2)' 
                                    : 'rgba(255, 255, 255, 0.05)',
                                border: selectedGroupId === group.id 
                                    ? '2px solid #3b82f6' 
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '15px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                            onClick={() => onSelectGroup(group.id)}
                        >
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '10px'
                            }}>
                                <div>
                                    <h4 style={{ color: 'white', margin: 0, marginBottom: '5px' }}>
                                        {group.name}
                                    </h4>
                                    {group.description && (
                                        <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                                            {group.description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowInviteForm(group.id);
                                    }}
                                    style={{
                                        backgroundColor: '#8b5cf6',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: 'white',
                                        padding: '5px 10px',
                                        cursor: 'pointer',
                                        fontSize: '12px'
                                    }}
                                >
                                    + Inviter
                                </button>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                fontSize: '12px',
                                color: '#9ca3af'
                            }}>
                                <span>👥 {group.members.length} membres</span>
                                <span>🍺 {group.stats?.totalDrinks || 0} verres</span>
                                <span>🎉 {group.stats?.totalParties || 0} soirées</span>
                            </div>

                            {/* Formulaire d'invitation */}
                            {showInviteForm === group.id && (
                                <div
                                    style={{
                                        marginTop: '15px',
                                        padding: '15px',
                                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                        borderRadius: '8px'
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <input
                                        type="text"
                                        placeholder="Nom d'utilisateur à inviter"
                                        value={inviteUsername}
                                        onChange={(e) => setInviteUsername(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            marginBottom: '10px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '6px',
                                            color: 'white',
                                            fontSize: '12px'
                                        }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleInviteMember(group.id)}
                                            disabled={inviting}
                                            style={{
                                                backgroundColor: '#10b981',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: 'white',
                                                padding: '6px 12px',
                                                cursor: inviting ? 'not-allowed' : 'pointer',
                                                fontSize: '12px',
                                                opacity: inviting ? 0.7 : 1
                                            }}
                                        >
                                            {inviting ? <LoadingIcon /> : 'Inviter'}
                                        </button>
                                        <button
                                            onClick={() => setShowInviteForm(null)}
                                            style={{
                                                backgroundColor: '#6b7280',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: 'white',
                                                padding: '6px 12px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                        >
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
