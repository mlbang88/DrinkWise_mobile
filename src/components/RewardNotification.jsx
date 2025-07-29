import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trophy, X } from 'lucide-react';

const RewardNotification = ({ xpGained, newBadges, onClose }) => {
    console.log("🎉 RewardNotification montée avec:", { xpGained, newBadges });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Animation d'entrée
        setTimeout(() => setIsVisible(true), 100);
        
        // Auto-fermeture après 4 secondes
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Attendre la fin de l'animation
        }, 4000);

        return () => clearTimeout(timer);
    }, [onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const notification = (
        <div 
            style={{
                position: 'fixed',
                top: '80px',
                left: '50%',
                transform: `translateX(-50%) translateY(${isVisible ? '0' : '-20px'})`,
                zIndex: 99999,
                opacity: isVisible ? 1 : 0,
                transition: 'all 0.3s ease-in-out',
                backgroundColor: '#10B981',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '16px',
                fontWeight: '600',
                maxWidth: '320px',
                minWidth: '200px',
                pointerEvents: 'auto'
            }}
        >
            <Trophy size={20} style={{ color: '#FCD34D' }} />
            
            <div style={{ flex: 1 }}>
                <div>+{xpGained} XP gagnés !</div>
                {newBadges.length > 0 && (
                    <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '400', 
                        marginTop: '4px',
                        opacity: 0.9
                    }}>
                        🏆 {newBadges.length} nouveau{newBadges.length > 1 ? 'x' : ''} badge{newBadges.length > 1 ? 's' : ''} !
                    </div>
                )}
            </div>

            <button
                onClick={handleClose}
                style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                }}
                onMouseEnter={e => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={e => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            >
                <X size={14} color="white" />
            </button>
        </div>
    );

    return createPortal(notification, document.body);
};

export default RewardNotification;
