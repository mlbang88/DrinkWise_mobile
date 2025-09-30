import React from 'react';

/**
 * Composant Modern Background avec logo watermark
 * Utilise une approche simple avec CSS inline pour éviter les problèmes de rendu
 */
const ModernBackground = ({ 
    children, 
    gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    showLogo = true,
    style = {},
    ...props 
}) => {
    return (
        <div 
            style={{
                minHeight: '100vh',
                background: gradient,
                backgroundAttachment: 'fixed',
                position: 'relative',
                ...style
            }}
            {...props}
        >
            {/* Logo watermark en arrière-plan */}
            {showLogo && (
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
            )}
            
            {/* Contenu au premier plan */}
            <div style={{ position: 'relative', zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
};

export default ModernBackground;