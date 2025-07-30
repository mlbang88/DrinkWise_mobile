import React, { useState, useContext } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import FriendItem from '../components/FriendItem';
import LoadingIcon from '../components/LoadingIcon';
import { badgeService } from '../services/badgeService';

const FriendsPage = ({ setCurrentPage, setSelectedFriendId }) => {
    const { db, user, appId, userProfile, setMessageBox } = useContext(FirebaseContext);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);

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

    const handleAddFriend = async (friendId) => {
        console.log("➕ Ajout d'ami:", friendId);
        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
        try {
            await updateDoc(userProfileRef, { friends: arrayUnion(friendId) });
            console.log("✅ Ami ajouté avec succès");
            setMessageBox({ message: "Ami ajouté !", type: "success" });
        } catch (error) {
            console.error("❌ Erreur ajout ami:", error);
            setMessageBox({ message: "Erreur ajout ami.", type: "error" });
        }
    };

    const handleRemoveFriend = async (friendId) => {
        const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
        try {
            await updateDoc(userProfileRef, { friends: arrayRemove(friendId) });
            setMessageBox({ message: "Ami supprimé.", type: "info" });
        } catch (error) {
            setMessageBox({ message: "Erreur suppression ami.", type: "error" });
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
                                        onClick={() => handleAddFriend(result.id)}
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
                                        + Ajouter
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

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
