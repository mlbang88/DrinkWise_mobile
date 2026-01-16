// src/components/ProfilePhotoManager.jsx
import React, { useState, useRef, useContext } from 'react';
import { FirebaseContext } from '../contexts/FirebaseContext';
import { profilePhotoService } from '../services/profilePhotoService';

const ProfilePhotoManager = ({ currentPhoto, onPhotoUpdate }) => {
    const { db, appId, user, userProfile, setMessageBox } = useContext(FirebaseContext);
    const [uploading, setUploading] = useState(false);
    const [showEditMenu, setShowEditMenu] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            setShowEditMenu(false);

            const oldPhotoPath = currentPhoto?.path;
            const photoData = await profilePhotoService.changeProfilePhoto(
                db, appId, user.uid, file, oldPhotoPath
            );

            setMessageBox({ message: 'Photo de profil mise à jour !', type: 'success' });
            onPhotoUpdate(photoData);
        } catch (error) {
            console.error('❌ Erreur upload photo:', error?.message || String(error));
            setMessageBox({ message: error.message || 'Erreur lors de l\'upload', type: 'error' });
        } finally {
            setUploading(false);
            // Reset input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemovePhoto = async () => {
        if (!currentPhoto) return;

        if (window.confirm('Êtes-vous sûr de vouloir supprimer votre photo de profil ?')) {
            try {
                setUploading(true);
                setShowEditMenu(false);

                await profilePhotoService.removeProfilePhoto(
                    db, appId, user.uid, currentPhoto.path
                );

                setMessageBox({ message: 'Photo de profil supprimée', type: 'info' });
                onPhotoUpdate(null);
            } catch (error) {
                console.error('❌ Erreur suppression photo:', error?.message || String(error));
                setMessageBox({ message: 'Erreur lors de la suppression', type: 'error' });
            } finally {
                setUploading(false);
            }
        }
    };

    const getDisplayPhoto = () => {
        if (currentPhoto?.url) {
            return currentPhoto.url;
        }
        return profilePhotoService.getDefaultAvatar(userProfile?.username || 'User');
    };

    return (
        <div style={{ position: 'relative', display: 'inline-block' }}>
            {/* Photo de profil */}
            <div
                onClick={() => setShowEditMenu(!showEditMenu)}
                style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    backgroundImage: `url(${getDisplayPhoto()})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    border: '4px solid rgba(255, 255, 255, 0.3)',
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease'
                }}
            >
                {/* Overlay au hover */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: showEditMenu ? 1 : 0,
                    transition: 'opacity 0.3s ease'
                }}>
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                        {uploading ? '⏳' : '📷'}
                    </span>
                </div>

                {/* Indicateur de loading */}
                {uploading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '50%'
                    }}>
                        <div style={{
                            width: '30px',
                            height: '30px',
                            border: '3px solid rgba(255, 255, 255, 0.3)',
                            borderTop: '3px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                        }}></div>
                    </div>
                )}
            </div>

            {/* Menu d'édition */}
            {showEditMenu && !uploading && (
                <div style={{
                    position: 'absolute',
                    top: '130px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    borderRadius: '8px',
                    padding: '10px',
                    zIndex: 1000,
                    minWidth: '160px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left',
                            marginBottom: '5px'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        📷 Changer la photo
                    </button>

                    {currentPhoto && (
                        <button
                            onClick={handleRemovePhoto}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                textAlign: 'left'
                            }}
                            onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                            🗑️ Supprimer
                        </button>
                    )}

                    <button
                        onClick={() => setShowEditMenu(false)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            color: '#9ca3af',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            textAlign: 'left',
                            marginTop: '5px'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                        ❌ Fermer
                    </button>
                </div>
            )}

            {/* Input file caché */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {/* CSS pour l'animation de loading */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default ProfilePhotoManager;
