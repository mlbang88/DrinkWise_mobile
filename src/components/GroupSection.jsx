// src/components/GroupSection.jsx
import React, { useState, useEffect, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { groupService } from '../services/groupService.js';
import GroupStats from './GroupStats.jsx';

const GroupSection = () => {
    const { db, user, appId, userProfile, setMessageBox } = useContext(FirebaseContext);
    
    // États pour les groupes
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    
    // États pour les formulaires
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [inviteUsername, setInviteUsername] = useState('');
    
    // Charger les groupes de l'utilisateur
    const loadUserGroups = async () => {
        try {
            setLoading(true);
            console.log('🔄 Chargement des groupes utilisateur...');
            const userGroups = await groupService.getUserGroups(db, appId, user.uid);
            console.log('✅ Groupes chargés:', userGroups);
            setGroups(userGroups);
        } catch (error) {
            console.error('❌ Erreur chargement groupes:', error);
            setMessageBox({ message: 'Erreur lors du chargement des groupes', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && appId) {
            loadUserGroups();
        }
    }, [user, appId]);

    // Créer un nouveau groupe
    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroupName.trim()) {
            setMessageBox({ message: 'Le nom du groupe est requis', type: 'error' });
            return;
        }

        try {
            const groupId = await groupService.createGroup(db, appId, user.uid, {
                name: newGroupName,
                description: newGroupDescription
            });
            
            setMessageBox({ message: 'Groupe créé avec succès !', type: 'success' });
            setNewGroupName('');
            setNewGroupDescription('');
            setShowCreateForm(false);
            loadUserGroups(); // Recharger la liste
        } catch (error) {
            console.error('❌ Erreur création groupe:', error);
            setMessageBox({ message: 'Erreur lors de la création du groupe', type: 'error' });
        }
    };

    // Inviter un membre
    const handleInviteMember = async (e) => {
        e.preventDefault();
        if (!inviteUsername.trim() || !selectedGroup) {
            setMessageBox({ message: 'Nom d\'utilisateur requis', type: 'error' });
            return;
        }

        try {
            await groupService.inviteMemberByUsername(db, appId, selectedGroup.id, inviteUsername);
            setMessageBox({ message: 'Invitation envoyée !', type: 'success' });
            setInviteUsername('');
            setShowInviteForm(false);
            loadUserGroups(); // Recharger pour voir les nouveaux membres
        } catch (error) {
            console.error('❌ Erreur invitation:', error);
            setMessageBox({ message: 'Erreur lors de l\'invitation', type: 'error' });
        }
    };

    // Supprimer un membre du groupe (admin seulement)
    const handleRemoveMember = async (memberId) => {
        if (!selectedGroup || !groupService.isUserAdmin(selectedGroup, user.uid)) {
            setMessageBox({ message: 'Vous devez être admin pour supprimer des membres', type: 'error' });
            return;
        }

        if (memberId === selectedGroup.createdBy) {
            setMessageBox({ message: 'Impossible de supprimer le créateur du groupe', type: 'error' });
            return;
        }

        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce membre du groupe ?')) {
            try {
                await groupService.removeMemberFromGroup(db, appId, selectedGroup.id, memberId);
                setMessageBox({ message: 'Membre supprimé du groupe', type: 'success' });
                loadUserGroups(); // Recharger la liste
            } catch (error) {
                console.error('❌ Erreur suppression membre:', error);
                setMessageBox({ message: 'Erreur lors de la suppression du membre', type: 'error' });
            }
        }
    };

    // Supprimer le groupe entier (admin seulement)
    const handleDeleteGroup = async () => {
        if (!selectedGroup || !groupService.isUserAdmin(selectedGroup, user.uid)) {
            setMessageBox({ message: 'Vous devez être admin pour supprimer le groupe', type: 'error' });
            return;
        }

        if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le groupe "${selectedGroup.name}" ? Cette action est irréversible.`)) {
            try {
                await groupService.deleteGroup(db, appId, selectedGroup.id);
                setMessageBox({ message: 'Groupe supprimé avec succès', type: 'success' });
                setSelectedGroup(null); // Déselectionner le groupe
                loadUserGroups(); // Recharger la liste
            } catch (error) {
                console.error('❌ Erreur suppression groupe:', error);
                setMessageBox({ message: 'Erreur lors de la suppression du groupe', type: 'error' });
            }
        }
    };

    // Vérifier si l'utilisateur est admin du groupe sélectionné
    const isCurrentUserAdmin = () => {
        return selectedGroup && groupService.isUserAdmin(selectedGroup, user.uid);
    };

    return (
        <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
            <h3 style={{
                color: 'white',
                fontSize: '24px',
                fontWeight: 'bold',
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                👥 Mes Groupes
            </h3>

            {loading ? (
                <div style={{ textAlign: 'center', color: 'white' }}>
                    Chargement...
                </div>
            ) : (
                <>
                    {/* Liste des groupes */}
                    <div style={{ marginBottom: '20px' }}>
                        {groups.length === 0 ? (
                            <p style={{ color: 'white', textAlign: 'center', opacity: 0.8 }}>
                                Aucun groupe trouvé. Créez votre premier groupe !
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {groups.map(group => (
                                    <div 
                                        key={group.id}
                                        onClick={() => setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                                        style={{
                                            padding: '15px',
                                            backgroundColor: selectedGroup?.id === group.id ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            border: selectedGroup?.id === group.id ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.2)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '18px' }}>
                                                    {group.name}
                                                </h4>
                                                {group.description && (
                                                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: '0', fontSize: '14px' }}>
                                                        {group.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                                                👥 {group.members?.length || 0} membre{(group.members?.length || 0) > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Boutons d'action */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            ➕ Créer un groupe
                        </button>

                        {selectedGroup && (
                            <button
                                onClick={() => setShowInviteForm(!showInviteForm)}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                📨 Inviter un ami
                            </button>
                        )}

                        {selectedGroup && isCurrentUserAdmin() && (
                            <>
                                <button
                                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#f59e0b',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ⚙️ Administration
                                </button>

                                <button
                                    onClick={handleDeleteGroup}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    🗑️ Supprimer le groupe
                                </button>
                            </>
                        )}
                    </div>

                    {/* Formulaire de création de groupe */}
                    {showCreateForm && (
                        <form onSubmit={handleCreateGroup} style={{
                            marginTop: '20px',
                            padding: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
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
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '16px'
                                }}
                                required
                            />
                            
                            <textarea
                                placeholder="Description (optionnelle)"
                                value={newGroupDescription}
                                onChange={(e) => setNewGroupDescription(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '15px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '16px',
                                    minHeight: '60px',
                                    resize: 'vertical'
                                }}
                            />
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>
                                    ✅ Créer
                                </button>
                                
                                <button type="button" onClick={() => setShowCreateForm(false)} style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}>
                                    ❌ Annuler
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Formulaire d'invitation */}
                    {showInviteForm && selectedGroup && (
                        <form onSubmit={handleInviteMember} style={{
                            marginTop: '20px',
                            padding: '20px',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 255, 255, 0.2)'
                        }}>
                            <h4 style={{ color: 'white', marginBottom: '15px' }}>
                                Inviter un ami dans "{selectedGroup.name}"
                            </h4>
                            
                            <input
                                type="text"
                                placeholder="Nom d'utilisateur de votre ami"
                                value={inviteUsername}
                                onChange={(e) => setInviteUsername(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '15px',
                                    border: '1px solid rgba(255, 255, 255, 0.3)',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '16px'
                                }}
                                required
                            />
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#3b82f6',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}>
                                    📨 Inviter
                                </button>
                                
                                <button type="button" onClick={() => setShowInviteForm(false)} style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                }}>
                                    ❌ Annuler
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Panneau d'administration */}
                    {showAdminPanel && selectedGroup && isCurrentUserAdmin() && (
                        <div style={{
                            marginTop: '20px',
                            padding: '20px',
                            backgroundColor: 'rgba(255, 165, 0, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 165, 0, 0.3)'
                        }}>
                            <h4 style={{ color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                ⚙️ Administration du groupe "{selectedGroup.name}"
                            </h4>
                            
                            <h5 style={{ color: 'white', marginBottom: '10px', fontSize: '16px' }}>
                                👥 Gestion des membres ({selectedGroup.members?.length || 0} membre{(selectedGroup.members?.length || 0) > 1 ? 's' : ''})
                            </h5>
                            
                            <div style={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '8px',
                                maxHeight: '200px',
                                overflowY: 'auto',
                                marginBottom: '15px'
                            }}>
                                {selectedGroup.members?.map(memberId => (
                                    <div key={memberId} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '10px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}>
                                        <div>
                                            <span style={{ color: 'white', fontWeight: 'bold' }}>
                                                {memberId === user.uid ? 'Vous' : `Membre: ${memberId.substring(0, 8)}...`}
                                            </span>
                                            {selectedGroup.admins?.includes(memberId) && (
                                                <span style={{ 
                                                    color: '#f59e0b', 
                                                    fontSize: '12px', 
                                                    marginLeft: '8px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    👑 Admin
                                                </span>
                                            )}
                                            {memberId === selectedGroup.createdBy && (
                                                <span style={{ 
                                                    color: '#10b981', 
                                                    fontSize: '12px', 
                                                    marginLeft: '8px',
                                                    fontWeight: 'bold'
                                                }}>
                                                    🏆 Créateur
                                                </span>
                                            )}
                                        </div>
                                        
                                        {memberId !== selectedGroup.createdBy && memberId !== user.uid && (
                                            <button
                                                onClick={() => handleRemoveMember(memberId)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#dc2626',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                🚫 Exclure
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowAdminPanel(false)} 
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#6b7280',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ❌ Fermer
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Statistiques et objectifs du groupe sélectionné */}
                    {selectedGroup && (
                        <div style={{ marginTop: '20px' }}>
                            <GroupStats groupId={selectedGroup.id} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default GroupSection;
