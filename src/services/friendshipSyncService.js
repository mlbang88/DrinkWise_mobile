import { collection, query, where, onSnapshot, updateDoc, doc, arrayUnion, deleteDoc } from 'firebase/firestore';

// Service pour synchroniser les relations d'amitié bidirectionnelles
export const friendshipSyncService = {
    // Écouter et traiter les demandes d'amis acceptées
    startListening: (db, appId, userId, setMessageBox) => {
        // Écouter les demandes acceptées où on est le destinataire (to)
        const acceptedRequestsQuery = query(
            collection(db, `artifacts/${appId}/friend_requests`),
            where('to', '==', userId),
            where('status', '==', 'accepted')
        );

        const unsubscribeAccepted = onSnapshot(acceptedRequestsQuery, async (snapshot) => {
            for (const docChange of snapshot.docChanges()) {
                if (docChange.type === 'added' || docChange.type === 'modified') {
                    const request = docChange.doc.data();
                    const requestId = docChange.doc.id;
                    
                    console.log("🤝 Synchronisation relation d'amitié:", request);
                    
                    try {
                        // Ajouter l'expéditeur à nos listes d'amis
                        const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
                        const userStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, userId);
                        
                        await updateDoc(userProfileRef, {
                            friends: arrayUnion(request.from)
                        });
                        
                        await updateDoc(userStatsRef, {
                            friends: arrayUnion(request.from)
                        });
                        
                        // Ajouter notre ID aux listes de l'expéditeur
                        const friendProfileRef = doc(db, `artifacts/${appId}/users/${request.from}/profile`, 'data');
                        const friendStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, request.from);
                        
                        await updateDoc(friendProfileRef, {
                            friends: arrayUnion(userId)
                        });
                        
                        await updateDoc(friendStatsRef, {
                            friends: arrayUnion(userId)
                        });
                        
                        // Supprimer la demande après synchronisation
                        await deleteDoc(doc(db, `artifacts/${appId}/friend_requests`, requestId));
                        
                        console.log("✅ Relation d'amitié synchronisée avec", request.fromUsername);
                        if (setMessageBox) {
                            setMessageBox({ 
                                message: `Vous êtes maintenant ami avec ${request.fromUsername}!`, 
                                type: "success" 
                            });
                        }
                        
                    } catch (error) {
                        console.error("❌ Erreur synchronisation amitié:", error);
                    }
                }
            }
        });

        // Écouter les demandes acceptées où on est l'expéditeur (from) 
        const sentAcceptedQuery = query(
            collection(db, `artifacts/${appId}/friend_requests`),
            where('from', '==', userId),
            where('status', '==', 'accepted')
        );

        const unsubscribeSentAccepted = onSnapshot(sentAcceptedQuery, async (snapshot) => {
            for (const docChange of snapshot.docChanges()) {
                if (docChange.type === 'added' || docChange.type === 'modified') {
                    const request = docChange.doc.data();
                    const requestId = docChange.doc.id;
                    
                    console.log("🤝 Ma demande a été acceptée:", request);
                    
                    try {
                        // Ajouter le destinataire à nos listes d'amis
                        const userProfileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
                        const userStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, userId);
                        
                        await updateDoc(userProfileRef, {
                            friends: arrayUnion(request.to)
                        });
                        
                        await updateDoc(userStatsRef, {
                            friends: arrayUnion(request.to)
                        });
                        
                        // Supprimer la demande après synchronisation
                        await deleteDoc(doc(db, `artifacts/${appId}/friend_requests`, requestId));
                        
                        console.log("✅ Ma demande acceptée synchronisée avec", request.toUsername);
                        if (setMessageBox) {
                            setMessageBox({ 
                                message: `${request.toUsername} a accepté votre demande d'ami!`, 
                                type: "success" 
                            });
                        }
                        
                    } catch (error) {
                        console.error("❌ Erreur synchronisation demande acceptée:", error);
                    }
                }
            }
        });

        // Retourner une fonction pour arrêter l'écoute
        return () => {
            unsubscribeAccepted();
            unsubscribeSentAccepted();
        };
    }
};
