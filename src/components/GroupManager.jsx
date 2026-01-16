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
            console.error('❌ Erreur chargement groupes:', error?.message || String(error));
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
            console.error('❌ Erreur création groupe:', error?.message || String(error));
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
            console.error('❌ Erreur invitation membre:', error?.message || String(error));
            setMessageBox({ message: 'Erreur lors de l\'invitation.', type: 'error' });
        } finally {
            setInviting(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <h3 style={{ 
                    backgroundImage: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: '700',
                    letterSpacing: '-0.02em'
                }}>👥 Mes Groupes</h3>
                <button
                    onClick={() => setShowCreateForm(true)}
                    style={{
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '16px',
                        color: 'white',
                        padding: '12px 20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    + Créer un groupe
                </button>
            </div>

            {/* Formulaire de création */}
            {showCreateForm && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 30, 60, 0.8), rgba(45, 45, 80, 0.6))',
                    backdropFilter: 'blur(15px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)'
                }}>
                    <h4 style={{ 
                        backgroundImage: 'linear-gradient(135deg, #ffffff, #e0e7ff)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '20px',
                        fontSize: '18px',
                        fontWeight: '600',
                        letterSpacing: '-0.01em'
                    }}>Créer un nouveau groupe</h4>
                    <input
                        type="text"
                        placeholder="Nom du groupe"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '16px 20px',
                            marginBottom: '16px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '15px',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <textarea
                        placeholder="Description (optionnel)"
                        value={newGroupDesc}
                        onChange={(e) => setNewGroupDesc(e.target.value)}
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '16px 20px',
                            marginBottom: '20px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '15px',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            resize: 'vertical',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }}
                    />
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button
                            onClick={handleCreateGroup}
                            disabled={creating}
                            style={{
                                background: creating ? 'rgba(16, 185, 129, 0.5)' : 'linear-gradient(135deg, #10b981, #059669)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '16px',
                                color: 'white',
                                padding: '14px 24px',
                                cursor: creating ? 'not-allowed' : 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: creating ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            {creating ? <LoadingIcon /> : 'Créer'}
                        </button>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '16px',
                                color: 'rgba(255, 255, 255, 0.8)',
                                padding: '14px 24px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
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
                gap: '20px'
            }}>
                {groups.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.6)',
                        padding: '48px',
                        fontSize: '15px',
                        fontWeight: '500'
                    }}>
                        Aucun groupe trouvé. Créez votre premier groupe !
                    </div>
                ) : (
                    groups.map(group => (
                        <div
                            key={group.id}
                            style={{
                                background: selectedGroupId === group.id 
                                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(37, 99, 235, 0.2))' 
                                    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                                backdropFilter: 'blur(15px)',
                                border: selectedGroupId === group.id 
                                    ? '2px solid rgba(59, 130, 246, 0.6)' 
                                    : '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '20px',
                                padding: '20px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: selectedGroupId === group.id 
                                    ? '0 8px 25px rgba(59, 130, 246, 0.3)'
                                    : '0 4px 15px rgba(0, 0, 0, 0.1)'
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
                                    <h4 style={{ 
                                        backgroundImage: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        margin: 0, 
                                        marginBottom: '8px',
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        letterSpacing: '-0.01em'
                                    }}>
                                        {group.name}
                                    </h4>
                                    {group.description && (
                                        <p style={{ 
                                            color: 'rgba(255, 255, 255, 0.7)', 
                                            fontSize: '14px', 
                                            margin: 0,
                                            fontWeight: '500'
                                        }}>
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
                                        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(139, 92, 246, 0.3)',
                                        borderRadius: '12px',
                                        color: 'white',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease',
                                        boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
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
