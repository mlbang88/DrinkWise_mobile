import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { useFirebase } from '../contexts/FirebaseContext';
import { logger } from '../utils/logger.js';

const DrinkAnalyzer = ({ onDrinkDetected }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [messageBox, setMessageBox] = useState(null);
    const [detectedDrink, setDetectedDrink] = useState(null);
    const [isConfirming, setIsConfirming] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedType, setEditedType] = useState('');
    const [editedBrand, setEditedBrand] = useState('');
    const { functions } = useFirebase();
    
    // Service sécurisé avec Firebase Functions
    const geminiService = new GeminiService(functions);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const convertImageToSupportedFormat = async (file) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                
                // Convertir en JPEG avec qualité optimisée
                canvas.toBlob((blob) => {
                    resolve(new File([blob], 'converted-image.jpg', { type: 'image/jpeg' }));
                }, 'image/jpeg', 0.8);
            };
            
            img.src = URL.createObjectURL(file);
        });
    };

    const handleImageUpload = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setMessageBox({ 
                message: " Veuillez sélectionner une image valide", 
                type: "warning" 
            });
            return;
        }

        // Convertir les formats non supportés (AVIF, HEIC, etc.) vers JPEG
        let processedFile = file;
        const unsupportedFormats = ['image/avif', 'image/heic', 'image/heif'];
        
        if (unsupportedFormats.includes(file.type.toLowerCase())) {
            setMessageBox({ 
                message: " Conversion du format d'image en cours...", 
                type: "info" 
            });
            
            try {
                processedFile = await convertImageToSupportedFormat(file);
            } catch (conversionError) {
                setMessageBox({ 
                    message: " Erreur lors de la conversion de l'image", 
                    type: "warning" 
                });
                return;
            }
        }

        setIsAnalyzing(true);
        setMessageBox({ 
            message: " Analyse de la boisson en cours...", 
            type: "info" 
        });

        try {
            const drinkInfo = await geminiService.analyzeImage(processedFile);
            const mappedDrinkInfo = geminiService.mapToAppDrinkType(drinkInfo);
            
            // Afficher l'écran de confirmation au lieu d'appliquer directement
            setDetectedDrink(mappedDrinkInfo);
            setEditedType(mappedDrinkInfo.type);
            setEditedBrand(mappedDrinkInfo.brand || '');
            setIsConfirming(true);
            setMessageBox({ 
                message: "✨ Boisson détectée ! Vérifiez et confirmez", 
                type: "success" 
            });
            
        } catch (error) {
            logger.error('Erreur analyse image', { error: error.message });
            
            let errorMessage = " Erreur lors de l'analyse";
            
            if (error.message.includes('Clé API')) {
                errorMessage = " Configuration requise : Ajoutez votre clé API Gemini dans .env";
            } else if (error.message.includes('invalide')) {
                errorMessage = " Clé API Gemini invalide - vérifiez votre configuration";
            }
            
            setMessageBox({ 
                message: errorMessage, 
                type: "error" 
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleConfirm = () => {
        onDrinkDetected(editMode ? editedType : detectedDrink.type, editMode ? editedBrand : detectedDrink.brand);
        setIsConfirming(false);
        setEditMode(false);
        setDetectedDrink(null);
        setMessageBox({ 
            message: "✅ Boisson ajoutée avec succès", 
            type: "success" 
        });
    };

    const handleEdit = () => {
        setEditMode(true);
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditedType(detectedDrink.type);
        setEditedBrand(detectedDrink.brand || '');
    };

    const handleCancel = () => {
        setIsConfirming(false);
        setEditMode(false);
        setDetectedDrink(null);
        setMessageBox(null);
    };

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            marginBottom: '20px'
        }}>
            <h3 style={{ color: 'white', marginBottom: '15px', textAlign: 'center' }}>
                 Analyse IA de boisson
            </h3>

            {!isConfirming ? (
                <>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                document.getElementById('camera-input').click();
                            }}
                            disabled={isAnalyzing}
                            style={{
                                flex: 1,
                                background: '#667eea',
                                color: '#ffffff',
                                padding: '12px',
                                borderRadius: '10px',
                                border: 'none',
                                textAlign: 'center',
                                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            📸 Appareil photo
                        </button>
                        <input
                            id="camera-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            disabled={isAnalyzing}
                        />

                        <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                document.getElementById('gallery-input').click();
                            }}
                            disabled={isAnalyzing}
                            style={{
                                flex: 1,
                                background: '#764ba2',
                                color: '#ffffff',
                                padding: '12px',
                                borderRadius: '10px',
                                border: 'none',
                                textAlign: 'center',
                                cursor: isAnalyzing ? 'not-allowed' : 'pointer',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            🖼️ Galerie
                        </button>
                        <input
                            id="gallery-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            disabled={isAnalyzing}
                        />
                    </div>

                    {isAnalyzing && (
                        <div style={{ textAlign: 'center', padding: '15px' }}>
                            <p style={{ color: 'white', margin: 0 }}> Analyse en cours...</p>
                        </div>
                    )}

                    {messageBox && !isConfirming && (
                        <div style={{
                            padding: '15px',
                            borderRadius: '10px',
                            marginBottom: '15px',
                            background: messageBox.type === 'success' ? 'rgba(34, 197, 94, 0.2)' :
                                       messageBox.type === 'error' ? 'rgba(239, 68, 68, 0.2)' :
                                       'rgba(59, 130, 246, 0.2)'
                        }}>
                            <p style={{ color: 'white', margin: 0 }}>
                                {messageBox.message}
                            </p>
                        </div>
                    )}
                </>
            ) : (
                <div style={{ 
                    background: 'rgba(102, 126, 234, 0.1)', 
                    borderRadius: '10px', 
                    padding: '20px',
                    border: '2px solid rgba(102, 126, 234, 0.3)'
                }}>
                    {!editMode ? (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <p style={{ color: '#a0aec0', fontSize: '14px', marginBottom: '10px' }}>
                                    ✨ J'ai détecté :
                                </p>
                                <p style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
                                    {detectedDrink.type}
                                </p>
                                {detectedDrink.brand && (
                                    <p style={{ color: '#cbd5e0', fontSize: '16px', margin: '5px 0' }}>
                                        {detectedDrink.brand}
                                    </p>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    style={{
                                        flex: 1,
                                        background: '#10b981',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✅ C'est correct
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEdit}
                                    style={{
                                        flex: 1,
                                        background: '#f59e0b',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✏️ Corriger
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleCancel}
                                style={{
                                    width: '100%',
                                    background: 'transparent',
                                    color: '#a0aec0',
                                    padding: '10px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(160, 174, 192, 0.3)',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    marginTop: '10px'
                                }}
                            >
                                ❌ Annuler
                            </button>
                        </>
                    ) : (
                        <>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ color: '#cbd5e0', fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                                    Type de boisson
                                </label>
                                <input
                                    type="text"
                                    value={editedType}
                                    onChange={(e) => setEditedType(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(160, 174, 192, 0.3)',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ color: '#cbd5e0', fontSize: '14px', display: 'block', marginBottom: '5px' }}>
                                    Marque (optionnel)
                                </label>
                                <input
                                    type="text"
                                    value={editedBrand}
                                    onChange={(e) => setEditedBrand(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(160, 174, 192, 0.3)',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    style={{
                                        flex: 1,
                                        background: '#10b981',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ✅ Valider
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    style={{
                                        flex: 1,
                                        background: '#6b7280',
                                        color: 'white',
                                        padding: '12px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    ↩️ Retour
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default DrinkAnalyzer;
