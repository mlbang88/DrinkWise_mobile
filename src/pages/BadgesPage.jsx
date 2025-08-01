import React, { useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { useTheme } from '../styles/ThemeContext.jsx';
import { badgeList } from '../utils/data';
import ThemedText from '../styles/ThemedText.jsx';

const BadgesPage = () => {
    const { userProfile } = useContext(FirebaseContext);
    const { theme } = useTheme();
    const unlockedBadges = userProfile?.unlockedBadges || [];
    
    console.log("🏅 BadgesPage - userProfile:", userProfile);
    console.log("🏅 BadgesPage - unlockedBadges:", unlockedBadges);
    console.log("🏅 BadgesPage - badgeList keys:", Object.keys(badgeList));

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.75)), url("https://images.unsplash.com/photo-1667983088885-226788e18a6e?q=80&w=387&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D") center/cover',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Titre dans un conteneur */}
            <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '24px',
                marginBottom: '32px',
                textAlign: 'center'
            }}>
                <h2 style={{
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: '600',
                    margin: 0
                }}>
                    Vos Badges
                </h2>
            </div>

            {/* Conteneur de la grille de badges */}
            <div 
                className="badges-container force-visible"
                style={{
                    backgroundColor: 'rgba(128, 128, 128, 0.2)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    padding: '12px',
                    width: '100%',
                    margin: '0 auto'
                }}>
                {/* Grille de badges */}
                <div 
                    className="badges-grid force-visible"
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '10px',
                        width: '100%'
                    }}>
                    {Object.entries(badgeList).map(([id, badge]) => {
                        const isUnlocked = unlockedBadges.includes(id);
                        return (
                            <div
                                key={id}
                                className="badge-item force-visible"
                                style={{
                                    backgroundColor: isUnlocked ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                                    border: `2px solid ${isUnlocked ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)'}`,
                                    borderRadius: '12px',
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    transition: 'all 0.2s ease',
                                    opacity: isUnlocked ? 1 : 0.6,
                                    minHeight: '140px',
                                    position: 'relative',
                                    justifyContent: 'space-between',
                                    boxSizing: 'border-box'
                                }}
                            >
                                {/* Overlay pour badges verrouillés */}
                                {!isUnlocked && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '6px',
                                        fontSize: '12px',
                                        zIndex: 2
                                    }}>
                                        🔒
                                    </div>
                                )}
                                
                                {/* Container pour l'icône */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '100%',
                                    height: '40px',
                                    marginBottom: '8px'
                                }}>
                                    {(() => {
                                        try {
                                            if (badge.icon && React.isValidElement(badge.icon)) {
                                                return React.cloneElement(badge.icon, { 
                                                    size: 32, 
                                                    style: { 
                                                        color: isUnlocked ? '#fbbf24' : '#6b7280',
                                                        display: 'block',
                                                        flexShrink: 0
                                                    }
                                                });
                                            }
                                        } catch (error) {
                                            console.warn('Erreur icône badge:', id, error);
                                        }
                                        
                                        // Fallback avec emoji approprié selon le type de badge
                                        const getEmojiForBadge = (badgeId) => {
                                            if (badgeId.includes('drink')) return '🍺';
                                            if (badgeId.includes('vomi')) return '🤮';
                                            if (badgeId.includes('fight')) return '👊';
                                            if (badgeId.includes('party')) return '🎉';
                                            if (badgeId.includes('social')) return '👥';
                                            if (badgeId.includes('heart')) return '💔';
                                            if (badgeId.includes('festival')) return '🎪';
                                            if (badgeId.includes('club')) return '🕺';
                                            if (badgeId.includes('wine') || badgeId.includes('sommelier')) return '🍷';
                                            if (badgeId.includes('explorer')) return '🗺️';
                                            if (badgeId.includes('iron') || badgeId.includes('stomach')) return '🛡️';
                                            if (badgeId.includes('legendary')) return '⭐';
                                            if (badgeId.includes('blackout')) return '❓';
                                            return '🏆';
                                        };
                                        
                                        return (
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '20px',
                                                opacity: isUnlocked ? 1 : 0.6
                                            }}>
                                                {getEmojiForBadge(id)}
                                            </div>
                                        );
                                    })()}
                                </div>
                                
                                {/* Container pour le texte */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    width: '100%',
                                    flex: 1
                                }}>
                                    <h3 style={{
                                        color: isUnlocked ? '#fbbf24' : '#d1d5db',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        margin: '0 0 4px 0',
                                        lineHeight: '1.2',
                                        textAlign: 'center',
                                        width: '100%'
                                    }}>
                                        {badge.name}
                                    </h3>
                                    <p style={{ 
                                        color: isUnlocked ? '#d1d5db' : '#9ca3af',
                                        fontSize: '9px',
                                        margin: 0,
                                        lineHeight: '1.3',
                                        textAlign: 'center',
                                        width: '100%',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical'
                                    }}>
                                        {badge.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BadgesPage;