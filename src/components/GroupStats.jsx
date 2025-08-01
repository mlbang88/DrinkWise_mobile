// src/components/GroupStats.jsx
import React, { useState, useEffect, useContext } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { groupService } from '../services/groupService';
import { badgeList, gameplayConfig } from '../utils/data';
import LoadingSpinner from './LoadingSpinner';
import GroupGoals from './GroupGoals';
import GroupMemories from './GroupMemories';

export default function GroupStats({ groupId }) {
    const { db, appId, setMessageBox } = useContext(FirebaseContext);
    const [groupData, setGroupData] = useState(null);
    const [memberDetails, setMemberDetails] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!groupId) {
            setLoading(false);
            return;
        }

        const groupRef = doc(db, `artifacts/${appId}/groups`, groupId);
        const unsubscribe = onSnapshot(groupRef, async (doc) => {
            if (doc.exists()) {
                const group = { id: doc.id, ...doc.data() };
                setGroupData(group);

                // Charger les détails des membres
                await loadMemberDetails(group.members);
            } else {
                setMessageBox({ message: 'Groupe non trouvé.', type: 'error' });
            }
            setLoading(false);
        }, (error) => {
            console.error('❌ Erreur chargement groupe:', error);
            setMessageBox({ message: 'Erreur lors du chargement du groupe.', type: 'error' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [groupId, db, appId]);

    const loadMemberDetails = async (memberIds) => {
        try {
            const details = [];
            for (const memberId of memberIds) {
                const statsRef = doc(db, `artifacts/${appId}/public_user_stats`, memberId);
                const statsDoc = await getDoc(statsRef);
                if (statsDoc.exists()) {
                    details.push({ id: memberId, ...statsDoc.data() });
                }
            }
            setMemberDetails(details);
        } catch (error) {
            console.error('❌ Erreur chargement membres:', error);
        }
    };

    const calculateMemberLevel = (stats) => {
        if (!stats) return { level: 0, levelName: "Novice de la Fête", currentXp: 0 };
        
        const parties = stats.totalParties || 0;
        const drinks = stats.totalDrinks || 0;
        const defis = stats.challengesCompleted || 0;
        const badges = stats.unlockedBadges?.length || 0;
        
        const totalXp =
            parties * (gameplayConfig.xpParSoiree || 50) +
            drinks * (gameplayConfig.xpParVerre || 5) +
            defis * (gameplayConfig.xpParDefi || 25) +
            badges * (gameplayConfig.xpParBadge || 100);

        let currentLevel = 0;
        for (let i = gameplayConfig.levels.length - 1; i >= 0; i--) {
            if (totalXp >= gameplayConfig.levels[i].xp) {
                currentLevel = i;
                break;
            }
        }

        return {
            level: currentLevel,
            levelName: gameplayConfig.levels[currentLevel].name,
            currentXp: totalXp
        };
    };

    if (loading) return <LoadingSpinner />;
    if (!groupData) return null;

    const stats = groupData.stats || {};

    return (
        <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '15px',
            padding: '20px'
        }}>
            {/* En-tête du groupe */}
            <div style={{
                textAlign: 'center',
                marginBottom: '25px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <h2 style={{ color: 'white', margin: 0, marginBottom: '8px' }}>
                    👥 {groupData.name}
                </h2>
                {groupData.description && (
                    <p style={{ color: '#9ca3af', fontSize: '14px', margin: 0 }}>
                        {groupData.description}
                    </p>
                )}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '20px',
                    marginTop: '15px',
                    fontSize: '14px',
                    color: '#ccc'
                }}>
                    <span>👥 {groupData.members.length} membres</span>
                    <span>📅 Créé le {groupData.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}</span>
                </div>
            </div>

            {/* Statistiques cumulées */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '25px'
            }}>
                <h3 style={{ color: '#ccc', marginBottom: '20px', textAlign: 'center' }}>
                    📊 Statistiques cumulées du groupe
                </h3>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '15px'
                }}>
                    <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                            {stats.totalDrinks || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Verres total</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid #8b5cf6',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                            {stats.totalParties || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Soirées total</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                            {Math.round((stats.totalVolume || 0) / 100) / 10}L
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Volume total</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                            {stats.challengesCompleted || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Défis complétés</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>
                            {stats.totalVomi || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Vomis 🤮</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid #a855f7',
                        borderRadius: '8px',
                        padding: '15px',
                        textAlign: 'center'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7' }}>
                            {stats.totalBadges || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>Badges total</div>
                    </div>
                </div>
            </div>

            {/* Classement des membres */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '25px'
            }}>
                <h3 style={{ color: '#ccc', marginBottom: '20px', textAlign: 'center' }}>
                    🏆 Classement des membres
                </h3>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {memberDetails
                        .sort((a, b) => calculateMemberLevel(b).currentXp - calculateMemberLevel(a).currentXp)
                        .map((member, index) => {
                            const levelInfo = calculateMemberLevel(member);
                            const isAdmin = groupData.admins.includes(member.id);
                            
                            return (
                                <div
                                    key={member.id}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        padding: '15px',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '15px',
                                        flex: 1,
                                        minWidth: 0 // Permet la compression du texte si nécessaire
                                    }}>
                                        <div style={{
                                            backgroundColor: index === 0 ? '#fbbf24' : 
                                                           index === 1 ? '#9ca3af' : 
                                                           index === 2 ? '#cd7c2f' : '#4b5563',
                                            borderRadius: '50%',
                                            width: '30px',
                                            height: '30px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            flexShrink: 0 // Empêche la compression du numéro
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ 
                                            flex: 1,
                                            minWidth: 0,
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{ 
                                                color: 'white', 
                                                fontWeight: 'bold', 
                                                fontSize: '16px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {member.username || 'Utilisateur'}
                                                {isAdmin && (
                                                    <span style={{ 
                                                        color: '#fbbf24', 
                                                        fontSize: '12px', 
                                                        marginLeft: '8px' 
                                                    }}>
                                                        👑
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ 
                                                color: '#9ca3af', 
                                                fontSize: '12px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {levelInfo.levelName}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        textAlign: 'right',
                                        flexShrink: 0,
                                        marginLeft: '10px'
                                    }}>
                                        <div style={{ color: 'white', fontWeight: 'bold' }}>
                                            {levelInfo.currentXp} XP
                                        </div>
                                        <div style={{ 
                                            color: '#9ca3af', 
                                            fontSize: '12px',
                                            display: 'flex',
                                            gap: '10px'
                                        }}>
                                            <span>🍺 {member.totalDrinks || 0}</span>
                                            <span>🎉 {member.totalParties || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>

            {/* Objectifs de groupe */}
            <GroupGoals 
                groupId={groupId}
                groupData={groupData}
                onGoalCreated={() => {
                    // Recharger les données du groupe après création d'un objectif
                    // Le onSnapshot se chargera automatiquement de mettre à jour les données
                }}
            />

            {/* Souvenirs du groupe */}
            <GroupMemories 
                groupId={groupId}
                groupMembers={groupData?.members || []}
            />
        </div>
    );
}
