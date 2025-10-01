// src/components/GroupSection.jsx
import React, { useState, useEffect, useContext } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { groupService } from '../services/groupService.js';
import GroupStats from './GroupStats.jsx';
import UserAvatar from './UserAvatar';

const GroupSection = () => {
    const { db, user, appId, userProfile, setMessageBox } = useContext(FirebaseContext);
    
    // États pour les groupes
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [memberProfiles, setMemberProfiles] = useState({});
    
    // États pour les formulaires
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDescription, setNewGroupDescription] = useState('');
    const [inviteUsername, setInviteUsername] = useState('');
    
    // Fonction pour charger les profils des membres
    const loadMemberProfiles = async (memberIds) => {
        const profiles = {};
        for (const memberId of memberIds) {
            if (!memberProfiles[memberId]) {
                try {
                    const userDoc = await getDoc(doc(db, `artifacts/${appId}/public_user_stats`, memberId));
                    if (userDoc.exists()) {
                        profiles[memberId] = {
                            id: memberId,
                            displayName: userDoc.data().displayName || 'Utilisateur',
                            photoURL: userDoc.data().photoURL || null
                        };
                    }
                } catch (err) {
                    console.error('Erreur lors du chargement du profil:', err);
                }
            }
        }
        
        if (Object.keys(profiles).length > 0) {
            setMemberProfiles(prev => ({...prev, ...profiles}));
        }
    };
    
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

    // Fonction pour sélectionner un groupe et charger les profils des membres
    const handleSelectGroup = async (group) => {
        const newSelectedGroup = selectedGroup?.id === group.id ? null : group;
        setSelectedGroup(newSelectedGroup);
        
        // Si on sélectionne un groupe, charger les profils des membres
        if (newSelectedGroup && newSelectedGroup.members) {
            await loadMemberProfiles(newSelectedGroup.members);
        }
    };

    // Vérifier si l'utilisateur est admin du groupe sélectionné
    const isCurrentUserAdmin = () => {
        return selectedGroup && groupService.isUserAdmin(selectedGroup, user.uid);
    };

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.06))',
            borderRadius: '28px',
            padding: '28px',
            marginBottom: '24px',
            backdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}>
            <h3 style={{
                backgroundImage: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '26px',
                fontWeight: '800',
                marginBottom: '24px',
                textAlign: 'center',
                letterSpacing: '-0.02em'
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
                            <p style={{ 
                                color: 'rgba(255, 255, 255, 0.7)', 
                                textAlign: 'center',
                                fontSize: '16px',
                                fontWeight: '500',
                                padding: '32px'
                            }}>
                                Aucun groupe trouvé. Créez votre premier groupe !
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {groups.map(group => (
                                    <div 
                                        key={group.id}
                                        onClick={() => handleSelectGroup(group)}
                                        style={{
                                            padding: '20px',
                                            background: selectedGroup?.id === group.id 
                                                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.35), rgba(124, 58, 237, 0.25))' 
                                                : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
                                            backdropFilter: 'blur(15px)',
                                            borderRadius: '20px',
                                            cursor: 'pointer',
                                            border: selectedGroup?.id === group.id 
                                                ? '2px solid rgba(139, 92, 246, 0.6)' 
                                                : '1px solid rgba(255, 255, 255, 0.2)',
                                            transition: 'all 0.3s ease',
                                            boxShadow: selectedGroup?.id === group.id 
                                                ? '0 8px 25px rgba(139, 92, 246, 0.3)'
                                                : '0 4px 15px rgba(0, 0, 0, 0.1)',
                                            transform: selectedGroup?.id === group.id ? 'translateY(-2px)' : 'translateY(0)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ 
                                                    backgroundImage: 'linear-gradient(135deg, #ffffff, #e2e8f0)',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                    backgroundClip: 'text',
                                                    margin: '0 0 8px 0', 
                                                    fontSize: '19px',
                                                    fontWeight: '700',
                                                    letterSpacing: '-0.01em'
                                                }}>
                                                    {group.name}
                                                </h4>
                                                {group.description && (
                                                    <p style={{ 
                                                        color: 'rgba(255, 255, 255, 0.75)', 
                                                        margin: '0', 
                                                        fontSize: '15px',
                                                        fontWeight: '500',
                                                        lineHeight: '1.4'
                                                    }}>
                                                        {group.description}
                                                    </p>
                                                )}
                                            </div>
                                            <div style={{ 
                                                color: 'rgba(255, 255, 255, 0.7)', 
                                                fontSize: '15px',
                                                fontWeight: '600',
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                backdropFilter: 'blur(8px)',
                                                padding: '6px 12px',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255, 255, 255, 0.2)'
                                            }}>
                                                👥 {group.members?.length || 0} membre{(group.members?.length || 0) > 1 ? 's' : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Boutons d'action */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            style={{
                                padding: '14px 24px',
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                backdropFilter: 'blur(10px)',
                                color: 'white',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                fontSize: '15px',
                                fontWeight: '700',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 6px 18px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            ➕ Créer un groupe
                        </button>

                        {selectedGroup && (
                            <button
                                onClick={() => setShowInviteForm(!showInviteForm)}
                                style={{
                                    padding: '14px 24px',
                                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                    backdropFilter: 'blur(10px)',
                                    color: 'white',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    fontSize: '15px',
                                    fontWeight: '700',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 6px 18px rgba(59, 130, 246, 0.3)'
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
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <UserAvatar 
                                                userId={memberId}
                                                photoURL={memberProfiles[memberId]?.photoURL}
                                                displayName={memberProfiles[memberId]?.displayName}
                                                size="small"
                                            />
                                            <div>
                                                <span style={{ color: 'white', fontWeight: 'bold' }}>
                                                    {memberId === user.uid ? 'Vous' : (memberProfiles[memberId]?.displayName || `Membre: ${memberId.substring(0, 8)}...`)}
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
