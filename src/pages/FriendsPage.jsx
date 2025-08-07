import React, { useState, useContext } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove, addDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import FriendItem from '../components/FriendItem';
import LoadingIcon from '../components/LoadingIcon';
import GroupSection from '../components/GroupSection.jsx';
import FriendRequestSystem from '../components/FriendRequestSystem.jsx';
import { badgeService } from '../services/badgeService';

const FriendsPage = ({ setCurrentPage, setSelectedFriendId }) => {
    const { db, user, appId, userProfile, setMessageBox, functions } = useContext(FirebaseContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [friendIdInput, setFriendIdInput] = useState('');
    const [loadingAddById, setLoadingAddById] = useState(false);

    // Fonction de diagnostic
    const runDiagnostic = async () => {
        console.log("🔍 Fonctionnalité désactivée");
    };

    // Fonction d'ajout forcé d'ami (désactivée)
    const forceAddFriend = async (friendId) => {
        console.log('🔧 Fonctionnalité désactivée');
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) return setSearchResults([]);
        setLoadingSearch(true);
        try {
            console.log("🔍 Recherche d'amis pour:", searchTerm);
            const profilesRef = collection(db, `artifacts/${appId}/public_user_stats`);
            const q = query(profilesRef,
                where("username_lowercase", ">=", searchTerm.toLowerCase()),
                where("username_lowercase", "<=", searchTerm.toLowerCase() + '\uf8ff')
            );
            const querySnapshot = await getDocs(q);
            console.log("📊 Résultats bruts:", querySnapshot.docs.length);
            const results = querySnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(p => p.id !== user.uid);
            console.log("✅ Résultats filtrés:", results);
            setSearchResults(results);
        } catch (error) {
            console.error("Erreur recherche amis:", error);
            setMessageBox({ message: "Erreur lors de la recherche.", type: "error" });
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSendFriendRequestById = async () => {
        if (!friendIdInput.trim()) {
            setMessageBox({ message: "Veuillez entrer un ID d'utilisateur.", type: "error" });
            return;
        }

        if (friendIdInput === user.uid) {
            setMessageBox({ message: "Vous ne pouvez pas vous ajouter vous-même.", type: "error" });
            return;
        }

        setLoadingAddById(true);
        try {
            // Vérifier que l'utilisateur existe
            const friendStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, friendIdInput);
            const friendDoc = await getDoc(friendStatsRef);
            
            if (!friendDoc.exists()) {
                setMessageBox({ message: "Utilisateur introuvable avec cet ID.", type: "error" });
                setLoadingAddById(false);
                return;
            }

            // Vérifier si déjà ami
            const currentUserStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
            const currentUserDoc = await getDoc(currentUserStatsRef);
            
            if (currentUserDoc.exists()) {
                const currentFriends = currentUserDoc.data().friends || [];
                if (currentFriends.includes(friendIdInput)) {
                    setMessageBox({ message: "Cet utilisateur est déjà votre ami.", type: "info" });
                    setLoadingAddById(false);
                    return;
                }
            }

            // Vérifier si une demande existe déjà
            const requestQuery = query(
                collection(db, `artifacts/${appId}/friend_requests`),
                where('from', '==', user.uid),
                where('to', '==', friendIdInput),
                where('status', 'in', ['pending', 'accepted'])
            );
            const existingRequests = await getDocs(requestQuery);
            
            if (!existingRequests.empty) {
                setMessageBox({ message: "Demande d'ami déjà envoyée ou ami déjà accepté.", type: "info" });
                setLoadingAddById(false);
                return;
            }

            // Envoyer la demande d'ami
            await addDoc(collection(db, `artifacts/${appId}/friend_requests`), {
                from: user.uid,
                to: friendIdInput,
                status: 'pending',
                timestamp: new Date(),
                fromUsername: currentUserDoc.data()?.username || 'Utilisateur',
                toUsername: friendDoc.data()?.username || 'Utilisateur'
            });
            
            setMessageBox({ 
                message: `Demande d'ami envoyée à ${friendDoc.data()?.username || friendIdInput}!`, 
                type: "success" 
            });
            setFriendIdInput('');
            
        } catch (error) {
            console.error("❌ Erreur envoi demande ami:", error);
            setMessageBox({ message: "Erreur lors de l'envoi de la demande.", type: "error" });
        } finally {
            setLoadingAddById(false);
        }
    };

    const handleSendFriendRequest = async (friendId) => {
        console.log("📤 Envoi demande d'ami à:", friendId);
        try {
            // Vérifier si déjà ami
            const currentUserStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
            const currentUserDoc = await getDoc(currentUserStatsRef);
            
            if (currentUserDoc.exists()) {
                const currentFriends = currentUserDoc.data().friends || [];
                if (currentFriends.includes(friendId)) {
                    setMessageBox({ message: "Cet utilisateur est déjà votre ami.", type: "info" });
                    return;
                }
            }

            // Vérifier si une demande existe déjà
            const requestQuery = query(
                collection(db, `artifacts/${appId}/friend_requests`),
                where('from', '==', user.uid),
                where('to', '==', friendId),
                where('status', 'in', ['pending', 'accepted'])
            );
            const existingRequests = await getDocs(requestQuery);
            
            if (!existingRequests.empty) {
                setMessageBox({ message: "Demande d'ami déjà envoyée.", type: "info" });
                return;
            }

            // Obtenir les informations des utilisateurs
            const friendStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, friendId);
            const friendDoc = await getDoc(friendStatsRef);

            // Envoyer la demande d'ami
            await addDoc(collection(db, `artifacts/${appId}/friend_requests`), {
                from: user.uid,
                to: friendId,
                status: 'pending',
                timestamp: new Date(),
                fromUsername: currentUserDoc.data()?.username || 'Utilisateur',
                toUsername: friendDoc.exists() ? friendDoc.data()?.username || 'Utilisateur' : 'Utilisateur'
            });

            console.log("✅ Demande d'ami envoyée avec succès");
            setMessageBox({ message: "Demande d'ami envoyée !", type: "success" });
        } catch (error) {
            console.error("❌ Erreur envoi demande ami:", error);
            setMessageBox({ message: "Erreur envoi demande ami.", type: "error" });
        }
    };

    const handleRemoveFriend = async (friendId) => {
        try {
            console.log("🗑️ Suppression bidirectionnelle de l'ami:", friendId);
            
            // Appeler la Firebase Function pour supprimer de manière bidirectionnelle
            const removeFriendship = httpsCallable(functions, 'removeFriendship');
            const result = await removeFriendship({ friendId, appId });
            
            if (result.data.success) {
                console.log("✅ Suppression bidirectionnelle réussie:", result.data.message);
                setMessageBox({ message: "Ami supprimé des deux côtés !", type: "success" });
            } else {
                console.error("❌ Échec suppression:", result.data.error);
                setMessageBox({ message: "Erreur lors de la suppression.", type: "error" });
            }
        } catch (error) {
            console.error("❌ Erreur suppression ami:", error);
            setMessageBox({ message: "Erreur lors de la suppression.", type: "error" });
        }
    };

    const handleViewFriendStats = (friendId) => {
        setSelectedFriendId(friendId);
        setCurrentPage('friendStats');
    };

    const handleForceUpdateStats = async () => {
        console.log("🔄 Mise à jour forcée des stats publiques");
        await badgeService.updatePublicStats(db, user, appId, userProfile);
        setMessageBox({ message: "Stats publiques mises à jour !", type: "success" });
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url("https://plus.unsplash.com/premium_photo-1661715804059-cc71a28f2c34?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center/cover',
            padding: '20px',
            fontFamily: 'Arial, sans-serif'
        }}>
            <h2 style={{
                color: 'white',
                fontSize: '32px',
                fontWeight: 'bold',
                textAlign: 'center',
                margin: '0 0 20px 0'
            }}>
                Amis
            </h2>

            {/* Système de demandes d'amis */}
            <FriendRequestSystem />

            {/* Bouton de debug */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <button 
                    onClick={handleForceUpdateStats}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#8b5cf6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                    }}
                >
                    🔄 Mettre à jour mes stats publiques
                </button>
            </div>

            {/* Section Ajouter des Amis */}
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <h3 style={{
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: '0 0 20px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    👥 Ajouter des Amis
                </h3>

                {/* Barre de recherche */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '20px'
                }}>
                    <input 
                        type="text" 
                        placeholder="Rechercher par nom" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '16px',
                            fontSize: '16px',
                            backgroundColor: '#1a1a2e',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '12px',
                            outline: 'none',
                            minWidth: 0
                        }}
                    />
                    <button 
                        onClick={handleSearch} 
                        disabled={loadingSearch}
                        style={{
                            padding: '16px 16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: 'white',
                            backgroundColor: '#3b82f6',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: loadingSearch ? 'not-allowed' : 'pointer',
                            opacity: loadingSearch ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {loadingSearch ? <LoadingIcon /> : null}
                        🔍
                    </button>
                </div>

                {/* Résultats de recherche */}
                {searchResults.length > 0 && (
                    <div style={{
                        maxHeight: '200px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}>
                        {searchResults.map(result => (
                            <div key={result.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px',
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <span style={{
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '500'
                                }}>
                                    {result.username}
                                </span>
                                {!(userProfile?.friends || []).includes(result.id) && (
                                    <button 
                                        onClick={() => handleSendFriendRequest(result.id)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        📤 Inviter
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Section d'ajout par ID */}
                <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <h3 style={{
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 16px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        🆔 Ajouter un ami par ID
                    </h3>
                    
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'stretch'
                    }}>
                        <input 
                            type="text" 
                            placeholder="ID de l'utilisateur (ex: T4mDJvOVKFPJEzBVr3VuWQPPA2x2)" 
                            value={friendIdInput} 
                            onChange={(e) => setFriendIdInput(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '16px',
                                fontSize: '14px',
                                backgroundColor: '#1a1a2e',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '12px',
                                outline: 'none',
                                minWidth: 0,
                                fontFamily: 'monospace'
                            }}
                        />
                        <button 
                            onClick={handleSendFriendRequestById} 
                            disabled={loadingAddById || !friendIdInput.trim()}
                            style={{
                                padding: '16px 20px',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: 'white',
                                backgroundColor: loadingAddById || !friendIdInput.trim() ? '#666' : '#10b981',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: loadingAddById || !friendIdInput.trim() ? 'not-allowed' : 'pointer',
                                opacity: loadingAddById || !friendIdInput.trim() ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                flexShrink: 0,
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {loadingAddById ? <LoadingIcon /> : null}
                            📤 Inviter
                        </button>
                    </div>
                    
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        fontSize: '12px',
                        margin: '12px 0 0 0',
                        fontStyle: 'italic'
                    }}>
                        Votre ID utilisateur : <span style={{ fontFamily: 'monospace', color: '#10b981' }}>{user?.uid}</span>
                    </p>
                </div>
            </div>

            {/* Section Groupes */}
            <GroupSection />

            {/* Section Votre Liste d'Amis */}
            <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '24px'
            }}>
                <h3 style={{
                    color: 'white',
                    fontSize: '20px',
                    fontWeight: '600',
                    margin: '0 0 20px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    💖 Votre Liste d'Amis
                </h3>

                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                }}>
                    {(userProfile?.friends || []).length > 0 ? (
                        userProfile.friends.map(friendId => (
                            <FriendItem 
                                key={friendId} 
                                friendId={friendId} 
                                onRemove={handleRemoveFriend} 
                                onViewStats={handleViewFriendStats} 
                                appId={appId} 
                                db={db} 
                            />
                        ))
                    ) : (
                        <p style={{
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '16px',
                            fontStyle: 'italic',
                            padding: '32px 0'
                        }}>
                            Ajoutez des amis pour les voir ici.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FriendsPage;
