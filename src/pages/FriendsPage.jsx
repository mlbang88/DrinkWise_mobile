import React, { useState, useContext } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion, arrayRemove, addDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import FriendItem from '../components/FriendItem';
import LoadingIcon from '../components/LoadingIcon';
import GroupSection from '../components/GroupSection.jsx';
import FriendRequestSystem from '../components/FriendRequestSystem.jsx';
import FriendsLeaderboard from '../components/FriendsLeaderboard.jsx';
import { badgeService } from '../services/badgeService';
import FloatingParticles from '../components/FloatingParticles';

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
            console.error("Erreur recherche amis:", error?.message || String(error));
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
            console.error("❌ Erreur envoi demande ami:", error?.message || String(error));
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
            console.error("❌ Erreur envoi demande ami:", error?.message || String(error));
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
            console.error("❌ Erreur suppression ami:", error?.message || String(error));
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
        <div 
            className="page-modern"
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                backgroundAttachment: 'fixed',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Floating Particles Background */}
            <FloatingParticles count={15} />
            
            <h2 style={{
                background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #f472b6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: 'clamp(28px, 8vw, 36px)',
                fontWeight: '800',
                textAlign: 'center',
                margin: '0 0 32px 0',
                letterSpacing: '-0.03em',
                textShadow: '0 2px 20px rgba(167, 139, 250, 0.4)',
                position: 'relative',
                zIndex: 1
            }}>
                👥 Mes Amis
            </h2>

            {/* Système de demandes d'amis */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <FriendRequestSystem />
            </div>

            {/* Classement des amis */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                <FriendsLeaderboard selectedCategory="level" title="🏆 Classement par Niveau" />
            </div>

            {/* Bouton de debug */}
            <div style={{ textAlign: 'center', marginBottom: '24px', position: 'relative', zIndex: 1 }}>
                <button 
                    onClick={handleForceUpdateStats}
                    style={{
                        padding: '12px 20px',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)',
                        backdropFilter: 'blur(8px)',
                        color: 'white',
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                        transition: 'all 0.3s ease',
                        letterSpacing: '-0.01em'
                    }}
                    aria-label="Mettre à jour les statistiques publiques"
                >
                    🔄 Mettre à jour mes stats publiques
                </button>
            </div>

            {/* Section Ajouter des Amis */}
            <div style={{
                background: 'rgba(30, 30, 46, 0.6)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                padding: '28px',
                marginBottom: '32px',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                zIndex: 1
            }}>
                <h3 style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(18px, 5vw, 22px)',
                    fontWeight: '700',
                    margin: '0 0 24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    letterSpacing: '-0.02em'
                }}>
                    👥 Ajouter des Amis
                </h3>

                {/* Barre de recherche */}
                <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginBottom: '24px'
                }}>
                    <input 
                        type="text" 
                        placeholder="🔍 Rechercher par nom..." 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '16px 20px',
                            fontSize: '16px',
                            background: 'rgba(255, 255, 255, 0.08)',
                            backdropFilter: 'blur(8px)',
                            color: 'white',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '16px',
                            outline: 'none',
                            minWidth: 0,
                            transition: 'all 0.3s ease',
                            '::placeholder': {
                                color: 'rgba(255, 255, 255, 0.5)'
                            }
                        }}
                    />
                    <button 
                        onClick={handleSearch} 
                        disabled={loadingSearch}
                        style={{
                            padding: '16px 20px',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'white',
                            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(37, 99, 235, 0.9) 100%)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '16px',
                            cursor: loadingSearch ? 'not-allowed' : 'pointer',
                            opacity: loadingSearch ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
                        aria-label="Rechercher des amis"
                    >
                        {loadingSearch ? <LoadingIcon /> : null}
                        🔍
                    </button>
                </div>

                {/* Résultats de recherche */}
                {searchResults.length > 0 && (
                    <div style={{
                        maxHeight: '240px',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginBottom: '20px'
                    }}>
                        {searchResults.map(result => (
                            <div key={result.id} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '18px 20px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                backdropFilter: 'blur(8px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        fontWeight: '700',
                                        color: 'white'
                                    }}>
                                        {result.username?.charAt(0).toUpperCase()}
                                    </div>
                                    <span style={{
                                        color: 'white',
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        letterSpacing: '-0.01em'
                                    }}>
                                        {result.username}
                                    </span>
                                </div>
                                {!(userProfile?.friends || []).includes(result.id) && (
                                    <button 
                                        onClick={() => handleSendFriendRequest(result.id)}
                                        style={{
                                            padding: '10px 16px',
                                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                                            backdropFilter: 'blur(8px)',
                                            color: 'white',
                                            border: '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                            transition: 'all 0.2s ease'
                                        }}
                                        aria-label={`Inviter ${result.username}`}
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
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '24px',
                    marginBottom: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    width: '100%',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
                }}>
                    <h3 style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        fontSize: '18px',
                        fontWeight: '700',
                        margin: '0 0 20px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        letterSpacing: '-0.01em'
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
                            placeholder="🆔 ID de l'utilisateur (ex: T4mDJvOVKFPJEzBVr3VuWQPPA2x2)" 
                            value={friendIdInput} 
                            onChange={(e) => setFriendIdInput(e.target.value)}
                            style={{
                                flex: 1,
                                padding: '16px 20px',
                                fontSize: '14px',
                                background: 'rgba(255, 255, 255, 0.08)',
                                backdropFilter: 'blur(8px)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '16px',
                                outline: 'none',
                                minWidth: 0,
                                fontFamily: 'monospace',
                                transition: 'all 0.3s ease'
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
                                background: loadingAddById || !friendIdInput.trim() ? 
                                    'rgba(107, 114, 128, 0.7)' : 
                                    'linear-gradient(135deg, rgba(16, 185, 129, 0.9) 0%, rgba(5, 150, 105, 0.9) 100%)',
                                backdropFilter: 'blur(8px)',
                                border: loadingAddById || !friendIdInput.trim() ? 
                                    '1px solid rgba(107, 114, 128, 0.3)' : 
                                    '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '16px',
                                cursor: loadingAddById || !friendIdInput.trim() ? 'not-allowed' : 'pointer',
                                opacity: loadingAddById || !friendIdInput.trim() ? 0.7 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                boxShadow: loadingAddById || !friendIdInput.trim() ? 
                                    'none' : 
                                    '0 4px 16px rgba(16, 185, 129, 0.3)',
                                transition: 'all 0.3s ease'
                            }}
                            aria-label="Inviter un ami par ID"
                        >
                            {loadingAddById ? <LoadingIcon /> : null}
                            📤 Inviter
                        </button>
                    </div>
                    
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '16px',
                        marginTop: '16px',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.8)',
                            fontSize: '13px',
                            margin: '0 0 8px 0',
                            fontWeight: '500'
                        }}>
                            🏷️ Votre ID utilisateur :
                        </p>
                        <p style={{
                            fontFamily: 'monospace',
                            color: '#10b981',
                            fontSize: '12px',
                            margin: 0,
                            fontWeight: '600',
                            wordBreak: 'break-all',
                            background: 'rgba(16, 185, 129, 0.1)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            {user?.uid}
                        </p>
                    </div>
                </div>
            </div>

            {/* Section Groupes */}
            <GroupSection />

            {/* Section Votre Liste d'Amis */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '28px',
                width: '100%',
                boxSizing: 'border-box',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
                <h3 style={{
                    background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(18px, 5vw, 22px)',
                    fontWeight: '700',
                    margin: '0 0 24px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    letterSpacing: '-0.02em',
                    textAlign: 'center',
                    justifyContent: 'center'
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
