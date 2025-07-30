import React, { useState, useEffect, useContext } from 'react';
import { collection, query, orderBy, limit, getDocs, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import UserAvatar from './UserAvatar';

export default function GroupMemories({ groupId, groupMembers }) {
    const { db, appId, user } = useContext(FirebaseContext);
    const [memories, setMemories] = useState([]);
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState('recent');

    useEffect(() => {
        if (groupId && groupMembers?.length > 0) {
            loadGroupMemories();
        }
    }, [groupId, groupMembers]);

    const loadGroupMemories = async () => {
        try {
            setLoading(true);
            
            const recentParties = await loadRecentParties();
            const groupAchievements = await loadGroupAchievements();
            
            setMemories(recentParties);
            setAchievements(groupAchievements);
        } catch (error) {
            console.error('❌ Erreur chargement souvenirs:', error);
            setMemories([]);
            setAchievements([]);
        } finally {
            setLoading(false);
        }
    };

    const loadRecentParties = async () => {
        const parties = [];
        
        // Pour l'instant, on charge seulement les souvenirs publics du groupe
        // (les membres peuvent choisir de partager leurs soirées)
        try {
            const memoriesRef = collection(db, `artifacts/${appId}/group_memories`);
            const q = query(
                memoriesRef,
                orderBy('date', 'desc'),
                limit(10)
            );
            
            const snapshot = await getDocs(q);
            
            for (const docSnapshot of snapshot.docs) {
                const memory = { id: docSnapshot.id, ...docSnapshot.data() };
                
                // Vérifier si le souvenir appartient à un membre du groupe
                if (groupMembers.includes(memory.userId)) {
                    // Ajouter les infos du membre
                    const userDoc = await getDoc(doc(db, `artifacts/${appId}/public_user_stats`, memory.userId));
                    if (userDoc.exists()) {
                        memory.memberName = userDoc.data().displayName || 'Membre';
                        memory.memberPhoto = userDoc.data().photoURL;
                    }
                    
                    parties.push(memory);
                }
            }
        } catch (error) {
            console.error('Erreur chargement souvenirs publics:', error);
        }
        
        // Si aucun souvenir public, on charge les soirées de l'utilisateur actuel
        if (parties.length === 0 && groupMembers.includes(user?.uid)) {
            try {
                const userPartiesRef = collection(db, `artifacts/${appId}/users/${user.uid}/parties`);
                const q = query(
                    userPartiesRef,
                    orderBy('date', 'desc'),
                    limit(5)
                );
                const snapshot = await getDocs(q);
                
                for (const docSnapshot of snapshot.docs) {
                    const party = { 
                        id: docSnapshot.id, 
                        ...docSnapshot.data(), 
                        userId: user.uid,
                        memberName: user.displayName || 'Vous',
                        memberPhoto: user.photoURL,
                        isUserOwn: true
                    };
                    
                    parties.push(party);
                }
            } catch (error) {
                console.error('Erreur chargement vos soirées:', error);
            }
        }
        
        return parties.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const loadGroupAchievements = async () => {
        const achievements = [];
        
        achievements.push({
            id: 'first_party',
            title: '🎉 Première soirée en groupe',
            description: 'Le groupe a organisé sa première soirée ensemble',
            date: new Date().toISOString(),
            icon: '🎉'
        });
        
        return achievements;
    };

    const createTestMemory = async () => {
        try {
            const memoryRef = doc(collection(db, `artifacts/${appId}/group_memories`));
            
            const testMemory = {
                userId: user.uid,
                groupId: groupId,
                date: new Date().toISOString(),
                totalDrinks: Math.floor(Math.random() * 10) + 1,
                location: '🏠 Chez moi',
                xpGained: 150,
                sharedAt: Timestamp.now(),
                isPublic: true,
                type: 'party'
            };
            
            await setDoc(memoryRef, testMemory);
            
            // Recharger les souvenirs
            loadGroupMemories();
            
            console.log('✅ Souvenir de test créé !');
        } catch (error) {
            console.error('❌ Erreur création souvenir test:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getMemoryIcon = (party) => {
        if (party.totalDrinks > 10) return '🍻';
        if (party.totalDrinks > 5) return '🍺';
        return '🥂';
    };

    if (loading) {
        return (
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
            }}>
                <div style={{ color: 'white' }}>Chargement des souvenirs...</div>
            </div>
        );
    }

    return (
        <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
            <h3 style={{
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '15px',
                textAlign: 'center'
            }}>
                📸 Souvenirs du Groupe
            </h3>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '20px',
                gap: '10px'
            }}>
                {[
                    { key: 'recent', label: '📅 Récents' },
                    { key: 'achievements', label: '🏆 Exploits' },
                    { key: 'timeline', label: '⏰ Timeline' }
                ].map(view => (
                    <button
                        key={view.key}
                        onClick={() => setSelectedView(view.key)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: selectedView === view.key ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            border: selectedView === view.key ? '2px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: selectedView === view.key ? 'bold' : 'normal',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {view.label}
                    </button>
                ))}
            </div>

            {selectedView === 'recent' && (
                <div>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '15px' 
                    }}>
                        <h4 style={{ color: 'white', fontSize: '16px', margin: 0 }}>
                            🎉 Soirées récentes
                        </h4>
                        
                        {/* Bouton de test temporaire */}
                        <button
                            onClick={createTestMemory}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                border: '1px solid #10b981',
                                borderRadius: '15px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold'
                            }}
                        >
                            ➕ Test
                        </button>
                    </div>
                    
                    {memories.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            color: 'rgba(255, 255, 255, 0.7)',
                            padding: '20px'
                        }}>
                            📭 Aucun souvenir partagé pour le moment.
                            <br />
                            <span style={{ fontSize: '14px', opacity: 0.8 }}>
                                Les membres peuvent partager leurs meilleures soirées dans les souvenirs du groupe !
                            </span>
                            <br />
                            <span style={{ fontSize: '12px', opacity: 0.6, marginTop: '10px', display: 'block' }}>
                                💡 Astuce : Pour préserver la confidentialité, seules les soirées explicitement partagées apparaissent ici.
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {memories.map(party => (
                                <div key={party.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}>
                                    <UserAvatar 
                                        userId={party.userId}
                                        photoURL={party.memberPhoto}
                                        displayName={party.memberName}
                                        size="small"
                                    />
                                    
                                    <div style={{ marginLeft: '12px', flex: 1 }}>
                                        <div style={{
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '14px'
                                        }}>
                                            {getMemoryIcon(party)} {party.memberName || 'Membre'}
                                            {party.isUserOwn && (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    fontSize: '12px',
                                                    opacity: 0.7
                                                }}>
                                                    (vos soirées)
                                                </span>
                                            )}
                                        </div>
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            fontSize: '12px'
                                        }}>
                                            {party.totalDrinks} verre{party.totalDrinks > 1 ? 's' : ''} • {formatDate(party.date)}
                                        </div>
                                        {party.location && (
                                            <div style={{
                                                color: 'rgba(255, 255, 255, 0.6)',
                                                fontSize: '11px'
                                            }}>
                                                📍 {party.location}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div style={{
                                        color: '#10b981',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        +{party.xpGained || 0} XP
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedView === 'achievements' && (
                <div>
                    <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '16px' }}>
                        🏆 Exploits du groupe
                    </h4>
                    
                    {achievements.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            color: 'rgba(255, 255, 255, 0.7)',
                            padding: '20px'
                        }}>
                            🏅 Aucun exploit débloqué pour le moment.
                            <br />
                            <span style={{ fontSize: '14px', opacity: 0.8 }}>
                                Continuez à faire la fête ensemble pour débloquer des récompenses !
                            </span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {achievements.map(achievement => (
                                <div key={achievement.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '15px',
                                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 215, 0, 0.3)'
                                }}>
                                    <div style={{
                                        fontSize: '24px',
                                        marginRight: '15px'
                                    }}>
                                        {achievement.icon}
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            color: 'white',
                                            fontWeight: 'bold',
                                            fontSize: '14px',
                                            marginBottom: '5px'
                                        }}>
                                            {achievement.title}
                                        </div>
                                        <div style={{
                                            color: 'rgba(255, 255, 255, 0.8)',
                                            fontSize: '12px'
                                        }}>
                                            {achievement.description}
                                        </div>
                                    </div>
                                    
                                    <div style={{
                                        color: 'rgba(255, 255, 255, 0.6)',
                                        fontSize: '11px'
                                    }}>
                                        {formatDate(achievement.date)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {selectedView === 'timeline' && (
                <div>
                    <h4 style={{ color: 'white', marginBottom: '15px', fontSize: '16px' }}>
                        ⏰ Timeline du groupe
                    </h4>
                    
                    <div style={{
                        textAlign: 'center',
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: '20px'
                    }}>
                        🚧 Timeline en développement
                        <br />
                        <span style={{ fontSize: '14px', opacity: 0.8 }}>
                            Bientôt disponible pour retracer l'histoire de votre groupe !
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
