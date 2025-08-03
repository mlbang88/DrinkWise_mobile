import React, { useContext, useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';

const FriendshipFixer = () => {
    const { db, user } = useContext(FirebaseContext);
    const [status, setStatus] = useState('');
    const [isFixing, setIsFixing] = useState(false);

    const fixFriendshipRelationships = async () => {
        if (!user || !db) {
            setStatus('❌ Utilisateur non connecté ou Firebase non initialisé');
            return;
        }

        setIsFixing(true);
        setStatus('🔧 Diagnostic du problème d\'amitié...');

        try {
            const currentUserId = user.uid;
            
            // Récupérer mes amis
            const currentUserRef = doc(db, 'artifacts/drinkwise-31d3a/public_user_stats', currentUserId);
            const currentUserDoc = await getDoc(currentUserRef);
            
            if (!currentUserDoc.exists()) {
                setStatus('❌ Document public_user_stats introuvable pour l\'utilisateur actuel');
                setIsFixing(false);
                return;
            }

            const myFriends = currentUserDoc.data().friends || [];
            setStatus(`📋 Mes amis trouvés: ${myFriends.length} - [${myFriends.join(', ')}]`);

            // Diagnostic détaillé
            for (const friendId of myFriends) {
                setStatus(prev => prev + `\n\n🔍 Diagnostic ami: ${friendId}`);
                
                const friendRef = doc(db, 'artifacts/drinkwise-31d3a/public_user_stats', friendId);
                const friendDoc = await getDoc(friendRef);
                
                if (friendDoc.exists()) {
                    const friendData = friendDoc.data();
                    const friendsList = friendData.friends || [];
                    
                    setStatus(prev => prev + `\n   - ${friendId} a ${friendsList.length} amis: [${friendsList.join(', ')}]`);
                    
                    if (!friendsList.includes(currentUserId)) {
                        setStatus(prev => prev + `\n   ❌ PROBLÈME: ${friendId} n'a PAS ${currentUserId} dans sa liste`);
                        setStatus(prev => prev + `\n   📞 Solution: ${friendId} doit ajouter ${currentUserId} manuellement`);
                    } else {
                        setStatus(prev => prev + `\n   ✅ OK: Relation bidirectionnelle existante`);
                    }
                } else {
                    setStatus(prev => prev + `\n   ❌ Document introuvable pour ${friendId}`);
                }
            }
            
            setStatus(prev => prev + '\n\n📋 SOLUTION MANUELLE:');
            setStatus(prev => prev + '\nDemandez à vos amis ML et ML2 d\'aller dans leur');
            setStatus(prev => prev + '\npage Amis et d\'ajouter votre ID utilisateur:');
            setStatus(prev => prev + `\n📎 ${currentUserId}`);
            setStatus(prev => prev + '\n\nOu utilisez la fonction "Ajouter ami par ID"');
            setStatus(prev => prev + '\ndans leur application.');
            
        } catch (error) {
            setStatus(prev => prev + `\n❌ Erreur lors du diagnostic: ${error.message}`);
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '400px',
            maxHeight: '600px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #333',
            zIndex: 9999,
            overflow: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace'
        }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#ff6b6b' }}>� Diagnostic d'Amitié</h3>
            
            <button 
                onClick={fixFriendshipRelationships}
                disabled={isFixing || !user}
                style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: isFixing ? '#666' : '#ff9500',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isFixing ? 'not-allowed' : 'pointer',
                    marginBottom: '15px'
                }}
            >
                {isFixing ? '🔄 Diagnostic en cours...' : '� Diagnostiquer le Problème'}
            </button>

            {status && (
                <div style={{
                    backgroundColor: '#1a1a1a',
                    padding: '10px',
                    borderRadius: '5px',
                    border: '1px solid #333',
                    whiteSpace: 'pre-line',
                    maxHeight: '400px',
                    overflow: 'auto'
                }}>
                    {status}
                </div>
            )}
        </div>
    );
};

export default FriendshipFixer;
