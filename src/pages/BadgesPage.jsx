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
        <div className="w-full animate-fade-in space-y-4">
            {/* Titre dans un conteneur */}
            <div className="mobile-card" style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '20px',
                textAlign: 'center'
            }}>
                <h2 className="mobile-text-2xl" style={{
                    color: 'white',
                    fontWeight: '600',
                    margin: 0
                }}>
                    🏆 Vos Badges
                </h2>
            </div>

            {/* Conteneur de la grille de badges */}
            <div className="mobile-card" style={{
                backgroundColor: 'rgba(128, 128, 128, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '12px'
            }}>
                {/* Grille de badges */}
                <div className="mobile-grid" style={{
                    gap: '10px'
                }}>
                    {Object.entries(badgeList).map(([id, badge]) => {
                        const isUnlocked = unlockedBadges.includes(id);
                        return (
                            <div
                                key={id}
                                className={`mobile-card p-3 ${
                                    isUnlocked ? 'bg-white bg-opacity-15 border-yellow-400' : 'bg-white bg-opacity-8 border-white border-opacity-15'
                                }`}
                                style={{
                                    border: `2px solid ${isUnlocked ? '#fbbf24' : 'rgba(255, 255, 255, 0.15)'}`,
                                    opacity: isUnlocked ? 1 : 0.6,
                                    minHeight: '140px',
                                    position: 'relative'
                                }}
                            >
                                {/* Overlay pour badges verrouillés */}
                                {!isUnlocked && (
                                    <div className="absolute top-1.5 right-1.5 text-xs z-10">
                                        🔒
                                    </div>
                                )}
                                
                                {/* Container pour l'icône */}
                                <div className="flex items-center justify-center w-full h-10 mb-2">
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
                                            <div className="w-8 h-8 flex items-center justify-center text-xl"
                                                style={{
                                                    opacity: isUnlocked ? 1 : 0.6
                                                }}>
                                                {getEmojiForBadge(id)}
                                            </div>
                                        );
                                    })()}
                                </div>
                                
                                {/* Container pour le texte */}
                                <div className="flex flex-col items-center w-full flex-1">
                                    <h3 className={`text-center w-full font-semibold mb-1 ${
                                        isUnlocked ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                        style={{
                                            fontSize: '11px',
                                            lineHeight: '1.2'
                                        }}>
                                        {badge.name}
                                    </h3>
                                    <p className={`text-center w-full m-0 overflow-hidden ${
                                        isUnlocked ? 'text-gray-300' : 'text-gray-400'
                                    }`}
                                        style={{ 
                                            fontSize: '9px',
                                            lineHeight: '1.3',
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