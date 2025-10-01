import React, { useState } from 'react';
import { GeminiService } from '../services/geminiService';
import { useFirebase } from '../contexts/FirebaseContext';
import { logger } from '../utils/logger.js';

const DrinkAnalyzer = ({ onDrinkDetected }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [messageBox, setMessageBox] = useState(null);
    const { functions } = useFirebase();
    
    // Service sécurisé avec Firebase Functions
    const geminiService = new GeminiService(functions);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            handleImageUpload(file);
        }
    };

    const handleImageUpload = async (file) => {
        if (!file || !file.type.startsWith('image/')) {
            setMessageBox({ 
                message: " Veuillez sélectionner une image valide", 
                type: "warning" 
            });
            return;
        }

        setIsAnalyzing(true);
        setMessageBox({ 
            message: " Analyse de la boisson en cours...", 
            type: "info" 
        });

        try {
            const drinkInfo = await geminiService.analyzeImage(file);
            const mappedDrinkInfo = geminiService.mapToAppDrinkType(drinkInfo);
            
            const displayMessage = mappedDrinkInfo.brand 
                ? ` Boisson détectée : ${mappedDrinkInfo.type} - ${mappedDrinkInfo.brand}`
                : ` Boisson détectée : ${mappedDrinkInfo.type}`;
            
            setMessageBox({ 
                message: displayMessage, 
                type: "success" 
            });
            
            onDrinkDetected(mappedDrinkInfo.type, mappedDrinkInfo.brand);
            
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

            {messageBox && (
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
        </div>
    );
};

export default DrinkAnalyzer;
