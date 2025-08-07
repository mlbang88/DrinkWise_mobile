import React from 'react';

const ClassementTest = () => {
    const testMembers = [
        { 
            id: '1', 
            username: 'UtilisateurAvecUnNomTrèsTrèsLong', 
            currentXp: 17680, 
            levelName: 'Légende',
            totalDrinks: 1656,
            totalParties: 168
        },
        { 
            id: '2', 
            username: 'ML2EncoreUnNomLong', 
            currentXp: 10440, 
            levelName: 'Légende aussi',
            totalDrinks: 2008,
            totalParties: 8
        },
        { 
            id: '3', 
            username: 'Vinch', 
            currentXp: 1465, 
            levelName: 'Habitué',
            totalDrinks: 56,
            totalParties: 10
        },
        { 
            id: '4', 
            username: 'matthieuxyz', 
            currentXp: 0, 
            levelName: 'Novice de DrinkWise',
            totalDrinks: 0,
            totalParties: 0
        }
    ];

    const calculateMemberLevel = (member) => ({
        currentXp: member.currentXp,
        levelName: member.levelName
    });

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            padding: 'clamp(16px, 5vw, 24px)',
            fontFamily: 'Arial, sans-serif',
            color: 'white'
        }}>
            <h1 style={{
                fontSize: 'clamp(20px, 6vw, 28px)',
                marginBottom: '24px',
                textAlign: 'center'
            }}>
                Test Classement Responsive
            </h1>

            {/* Classement des membres */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: 'clamp(16px, 5vw, 20px)',
                marginBottom: '25px'
            }}>
                <h3 style={{ 
                    color: '#ccc', 
                    marginBottom: '20px', 
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
                    {testMembers
                        .sort((a, b) => b.currentXp - a.currentXp)
                        .map((member, index) => {
                            const levelInfo = calculateMemberLevel(member);
                            const isAdmin = index === 0; // Premier est admin pour le test
                            
                            return (
                                <div
                                    key={member.id}
                                    style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                        borderRadius: '8px',
                                        padding: 'clamp(12px, 4vw, 15px)',
                                        display: 'flex',
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        gap: 'clamp(8px, 3vw, 15px)'
                                    }}
                                >
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 'clamp(10px, 4vw, 15px)',
                                        flex: 1,
                                        minWidth: 0
                                    }}>
                                        <div style={{
                                            backgroundColor: index === 0 ? '#fbbf24' : 
                                                           index === 1 ? '#9ca3af' : 
                                                           index === 2 ? '#cd7c2f' : '#4b5563',
                                            borderRadius: '50%',
                                            width: 'clamp(26px, 8vw, 30px)',
                                            height: 'clamp(26px, 8vw, 30px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 'clamp(12px, 3.5vw, 14px)',
                                            fontWeight: 'bold',
                                            color: 'white',
                                            flexShrink: 0
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
                                                fontSize: 'clamp(14px, 4vw, 16px)',
                                                lineHeight: '1.2',
                                                wordWrap: 'break-word',
                                                overflowWrap: 'break-word',
                                                wordBreak: 'break-word',
                                                hyphens: 'auto'
                                            }}>
                                                {member.username || 'Utilisateur'}
                                                {isAdmin && (
                                                    <span style={{ 
                                                        color: '#fbbf24', 
                                                        fontSize: 'clamp(10px, 3vw, 12px)', 
                                                        marginLeft: '8px' 
                                                    }}>
                                                        👑
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ 
                                                color: '#9ca3af', 
                                                fontSize: 'clamp(10px, 3vw, 12px)',
                                                lineHeight: '1.2',
                                                wordWrap: 'break-word',
                                                overflowWrap: 'break-word',
                                                wordBreak: 'break-word',
                                                hyphens: 'auto'
                                            }}>
                                                {levelInfo.levelName}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div style={{ 
                                        textAlign: 'right',
                                        flexShrink: 0,
                                        marginLeft: 'clamp(8px, 3vw, 10px)'
                                    }}>
                                        <div style={{ 
                                            color: 'white', 
                                            fontWeight: 'bold',
                                            fontSize: 'clamp(13px, 3.5vw, 14px)'
                                        }}>
                                            {levelInfo.currentXp} XP
                                        </div>
                                        <div style={{ 
                                            color: '#9ca3af', 
                                            fontSize: 'clamp(10px, 3vw, 12px)',
                                            display: 'flex',
                                            gap: 'clamp(6px, 2vw, 10px)',
                                            justifyContent: 'flex-end',
                                            flexWrap: 'wrap'
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

            <div style={{
                padding: 'clamp(12px, 4vw, 16px)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                textAlign: 'center'
            }}>
                <p style={{
                    margin: 0,
                    fontSize: 'clamp(13px, 3.5vw, 14px)',
                    color: '#22c55e'
                }}>
                    ✅ Les noms ne sont plus tronqués ! Ils s'adaptent maintenant à la taille de l'écran.
                </p>
            </div>
        </div>
    );
};

export default ClassementTest;
