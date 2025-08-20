import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Users, UserPlus } from 'lucide-react';

const InAppNotification = ({ notification, onClose, onMarkAsRead }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Animer l'entrée
        setTimeout(() => setIsVisible(true), 100);
        
        // Auto-fermer après 6 secondes
        const autoCloseTimer = setTimeout(() => {
            handleClose();
        }, 6000);

        return () => clearTimeout(autoCloseTimer);
    }, []);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 300);
    };

    const handleClick = () => {
        if (onMarkAsRead) {
            onMarkAsRead(notification.id);
        }
        handleClose();
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'like':
                return <Heart size={20} className="text-red-400" />;
            case 'comment':
                return <MessageCircle size={20} className="text-blue-400" />;
            case 'friend_request':
                return <UserPlus size={20} className="text-green-400" />;
            case 'friend_accepted':
                return <Users size={20} className="text-green-400" />;
            default:
                return <div className="w-5 h-5 bg-purple-400 rounded-full" />;
        }
    };

    const getTitle = () => {
        switch (notification.type) {
            case 'like':
                return '❤️ Nouveau J\'aime';
            case 'comment':
                return '💬 Nouveau Commentaire';
            case 'friend_request':
                return '👥 Demande d\'Ami';
            case 'friend_accepted':
                return '✅ Ami Accepté';
            default:
                return 'Notification';
        }
    };

    const getMessage = () => {
        const { data } = notification;
        switch (notification.type) {
            case 'like':
                return `${data.userName} a aimé votre ${data.itemType === 'party' ? 'soirée' : 'publication'}`;
            case 'comment':
                return `${data.userName}: "${data.content?.substring(0, 50)}${data.content?.length > 50 ? '...' : ''}"`;
            case 'friend_request':
                return `${data.userName} vous a envoyé une demande d'ami`;
            case 'friend_accepted':
                return `${data.userName} a accepté votre demande d'ami`;
            default:
                return notification.message || 'Nouvelle notification';
        }
    };

    return (
        <div
            className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-all duration-300 transform ${
                isVisible && !isExiting 
                    ? 'translate-x-0 opacity-100' 
                    : 'translate-x-full opacity-0'
            }`}
            style={{
                background: 'linear-gradient(135deg, rgba(139, 69, 255, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer'
            }}
            onClick={handleClick}
        >
            <div style={{
                padding: 'clamp(12px, 4vw, 16px)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'clamp(10px, 3vw, 12px)'
            }}>
                {/* Icône */}
                <div style={{
                    flexShrink: 0,
                    marginTop: '2px'
                }}>
                    {getIcon()}
                </div>

                {/* Contenu */}
                <div style={{
                    flex: 1,
                    minWidth: 0
                }}>
                    <div style={{
                        color: 'white',
                        fontSize: 'clamp(13px, 3.5vw, 14px)',
                        fontWeight: '600',
                        marginBottom: '4px',
                        wordWrap: 'break-word'
                    }}>
                        {getTitle()}
                    </div>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: 'clamp(11px, 3vw, 12px)',
                        lineHeight: '1.4',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word'
                    }}>
                        {getMessage()}
                    </div>
                    
                    {/* Timestamp */}
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: 'clamp(10px, 2.5vw, 11px)',
                        marginTop: '4px'
                    }}>
                        {new Date(notification.timestamp?.toDate()).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                </div>

                {/* Bouton fermer */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClose();
                    }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
                >
                    <X size={14} />
                </button>
            </div>

            {/* Barre de progression */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: '2px',
                background: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '0 0 12px 12px',
                overflow: 'hidden'
            }}>
                <div
                    style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.8))',
                        animation: 'notificationProgress 6s linear forwards'
                    }}
                />
            </div>

            <style jsx>{`
                @keyframes notificationProgress {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0%); }
                }
            `}</style>
        </div>
    );
};

export default InAppNotification;
