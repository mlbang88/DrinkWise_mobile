// src/components/GroupStats.jsx
import React, { useState, useEffect, useContext } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { groupService } from '../services/groupService';
import { ExperienceService } from '../services/experienceService';
import { gameplayConfig } from '../utils/data';
import ThemedText from '../styles/ThemedText';
import UserAvatar from './UserAvatar';
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
        
        // Utiliser ExperienceService pour un calcul unifié de l'XP
        const totalXp = ExperienceService.calculateTotalXP({
            totalParties: stats.totalParties || 0,
            totalDrinks: stats.totalDrinks || 0,
            totalBadges: stats.unlockedBadges?.length || 0,
            totalChallenges: stats.challengesCompleted || 0,
            totalQuizQuestions: stats.totalQuizQuestions || 0
        });

        const currentLevel = ExperienceService.calculateLevel(totalXp);
        const levelName = ExperienceService.getLevelName(currentLevel);

        return {
            level: currentLevel,
            levelName: levelName,
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
            padding: 'clamp(12px, 3vw, 16px)',
            width: '100%',
            boxSizing: 'border-box'
        }}>
            {/* En-tête du groupe */}
            <div style={{
                textAlign: 'center',
                marginBottom: '25px',
                paddingBottom: '20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <h2 style={{ 
                    color: 'white', 
                    margin: 0, 
                    marginBottom: '8px',
                    fontSize: 'clamp(18px, 5vw, 24px)',
                    lineHeight: '1.2'
                }}>
                    👥 {groupData.name}
                </h2>
                {groupData.description && (
                    <p style={{ 
                        color: '#9ca3af', 
                        fontSize: 'clamp(12px, 3.5vw, 14px)', 
                        margin: 0,
                        lineHeight: '1.4',
                        padding: '0 10px'
                    }}>
                        {groupData.description}
                    </p>
                )}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'clamp(15px, 4vw, 20px)',
                    marginTop: '15px',
                    fontSize: 'clamp(12px, 3.5vw, 14px)',
                    color: '#ccc',
                    flexWrap: 'wrap'
                }}>
                    <span>👥 {groupData.members.length} membres</span>
                    <span>📅 Créé le {groupData.createdAt?.toDate?.()?.toLocaleDateString?.() || 'N/A'}</span>
                </div>
            </div>

            {/* Statistiques cumulées */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: 'clamp(12px, 3vw, 16px)',
                marginBottom: '20px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <h3 style={{ 
                    color: '#ccc', 
                    marginBottom: '16px', 
                    textAlign: 'center',
                    fontSize: 'clamp(16px, 4.5vw, 18px)'
                }}>
                    📊 Statistiques cumulées du groupe
                </h3>
                
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 'clamp(10px, 2.5vw, 12px)',
                    width: '100%'
                }}>
                    <div style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid #10b981',
                        borderRadius: '8px',
                        padding: 'clamp(12px, 4vw, 15px)',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            fontSize: 'clamp(20px, 6vw, 24px)', 
                            fontWeight: 'bold', 
                            color: '#10b981',
                            lineHeight: '1.2'
                        }}>
                            {stats.totalDrinks || 0}
                        </div>
                        <div style={{ 
                            fontSize: 'clamp(10px, 3vw, 12px)', 
                            color: '#9ca3af',
                            marginTop: '4px'
                        }}>Verres total</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid #8b5cf6',
                        borderRadius: '8px',
                        padding: 'clamp(12px, 4vw, 15px)',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            fontSize: 'clamp(20px, 6vw, 24px)', 
                            fontWeight: 'bold', 
                            color: '#8b5cf6',
                            lineHeight: '1.2'
                        }}>
                            {stats.totalParties || 0}
                        </div>
                        <div style={{ 
                            fontSize: 'clamp(10px, 3vw, 12px)', 
                            color: '#9ca3af',
                            marginTop: '4px'
                        }}>Soirées total</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid #3b82f6',
                        borderRadius: '8px',
                        padding: 'clamp(12px, 4vw, 15px)',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            fontSize: 'clamp(20px, 6vw, 24px)', 
                            fontWeight: 'bold', 
                            color: '#3b82f6',
                            lineHeight: '1.2'
                        }}>
                            {Math.round((stats.totalVolume || 0) / 100) / 10}L
                        </div>
                        <div style={{ 
                            fontSize: 'clamp(10px, 3vw, 12px)', 
                            color: '#9ca3af',
                            marginTop: '4px'
                        }}>Volume total</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid #f59e0b',
                        borderRadius: '8px',
                        padding: 'clamp(12px, 4vw, 15px)',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            fontSize: 'clamp(20px, 6vw, 24px)', 
                            fontWeight: 'bold', 
                            color: '#f59e0b',
                            lineHeight: '1.2'
                        }}>
                            {stats.challengesCompleted || 0}
                        </div>
                        <div style={{ 
                            fontSize: 'clamp(10px, 3vw, 12px)', 
                            color: '#9ca3af',
                            marginTop: '4px'
                        }}>Défis complétés</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        borderRadius: '8px',
                        padding: 'clamp(12px, 4vw, 15px)',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            fontSize: 'clamp(20px, 6vw, 24px)', 
                            fontWeight: 'bold', 
                            color: '#ef4444',
                            lineHeight: '1.2'
                        }}>
                            {stats.totalVomi || 0}
                        </div>
                        <div style={{ 
                            fontSize: 'clamp(10px, 3vw, 12px)', 
                            color: '#9ca3af',
                            marginTop: '4px'
                        }}>Vomis 🤮</div>
                    </div>

                    <div style={{
                        backgroundColor: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid #a855f7',
                        borderRadius: '8px',
                        padding: 'clamp(12px, 4vw, 15px)',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            fontSize: 'clamp(20px, 6vw, 24px)', 
                            fontWeight: 'bold', 
                            color: '#a855f7',
                            lineHeight: '1.2'
                        }}>
                            {stats.totalBadges || 0}
                        </div>
                        <div style={{ 
                            fontSize: 'clamp(10px, 3vw, 12px)', 
                            color: '#9ca3af',
                            marginTop: '4px'
                        }}>Badges total</div>
                    </div>
                </div>
            </div>

            {/* Classement des membres */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: 'clamp(12px, 3vw, 16px)',
                marginBottom: '20px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <h3 style={{ 
                    color: '#ccc', 
                    marginBottom: '16px', 
                    textAlign: 'center',
                    fontSize: 'clamp(16px, 4.5vw, 18px)'
                }}>
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
                                        padding: 'clamp(16px, 4vw, 20px)',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        gap: 'clamp(12px, 4vw, 16px)',
                                        minHeight: 'clamp(70px, 18vw, 90px)'
                                    }}
                                >
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'flex-start', 
                                        gap: 'clamp(12px, 4vw, 16px)',
                                        flex: 1,
                                        minWidth: 0
                                    }}>
                                        <div style={{
                                            backgroundColor: index === 0 ? '#fbbf24' : 
                                                           index === 1 ? '#9ca3af' : 
                                                           index === 2 ? '#cd7c2f' : '#4b5563',
                                            borderRadius: '50%',
                                            width: 'clamp(32px, 9vw, 36px)',
                                            height: 'clamp(32px, 9vw, 36px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 'clamp(14px, 4vw, 16px)',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            flexShrink: 0,
                                            marginTop: '4px'
                                        }}>
                                            {index + 1}
                                        </div>
                                        <div style={{ 
                                            flex: 1,
                                            minWidth: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'flex-start',
                                            paddingTop: '2px',
                                            width: '100%'
                                        }}>
                                            {/* Zone dédiée au nom en haut */}
                                            <div style={{ 
                                                width: '100%',
                                                minHeight: 'clamp(24px, 6vw, 28px)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '8px',
                                                backgroundColor: 'transparent',
                                                borderRadius: '4px',
                                                padding: '4px 8px',
                                                boxSizing: 'border-box'
                                            }}>
                                                <div style={{ 
                                                    color: 'white', 
                                                    fontWeight: 'bold', 
                                                    fontSize: `clamp(${Math.max(10, 16 - (member.username || 'Utilisateur').length * 0.3)}px, 4vw, ${Math.max(14, 18 - (member.username || 'Utilisateur').length * 0.2)}px)`,
                                                    lineHeight: '1.2',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    width: '100%',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    <span style={{ 
                                                        flex: '1 1 auto',
                                                        minWidth: 0
                                                    }}>
                                                        {member.username || 'Utilisateur'}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Zone dédiée au niveau */}
                                            <div style={{ 
                                                width: '100%',
                                                minHeight: 'clamp(20px, 5vw, 24px)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                backgroundColor: 'transparent',
                                                borderRadius: '4px',
                                                padding: '4px 8px',
                                                boxSizing: 'border-box'
                                            }}>
                                                <div style={{ 
                                                    color: '#9ca3af', 
                                                    fontSize: `clamp(${Math.max(8, 12 - levelInfo.levelName.length * 0.2)}px, 3.5vw, ${Math.max(10, 14 - levelInfo.levelName.length * 0.15)}px)`,
                                                    lineHeight: '1.2',
                                                    width: '100%',
                                                    whiteSpace: 'nowrap',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}>
                                                    {levelInfo.levelName}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        textAlign: 'right',
                                        flexShrink: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-end',
                                        justifyContent: 'flex-start',
                                        paddingTop: '4px',
                                        minWidth: 'clamp(70px, 22vw, 90px)'
                                    }}>
                                        <div style={{ 
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginBottom: '4px'
                                        }}>
                                            <div style={{ 
                                                color: 'white', 
                                                fontWeight: 'bold',
                                                fontSize: 'clamp(14px, 4vw, 16px)',
                                                lineHeight: '1.3'
                                            }}>
                                                {levelInfo.currentXp} XP
                                            </div>
                                            {isAdmin && (
                                                <span style={{ 
                                                    color: '#fbbf24', 
                                                    fontSize: 'clamp(14px, 3.5vw, 16px)',
                                                    flexShrink: 0
                                                }}>
                                                    👑
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ 
                                            color: '#9ca3af', 
                                            fontSize: 'clamp(11px, 3vw, 12px)',
                                            lineHeight: '1.3',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'flex-end',
                                            gap: '2px'
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
