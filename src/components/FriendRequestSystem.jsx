import React, { useState, useContext, useEffect } from 'react';
import { 
    collection, 
    addDoc, 
    deleteDoc, 
    doc, 
    query, 
    where, 
    onSnapshot, 
    updateDoc, 
    arrayUnion, 
    getDoc,
    getDocs
} from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import LoadingIcon from './LoadingIcon.jsx';

const FriendRequestSystem = () => {
    const { db, user, appId, setMessageBox } = useContext(FirebaseContext);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    // Écouter les demandes reçues
    useEffect(() => {
        if (!user || !db) return;

        const receivedQuery = query(
            collection(db, `artifacts/${appId}/friend_requests`),
            where('to', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("📥 Demandes reçues:", requests);
            setPendingRequests(requests);
            setLoading(false);
        });

        // Écouter les demandes envoyées
        const sentQuery = query(
            collection(db, `artifacts/${appId}/friend_requests`),
            where('from', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribeSent = onSnapshot(sentQuery, (snapshot) => {
            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            console.log("📤 Demandes envoyées:", requests);
            setSentRequests(requests);
        });

        return () => {
            unsubscribeReceived();
            unsubscribeSent();
        };
    }, [user, db, appId]);

    // Envoyer une demande d'amitié
    const sendFriendRequest = async (toUserId, toUserDisplayName) => {
        try {
            // Vérifier si une demande existe déjà
            const existingRequestQuery = query(
                collection(db, `artifacts/${appId}/friend_requests`),
                where('from', '==', user.uid),
                where('to', '==', toUserId),
                where('status', '==', 'pending')
            );

            const existingSnapshot = await getDocs(existingRequestQuery);
            if (!existingSnapshot.empty) {
                setMessageBox({ message: "Demande déjà envoyée !", type: "info" });
                return;
            }

            // Créer la demande
            await addDoc(collection(db, `artifacts/${appId}/friend_requests`), {
                from: user.uid,
                fromUsername: user.displayName || user.email || 'Utilisateur',
                to: toUserId,
                toUsername: toUserDisplayName,
                status: 'pending',
                timestamp: new Date()
            });

            setMessageBox({ message: "Demande d'amitié envoyée !", type: "success" });
        } catch (error) {
            console.error("Erreur envoi demande:", error);
            setMessageBox({ message: "Erreur lors de l'envoi.", type: "error" });
        }
    };

    // Accepter une demande d'amitié
    const acceptFriendRequest = async (requestId, fromUserId) => {
        try {
            console.log("🤝 Acceptation demande de:", fromUserId);
            
            // 1. Ajouter l'ami dans VOTRE profil principal (pour l'interface)
            const currentUserProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
            await updateDoc(currentUserProfileRef, {
                friends: arrayUnion(fromUserId)
            });
            console.log("✅ Ajouté au profil principal");

            // 2. Ajouter l'ami dans VOTRE profil public (pour les permissions)
            const currentUserStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
            await updateDoc(currentUserStatsRef, {
                friends: arrayUnion(fromUserId)
            });
            console.log("✅ Ajouté au profil public");

            // 3. Marquer la demande comme acceptée (pas supprimer tout de suite)
            const requestRef = doc(db, `artifacts/${appId}/friend_requests`, requestId);
            await updateDoc(requestRef, {
                status: 'accepted',
                acceptedAt: new Date()
            });
            console.log("✅ Demande marquée comme acceptée");

            setMessageBox({ 
                message: "Demande acceptée ! La relation sera complétée quand l'autre utilisateur se connectera.", 
                type: "success" 
            });
        } catch (error) {
            console.error("❌ Erreur acceptation demande:", error);
            setMessageBox({ message: "Erreur lors de l'acceptation.", type: "error" });
        }
    };

    // Refuser une demande d'amitié
    const rejectFriendRequest = async (requestId) => {
        try {
            const requestRef = doc(db, `artifacts/${appId}/friend_requests`, requestId);
            await updateDoc(requestRef, {
                status: 'rejected',
                updatedAt: new Date()
            });

            // Supprimer après un délai
            setTimeout(async () => {
                await deleteDoc(requestRef);
            }, 1000);

            setMessageBox({ message: "Demande refusée.", type: "info" });
        } catch (error) {
            console.error("Erreur refus demande:", error);
            setMessageBox({ message: "Erreur lors du refus.", type: "error" });
        }
    };

    // Annuler une demande envoyée
    const cancelSentRequest = async (requestId) => {
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/friend_requests`, requestId));
            setMessageBox({ message: "Demande annulée.", type: "info" });
        } catch (error) {
            console.error("Erreur annulation demande:", error);
            setMessageBox({ message: "Erreur lors de l'annulation.", type: "error" });
        }
    };

    if (loading) {
        return (
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '20px',
                textAlign: 'center'
            }}>
                <LoadingIcon />
                <p style={{ color: 'white', margin: '10px 0 0 0' }}>Chargement des demandes...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Demandes reçues */}
            {pendingRequests.length > 0 && (
                <div style={{
                    backgroundColor: 'rgba(255, 193, 7, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid rgba(255, 193, 7, 0.3)'
                }}>
                    <h3 style={{
                        color: '#ffc107',
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 16px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        🔔 Demandes d'Amitié Reçues ({pendingRequests.length})
                    </h3>

                    {pendingRequests.map(request => (
                        <div key={request.id} style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <p style={{
                                    color: 'white',
                                    fontWeight: '600',
                                    margin: '0 0 4px 0'
                                }}>
                                    {request.fromUsername}
                                </p>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '14px',
                                    margin: '0'
                                }}>
                                    Demande d'amitié
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => acceptFriendRequest(request.id, request.from)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ✅ Accepter
                                </button>
                                <button
                                    onClick={() => rejectFriendRequest(request.id)}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    ❌ Refuser
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Demandes envoyées */}
            {sentRequests.length > 0 && (
                <div style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '16px',
                    padding: '20px',
                    marginBottom: '20px',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                    <h3 style={{
                        color: '#3b82f6',
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 16px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        📤 Demandes Envoyées ({sentRequests.length})
                    </h3>

                    {sentRequests.map(request => (
                        <div key={request.id} style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <p style={{
                                    color: 'white',
                                    fontWeight: '600',
                                    margin: '0 0 4px 0'
                                }}>
                                    {request.toUsername}
                                </p>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.7)',
                                    fontSize: '14px',
                                    margin: '0'
                                }}>
                                    En attente de réponse...
                                </p>
                            </div>

                            <button
                                onClick={() => cancelSentRequest(request.id)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6b7280',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                🚫 Annuler
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendRequestSystem;
