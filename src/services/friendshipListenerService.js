import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

// Service pour écouter les changements d'amitié et déclencher la synchronisation automatique
export const friendshipListenerService = {
    // Écouter les demandes d'amis acceptées et déclencher la synchronisation
    startListening: (db, appId, userId, setMessageBox, functions) => {
        console.log("🤝 Démarrage de l'écoute des amitiés avec auto-sync");

        // Fonction Firebase pour la synchronisation
        const syncFriendshipRequest = httpsCallable(functions, 'syncFriendshipRequest');

        // Écouter les demandes acceptées où on est le destinataire (to)
        const acceptedRequestsQuery = query(
            collection(db, `artifacts/${appId}/friend_requests`),
            where('to', '==', userId),
            where('status', '==', 'accepted')
        );

        const unsubscribeAccepted = onSnapshot(acceptedRequestsQuery, async (snapshot) => {
            for (const docChange of snapshot.docChanges()) {
                if (docChange.type === 'added') {
                    const request = docChange.doc.data();
                    const requestId = docChange.doc.id;
                    
                    console.log("🎉 Nouvelle amitié détectée (destinataire):", request);
                    
                    // Déclencher la synchronisation automatique via Firebase Function
                    try {
                        const result = await syncFriendshipRequest({ requestId, appId });
                        if (result.data.success) {
                            console.log("✅ Synchronisation automatique réussie:", result.data.message);
                            
                            if (setMessageBox) {
                                setMessageBox({ 
                                    message: `Vous êtes maintenant ami avec ${request.fromUsername}!`, 
                                    type: "success" 
                                });
                            }
                        } else {
                            console.error("❌ Échec synchronisation automatique:", result.data.error);
                        }
                    } catch (error) {
                        console.error("❌ Erreur appel fonction synchronisation:", error);
                    }
                }
            }
        }, (error) => {
            console.log("ℹ️ Erreur d'écoute des demandes acceptées:", error.code);
        });

        // Écouter les demandes acceptées où on est l'expéditeur (from) 
        const sentAcceptedQuery = query(
            collection(db, `artifacts/${appId}/friend_requests`),
            where('from', '==', userId),
            where('status', '==', 'accepted')
        );

        const unsubscribeSentAccepted = onSnapshot(sentAcceptedQuery, async (snapshot) => {
            for (const docChange of snapshot.docChanges()) {
                if (docChange.type === 'added') {
                    const request = docChange.doc.data();
                    const requestId = docChange.doc.id;
                    
                    console.log("🎉 Ma demande a été acceptée:", request);
                    
                    // Déclencher la synchronisation automatique via Firebase Function
                    try {
                        const result = await syncFriendshipRequest({ requestId, appId });
                        if (result.data.success) {
                            console.log("✅ Synchronisation automatique réussie:", result.data.message);
                            
                            if (setMessageBox) {
                                setMessageBox({ 
                                    message: `${request.toUsername} a accepté votre demande d'ami!`, 
                                    type: "success" 
                                });
                            }
                        } else {
                            console.error("❌ Échec synchronisation automatique:", result.data.error);
                        }
                    } catch (error) {
                        console.error("❌ Erreur appel fonction synchronisation:", error);
                    }
                }
            }
        }, (error) => {
            console.log("ℹ️ Erreur d'écoute des demandes envoyées:", error.code);
        });

        // Retourner une fonction pour arrêter l'écoute
        return () => {
            unsubscribeAccepted();
            unsubscribeSentAccepted();
        };
    }
};
