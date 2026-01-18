import React, { useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext.jsx';
import { useTheme } from '../styles/ThemeContext.jsx';
import { badgeList } from '../utils/data';
import ThemedText from '../styles/ThemedText.jsx';
import { DrinkWiseImages } from '../assets/DrinkWiseImages';
import { logger } from '../utils/logger';
import FloatingParticles from '../components/FloatingParticles';

const BadgesPage = () => {
    const { userProfile } = useContext(FirebaseContext);
    const { theme } = useTheme();
    const unlockedBadges = userProfile?.unlockedBadges || [];
    
    logger.debug('BADGES', 'Page BadgesPage - données utilisateur', {
        userProfile: !!userProfile,
        unlockedBadges: unlockedBadges.length,
        availableBadges: Object.keys(badgeList).length
    });

    return (
        <div 
            role="main"
            aria-label="Page des badges"
            className="page-modern"
            style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
            backgroundAttachment: 'fixed',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Floating Particles Background */}
            <FloatingParticles count={15} />
            {/* Background logo watermark */}
            <div style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: 0.05,
                zIndex: 0,
                pointerEvents: 'none'
            }}>
                <img 
                    src="/resources/icon.png"
                    alt="Background"
                    style={{
                        width: '300px',
                        height: '300px'
                    }}
                />
            </div>
            {/* Titre dans un conteneur moderne */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: '24px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                padding: '32px',
                marginBottom: '24px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
                position: 'relative',
                zIndex: 1
            }}>
                <h2 style={{
                    background: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #f472b6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(28px, 8vw, 36px)',
                    fontWeight: '800',
                    margin: 0,
                    letterSpacing: '-0.03em',
                    textShadow: '0 2px 20px rgba(167, 139, 250, 0.4)'
                }}>
                    🏆 Collection de Badges
                </h2>
                <p style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    marginTop: '8px',
                    marginBottom: 0
                }}>
                    {unlockedBadges.length} / {Object.keys(badgeList).length} débloqués
                </p>
            </div>

            {/* Conteneur de la grille de badges */}
            <div 
                className="badges-container force-visible"
                style={{
                    background: 'rgba(30, 30, 46, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    padding: '20px',
                    width: '100%',
                    margin: '0 auto',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    zIndex: 1
                }}>
                {/* Grille de badges */}
                <div 
                    role="list"
                    aria-label={`Grille de badges. ${unlockedBadges.length} badges débloqués sur ${Object.keys(badgeList).length}`}
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
                                    background: isUnlocked 
                                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(236, 72, 153, 0.15) 100%)'
                                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
                                    backdropFilter: 'blur(10px)',
                                    border: isUnlocked 
                                        ? '2px solid rgba(167, 139, 250, 0.5)' 
                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '20px',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    opacity: isUnlocked ? 1 : 0.6,
                                    minHeight: '160px',
                                    position: 'relative',
                                    justifyContent: 'space-between',
                                    boxSizing: 'border-box',
                                    boxShadow: isUnlocked 
                                        ? '0 8px 32px rgba(139, 92, 246, 0.3)'
                                        : '0 4px 16px rgba(0, 0, 0, 0.2)',
                                    transform: isUnlocked ? 'scale(1.02)' : 'scale(1)',
                                    cursor: 'default'
                                }}
                            >
                                {/* Overlay pour badges verrouillés */}
                                {!isUnlocked && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        background: 'rgba(75, 85, 99, 0.9)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '8px',
                                        padding: '4px 8px',
                                        fontSize: '14px',
                                        zIndex: 2,
                                        border: '1px solid rgba(75, 85, 99, 0.3)'
                                    }}>
                                        🔒
                                    </div>
                                )}
                                
                                {/* Badge débloqué */}
                                {isUnlocked && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '12px',
                                        right: '12px',
                                        background: 'linear-gradient(135deg, rgba(167, 139, 250, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '8px',
                                        padding: '4px 8px',
                                        fontSize: '14px',
                                        zIndex: 2,
                                        border: '1px solid rgba(167, 139, 250, 0.3)',
                                        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                                    }}>
                                        ✨
                                    </div>
                                )}
                                
                                {/* Container pour l'icône */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '60px',
                                    height: '60px',
                                    marginBottom: '12px',
                                    background: isUnlocked 
                                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.2) 100%)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    backdropFilter: 'blur(8px)',
                                    borderRadius: '16px',
                                    border: isUnlocked 
                                        ? '1px solid rgba(251, 191, 36, 0.4)'
                                        : '1px solid rgba(255, 255, 255, 0.2)',
                                    boxShadow: isUnlocked 
                                        ? '0 4px 16px rgba(251, 191, 36, 0.2)'
                                        : 'none',
                                    margin: '0 auto 12px auto'
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
                                            logger.warn('BADGES', 'Erreur rendu icône badge', { badgeId: id, error });
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
                                                width: '40px',
                                                height: '40px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '28px',
                                                opacity: isUnlocked ? 1 : 0.6,
                                                filter: isUnlocked ? 'none' : 'grayscale(50%)'
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
                                        background: isUnlocked 
                                            ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)'
                                            : 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        margin: '0 0 6px 0',
                                        lineHeight: '1.2',
                                        textAlign: 'center',
                                        width: '100%',
                                        letterSpacing: '-0.01em'
                                    }}>
                                        {badge.name}
                                    </h3>
                                    <p style={{ 
                                        color: isUnlocked ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.6)',
                                        fontSize: '10px',
                                        margin: 0,
                                        lineHeight: '1.4',
                                        textAlign: 'center',
                                        width: '100%',
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        fontWeight: '500'
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