import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Image as ImageIcon } from 'lucide-react';
import { storyService } from '../../services/storyService';
import { useFirebase } from '../../contexts/FirebaseContext';
import { enhancedNotifications } from '../../utils/enhancedNotifications';

export default function StoryCreator({ onClose, onCreated }) {
    const { user } = useFirebase();
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            enhancedNotifications.showError(
                'Format non supporté',
                'Seules les images sont acceptées'
            );
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            enhancedNotifications.showError(
                'Fichier trop volumineux',
                'La taille maximale est de 10 MB'
            );
            return;
        }

        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!selectedFile) return;

        setIsUploading(true);
        try {
            await storyService.createStory(user.uid, selectedFile, 'image', '');
            enhancedNotifications.showSuccess('Story publiée !', 'Visible pendant 24h');
            onCreated?.();
            onClose();
        } catch (error) {
            enhancedNotifications.showError('Erreur', 'Impossible de publier la story');
        } finally {
            setIsUploading(false);
        }
    };

    const modalContent = (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '16px'
        }}
        onClick={onClose}
        >
            <div style={{
                background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '500px',
                width: '100%',
                border: '1px solid rgba(168, 85, 247, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>Créer une story</h2>
                    <button onClick={onClose} disabled={isUploading} style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer',
                        padding: '8px'
                    }}>
                        <X size={24} />
                    </button>
                </div>

                {preview ? (
                    <div style={{ marginBottom: '24px' }}>
                        <img src={preview} alt="Preview" style={{
                            width: '100%',
                            maxHeight: '400px',
                            objectFit: 'contain',
                            borderRadius: '8px'
                        }} />
                    </div>
                ) : (
                    <label style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '48px',
                        border: '2px dashed rgba(168, 85, 247, 0.5)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        marginBottom: '24px'
                    }}>
                        <ImageIcon size={48} color="#a855f7" />
                        <p style={{ color: 'white', marginTop: '16px', fontSize: '16px' }}>Choisir une image</p>
                        <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: 'none' }} />
                    </label>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={!selectedFile || isUploading}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '12px',
                        background: selectedFile ? 'linear-gradient(135deg, #06b6d4, #a855f7)' : '#475569',
                        color: 'white',
                        border: 'none',
                        cursor: selectedFile ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        opacity: selectedFile ? 1 : 0.5
                    }}
                >
                    {isUploading ? 'Publication...' : 'Publier'}
                </button>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
