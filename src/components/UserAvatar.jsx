// src/components/UserAvatar.jsx
import React from 'react';
import { profilePhotoService } from '../services/profilePhotoService';

const UserAvatar = ({ 
    user, 
    size = 40, 
    showOnlineStatus = false, 
    isOnline = false,
    style = {},
    onClick = null 
}) => {
    const getAvatarUrl = () => {
        if (user?.profilePhoto?.url) {
            return user.profilePhoto.url;
        }
        return profilePhotoService.getDefaultAvatar(user?.username || 'User');
    };

    return (
        <div 
            onClick={onClick}
            style={{
                position: 'relative',
                display: 'inline-block',
                cursor: onClick ? 'pointer' : 'default',
                ...style
            }}
        >
            {/* Avatar */}
            <div
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    borderRadius: '50%',
                    backgroundImage: `url(${getAvatarUrl()})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                    if (onClick) {
                        e.target.style.transform = 'scale(1.05)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                    }
                }}
                onMouseOut={(e) => {
                    if (onClick) {
                        e.target.style.transform = 'scale(1)';
                        e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    }
                }}
            />

            {/* Indicateur de statut en ligne */}
            {showOnlineStatus && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        width: `${Math.max(8, size * 0.2)}px`,
                        height: `${Math.max(8, size * 0.2)}px`,
                        borderRadius: '50%',
                        backgroundColor: isOnline ? '#10b981' : '#6b7280',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }}
                />
            )}
        </div>
    );
};

export default UserAvatar;
