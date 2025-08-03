import React, { useState, useContext } from 'react';
import { collection, query, getDocs, updateDoc, doc, arrayRemove, getDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';

const FriendshipDataFixer = () => {
    const { db, user, appId } = useContext(FirebaseContext);
    const [isFixing, setIsFixing] = useState(false);
    const [results, setResults] = useState([]);

    const fixBidirectionalFriendships = async () => {
        if (!user) return;
        
        setIsFixing(true);
        setResults([]);
        const fixResults = [];

        try {
            // Obtenir votre liste d'amis
            const userStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
            const userDoc = await getDoc(userStatsRef);
            
            if (!userDoc.exists()) {
                fixResults.push("❌ Votre profil public n'existe pas");
                setResults(fixResults);
                setIsFixing(false);
                return;
            }

            const userFriends = userDoc.data().friends || [];
            fixResults.push(`📋 Vous avez ${userFriends.length} amis dans votre liste`);

            for (const friendId of userFriends) {
                try {
                    // Vérifier si l'ami a votre ID dans sa liste
                    const friendStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, friendId);
                    const friendDoc = await getDoc(friendStatsRef);
                    
                    if (!friendDoc.exists()) {
                        fixResults.push(`⚠️ Ami ${friendId}: profil public n'existe pas`);
                        continue;
                    }

                    const friendFriends = friendDoc.data().friends || [];
                    const friendUsername = friendDoc.data().username || 'Utilisateur inconnu';
                    
                    if (!friendFriends.includes(user.uid)) {
                        fixResults.push(`🔧 ${friendUsername} (${friendId}): relation unilatérale détectée - vous supprimant de votre liste`);
                        
                        // Supprimer cet ami de votre liste car la relation n'est pas bidirectionnelle
                        await updateDoc(userStatsRef, { friends: arrayRemove(friendId) });
                        
                        fixResults.push(`✅ ${friendUsername}: supprimé de votre liste d'amis`);
                    } else {
                        fixResults.push(`✅ ${friendUsername} (${friendId}): relation bidirectionnelle OK`);
                    }
                } catch (error) {
                    fixResults.push(`❌ Erreur avec ami ${friendId}: ${error.message}`);
                }
                
                // Mettre à jour l'affichage en temps réel
                setResults([...fixResults]);
                await new Promise(resolve => setTimeout(resolve, 500)); // Pause pour voir les résultats
            }

            fixResults.push("🎉 Nettoyage terminé! Vous pouvez maintenant envoyer des demandes d'amis properly.");
            
        } catch (error) {
            fixResults.push(`❌ Erreur générale: ${error.message}`);
        }

        setResults(fixResults);
        setIsFixing(false);
    };

    const removeAllFriends = async () => {
        if (!user) return;
        
        setIsFixing(true);
        setResults([]);
        const fixResults = [];
        
        try {
            fixResults.push("🧹 Début du nettoyage complet...");
            setResults([...fixResults]);
            
            // 1. Supprimer de votre profil principal (qui affiche dans l'interface)
            const userProfileRef = doc(db, `artifacts/${appId}/users/${user.uid}/profile`, 'data');
            const userProfileDoc = await getDoc(userProfileRef);
            
            if (userProfileDoc.exists()) {
                const profileFriends = userProfileDoc.data().friends || [];
                fixResults.push(`📋 ${profileFriends.length} amis trouvés dans votre PROFIL PRINCIPAL`);
                
                await updateDoc(userProfileRef, { friends: [] });
                fixResults.push("✅ Amis supprimés du PROFIL PRINCIPAL");
                setResults([...fixResults]);
            }
            
            // 2. Supprimer de votre liste d'amis publique
            const userStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, user.uid);
            const userDoc = await getDoc(userStatsRef);
            
            if (!userDoc.exists()) {
                fixResults.push("❌ Votre profil public n'existe pas");
                setResults(fixResults);
                setIsFixing(false);
                return;
            }
            
            const currentFriends = userDoc.data().friends || [];
            fixResults.push(`📋 ${currentFriends.length} amis trouvés dans votre PROFIL PUBLIC`);
            setResults([...fixResults]);
            
            // 3. Supprimer votre ID de la liste de chaque ami
            for (const friendId of currentFriends) {
                try {
                    // Supprimer de leur profil principal
                    const friendProfileRef = doc(db, `artifacts/${appId}/users/${friendId}/profile`, 'data');
                    const friendProfileDoc = await getDoc(friendProfileRef);
                    
                    if (friendProfileDoc.exists()) {
                        const friendName = friendProfileDoc.data().username || 'Utilisateur inconnu';
                        await updateDoc(friendProfileRef, { friends: arrayRemove(user.uid) });
                        fixResults.push(`✅ Supprimé du PROFIL PRINCIPAL de ${friendName}`);
                    }
                    
                    // Supprimer de leur profil public
                    const friendStatsRef = doc(db, `artifacts/${appId}/public_user_stats`, friendId);
                    const friendDoc = await getDoc(friendStatsRef);
                    
                    if (friendDoc.exists()) {
                        const friendName = friendDoc.data().username || 'Utilisateur inconnu';
                        await updateDoc(friendStatsRef, { friends: arrayRemove(user.uid) });
                        fixResults.push(`✅ Supprimé du PROFIL PUBLIC de ${friendName}`);
                    } else {
                        fixResults.push(`⚠️ Ami ${friendId}: profil public inexistant`);
                    }
                } catch (error) {
                    fixResults.push(`❌ Erreur avec ami ${friendId}: ${error.message}`);
                }
                setResults([...fixResults]);
            }
            
            // 4. Vider votre liste d'amis publique
            await updateDoc(userStatsRef, { friends: [] });
            fixResults.push("✅ Votre liste d'amis publique vidée");
            
            // 5. Forcer le rechargement de la page pour mettre à jour l'interface
            fixResults.push("🔄 Rechargement de la page dans 2 secondes...");
            setResults([...fixResults]);
            
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            fixResults.push(`❌ Erreur: ${error.message}`);
            setResults(fixResults);
        }
        
        setIsFixing(false);
    };

    return (
        <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            borderRadius: '15px',
            padding: '20px',
            margin: '20px 0',
            border: '2px solid #f59e0b'
        }}>
            <h3 style={{ color: '#f59e0b', margin: '0 0 15px 0' }}>
                🔧 Réparateur de Relations d'Amitié
            </h3>
            
            <p style={{ color: 'white', fontSize: '14px', marginBottom: '15px' }}>
                Cet outil corrige les relations d'amitié non bidirectionnelles qui causent les erreurs de permissions.<br/>
                <strong style={{ color: '#f59e0b' }}>⚠️ Les amis peuvent être stockés dans 2 endroits:</strong> le profil principal ET le profil public.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                    onClick={fixBidirectionalFriendships}
                    disabled={isFixing}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: isFixing ? '#666' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isFixing ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {isFixing ? '🔄 Vérification...' : '🔍 Vérifier & Corriger'}
                </button>

                <button
                    onClick={removeAllFriends}
                    disabled={isFixing}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: isFixing ? '#666' : '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isFixing ? 'not-allowed' : 'pointer',
                        fontSize: '14px'
                    }}
                >
                    {isFixing ? '🔄 Suppression...' : '🗑️ Supprimer Tous'}
                </button>

                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px'
                    }}
                >
                    🔄 Recharger Page
                </button>
            </div>

            {results.length > 0 && (
                <div style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '8px',
                    padding: '15px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                }}>
                    <h4 style={{ color: 'white', margin: '0 0 10px 0' }}>Résultats:</h4>
                    {results.map((result, index) => (
                        <div key={index} style={{
                            color: result.includes('❌') ? '#ef4444' : 
                                   result.includes('⚠️') ? '#f59e0b' : 
                                   result.includes('✅') ? '#10b981' : 'white',
                            fontSize: '13px',
                            marginBottom: '5px',
                            fontFamily: 'monospace'
                        }}>
                            {result}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendshipDataFixer;
